---
id: tpl-art22-automated-decision-assessment
title_en: "Article 22 Automated Decision-Making Assessment"
title_it: "Valutazione dei processi decisionali automatizzati ex art. 22 GDPR"
category: gdpr
legal_basis: ["GDPR Art. 22(1)", "GDPR Art. 22(2)(a)-(c)", "GDPR Art. 22(3)", "GDPR Art. 22(4)", "GDPR Art. 13(2)(f)", "GDPR Art. 14(2)(g)", "GDPR Art. 15(1)(h)", "GDPR Recital 71"]
related_frameworks: ["Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Art. 26(2)", "Reg. (EU) 2024/1689 Art. 26(11)", "Reg. (EU) 2024/1689 Art. 86", "GDPR Art. 35(3)(a)", "WP251 rev.01", "ISO/IEC 42001 A.9", "NIST AI RMF MAP 3.5", "NIST AI RMF GOVERN 3.2"]
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

## 1. Decision process under assessment
<!-- basis: GDPR Art. 22(1); Art. 4(4) | fill: rag | evidence: required -->
*Describe the decision, not only the AI system: who is affected, what is decided, what the AI output is and how it reaches the final outcome.*

| Element | Description | Evidence |
|---|---|---|
| Decision and business process | {{decision.description}} | {{decision.evidence_ref}} |
| Data subjects affected (incl. children, vulnerable persons) | {{decision.data_subjects}} | {{decision.data_subjects.evidence_ref}} |
| Input data and sources; profiling involved (Art. 4(4)) Y/N | {{decision.inputs}} / {{decision.profiling}} | {{decision.inputs.evidence_ref}} |
| AI system output (score, classification, recommendation, generated text) | {{decision.ai_output}} | {{decision.ai_output.evidence_ref}} |
| Path from output to final decision (thresholds, human steps) | {{decision.flow}} | {{decision.flow.evidence_ref}} |
| Volume of decisions per period | {{decision.volume}} | {{decision.volume.evidence_ref}} |

## 2. Applicability of Art. 22(1)
<!-- basis: GDPR Art. 22(1); WP251 rev.01; CJEU C-634/21 (SCHUFA) | fill: user | evidence: required -->
*All three conditions must be met for Art. 22(1) to apply. Human involvement counts only if it is meaningful: carried out by someone with authority and competence to change the outcome, who considers all relevant data. An automated score on which a third party draws strongly can itself be the "decision".*

| Condition | Assessment | Met (Y/N) | Evidence |
|---|---|---|---|
| There is a decision concerning an individual | {{a22.decision.assessment}} | {{a22.decision.met}} | {{a22.decision.evidence_ref}} |
| Based solely on automated processing (no meaningful human involvement) | {{a22.solely.assessment}} | {{a22.solely.met}} | {{a22.solely.evidence_ref}} |
| Produces legal effects or similarly significantly affects the person | {{a22.effects.assessment}} | {{a22.effects.met}} | {{a22.effects.evidence_ref}} |

Human involvement indicators: override rate {{a22.override_rate}}; average review time {{a22.review_time}}; reviewer authority {{a22.reviewer_authority}}
Conclusion on applicability: {{a22.conclusion}}

## 3. Exception relied on
<!-- basis: GDPR Art. 22(2)(a)-(c) | fill: user | evidence: required -->
*If Art. 22(1) applies, the decision is permitted only under one exception. Necessity for a contract is interpreted strictly; consent must be explicit.*

| Exception | Relied on (Y/N) | Justification | Evidence |
|---|---|---|---|
| (a) Necessary for entering into or performing a contract with the data subject | {{exc.a.relied}} | {{exc.a.justification}} | {{exc.a.evidence_ref}} |
| (b) Authorised by Union or Member State law with suitable safeguards | {{exc.b.relied}} | {{exc.b.justification}} | {{exc.b.evidence_ref}} |
| (c) Explicit consent of the data subject | {{exc.c.relied}} | {{exc.c.justification}} | {{exc.c.evidence_ref}} |

## 4. Special categories of personal data
<!-- basis: GDPR Art. 22(4); Art. 9(2)(a), 9(2)(g) | fill: rag | evidence: required -->
*Decisions must not be based on Art. 9(1) data unless Art. 9(2)(a) or (g) applies and suitable safeguards are in place. Include data inferred by the model and proxies.*

Special categories used or inferred: {{special.used}} | Art. 9(2) condition: {{special.condition}} | Safeguards: {{special.safeguards}} | Evidence: {{special.evidence_ref}}

## 5. Safeguards for the data subject
<!-- basis: GDPR Art. 22(3); Recital 71 | fill: rag | evidence: required -->
*Required under exceptions (a) and (c): at least human intervention, the possibility to express a point of view and to contest the decision. Recital 71 adds explanation of the decision, appropriate statistical procedures, error correction and prevention of discriminatory effects, and states that such decisions should not concern a child.*

| Safeguard | Implementation (channel, responsible role, deadline) | Tested (date / result) | Evidence |
|---|---|---|---|
| Right to obtain human intervention | {{sg.intervention}} | {{sg.intervention.test}} | {{sg.intervention.evidence_ref}} |
| Right to express point of view | {{sg.view}} | {{sg.view.test}} | {{sg.view.evidence_ref}} |
| Right to contest the decision | {{sg.contest}} | {{sg.contest.test}} | {{sg.contest.evidence_ref}} |
| Explanation of the individual decision | {{sg.explanation}} | {{sg.explanation.test}} | {{sg.explanation.evidence_ref}} |
| Accuracy, error correction and bias testing | {{sg.accuracy_bias}} | {{sg.accuracy_bias.test}} | {{sg.accuracy_bias.evidence_ref}} |
| Protection of children | {{sg.children}} | {{sg.children.test}} | {{sg.children.evidence_ref}} |

## 6. Transparency and access
<!-- basis: GDPR Art. 13(2)(f); Art. 14(2)(g); Art. 15(1)(h); CJEU C-203/22 | fill: rag | evidence: required -->
*Data subjects must be told of the existence of automated decision-making and given meaningful information about the logic involved, and the significance and envisaged consequences. Quote the notice text and the access-request response template.*

| Obligation | Text / mechanism in place | Evidence |
|---|---|---|
| Information at collection from the data subject (Art. 13(2)(f)) | {{tr.art13}} | {{tr.art13.evidence_ref}} |
| Information where data is not obtained from the data subject (Art. 14(2)(g)) | {{tr.art14}} | {{tr.art14.evidence_ref}} |
| Access request response on logic, significance and consequences (Art. 15(1)(h)) | {{tr.art15}} | {{tr.art15.evidence_ref}} |
| Method used to explain logic (features, factors, counterfactuals) | {{tr.explanation_method}} | {{tr.explanation_method.evidence_ref}} |

## 7. Human oversight under the AI Act
<!-- basis: Reg. (EU) 2024/1689 Art. 14; Art. 26(2) | fill: rag | evidence: required -->
*For high-risk AI systems: describe the oversight measures designed by the provider (Art. 14) and how the deployer assigned oversight to persons with the necessary competence, training, authority and support (Art. 26(2)). Applicability: {{kb.eu_ai_act.timeline.high_risk_obligations}}.*

| Element | Description | Evidence |
|---|---|---|
| AI Act classification of the system | {{ai.classification}} | {{ai.classification.evidence_ref}} |
| Oversight measures per instructions for use | {{oversight.provider_measures}} | {{oversight.provider_measures.evidence_ref}} |
| Persons assigned, competence and training | {{oversight.assigned}} | {{oversight.assigned.evidence_ref}} |
| Ability to disregard, override or stop the system; safeguards against automation bias | {{oversight.override}} | {{oversight.override.evidence_ref}} |

## 8. Information and right to explanation under the AI Act
<!-- basis: Reg. (EU) 2024/1689 Art. 26(11); Art. 86 | fill: rag | evidence: required -->
*Art. 86 applies to deployer decisions based on the output of an Annex III high-risk system (except point 2) that produce legal effects or similarly significantly affect a person, and only where Union law does not already provide the right. It is not limited to solely automated decisions, so assess it even if Art. 22 GDPR does not apply.*

| Element | Assessment | Evidence |
|---|---|---|
| Annex III area and point | {{a86.annex_iii}} | {{a86.annex_iii.evidence_ref}} |
| Persons informed that they are subject to use of the system (Art. 26(11)) | {{a86.information}} | {{a86.information.evidence_ref}} |
| Art. 86 applicable (Y/N) and reasoning | {{a86.applicable}} | {{a86.applicable.evidence_ref}} |
| Procedure to explain the role of the AI system and the main elements of the decision | {{a86.procedure}} | {{a86.procedure.evidence_ref}} |

## 9. Conclusion and actions
<!-- basis: GDPR Art. 5(2); Art. 22; Art. 35(3)(a) | fill: user | evidence: required -->
*State whether the decision process may operate, under which conditions, and whether a DPIA is triggered.*

Overall conclusion: {{conclusion.summary}} | DPIA required / reference: {{conclusion.dpia_ref}}

| Action | Owner | Due date | Status |
|---|---|---|---|
{{#each conclusion.actions}}
| {{action}} | {{owner}} | {{due_date}} | {{status}} |
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
<!-- basis: GDPR Art. 5(2); Art. 22; Art. 24(1) | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
