"""Assisted assessments: template-driven documents drafted by a specialist agent, edited by the user, approved by a human."""
import hashlib

from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg.types.json import Jsonb
from pydantic import BaseModel

from .. import audit, db, kb, security
from ..agents import common, drafting
from ..llm import registry
from .workspaces import require_workspace

router = APIRouter(prefix="/api/workspaces/{wid}", tags=["assessments"], dependencies=[Depends(security.current_user)])
SELECT = "SELECT a.*, s.name AS system_name FROM assessments a JOIN ai_systems s ON s.id = a.system_id"


def _view(row: dict, with_sections: bool = True) -> dict:
    t = kb.template(row["type"]) or {"category": "", "legal_basis": []}
    out = {**row, "category": t["category"], "legal_basis": t["legal_basis"]}
    if not with_sections:
        out.pop("sections")
    return out


def _get(c, assessment_id: str, lock: bool = False) -> dict:
    try:
        row = c.execute(SELECT + " WHERE a.id = %s" + (" FOR UPDATE OF a" if lock else ""), (assessment_id,)).fetchone()
    except Exception:
        row = None
    if not row:
        raise HTTPException(404, "Assessment not found")
    return row


def content_hash(sections: list[dict]) -> str:
    """Hash of what a reviewer approves: section ids, titles and text, in order."""
    return hashlib.sha256(audit.canonical([{"id": s["id"], "title": s["title"], "content": s["content"]} for s in sections]).encode()).hexdigest()


class Create(BaseModel):
    system_id: str
    type: str


@router.get("/assessments")
def list_assessments(system_id: str | None = None, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        rows = c.execute(SELECT + (" WHERE a.system_id = %s" if system_id else "") + " ORDER BY a.updated_at DESC", (system_id,) if system_id else ()).fetchall()
    return [_view(r, with_sections=False) for r in rows]


@router.post("/assessments")
def create(body: Create, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    t = kb.template(body.type)
    if not t:
        raise HTTPException(422, f"type must be one of {', '.join(kb.ASSESSMENT_TYPES)}")
    with db.tx(wid) as c:
        try:
            system = c.execute("SELECT id, name FROM ai_systems WHERE id = %s", (body.system_id,)).fetchone()
        except Exception:
            system = None
        if not system:
            raise HTTPException(404, "System not found")
        if c.execute("SELECT 1 FROM assessments WHERE system_id = %s AND type = %s AND status <> 'rejected'", (body.system_id, body.type)).fetchone():
            raise HTTPException(409, "This system already has an assessment of this type")
        sections = [{**s, "content": "", "source": "empty", "evidence": [], "needs_input": [], "supported": True} for s in t["sections"]]
        row = c.execute("INSERT INTO assessments (workspace_id, system_id, type, title, sections, agent) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                        (wid, body.system_id, body.type, f"{t['title_en']} — {system['name']}", Jsonb(sections), t["agent"])).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.created", workspace_id=wid, entity_type="assessment", entity_id=row["id"],
                     summary=f"{t['title_en']} — {system['name']}", payload={"type": body.type, "system_id": body.system_id})
        return _view(_get(c, row["id"]))


@router.get("/assessments/{assessment_id}")
def get(assessment_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _view(_get(c, assessment_id))


@router.post("/assessments/{assessment_id}/draft")
def request_draft(assessment_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        a = _get(c, assessment_id, lock=True)
        if a["status"] not in ("draft", "rejected"):
            raise HTTPException(409, f"Cannot draft while the assessment is {a['status'].replace('_', ' ')}")
        if registry.resolve(kb.template(a["type"])["agent_role"]) is None:
            raise HTTPException(409, "No reasoning model is configured. Choose one in Settings.")
        c.execute("UPDATE assessments SET status = 'drafting', draft_error = NULL, updated_at = now() WHERE id = %s", (assessment_id,))
        c.execute("INSERT INTO jobs (workspace_id, kind, assessment_id, agent) VALUES (%s, 'assessment_draft', %s, %s)", (wid, assessment_id, a["agent"]))
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.draft_requested", workspace_id=wid, entity_type="assessment",
                     entity_id=assessment_id, summary=a["title"])
        return _view(_get(c, assessment_id))


class SectionIn(BaseModel):
    content: str


@router.put("/assessments/{assessment_id}/sections/{section_id}")
def edit_section(assessment_id: str, section_id: str, body: SectionIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        a = _get(c, assessment_id, lock=True)
        if a["status"] not in ("draft", "rejected"):
            raise HTTPException(409, f"The assessment is {a['status'].replace('_', ' ')} and cannot be edited" + (". Use Revise to start a new version." if a["status"] == "approved" else ""))
        sections = a["sections"]
        s = next((x for x in sections if x["id"] == section_id), None)
        if not s:
            raise HTTPException(404, "Section not found")
        before = s["content"]
        s["content"] = body.content
        s["source"] = "empty" if not body.content.strip() else ("ai_edited" if s["source"] in ("ai", "ai_edited") and before.strip() else "user")
        if s["source"] == "user":
            s["supported"] = True
        c.execute("UPDATE assessments SET sections = %s, status = 'draft', updated_at = now() WHERE id = %s", (Jsonb(sections), assessment_id))
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.section_edited", workspace_id=wid, entity_type="assessment",
                     entity_id=assessment_id, summary=f"{a['title']}: section {s['number']} {s['title']}",
                     payload={"section_id": section_id, "source": s["source"], "sha256_before": hashlib.sha256(before.encode()).hexdigest(),
                              "sha256_after": hashlib.sha256(body.content.encode()).hexdigest()})
        return _view(_get(c, assessment_id))


@router.post("/assessments/{assessment_id}/submit")
def submit(assessment_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        a = _get(c, assessment_id, lock=True)
        if a["status"] != "draft":
            raise HTTPException(409, f"Only a draft can be submitted (the assessment is {a['status'].replace('_', ' ')})")
        sections = a["sections"]
        empty = sum(1 for s in sections if not s["content"].strip())
        unsupported = sum(1 for s in sections if s["content"].strip() and not s.get("supported", True))
        sources = {(e["document_id"], e["filename"]) for s in sections for e in s.get("evidence", [])}
        approval = c.execute("""INSERT INTO approvals (workspace_id, kind, title, summary, agent, model, payload, sources)
                                VALUES (%s, 'assessment_document', %s, %s, %s, %s, %s, %s) RETURNING id""",
                             (wid, a["title"], f"Version {a['version']}: {len(sections) - empty} of {len(sections)} sections written" +
                              (f", {unsupported} without a verified source" if unsupported else ""), a["agent"], a["model"],
                              Jsonb({"assessment_id": assessment_id, "system_id": str(a["system_id"]), "type": a["type"], "title": a["title"], "version": a["version"],
                                     "sections_total": len(sections), "sections_empty": empty, "sections_unsupported": unsupported,
                                     "content_hash": content_hash(sections)}),
                              Jsonb([{"document_id": d, "filename": f} for d, f in sorted(sources)]))).fetchone()
        c.execute("UPDATE assessments SET status = 'in_review', pending_approval_id = %s, updated_at = now() WHERE id = %s", (approval["id"], assessment_id))
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.submitted", workspace_id=wid, entity_type="assessment", entity_id=assessment_id,
                     summary=a["title"], payload={"version": a["version"], "content_hash": content_hash(sections), "sections_empty": empty, "sections_unsupported": unsupported})
        return _view(_get(c, assessment_id))


@router.post("/assessments/{assessment_id}/revise")
def revise(assessment_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        a = _get(c, assessment_id, lock=True)
        if a["status"] != "approved":
            raise HTTPException(409, "Only an approved assessment can be revised")
        c.execute("UPDATE assessments SET status = 'draft', version = version + 1, content_hash = NULL, approved_by = NULL, approved_at = NULL, updated_at = now() WHERE id = %s",
                  (assessment_id,))
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.revision_started", workspace_id=wid, entity_type="assessment", entity_id=assessment_id,
                     summary=f"{a['title']}: version {a['version'] + 1}", payload={"previous_version": a["version"], "previous_content_hash": a["content_hash"]})
        return _view(_get(c, assessment_id))


@router.delete("/assessments/{assessment_id}", status_code=204)
def delete(assessment_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        a = _get(c, assessment_id, lock=True)
        if a["status"] == "approved":
            raise HTTPException(409, "An approved assessment cannot be deleted. Revise it instead.")
        c.execute("DELETE FROM approvals WHERE payload->>'assessment_id' = %s AND status = 'pending'", (assessment_id,))
        c.execute("DELETE FROM assessments WHERE id = %s", (assessment_id,))
        audit.record(c, actor=user["email"], actor_type="user", action="assessment.deleted", workspace_id=wid, entity_type="assessment", entity_id=assessment_id, summary=a["title"])
    return Response(status_code=204)


def run_draft(wid: str, assessment_id: str) -> None:
    """Executed by the worker."""
    with db.tx(wid) as c:
        a = c.execute("SELECT * FROM assessments WHERE id = %s", (assessment_id,)).fetchone()
        if not a or a["status"] != "drafting":
            return
        system = common.jsonable(c.execute("SELECT * FROM ai_systems WHERE id = %s", (a["system_id"],)).fetchone())
        run = c.execute("SELECT result, summary FROM runs WHERE system_id = %s AND status = 'completed' ORDER BY created_at DESC LIMIT 1", (a["system_id"],)).fetchone()
        gaps = c.execute("""SELECT requirement_ref, status FROM findings WHERE system_id = %s AND review_status = 'approved' AND status IN ('gap', 'partial')
                            ORDER BY created_at DESC LIMIT 30""", (a["system_id"],)).fetchall()
    template = kb.template(a["type"])
    try:
        passages, how = common.collect_passages(wid, system)
        todo = [s["id"] for s in a["sections"] if s["source"] in ("empty", "ai")]  # sections edited by the user are never overwritten
        context = {"risk_class": system.get("risk_class") if system.get("risk_class_status") == "approved" else None,
                   "assessment_results": (run or {}).get("result") or {}, "approved_gaps": [dict(g) for g in gaps]}
        drafts, label, _ = drafting.draft(template, system, passages, context, todo) if todo else ({}, a["model"], None)
        sections = a["sections"]
        for s in sections:
            if s["id"] in drafts:
                s.update(drafts[s["id"]])
        with db.tx(wid) as c:
            c.execute("UPDATE assessments SET sections = %s, status = 'draft', model = %s, updated_at = now() WHERE id = %s", (Jsonb(sections), label, assessment_id))
            written = sum(1 for d in drafts.values() if d["content"])
            audit.record(c, actor=template["agent"], actor_type="agent", action="assessment.drafted", workspace_id=wid, entity_type="assessment", entity_id=assessment_id,
                         model=label, summary=f"{a['title']}: {written} of {len(todo)} sections drafted",
                         payload={"sections_requested": todo, "sections_written": written, "unsupported": [k for k, d in drafts.items() if not d["supported"]],
                                  "retrieval": how, "content_hash": content_hash(sections)},
                         sources=[{"document_id": d, "filename": f} for d, f in sorted({(p["document_id"], p["filename"]) for p in passages})])
    except Exception as e:
        with db.tx(wid) as c:
            c.execute("UPDATE assessments SET status = 'draft', draft_error = %s, updated_at = now() WHERE id = %s", (str(e)[:500], assessment_id))
            audit.record(c, actor=template["agent"], actor_type="agent", action="assessment.draft_failed", workspace_id=wid, entity_type="assessment",
                         entity_id=assessment_id, summary=str(e)[:300])
        raise
