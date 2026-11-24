from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from psycopg.errors import UniqueViolation

from .. import audit, db, security

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"], dependencies=[Depends(security.current_user)])


class WorkspaceIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None


def require_workspace(wid: str) -> str:
    try:
        with db.tx() as c:
            row = c.execute("SELECT id FROM workspaces WHERE id = %s", (wid,)).fetchone()
    except Exception:
        row = None
    if not row:
        raise HTTPException(404, "Workspace not found")
    return str(row["id"])


def _count(wid) -> int:
    with db.tx(str(wid)) as c:
        return c.execute("SELECT count(*) AS n FROM documents").fetchone()["n"]


@router.get("")
def list_workspaces():
    with db.tx() as c:
        rows = c.execute("SELECT id, name, description, created_at FROM workspaces ORDER BY created_at").fetchall()
    return [{**r, "document_count": _count(r["id"])} for r in rows]


@router.post("")
def create_workspace(body: WorkspaceIn, user: dict = Depends(security.current_user)):
    try:
        with db.tx() as c:
            row = c.execute("INSERT INTO workspaces (name, description) VALUES (%s, %s) RETURNING id, name, description, created_at",
                            (body.name.strip(), body.description)).fetchone()
            audit.record(c, actor=user["email"], actor_type="user", action="workspace.created", workspace_id=row["id"],
                         entity_type="workspace", entity_id=row["id"], summary=row["name"])
    except UniqueViolation:
        raise HTTPException(409, "A workspace with this name already exists")
    return {**row, "document_count": 0}


@router.delete("/{wid}", status_code=204)
def delete_workspace(wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if _count(wid):
        raise HTTPException(409, "Delete the workspace's documents first")
    with db.tx() as c:
        if c.execute("SELECT count(*) AS n FROM workspaces").fetchone()["n"] <= 1:
            raise HTTPException(409, "At least one workspace is required")
        name = c.execute("DELETE FROM workspaces WHERE id = %s RETURNING name", (wid,)).fetchone()["name"]
        audit.record(c, actor=user["email"], actor_type="user", action="workspace.deleted", entity_type="workspace", entity_id=wid, summary=name)
    return Response(status_code=204)
