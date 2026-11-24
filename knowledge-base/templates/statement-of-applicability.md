---
id: tpl-statement-of-applicability
title_en: "Statement of Applicability (SoA) - ISO/IEC 42001"
title_it: "Dichiarazione di applicabilità (SoA) - ISO/IEC 42001"
category: iso-42001
legal_basis: ["ISO/IEC 42001:2023 6.1.3", "ISO/IEC 42001:2023 Annex A", "ISO/IEC 42001:2023 7.5"]
related_frameworks: ["ISO/IEC 42001:2023 Annex B", "ISO/IEC 42001:2023 6.1.2", "ISO/IEC 42001:2023 8.3", "Reg. (EU) 2024/1689 Art. 9", "Reg. (EU) 2024/1689 Art. 17", "NIST AI RMF MANAGE 1.3"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "Top management representative accountable for the AIMS (risk owners accept residual risk)"
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

<!-- xlsx: sheet "SoA" = section 3, "Additional controls" = section 4, "Summary" = section 5, "Sources" = Sources and evidence -->

## 1. Purpose, scope and basis
<!-- basis: ISO/IEC 42001 6.1.3; 4.3 | fill: rag | evidence: required -->
*State the AIMS scope this SoA covers and the risk assessment and treatment plan it derives from. The SoA lists the controls determined as necessary and justifies every inclusion and exclusion.*

| Element | Value | Evidence |
|---|---|---|
| AIMS scope statement reference | {{soa.scope_ref}} | {{soa.scope_ref.evidence_ref}} |
| Organisation's roles with respect to AI systems (clause 4.1) | {{soa.ai_roles}} | {{soa.ai_roles.evidence_ref}} |
| AI risk assessment reference and date | {{soa.risk_assessment_ref}} | {{soa.risk_assessment_ref.evidence_ref}} |
| AI risk treatment plan reference | {{soa.treatment_plan_ref}} | {{soa.treatment_plan_ref.evidence_ref}} |
| Standard edition and Annex A version used | {{kb.iso42001.edition}} | {{kb.iso42001.source_ref}} |

## 2. Method and legend
<!-- basis: ISO/IEC 42001 6.1.3 | fill: kb | evidence: optional -->
*Each of the 38 Annex A controls is compared with the controls determined in risk treatment to verify that no necessary control has been omitted. Control text is not reproduced; the control ID and short title come from the licensed knowledge base.*

- Applicable: Y / N. An exclusion needs a specific justification (e.g. the organisation does not perform the activity given its AI role); "not relevant" alone is not sufficient.
- Reason for inclusion: R = risk treatment, L = legal or regulatory requirement, C = contractual obligation, B = business requirement / good practice.
- Implementation status: not started / in progress / implemented / implemented and verified.
- Evidence link: document, record or system export proving the status; mandatory for "implemented" and above.

## 3. Annex A controls
<!-- basis: ISO/IEC 42001 6.1.3; Annex A (A.2-A.10) | fill: rag | evidence: required -->
*One row per control, grouped by objective: A.2 (3), A.3 (2), A.4 (5), A.5 (4), A.6 (9), A.7 (5), A.8 (4), A.9 (3), A.10 (3). The export must contain exactly 38 rows; the app blocks approval otherwise.*

| Control ID | Control title | Applicable (Y/N) | Reason (R/L/C/B) | Justification for inclusion or exclusion | Linked risks | Implementation status | Implementation description | Owner | Evidence link | Last verified |
|---|---|---|---|---|---|---|---|---|---|---|
{{#each kb.iso42001.annex_a}}
| {{control_id}} | {{control_title}} | {{soa.[control_id].applicable}} | {{soa.[control_id].reason}} | {{soa.[control_id].justification}} | {{soa.[control_id].risk_ids}} | {{soa.[control_id].status}} | {{soa.[control_id].implementation}} | {{soa.[control_id].owner}} | {{soa.[control_id].evidence_ref}} | {{soa.[control_id].last_verified}} |
{{/each}}

## 4. Additional controls outside Annex A
<!-- basis: ISO/IEC 42001 6.1.3 | fill: rag | evidence: required -->
*Annex A is not exhaustive. List controls designed by the organisation or taken from other sources (e.g. EU AI Act obligations, ISO/IEC 27001, NIST AI RMF, sector rules) that risk treatment determined as necessary.*

| Control ID | Control description | Source | Justification | Linked risks | Implementation status | Owner | Evidence link |
|---|---|---|---|---|---|---|---|
{{#each soa.additional_controls}}
| {{id}} | {{description}} | {{source}} | {{justification}} | {{risk_ids}} | {{status}} | {{owner}} | {{evidence_ref}} |
{{/each}}

## 5. Summary
<!-- basis: ISO/IEC 42001 6.1.3; 9.1 | fill: computed | evidence: optional -->
*Computed from section 3; do not edit manually.*

| Objective | Controls | Applicable | Excluded | Implemented | In progress | Not started | With evidence |
|---|---|---|---|---|---|---|---|
{{#each soa.summary_by_objective}}
| {{objective_id}} | {{total}} | {{applicable}} | {{excluded}} | {{implemented}} | {{in_progress}} | {{not_started}} | {{with_evidence}} |
{{/each}}
| Total | 38 | {{soa.total.applicable}} | {{soa.total.excluded}} | {{soa.total.implemented}} | {{soa.total.in_progress}} | {{soa.total.not_started}} | {{soa.total.with_evidence}} |

Applicable controls without evidence: {{soa.controls_without_evidence}}
Excluded controls: {{soa.excluded_controls}}

## 6. Cross-framework mapping (informative)
<!-- basis: ISO/IEC 42001 4.1; 6.1.3 | fill: kb | evidence: optional -->
*Mapping maintained in the knowledge base so that one piece of evidence can support several frameworks. Informative only; it does not change applicability decisions.*

| Control ID | EU AI Act | GDPR | NIST AI RMF |
|---|---|---|---|
{{#each kb.iso42001.annex_a}}
| {{control_id}} | {{kb.crosswalk.[control_id].eu_ai_act}} | {{kb.crosswalk.[control_id].gdpr}} | {{kb.crosswalk.[control_id].nist_ai_rmf}} |
{{/each}}

## 7. Maintenance
<!-- basis: ISO/IEC 42001 7.5; 8.2; 8.3 | fill: user | evidence: optional -->
*The SoA is updated whenever the risk assessment, the treatment plan or the AIMS scope changes.*

Change log: {{soa.change_log}} | Next review: {{soa.next_review}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 6.1.3; 5.1 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
