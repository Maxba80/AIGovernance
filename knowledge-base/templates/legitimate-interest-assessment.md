---
id: tpl-legitimate-interest-assessment
title_en: "Legitimate Interest Assessment (LIA) for AI Processing"
title_it: "Valutazione del legittimo interesse (LIA) per trattamenti con IA"
category: gdpr
legal_basis: ["GDPR Art. 6(1)(f)", "GDPR Art. 5(1)(a)-(c)", "GDPR Art. 5(2)", "GDPR Art. 13(1)(d)", "GDPR Art. 14(2)(b)", "GDPR Art. 21(1)", "GDPR Recital 47"]
related_frameworks: ["EDPB Opinion 28/2024", "EDPB Guidelines 1/2024 (Art. 6(1)(f))", "GDPR Art. 35(7)(a)", "ISO/IEC 42001 A.7.3", "NIST AI RMF GOVERN 1.1"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "Controller's accountable process owner; DPO consulted"
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

## 1. Processing in scope and preliminary checks
<!-- basis: GDPR Art. 6(1)(f); Art. 6(1) second subparagraph; Art. 9(1) | fill: rag | evidence: required -->
*Describe the processing and the AI lifecycle phase assessed (development / fine-tuning or deployment); EDPB Opinion 28/2024 treats these as separate phases needing separate assessments. Art. 6(1)(f) is not available to public authorities in the performance of their tasks and does not by itself permit processing of Art. 9 data.*

| Element | Description | Evidence |
|---|---|---|
| Processing activity and RoPA reference | {{lia.activity}} / {{lia.ropa_ref}} | {{lia.activity.evidence_ref}} |
| AI lifecycle phase assessed | {{lia.phase}} | {{lia.phase.evidence_ref}} |
| Personal data and data subjects concerned | {{lia.data}} / {{lia.data_subjects}} | {{lia.data.evidence_ref}} |
| Data source (collected from data subject, third party, web scraping, user prompts) | {{lia.data_source}} | {{lia.data_source.evidence_ref}} |
| Controller is a public authority acting in performance of its tasks (Y/N) | {{lia.public_authority}} | {{lia.public_authority.evidence_ref}} |
| Special categories or criminal data involved (Y/N); Art. 9(2) condition | {{lia.special_categories}} | {{lia.special_categories.evidence_ref}} |
| Is the AI model itself anonymous (Opinion 28/2024 test)? | {{lia.model_anonymity}} | {{lia.model_anonymity.evidence_ref}} |

## 2. Step 1 - Purpose test: is a legitimate interest pursued?
<!-- basis: GDPR Art. 6(1)(f); Recital 47; EDPB Opinion 28/2024 (step 1) | fill: user | evidence: required -->
*Identify the interest of the controller or a third party. It must be lawful, clearly and precisely articulated, and real and present (not speculative).*

| Criterion | Assessment | Evidence |
|---|---|---|
| Interest pursued and by whom (controller / third party) | {{purpose.interest}} | {{purpose.interest.evidence_ref}} |
| Lawful | {{purpose.lawful}} | {{purpose.lawful.evidence_ref}} |
| Clearly and precisely articulated | {{purpose.articulated}} | {{purpose.articulated.evidence_ref}} |
| Real and present | {{purpose.real_present}} | {{purpose.real_present.evidence_ref}} |

Step 1 outcome: {{purpose.outcome}}

## 3. Step 2 - Necessity test
<!-- basis: GDPR Art. 6(1)(f); Art. 5(1)(c); EDPB Opinion 28/2024 (step 2) | fill: user | evidence: required -->
*Show that the processing allows the interest to be pursued and that there is no less intrusive means of doing so equally effectively. Consider the amount of personal data in light of data minimisation.*

| Question | Assessment | Evidence |
|---|---|---|
| Does the processing actually achieve the interest? | {{necessity.effectiveness}} | {{necessity.effectiveness.evidence_ref}} |
| Less intrusive alternatives considered (no personal data, anonymised / synthetic data, smaller dataset, on-premise model) | {{necessity.alternatives}} | {{necessity.alternatives.evidence_ref}} |
| Why alternatives are not equally effective | {{necessity.alternatives_rejected}} | {{necessity.alternatives_rejected.evidence_ref}} |
| Data volume and categories limited to what is necessary | {{necessity.minimisation}} | {{necessity.minimisation.evidence_ref}} |

Step 2 outcome: {{necessity.outcome}}

## 4. Step 3 - Balancing test
<!-- basis: GDPR Art. 6(1)(f); Recital 47; EDPB Opinion 28/2024 (step 3) | fill: user | evidence: required -->
*Weigh the interest against the interests, fundamental rights and freedoms of data subjects. Describe impacts factually; cite evidence for claims about expectations (privacy notice text, context of collection).*

| Factor | Assessment | Evidence |
|---|---|---|
| Data subjects' interests, rights and freedoms at stake | {{balance.interests}} | {{balance.interests.evidence_ref}} |
| Nature of the data (sensitivity, public availability, children's data) | {{balance.data_nature}} | {{balance.data_nature.evidence_ref}} |
| Context and scale of processing; combination with other datasets | {{balance.context}} | {{balance.context.evidence_ref}} |
| Impact on data subjects, positive and negative (e.g. regurgitation, profiling, reputational harm, loss of control) | {{balance.impact}} | {{balance.impact.evidence_ref}} |
| Likelihood and severity of the impacts | {{balance.likelihood_severity}} | {{balance.likelihood_severity.evidence_ref}} |
| Reasonable expectations (relationship with controller, source and context of collection, information given, awareness that data is online or used for AI) | {{balance.expectations}} | {{balance.expectations.evidence_ref}} |
| Vulnerable data subjects | {{balance.vulnerable}} | {{balance.vulnerable.evidence_ref}} |

Provisional balance before mitigating measures: {{balance.provisional}}

## 5. Mitigating measures
<!-- basis: EDPB Opinion 28/2024 (mitigating measures); GDPR Art. 25 | fill: rag | evidence: required -->
*List only measures that go beyond what the GDPR already requires; measures needed for compliance anyway cannot tip the balance. Typical examples: pseudonymisation, exclusion of sources or data categories, unconditional opt-out, output filters against regurgitation, extended transparency.*

| Measure | Type (technical / facilitating rights / transparency / web-scraping specific) | Status | Effect on balance | Evidence |
|---|---|---|---|---|
{{#each lia.mitigations}}
| {{measure}} | {{type}} | {{status}} | {{effect}} | {{evidence_ref}} |
{{/each}}

## 6. Outcome and decision
<!-- basis: GDPR Art. 6(1)(f); Art. 5(2) | fill: user | evidence: required -->
*State the reasoned conclusion. If the balance fails, Art. 6(1)(f) cannot be relied on and another lawful basis is needed or the processing must not start.*

Final balance after mitigating measures: {{outcome.final_balance}}
Decision: {{outcome.decision}} | Conditions: {{outcome.conditions}}

## 7. Transparency and right to object
<!-- basis: GDPR Art. 13(1)(d); Art. 14(2)(b); Art. 21(1), 21(4) | fill: rag | evidence: required -->
*Confirm that the legitimate interests are disclosed to data subjects and that the right to object is brought to their attention and can be exercised in practice.*

| Element | Implementation | Evidence |
|---|---|---|
| Privacy notice states the legitimate interests pursued | {{transparency.notice}} | {{transparency.notice.evidence_ref}} |
| Right to object: information and channel | {{transparency.objection_channel}} | {{transparency.objection.evidence_ref}} |
| Handling of objections (assessment of compelling grounds, technical effect on model / dataset) | {{transparency.objection_handling}} | {{transparency.objection_handling.evidence_ref}} |

## 8. Upstream lawfulness of third-party models
<!-- basis: EDPB Opinion 28/2024 (unlawfully developed models); GDPR Art. 5(1)(a), 5(2) | fill: rag | evidence: optional -->
*Where a model developed by another controller is deployed, record the assessment carried out on whether that model was developed lawfully (provider documentation, source of training data, known findings by authorities or courts).*

{{lia.upstream_model_assessment}}

## 9. Review
<!-- basis: GDPR Art. 5(2); Art. 24(1) | fill: user | evidence: optional -->
*Re-run the assessment when the purpose, data, model, provider or relevant guidance changes.*

Next review date: {{review.next_date}} | Triggers: {{review.triggers}}

## Sources and evidence
<!-- basis: GDPR Art. 5(2); Art. 24(1) | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: GDPR Art. 5(2); Art. 6(1)(f); Art. 24(1) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
