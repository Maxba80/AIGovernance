"""Assessment orchestrator (LangGraph).

Flow, fixed in code so results are repeatable and every hand-off is recorded:

  context -> EU AI Act classification -> HUMAN APPROVAL (graph pauses)
          -> [EU AI Act obligations | GDPR | ISO 42001 | NIST] in parallel
          -> crosswalk propagation + risk identification -> synthesis

State is checkpointed in PostgreSQL after every node, so a paused run survives restarts.
Each node writes its step status and one audit-trail entry (agent, model, sources).
"""
import contextlib
import operator
from typing import Annotated, TypedDict

from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt
from psycopg.types.json import Jsonb

from .. import audit, config, db, kb
from ..agents import common, specialists
from ..llm.base import LLMError

STEPS = [
    ("context", "Orchestrator", "Collect system context and evidence"),
    ("eu_ai_act_classification", "EU AI Act Specialist", "Propose the risk classification"),
    ("classification_approval", "Human reviewer", "Approve the risk classification"),
    ("eu_ai_act_obligations", "EU AI Act Specialist", "Assess obligations for the approved class"),
    ("gdpr", "Data Protection & GDPR Specialist", "Screen data protection requirements"),
    ("iso_42001", "ISO/IEC 42001 Auditor", "Gap analysis on clauses and Annex A"),
    ("nist", "NIST AI RMF Specialist", "Maturity on Govern, Map, Measure, Manage"),
    ("crosswalk_risk", "Crosswalk & Risk Engine", "Propagate across frameworks and identify risks"),
    ("synthesis", "Orchestrator", "Write the executive synthesis"),
]
AGENT_OF = {k: a for k, a, _ in STEPS}
FRAMEWORK_NAMES = {"eu-ai-act": "EU AI Act", "gdpr": "GDPR", "iso-42001": "ISO/IEC 42001", "nist-ai-rmf": "NIST AI RMF"}
MAX_INFERRED = 15  # inferred findings are suggestions to review: keep them few


class RunStopped(Exception):
    pass


def _merge(a: dict, b: dict) -> dict:
    return {**a, **b}


class State(TypedDict, total=False):
    run_id: str
    wid: str
    system: dict
    passages: list[dict]
    classification: dict
    approved_class: str
    org_role: str
    results: Annotated[dict, _merge]
    failed_steps: Annotated[list, operator.add]


def _mark(wid: str, run_id: str, key: str, **fields) -> None:
    sets = ", ".join(f"{k} = %s" for k in fields)
    with db.tx(wid) as c:
        c.execute(f"UPDATE run_steps SET {sets} WHERE run_id = %s AND key = %s", [*fields.values(), run_id, key])


def _result(wid: str, run_id: str, patch: dict) -> None:
    with db.tx(wid) as c:
        c.execute("UPDATE runs SET result = result || %s WHERE id = %s", (Jsonb(common.jsonable(patch)), run_id))


@contextlib.contextmanager
def step(state: State, key: str, tolerate: bool = False):
    """Tracks one step. A provider failure in a tolerated step is recorded and the run continues."""
    wid, run_id = state["wid"], state["run_id"]
    info: dict = {"failed": False}
    with db.tx(wid) as c:
        c.execute("UPDATE run_steps SET status = 'running', started_at = now(), error = NULL WHERE run_id = %s AND key = %s", (run_id, key))
    try:
        yield info
    except LLMError as e:
        info["failed"] = True
        with db.tx(wid) as c:
            c.execute("UPDATE run_steps SET status = 'failed', finished_at = now(), error = %s WHERE run_id = %s AND key = %s", (str(e)[:500], run_id, key))
            audit.record(c, actor=AGENT_OF[key], actor_type="agent", action=f"run.{key}.failed", workspace_id=wid, entity_type="run",
                         entity_id=run_id, summary=str(e)[:300], model=info.get("model"))
        if not tolerate:
            raise
    else:
        with db.tx(wid) as c:
            c.execute("UPDATE run_steps SET status = %s, finished_at = now(), model = %s, summary = %s WHERE run_id = %s AND key = %s",
                      (info.get("status", "done"), info.get("model"), info.get("summary"), run_id, key))
            audit.record(c, actor=AGENT_OF[key], actor_type="agent", action=f"run.{key}", workspace_id=wid, entity_type="run", entity_id=run_id,
                         summary=info.get("summary"), model=info.get("model"), payload=common.jsonable(info.get("payload") or {}),
                         sources=info.get("sources") or [])


def _sources(passages: list[dict]) -> list[dict]:
    seen, out = set(), []
    for p in passages:
        if p["document_id"] not in seen:
            seen.add(p["document_id"])
            out.append({"document_id": p["document_id"], "filename": p["filename"]})
    return out


def _store_findings(state: State, key: str, framework: str, findings: list[dict], model: str) -> None:
    wid, run_id, system_id = state["wid"], state["run_id"], state["system"]["id"]
    with db.tx(wid) as c:
        c.execute("DELETE FROM findings WHERE run_id = %s AND framework = %s AND origin = 'agent'", (run_id, framework))
        ids = [str(c.execute("""INSERT INTO findings (workspace_id, run_id, system_id, framework, requirement_ref, status, rationale, evidence, agent, model)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                             (wid, run_id, system_id, framework, f["requirement_ref"], f["status"], f["rationale"], Jsonb(f["evidence"]),
                              AGENT_OF[key], model)).fetchone()["id"]) for f in findings]
        if ids:
            counts: dict = {}
            for f in findings:
                counts[f["status"]] = counts.get(f["status"], 0) + 1
            c.execute("""INSERT INTO approvals (workspace_id, kind, title, summary, agent, model, payload, sources)
                         VALUES (%s, 'assessment_findings', %s, %s, %s, %s, %s, %s)""",
                      (wid, f"{state['system']['name']}: {FRAMEWORK_NAMES[framework]} findings",
                       ", ".join(f"{n} {s.replace('_', ' ')}" for s, n in sorted(counts.items())), AGENT_OF[key], model,
                       Jsonb({"run_id": run_id, "system_id": system_id, "framework": framework, "finding_ids": ids, "counts": counts}),
                       Jsonb(_sources(state["passages"]))))


def _counts(findings: list[dict]) -> str:
    c: dict = {}
    for f in findings:
        c[f["status"]] = c.get(f["status"], 0) + 1
    return ", ".join(f"{n} {s.replace('_', ' ')}" for s, n in sorted(c.items())) or "no findings"


# ------------------------------------------------------------------ nodes
def n_context(state: State) -> dict:
    with step(state, "context") as info:
        with db.tx(state["wid"]) as c:
            system = common.jsonable(c.execute("SELECT * FROM ai_systems WHERE id = (SELECT system_id FROM runs WHERE id = %s)", (state["run_id"],)).fetchone())
        passages, how = common.collect_passages(state["wid"], system)
        info.update(summary=f"{len(passages)} passages from {len(how['documents'])} documents ({how['method']})", model=how.get("embedding_model"),
                    payload=how, sources=_sources(passages))
    return {"system": system, "passages": passages}


def n_classify(state: State) -> dict:
    system, wid, run_id = state["system"], state["wid"], state["run_id"]
    with step(state, "eu_ai_act_classification") as info:
        out, label = specialists.classify(system, state["passages"])
        info.update(model=label, summary=f"Proposed: {out['risk_class']} (confidence {out['confidence']:.0%})", payload=out, sources=_sources(state["passages"]))
        with db.tx(wid) as c:
            c.execute("DELETE FROM approvals WHERE kind = 'risk_classification' AND status = 'pending' AND payload->>'run_id' = %s", (run_id,))
            approval = c.execute("""INSERT INTO approvals (workspace_id, kind, title, summary, agent, model, confidence, payload, sources)
                                    VALUES (%s, 'risk_classification', %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                                 (wid, f"{system['name']}: risk classification", out["rationale"], AGENT_OF["eu_ai_act_classification"], label, out["confidence"],
                                  Jsonb({"run_id": run_id, "system_id": system["id"], "proposed_class": out["risk_class"], "rationale": out["rationale"],
                                         "decision_path": out["decision_path"], "confidence": out["confidence"],
                                         "missing_information": out["missing_information"], "org_role": out["org_role"]}),
                                  Jsonb(_sources(state["passages"])))).fetchone()
            c.execute("UPDATE runs SET pending_approval_id = %s, result = result || %s WHERE id = %s",
                      (approval["id"], Jsonb({"classification": {**out, "approved_class": None, "approved_by": None, "approved_comment": None}}), run_id))
            if system.get("risk_class_status") != "approved":
                c.execute("UPDATE ai_systems SET risk_class = %s, risk_class_status = 'proposed', risk_class_rationale = %s, updated_at = now() WHERE id = %s",
                          (out["risk_class"], out["rationale"], system["id"]))
    _mark(wid, run_id, "classification_approval", status="waiting", started_at=None)
    return {"classification": out}


def n_gate(state: State) -> dict:
    """Pauses here. The worker resumes the graph with the reviewer's decision."""
    decision = interrupt({"type": "risk_classification", "run_id": state["run_id"], "proposed_class": state["classification"]["risk_class"]})
    wid, run_id = state["wid"], state["run_id"]
    if decision.get("decision") != "approve":
        _mark(wid, run_id, "classification_approval", status="failed", error="Classification rejected by the reviewer")
        raise RunStopped("Classification rejected")
    approved = decision.get("override_class") or state["classification"]["risk_class"]
    with db.tx(wid) as c:
        c.execute("UPDATE run_steps SET status = 'done', finished_at = now(), summary = %s WHERE run_id = %s AND key = 'classification_approval'",
                  (f"Approved as {approved} by {decision.get('by')}", run_id))
        c.execute("UPDATE runs SET pending_approval_id = NULL, result = jsonb_set(result, '{classification}', (result->'classification') || %s) WHERE id = %s",
                  (Jsonb({"approved_class": approved, "approved_by": decision.get("by"), "approved_comment": decision.get("comment")}), run_id))
    role = state["system"].get("org_role") if state["system"].get("org_role") not in (None, "unknown") else state["classification"]["org_role"]
    return {"approved_class": approved, "org_role": role}


def _specialist(key: str, framework: str, call):
    def node(state: State) -> dict:
        with step(state, key, tolerate=True) as info:
            findings, result, label = call(state)
            _store_findings(state, key, framework, findings, label)
            info.update(model=label, summary=_counts(findings), payload={"result": result, "findings": len(findings)}, sources=_sources(state["passages"]))
            patch = {k: v for k, v in result.items() if k != "dropped"}
            store_key = {"gdpr": "gdpr", "nist": "nist", "iso_42001": "iso_42001", "eu_ai_act_obligations": "eu_ai_act"}[key]
            _result(state["wid"], state["run_id"], {store_key: patch})
            return {"results": {store_key: patch}}
        return {"failed_steps": [key]}
    return node


def n_crosswalk(state: State) -> dict:
    wid, run_id, system = state["wid"], state["run_id"], state["system"]
    with step(state, "crosswalk_risk", tolerate=True) as info:
        with db.tx(wid) as c:
            found = c.execute("SELECT requirement_ref, framework, status FROM findings WHERE run_id = %s AND origin = 'agent'", (run_id,)).fetchall()
        have = {f["requirement_ref"] for f in found}
        order = {"gap": 0, "partial": 1}  # only problems propagate; a "compliant" elsewhere is not inferred
        # candidates per source finding, then round-robin so no single finding uses up the whole allowance
        per_source: list[list[tuple]] = []
        for f in sorted((f for f in found if f["status"] in order), key=lambda f: order[f["status"]]):
            mine, seen_refs = [], set()
            for cco in kb.control_objectives():
                primary = [r["ref"] for r in cco["requirements"] if r["strength"] == "primary"]
                if f["requirement_ref"] in primary:
                    for ref in primary:
                        if ref not in have and ref not in seen_refs and kb.framework_of(ref) != f["framework"]:
                            seen_refs.add(ref)
                            mine.append((ref, f, cco))
            per_source.append(mine)
        inferred: dict[str, tuple] = {}
        depth = 0
        while len(inferred) < MAX_INFERRED and any(depth < len(m) for m in per_source):
            for mine in per_source:
                if depth < len(mine) and len(inferred) < MAX_INFERRED and mine[depth][0] not in inferred:
                    inferred[mine[depth][0]] = (mine[depth][1], mine[depth][2])
            depth += 1
        with db.tx(wid) as c:
            c.execute("DELETE FROM findings WHERE run_id = %s AND origin = 'crosswalk'", (run_id,))
            for ref, (src, cco) in inferred.items():
                c.execute("""INSERT INTO findings (workspace_id, run_id, system_id, framework, requirement_ref, status, rationale, origin, via, agent)
                             VALUES (%s, %s, %s, %s, %s, %s, %s, 'crosswalk', %s, %s)""",
                          (wid, run_id, system["id"], kb.framework_of(ref), ref, src["status"],
                           f"Inferred, not assessed directly: {src['requirement_ref']} was found '{src['status']}' and both requirements serve the control objective "
                           f"{cco['id']} ({cco['name_en']}). Confirm against the requirement before relying on it.",
                           f"{cco['id']} from {src['requirement_ref']}", AGENT_OF["crosswalk_risk"]))
        all_findings = [dict(f) for f in found]
        risks, dropped, label = specialists.risks(system, state["approved_class"], all_findings)
        with db.tx(wid) as c:
            c.execute("DELETE FROM system_risks WHERE run_id = %s", (run_id,))
            for r in risks:
                c.execute("""INSERT INTO system_risks (workspace_id, run_id, system_id, risk_id, likelihood, severity, rationale, mitigating_objectives, model)
                             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                          (wid, run_id, system["id"], r["risk_id"], r["likelihood"], r["severity"], r["rationale"], r["mitigating_objectives"], label))
        info.update(model=label, summary=f"{len(inferred)} findings inferred across frameworks, {len(risks)} risks identified",
                    payload={"inferred": len(inferred), "risks": risks, "dropped": dropped})
    return {}


def n_synthesis(state: State) -> dict:
    wid, run_id = state["wid"], state["run_id"]
    with step(state, "synthesis", tolerate=True) as info:
        with db.tx(wid) as c:
            rows = c.execute("SELECT framework, status, count(*) AS n FROM findings WHERE run_id = %s GROUP BY 1, 2", (run_id,)).fetchall()
            risk_count = c.execute("SELECT count(*) AS n FROM system_risks WHERE run_id = %s", (run_id,)).fetchone()["n"]
            result = c.execute("SELECT result FROM runs WHERE id = %s", (run_id,)).fetchone()["result"]
        counts: dict = {}
        for r in rows:
            counts.setdefault(r["framework"], {})[r["status"]] = r["n"]
        text, label = specialists.synthesis(state["system"], result, counts, risk_count)
        with db.tx(wid) as c:
            c.execute("UPDATE runs SET summary = %s WHERE id = %s", (text, run_id))
        info.update(model=label, summary="Executive synthesis written", payload={"counts": counts, "failed_steps": state.get("failed_steps") or []})
    return {}


def build() -> StateGraph:
    g = StateGraph(State)
    g.add_node("context", n_context)
    g.add_node("classify", n_classify)
    g.add_node("gate", n_gate)
    parallel = {
        "eu_ai_act_obligations": ("eu-ai-act", lambda s: specialists.ai_act_obligations(s["system"], s["passages"], s["approved_class"], s["org_role"])),
        "gdpr": ("gdpr", lambda s: specialists.gdpr(s["system"], s["passages"], s["approved_class"])),
        "iso_42001": ("iso-42001", lambda s: specialists.iso_42001(s["system"], s["passages"])),
        "nist": ("nist-ai-rmf", lambda s: specialists.nist(s["system"], s["passages"])),
    }
    for key, (framework, call) in parallel.items():
        g.add_node(key, _specialist(key, framework, call))
    g.add_node("crosswalk_risk", n_crosswalk)
    g.add_node("synthesis", n_synthesis)
    g.add_edge(START, "context")
    g.add_edge("context", "classify")
    g.add_edge("classify", "gate")
    for key in parallel:
        g.add_edge("gate", key)
    g.add_edge(list(parallel), "crosswalk_risk")
    g.add_edge("crosswalk_risk", "synthesis")
    g.add_edge("synthesis", END)
    return g


def setup() -> None:
    with PostgresSaver.from_conn_string(config.DATABASE_URL) as saver:
        saver.setup()


def execute(wid: str, run_id: str, resume: dict | None = None, continue_from_checkpoint: bool = False) -> None:
    """Runs the graph until it pauses for approval or finishes; updates the run accordingly."""
    with db.tx(wid) as c:
        c.execute("UPDATE runs SET status = 'running', error = NULL WHERE id = %s", (run_id,))
    try:
        with PostgresSaver.from_conn_string(config.DATABASE_URL) as saver:
            graph = build().compile(checkpointer=saver)
            cfg = {"configurable": {"thread_id": run_id}}
            if resume is not None:
                payload = Command(resume=resume)
            elif continue_from_checkpoint and graph.get_state(cfg).next:
                payload = None  # pick up after the last completed node (worker restarted mid-run)
            else:
                payload = {"run_id": run_id, "wid": wid, "results": {}, "failed_steps": []}
            out = graph.invoke(payload, cfg)
        paused = bool(out.get("__interrupt__"))
        with db.tx(wid) as c:
            if paused:
                c.execute("UPDATE runs SET status = 'waiting_approval' WHERE id = %s", (run_id,))
            else:
                c.execute("UPDATE runs SET status = 'completed', finished_at = now() WHERE id = %s", (run_id,))
                audit.record(c, actor="Orchestrator", actor_type="agent", action="run.completed", workspace_id=wid, entity_type="run", entity_id=run_id,
                             summary="Assessment completed" + (f"; steps that failed: {', '.join(out.get('failed_steps') or [])}" if out.get("failed_steps") else ""))
    except Exception as e:
        message = str(e) if isinstance(e, (RunStopped, LLMError)) else f"{type(e).__name__}: {e}"
        with db.tx(wid) as c:
            c.execute("UPDATE runs SET status = 'failed', error = %s, finished_at = now(), pending_approval_id = NULL WHERE id = %s", (message[:1000], run_id))
            c.execute("UPDATE run_steps SET status = 'skipped' WHERE run_id = %s AND status IN ('pending', 'waiting')", (run_id,))
            c.execute("UPDATE run_steps SET status = 'failed', error = COALESCE(error, %s) WHERE run_id = %s AND status = 'running'", (message[:500], run_id))
            audit.record(c, actor="Orchestrator", actor_type="agent", action="run.failed", workspace_id=wid, entity_type="run", entity_id=run_id, summary=message[:300])
        if not isinstance(e, (RunStopped, LLMError)):
            raise
