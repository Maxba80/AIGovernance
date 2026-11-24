---
id: tpl-ai-risk-assessment-treatment-plan
title_en: "AI Risk Assessment and Risk Treatment Plan"
title_it: "Valutazione dei rischi IA e piano di trattamento"
category: iso-42001
legal_basis: ["ISO/IEC 42001:2023 6.1.1", "ISO/IEC 42001:2023 6.1.2", "ISO/IEC 42001:2023 6.1.3", "ISO/IEC 42001:2023 8.2", "ISO/IEC 42001:2023 8.3"]
related_frameworks: ["ISO/IEC 23894:2023", "ISO/IEC 42001:2023 Annex C", "Reg. (EU) 2024/1689 Art. 9", "GDPR Art. 35(7)(c)-(d)", "NIST AI RMF MAP 5.1", "NIST AI RMF MANAGE 1.2", "NIST AI RMF MANAGE 1.3", "NIST AI RMF MANAGE 1.4"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "Risk owners (treatment plan and residual risk acceptance); AIMS manager as reviewer"
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

<!-- xlsx: sheet "Risk register" = section 3, "Treatment plan" = section 4, "Matrix" = section 2, "Sources" = Sources and evidence -->

## 1. Scope and context of the assessment
<!-- basis: ISO/IEC 42001 6.1.1; 6.1.2; 8.2 | fill: rag | evidence: required -->
*Identify what is assessed and why now. Risk assessments are performed at planned intervals and when significant changes are proposed or occur.*

| Element | Value | Evidence |
|---|---|---|
| AI system(s) / use cases and life cycle stage | {{ra.scope}} | {{ra.scope.evidence_ref}} |
| Intended purpose and deployment context | {{ra.intended_purpose}} | {{ra.intended_purpose.evidence_ref}} |
| Trigger (initial / periodic / change) and assessment date | {{ra.trigger}} / {{ra.date}} | {{ra.trigger.evidence_ref}} |
| Related AI system impact assessment (6.1.4) | {{ra.aisia_ref}} | {{ra.aisia_ref.evidence_ref}} |
| Assessment team | {{ra.team}} | {{ra.team.evidence_ref}} |

## 2. Risk criteria and method
<!-- basis: ISO/IEC 42001 6.1.1; 6.1.2 | fill: kb | evidence: required -->
*The method must give consistent, valid and comparable results across assessments. Scales and acceptance criteria are approved by the organisation and stored in the knowledge base; they are quoted here, not redefined.*

- Score = likelihood (1-5) x severity (1-5), range 1-25. Scale definitions: {{kb.risk_matrix.likelihood_scale}}, {{kb.risk_matrix.severity_scale}}.
- Severity considers consequences for the organisation, for individuals and for societies; the highest of the three applies.
- Levels and acceptance criteria: {{kb.risk_matrix.bands}} | Risk appetite statement: {{kb.risk_matrix.appetite_ref}}
- Risk taxonomy: {{kb.risk_taxonomy}} (MIT AI Risk Repository domain / subdomain; IBM AI Risk Atlas id); risk sources per ISO/IEC 42001 Annex C.
- Treatment options: modify (apply controls) / avoid / share / retain.

## 3. AI risk register: identification, analysis and evaluation
<!-- basis: ISO/IEC 42001 6.1.2; 8.2 | fill: rag | evidence: required -->
*One row per risk. Identify risks that help or prevent achieving the AI objectives; analyse consequences and likelihood; compare the level with the criteria and prioritise. Inherent = before controls. Existing controls must be evidenced to be counted.*

| Risk ID | AI system / use case | Risk description (source, event, consequence) | MIT domain / subdomain | IBM Risk Atlas id | Affected party (organisation / individuals / society) | Risk owner | Inherent L | Inherent S | Inherent score | Inherent level | Existing controls | Priority | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
{{#each risks}}
| {{id}} | {{ai_system}} | {{description}} | {{taxonomy.mit_domain}} / {{taxonomy.mit_subdomain}} | {{taxonomy.ibm_atlas_id}} | {{affected}} | {{owner}} | {{inherent.l}} | {{inherent.s}} | {{inherent.score}} | {{inherent.level}} | {{existing_controls}} | {{priority}} | {{evidence_ref}} |
{{/each}}

## 4. Risk treatment plan
<!-- basis: ISO/IEC 42001 6.1.3; 8.3 | fill: user | evidence: required -->
*For each risk above the acceptance threshold select a treatment option and determine the necessary controls. Compare them with Annex A and record the mapping; the same controls must appear in the Statement of Applicability. Residual = expected after planned controls are effective.*

| Risk ID | Treatment option | Controls / actions | ISO/IEC 42001 Annex A control IDs | Other mapping (EU AI Act, GDPR, NIST AI RMF) | Action owner | Due date | Status | Residual L | Residual S | Residual score | Residual level | Residual risk accepted by / date | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
{{#each treatments}}
| {{risk_id}} | {{option}} | {{actions}} | {{annex_a_controls}} | {{other_mapping}} | {{action_owner}} | {{due_date}} | {{status}} | {{residual.l}} | {{residual.s}} | {{residual.score}} | {{residual.level}} | {{accepted_by}} / {{accepted_date}} | {{evidence_ref}} |
{{/each}}

## 5. Summary
<!-- basis: ISO/IEC 42001 6.1.2; 9.1 | fill: computed | evidence: optional -->
*Computed from sections 3 and 4.*

| Level | Inherent (count) | Residual (count) |
|---|---|---|
{{#each summary.by_level}}
| {{level}} | {{inherent_count}} | {{residual_count}} |
{{/each}}

Risks above appetite after treatment: {{summary.above_appetite}} | Overdue actions: {{summary.overdue_actions}} | Risks without evidence for existing controls: {{summary.unevidenced}}

## 6. Risk owner approval of the plan and acceptance of residual risks
<!-- basis: ISO/IEC 42001 6.1.3 | fill: user | evidence: required -->
*Management approval of the treatment plan and acceptance of residual AI risks is recorded per risk owner. Risks above appetite need an explicit, time-limited acceptance with justification.*

| Risk owner | Risks covered | Plan approved (Y/N) | Residual risks accepted | Justification for accepting risks above appetite | Valid until | Date |
|---|---|---|---|---|---|---|
{{#each acceptance}}
| {{owner}} | {{risk_ids}} | {{plan_approved}} | {{accepted_risk_ids}} | {{justification}} | {{valid_until}} | {{date}} |
{{/each}}

## 7. Implementation monitoring and re-assessment
<!-- basis: ISO/IEC 42001 8.2; 8.3; 9.1 | fill: user | evidence: optional -->
*Verify that the plan is implemented and controls are effective; where treatment is not effective, review the option and update the plan. Results of every assessment and treatment are retained as documented information.*

Next planned assessment: {{monitoring.next_date}} | Change triggers: {{monitoring.triggers}} | Effectiveness checks: {{monitoring.effectiveness}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 6.1.3; 8.3 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
