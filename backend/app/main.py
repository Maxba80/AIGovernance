"""AI Governance Tool — API entry point."""
import contextlib
import logging

from fastapi import Depends, FastAPI

from . import audit, config, db, kb, security
from .routers import auth, documents, settings, workspaces

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


@app.get("/api/health")
def health():
    with db.tx() as c:
        c.execute("SELECT 1")
    return {"status": "ok", "database": True, "version": config.VERSION}


@app.get("/api/kb/summary", dependencies=[Depends(security.current_user)])
def kb_summary():
    return kb.summary()


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
