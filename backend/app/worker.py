"""Background worker: takes queued jobs from PostgreSQL (FOR UPDATE SKIP LOCKED) and runs them."""
import logging
import time

from . import config, db
from .ingestion import parsers, pipeline
from .llm.base import LLMError

log = logging.getLogger("worker")
MAX_ATTEMPTS = 3


def claim() -> dict | None:
    with db.tx() as c:
        return c.execute("""UPDATE jobs SET status = 'running', started_at = now(), attempts = attempts + 1
                            WHERE id = (SELECT id FROM jobs WHERE status = 'queued' ORDER BY created_at
                                        FOR UPDATE SKIP LOCKED LIMIT 1)
                            RETURNING *""").fetchone()


def finish(job_id, status: str, error: str | None = None) -> None:
    with db.tx() as c:
        c.execute("UPDATE jobs SET status = %s, error = %s, finished_at = CASE WHEN %s = 'queued' THEN NULL ELSE now() END, progress = CASE WHEN %s = 'done' THEN 100 ELSE progress END WHERE id = %s",
                  (status, error, status, status, job_id))


def run(job: dict) -> None:
    wid, doc_id = str(job["workspace_id"]), str(job["document_id"])
    try:
        pipeline.process_document(wid, doc_id, str(job["id"]), embed_only=job["kind"] == "reindex")
        finish(job["id"], "done")
    except parsers.ParseError as e:
        pipeline.fail(wid, doc_id, str(e))
        finish(job["id"], "failed", str(e))
    except LLMError as e:
        if e.retryable and job["attempts"] < MAX_ATTEMPTS:
            log.warning("job %s will retry: %s", job["id"], e)
            time.sleep(5 * job["attempts"])
            finish(job["id"], "queued", str(e))
        else:
            pipeline.fail(wid, doc_id, f"AI provider error: {e}")
            finish(job["id"], "failed", str(e))
    except Exception as e:  # keep the worker alive; the failure is recorded on the document and in the audit trail
        log.exception("job %s failed", job["id"])
        pipeline.fail(wid, doc_id, f"Unexpected error: {type(e).__name__}: {e}")
        finish(job["id"], "failed", str(e))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    config.require_secrets()
    db.migrate()
    with db.tx() as c:  # jobs interrupted by a restart go back to the queue
        c.execute("UPDATE jobs SET status = 'queued' WHERE status = 'running'")
    log.info("worker ready")
    while True:
        job = claim()
        if job:
            run(job)
        else:
            time.sleep(1)


if __name__ == "__main__":
    main()
