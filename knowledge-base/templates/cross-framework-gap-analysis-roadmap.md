---
id: tpl-cross-framework-gap-analysis-roadmap
title_en: "Cross-Framework Gap Analysis and Remediation Roadmap"
title_it: "Gap analysis multi-framework e roadmap di adeguamento"
category: operational
legal_basis: ["Reg. (EU) 2024/1689 (obligations by role; see knowledge base)", "Reg. (EU) 2016/679 Art. 5(2), Art. 24", "ISO/IEC 42001:2023 clauses 4-10 and Annex A", "NIST AI RMF 1.0 Core"]
related_frameworks: ["ISO/IEC 42001:2023 6.2", "ISO/IEC 42001:2023 10.1", "NIST AI RMF 1.0 Section 6 (Profiles)", "NIST AI RMF MANAGE 1.2"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "AI governance lead / compliance officer; programme sponsor for the roadmap"
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

<!-- xlsx: sheet "Gap register" = section 4, "Crosswalk" = section 3, "Roadmap" = section 6, "Summary" = section 5, "Sources" = Sources and evidence -->

## 1. Scope and applicable frameworks
<!-- basis: ISO/IEC 42001 4.1; 4.3; Reg. (EU) 2024/1689 Art. 2, Art. 3, Art. 6 | fill: rag | evidence: required -->
*Define which requirements apply before assessing gaps: the organisation's role and the risk class per AI system determine the AI Act obligations. Application dates are taken from the knowledge base (the Act was amended by Regulation (EU) 2026/1744) and must not be typed in manually.*

| AI system / use case | AI Act role | AI Act risk class | Personal data (Y/N) | Frameworks in scope | Evidence |
|---|---|---|---|---|---|
{{#each gap.scope_systems}}
| {{name}} | {{ai_act_role}} | {{ai_act_class}} | {{personal_data}} | {{frameworks}} | {{evidence_ref}} |
{{/each}}

| Framework | Version / consolidated text used | Relevant application date(s) | Knowledge-base source |
|---|---|---|---|
| EU AI Act | {{kb.eu_ai_act.consolidated.version}} | {{kb.eu_ai_act.timeline.applicable_milestones}} | {{kb.eu_ai_act.source_ref}} |
| GDPR | {{kb.gdpr.version}} | in application | {{kb.gdpr.source_ref}} |
| ISO/IEC 42001 | {{kb.iso42001.edition}} | target certification: {{gap.iso_target_date}} | {{kb.iso42001.source_ref}} |
| NIST AI RMF | {{kb.nist_ai_rmf.version}} | voluntary | {{kb.nist_ai_rmf.source_ref}} |

## 2. Method
<!-- basis: ISO/IEC 42001 9.1; NIST AI RMF 1.0 Section 6 | fill: kb | evidence: optional -->
*"Assess once, comply many": each requirement is assessed once against evidence; the knowledge-base crosswalk propagates the result to linked requirements in other frameworks. Links are typed (equivalent / partial / related); only "equivalent" links inherit status automatically, the others need human confirmation.*

- Status: compliant / partially compliant / non-compliant / not applicable / not assessed. "Compliant" needs validated evidence.
- Priority (P1-P4): computed from legal bindingness, deadline proximity, linked risk level and number of linked requirements: {{kb.gap.priority_rules}}.
- Effort: S (< 1 week) / M (< 1 month) / L (< 1 quarter) / XL (longer), or person-days where estimated.
- Crosswalk source and version: {{kb.crosswalk.version}}.

## 3. Requirement crosswalk
<!-- basis: Knowledge-base crosswalk (informative; not an official mapping) | fill: kb | evidence: optional -->
*Shows the linked requirements for each requirement in scope. An authoritative source for the mapping is cited where one exists.*

| Requirement ID | Framework | Reference | Requirement (short) | Linked EU AI Act | Linked GDPR | Linked ISO/IEC 42001 | Linked NIST AI RMF | Link type | Mapping source |
|---|---|---|---|---|---|---|---|---|---|
{{#each gap.requirements}}
| {{id}} | {{framework}} | {{reference}} | {{short_text}} | {{links.eu_ai_act}} | {{links.gdpr}} | {{links.iso42001}} | {{links.nist_ai_rmf}} | {{link_type}} | {{mapping_source}} |
{{/each}}

## 4. Gap register
<!-- basis: Requirement cited in each row | fill: rag | evidence: required -->
*One row per requirement that is not fully met. Describe the gap as the difference between what the requirement demands and what the evidence shows; cite the evidence examined, including where nothing was found.*

| Gap ID | Requirement ID and reference | AI system(s) | Current state (evidence found) | Status | Gap description | Linked requirements closed by the same action | Linked risk ID | Remediation action | Deliverable / template | Priority | Effort | Owner | Due date | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
{{#each gaps}}
| {{id}} | {{requirement_id}} ({{reference}}) | {{ai_systems}} | {{current_state}} | {{status}} | {{description}} | {{linked_requirements}} | {{risk_id}} | {{action}} | {{deliverable}} | {{priority}} | {{effort}} | {{owner}} | {{due_date}} | {{evidence_ref}} |
{{/each}}

## 5. Summary
<!-- basis: ISO/IEC 42001 9.1 | fill: computed | evidence: optional -->
*Computed from sections 3 and 4.*

| Framework | Requirements in scope | Compliant | Partial | Non-compliant | Not assessed | Compliance rate | Gaps P1 | Gaps past due |
|---|---|---|---|---|---|---|---|---|
{{#each gap.summary_by_framework}}
| {{framework}} | {{in_scope}} | {{compliant}} | {{partial}} | {{non_compliant}} | {{not_assessed}} | {{rate}} | {{p1}} | {{past_due}} |
{{/each}}

Actions closing gaps in more than one framework: {{gap.multi_framework_actions}} | Requirements assessed without evidence: {{gap.unevidenced}}

## 6. Remediation roadmap
<!-- basis: ISO/IEC 42001 6.2; 10.1 | fill: user | evidence: optional -->
*Group actions into phases ordered by legal deadline and priority. Each milestone names an accountable owner and a verifiable deliverable.*

| Phase | Period | Objective | Gap IDs | Milestone / deliverable | Owner | Regulatory deadline served | Dependencies | Budget / effort | Status |
|---|---|---|---|---|---|---|---|---|---|
{{#each roadmap.phases}}
| {{phase}} | {{period}} | {{objective}} | {{gap_ids}} | {{milestone}} | {{owner}} | {{deadline_ref}} | {{dependencies}} | {{effort}} | {{status}} |
{{/each}}

## 7. Assumptions, limitations and open questions
<!-- basis: ISO/IEC 42001 7.5 | fill: user | evidence: optional -->
*Record interpretative choices (e.g. classification of a system), evidence that could not be obtained and questions for legal counsel.*

{{gap.assumptions}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5; GDPR Art. 5(2) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 5.1; 6.2 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
