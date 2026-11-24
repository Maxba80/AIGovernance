---
id: tpl-audit-readiness-nc-capa-log
title_en: "Audit Readiness Report and Nonconformity / CAPA Log"
title_it: "Rapporto di preparazione all'audit e registro NC/CAPA"
category: iso-42001
legal_basis: ["ISO/IEC 42001:2023 9.2", "ISO/IEC 42001:2023 9.3", "ISO/IEC 42001:2023 10.2"]
related_frameworks: ["ISO/IEC 42001:2023 9.1", "ISO/IEC 42001:2023 10.1", "ISO 19011:2018", "ISO/IEC 17021-1:2015", "Reg. (EU) 2024/1689 Art. 17", "NIST AI RMF GOVERN 1.5", "NIST AI RMF MANAGE 4.2"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "AIMS manager; top management for management review outputs"
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

<!-- xlsx: sheet "Readiness" = section 2, "Audit programme" = section 3, "NC-CAPA log" = section 5, "Mgmt review" = section 6, "Sources" = Sources and evidence -->

## 1. Scope and audit context
<!-- basis: ISO/IEC 42001 9.2; 4.3 | fill: rag | evidence: required -->
*State which audit this report prepares for or records, and the AIMS scope and criteria.*

| Element | Value | Evidence |
|---|---|---|
| Audit type (internal / certification stage 1 / stage 2 / surveillance / recertification) | {{audit.type}} | {{audit.type.evidence_ref}} |
| AIMS scope and SoA version | {{audit.scope_ref}} / {{audit.soa_version}} | {{audit.scope_ref.evidence_ref}} |
| Audit criteria | {{audit.criteria}} | {{audit.criteria.evidence_ref}} |
| Planned dates and audit body / auditors | {{audit.dates}} / {{audit.auditors}} | {{audit.dates.evidence_ref}} |

## 2. Readiness by clause and control
<!-- basis: ISO/IEC 42001 clauses 4-10; Annex A; 9.2 | fill: computed | evidence: required -->
*One row per clause (4 to 10) and per applicable Annex A control from the SoA. Readiness is computed from evidence coverage and validated by a human; "ready" requires current, approved evidence.*

| Requirement | Mandatory documented information | Evidence available | Evidence date | Readiness (ready / partial / not ready) | Gap | Owner |
|---|---|---|---|---|---|---|
{{#each readiness.items}}
| {{requirement_id}} | {{documented_information}} | {{evidence_ref}} | {{evidence_date}} | {{readiness}} | {{gap}} | {{owner}} |
{{/each}}

Overall readiness: {{readiness.score}} % | Not-ready items: {{readiness.not_ready_count}} | Open major nonconformities: {{readiness.open_majors}}

## 3. Internal audit programme and results
<!-- basis: ISO/IEC 42001 9.2 | fill: rag | evidence: required -->
*Show that internal audits are planned (frequency, methods, responsibilities), that auditors are objective and impartial, and that results are reported to relevant management.*

| Audit ID | Date | Scope / processes | Criteria | Auditor(s) and independence | Findings (major / minor / obs / OFI) | Report ref | Reported to |
|---|---|---|---|---|---|---|---|
{{#each internal_audits}}
| {{id}} | {{date}} | {{scope}} | {{criteria}} | {{auditors}} | {{findings_count}} | {{evidence_ref}} | {{reported_to}} |
{{/each}}

## 4. Grading scheme
<!-- basis: ISO/IEC 42001 10.2; ISO/IEC 17021-1:2015 (definitions of major and minor nonconformity) | fill: kb | evidence: optional -->
*ISO/IEC 42001 does not define grades; these follow common certification practice and the organisation's procedure {{kb.audit.grading_procedure}}.*

| Grade | Meaning | Required response |
|---|---|---|
| Major NC | Requirement not fulfilled in a way that affects the capability of the AIMS to achieve its intended results (e.g. a required process absent or broken down, or several related minors) | Correction, root cause and corrective action; verified before certification decision |
| Minor NC | Isolated lapse that does not affect the capability of the AIMS | Correction, root cause and corrective action plan; verified at next audit |
| Observation | No nonconformity now, but a risk of one | Evaluation recorded; action optional |
| OFI | Opportunity for improvement | Considered under continual improvement (10.1) |

## 5. Nonconformity and corrective action log
<!-- basis: ISO/IEC 42001 10.2 | fill: rag | evidence: required -->
*For each nonconformity: react (control and correct it, deal with consequences), evaluate the need to eliminate causes (review, cause analysis, check whether similar nonconformities exist or could occur), implement action, review its effectiveness and change the AIMS if needed. Documented information is retained on the nature of the nonconformity, the actions and the results.*

| NC ID | Source (audit ID / incident / monitoring / complaint) | Date raised | Requirement (clause / control) | Grade | Description and objective evidence | Correction (immediate) | Consequences dealt with | Root cause (method: 5 Whys / fishbone) | Similar NCs exist or could occur | Corrective action | Owner | Due date | Status | Effectiveness verification (method, date, verifier, result) | AIMS changes made | Closed on | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
{{#each nonconformities}}
| {{id}} | {{source}} | {{date_raised}} | {{requirement}} | {{grade}} | {{description}} | {{correction}} | {{consequences}} | {{root_cause}} | {{similar}} | {{corrective_action}} | {{owner}} | {{due_date}} | {{status}} | {{effectiveness}} | {{aims_changes}} | {{closed_on}} | {{evidence_ref}} |
{{/each}}

Summary: open {{nc.open}} / overdue {{nc.overdue}} / closed {{nc.closed}}; by grade: major {{nc.major}}, minor {{nc.minor}}, observation {{nc.observation}}, OFI {{nc.ofi}}; recurring root causes: {{nc.recurring_causes}}

## 6. Management review
<!-- basis: ISO/IEC 42001 9.3 | fill: rag | evidence: required -->
*Record that top management reviewed the AIMS at planned intervals with the required inputs, and the resulting decisions.*

| Input | Summary | Evidence |
|---|---|---|
| Status of actions from previous management reviews | {{mr.previous_actions}} | {{mr.previous_actions.evidence_ref}} |
| Changes in external and internal issues relevant to the AIMS | {{mr.context_changes}} | {{mr.context_changes.evidence_ref}} |
| Changes in needs and expectations of interested parties | {{mr.interested_parties}} | {{mr.interested_parties.evidence_ref}} |
| AIMS performance: nonconformities and corrective actions | {{mr.nc_trends}} | {{mr.nc_trends.evidence_ref}} |
| AIMS performance: monitoring and measurement results | {{mr.monitoring}} | {{mr.monitoring.evidence_ref}} |
| AIMS performance: audit results | {{mr.audit_results}} | {{mr.audit_results.evidence_ref}} |
| Opportunities for continual improvement | {{mr.improvement}} | {{mr.improvement.evidence_ref}} |

Review date and attendees: {{mr.date}} / {{mr.attendees}}
Decisions on continual improvement and changes to the AIMS: {{mr.decisions}} | Minutes: {{mr.minutes.evidence_ref}}

## 7. Readiness conclusion
<!-- basis: ISO/IEC 42001 9.2; 9.3; 10.1 | fill: user | evidence: required -->
*State whether the organisation is ready for the audit and list the actions to complete beforehand.*

Conclusion: {{audit.readiness_conclusion}}

| Action | Owner | Due date | Status |
|---|---|---|---|
{{#each readiness.actions}}
| {{action}} | {{owner}} | {{due_date}} | {{status}} |
{{/each}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 9.3; 10.2 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
