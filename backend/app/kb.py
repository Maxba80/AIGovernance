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
