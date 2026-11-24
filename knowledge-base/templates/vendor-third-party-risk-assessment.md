---
id: tpl-vendor-third-party-risk-assessment
title_en: "AI Vendor and Third-Party Risk Assessment (TPRA)"
title_it: "Valutazione del rischio fornitori e terze parti IA (TPRA)"
category: operational
legal_basis: ["ISO/IEC 42001:2023 A.10.2", "ISO/IEC 42001:2023 A.10.3", "ISO/IEC 42001:2023 A.10.4", "Reg. (EU) 2024/1689 Art. 25", "GDPR Art. 28(1)-(4)", "GDPR Art. 32"]
related_frameworks: ["Reg. (EU) 2024/1689 Art. 13", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 53", "Reg. (EU) 2024/1689 Art. 55", "GDPR Chapter V", "ISO/IEC 42001:2023 8.1", "NIST AI RMF GOVERN 6.1", "NIST AI RMF GOVERN 6.2", "NIST AI RMF MAP 4.1", "NIST AI RMF MANAGE 3.1", "NIST AI RMF MANAGE 3.2", "NIST AI 600-1 (Value Chain and Component Integration)"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "Business owner of the vendor relationship; procurement, CISO and DPO as reviewers"
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

## 1. Vendor and service identification
<!-- basis: ISO/IEC 42001 A.10.3; 8.1 | fill: rag | evidence: required -->
*Identify the legal entity contracted and exactly which AI service, model and version is supplied. Vendor statements are cited as vendor evidence and marked as unverified unless independently confirmed.*

| Element | Value | Evidence |
|---|---|---|
| Vendor legal entity, registered office, group parent | {{vendor.entity}} | {{vendor.entity.evidence_ref}} |
| Service / product; model(s) and version(s) | {{vendor.service}} | {{vendor.service.evidence_ref}} |
| Type (GPAI model provider / AI system provider / AI-enabled SaaS / data or tooling supplier / integrator) | {{vendor.type}} | {{vendor.type.evidence_ref}} |
| Use cases supported and business criticality | {{vendor.use_cases}} / {{vendor.criticality}} | {{vendor.use_cases.evidence_ref}} |
| Contract(s) and dates (MSA, DPA, SLA, AI addendum) | {{vendor.contracts}} | {{vendor.contracts.evidence_ref}} |
| Inherent risk tier (drives depth of assessment) | {{vendor.tier}} | {{vendor.tier.evidence_ref}} |

## 2. Roles and allocation of responsibilities
<!-- basis: ISO/IEC 42001 A.10.2; Reg. (EU) 2024/1689 Art. 25; GDPR Art. 28 | fill: rag | evidence: required -->
*Determine roles under each framework and how responsibilities across the AI life cycle are split. Check whether the organisation's own actions (own name or trademark, substantial modification, change of intended purpose) make it a provider of a high-risk system under Art. 25(1).*

| Aspect | Assessment | Evidence |
|---|---|---|
| AI Act role of vendor / of the organisation | {{roles.ai_act_vendor}} / {{roles.ai_act_org}} | {{roles.ai_act.evidence_ref}} |
| Art. 25(1) trigger for the organisation (Y/N) and reasoning | {{roles.art25_trigger}} | {{roles.art25_trigger.evidence_ref}} |
| Written agreement on information, capabilities, technical access and assistance for high-risk systems (Art. 25(4)) | {{roles.art25_agreement}} | {{roles.art25_agreement.evidence_ref}} |
| GDPR role of vendor (processor / sub-processor / controller / joint controller), per processing purpose | {{roles.gdpr}} | {{roles.gdpr.evidence_ref}} |
| Responsibility matrix (who does what: data, model, deployment, monitoring, incidents) | {{roles.responsibility_matrix}} | {{roles.responsibility_matrix.evidence_ref}} |

## 3. AI and model documentation
<!-- basis: Reg. (EU) 2024/1689 Art. 13; Art. 53(1); Art. 55; ISO/IEC 42001 A.10.3 | fill: rag | evidence: required -->
*Record which documentation the vendor supplied and whether it is sufficient for the organisation to meet its own obligations. Applicability and dates: {{kb.eu_ai_act.timeline.gpai_obligations}}, {{kb.eu_ai_act.timeline.high_risk_obligations}}.*

| Item | Provided (Y / N / n.a.) | Assessment of sufficiency | Evidence |
|---|---|---|---|
| Instructions for use incl. intended purpose, accuracy, limitations, human oversight (high-risk systems, Art. 13) | {{doc.ifu.provided}} | {{doc.ifu.assessment}} | {{doc.ifu.evidence_ref}} |
| EU declaration of conformity / CE marking / EU database registration (high-risk systems) | {{doc.conformity.provided}} | {{doc.conformity.assessment}} | {{doc.conformity.evidence_ref}} |
| GPAI information and documentation for downstream providers (Art. 53(1)(b)) | {{doc.gpai_info.provided}} | {{doc.gpai_info.assessment}} | {{doc.gpai_info.evidence_ref}} |
| Copyright policy and public summary of training content (Art. 53(1)(c)-(d)) | {{doc.copyright.provided}} | {{doc.copyright.assessment}} | {{doc.copyright.evidence_ref}} |
| GPAI with systemic risk: evaluation, risk mitigation, incident reporting, cybersecurity (Art. 55) | {{doc.systemic.provided}} | {{doc.systemic.assessment}} | {{doc.systemic.evidence_ref}} |
| Adherence to codes of practice or harmonised standards | {{doc.codes.provided}} | {{doc.codes.assessment}} | {{doc.codes.evidence_ref}} |
| Model / system card, evaluation and red-teaming results, known limitations | {{doc.model_card.provided}} | {{doc.model_card.assessment}} | {{doc.model_card.evidence_ref}} |
| Model change, versioning and deprecation policy; notice period | {{doc.change_policy.provided}} | {{doc.change_policy.assessment}} | {{doc.change_policy.evidence_ref}} |
| Acceptable use policy and usage restrictions | {{doc.aup.provided}} | {{doc.aup.assessment}} | {{doc.aup.evidence_ref}} |

## 4. Data protection
<!-- basis: GDPR Art. 28(1)-(4); Art. 32; Art. 33(2) | fill: rag | evidence: required -->
*Complete where the vendor processes personal data on the organisation's behalf. Cite the DPA clause for each Art. 28(3) element.*

| Requirement | Finding (clause / practice) | Adequate (Y / N / partial) | Evidence |
|---|---|---|---|
| Sufficient guarantees of appropriate technical and organisational measures (Art. 28(1)) | {{dp.guarantees}} | {{dp.guarantees.adequate}} | {{dp.guarantees.evidence_ref}} |
| Contract sets subject-matter, duration, nature, purpose, data types, data subjects (Art. 28(3)) | {{dp.contract_scope}} | {{dp.contract_scope.adequate}} | {{dp.contract_scope.evidence_ref}} |
| (a) Processing only on documented instructions, incl. transfers | {{dp.a}} | {{dp.a.adequate}} | {{dp.a.evidence_ref}} |
| (b) Confidentiality of authorised persons | {{dp.b}} | {{dp.b.adequate}} | {{dp.b.evidence_ref}} |
| (c) Security measures under Art. 32 | {{dp.c}} | {{dp.c.adequate}} | {{dp.c.evidence_ref}} |
| (d) Sub-processor conditions (Art. 28(2), 28(4)) | {{dp.d}} | {{dp.d.adequate}} | {{dp.d.evidence_ref}} |
| (e) Assistance with data subject rights | {{dp.e}} | {{dp.e.adequate}} | {{dp.e.evidence_ref}} |
| (f) Assistance with Art. 32-36 obligations (security, breach, DPIA) | {{dp.f}} | {{dp.f.adequate}} | {{dp.f.evidence_ref}} |
| (g) Deletion or return of data at end of service | {{dp.g}} | {{dp.g.adequate}} | {{dp.g.evidence_ref}} |
| (h) Information for and contribution to audits | {{dp.h}} | {{dp.h.adequate}} | {{dp.h.evidence_ref}} |
| Breach notification to controller without undue delay (Art. 33(2)) | {{dp.breach}} | {{dp.breach.adequate}} | {{dp.breach.evidence_ref}} |
| Use of customer data (prompts, outputs, files) for vendor's own purposes, incl. model training | {{dp.own_use}} | {{dp.own_use.adequate}} | {{dp.own_use.evidence_ref}} |
| Retention of prompts, outputs and logs; abuse monitoring and human review | {{dp.retention}} | {{dp.retention.adequate}} | {{dp.retention.evidence_ref}} |

## 5. Sub-processors and data location
<!-- basis: GDPR Art. 28(2), 28(4); Chapter V (Art. 44-46) | fill: rag | evidence: required -->
*List every sub-processor and location where data is stored, processed or remotely accessed, including inference regions and support access.*

| Entity (vendor / sub-processor) | Service performed | Data involved | Country of processing / access | Transfer tool | TIA ref | Authorisation (specific / general) and change-notice period | Evidence |
|---|---|---|---|---|---|---|---|
{{#each vendor.subprocessors}}
| {{entity}} | {{service}} | {{data}} | {{country}} | {{transfer_tool}} | {{tia_ref}} | {{authorisation}} | {{evidence_ref}} |
{{/each}}

Data residency option selected: {{vendor.residency}} | Evidence: {{vendor.residency.evidence_ref}}

## 6. Security and resilience
<!-- basis: GDPR Art. 32; ISO/IEC 42001 A.10.3; NIST AI RMF MANAGE 3.1 | fill: rag | evidence: required -->
*Rely on independent assurance where available; record report period and scope, and whether the AI service assessed is inside that scope.*

| Topic | Finding | Evidence |
|---|---|---|
| Certifications and audit reports (e.g. ISO/IEC 27001, ISO/IEC 42001, SOC 2): scope, period, exceptions | {{sec.assurance}} | {{sec.assurance.evidence_ref}} |
| Encryption in transit and at rest; key management | {{sec.encryption}} | {{sec.encryption.evidence_ref}} |
| Access control, tenant isolation, logging | {{sec.access}} | {{sec.access.evidence_ref}} |
| AI-specific security (prompt injection, data poisoning, model extraction, output filtering) | {{sec.ai_specific}} | {{sec.ai_specific.evidence_ref}} |
| Vulnerability management and penetration / red-team testing | {{sec.testing}} | {{sec.testing.evidence_ref}} |
| Incident response and notification commitments | {{sec.incidents}} | {{sec.incidents.evidence_ref}} |
| Availability, SLA, business continuity, exit and portability | {{sec.continuity}} | {{sec.continuity.evidence_ref}} |

## 7. Customer-facing commitments
<!-- basis: ISO/IEC 42001 A.10.4 | fill: rag | evidence: optional -->
*Complete where the vendor's service is embedded in products or services the organisation provides to its own customers: check that vendor terms allow the organisation to meet what its customers expect.*

{{vendor.customer_commitments}}

## 8. Risk rating, conditions and decision
<!-- basis: ISO/IEC 42001 A.10.3; 6.1.2; NIST AI RMF GOVERN 6.1 | fill: user | evidence: required -->
*Rate each domain, list open findings with required conditions and record the decision. Scale: {{kb.risk_matrix.bands}}.*

| Domain | Rating | Main findings | Condition / remediation | Owner | Due date |
|---|---|---|---|---|---|
| Roles and contractual allocation | {{rating.roles}} | {{rating.roles.findings}} | {{rating.roles.condition}} | {{rating.roles.owner}} | {{rating.roles.due}} |
| AI and model documentation | {{rating.documentation}} | {{rating.documentation.findings}} | {{rating.documentation.condition}} | {{rating.documentation.owner}} | {{rating.documentation.due}} |
| Data protection | {{rating.dp}} | {{rating.dp.findings}} | {{rating.dp.condition}} | {{rating.dp.owner}} | {{rating.dp.due}} |
| Sub-processors and data location | {{rating.location}} | {{rating.location.findings}} | {{rating.location.condition}} | {{rating.location.owner}} | {{rating.location.due}} |
| Security and resilience | {{rating.security}} | {{rating.security.findings}} | {{rating.security.condition}} | {{rating.security.owner}} | {{rating.security.due}} |

Overall residual vendor risk: {{rating.overall}} | Decision (approve / approve with conditions / reject): {{rating.decision}}

## 9. Ongoing monitoring
<!-- basis: ISO/IEC 42001 A.10.3; NIST AI RMF MANAGE 3.1; GOVERN 6.2 | fill: user | evidence: optional -->
*Define reassessment frequency and events that trigger an earlier review; record contingency arrangements for failure of the vendor or model.*

Next reassessment: {{monitoring.next_date}} | Triggers (model version change, new sub-processor, incident, change of terms): {{monitoring.triggers}} | Contingency / exit plan: {{monitoring.contingency}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5; GDPR Art. 5(2) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 A.10.3; GDPR Art. 28(1) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
