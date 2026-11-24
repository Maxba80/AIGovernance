---
id: tpl-ropa-ai-processing
title_en: "Record of Processing Activities for AI Processing (RoPA)"
title_it: "Registro delle attività di trattamento per trattamenti con IA"
category: gdpr
legal_basis: ["GDPR Art. 30(1)(a)-(g)", "GDPR Art. 30(2)(a)-(d)", "GDPR Art. 30(3)", "GDPR Art. 30(4)", "GDPR Art. 30(5)"]
related_frameworks: ["GDPR Art. 28", "GDPR Art. 32(1)", "GDPR Chapter V", "Reg. (EU) 2024/1689 Art. 4a", "ISO/IEC 42001 A.7", "ISO/IEC 42001 A.10", "NIST AI RMF GOVERN 1.6"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "Controller's representative (record owner); DPO consulted"
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

<!-- xlsx: sheet "Controller" = section 2, "Processor" = section 3, "LLM data flows" = section 4, "Sources" = Sources and evidence -->

## 1. Record holder and obligation to keep the record
<!-- basis: GDPR Art. 30(1)(a); Art. 30(2)(a); Art. 30(5) | fill: user | evidence: required -->
*Identify the organisation and its contacts. The Art. 30(5) exemption does not apply where processing is not occasional, is risky, or includes Art. 9(1) / Art. 10 data; record the conclusion.*

| Element | Value | Evidence |
|---|---|---|
| Controller name and contact details | {{controller.name}}; {{controller.contact}} | {{controller.evidence_ref}} |
| Joint controller(s), if any | {{controller.joint}} | {{controller.joint.evidence_ref}} |
| Controller's representative (Art. 27), if any | {{controller.representative}} | {{controller.representative.evidence_ref}} |
| Data protection officer | {{dpo.name}}; {{dpo.contact}} | {{dpo.evidence_ref}} |
| Art. 30(5) exemption assessed | {{ropa.exemption_conclusion}} | {{ropa.exemption.evidence_ref}} |

## 2. Controller record
<!-- basis: GDPR Art. 30(1)(b)-(g) | fill: rag | evidence: required -->
*One row per processing activity that involves an AI system. Do not merge activities with different purposes. Time limits and security measures are given "where possible" under the provision; state "not determined" with a reason rather than leaving blank.*

| Activity ID | Processing activity / AI system | (b) Purposes | (c) Categories of data subjects | (c) Categories of personal data | (d) Categories of recipients (incl. third countries / international organisations) | (e) Third-country transfers: country and safeguard | (f) Erasure time limits | (g) Security measures (Art. 32(1)) | Evidence |
|---|---|---|---|---|---|---|---|---|---|
{{#each ropa.controller_activities}}
| {{id}} | {{activity}} / {{ai_system}} | {{purposes}} | {{data_subjects}} | {{data_categories}} | {{recipients}} | {{transfer_country}}: {{transfer_safeguard}} | {{erasure_limits}} | {{security_measures}} | {{evidence_ref}} |
{{/each}}

*For transfers under Art. 49(1), second subparagraph, document the suitable safeguards in column (e).*

## 3. Processor record
<!-- basis: GDPR Art. 30(2)(a)-(d) | fill: rag | evidence: required -->
*Complete only where the organisation processes on behalf of other controllers (e.g. it operates an AI service for clients). One row per controller and category of processing.*

| Entry ID | (a) Processor(s) and controller on whose behalf it acts (name, contact, representative, DPO) | (b) Categories of processing carried out | (c) Third-country transfers: country and safeguard | (d) Security measures (Art. 32(1)) | Evidence |
|---|---|---|---|---|---|
{{#each ropa.processor_entries}}
| {{id}} | {{processor}} / {{controller}} | {{processing_categories}} | {{transfer_country}}: {{transfer_safeguard}} | {{security_measures}} | {{evidence_ref}} |
{{/each}}

## 4. Data flows to LLM and AI service providers
<!-- basis: GDPR Art. 30(1)(d), 30(1)(e); Art. 28(2), 28(3); Chapter V | fill: rag | evidence: required -->
*Extension of columns (d) and (e): one row per provider and per flow (prompt, retrieved context, file upload, fine-tuning data, logs, embeddings). Cite the contract or provider documentation for every cell.*

| Flow ID | Activity ID | Provider / model / API endpoint | GDPR role of provider | Data sent (categories; Art. 9 data Y/N) | Processing location(s) | Sub-processors | Transfer tool (adequacy / SCC module / other) and TIA ref | Provider retention of prompts and outputs | Used for provider model training (Y/N) | DPA reference (Art. 28(3)) | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
{{#each ropa.llm_flows}}
| {{id}} | {{activity_id}} | {{provider}} / {{model}} / {{endpoint}} | {{provider_role}} | {{data_sent}}; {{special_categories}} | {{locations}} | {{sub_processors}} | {{transfer_tool}}; {{tia_ref}} | {{provider_retention}} | {{training_use}} | {{dpa_ref}} | {{evidence_ref}} |
{{/each}}

## 5. Complementary information (not required by Art. 30)
<!-- basis: GDPR Art. 5(2); Art. 6; Art. 9; Art. 35; Reg. (EU) 2024/1689 Art. 4a | fill: computed | evidence: optional -->
*Good-practice fields that link the record to other deliverables. Where special categories are processed for bias detection and correction under the AI Act, the record must state why that processing was strictly necessary; verify the current location of this rule in {{kb.eu_ai_act.consolidated.special_category_bias_processing}}.*

| Activity ID | Lawful basis (Art. 6) | Art. 9(2) condition | DPIA ref | LIA ref | AI Act risk class | Automated decision (Art. 22) Y/N | Reason special-category bias processing is strictly necessary | Evidence |
|---|---|---|---|---|---|---|---|---|
{{#each ropa.complementary}}
| {{activity_id}} | {{lawful_basis}} | {{art9_condition}} | {{dpia_ref}} | {{lia_ref}} | {{ai_act_class}} | {{art22}} | {{bias_processing_reason}} | {{evidence_ref}} |
{{/each}}

## 6. Form, availability and maintenance of the record
<!-- basis: GDPR Art. 30(3), 30(4) | fill: user | evidence: optional -->
*The record is kept in writing, including electronic form, and made available to the supervisory authority on request. State the update procedure and the last full review.*

Format and location: {{ropa.format_location}} | Update procedure: {{ropa.update_procedure}} | Last full review: {{ropa.last_review}} | Next review: {{ropa.next_review}}
Change log: {{ropa.change_log}}

## Sources and evidence
<!-- basis: GDPR Art. 5(2); Art. 24(1) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: GDPR Art. 30(1); Art. 30(4); Art. 24(1) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
