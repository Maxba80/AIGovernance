---
id: tpl-nist-maturity-scorecard
title_en: "NIST AI RMF Maturity Scorecard"
title_it: "Scorecard di maturità NIST AI RMF"
category: nist-ai-rmf
legal_basis: ["NIST AI 100-1 (AI RMF 1.0), Core: GOVERN, MAP, MEASURE, MANAGE", "NIST AI RMF 1.0, Section 6 (AI RMF Profiles)"]
related_frameworks: ["NIST AI RMF Playbook", "NIST AI 600-1", "ISO/IEC 42001:2023 9.1", "ISO/IEC 42001:2023 9.3", "Reg. (EU) 2024/1689 Art. 9", "Reg. (EU) 2024/1689 Art. 17"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: recommended
approver_role: "AI governance lead / Chief Risk Officer"
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited provisions; requires review by a qualified professional before use"
---
# {{title}}
| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} ({{ai_system.id}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} ({{doc.approver_role}}) |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

> Traceability rule: every filled value carries a citation marker `[S#]` that resolves to one row of "Sources and evidence". Values with no source are rendered as `{{flag.unsourced}}` and block approval.

<!-- xlsx: sheet "Summary" = section 3, "Categories" = section 4, "Subcategories" = section 5, "Actions" = section 6, "Sources" = Sources and evidence -->

## 1. Scope and assessment basis
<!-- basis: NIST AI RMF 1.0 Core; GOVERN 1.4 | fill: user | evidence: required -->
*State what is assessed (organisation, business unit or a single AI system) and the period. The AI RMF is voluntary and does not define maturity levels; the scale in section 2 is defined by this application and must not be presented as a NIST rating.*

| Element | Value |
|---|---|
| Assessment scope | {{scorecard.scope}} |
| Assessment period and date | {{scorecard.period}} / {{scorecard.date}} |
| Assessors | {{scorecard.assessors}} |
| Profile used (current / target; GenAI profile applied Y/N) | {{scorecard.profile}} |
| Previous scorecard reference | {{scorecard.previous_ref}} |

## 2. Maturity scale and scoring rules
<!-- basis: Application-defined scale (not part of NIST AI RMF 1.0) | fill: kb | evidence: optional -->
*Scale definition source: {{kb.nist_ai_rmf.maturity_scale}}. A level above 1 requires at least one cited piece of evidence; without evidence the score is capped at 1 and flagged.*

| Level | Name | Meaning |
|---|---|---|
| 0 | Not performed | No practice exists |
| 1 | Initial | Ad hoc, person-dependent, undocumented |
| 2 | Developing | Partly documented, applied inconsistently |
| 3 | Defined | Documented, approved and applied across the scope |
| 4 | Managed | Measured and monitored with defined metrics |
| 5 | Optimising | Continually improved on the basis of measurement and feedback |

Category score = mean of its subcategory scores; function score = mean of its category scores (no weighting unless stated: {{scorecard.weighting}}).

## 3. Summary by function
<!-- basis: NIST AI RMF 1.0 Core (4 functions, 19 categories, 72 subcategories) | fill: computed | evidence: required -->
*Computed from section 5. Coverage = share of subcategories with at least one validated evidence item.*

| Function | Categories | Subcategories | Current maturity (0-5) | Target maturity | Gap | Evidence coverage | Change vs previous |
|---|---|---|---|---|---|---|---|
| GOVERN | 6 | 19 | {{score.govern.current}} | {{score.govern.target}} | {{score.govern.gap}} | {{score.govern.coverage}} | {{score.govern.delta}} |
| MAP | 5 | 18 | {{score.map.current}} | {{score.map.target}} | {{score.map.gap}} | {{score.map.coverage}} | {{score.map.delta}} |
| MEASURE | 4 | 22 | {{score.measure.current}} | {{score.measure.target}} | {{score.measure.gap}} | {{score.measure.coverage}} | {{score.measure.delta}} |
| MANAGE | 4 | 13 | {{score.manage.current}} | {{score.manage.target}} | {{score.manage.gap}} | {{score.manage.coverage}} | {{score.manage.delta}} |
| Overall | 19 | 72 | {{score.overall.current}} | {{score.overall.target}} | {{score.overall.gap}} | {{score.overall.coverage}} | {{score.overall.delta}} |

Radar chart: {{score.radar_chart}}

## 4. Scores by category
<!-- basis: NIST AI RMF 1.0 Core, categories GOVERN 1-6, MAP 1-5, MEASURE 1-4, MANAGE 1-4 | fill: computed | evidence: required -->
*One row per category (19 rows). Category titles come from the knowledge base.*

| Function | Category ID | Category title | Subcategories | Current maturity | Target | Gap | Key strengths | Key weaknesses |
|---|---|---|---|---|---|---|---|---|
{{#each kb.nist_ai_rmf.categories}}
| {{function}} | {{category_id}} | {{category_title}} | {{subcategory_count}} | {{score.[category_id].current}} | {{score.[category_id].target}} | {{score.[category_id].gap}} | {{score.[category_id].strengths}} | {{score.[category_id].weaknesses}} |
{{/each}}

## 5. Scores by subcategory with evidence
<!-- basis: NIST AI RMF 1.0 Core, all 72 subcategories | fill: rag | evidence: required -->
*One row per subcategory (export must contain 72 rows). The score is proposed from retrieved evidence and confirmed by a human assessor; record the rationale in one sentence.*

| Subcategory ID | Outcome (short) | Applicable (Y/N) | Maturity (0-5) | Rationale | Evidence | Evidence date | Validated by | Linked ISO/IEC 42001 | Linked EU AI Act |
|---|---|---|---|---|---|---|---|---|---|
{{#each kb.nist_ai_rmf.subcategories}}
| {{subcategory_id}} | {{short_title}} | {{score.[subcategory_id].applicable}} | {{score.[subcategory_id].maturity}} | {{score.[subcategory_id].rationale}} | {{score.[subcategory_id].evidence_ref}} | {{score.[subcategory_id].evidence_date}} | {{score.[subcategory_id].validated_by}} | {{kb.crosswalk.[subcategory_id].iso42001}} | {{kb.crosswalk.[subcategory_id].eu_ai_act}} |
{{/each}}

Subcategories scored without evidence (capped): {{score.unevidenced_list}}

## 6. Priority gaps and improvement actions
<!-- basis: NIST AI RMF 1.0, Section 6 (current vs target profile); MANAGE 1.2; MANAGE 4.2 | fill: user | evidence: optional -->
*List the largest gaps between current and target profile and the actions to close them, prioritised by risk.*

| Subcategory ID | Current | Target | Action | Owner | Due date | Priority | Status |
|---|---|---|---|---|---|---|---|
{{#each scorecard.actions}}
| {{subcategory_id}} | {{current}} | {{target}} | {{action}} | {{owner}} | {{due_date}} | {{priority}} | {{status}} |
{{/each}}

## 7. Limitations
<!-- basis: NIST AI RMF GOVERN 1.4; GOVERN 4.2 | fill: user | evidence: optional -->
*State limits of the assessment: scope exclusions, evidence not available, self-assessment vs independent review.*

{{scorecard.limitations}}

## Sources and evidence
<!-- basis: NIST AI RMF GOVERN 1.4 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: NIST AI RMF GOVERN 2.3 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
