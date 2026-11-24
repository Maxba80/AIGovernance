"""Framework modules: requirement status, EU AI Act obligations, ISO SoA and nonconformities, NIST scorecard, compliance graph."""
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field

from .. import audit, db, kb, security, status
from ..agents.specialists import _obligation_refs
from .workspaces import require_workspace

router = APIRouter(prefix="/api/workspaces/{wid}", tags=["frameworks"], dependencies=[Depends(security.current_user)])
NAMES = {"eu-ai-act": "EU AI Act", "gdpr": "GDPR", "iso-42001": "ISO/IEC 42001", "nist-ai-rmf": "NIST AI RMF"}


def _refs(fid: str) -> list[str]:
    if fid == "gdpr":
        return [a["id"] for a in kb.gdpr_index()]
    return [r for r, v in kb.requirements().items() if v["framework"] == fid]


@router.get("/frameworks/{fid}")
def framework(fid: str, wid: str = Depends(require_workspace)):
    if fid not in NAMES:
        raise HTTPException(404, "Unknown framework")
    with db.tx(wid) as c:
        data = status.load(c)
    by_ref: dict = {}
    for f in data["findings"]:
        by_ref.setdefault(f["requirement_ref"], []).append({"system_id": f["system_id"], "system_name": f["system_name"], "status": f["status"],
                                                           "review_status": f["review_status"], "origin": f["origin"]})
    reqs = kb.requirements()
    rows, groups = [], []
    for ref in _refs(fid):
        group = kb.group_of(ref)
        if group not in groups:
            groups.append(group)
        rows.append({"ref": ref, "title": reqs[ref]["title"], "group": group, "status": status.of(data, ref),
                     "objectives": [o["id"] for o in kb.objectives_of().get(ref, [])], "evidence_documents": len(status.documents_for(data, ref)),
                     "findings": by_ref.get(ref, [])})
    return {"id": fid, "name": NAMES[fid], "counts": status.counts(r["status"] for r in rows), "groups": groups, "requirements": rows}


@router.get("/systems/{system_id}/obligations")
def obligations(system_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        try:
            system = c.execute("SELECT * FROM ai_systems WHERE id = %s", (system_id,)).fetchone()
        except Exception:
            system = None
        if not system:
            raise HTTPException(404, "System not found")
        if system["risk_class_status"] != "approved":
            raise HTTPException(409, "This system has no approved risk class yet. Classify it first.")
        found = c.execute("""SELECT DISTINCT ON (requirement_ref) id, requirement_ref, status, review_status FROM findings
                             WHERE system_id = %s AND review_status <> 'rejected' ORDER BY requirement_ref, created_at DESC""", (system_id,)).fetchall()
    by = {f["requirement_ref"]: f for f in found}
    refs = _obligation_refs(system["risk_class"], system["org_role"])
    reqs = kb.requirements()
    note = {"high-risk-annex-i": "High-risk system", "high-risk-annex-iii": "High-risk system"}.get(system["risk_class"], system["risk_class"].replace("-", " ").capitalize())
    role = system["org_role"]
    return {"risk_class": system["risk_class"], "org_role": role,
            "basis_note": f"{note}; obligations for role '{role}'" + (" (role unknown: provider and deployer obligations are both listed)" if role == "unknown" and system["risk_class"].startswith("high-risk") else ""),
            "obligations": [{"ref": r, "title": reqs[r]["title"], "status": by[r]["status"] if r in by else "not_assessed",
                             "review_status": by[r]["review_status"] if r in by else None, "finding_id": by[r]["id"] if r in by else None} for r in refs if r in reqs]}


# ------------------------------------------------------------------ ISO: Statement of Applicability
class SoaIn(BaseModel):
    applicable: bool = True
    justification: str | None = None
    implementation_status: str = Field(default="not_started", pattern="^(not_started|in_progress|implemented)$")
    owner: str | None = None
    notes: str | None = None


def _soa(c) -> list[dict]:
    data = status.load(c)
    stored = {r["control_ref"]: r for r in c.execute("SELECT * FROM soa_entries").fetchall()}
    rows = []
    for ctl in kb.iso_requirements()["annex_a_controls"]:
        s = stored.get(ctl["id"], {})
        rows.append({"control_ref": ctl["id"], "control_id": ctl["control_id"], "title": ctl["title"], "objective": ctl["objective"],
                     "objective_title": ctl["objective_title"], "applicable": s.get("applicable", True), "justification": s.get("justification"),
                     "implementation_status": s.get("implementation_status", "not_started"), "owner": s.get("owner"), "notes": s.get("notes"),
                     "status": status.of(data, ctl["id"]),
                     "evidence_documents": [{"id": k, "filename": v} for k, v in status.documents_for(data, ctl["id"]).items()],
                     "updated_at": s.get("updated_at"), "updated_by": s.get("updated_by")})
    return rows


@router.get("/iso/soa")
def soa(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _soa(c)


@router.put("/iso/soa/{control_ref}")
def soa_update(control_ref: str, body: SoaIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if control_ref not in {c["id"] for c in kb.iso_requirements()["annex_a_controls"]}:
        raise HTTPException(404, "Unknown control")
    if not body.applicable and not (body.justification or "").strip():
        raise HTTPException(422, "A justification is required to exclude a control")
    with db.tx(wid) as c:
        c.execute("""INSERT INTO soa_entries (workspace_id, control_ref, applicable, justification, implementation_status, owner, notes, updated_by)
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                     ON CONFLICT (workspace_id, control_ref) DO UPDATE SET applicable = EXCLUDED.applicable, justification = EXCLUDED.justification,
                       implementation_status = EXCLUDED.implementation_status, owner = EXCLUDED.owner, notes = EXCLUDED.notes,
                       updated_by = EXCLUDED.updated_by, updated_at = now()""",
                  (wid, control_ref, body.applicable, body.justification, body.implementation_status, body.owner, body.notes, user["email"]))
        audit.record(c, actor=user["email"], actor_type="user", action="soa.updated", workspace_id=wid, entity_type="soa", entity_id=control_ref,
                     summary=f"{control_ref}: {'applicable' if body.applicable else 'excluded'}, {body.implementation_status}", payload=body.model_dump())
        return next(r for r in _soa(c) if r["control_ref"] == control_ref)


# ------------------------------------------------------------------ nonconformities and CAPA
class NcIn(BaseModel):
    requirement_ref: str | None = None
    title: str | None = None
    grade: str | None = Field(default=None, pattern="^(major|minor|observation|opportunity)$")
    description: str | None = None
    root_cause: str | None = None
    correction: str | None = None
    corrective_action: str | None = None
    owner: str | None = None
    due_date: dt.date | None = None
    system_id: str | None = None
    finding_id: str | None = None
    status: str | None = Field(default=None, pattern="^(open|in_progress|implemented|verified|closed)$")


NC_SELECT = "SELECT n.*, s.name AS system_name FROM nonconformities n LEFT JOIN ai_systems s ON s.id = n.system_id"


def _nc(rows: list[dict]) -> list[dict]:
    reqs = kb.requirements()
    for r in rows:
        r["requirement_title"] = reqs.get(r["requirement_ref"], {}).get("title", r["requirement_ref"])
    return rows


@router.get("/nonconformities")
def nc_list(status_: str | None = Query(None, alias="status"), wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        if status_:
            return _nc(c.execute(NC_SELECT + " WHERE n.status = %s ORDER BY n.created_at DESC", (status_,)).fetchall())
        return _nc(c.execute(NC_SELECT + " ORDER BY n.created_at DESC").fetchall())


@router.post("/nonconformities")
def nc_create(body: NcIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if not body.requirement_ref or body.requirement_ref not in kb.requirements():
        raise HTTPException(422, "requirement_ref must be a requirement from the knowledge base")
    if not body.title or not body.grade:
        raise HTTPException(422, "title and grade are required")
    with db.tx(wid) as c:
        row = c.execute("""INSERT INTO nonconformities (workspace_id, requirement_ref, system_id, finding_id, grade, title, description, owner, due_date)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                        (wid, body.requirement_ref, body.system_id, body.finding_id, body.grade, body.title, body.description, body.owner, body.due_date)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="nonconformity.raised", workspace_id=wid, entity_type="nonconformity", entity_id=row["id"],
                     summary=f"{body.grade}: {body.title} ({body.requirement_ref})", payload=body.model_dump(mode="json", exclude_none=True))
        return _nc(c.execute(NC_SELECT + " WHERE n.id = %s", (row["id"],)).fetchall())[0]


@router.put("/nonconformities/{nc_id}")
def nc_update(nc_id: str, body: NcIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        try:
            old = c.execute("SELECT * FROM nonconformities WHERE id = %s FOR UPDATE", (nc_id,)).fetchone()
        except Exception:
            old = None
        if not old:
            raise HTTPException(404, "Nonconformity not found")
        changes = body.model_dump(exclude_unset=True, exclude={"requirement_ref", "finding_id"})
        merged = {**old, **changes}
        if merged["status"] == "closed" and not (merged.get("corrective_action") or "").strip():
            raise HTTPException(422, "A corrective action is required before closing")
        if changes.get("status") in ("verified", "closed"):
            changes["verified_by"] = user["email"]
        if "status" in changes:
            changes["closed_at"] = dt.datetime.now(dt.timezone.utc) if changes["status"] == "closed" else None
        if changes:
            c.execute(f"UPDATE nonconformities SET {', '.join(k + ' = %s' for k in changes)} WHERE id = %s", [*changes.values(), nc_id])
            audit.record(c, actor=user["email"], actor_type="user", action="nonconformity.updated", workspace_id=wid, entity_type="nonconformity", entity_id=nc_id,
                         summary=f"{old['title']}: {merged['status']}", payload={k: (str(v) if isinstance(v, (dt.date, dt.datetime)) else v) for k, v in changes.items()})
        return _nc(c.execute(NC_SELECT + " WHERE n.id = %s", (nc_id,)).fetchall())[0]


@router.delete("/nonconformities/{nc_id}", status_code=204)
def nc_delete(nc_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        try:
            row = c.execute("DELETE FROM nonconformities WHERE id = %s RETURNING title", (nc_id,)).fetchone()
        except Exception:
            row = None
        if not row:
            raise HTTPException(404, "Nonconformity not found")
        audit.record(c, actor=user["email"], actor_type="user", action="nonconformity.deleted", workspace_id=wid, entity_type="nonconformity",
                     entity_id=nc_id, summary=row["title"])
    return Response(status_code=204)


# ------------------------------------------------------------------ NIST scorecard
@router.get("/nist/scorecard")
def nist_scorecard(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        data = status.load(c)
        runs = c.execute("""SELECT DISTINCT ON (r.system_id) r.id, r.system_id, s.name, r.result->'nist'->'maturity' AS maturity
                            FROM runs r JOIN ai_systems s ON s.id = r.system_id
                            WHERE r.status = 'completed' AND r.result->'nist'->'maturity' IS NOT NULL ORDER BY r.system_id, r.created_at DESC""").fetchall()
    descriptions = {"GOVERN": "A culture of risk management is cultivated and present.", "MAP": "Context is recognized and risks related to context are identified.",
                    "MEASURE": "Identified risks are assessed, analyzed, or tracked.", "MANAGE": "Risks are prioritized and acted upon based on a projected impact."}
    functions = []
    for fn, description in descriptions.items():
        subs = [s for s in kb.nist_core() if s["function"] == fn]
        cats: dict = {}
        for s in subs:
            cats.setdefault(s["category"], []).append({"ref": s["id"], "text": s["text"], "status": status.of(data, s["id"])})
        levels = [{"system_id": r["system_id"], "name": r["name"], "level": r["maturity"].get(fn), "run_id": r["id"]} for r in runs if r["maturity"].get(fn) is not None]
        functions.append({"id": fn, "description": description, "maturity": round(sum(l["level"] for l in levels) / len(levels), 1) if levels else None,
                          "systems": levels, "counts": status.counts(x["status"] for v in cats.values() for x in v),
                          "categories": [{"id": k, "subcategories": v} for k, v in cats.items()]})
    return {"scale_note": "Maturity is proposed by the NIST specialist agent on an application-defined scale (0 = no evidence, 1 = ad hoc, 2 = some documented practice, "
                          "3 = defined and applied, 4 = measured, 5 = continuously improved). NIST AI RMF itself defines no maturity levels. Values are AI-generated "
                          "and have no separate approval step.", "functions": functions}


# ------------------------------------------------------------------ compliance graph
@router.get("/graph")
def graph(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        data = status.load(c)
        systems = c.execute("SELECT id, name, kind, risk_class FROM ai_systems ORDER BY created_at").fetchall()
    reqs = kb.requirements()
    nodes, edges, seen = [], [], set()
    for cco in kb.control_objectives():
        nodes.append({"id": cco["id"], "type": "objective", "label": cco["name_en"], "status": status.objective_status(data, cco)})
        for r in cco["requirements"]:
            if r["ref"] not in seen and r["ref"] in reqs:
                seen.add(r["ref"])
                short = r["ref"].split("-", 1)[1].replace("Art.", "Art. ").replace("Annex.", "Annex ")
                nodes.append({"id": r["ref"], "type": "requirement", "framework": r["framework"], "label": short, "title": reqs[r["ref"]]["title"],
                              "status": status.of(data, r["ref"])})
            edges.append({"source": r["ref"], "target": cco["id"], "type": "belongs_to", "strength": r["strength"]})
    docs = set()
    for t in data["tags"]:
        if str(t["id"]) not in docs:
            docs.add(str(t["id"]))
            nodes.append({"id": f"doc:{t['id']}", "type": "document", "label": t["filename"], "doc_type": t["doc_type"]})
        edges.append({"source": f"doc:{t['id']}", "target": t["cco_id"], "type": "evidence", "status": t["status"], "page": t["page"]})
    for s in systems:
        nodes.append({"id": f"sys:{s['id']}", "type": "system", "label": s["name"], "risk_class": s["risk_class"], "kind": s["kind"]})
    for f in data["findings"]:
        if f["requirement_ref"] in seen and f["status"] in ("gap", "partial", "compliant"):
            edges.append({"source": f"sys:{f['system_id']}", "target": f["requirement_ref"], "type": "finding", "status": f["status"],
                          "review_status": f["review_status"], "origin": f["origin"]})
    c_ = status.counts(n["status"] for n in nodes if n["type"] == "requirement")
    return {"nodes": nodes, "edges": edges, "counts": {k: v for k, v in c_.items() if k != "total"}}
