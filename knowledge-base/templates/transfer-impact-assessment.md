---
id: tpl-transfer-impact-assessment
title_en: "Transfer Impact Assessment (TIA) for Extra-EU AI APIs"
title_it: "Valutazione d'impatto del trasferimento (TIA) per API di IA extra-UE"
category: gdpr
legal_basis: ["GDPR Art. 44", "GDPR Art. 45", "GDPR Art. 46(1)", "GDPR Art. 46(2)(c)", "GDPR Art. 49", "Commission Implementing Decision (EU) 2021/914, Clauses 14 and 15", "EDPB Recommendations 01/2020 (v2.0)", "CJEU C-311/18 (Schrems II)"]
related_frameworks: ["EDPB Recommendations 02/2020 (European Essential Guarantees)", "GDPR Art. 28(3)(a)", "GDPR Art. 30(1)(e)", "GDPR Art. 32", "ISO/IEC 42001 A.10.3", "NIST AI RMF GOVERN 6.1"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "Data exporter's accountable manager; DPO and legal counsel consulted"
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

## 1. Step 1 - Know your transfers
<!-- basis: EDPB Recommendations 01/2020, Step 1; GDPR Art. 44; Art. 30(1)(e) | fill: rag | evidence: required -->
*Map every transfer, including onward transfers and remote access (support, sub-processors). For AI APIs list each data flow separately: prompts, retrieved context, uploaded files, fine-tuning data, logs and abuse-monitoring copies. Verify data is adequate, relevant and limited to what is necessary.*

| Transfer ID | Exporter (role) | Importer (role, legal entity, country) | AI service / API endpoint | Data categories and data subjects | Art. 9 data (Y/N) | Purpose | Format in transit / at rest | Storage and access locations | Onward transfers / sub-processors | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
{{#each tia.transfers}}
| {{id}} | {{exporter}} ({{exporter_role}}) | {{importer}} ({{importer_role}}, {{importer_country}}) | {{service}} | {{data_categories}}; {{data_subjects}} | {{special_categories}} | {{purpose}} | {{format}} | {{locations}} | {{onward}} | {{evidence_ref}} |
{{/each}}

Is the importer itself subject to the GDPR for this processing (Art. 3(2))? {{tia.importer_gdpr_subject}} | Evidence: {{tia.importer_gdpr_subject.evidence_ref}}

## 2. Step 2 - Identify the transfer tool
<!-- basis: EDPB Recommendations 01/2020, Step 2; GDPR Art. 45, 46, 49 | fill: rag | evidence: required -->
*Identify the Chapter V tool per transfer. With a valid adequacy decision covering the importer, steps 3 and 4 are not required, but validity must be monitored. Art. 49 derogations are exceptional and not suitable for systematic API use.*

| Transfer ID | Tool | Details | Evidence |
|---|---|---|---|
{{#each tia.tools}}
| {{transfer_id}} | {{tool}} | {{details}} | {{evidence_ref}} |
{{/each}}

Where the tool is the SCCs under Decision (EU) 2021/914:

| Element | Value | Evidence |
|---|---|---|
| Module (One C2C / Two C2P / Three P2P / Four P2C) | {{scc.module}} | {{scc.module.evidence_ref}} |
| Date of signature and parties (Annex I.A) | {{scc.signature}} | {{scc.signature.evidence_ref}} |
| Description of transfer (Annex I.B) consistent with section 1 | {{scc.annex_ib}} | {{scc.annex_ib.evidence_ref}} |
| Technical and organisational measures (Annex II) | {{scc.annex_ii}} | {{scc.annex_ii.evidence_ref}} |
| Sub-processor authorisation and list (Clause 9; Annex III where used) | {{scc.subprocessors}} | {{scc.subprocessors.evidence_ref}} |
| Clauses unmodified; optional clauses selected | {{scc.options}} | {{scc.options.evidence_ref}} |
| Adequacy decision / certification status of importer, if relied on | {{tia.adequacy_status}} | {{tia.adequacy_status.evidence_ref}} |

## 3. Step 3 - Assess the law and practice of the third country
<!-- basis: EDPB Recommendations 01/2020, Step 3; SCC Clause 14(a)-(d); EDPB Recommendations 02/2020 | fill: kb | evidence: required -->
*Assess whether anything in the law or practice of the destination country may impinge on the effectiveness of the transfer tool for this specific transfer. Use objective, reliable, verifiable and publicly available sources; the importer's information (Clause 14(c)) is cited as evidence, not accepted on its word. Normative country material: {{kb.third_countries.legal_profile}}.*

| Aspect (Clause 14(b)) | Assessment | Evidence |
|---|---|---|
| Circumstances of the transfer (chain length, actors, channels, data type and format, sector, storage location) | {{law.circumstances}} | {{law.circumstances.evidence_ref}} |
| Laws and practices on public-authority access applicable to this importer and data | {{law.access_laws}} | {{law.access_laws.evidence_ref}} |
| Importer's practical experience with access requests (transparency reports, Clause 14(c) statements) | {{law.practical_experience}} | {{law.practical_experience.evidence_ref}} |

| European Essential Guarantee | Met (Y/N/partly) | Reasoning | Evidence |
|---|---|---|---|
| A. Processing based on clear, precise and accessible rules | {{eeg.a.met}} | {{eeg.a.reason}} | {{eeg.a.evidence_ref}} |
| B. Necessity and proportionality with regard to legitimate objectives | {{eeg.b.met}} | {{eeg.b.reason}} | {{eeg.b.evidence_ref}} |
| C. Independent oversight mechanism | {{eeg.c.met}} | {{eeg.c.reason}} | {{eeg.c.evidence_ref}} |
| D. Effective remedies available to the individual | {{eeg.d.met}} | {{eeg.d.reason}} | {{eeg.d.evidence_ref}} |

Conclusion: is the transfer tool effective without supplementary measures? {{law.conclusion}}

## 4. Step 4 - Identify and adopt supplementary measures
<!-- basis: EDPB Recommendations 01/2020, Step 4 and Annex 2; SCC Clause 14(b)(iii); GDPR Art. 32 | fill: rag | evidence: required -->
*Needed where step 3 shows the tool alone is not effective. Note for AI APIs: the provider must process prompts in the clear for inference, so encryption with exporter-held keys does not protect data during processing; prefer pseudonymisation or redaction before the call, EU-region processing, zero data retention and disabled human review.*

| Measure | Type (technical / contractual / organisational) | Addresses which gap | Status | Effectiveness assessment | Evidence |
|---|---|---|---|---|---|
{{#each tia.supplementary_measures}}
| {{measure}} | {{type}} | {{gap}} | {{status}} | {{effectiveness}} | {{evidence_ref}} |
{{/each}}

Conclusion: essentially equivalent level of protection ensured? {{measures.conclusion}}
If no effective measure exists: transfer not started / suspended on {{measures.suspension_date}}; supervisory authority notified: {{measures.sa_notification}}

## 5. Step 5 - Procedural steps
<!-- basis: EDPB Recommendations 01/2020, Step 5; GDPR Art. 46(2), 46(3) | fill: user | evidence: optional -->
*Record formal steps the tool requires. Supplementary measures that do not contradict the SCCs need no authorisation; modified or ad hoc clauses do (Art. 46(3)(a)).*

{{tia.procedural_steps}}

## 6. Step 6 - Re-evaluation
<!-- basis: EDPB Recommendations 01/2020, Step 6; SCC Clause 14(e)-(f), Clause 15 | fill: user | evidence: required -->
*Define monitoring of legal developments and of importer notifications about access requests or changes in law, and the triggers for suspension.*

| Element | Value |
|---|---|
| Review frequency and next review date | {{review.frequency}} / {{review.next_date}} |
| Monitoring sources (adequacy decision status, EDPB / authority guidance, provider sub-processor notices) | {{review.sources}} |
| Importer notifications received (Clause 14(e), Clause 15.1) | {{review.importer_notifications}} |
| Suspension / termination triggers and responsible role | {{review.triggers}} |

## 7. Overall conclusion
<!-- basis: GDPR Art. 44; Art. 5(2); SCC Clause 14(d) | fill: user | evidence: required -->
*Summarise the decision per transfer. Under Clause 14(d) this assessment is documented and made available to the supervisory authority on request.*

| Transfer ID | Decision (proceed / proceed with measures / do not transfer) | Conditions | Residual risk |
|---|---|---|---|
{{#each tia.decisions}}
| {{transfer_id}} | {{decision}} | {{conditions}} | {{residual_risk}} |
{{/each}}

## Sources and evidence
<!-- basis: GDPR Art. 5(2); Art. 24(1) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: GDPR Art. 5(2); Art. 44; SCC Clause 14(d) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
