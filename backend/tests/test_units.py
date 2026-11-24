"""Unit tests that need no database or network. Run: pytest backend/tests/test_units.py"""
import pytest
from pydantic import BaseModel

from app import audit
from app.ingestion import chunking, parsers, pipeline
from app.llm.base import extract_json


def test_markdown_sections_and_chunks_keep_location():
    blocks, pages = parsers.parse("p.md", b"# Title\nintro\n\n## 2. Data quality\nData must be good.\n")
    assert pages is None and [b.section for b in blocks] == ["Title", "2. Data quality"]
    chunks = chunking.chunk(blocks)
    assert [c.ordinal for c in chunks] == [0, 1] and chunks[1].section == "2. Data quality"


def test_long_text_is_split_with_overlap_and_nothing_is_lost():
    words = [f"w{i}" for i in range(2000)]
    chunks = chunking.chunk([parsers.Block(" ".join(words), page=3)])
    assert len(chunks) > 5 and all(len(c.text) <= chunking.TARGET + chunking.OVERLAP + 10 for c in chunks)
    assert all(c.page == 3 for c in chunks)
    assert set(words) <= set(" ".join(c.text for c in chunks).split())


def test_unsupported_and_empty_files_are_rejected():
    with pytest.raises(parsers.ParseError):
        parsers.parse("x.exe", b"MZ")
    with pytest.raises(parsers.ParseError):
        parsers.parse("x.txt", b"   \n")
    with pytest.raises(parsers.ParseError):
        parsers.parse("x.json", b"{not json")


def test_heading_detection():
    assert parsers.looks_like_heading("3.1 Data quality")
    assert parsers.looks_like_heading("Article 10")
    assert not parsers.looks_like_heading("This is an ordinary sentence that ends with a full stop.")


def test_excerpt_selection_reports_partial_coverage():
    small = [chunking.Chunk(i, "x" * 100, 1, None) for i in range(10)]
    assert pipeline.select_excerpts(small) == small
    big = [chunking.Chunk(i, "x" * 1000, 1, None) for i in range(300)]
    picked = pipeline.select_excerpts(big)
    assert len(picked) < len(big) and picked[0].ordinal == 0 and picked[-1].ordinal > 200
    assert sum(len(c.text) for c in picked) <= pipeline.EXCERPT_BUDGET + 1000


def test_audit_hash_changes_when_any_field_changes():
    entry = {"seq": 1, "ts": "2026-01-01T00:00:00+00:00", "workspace_id": None, "actor": "a", "actor_type": "user", "action": "x",
             "entity_type": None, "entity_id": None, "summary": "s", "payload": "{}", "model": None, "sources": "[]", "prev_hash": audit.GENESIS}
    h = audit.compute_hash(entry)
    assert len(h) == 64 and h == audit.compute_hash(dict(entry))
    for field in audit.FIELDS:
        changed = dict(entry, **{field: "changed"})
        assert audit.compute_hash(changed) != h, field


def test_extract_json_from_fenced_or_chatty_output():
    class M(BaseModel):
        a: int
    assert M.model_validate_json(extract_json('```json\n{"a": 1}\n```')).a == 1
    assert M.model_validate_json(extract_json('Sure! Here it is: {"a": 2} Hope it helps')).a == 2


def test_findings_validation_protects_accuracy(monkeypatch):
    from app import kb
    from app.agents import common
    monkeypatch.setattr(kb, "framework_of", lambda ref: "eu-ai-act")
    passages = [{"n": 1, "document_id": "d1", "filename": "p.pdf", "page": 2, "section": "S", "text": "Data sets must meet   quality requirements."}]
    F, E = common.Finding, common.EvidenceRef
    kept, dropped = common.validate_findings([
        F(requirement_ref="R1", status="partial", rationale="ok", evidence=[E(passage=1, quote="data sets must meet quality requirements")]),
        F(requirement_ref="R2", status="compliant", rationale="claims", evidence=[E(passage=1, quote="not in the text")]),
        F(requirement_ref="R3", status="gap", rationale="nothing", evidence=[]),
        F(requirement_ref="R9", status="gap", rationale="unknown id", evidence=[]),
        F(requirement_ref="R1", status="gap", rationale="duplicate", evidence=[]),
    ], {"R1", "R2", "R3"}, passages)
    by = {k["requirement_ref"]: k for k in kept}
    assert by["R1"]["status"] == "partial" and by["R1"]["evidence"][0]["quote_verified"] and by["R1"]["evidence"][0]["page"] == 2
    assert by["R2"]["status"] == "insufficient_evidence" and "Downgraded" in by["R2"]["rationale"]
    assert by["R3"]["status"] == "gap"  # a gap needs no quote
    assert {d["requirement_ref"] for d in dropped} == {"R9", "R1"}
