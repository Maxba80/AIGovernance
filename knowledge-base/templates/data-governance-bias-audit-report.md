---
id: tpl-data-governance-bias-audit-report
title_en: "Data Governance and Bias Audit Report"
title_it: "Rapporto su governance dei dati e audit dei bias"
category: gdpr
legal_basis: ["Reg. (EU) 2024/1689 Art. 10(1)", "Reg. (EU) 2024/1689 Art. 10(2)(a)-(h)", "Reg. (EU) 2024/1689 Art. 10(3)", "Reg. (EU) 2024/1689 Art. 10(4)", "Reg. (EU) 2024/1689 Art. 4a", "Reg. (EU) 2024/1689 Art. 10(6)", "GDPR Art. 5(1)", "GDPR Art. 9"]
related_frameworks: ["GDPR Art. 30", "GDPR Art. 35", "ISO/IEC 42001 A.7.2", "ISO/IEC 42001 A.7.3", "ISO/IEC 42001 A.7.4", "ISO/IEC 42001 A.7.5", "ISO/IEC 42001 A.7.6", "NIST AI RMF MEASURE 2.11", "NIST AI RMF MAP 2.3"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "AI system owner (provider side) with DPO; data science lead as reviewer"
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

> Version note: Article 10(5) of Regulation (EU) 2024/1689 was deleted by Regulation (EU) 2026/1744 and replaced by Article 4a (same conditions (a)-(f); now also open to deployers and other AI systems under Art. 4a(2)). This template cites Article 4a. Other Article 10 paragraph references follow the 2024 text, in which Art. 10(1) and 10(6) were reworded to refer to Art. 4a(1).

## 1. Scope of the audit
<!-- basis: Reg. (EU) 2024/1689 Art. 10(1), 10(6) | fill: rag | evidence: required -->
*Identify the system and every data set audited. Where the system is not developed by training models with data, the requirements apply only to the testing data sets (Art. 10(6)).*

| Dataset ID | Name / version | Use (training / validation / testing) | Size | Personal data (Y/N) | Art. 9 data (Y/N) | Dataset hash | Evidence |
|---|---|---|---|---|---|---|---|
{{#each datasets}}
| {{id}} | {{name}} / {{version}} | {{use}} | {{size}} | {{personal_data}} | {{special_categories}} | {{sha256}} | {{evidence_ref}} |
{{/each}}

Intended purpose of the system: {{ai_system.intended_purpose}} | Audit period: {{audit.period}} | Auditor(s): {{audit.team}}

## 2. Data governance and management practices
<!-- basis: Reg. (EU) 2024/1689 Art. 10(2)(a)-(e), 10(2)(h) | fill: rag | evidence: required -->
*For each practice describe what is in place and cite the documented evidence (datasheet, pipeline code, labelling guidelines). Bias-related points (f) and (g) are covered in sections 4 and 5.*

| Art. 10(2) | Practice | Finding | Conformity (yes / partial / no) | Evidence |
|---|---|---|---|---|
| (a) | Relevant design choices | {{dg.a.finding}} | {{dg.a.status}} | {{dg.a.evidence_ref}} |
| (b) | Data collection processes and origin of data; for personal data, the original purpose of collection | {{dg.b.finding}} | {{dg.b.status}} | {{dg.b.evidence_ref}} |
| (c) | Data-preparation operations (annotation, labelling, cleaning, updating, enrichment, aggregation) | {{dg.c.finding}} | {{dg.c.status}} | {{dg.c.evidence_ref}} |
| (d) | Assumptions on what the data is supposed to measure and represent | {{dg.d.finding}} | {{dg.d.status}} | {{dg.d.evidence_ref}} |
| (e) | Availability, quantity and suitability of the data sets needed | {{dg.e.finding}} | {{dg.e.status}} | {{dg.e.evidence_ref}} |
| (h) | Data gaps or shortcomings preventing compliance and how they can be addressed | {{dg.h.finding}} | {{dg.h.status}} | {{dg.h.evidence_ref}} |

## 3. Data set quality
<!-- basis: Reg. (EU) 2024/1689 Art. 10(3), 10(4) | fill: computed | evidence: required -->
*Report measured values, not judgments. Representativeness is assessed against the persons or groups on which the system is intended to be used and the specific geographical, contextual, behavioural or functional setting.*

| Criterion | Metric and method | Result | Threshold | Pass (Y/N) | Evidence |
|---|---|---|---|---|---|
| Relevance to the intended purpose | {{dq.relevance.metric}} | {{dq.relevance.result}} | {{dq.relevance.threshold}} | {{dq.relevance.pass}} | {{dq.relevance.evidence_ref}} |
| Representativeness (target population vs data set) | {{dq.repr.metric}} | {{dq.repr.result}} | {{dq.repr.threshold}} | {{dq.repr.pass}} | {{dq.repr.evidence_ref}} |
| Freedom from errors (label noise, duplicates, invalid values) | {{dq.errors.metric}} | {{dq.errors.result}} | {{dq.errors.threshold}} | {{dq.errors.pass}} | {{dq.errors.evidence_ref}} |
| Completeness (missing values, coverage) | {{dq.completeness.metric}} | {{dq.completeness.result}} | {{dq.completeness.threshold}} | {{dq.completeness.pass}} | {{dq.completeness.evidence_ref}} |
| Statistical properties per relevant group | {{dq.stats.metric}} | {{dq.stats.result}} | {{dq.stats.threshold}} | {{dq.stats.pass}} | {{dq.stats.evidence_ref}} |
| Fit to deployment setting (Art. 10(4)) | {{dq.setting.metric}} | {{dq.setting.result}} | {{dq.setting.threshold}} | {{dq.setting.pass}} | {{dq.setting.evidence_ref}} |

## 4. Bias examination
<!-- basis: Reg. (EU) 2024/1689 Art. 10(2)(f) | fill: computed | evidence: required -->
*Examine biases likely to affect health and safety, negatively impact fundamental rights or lead to discrimination prohibited under Union law, including feedback loops where outputs influence future inputs. State the fairness metric, the groups compared and the test set; metric definitions: {{kb.fairness_metrics}}.*

| Test ID | Protected characteristic / proxy | Groups compared | Metric | Result | Threshold | Outcome | Dataset / model version | Evidence |
|---|---|---|---|---|---|---|---|---|
{{#each bias.tests}}
| {{id}} | {{characteristic}} | {{groups}} | {{metric}} | {{result}} | {{threshold}} | {{outcome}} | {{version}} | {{evidence_ref}} |
{{/each}}

Characteristics not tested and reason (e.g. data not available): {{bias.not_tested}}
Feedback-loop analysis: {{bias.feedback_loops}}

## 5. Bias detection, prevention and mitigation measures
<!-- basis: Reg. (EU) 2024/1689 Art. 10(2)(g) | fill: rag | evidence: required -->
*List measures taken for each bias finding and the re-test result after mitigation.*

| Test ID | Measure (re-sampling, re-weighting, feature removal, threshold adjustment, post-processing, process change) | Owner | Status | Result after mitigation | Evidence |
|---|---|---|---|---|---|
{{#each bias.mitigations}}
| {{test_id}} | {{measure}} | {{owner}} | {{status}} | {{post_result}} | {{evidence_ref}} |
{{/each}}

## 6. Processing of special categories for bias detection and correction
<!-- basis: Reg. (EU) 2024/1689 Art. 4a(1)(a)-(f); GDPR Art. 9 | fill: rag | evidence: required -->
*Complete only if special categories of personal data are processed for this purpose. All conditions are cumulative and apply in addition to the GDPR; the processing must be strictly necessary.*

| Art. 4a(1) | Condition | How it is met | Evidence |
|---|---|---|---|
| (a) | Bias detection and correction cannot be effectively achieved with other data, including synthetic or anonymised data | {{sc.a}} | {{sc.a.evidence_ref}} |
| (b) | Technical limitations on re-use; state-of-the-art security and privacy-preserving measures, including pseudonymisation | {{sc.b}} | {{sc.b.evidence_ref}} |
| (c) | Data secured and protected; strict access controls and documentation; only authorised persons under confidentiality | {{sc.c}} | {{sc.c.evidence_ref}} |
| (d) | Data not transmitted, transferred or otherwise accessed by other parties | {{sc.d}} | {{sc.d.evidence_ref}} |
| (e) | Data deleted once bias is corrected or at the end of the retention period, whichever comes first | {{sc.e}} | {{sc.e.evidence_ref}} |
| (f) | Records of processing state why the processing was strictly necessary and why other data could not achieve the objective | {{sc.f}} | {{sc.f.evidence_ref}} |

## 7. GDPR principles check for the audited data sets
<!-- basis: GDPR Art. 5(1)(a)-(f); Art. 6; Art. 9(2) | fill: rag | evidence: required -->
*Complete where the data sets contain personal data.*

| Principle | Assessment | Evidence |
|---|---|---|
| Lawfulness, fairness, transparency (lawful basis; Art. 9(2) condition) | {{gdpr.lawfulness}} | {{gdpr.lawfulness.evidence_ref}} |
| Purpose limitation (compatibility with original purpose of collection) | {{gdpr.purpose}} | {{gdpr.purpose.evidence_ref}} |
| Data minimisation | {{gdpr.minimisation}} | {{gdpr.minimisation.evidence_ref}} |
| Accuracy | {{gdpr.accuracy}} | {{gdpr.accuracy.evidence_ref}} |
| Storage limitation | {{gdpr.storage}} | {{gdpr.storage.evidence_ref}} |
| Integrity and confidentiality | {{gdpr.security}} | {{gdpr.security.evidence_ref}} |

RoPA entry: {{gdpr.ropa_ref}} | DPIA: {{gdpr.dpia_ref}}

## 8. Findings and action plan
<!-- basis: Reg. (EU) 2024/1689 Art. 10(2)(h); Art. 9 | fill: user | evidence: required -->
*Summarise open gaps, their severity and the corrective actions; feed open items into the AI risk register.*

| Finding ID | Description | Severity | Action | Owner | Due date | Risk register ref |
|---|---|---|---|---|---|---|
{{#each findings}}
| {{id}} | {{description}} | {{severity}} | {{action}} | {{owner}} | {{due_date}} | {{risk_ref}} |
{{/each}}

Overall conclusion: {{audit.conclusion}}

## Sources and evidence
<!-- basis: Reg. (EU) 2024/1689 Art. 10(2); GDPR Art. 5(2) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 10; GDPR Art. 5(2) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
