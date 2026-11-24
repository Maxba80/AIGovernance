"""Requirement status for a workspace — the single definition used by every module and by the graph.

Order of precedence for one requirement:
  1. the worst APPROVED finding across systems (gap < partial < compliant < not applicable);
  2. otherwise `evidence_present` when a control objective it belongs to as primary has approved evidence;
  3. otherwise `not_assessed`.
Proposals that no human has approved never change a status.
"""
from . import kb

RANK = ["gap", "partial", "compliant", "not_applicable", "evidence_present", "not_assessed"]
EMPTY = {k: 0 for k in ["compliant", "partial", "gap", "evidence_present", "not_applicable", "not_assessed"]}


def load(c) -> dict:
    tags = c.execute("""SELECT t.cco_id, t.status, t.page, d.id, d.filename, d.doc_type FROM evidence_tags t
                        JOIN documents d ON d.id = t.document_id WHERE t.status <> 'rejected'""").fetchall()
    findings = c.execute("""SELECT f.id, f.requirement_ref, f.status, f.review_status, f.origin, f.system_id, s.name AS system_name
                            FROM findings f JOIN ai_systems s ON s.id = f.system_id
                            WHERE f.review_status <> 'rejected' AND f.run_id = (SELECT id FROM runs r WHERE r.system_id = f.system_id ORDER BY created_at DESC LIMIT 1)""").fetchall()
    approved_docs: dict = {}
    for t in tags:
        if t["status"] == "approved":
            approved_docs.setdefault(t["cco_id"], {})[str(t["id"])] = t["filename"]
    # the most recent approved finding per system and requirement decides; then the worst across systems
    approved = c.execute("""SELECT DISTINCT ON (system_id, requirement_ref) requirement_ref, status FROM findings
                            WHERE review_status = 'approved' ORDER BY system_id, requirement_ref, created_at DESC""").fetchall()
    worst: dict = {}
    for f in approved:
        if f["status"] in RANK and (f["requirement_ref"] not in worst or RANK.index(f["status"]) < RANK.index(worst[f["requirement_ref"]])):
            worst[f["requirement_ref"]] = f["status"]
    return {"tags": tags, "findings": findings, "approved_docs": approved_docs, "worst": worst}


def of(data: dict, ref: str) -> str:
    if ref in data["worst"]:
        return data["worst"][ref]
    for o in kb.objectives_of().get(ref, []):
        if o["strength"] == "primary" and data["approved_docs"].get(o["id"]):
            return "evidence_present"
    return "not_assessed"


def documents_for(data: dict, ref: str) -> dict:
    docs: dict = {}
    for o in kb.objectives_of().get(ref, []):
        docs.update(data["approved_docs"].get(o["id"], {}))
    return docs


def counts(statuses) -> dict:
    out = dict(EMPTY)
    for s in statuses:
        out[s] += 1
    return {"total": sum(out.values()), **out}


def objective_status(data: dict, cco: dict) -> str:
    primary = [of(data, r["ref"]) for r in cco["requirements"] if r["strength"] == "primary"]
    if "gap" in primary:
        return "gap"
    if "partial" in primary:
        return "partial"
    if primary and all(s in ("compliant", "not_applicable") for s in primary):
        return "compliant"
    return "evidence_present" if data["approved_docs"].get(cco["id"]) else "not_assessed"
