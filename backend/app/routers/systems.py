"""Inventory (AI systems and agents), assessment runs, findings, risks and compliance status."""
from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from .. import audit, db, kb, security
from ..agents.specialists import RISK_CLASSES
from ..llm import registry
from ..orchestrator.graph import STEPS
from .workspaces import require_workspace

router = APIRouter(prefix="/api/workspaces/{wid}", tags=["inventory"], dependencies=[Depends(security.current_user)])
FIELDS = ("kind", "name", "description", "intended_purpose", "business_owner", "org_role", "lifecycle", "uses_personal_data",
          "vendor", "base_model", "deployment", "agent_card", "document_ids")
SEVERITY = {"gap": 0, "partial": 1, "insufficient_evidence": 2, "compliant": 3, "not_applicable": 4}


class Tool(BaseModel):
    name: str
    description: str | None = None
    write_access: bool = False


class AgentCard(BaseModel):
    tools: list[Tool] = []
    data_sources: list[str] = []
    guardrails: list[str] = []
    autonomy_level: int = Field(default=1, ge=1, le=5)
    human_oversight: str | None = None
    memory: str | None = None
    kill_switch: str | None = None
    agentic_risks: list[str] = []


class SystemIn(BaseModel):
    kind: str = Field(pattern="^(system|agent)$")
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    intended_purpose: str | None = None
    business_owner: str | None = None
    org_role: str = Field(default="unknown", pattern="^(provider|deployer|importer|distributor|unknown)$")
    lifecycle: str = Field(default="idea", pattern="^(idea|development|production|retired)$")
    uses_personal_data: bool | None = None
    vendor: str | None = None
    base_model: str | None = None
    deployment: str | None = None
    agent_card: AgentCard | None = None
    document_ids: list[str] = []


def _values(body: SystemIn) -> list:
    d = body.model_dump()
    d["agent_card"] = Jsonb(d["agent_card"]) if body.kind == "agent" and d["agent_card"] is not None else None
    return [d[f] for f in FIELDS]


def _decorate(c, systems: list[dict]) -> list[dict]:
    if not systems:
        return systems
    ids = [s["id"] for s in systems]
    runs = {r["system_id"]: r for r in c.execute("SELECT DISTINCT ON (system_id) system_id, id, status, created_at FROM runs WHERE system_id = ANY(%s) ORDER BY system_id, created_at DESC", (ids,)).fetchall()}
    counts: dict = {}
    for r in c.execute("""SELECT f.system_id, f.status, count(*) AS n FROM findings f
                          JOIN (SELECT DISTINCT ON (system_id) system_id, id FROM runs WHERE system_id = ANY(%s) ORDER BY system_id, created_at DESC) lr ON lr.id = f.run_id
                          WHERE f.status IN ('gap', 'partial') AND f.review_status <> 'rejected' GROUP BY 1, 2""", (ids,)).fetchall():
        counts.setdefault(r["system_id"], {"gap": 0, "partial": 0})[r["status"]] = r["n"]
    for s in systems:
        run = runs.get(s["id"])
        s["last_run"] = {"id": run["id"], "status": run["status"], "created_at": run["created_at"]} if run else None
        s["open_findings"] = counts.get(s["id"], {"gap": 0, "partial": 0})
    return systems


def _system(c, system_id: str) -> dict:
    try:
        row = c.execute("SELECT * FROM ai_systems WHERE id = %s", (system_id,)).fetchone()
    except Exception:
        row = None
    if not row:
        raise HTTPException(404, "System not found")
    return row


@router.get("/systems")
def list_systems(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _decorate(c, c.execute("SELECT * FROM ai_systems ORDER BY created_at DESC").fetchall())


@router.post("/systems")
def create_system(body: SystemIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        row = c.execute(f"INSERT INTO ai_systems (workspace_id, {', '.join(FIELDS)}) VALUES (%s, {', '.join(['%s'] * len(FIELDS))}) RETURNING *",
                        [wid, *_values(body)]).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action=f"inventory.{body.kind}_created", workspace_id=wid, entity_type="ai_system",
                     entity_id=row["id"], summary=row["name"], payload=body.model_dump())
        return _decorate(c, [row])[0]


@router.get("/systems/{system_id}")
def get_system(system_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        return _decorate(c, [_system(c, system_id)])[0]


@router.put("/systems/{system_id}")
def update_system(system_id: str, body: SystemIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        _system(c, system_id)
        row = c.execute(f"UPDATE ai_systems SET {', '.join(f + ' = %s' for f in FIELDS)}, updated_at = now() WHERE id = %s RETURNING *",
                        [*_values(body), system_id]).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="inventory.updated", workspace_id=wid, entity_type="ai_system",
                     entity_id=system_id, summary=row["name"], payload=body.model_dump())
        return _decorate(c, [row])[0]


@router.delete("/systems/{system_id}", status_code=204)
def delete_system(system_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        row = _system(c, system_id)
        c.execute("DELETE FROM approvals WHERE payload->>'system_id' = %s", (system_id,))
        c.execute("DELETE FROM ai_systems WHERE id = %s", (system_id,))
        audit.record(c, actor=user["email"], actor_type="user", action="inventory.deleted", workspace_id=wid, entity_type="ai_system",
                     entity_id=system_id, summary=row["name"])
    return Response(status_code=204)


class RiskClassIn(BaseModel):
    risk_class: str
    rationale: str | None = None


@router.put("/systems/{system_id}/risk-class")
def set_risk_class(system_id: str, body: RiskClassIn, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if body.risk_class not in RISK_CLASSES:
        raise HTTPException(422, f"risk_class must be one of {', '.join(RISK_CLASSES)}")
    with db.tx(wid) as c:
        before = _system(c, system_id)
        row = c.execute("UPDATE ai_systems SET risk_class = %s, risk_class_status = 'approved', risk_class_rationale = %s, updated_at = now() WHERE id = %s RETURNING *",
                        (body.risk_class, body.rationale, system_id)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="inventory.classified_manually", workspace_id=wid, entity_type="ai_system",
                     entity_id=system_id, summary=f"{row['name']}: {before['risk_class']} → {body.risk_class}",
                     payload={"from": before["risk_class"], "to": body.risk_class, "rationale": body.rationale})
        return _decorate(c, [row])[0]


# ------------------------------------------------------------------ runs
def _runs(c, where: str, args: list) -> list[dict]:
    runs = c.execute(f"""SELECT r.id, r.system_id, s.name AS system_name, r.status, r.pending_approval_id, r.error, r.summary, r.result, r.created_at, r.finished_at
                         FROM runs r JOIN ai_systems s ON s.id = r.system_id {where} ORDER BY r.created_at DESC LIMIT 50""", args).fetchall()
    if runs:
        steps = c.execute("SELECT run_id, key, agent, label, status, model, started_at, finished_at, summary, error FROM run_steps WHERE run_id = ANY(%s) ORDER BY position",
                          ([r["id"] for r in runs],)).fetchall()
        for r in runs:
            r["steps"] = [{k: v for k, v in s.items() if k != "run_id"} for s in steps if s["run_id"] == r["id"]]
    return runs


@router.post("/systems/{system_id}/assess")
def assess(system_id: str, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if registry.resolve("eu_ai_act") is None:
        raise HTTPException(409, "No reasoning model is configured. Choose one in Settings.")
    with db.tx(wid) as c:
        system = _system(c, system_id)
        if c.execute("SELECT 1 FROM runs WHERE system_id = %s AND status IN ('queued', 'running', 'waiting_approval')", (system_id,)).fetchone():
            raise HTTPException(409, "An assessment of this system is already in progress")
        run = c.execute("INSERT INTO runs (workspace_id, system_id, started_by) VALUES (%s, %s, %s) RETURNING id", (wid, system_id, user["email"])).fetchone()
        for i, (key, agent, label) in enumerate(STEPS):
            c.execute("INSERT INTO run_steps (run_id, workspace_id, key, position, agent, label) VALUES (%s, %s, %s, %s, %s, %s)", (run["id"], wid, key, i, agent, label))
        c.execute("INSERT INTO jobs (workspace_id, kind, run_id, agent) VALUES (%s, 'assessment', %s, 'Orchestrator')", (wid, run["id"]))
        audit.record(c, actor=user["email"], actor_type="user", action="run.started", workspace_id=wid, entity_type="run", entity_id=run["id"],
                     summary=f"Assessment of {system['name']}", payload={"system_id": system_id})
        return _runs(c, "WHERE r.id = %s", [run["id"]])[0]


@router.get("/runs")
def list_runs(system_id: str | None = None, active: bool = False, wid: str = Depends(require_workspace)):
    where, args = [], []
    if system_id:
        where.append("r.system_id = %s")
        args.append(system_id)
    if active:
        where.append("r.status IN ('queued', 'running', 'waiting_approval')")
    with db.tx(wid) as c:
        return _runs(c, ("WHERE " + " AND ".join(where)) if where else "", args)


@router.get("/runs/{run_id}")
def get_run(run_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        try:
            runs = _runs(c, "WHERE r.id = %s", [run_id])
        except Exception:
            runs = []
    if not runs:
        raise HTTPException(404, "Run not found")
    return runs[0]


# ------------------------------------------------------------------ findings and risks
def _finding_rows(rows: list[dict]) -> list[dict]:
    reqs = kb.requirements()
    for r in rows:
        r["requirement_title"] = reqs.get(r["requirement_ref"], {}).get("title", r["requirement_ref"])
    return sorted(rows, key=lambda r: (r["framework"], SEVERITY.get(r["status"], 9), r["requirement_ref"]))


@router.get("/systems/{system_id}/findings")
def findings(system_id: str, run_id: str | None = None, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        _system(c, system_id)
        if not run_id:
            last = c.execute("SELECT id FROM runs WHERE system_id = %s ORDER BY created_at DESC LIMIT 1", (system_id,)).fetchone()
            if not last:
                return []
            run_id = last["id"]
        return _finding_rows(c.execute("SELECT * FROM findings WHERE system_id = %s AND run_id = %s", (system_id, run_id)).fetchall())


class FindingReview(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    status: str | None = None
    comment: str | None = None


@router.post("/findings/{finding_id}/review")
def review_finding(finding_id: str, body: FindingReview, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    if body.status and body.status not in SEVERITY:
        raise HTTPException(422, "Invalid status")
    with db.tx(wid) as c:
        try:
            f = c.execute("SELECT * FROM findings WHERE id = %s FOR UPDATE", (finding_id,)).fetchone()
        except Exception:
            f = None
        if not f:
            raise HTTPException(404, "Finding not found")
        new_status = body.status or f["status"]
        row = c.execute("UPDATE findings SET review_status = %s, status = %s, reviewed_by = %s WHERE id = %s RETURNING *",
                        ("approved" if body.decision == "approve" else "rejected", new_status, user["email"], finding_id)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action=f"finding.{row['review_status']}", workspace_id=wid, entity_type="finding",
                     entity_id=finding_id, summary=f"{f['requirement_ref']}: {new_status}", model=f["model"], sources=f["evidence"],
                     payload={"requirement_ref": f["requirement_ref"], "proposed_status": f["status"], "final_status": new_status, "origin": f["origin"],
                              "via": f["via"], "proposed_by": f["agent"], "comment": body.comment, "system_id": str(f["system_id"])})
        return _finding_rows([row])[0]


def _risk_rows(rows: list[dict]) -> list[dict]:
    subs = {s["id"]: s for s in kb.mit_subdomains()}
    for r in rows:
        s = subs.get(r["risk_id"], {})
        r.update(name=s.get("name", r["risk_id"]), domain=s.get("domain"), score=r["likelihood"] * r["severity"])
    return sorted(rows, key=lambda r: -r["score"])


@router.get("/systems/{system_id}/risks")
def risks(system_id: str, wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        _system(c, system_id)
        return _risk_rows(c.execute("""SELECT * FROM system_risks WHERE system_id = %s
                                       AND run_id = (SELECT run_id FROM system_risks WHERE system_id = %s ORDER BY created_at DESC LIMIT 1)""", (system_id, system_id)).fetchall())


class RiskReview(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")
    likelihood: int | None = Field(default=None, ge=1, le=5)
    severity: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = None


@router.post("/risks/{risk_id}/review")
def review_risk(risk_id: str, body: RiskReview, wid: str = Depends(require_workspace), user: dict = Depends(security.current_user)):
    with db.tx(wid) as c:
        try:
            r = c.execute("SELECT * FROM system_risks WHERE id = %s FOR UPDATE", (risk_id,)).fetchone()
        except Exception:
            r = None
        if not r:
            raise HTTPException(404, "Risk not found")
        row = c.execute("UPDATE system_risks SET review_status = %s, likelihood = %s, severity = %s, reviewed_by = %s WHERE id = %s RETURNING *",
                        ("approved" if body.decision == "approve" else "rejected", body.likelihood or r["likelihood"], body.severity or r["severity"],
                         user["email"], risk_id)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action=f"risk.{row['review_status']}", workspace_id=wid, entity_type="risk", entity_id=risk_id,
                     summary=f"{r['risk_id']}: likelihood {row['likelihood']}, severity {row['severity']}", model=r["model"],
                     payload={"risk_id": r["risk_id"], "proposed": {"likelihood": r["likelihood"], "severity": r["severity"]},
                              "final": {"likelihood": row["likelihood"], "severity": row["severity"]}, "comment": body.comment, "system_id": str(r["system_id"])})
        return _risk_rows([row])[0]


# ------------------------------------------------------------------ compliance status
@router.get("/compliance")
def compliance(wid: str = Depends(require_workspace)):
    with db.tx(wid) as c:
        tags = c.execute("""SELECT t.cco_id, d.id, d.filename FROM evidence_tags t JOIN documents d ON d.id = t.document_id WHERE t.status = 'approved'""").fetchall()
        found = c.execute("SELECT requirement_ref, status FROM findings WHERE review_status = 'approved'").fetchall()
    docs: dict = {}
    for t in tags:
        docs.setdefault(t["cco_id"], {})[str(t["id"])] = t["filename"]
    worst: dict = {}
    for f in found:
        if f["status"] != "insufficient_evidence" and SEVERITY[f["status"]] < SEVERITY.get(worst.get(f["requirement_ref"]), 99):
            worst[f["requirement_ref"]] = f["status"]
    reqs = kb.requirements()
    status: dict = {}
    objectives = []
    for cco in kb.control_objectives():
        has_evidence = bool(docs.get(cco["id"]))
        rows = []
        for r in cco["requirements"]:
            s = worst.get(r["ref"]) or ("evidence_present" if has_evidence and r["strength"] == "primary" else "not_assessed")
            rows.append({"ref": r["ref"], "framework": r["framework"], "title": reqs.get(r["ref"], {}).get("title", r["ref"]), "strength": r["strength"], "status": s})
            rank = ["gap", "partial", "compliant", "not_applicable", "evidence_present", "not_assessed"]
            if r["ref"] not in status or rank.index(s) < rank.index(status[r["ref"]]):
                status[r["ref"]] = s
        objectives.append({"id": cco["id"], "name_en": cco["name_en"], "approved_evidence": len(docs.get(cco["id"], {})),
                           "documents": [{"id": k, "filename": v} for k, v in docs.get(cco["id"], {}).items()], "requirements": rows})
    names = {"eu-ai-act": "EU AI Act", "gdpr": "GDPR", "iso-42001": "ISO/IEC 42001", "nist-ai-rmf": "NIST AI RMF"}
    frameworks = []
    for fid, name in names.items():
        mine = [s for ref, s in status.items() if kb.framework_of(ref) == fid]
        frameworks.append({"id": fid, "name": name, "total": len(mine), **{k: mine.count(k) for k in ("compliant", "partial", "gap", "evidence_present", "not_applicable", "not_assessed")}})
    return {"frameworks": frameworks, "objectives": objectives}
