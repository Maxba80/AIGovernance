# API contract — Milestone 3 (additions to M1 and M2)

Same conventions. Requirement status values everywhere: `compliant | partial | gap | not_applicable | evidence_present | not_assessed`.

## Knowledge base (not workspace-scoped)

- `GET /api/kb/requirements/{ref}` →
```json
{"ref": "AIA-Art.10", "framework": "eu-ai-act", "title": "…", "group": "CHAPTER III — HIGH-RISK AI SYSTEMS",
 "citation": "Regulation (EU) 2024/1689, Article 10", "text": "full text or null (ISO: null in the public edition)",
 "summary": "paraphrased summary or null", "status_note": "amended by Regulation (EU) 2026/1744 — … or null",
 "amendments": [{"citation": "Regulation (EU) 2026/1744, Article 1(9)", "instruction": "verbatim amending text"}],
 "objectives": [{"id": "CCO-07", "name_en": "…", "strength": "primary | supporting"}],
 "related": [{"ref": "ISO42001-A.7.4", "framework": "iso-42001", "title": "…", "via": "CCO-07", "relation": "closeMatch | relatedMatch"}],
 "source": {"id": "eu-ai-act-2024-1689-oj", "title": "…", "version": "…", "verification": "…"}}
```
- `GET /api/kb/eu-ai-act/overview` → `{risk_classes: [{id, label_en, basis: [ref]}], decision_tree: [{step, question, basis: [ref], yes, no}], roles: [{id, obligations: [ref]}], timeline: [{date, what, basis}], timeline_verification: "…", penalties: [{infringement, max_eur, max_turnover_pct}], key_changes: [{article, change}], guidance: [{title, date, status, verification, url?}]}`
- `GET /api/kb/assessment-types` → `[{id: "fria", title_en, category: "eu-ai-act | gdpr", legal_basis: ["…"], agent: "EU AI Act Specialist", sections: 9}]`. Types offered: `fria`, `annex-iv-technical-documentation`, `ai-enhanced-dpia`, `ropa-ai-processing`, `legitimate-interest-assessment`, `art22-automated-decision-assessment`, `transfer-impact-assessment`.

## Framework modules

- `GET /api/workspaces/{wid}/frameworks/{fid}` (`fid`: `eu-ai-act | gdpr | iso-42001 | nist-ai-rmf`) →
```json
{"id": "iso-42001", "name": "ISO/IEC 42001", "counts": {"total": 65, "compliant": 1, "partial": 2, "gap": 3, "evidence_present": 6, "not_applicable": 0, "not_assessed": 53},
 "groups": ["Clauses 4–10", "Annex A"],
 "requirements": [{"ref": "ISO42001-A.7.4", "title": "…", "group": "Annex A", "status": "partial",
                   "objectives": ["CCO-07", "CCO-08"], "evidence_documents": 2,
                   "findings": [{"system_id": "uuid", "system_name": "…", "status": "partial", "review_status": "approved", "origin": "agent"}]}]}
```
For GDPR only the AI-relevant articles are listed (30). For the EU AI Act: articles and annexes.

- `GET /api/workspaces/{wid}/systems/{id}/obligations` → `{risk_class, org_role, basis_note, obligations: [{ref, title, status, review_status: "proposed | approved | rejected | null", finding_id: "uuid or null"}]}` — the EU AI Act obligations that apply to this system given its approved class and role. 409 if the system has no approved class.

### ISO/IEC 42001: Statement of Applicability
Row: `{control_ref: "ISO42001-A.2.2", control_id: "A.2.2", title, objective: "A.2", objective_title, applicable: true, justification: "…", implementation_status: "not_started | in_progress | implemented", owner: "…", notes: "…", status: "<requirement status>", evidence_documents: [{id, filename}], updated_at, updated_by}`
- `GET /api/workspaces/{wid}/iso/soa` → `[row]` (always 38 rows; defaults: applicable true, not_started)
- `PUT /api/workspaces/{wid}/iso/soa/{control_ref}` `{applicable, justification, implementation_status, owner, notes}` → row. 422 if `applicable` is false and `justification` is empty.

### Nonconformities and CAPA
NC: `{id, requirement_ref, requirement_title, system_id, system_name, finding_id, grade: "major | minor | observation | opportunity", title, description, root_cause, correction, corrective_action, owner, due_date: "YYYY-MM-DD or null", status: "open | in_progress | implemented | verified | closed", created_at, closed_at, verified_by}`
- `GET /api/workspaces/{wid}/nonconformities?status=` → `[nc]`
- `POST /api/workspaces/{wid}/nonconformities` `{requirement_ref, title, grade, description?, system_id?, finding_id?, owner?, due_date?}` → nc
- `PUT /api/workspaces/{wid}/nonconformities/{id}` (any editable field) → nc. Setting status `verified` or `closed` records the user as `verified_by`; `closed` requires `corrective_action`, else 422.
- `DELETE /api/workspaces/{wid}/nonconformities/{id}` → 204

### NIST AI RMF scorecard
- `GET /api/workspaces/{wid}/nist/scorecard` → `{scale_note: "…", functions: [{id: "GOVERN", description, maturity: 2.0 or null, systems: [{system_id, name, level, run_id}], counts: {…requirement status counts…}, categories: [{id: "GOVERN 1", subcategories: [{ref, text, status}]}]}]}`. `maturity` is the average of the latest completed run of each system; null if none.

## Assisted assessments (FRIA, DPIA, LIA, TIA, Art. 22, RoPA, Annex IV)

Assessment:
```json
{"id": "uuid", "system_id": "uuid", "system_name": "…", "type": "fria", "title": "Fundamental Rights Impact Assessment — CV Screening",
 "category": "eu-ai-act", "legal_basis": ["Reg. (EU) 2024/1689 Art. 27"], "status": "draft | drafting | in_review | approved | rejected",
 "version": 1, "agent": "EU AI Act Specialist", "model": "provider/model or null", "draft_error": null,
 "content_hash": "sha256 of the approved content or null", "approved_by": null, "approved_at": null, "pending_approval_id": null,
 "sections": [{"id": "s1", "number": "1", "title": "Deployer's processes", "basis": "Art. 27(1)(a)", "fill": "rag | user | computed | kb",
               "guidance": "what belongs here", "content": "markdown text", "source": "empty | ai | user | ai_edited",
               "evidence": [{"document_id", "filename", "page", "section", "quote", "quote_verified"}],
               "needs_input": ["question the reviewer must answer"], "supported": true}],
 "created_at": "…", "updated_at": "…"}
```
`supported` is false when an AI-written section has no verified quote behind it.
- `GET /api/workspaces/{wid}/assessments?system_id=` → `[assessment without sections]`
- `POST /api/workspaces/{wid}/assessments` `{system_id, type}` → assessment (sections empty, from the template). 409 if a non-rejected assessment of that type already exists for the system.
- `GET /api/workspaces/{wid}/assessments/{id}` → assessment
- `POST /api/workspaces/{wid}/assessments/{id}/draft` → assessment with status `drafting` (the agent fills sections that are still `empty` or `ai`; sections edited by the user are never overwritten). 409 if no model configured or already drafting/in review/approved. Poll every 2 s while `drafting`.
- `PUT /api/workspaces/{wid}/assessments/{id}/sections/{section_id}` `{content}` → assessment. Only in `draft` or `rejected` (rejected goes back to draft on edit). 409 otherwise.
- `POST /api/workspaces/{wid}/assessments/{id}/submit` → assessment `in_review`, creates an approval of kind `assessment_document` (payload: `{assessment_id, system_id, type, title, version, sections_total, sections_empty, sections_unsupported}`). 409 if drafting.
- Deciding the approval: approve → `approved` with `content_hash`; reject → `rejected`.
- `POST /api/workspaces/{wid}/assessments/{id}/revise` → new `draft` with `version + 1` (only from `approved`; the approved hash stays in the audit trail).
- `DELETE /api/workspaces/{wid}/assessments/{id}` → 204 (not when approved: 409)

## Compliance graph
- `GET /api/workspaces/{wid}/graph` →
```json
{"nodes": [{"id": "CCO-07", "type": "objective", "label": "Data governance and data quality", "status": "evidence_present"},
           {"id": "AIA-Art.10", "type": "requirement", "framework": "eu-ai-act", "label": "Art. 10", "title": "Data and data governance", "status": "partial"},
           {"id": "doc:uuid", "type": "document", "label": "Data Governance Policy.md", "doc_type": "policy"},
           {"id": "sys:uuid", "type": "system", "label": "CV Screening", "risk_class": "high-risk-annex-iii", "kind": "system"}],
 "edges": [{"source": "AIA-Art.10", "target": "CCO-07", "type": "belongs_to", "strength": "primary"},
           {"source": "doc:uuid", "target": "CCO-07", "type": "evidence", "status": "approved | proposed", "page": 4},
           {"source": "sys:uuid", "target": "AIA-Art.10", "type": "finding", "status": "gap", "review_status": "approved | proposed", "origin": "agent | crosswalk"}],
 "counts": {"compliant": 0, "partial": 0, "gap": 0, "evidence_present": 0, "not_assessed": 0}}
```
Requirement nodes: every requirement that belongs to at least one objective (about 210). Objective status: `gap` if any primary requirement is a gap, else `partial`, else `compliant` if all primary are compliant, else `evidence_present` if it has approved evidence, else `not_assessed`.

## Audit export
- `GET /api/audit/export` → `application/x-ndjson` download, one entry per line, oldest first; the last line is `{"verify": {ok, checked, head_hash}}`.

## New approval kind
`assessment_document` (see above). The approval card should link to `/assessments/{assessment_id}`.
