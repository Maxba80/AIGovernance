---
id: tpl-ai-enhanced-dpia
title_en: "AI-Enhanced Data Protection Impact Assessment (DPIA)"
title_it: "Valutazione d'impatto sulla protezione dei dati (DPIA) integrata per sistemi di IA"
category: gdpr
legal_basis: ["GDPR Art. 35(1)", "GDPR Art. 35(2)", "GDPR Art. 35(3)", "GDPR Art. 35(7)(a)-(d)", "GDPR Art. 35(9)", "GDPR Art. 35(11)", "GDPR Art. 36(1)", "GDPR Art. 36(3)"]
related_frameworks: ["Reg. (EU) 2024/1689 Art. 26(9)", "Reg. (EU) 2024/1689 Art. 27(4)", "EDPB Opinion 28/2024", "WP248 rev.01 (DPIA guidelines)", "ISO/IEC 42001 6.1.4", "ISO/IEC 42001 A.5", "NIST AI RMF MAP 5.1", "NIST AI RMF MEASURE 2.10"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "Controller's accountable process owner, after documented DPO advice (GDPR Art. 35(2))"
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

## 1. Screening: is a DPIA required?
<!-- basis: GDPR Art. 35(1), 35(3), 35(4); WP248 rev.01 criteria | fill: user | evidence: required -->
*State why the processing is (or is not) likely to result in a high risk. Check the Art. 35(3) cases, the supervisory authority list under Art. 35(4) and the WP248 criteria.*

| Trigger | Applies (Y/N) | Reasoning | Evidence |
|---|---|---|---|
| Systematic and extensive evaluation based on automated processing, including profiling (Art. 35(3)(a)) | {{screening.a.applies}} | {{screening.a.reason}} | {{screening.a.evidence_ref}} |
| Large-scale processing of Art. 9(1) or Art. 10 data (Art. 35(3)(b)) | {{screening.b.applies}} | {{screening.b.reason}} | {{screening.b.evidence_ref}} |
| Systematic monitoring of a publicly accessible area on a large scale (Art. 35(3)(c)) | {{screening.c.applies}} | {{screening.c.reason}} | {{screening.c.evidence_ref}} |
| National list of the competent supervisory authority (Art. 35(4)): {{kb.gdpr.dpia_list.authority}} | {{screening.list.applies}} | {{screening.list.reason}} | {{screening.list.evidence_ref}} |
| WP248 criteria met (innovative technology, vulnerable subjects, etc.) | {{screening.wp248.count}} | {{screening.wp248.reason}} | {{screening.wp248.evidence_ref}} |

Conclusion: {{screening.conclusion}}

## 2. Systematic description of the processing
<!-- basis: GDPR Art. 35(7)(a) | fill: rag | evidence: required -->
*Describe nature, scope, context and purposes. Where the lawful basis is Art. 6(1)(f), state the legitimate interest pursued and reference the LIA.*

| Element | Description | Evidence |
|---|---|---|
| Purposes of the processing | {{processing.purposes}} | {{processing.purposes.evidence_ref}} |
| Legitimate interest pursued (if Art. 6(1)(f)) | {{processing.legitimate_interest}} | {{processing.lia_ref}} |
| Processing operations (collection to deletion) | {{processing.operations}} | {{processing.operations.evidence_ref}} |
| Categories of data subjects (incl. vulnerable persons) | {{processing.data_subjects}} | {{processing.data_subjects.evidence_ref}} |
| Categories of personal data (incl. Art. 9 / Art. 10 data) | {{processing.data_categories}} | {{processing.data_categories.evidence_ref}} |
| Volume, frequency, geographic scope | {{processing.scale}} | {{processing.scale.evidence_ref}} |
| Recipients, processors and sub-processors | {{processing.recipients}} | {{processing.recipients.evidence_ref}} |
| Retention periods | {{processing.retention}} | {{processing.retention.evidence_ref}} |
| RoPA entry reference | {{processing.ropa_ref}} | {{processing.ropa_ref.evidence_ref}} |

## 3. AI system description and data flows
<!-- basis: GDPR Art. 35(7)(a); Reg. (EU) 2024/1689 Art. 26(9) | fill: rag | evidence: required -->
*For high-risk AI systems the deployer uses the provider's instructions for use (AI Act Art. 13) to complete this section, as required by Art. 26(9). Describe each lifecycle phase in which personal data is processed.*

| Element | Description | Evidence |
|---|---|---|
| AI system, model and version; provider | {{ai.model}} | {{ai.model.evidence_ref}} |
| AI Act classification and organisation's role | {{ai.classification}} / {{ai.role}} | {{ai.classification.evidence_ref}} |
| GDPR roles (controller, joint controller, model provider as processor or separate controller) | {{ai.gdpr_roles}} | {{ai.gdpr_roles.evidence_ref}} |
| Training / fine-tuning data: origin, lawful basis, personal data content | {{ai.training_data}} | {{ai.training_data.evidence_ref}} |
| Inference inputs (prompts, retrieved context, uploaded files) | {{ai.inputs}} | {{ai.inputs.evidence_ref}} |
| Outputs and their downstream use (incl. decisions about individuals) | {{ai.outputs}} | {{ai.outputs.evidence_ref}} |
| Prompt and output logging: content, location, retention, access | {{ai.logging}} | {{ai.logging.evidence_ref}} |
| Provider reuse of customer data for model improvement | {{ai.provider_reuse}} | {{ai.provider_reuse.evidence_ref}} |
| Hosting locations and third-country transfers (TIA reference) | {{ai.locations}} | {{ai.tia_ref}} |

Data flow diagram: {{ai.data_flow_diagram}}

## 4. Necessity and proportionality
<!-- basis: GDPR Art. 35(7)(b); Art. 5(1); Art. 6; Art. 9; Art. 12-22; Art. 28; Chapter V | fill: user | evidence: required -->
*Assess the processing against the purposes. Explain why less intrusive alternatives (no personal data, anonymised or synthetic data, smaller model scope) were not sufficient.*

| Aspect | Assessment | Evidence |
|---|---|---|
| Lawful basis (Art. 6) and, if applicable, Art. 9(2) condition | {{np.lawful_basis}} | {{np.lawful_basis.evidence_ref}} |
| Purpose limitation and compatibility of reuse (e.g. training) | {{np.purpose_limitation}} | {{np.purpose_limitation.evidence_ref}} |
| Data minimisation in prompts, context and logs | {{np.minimisation}} | {{np.minimisation.evidence_ref}} |
| Accuracy of inputs and of generated output about individuals | {{np.accuracy}} | {{np.accuracy.evidence_ref}} |
| Storage limitation | {{np.storage_limitation}} | {{np.storage_limitation.evidence_ref}} |
| Transparency and information to data subjects (Art. 13/14) | {{np.transparency}} | {{np.transparency.evidence_ref}} |
| Exercise of rights, including against model and logs (Art. 15-22) | {{np.rights}} | {{np.rights.evidence_ref}} |
| Processor contracts (Art. 28(3)) | {{np.processors}} | {{np.processors.evidence_ref}} |
| International transfers (Chapter V) | {{np.transfers}} | {{np.transfers.evidence_ref}} |
| Alternatives considered | {{np.alternatives}} | {{np.alternatives.evidence_ref}} |

## 5. Risks to the rights and freedoms of data subjects
<!-- basis: GDPR Art. 35(7)(c); EDPB Opinion 28/2024 | fill: computed | evidence: required -->
*Assess each risk from the data subject's perspective (origin, nature, likelihood, severity). The AI-specific rows below are mandatory prompts; mark "not applicable" with a reason instead of deleting them. Scale: {{kb.risk_matrix.scale_5x5}}.*

| ID | Risk | Applicable (Y/N) and scenario | Likelihood (1-5) | Severity (1-5) | Inherent level | Evidence |
|---|---|---|---|---|---|---|
| R-01 | Unlawful or incompatible use of personal data in training / fine-tuning | {{risk.r01.scenario}} | {{risk.r01.l}} | {{risk.r01.s}} | {{risk.r01.level}} | {{risk.r01.evidence_ref}} |
| R-02 | Memorisation and regurgitation of personal data by the model | {{risk.r02.scenario}} | {{risk.r02.l}} | {{risk.r02.s}} | {{risk.r02.level}} | {{risk.r02.evidence_ref}} |
| R-03 | Inference of sensitive attributes (Art. 9) from non-sensitive data | {{risk.r03.scenario}} | {{risk.r03.l}} | {{risk.r03.s}} | {{risk.r03.level}} | {{risk.r03.evidence_ref}} |
| R-04 | Hallucinated (inaccurate) personal data in outputs (Art. 5(1)(d)) | {{risk.r04.scenario}} | {{risk.r04.l}} | {{risk.r04.s}} | {{risk.r04.level}} | {{risk.r04.evidence_ref}} |
| R-05 | Excessive prompt / output logging and secondary use of logs | {{risk.r05.scenario}} | {{risk.r05.l}} | {{risk.r05.s}} | {{risk.r05.level}} | {{risk.r05.evidence_ref}} |
| R-06 | Model provider acting outside instructions (processor becoming controller, sub-processor chain) | {{risk.r06.scenario}} | {{risk.r06.l}} | {{risk.r06.s}} | {{risk.r06.level}} | {{risk.r06.evidence_ref}} |
| R-07 | Disclosure through prompt injection, data exfiltration or cross-tenant leakage | {{risk.r07.scenario}} | {{risk.r07.l}} | {{risk.r07.s}} | {{risk.r07.level}} | {{risk.r07.evidence_ref}} |
| R-08 | Discriminatory or unfair outcomes; solely automated decisions (Art. 22) | {{risk.r08.scenario}} | {{risk.r08.l}} | {{risk.r08.s}} | {{risk.r08.level}} | {{risk.r08.evidence_ref}} |
| R-09 | Inability to honour access, rectification, erasure or objection in model or logs | {{risk.r09.scenario}} | {{risk.r09.l}} | {{risk.r09.s}} | {{risk.r09.level}} | {{risk.r09.evidence_ref}} |
| R-10 | Access by third-country authorities | {{risk.r10.scenario}} | {{risk.r10.l}} | {{risk.r10.s}} | {{risk.r10.level}} | {{risk.r10.evidence_ref}} |
{{#each risks.additional}}
| {{id}} | {{risk}} | {{scenario}} | {{l}} | {{s}} | {{level}} | {{evidence_ref}} |
{{/each}}

## 6. Measures envisaged to address the risks
<!-- basis: GDPR Art. 35(7)(d); Art. 25; Art. 32 | fill: rag | evidence: required -->
*List safeguards, security measures and mechanisms that protect personal data and demonstrate compliance. Each measure must be evidenced (policy, configuration export, contract clause, test report).*

| Risk ID | Measure | Type (technical / organisational / contractual) | Owner | Status | Residual L x S | Residual level | Evidence |
|---|---|---|---|---|---|---|---|
{{#each measures}}
| {{risk_id}} | {{measure}} | {{type}} | {{owner}} | {{status}} | {{residual_l}} x {{residual_s}} | {{residual_level}} | {{evidence_ref}} |
{{/each}}

## 7. Advice of the data protection officer
<!-- basis: GDPR Art. 35(2); Art. 39(1)(c) | fill: user | evidence: required -->
*Record the DPO's advice verbatim and whether the controller followed it; if not, document the reasons.*

DPO: {{dpo.name}} | Date of advice: {{dpo.advice_date}}
Advice: {{dpo.advice}}
Controller's response: {{dpo.controller_response}}

## 8. Views of data subjects or their representatives
<!-- basis: GDPR Art. 35(9) | fill: user | evidence: optional -->
*Record how views were sought (survey, works council, user panel) or justify why seeking them was not appropriate.*

{{consultation.data_subjects}}

## 9. Residual risk and prior consultation
<!-- basis: GDPR Art. 36(1), 36(3) | fill: computed | evidence: required -->
*If residual risk remains high after the measures in section 6, the controller must consult the supervisory authority before processing starts and provide the Art. 36(3) information.*

Highest residual risk level: {{residual.max_level}}
Prior consultation required: {{residual.prior_consultation_required}} | Authority: {{residual.authority}} | Submission reference: {{residual.submission_ref}}

## 10. Link to the fundamental rights impact assessment (FRIA)
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1), 27(4) | fill: computed | evidence: optional -->
*Where a FRIA is required, it complements this DPIA: elements already covered here are referenced, not repeated. Applicability and dates: {{kb.eu_ai_act.timeline.fria_obligation}}.*

| FRIA element (Art. 27(1)) | Covered in this DPIA (section) | Complement needed in FRIA |
|---|---|---|
| (a) Deployer's processes in which the system is used | {{fria.a.dpia_section}} | {{fria.a.gap}} |
| (b) Period and frequency of use | {{fria.b.dpia_section}} | {{fria.b.gap}} |
| (c) Categories of persons and groups likely to be affected | {{fria.c.dpia_section}} | {{fria.c.gap}} |
| (d) Specific risks of harm | {{fria.d.dpia_section}} | {{fria.d.gap}} |
| (e) Human oversight measures | {{fria.e.dpia_section}} | {{fria.e.gap}} |
| (f) Measures if risks materialise, governance and complaint mechanisms | {{fria.f.dpia_section}} | {{fria.f.gap}} |

FRIA document reference: {{fria.document_ref}}

## 11. Review and change triggers
<!-- basis: GDPR Art. 35(11) | fill: user | evidence: optional -->
*Define when the DPIA is reviewed: at least on change of model, provider, purpose, data categories or risk level.*

Next review date: {{review.next_date}} | Triggers: {{review.triggers}} | Change log: {{review.change_log}}

## Sources and evidence
<!-- basis: GDPR Art. 5(2); Art. 24(1) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: GDPR Art. 35(1); Art. 35(2); Art. 24(1) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
