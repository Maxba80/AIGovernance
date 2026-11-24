---
id: tpl-genai-risk-profile-tevv-summary
title_en: "Generative AI Risk Profile and TEVV Summary"
title_it: "Profilo di rischio GenAI e sintesi TEVV"
category: nist-ai-rmf
legal_basis: ["NIST AI 600-1 (Generative AI Profile), Section 2 (12 risks)", "NIST AI 600-1, Section 3 (suggested actions)", "NIST AI RMF 1.0 MEASURE function"]
related_frameworks: ["NIST AI RMF MAP 5.1", "NIST AI RMF MANAGE 1.3", "Reg. (EU) 2024/1689 Art. 50", "Reg. (EU) 2024/1689 Art. 53", "Reg. (EU) 2024/1689 Art. 55", "ISO/IEC 42001:2023 A.6.2.4", "ISO/IEC 42001:2023 6.1.2", "GDPR Art. 35"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: "AI system owner; independent TEVV / AI assurance lead as reviewer"
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

## 1. System and assessment scope
<!-- basis: NIST AI RMF MAP 1.1; MAP 2.1; NIST AI 600-1 Section 1 | fill: rag | evidence: required -->
*Describe the generative AI system as deployed: model, provider, version, adaptation (RAG, fine-tuning, agents, tools) and use context. Results are valid only for the versions listed.*

| Element | Description | Evidence |
|---|---|---|
| Use case and intended users | {{genai.use_case}} | {{genai.use_case.evidence_ref}} |
| Foundation model / provider / version | {{genai.model}} | {{genai.model.evidence_ref}} |
| Adaptation and architecture (system prompt, RAG sources, fine-tuning, tools / agents) | {{genai.architecture}} | {{genai.architecture.evidence_ref}} |
| Modalities (text, image, audio, code) | {{genai.modalities}} | {{genai.modalities.evidence_ref}} |
| Life cycle stage and assessment date | {{genai.lifecycle_stage}} / {{genai.assessment_date}} | {{genai.lifecycle_stage.evidence_ref}} |
| Third-party components and provider documentation relied on | {{genai.third_party}} | {{genai.third_party.evidence_ref}} |

## 2. GenAI risk profile
<!-- basis: NIST AI 600-1 Section 2 (2.1-2.12) | fill: computed | evidence: required -->
*Assess each of the 12 risks for this system in its context. Do not delete rows: mark "not applicable" with a reason. Scoring scale: {{kb.risk_matrix.scale_5x5}}; risk definitions: {{kb.nist_ai_600_1.risks}}.*

| # | GenAI risk | Applicable (Y/N) and reason | Scenario in this use case | Inherent L x S | Inherent level | Residual L x S | Residual level | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | CBRN Information or Capabilities | {{gr.cbrn.applicable}} | {{gr.cbrn.scenario}} | {{gr.cbrn.inherent}} | {{gr.cbrn.inherent_level}} | {{gr.cbrn.residual}} | {{gr.cbrn.residual_level}} | {{gr.cbrn.evidence_ref}} |
| 2 | Confabulation | {{gr.confabulation.applicable}} | {{gr.confabulation.scenario}} | {{gr.confabulation.inherent}} | {{gr.confabulation.inherent_level}} | {{gr.confabulation.residual}} | {{gr.confabulation.residual_level}} | {{gr.confabulation.evidence_ref}} |
| 3 | Dangerous, Violent, or Hateful Content | {{gr.dangerous.applicable}} | {{gr.dangerous.scenario}} | {{gr.dangerous.inherent}} | {{gr.dangerous.inherent_level}} | {{gr.dangerous.residual}} | {{gr.dangerous.residual_level}} | {{gr.dangerous.evidence_ref}} |
| 4 | Data Privacy | {{gr.privacy.applicable}} | {{gr.privacy.scenario}} | {{gr.privacy.inherent}} | {{gr.privacy.inherent_level}} | {{gr.privacy.residual}} | {{gr.privacy.residual_level}} | {{gr.privacy.evidence_ref}} |
| 5 | Environmental Impacts | {{gr.environmental.applicable}} | {{gr.environmental.scenario}} | {{gr.environmental.inherent}} | {{gr.environmental.inherent_level}} | {{gr.environmental.residual}} | {{gr.environmental.residual_level}} | {{gr.environmental.evidence_ref}} |
| 6 | Harmful Bias and Homogenization | {{gr.bias.applicable}} | {{gr.bias.scenario}} | {{gr.bias.inherent}} | {{gr.bias.inherent_level}} | {{gr.bias.residual}} | {{gr.bias.residual_level}} | {{gr.bias.evidence_ref}} |
| 7 | Human-AI Configuration | {{gr.human_ai.applicable}} | {{gr.human_ai.scenario}} | {{gr.human_ai.inherent}} | {{gr.human_ai.inherent_level}} | {{gr.human_ai.residual}} | {{gr.human_ai.residual_level}} | {{gr.human_ai.evidence_ref}} |
| 8 | Information Integrity | {{gr.integrity.applicable}} | {{gr.integrity.scenario}} | {{gr.integrity.inherent}} | {{gr.integrity.inherent_level}} | {{gr.integrity.residual}} | {{gr.integrity.residual_level}} | {{gr.integrity.evidence_ref}} |
| 9 | Information Security | {{gr.security.applicable}} | {{gr.security.scenario}} | {{gr.security.inherent}} | {{gr.security.inherent_level}} | {{gr.security.residual}} | {{gr.security.residual_level}} | {{gr.security.evidence_ref}} |
| 10 | Intellectual Property | {{gr.ip.applicable}} | {{gr.ip.scenario}} | {{gr.ip.inherent}} | {{gr.ip.inherent_level}} | {{gr.ip.residual}} | {{gr.ip.residual_level}} | {{gr.ip.evidence_ref}} |
| 11 | Obscene, Degrading, and/or Abusive Content | {{gr.obscene.applicable}} | {{gr.obscene.scenario}} | {{gr.obscene.inherent}} | {{gr.obscene.inherent_level}} | {{gr.obscene.residual}} | {{gr.obscene.residual_level}} | {{gr.obscene.evidence_ref}} |
| 12 | Value Chain and Component Integration | {{gr.value_chain.applicable}} | {{gr.value_chain.scenario}} | {{gr.value_chain.inherent}} | {{gr.value_chain.inherent_level}} | {{gr.value_chain.residual}} | {{gr.value_chain.residual_level}} | {{gr.value_chain.evidence_ref}} |

## 3. Risks x suggested actions
<!-- basis: NIST AI 600-1 Section 3 (actions by AI RMF subcategory) | fill: rag | evidence: required -->
*For each applicable risk list the NIST AI 600-1 suggested actions selected (action IDs as in the profile, e.g. GV-1.1-001, MS-2.6-001; text from the knowledge base). The actions are voluntary: record a reason for those not adopted.*

| GenAI risk | Action ID | AI RMF subcategory | Action (short) | Adopted (Y / N / partial) | Implementation / reason not adopted | Owner | Status | Evidence |
|---|---|---|---|---|---|---|---|---|
{{#each genai.actions}}
| {{risk}} | {{action_id}} | {{subcategory_id}} | {{kb.nist_ai_600_1.actions.[action_id].short_text}} | {{adopted}} | {{implementation}} | {{owner}} | {{status}} | {{evidence_ref}} |
{{/each}}

Coverage: {{genai.actions.adopted_count}} adopted of {{genai.actions.relevant_count}} relevant actions; applicable risks with no adopted action: {{genai.actions.uncovered_risks}}

## 4. TEVV plan and methods
<!-- basis: NIST AI RMF MEASURE 1.1; MEASURE 1.3; MEASURE 2.1; MEASURE 2.3 | fill: rag | evidence: required -->
*Describe test, evaluation, verification and validation: methods and metrics selected, who performed them and how independent they were from development, and how closely test conditions match deployment.*

| Element | Description | Evidence |
|---|---|---|
| Methods used (benchmarks, structured red teaming, human evaluation, field testing, adversarial testing) | {{tevv.methods}} | {{tevv.methods.evidence_ref}} |
| Test sets (origin, size, representativeness, contamination checks) | {{tevv.test_sets}} | {{tevv.test_sets.evidence_ref}} |
| Evaluators and independence | {{tevv.evaluators}} | {{tevv.evaluators.evidence_ref}} |
| Similarity of test conditions to deployment | {{tevv.conditions}} | {{tevv.conditions.evidence_ref}} |
| Risks or properties that could not be measured | {{tevv.not_measured}} | {{tevv.not_measured.evidence_ref}} |

## 5. TEVV results
<!-- basis: NIST AI RMF MEASURE 2.5-2.11; MEASURE 2.3 | fill: rag | evidence: required -->
*One row per test. Report the measured value with its uncertainty, the threshold set before testing and the exact model and configuration tested. Cite the raw test report.*

| Test ID | GenAI risk | Trustworthiness characteristic (AI RMF subcategory) | Method / metric | Model and config version | Test date | Sample size | Result (with uncertainty) | Threshold | Pass (Y/N) | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
{{#each tevv.results}}
| {{id}} | {{risk}} | {{characteristic}} ({{subcategory_id}}) | {{method}} / {{metric}} | {{version}} | {{date}} | {{sample_size}} | {{result}} | {{threshold}} | {{pass}} | {{evidence_ref}} |
{{/each}}

Red-teaming summary: {{tevv.red_team_summary}} | Failed tests: {{tevv.failed_tests}}

## 6. Residual risk, release decision and monitoring
<!-- basis: NIST AI RMF MANAGE 1.1; MANAGE 1.4; MANAGE 4.1; MEASURE 3.1 | fill: user | evidence: required -->
*State whether the system achieves its intended purpose and whether deployment should proceed; document residual risks to downstream acquirers and end users, and post-deployment monitoring.*

| Element | Value |
|---|---|
| Go / no-go determination and conditions | {{release.decision}} / {{release.conditions}} |
| Residual risks documented and communicated to | {{release.residual_risks}} / {{release.communicated_to}} |
| Post-deployment monitoring (metrics, user feedback, incident and appeal channels) | {{release.monitoring}} |
| Re-test triggers (model update, new tool, new data source, incident) | {{release.retest_triggers}} |
| Content provenance / AI-generated content disclosure measures | {{release.provenance}} |

## 7. Link to EU obligations (informative)
<!-- basis: Reg. (EU) 2024/1689 Art. 50; Art. 53; Art. 55 | fill: kb | evidence: optional -->
*Indicates where results above can be reused as evidence. Applicability and dates: {{kb.eu_ai_act.timeline.gpai_obligations}}, {{kb.eu_ai_act.timeline.transparency_obligations}}.*

{{genai.eu_mapping}}

## Sources and evidence
<!-- basis: NIST AI RMF GOVERN 1.4 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: NIST AI RMF MANAGE 1.1; GOVERN 2.3 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
