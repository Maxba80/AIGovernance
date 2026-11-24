---
id: tpl-risk-heat-map-report
title_en: "AI Risk Heat Map Report"
title_it: "Rapporto mappa di calore dei rischi IA"
category: operational
legal_basis: ["ISO/IEC 42001:2023 6.1.2", "ISO/IEC 42001:2023 8.2", "ISO/IEC 42001:2023 9.1"]
related_frameworks: ["ISO/IEC 42001:2023 9.3", "Reg. (EU) 2024/1689 Art. 9", "GDPR Art. 35(7)(c)", "NIST AI RMF MAP 5.1", "NIST AI RMF MANAGE 1.2", "NIST AI RMF MANAGE 1.4"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: recommended
approver_role: "Chief Risk Officer / AI governance lead"
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

## 1. Scope and data basis
<!-- basis: ISO/IEC 42001 6.1.2; 9.1 | fill: computed | evidence: required -->
*This report visualises the AI risk register; it creates no new risk data. State the register version and the reporting cut-off so every cell can be traced back to register rows.*

| Element | Value |
|---|---|
| Risk register version and hash | {{heatmap.register_version}} / {{heatmap.register_sha256}} |
| Reporting cut-off date | {{heatmap.cutoff_date}} |
| Use cases and agents covered | {{heatmap.entities_covered}} |
| Risks included / excluded (with reason) | {{heatmap.included_count}} / {{heatmap.excluded}} |

## 2. Scale and risk levels
<!-- basis: ISO/IEC 42001 6.1.2 (risk criteria) | fill: kb | evidence: optional -->
*Score = likelihood (1-5) x severity (1-5). Scales, level bands and appetite are those approved by the organisation: {{kb.risk_matrix.likelihood_scale}}, {{kb.risk_matrix.severity_scale}}, {{kb.risk_matrix.bands}}, {{kb.risk_matrix.appetite_ref}}.*

## 3. Inherent risk heat map
<!-- basis: ISO/IEC 42001 6.1.2 | fill: computed | evidence: required -->
*Each cell shows the number of risks and their IDs before controls. Rows: likelihood; columns: severity.*

| Likelihood \ Severity | 1 Negligible | 2 Minor | 3 Moderate | 4 Major | 5 Critical |
|---|---|---|---|---|---|
| 5 Almost certain | {{hm.inherent.l5s1}} | {{hm.inherent.l5s2}} | {{hm.inherent.l5s3}} | {{hm.inherent.l5s4}} | {{hm.inherent.l5s5}} |
| 4 Likely | {{hm.inherent.l4s1}} | {{hm.inherent.l4s2}} | {{hm.inherent.l4s3}} | {{hm.inherent.l4s4}} | {{hm.inherent.l4s5}} |
| 3 Possible | {{hm.inherent.l3s1}} | {{hm.inherent.l3s2}} | {{hm.inherent.l3s3}} | {{hm.inherent.l3s4}} | {{hm.inherent.l3s5}} |
| 2 Unlikely | {{hm.inherent.l2s1}} | {{hm.inherent.l2s2}} | {{hm.inherent.l2s3}} | {{hm.inherent.l2s4}} | {{hm.inherent.l2s5}} |
| 1 Rare | {{hm.inherent.l1s1}} | {{hm.inherent.l1s2}} | {{hm.inherent.l1s3}} | {{hm.inherent.l1s4}} | {{hm.inherent.l1s5}} |

Rendered chart: {{hm.inherent.chart}}

## 4. Residual risk heat map
<!-- basis: ISO/IEC 42001 6.1.3; 8.3 | fill: computed | evidence: required -->
*Same grid after controls. A risk may move only if the control that moves it is implemented and evidenced; planned controls are shown separately as "target residual".*

| Likelihood \ Severity | 1 Negligible | 2 Minor | 3 Moderate | 4 Major | 5 Critical |
|---|---|---|---|---|---|
| 5 Almost certain | {{hm.residual.l5s1}} | {{hm.residual.l5s2}} | {{hm.residual.l5s3}} | {{hm.residual.l5s4}} | {{hm.residual.l5s5}} |
| 4 Likely | {{hm.residual.l4s1}} | {{hm.residual.l4s2}} | {{hm.residual.l4s3}} | {{hm.residual.l4s4}} | {{hm.residual.l4s5}} |
| 3 Possible | {{hm.residual.l3s1}} | {{hm.residual.l3s2}} | {{hm.residual.l3s3}} | {{hm.residual.l3s4}} | {{hm.residual.l3s5}} |
| 2 Unlikely | {{hm.residual.l2s1}} | {{hm.residual.l2s2}} | {{hm.residual.l2s3}} | {{hm.residual.l2s4}} | {{hm.residual.l2s5}} |
| 1 Rare | {{hm.residual.l1s1}} | {{hm.residual.l1s2}} | {{hm.residual.l1s3}} | {{hm.residual.l1s4}} | {{hm.residual.l1s5}} |

Rendered chart: {{hm.residual.chart}}

## 5. View by use case
<!-- basis: ISO/IEC 42001 6.1.2; 8.2 | fill: computed | evidence: required -->
*One row per AI use case, aggregating its risks. "Max" is the highest single risk score, which is not averaged away.*

| Use case | AI Act risk class | Risks (count) | Max inherent score / level | Max residual score / level | Risks above appetite | Frameworks impacted | Owner |
|---|---|---|---|---|---|---|---|
{{#each heatmap.by_use_case}}
| {{name}} | {{ai_act_class}} | {{risk_count}} | {{max_inherent}} / {{max_inherent_level}} | {{max_residual}} / {{max_residual_level}} | {{above_appetite}} | {{frameworks}} | {{owner}} |
{{/each}}

## 6. View by agent
<!-- basis: ISO/IEC 42001 6.1.2; 8.2 | fill: computed | evidence: required -->
*One row per AI agent (autonomous or tool-using component). Autonomy level and tool permissions are shown because they drive likelihood and severity.*

| Agent | Use case(s) | Autonomy level | Tools / permissions | Risks (count) | Max inherent score / level | Max residual score / level | Frameworks impacted | Owner |
|---|---|---|---|---|---|---|---|---|
{{#each heatmap.by_agent}}
| {{name}} | {{use_cases}} | {{autonomy}} | {{tools}} | {{risk_count}} | {{max_inherent}} / {{max_inherent_level}} | {{max_residual}} / {{max_residual_level}} | {{frameworks}} | {{owner}} |
{{/each}}

## 7. Risk detail: inherent vs residual
<!-- basis: ISO/IEC 42001 6.1.2; 6.1.3 | fill: rag | evidence: required -->
*Register extract sorted by residual score. "Frameworks impacted" lists the requirements at stake if the risk materialises.*

| Risk ID | Use case / agent | Risk (short) | Taxonomy ({{kb.risk_taxonomy}}) | Inherent L x S = score | Residual L x S = score | Movement | Key controls | Frameworks impacted (EU AI Act / GDPR / ISO/IEC 42001 / NIST AI RMF) | Owner | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
{{#each heatmap.risks}}
| {{id}} | {{entity}} | {{short_description}} | {{taxonomy}} | {{inherent.l}} x {{inherent.s}} = {{inherent.score}} | {{residual.l}} x {{residual.s}} = {{residual.score}} | {{movement}} | {{key_controls}} | {{frameworks_impacted}} | {{owner}} | {{evidence_ref}} |
{{/each}}

## 8. Key messages and decisions requested
<!-- basis: ISO/IEC 42001 9.3; NIST AI RMF MANAGE 1.4 | fill: user | evidence: optional -->
*Summarise for management: top risks, risks above appetite, trend since the previous report and decisions needed (accept, fund treatment, stop use).*

Top risks: {{heatmap.top_risks}} | Above appetite: {{heatmap.above_appetite}} | Trend vs previous report ({{heatmap.previous_ref}}): {{heatmap.trend}}
Decisions requested: {{heatmap.decisions_requested}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5; GDPR Art. 5(2) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 9.1; 9.3 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
