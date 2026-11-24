"""Drafts the sections of an assessment document (FRIA, DPIA, LIA, TIA, Art. 22, RoPA, Annex IV).

The structure comes from the knowledge-base template, which mirrors the legal provision.
The agent writes only from the evidence passages and the system record; where the
organisation must decide or supply facts, it lists questions instead of inventing content.
"""
import json

from pydantic import BaseModel, Field

from .. import kb
from ..llm import registry
from ..llm.base import LLMError
from .common import RULES, EvidenceRef, norm, passages_block, system_card


class SectionDraft(BaseModel):
    id: str = Field(description="Section identifier exactly as given, e.g. s3")
    content: str = Field(description="Draft text in Markdown; empty string if nothing can be written from the evidence")
    evidence: list[EvidenceRef] = []
    needs_input: list[str] = Field(default=[], description="Questions the organisation must answer to complete this section")


class Draft(BaseModel):
    sections: list[SectionDraft]


def draft(template: dict, system: dict, passages: list[dict], context: dict, section_ids: list[str]) -> tuple[dict[str, dict], str, str]:
    resolved = registry.resolve(template["agent_role"])
    if resolved is None:
        raise LLMError("No reasoning model is configured in Settings")
    provider, model, label = resolved
    wanted = [s for s in template["sections"] if s["id"] in section_ids]
    listing = "\n".join(f"{s['id']} — {s['number']}. {s['title']}\n   Legal basis: {s['basis']}\n   Content comes from: "
                        f"{ {'rag': 'the evidence passages', 'user': 'the organisation (ask, do not invent)', 'computed': 'the system record and results below', 'kb': 'the legal basis itself'}.get(s['fill'], s['fill']) }"
                        f"\n   Guidance: {s['guidance']}" for s in wanted)
    system_prompt = (f"You are the {template['agent']} of an AI governance tool. Draft the sections of a \"{template['title_en']}\" for the AI system below.\n\n" + RULES +
                     "\n- Write only what the evidence passages or the system record support. Never invent facts, names, dates, numbers or measures."
                     "\n- For sections whose content must come from the organisation, write what the evidence already shows, if anything, and put the open points in needs_input as questions."
                     "\n- If nothing can be written for a section, return an empty content and explain what is missing in needs_input."
                     "\n- Plain professional prose, short paragraphs or bullet lists. No headings (the section title is added by the application)."
                     "\n- Return one entry for every section id listed. A qualified person will review and approve the document.")
    user = (f"AI system:\n{system_card(system)}\n\nResults already established:\n{json.dumps(context, default=str)[:5000]}\n\n"
            f"Sections to draft:\n{listing}\n\n{passages_block(passages)}")
    result = provider.complete(model, system_prompt, user, schema=Draft)
    by_n = {p["n"]: p for p in passages}
    out: dict[str, dict] = {}
    allowed = {s["id"] for s in wanted}
    for d in result.parsed.sections:
        if d.id not in allowed or d.id in out:
            continue
        evidence = []
        for e in d.evidence[:5]:
            p = by_n.get(e.passage)
            if p:
                evidence.append({"document_id": p["document_id"], "filename": p["filename"], "page": p["page"], "section": p["section"],
                                 "quote": e.quote[:500], "quote_verified": bool(e.quote.strip()) and norm(e.quote) in norm(p["text"])})
        content = d.content.strip()
        out[d.id] = {"content": content, "evidence": evidence, "needs_input": [q.strip() for q in d.needs_input if q.strip()][:8],
                     "source": "ai" if content else "empty", "supported": (not content) or any(e["quote_verified"] for e in evidence)}
    return out, label, result.model
