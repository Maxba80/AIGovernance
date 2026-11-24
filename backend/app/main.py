"""AI Governance Tool — API entry point."""
import contextlib
import logging

from fastapi import Depends, FastAPI, HTTPException

from . import audit, config, db, kb, security
from .routers import assessments, auth, documents, frameworks, settings, systems, workspaces

log = logging.getLogger("api")


def seed() -> None:
    """First start: create the single user and a default workspace."""
    with db.tx() as c:
        if c.execute("SELECT count(*) AS n FROM users").fetchone()["n"] == 0:
            user = c.execute("INSERT INTO users (email, name, password_hash) VALUES (%s, %s, %s) RETURNING id",
                             (config.ADMIN_EMAIL, config.ADMIN_NAME, security.hash_password(config.ADMIN_PASSWORD))).fetchone()
            audit.record(c, actor="system", actor_type="system", action="system.initialised", entity_type="user", entity_id=user["id"],
                         summary="Database initialised, owner account created", payload={"version": config.VERSION})
        if c.execute("SELECT count(*) AS n FROM workspaces").fetchone()["n"] == 0:
            ws = c.execute("INSERT INTO workspaces (name, description) VALUES ('Default', 'First workspace') RETURNING id").fetchone()
            audit.record(c, actor="system", actor_type="system", action="workspace.created", workspace_id=ws["id"],
                         entity_type="workspace", entity_id=ws["id"], summary="Default")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
    config.require_secrets()
    applied = db.migrate()
    if applied:
        log.info("applied migrations: %s", applied)
    seed()
    kb.summary()  # fail fast if the knowledge base is not mounted
    yield


app = FastAPI(title="AI Governance Tool", version=config.VERSION, lifespan=lifespan)
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(documents.router)
app.include_router(settings.router)
app.include_router(systems.router)
app.include_router(frameworks.router)
app.include_router(assessments.router)


@app.get("/api/health")
def health():
    with db.tx() as c:
        c.execute("SELECT 1")
    return {"status": "ok", "database": True, "version": config.VERSION}


@app.get("/api/kb/summary", dependencies=[Depends(security.current_user)])
def kb_summary():
    return kb.summary()


@app.get("/api/kb/requirements", dependencies=[Depends(security.current_user)])
def kb_requirements(framework: str | None = None):
    return [r for r in kb.requirements().values() if not framework or r["framework"] == framework]


@app.get("/api/kb/requirements/{ref}", dependencies=[Depends(security.current_user)])
def kb_requirement(ref: str):
    detail = kb.requirement_detail(ref)
    if not detail:
        raise HTTPException(404, "Unknown requirement")
    return detail


@app.get("/api/kb/eu-ai-act/overview", dependencies=[Depends(security.current_user)])
def kb_ai_act_overview():
    return kb.ai_act_overview()


@app.get("/api/kb/assessment-types", dependencies=[Depends(security.current_user)])
def kb_assessment_types():
    return kb.assessment_types()


@app.get("/api/audit/export", dependencies=[Depends(security.current_user)])
def audit_export():
    """The whole audit trail as newline-delimited JSON, with the verification result as the last line."""
    import json
    from fastapi.responses import Response
    with db.tx() as c:
        rows = c.execute("SELECT * FROM audit_log ORDER BY seq").fetchall()
        check = audit.verify(c)
    lines = []
    for r in rows:
        r["workspace_id"] = str(r["workspace_id"]) if r["workspace_id"] else None
        r["payload"], r["sources"] = json.loads(r["payload"]), json.loads(r["sources"])
        lines.append(json.dumps(r, ensure_ascii=False))
    lines.append(json.dumps({"verify": {k: check[k] for k in ("ok", "checked", "head_hash")}}))
    return Response("\n".join(lines) + "\n", media_type="application/x-ndjson",
                    headers={"Content-Disposition": 'attachment; filename="audit-trail.ndjson"'})


@app.get("/api/kb/agentic-risks", dependencies=[Depends(security.current_user)])
def kb_agentic_risks():
    return kb.agentic_risks()


@app.get("/api/audit", dependencies=[Depends(security.current_user)])
def audit_list(workspace_id: str | None = None, limit: int = 100, before_seq: int | None = None):
    import json
    where, args = [], []
    if workspace_id:
        where.append("workspace_id = %s")
        args.append(workspace_id)
    count_sql = "SELECT count(*) AS n FROM audit_log" + (" WHERE " + " AND ".join(where) if where else "")
    with db.tx() as c:
        total = c.execute(count_sql, args).fetchone()["n"]
        if before_seq:
            where.append("seq < %s")
            args.append(before_seq)
        rows = c.execute("SELECT * FROM audit_log" + (" WHERE " + " AND ".join(where) if where else "") + " ORDER BY seq DESC LIMIT %s",
                         [*args, max(1, min(limit, 500))]).fetchall()
    for r in rows:
        r["payload"], r["sources"] = json.loads(r["payload"]), json.loads(r["sources"])
    return {"entries": rows, "total": total}


@app.get("/api/audit/verify", dependencies=[Depends(security.current_user)])
def audit_verify():
    with db.tx() as c:
        return audit.verify(c)
