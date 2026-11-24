"""The specialist agents. Each one is a single structured model call with its own
knowledge-base context; the orchestrator (orchestrator/graph.py) decides order and flow."""
from typing import Literal

from pydantic import BaseModel, Field

from .. import kb
from ..llm import registry
from ..llm.base import LLMError
from .common import RULES, Finding, passages_block, requirement_lines, system_card, validate_findings

RISK_CLASSES = ("prohibited", "high-risk-annex-i", "high-risk-annex-iii", "limited-transparency", "minimal", "out-of-scope")


def _model(role: str):
    resolved = registry.resolve(role)
    if resolved is None:
        raise LLMError("No reasoning model is configured in Settings")
    return resolved


# ------------------------------------------------------------------ EU AI Act: classification
class DecisionStep(BaseModel):
    step: int
    question: str
    answer: str
    basis: list[str] = Field(description="Requirement identifiers, e.g. AIA-Art.5")


class Derogation(BaseModel):
    applies: bool
    reason: str


class Classification(BaseModel):
    in_scope: bool
    org_role: Literal["provider", "deployer", "importer", "distributor", "unknown"]
    risk_class: Literal["prohibited", "high-risk-annex-i", "high-risk-annex-iii", "limited-transparency", "minimal", "out-of-scope"]
    annex_iii_point: str | None = Field(description="e.g. '4(a) recruitment or selection', or null")
    prohibited_practice: str | None
    art6_3_derogation: Derogation
    transparency_obligations: list[str] = Field(description="e.g. ['Art. 50(1)']; empty if none")
    gpai: bool = Field(description="True only if the organisation itself provides a general-purpose AI model")
    confidence: float = Field(ge=0, le=1)
    rationale: str
    decision_path: list[DecisionStep]
    missing_information: list[str] = Field(description="Facts that would be needed to be certain; empty if none")


def _article(n: str) -> str:
    a = next(x for x in kb.ai_act()["articles"] if str(x["number"]) == n)
    text = a.get("text_as_amended") or a["text"]
    amendments = [m["instruction"] for m in kb.ai_act()["amendments_2026_1744"] if f"AIA-Art.{n}" in m["targets"]] if a.get("amendments") and not a.get("text_as_amended") else []
    return f"Article {n} — {a['title']}\n{text}" + ("\n\nAmendments by Regulation (EU) 2026/1744 (apply them when reading the article above):\n" + "\n".join(amendments) if amendments else "")


def classify(system: dict, passages: list[dict]) -> tuple[dict, str]:
    provider, model, label = _model("eu_ai_act")
    overlay = kb.ai_act_overlay()
    annex_iii = next(x for x in kb.ai_act()["annexes"] if x["number"] == "III")
    tree = "\n".join(f"Step {s['step']}: {s['question']} (basis: {', '.join(s['basis'])})" for s in overlay["classification_decision_tree"])
    system_prompt = ("You are the EU AI Act Specialist of an AI governance tool. Classify an AI system under Regulation (EU) 2024/1689 "
                     "as amended by Regulation (EU) 2026/1744, following the decision steps in order and recording each answer.\n\n" + RULES +
                     "\n- When facts are missing, choose the class supported by what is known, lower the confidence and list what is missing."
                     "\n- A human will review your proposal before it takes effect.")
    user = (f"AI system:\n{system_card(system)}\n\nDecision steps:\n{tree}\n\n{_article('5')}\n\n{_article('6')}\n\n"
            f"Annex III — {annex_iii['title']}\n{annex_iii['text']}\n\n{_article('50')}\n\n{passages_block(passages)}")
    result = provider.complete(model, system_prompt, user, schema=Classification)
    out = result.parsed.model_dump()
    valid = kb.requirements()
    for s in out["decision_path"]:
        s["basis"] = [b for b in s["basis"] if b in valid]
    return out, label


# ------------------------------------------------------------------ EU AI Act: obligations
class FindingsOut(BaseModel):
    findings: list[Finding]
    summary: str = Field(description="Two sentences")


def _obligation_refs(risk_class: str, org_role: str) -> list[str]:
    roles = {r["id"]: r["obligations"] for r in kb.ai_act_overlay()["roles"]}
    if risk_class in ("high-risk-annex-i", "high-risk-annex-iii"):
        refs = roles.get(org_role if org_role in roles else "deployer", roles["deployer"])
        if org_role in ("unknown",):
            refs = roles["provider"] + roles["deployer"]
    elif risk_class == "limited-transparency":
        refs = ["AIA-Art.50", "AIA-Art.4"]
    elif risk_class == "prohibited":
        refs = ["AIA-Art.5"]
    else:
        refs = ["AIA-Art.4"]
    return list(dict.fromkeys(r for r in refs if r.startswith("AIA-Art.")))


def ai_act_obligations(system: dict, passages: list[dict], risk_class: str, org_role: str) -> tuple[list[dict], dict, str]:
    provider, model, label = _model("eu_ai_act")
    refs = _obligation_refs(risk_class, org_role)
    arts = {a["id"]: a for a in kb.ai_act()["articles"]}
    extra = {r: (arts[r].get("text_as_amended") or arts[r]["text"])[:500].replace("\n", " ") + "…" for r in refs if r in arts}
    system_prompt = ("You are the EU AI Act Specialist. The system below has been classified by a human reviewer. "
                     "Assess, requirement by requirement, whether the evidence shows the obligation is met.\n\n" + RULES)
    user = (f"AI system:\n{system_card(system)}\n\nApproved risk class: {risk_class}. Role of the organisation: {org_role}.\n\n"
            f"Requirements to assess (give one finding for each):\n{requirement_lines(refs, extra)}\n\n{passages_block(passages)}")
    result = provider.complete(model, system_prompt, user, schema=FindingsOut)
    kept, dropped = validate_findings(result.parsed.findings, set(refs), passages, limit=30)
    return kept, {"summary": result.parsed.summary, "requirements_assessed": len(refs), "dropped": dropped}, label


# ------------------------------------------------------------------ GDPR
class GdprOut(BaseModel):
    personal_data: bool
    legal_basis: str | None = Field(description="Legal basis under Art. 6 identified in the evidence, or null")
    dpia_required: bool
    dpia_rationale: str
    automated_decision_art22: bool
    transfers_outside_eu: bool
    summary: str
    findings: list[Finding]


def gdpr(system: dict, passages: list[dict], risk_class: str) -> tuple[list[dict], dict, str]:
    provider, model, label = _model("gdpr")
    idx = kb.gdpr_index()
    refs = [a["id"] for a in idx]
    system_prompt = ("You are the Data Protection & GDPR Specialist of an AI governance tool. Screen an AI system under Regulation (EU) 2016/679: "
                     "whether personal data are processed, the legal basis, whether a DPIA is required (Art. 35), whether Art. 22 applies, "
                     "and whether data are transferred outside the EU (for example to a model provider's API). Then give findings for the "
                     "articles the evidence lets you assess, plus a 'gap' or 'insufficient_evidence' finding for Art. 35, Art. 30 and Art. 6 "
                     "whenever personal data are processed. At most 12 findings.\n\n" + RULES)
    user = (f"AI system:\n{system_card(system)}\n\nEU AI Act risk class approved by the reviewer: {risk_class}\n\n"
            f"Articles you may reference:\n{requirement_lines(refs, {a['id']: a['ai_relevance'] for a in idx})}\n\n{passages_block(passages)}")
    result = provider.complete(model, system_prompt, user, schema=GdprOut)
    out = result.parsed
    kept, dropped = validate_findings(out.findings, set(refs), passages, limit=12)
    return kept, {**out.model_dump(exclude={"findings"}), "dropped": dropped}, label


# ------------------------------------------------------------------ ISO/IEC 42001
def iso_42001(system: dict, passages: list[dict]) -> tuple[list[dict], dict, str]:
    provider, model, label = _model("iso_42001")
    iso = kb.iso_requirements()
    refs = [c["id"] for c in iso["clauses"]] + [c["id"] for c in iso["annex_a_controls"]]
    extra = {c["id"]: c["summary_paraphrased"] for c in iso["clauses"]}
    extra.update({c["id"]: c["control"] for c in iso["annex_a_controls"] if c.get("control")})
    system_prompt = ("You are the ISO/IEC 42001 Auditor of an AI governance tool. Using audit practice (evidence-based, no assumptions), "
                     "identify which clauses and Annex A controls the evidence addresses for this AI system and where nonconformities are likely. "
                     "Report the 15 most significant findings: prioritise gaps, then partial conformities, then conformities.\n\n" + RULES)
    user = (f"AI system:\n{system_card(system)}\n\nClauses and Annex A controls you may reference:\n{requirement_lines(refs, extra)}\n\n{passages_block(passages)}")
    result = provider.complete(model, system_prompt, user, schema=FindingsOut)
    kept, dropped = validate_findings(result.parsed.findings, set(refs), passages, limit=15)
    return kept, {"summary": result.parsed.summary, "dropped": dropped,
                  "control_text_available": any(c.get("control") for c in iso["annex_a_controls"])}, label


# ------------------------------------------------------------------ NIST AI RMF
class Maturity(BaseModel):
    GOVERN: int = Field(ge=0, le=5)
    MAP: int = Field(ge=0, le=5)
    MEASURE: int = Field(ge=0, le=5)
    MANAGE: int = Field(ge=0, le=5)


class NistOut(BaseModel):
    maturity: Maturity
    summary: str
    findings: list[Finding]


def nist(system: dict, passages: list[dict]) -> tuple[list[dict], dict, str]:
    provider, model, label = _model("nist")
    refs = [s["id"] for s in kb.nist_core()]
    system_prompt = ("You are the NIST AI RMF Specialist of an AI governance tool. Assess the organisation's practice for this AI system against "
                     "AI RMF 1.0. Give a maturity level per function on this application-defined scale: 0 = no evidence, 1 = ad hoc, "
                     "2 = some documented practice, 3 = defined and applied, 4 = measured, 5 = continuously improved. Base levels only on the "
                     "evidence passages. Then report the 15 most significant subcategory findings.\n\n" + RULES)
    user = f"AI system:\n{system_card(system)}\n\nSubcategories you may reference:\n{requirement_lines(refs)}\n\n{passages_block(passages)}"
    result = provider.complete(model, system_prompt, user, schema=NistOut)
    out = result.parsed
    kept, dropped = validate_findings(out.findings, set(refs), passages, limit=15)
    return kept, {"maturity": out.maturity.model_dump(), "summary": out.summary, "dropped": dropped}, label


# ------------------------------------------------------------------ Risk identification (Crosswalk & Risk Engine)
class RiskItem(BaseModel):
    risk_id: str = Field(description="Identifier from the list, e.g. mit-ai-risk-subdomain-1.1")
    likelihood: int = Field(ge=1, le=5)
    severity: int = Field(ge=1, le=5)
    rationale: str


class RisksOut(BaseModel):
    risks: list[RiskItem]


def risks(system: dict, risk_class: str, findings: list[dict]) -> tuple[list[dict], list[dict], str]:
    provider, model, label = _model("crosswalk")
    subs = {s["id"]: s for s in kb.mit_subdomains()}
    gaps = [f"{f['requirement_ref']} ({f['status']})" for f in findings if f["status"] in ("gap", "partial")][:30]
    system_prompt = ("You are the Crosswalk & Risk Engine of an AI governance tool. From the MIT AI Risk Repository domain taxonomy, select the "
                     "risks that genuinely apply to this AI system (at most 8) and score each: likelihood 1 (rare) to 5 (almost certain) and "
                     "severity 1 (negligible) to 5 (severe), before mitigation. For autonomous agents, weigh the tools they can use, write "
                     "access and autonomy level. Use only the risk identifiers listed. A human will review the scores.")
    user = (f"AI system:\n{system_card(system)}\n\nEU AI Act risk class: {risk_class}\nOpen gaps found by the other agents: {', '.join(gaps) or 'none'}\n\n"
            "Risks:\n" + "\n".join(f"{s['id']} — {s['domain']} / {s['name']}: {s['description']}" for s in subs.values()))
    result = provider.complete(model, system_prompt, user, schema=RisksOut)
    kept, dropped, seen = [], [], set()
    for r in result.parsed.risks:
        if r.risk_id not in subs or r.risk_id in seen or len(kept) >= 8:
            dropped.append({"risk_id": r.risk_id, "reason": "unknown, duplicate or over the limit"})
            continue
        seen.add(r.risk_id)
        kept.append({"risk_id": r.risk_id, "likelihood": r.likelihood, "severity": r.severity, "rationale": r.rationale,
                     "mitigating_objectives": subs[r.risk_id]["mitigating_objectives"]})
    return kept, dropped, label


# ------------------------------------------------------------------ Synthesis (Orchestrator)
def synthesis(system: dict, results: dict, counts: dict, risk_count: int) -> tuple[str, str]:
    provider, model, label = _model("orchestrator")
    import json
    system_prompt = ("You are the Orchestrator of an AI governance tool. Write an executive synthesis of an assessment for a board reader: "
                     "at most 150 words, plain prose, no headings or lists. State the risk class, the main gaps and what to do first. "
                     "Use only the facts given. Everything below was proposed by AI agents and still needs human review: say so in the last sentence.")
    user = f"AI system: {system['name']}\nResults: {json.dumps(results, default=str)[:6000]}\nFinding counts by framework: {json.dumps(counts)}\nRisks identified: {risk_count}"
    result = provider.complete(model, system_prompt, user, max_tokens=2000)
    return (result.text or "").strip(), label
