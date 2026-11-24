import hashlib
import mimetypes
import os

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .. import audit, config, db, kb, security
from ..ingestion import parsers, pipeline
from ..llm import registry
from ..llm.base import LLMError
from .workspaces import require_workspace

router = APIRouter(prefix="/api/workspaces/{wid}", tags=["evidence"], dependencies=[Depends(security.current_user)])

DOC_COLS = "id, filename, mime, size, sha256, doc_type, doc_type_source, status, progress, stage_detail, error, pages, chunk_count, embedding_model, created_at"


def _with_tags(c, docs: list[dict]) -> list[dict]:
    if not docs:
        return docs
    tags = c.execute("SELECT * FROM evidence_tags WHERE document_id = ANY(%s) ORDER BY confidence DESC", ([d["id"] for d in docs],)).fetchall()
    names = kb.cco_index()
    by_doc: dict = {}
    for t in tags:
        by_doc.setdefault(t["document_id"], []).append({
            "id": t["id"], "cco_id": t["cco_id"], "cco_name": names.get(t["cco_id"], {}).get("name_en", t["cco_id"]),
            "confidence": t["confidence"], "status": t["status"], "rationale": t["rationale"], "model": t["model"],
            "citation": {"page": t["page"], "section": t["section"], "quote": t["quote"], "quote_verified": t["quote_verified"]}})
    return [{**d, "tags": by_doc.get(d["id"], [])} for d in docs]


def _get(c, doc_id: str) -> dict:
    try:
        doc = c.execute(f"SELECT {DOC_COLS} FROM documents WHERE id = %s", (doc_id,)).fetchone()
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(404, "Document not found")
    return doc


@router.post("/documents")
async def upload(files: list[UploadFile] = File(...), wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    created = []
    for f in files:
        name = os.path.basename(f.filename or "upload")
        ext = os.path.splitext(name)[1].lower()
        if ext not in parsers.ACCEPTED:
            raise HTTPException(415, f"{name}: unsupported file type. Accepted: {', '.join(sorted(parsers.ACCEPTED))}")
        data = await f.read()
        if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(413, f"{name}: larger than {config.MAX_UPLOAD_MB} MB")
        if not data:
            raise HTTPException(400, f"{name}: the file is empty")
        digest = hashlib.sha256(data).hexdigest()
        with db.tx(wid) as c:
            existing = c.execute("SELECT id FROM documents WHERE sha256 = %s", (digest,)).fetchone()
            if existing:
                return JSONResponse(status_code=409, content={"detail": f"{name}: this exact file is already in the workspace", "existing_id": str(existing["id"])})
            folder = os.path.join(config.UPLOAD_DIR, wid)
            os.makedirs(folder, exist_ok=True)
            path = os.path.join(folder, digest + ext)  # stored under its hash: the user-supplied name never touches the filesystem
            with open(path, "wb") as out:
                out.write(data)
            doc = c.execute(f"INSERT INTO documents (workspace_id, filename, mime, size, sha256, storage_path) VALUES (%s, %s, %s, %s, %s, %s) RETURNING {DOC_COLS}",
                            (wid, name, f.content_type or mimetypes.guess_type(name)[0], len(data), digest, path)).fetchone()
            c.execute("INSERT INTO jobs (workspace_id, kind, document_id, agent) VALUES (%s, 'ingest', %s, %s)", (wid, doc["id"], pipeline.AGENT))
            audit.record(c, actor=user["email"], actor_type="user", action="document.uploaded", workspace_id=wid, entity_type="document",
                         entity_id=doc["id"], summary=name, payload={"filename": name, "size": len(data), "sha256": digest})
            created.append({**doc, "tags": []})
    return created


@router.get("/documents")
def list_documents(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _with_tags(c, c.execute(f"SELECT {DOC_COLS} FROM documents ORDER BY created_at DESC").fetchall())


@router.get("/documents/{doc_id}")
def get_document(doc_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _with_tags(c, [_get(c, doc_id)])[0]


class DocPatch(BaseModel):
    doc_type: str


@router.patch("/documents/{doc_id}")
def patch_document(doc_id: str, body: DocPatch, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if body.doc_type not in pipeline.DOC_TYPES:
        raise HTTPException(422, f"doc_type must be one of {', '.join(pipeline.DOC_TYPES)}")
    with db.tx(wid) as c:
        before = _get(c, doc_id)
        c.execute("UPDATE documents SET doc_type = %s, doc_type_source = 'user' WHERE id = %s", (body.doc_type, doc_id))
        audit.record(c, actor=user["email"], actor_type="user", action="document.type_changed", workspace_id=wid, entity_type="document",
                     entity_id=doc_id, summary=f"{before['filename']}: {before['doc_type']} → {body.doc_type}",
                     payload={"from": before["doc_type"], "to": body.doc_type})
        return _with_tags(c, [_get(c, doc_id)])[0]


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(doc_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        doc = _get(c, doc_id)
        path = c.execute("DELETE FROM documents WHERE id = %s RETURNING storage_path", (doc_id,)).fetchone()["storage_path"]
        c.execute("DELETE FROM approvals WHERE payload->>'document_id' = %s", (doc_id,))
        audit.record(c, actor=user["email"], actor_type="user", action="document.deleted", workspace_id=wid, entity_type="document",
                     entity_id=doc_id, summary=doc["filename"], payload={"filename": doc["filename"], "sha256": doc["sha256"]})
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    return Response(status_code=204)


def _queue(c, wid: str, doc_id, kind: str) -> None:
    c.execute("UPDATE documents SET status = 'queued', progress = 0, error = NULL, stage_detail = NULL WHERE id = %s", (doc_id,))
    c.execute("INSERT INTO jobs (workspace_id, kind, document_id, agent) VALUES (%s, %s, %s, %s)", (wid, kind, doc_id, pipeline.AGENT))


@router.post("/documents/{doc_id}/reprocess")
def reprocess(doc_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        doc = _get(c, doc_id)
        _queue(c, wid, doc_id, "ingest")
        audit.record(c, actor=user["email"], actor_type="user", action="document.reprocess_requested", workspace_id=wid,
                     entity_type="document", entity_id=doc_id, summary=doc["filename"])
        return _with_tags(c, [_get(c, doc_id)])[0]


@router.post("/reindex")
def reindex(wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        ids = [r["id"] for r in c.execute("SELECT id FROM documents WHERE status IN ('ready', 'failed') AND chunk_count > 0").fetchall()]
        for i in ids:
            _queue(c, wid, i, "reindex")
        audit.record(c, actor=user["email"], actor_type="user", action="workspace.reindex_requested", workspace_id=wid,
                     entity_type="workspace", entity_id=wid, summary=f"{len(ids)} documents queued", payload={"documents": len(ids)})
    return {"queued": len(ids)}


@router.get("/documents/{doc_id}/chunks")
def chunks(doc_id: str, page: int | None = None, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        _get(c, doc_id)
        sql = "SELECT id, ordinal, page, section, text FROM chunks WHERE document_id = %s"
        args: list = [doc_id]
        if page is not None:
            sql += " AND page = %s"
            args.append(page)
        return c.execute(sql + " ORDER BY ordinal LIMIT 500", args).fetchall()


class SearchIn(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = Field(default=8, ge=1, le=50)


@router.post("/search")
def search(body: SearchIn, wid: str = Depends(require_workspace)):
    try:
        emb = registry.resolve("embedding")
        if emb is None:
            raise HTTPException(409, "No embedding model is configured. Choose one in Settings.")
        provider, model, label = emb
        vector = str(provider.embed(model, [body.query])[0])
    except LLMError as e:
        raise HTTPException(502, str(e))
    with db.tx(wid) as c:
        rows = c.execute("""SELECT ch.id AS chunk_id, ch.document_id, d.filename, ch.page, ch.section, ch.text,
                                   1 - (ch.embedding <=> %s::vector) AS score
                            FROM chunks ch JOIN documents d ON d.id = ch.document_id
                            WHERE ch.embedding_model = %s
                            ORDER BY ch.embedding <=> %s::vector LIMIT %s""", (vector, label, vector, body.top_k)).fetchall()
    return {"embedding_model": label, "results": rows}


@router.get("/approvals")
def approvals(status: str | None = "pending", wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        if status:
            return c.execute("SELECT * FROM approvals WHERE status = %s ORDER BY created_at DESC", (status,)).fetchall()
        return c.execute("SELECT * FROM approvals ORDER BY created_at DESC LIMIT 500").fetchall()


class Decision(BaseModel):
    decision: str
    comment: str | None = None


@router.post("/approvals/{approval_id}/decide")
def decide(approval_id: str, body: Decision, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if body.decision not in ("approve", "reject"):
        raise HTTPException(422, "decision must be 'approve' or 'reject'")
    status = "approved" if body.decision == "approve" else "rejected"
    with db.tx(wid) as c:
        try:
            a = c.execute("SELECT * FROM approvals WHERE id = %s FOR UPDATE", (approval_id,)).fetchone()
        except Exception:
            a = None
        if not a:
            raise HTTPException(404, "Approval not found")
        if a["status"] != "pending":
            raise HTTPException(409, f"Already {a['status']}")
        a = c.execute("UPDATE approvals SET status = %s, decided_by = %s, decided_at = now(), comment = %s WHERE id = %s RETURNING *",
                      (status, user["email"], body.comment, approval_id)).fetchone()
        if a["kind"] == "evidence_tag" and a["payload"].get("tag_id"):
            c.execute("UPDATE evidence_tags SET status = %s WHERE id = %s", (status, a["payload"]["tag_id"]))
        audit.record(c, actor=user["email"], actor_type="user", action=f"approval.{status}", workspace_id=wid, entity_type="approval",
                     entity_id=approval_id, summary=a["title"], model=a["model"], sources=a["sources"],
                     payload={"kind": a["kind"], "decision": status, "comment": body.comment, "proposed_by": a["agent"],
                              "confidence": a["confidence"], **{k: a["payload"].get(k) for k in ("cco_id", "document_id", "tag_id", "requirements")}})
    return a


@router.get("/jobs")
def jobs(active: bool = False, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        sql = """SELECT j.id, j.kind, j.document_id, d.filename, j.status, COALESCE(d.status, j.stage) AS stage,
                        CASE WHEN j.status = 'done' THEN 100 ELSE COALESCE(d.progress, j.progress) END AS progress,
                        j.agent, d.embedding_model AS model, j.started_at, j.finished_at, j.error
                 FROM jobs j LEFT JOIN documents d ON d.id = j.document_id WHERE j.workspace_id = %s"""
        if active:
            sql += " AND j.status IN ('queued', 'running')"
        return c.execute(sql + " ORDER BY j.created_at DESC LIMIT 100", (wid,)).fetchall()
