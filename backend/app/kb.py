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
