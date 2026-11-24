"""Read-only access to the normative knowledge base mounted at KB_DIR."""
import functools
import glob
import json
import os

from . import config


def _load(rel: str) -> dict:
    with open(os.path.join(config.KB_DIR, rel), encoding="utf-8") as f:
        return json.load(f)


@functools.lru_cache(maxsize=1)
def control_objectives() -> list[dict]:
    return _load("crosswalks/common_control_objectives.json")["common_control_objectives"]


@functools.lru_cache(maxsize=1)
def cco_index() -> dict[str, dict]:
    return {c["id"]: c for c in control_objectives()}


@functools.lru_cache(maxsize=1)
def iso_requirements() -> dict:
    """The licensed edition (with control statements) is used when the owner has placed it
    next to the public one; it is never committed to the repository."""
    licensed = "frameworks/iso_42001/requirements.licensed.json"
    if os.path.exists(os.path.join(config.KB_DIR, licensed)):
        return _load(licensed)
    return _load("frameworks/iso_42001/requirements.json")


@functools.lru_cache(maxsize=1)
def summary() -> dict:
    ai_act = _load("frameworks/eu_ai_act/articles.json")
    iso = iso_requirements()
    risks = _load("risk-taxonomy/ibm_ai_risk_atlas.json")["entries"]
    mit = _load("risk-taxonomy/mit_ai_risk_database_v4.json")["risks"]
    sources = _load("sources/manifest.json")["sources"]
    return {
        "frameworks": [
            {"id": "eu-ai-act", "name": "EU AI Act", "requirements": len(ai_act["articles"]) + len(ai_act["annexes"])},
            {"id": "gdpr", "name": "GDPR", "requirements": len(_load("frameworks/gdpr/articles.json")["articles"])},
            {"id": "iso-42001", "name": "ISO/IEC 42001", "requirements": len(iso["clauses"]) + len(iso["annex_a_controls"])},
            {"id": "nist-ai-rmf", "name": "NIST AI RMF", "requirements": len(_load("frameworks/nist_ai_rmf/core.json")["subcategories"])},
        ],
        "common_control_objectives": len(control_objectives()),
        "templates": len([p for p in glob.glob(os.path.join(config.KB_DIR, "templates", "*.md")) if not os.path.basename(p).startswith("_")]),
        "risks": len(risks) + len(mit),
        "sources": [{"id": s["id"], "title": s["title"], "version": s.get("version"), "status": s.get("status"),
                     "verification": s.get("verification")} for s in sources],
    }


FRAMEWORK_OF = {"AIA": "eu-ai-act", "GDPR": "gdpr", "ISO42001": "iso-42001", "NIST": "nist-ai-rmf"}


def framework_of(ref: str) -> str:
    return FRAMEWORK_OF.get(ref.split("-")[0], "other")


@functools.lru_cache(maxsize=1)
def ai_act() -> dict:
    return _load("frameworks/eu_ai_act/articles.json")


@functools.lru_cache(maxsize=1)
def ai_act_overlay() -> dict:
    return _load("frameworks/eu_ai_act/classification_roles_timeline.json")


@functools.lru_cache(maxsize=1)
def gdpr_index() -> list[dict]:
    return _load("frameworks/gdpr/ai_relevant_articles.json")["articles"]


@functools.lru_cache(maxsize=1)
def nist_core() -> list[dict]:
    return _load("frameworks/nist_ai_rmf/core.json")["subcategories"]


@functools.lru_cache(maxsize=1)
def requirements() -> dict[str, dict]:
    """Every requirement the app can reference: ref -> {ref, framework, title}."""
    out: dict[str, dict] = {}
    a = ai_act()
    for x in a["articles"]:
        out[x["id"]] = {"ref": x["id"], "framework": "eu-ai-act", "title": x.get("title_as_amended") or x["title"]}
    for x in a["annexes"]:
        out[x["id"]] = {"ref": x["id"], "framework": "eu-ai-act", "title": x["title"]}
    for x in _load("frameworks/gdpr/articles.json")["articles"]:
        out[x["id"]] = {"ref": x["id"], "framework": "gdpr", "title": x["title"]}
    iso = iso_requirements()
    for x in iso["clauses"] + iso["annex_a_controls"]:
        out[x["id"]] = {"ref": x["id"], "framework": "iso-42001", "title": x["title"]}
    for x in nist_core():
        out[x["id"]] = {"ref": x["id"], "framework": "nist-ai-rmf", "title": x["text"]}
    return out


@functools.lru_cache(maxsize=1)
def mit_subdomains() -> list[dict]:
    d = _load("risk-taxonomy/mit_ai_risk_taxonomies.json")
    groups = {g["id"]: g["name"] for g in d["groups"]}
    links = {m["risk"]: m["mitigating_objectives"] for m in _load("crosswalks/risk/mit_subdomain_to_control_objectives.json")["mappings"]}
    out = []
    for e in d["entries"]:
        if e["id"].startswith("mit-ai-risk-subdomain-"):
            part = e.get("isPartOf")
            part = part[0] if isinstance(part, list) and part else part
            out.append({"id": e["id"], "name": e["name"], "description": e.get("description"), "domain": groups.get(part, ""),
                        "mitigating_objectives": links.get(e["id"], [])})
    return out


@functools.lru_cache(maxsize=1)
def agentic_risks() -> list[dict]:
    import re
    out = []
    for e in _load("risk-taxonomy/owasp_agentic_top10_2026.json")["entries"]:
        m = re.match(r"(ASI\d+)(?::\d+)?\s+(.*)", e["name"])
        out.append({"id": m.group(1) if m else e["id"], "name": m.group(2) if m else e["name"], "description": e.get("description")})
    return out


# ------------------------------------------------------------------ Milestone 3 lookups
SOURCE_OF = {"eu-ai-act": "eu-ai-act-2024-1689-oj", "gdpr": "gdpr-2016-679", "iso-42001": "iso-iec-42001-2023", "nist-ai-rmf": "nist-ai-100-1"}
ASSESSMENT_TYPES = ("fria", "annex-iv-technical-documentation", "ai-enhanced-dpia", "ropa-ai-processing",
                    "legitimate-interest-assessment", "art22-automated-decision-assessment", "transfer-impact-assessment")


@functools.lru_cache(maxsize=1)
def _details() -> dict[str, dict]:
    out: dict[str, dict] = {}
    a = ai_act()
    amend = {m["id"]: m for m in a["amendments_2026_1744"]}
    for x in a["articles"] + a["annexes"]:
        is_article = "chapter" in x
        out[x["id"]] = {"group": (x.get("chapter") or "Inserted by Regulation (EU) 2026/1744") if is_article else "Annexes",
                        "citation": x["citation"], "text": x.get("text_as_amended") or x.get("text"), "summary": None,
                        "status_note": (x.get("status") if x.get("amendments") else None) or (f"inserted by {x['inserted_by']}" if x.get("inserted_by") else None),
                        "amendments": [{"citation": m["citation"], "instruction": amend[m["amendment_id"]]["instruction"]} for m in x.get("amendments", [])
                                       if not x.get("text_as_amended")]}
    relevance = {g["id"]: g["ai_relevance"] for g in gdpr_index()}
    for x in _load("frameworks/gdpr/articles.json")["articles"]:
        out[x["id"]] = {"group": x.get("chapter") or "GDPR", "citation": x["citation"], "text": x["text"], "summary": relevance.get(x["id"]),
                        "status_note": None, "amendments": []}
    iso = iso_requirements()
    for x in iso["clauses"]:
        out[x["id"]] = {"group": "Clauses 4–10", "citation": x["citation"], "text": None, "summary": x["summary_paraphrased"], "status_note": None, "amendments": []}
    for x in iso["annex_a_controls"]:
        out[x["id"]] = {"group": "Annex A", "citation": x["citation"], "text": x.get("control"), "summary": f"Objective {x['objective']}: {x['objective_title']}",
                        "status_note": None, "amendments": []}
    for x in nist_core():
        out[x["id"]] = {"group": x["function"], "citation": x["citation"], "text": x["text"], "summary": None, "status_note": None, "amendments": []}
    return out


@functools.lru_cache(maxsize=1)
def objectives_of() -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for cco in control_objectives():
        for r in cco["requirements"]:
            out.setdefault(r["ref"], []).append({"id": cco["id"], "name_en": cco["name_en"], "strength": r["strength"]})
    return out


@functools.lru_cache(maxsize=1)
def _sources() -> dict[str, dict]:
    return {s["id"]: s for s in _load("sources/manifest.json")["sources"]}


def requirement_detail(ref: str) -> dict | None:
    base = requirements().get(ref)
    if not base:
        return None
    related: dict[str, dict] = {}
    for mine in objectives_of().get(ref, []):
        cco = cco_index()[mine["id"]]
        for r in cco["requirements"]:
            if r["ref"] == ref or r["framework"] == base["framework"]:
                continue
            relation = "closeMatch" if mine["strength"] == r["strength"] == "primary" else "relatedMatch"
            if r["ref"] not in related or (relation == "closeMatch" and related[r["ref"]]["relation"] != "closeMatch"):
                related[r["ref"]] = {"ref": r["ref"], "framework": r["framework"], "title": requirements().get(r["ref"], {}).get("title", r["ref"]),
                                     "via": cco["id"], "relation": relation}
    src = _sources().get(SOURCE_OF.get(base["framework"], ""), {})
    return {**base, **_details().get(ref, {}), "objectives": objectives_of().get(ref, []),
            "related": sorted(related.values(), key=lambda r: (r["framework"], r["relation"] != "closeMatch", r["ref"])),
            "source": {"id": src.get("id"), "title": src.get("title"), "version": src.get("version"), "verification": src.get("verification")}}


def group_of(ref: str) -> str:
    return _details().get(ref, {}).get("group", "")


def ai_act_overview() -> dict:
    o = ai_act_overlay()
    amended = o["timeline"]["as_amended_by_reg_2026_1744"]
    return {"risk_classes": [{"id": c["id"], "label_en": c["label_en"], "basis": c["basis"]} for c in o["risk_classes"]],
            "decision_tree": o["classification_decision_tree"], "roles": [{"id": r["id"], "obligations": r["obligations"]} for r in o["roles"]],
            "timeline": amended["entries"], "timeline_verification": amended["verification"],
            "penalties": o["penalties_original_art_99"]["tiers"], "key_changes": amended.get("key_changes", []), "guidance": o["guidance_register"]}


AGENT_FOR_CATEGORY = {"eu-ai-act": ("eu_ai_act", "EU AI Act Specialist"), "gdpr": ("gdpr", "Data Protection & GDPR Specialist")}


@functools.lru_cache(maxsize=16)
def template(type_id: str) -> dict | None:
    """Parses a deliverable template into its sections (title, legal basis, where the content comes from, guidance)."""
    import re
    if type_id not in ASSESSMENT_TYPES:
        return None
    raw = open(os.path.join(config.KB_DIR, "templates", type_id + ".md"), encoding="utf-8").read()
    _, front, body = raw.split("---", 2)
    meta = dict(re.findall(r"(?m)^(\w+):\s*(.*)$", front))
    try:
        legal_basis = json.loads(meta.get("legal_basis", "[]"))
    except json.JSONDecodeError:
        legal_basis = []
    sections = []
    for m in re.finditer(r"(?ms)^## (.+?)\n(.*?)(?=^## |\Z)", body):
        title, content = m.group(1).strip(), m.group(2)
        if re.search(r"sources and evidence|approval and sign-off|document control", title, re.I):
            continue
        c = re.search(r"<!--\s*basis:\s*(.*?)\s*\|\s*fill:\s*(\w+)\s*\|\s*evidence:\s*(\w+)\s*-->", content)
        g = re.search(r"(?m)^[_*](.+?)[_*]\s*$", content)
        guidance = " ".join(s for s in re.split(r"(?<=[.!?])\s+", g.group(1)) if "{{" not in s) if g else ""
        num = re.match(r"(\d+(?:\.\d+)?)[.)]?\s+(.*)", title)
        sections.append({"id": f"s{len(sections)}", "number": num.group(1) if num else str(len(sections)), "title": num.group(2) if num else title,
                         "basis": c.group(1) if c else "", "fill": c.group(2) if c else "user", "guidance": guidance})
    role, agent = AGENT_FOR_CATEGORY.get(meta.get("category", ""), ("orchestrator", "Orchestrator"))
    return {"id": type_id, "title_en": meta.get("title_en", type_id), "category": meta.get("category", ""), "legal_basis": legal_basis,
            "agent": agent, "agent_role": role, "sections": sections}


def assessment_types() -> list[dict]:
    return [{k: (len(v) if k == "sections" else v) for k, v in template(t).items() if k != "agent_role"} for t in ASSESSMENT_TYPES]
