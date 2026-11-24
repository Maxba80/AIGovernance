---
id: tpl-risk-classification-rationale
title_en: AI Act Risk Classification Rationale
title_it: Motivazione della classificazione del rischio ai sensi dell'AI Act
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 2", "Reg. (EU) 2024/1689 Art. 3(1)", "Reg. (EU) 2024/1689 Art. 5", "Reg. (EU) 2024/1689 Art. 6(1) and Annex I", "Reg. (EU) 2024/1689 Art. 6(2) and Annex III", "Reg. (EU) 2024/1689 Art. 6(3)", "Reg. (EU) 2024/1689 Art. 6(4)", "Reg. (EU) 2024/1689 Art. 49", "Reg. (EU) 2024/1689 Art. 50", "Reg. (EU) 2024/1689 Art. 51"]
related_frameworks: ["ISO/IEC 42001 Clause 6.1.2", "ISO/IEC 42001 A.5.2", "NIST AI RMF MAP 1.1", "NIST AI RMF MAP 5.1", "NIST AI RMF GOVERN 1.1", "GDPR Art. 4(4)", "GDPR Art. 35"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Legal / Compliance Officer, countersigned by AI Governance Lead
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| Role of the organisation | {{ai_system.role}} |
| Knowledge-base version of the AI Act used | {{kb.eu_ai_act.version}} (consolidated with {{kb.eu_ai_act.amendments}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Work through the steps in order. Each answer needs reasoning and a source; the agent proposes, a human decides. The legal tests are evaluated against the consolidated text held in the knowledge base._

## 1. System description and intended purpose
<!-- basis: Reg. (EU) 2024/1689 Art. 3(1) and Art. 3(12) | fill: rag | evidence: required -->
_Classification depends on the intended purpose, so quote it from the provider's documentation or the organisation's own specification._

| Field | Value | Source |
|---|---|---|
| Description of the system and its outputs | {{rc.description}} | {{rc.description_cite}} |
| Intended purpose (verbatim where available) | {{rc.intended_purpose}} | {{rc.intended_purpose_cite}} |
| Users and persons affected | {{rc.users_affected}} | {{rc.users_affected_cite}} |
| Meets the AI system definition? Reasoning | {{rc.is_ai_system}} – {{rc.is_ai_system_reasoning}} | {{rc.is_ai_system_cite}} |

## 2. Scope and exclusions
<!-- basis: Reg. (EU) 2024/1689 Art. 2 | fill: rag | evidence: required -->
_Check whether the Regulation applies at all. The list of exclusions is read from the knowledge base; claim one only with evidence._

| Exclusion (per knowledge base: {{kb.eu_ai_act.art2.exclusions}}) | Claimed? | Reasoning | Source |
|---|---|---|---|
| {{rc.exclusions[i].name}} | {{rc.exclusions[i].claimed}} | {{rc.exclusions[i].reasoning}} | {{rc.exclusions[i].cite}} |

Conclusion: Regulation applicable = {{rc.scope.applicable}}

## 3. Prohibited practices screening
<!-- basis: Reg. (EU) 2024/1689 Art. 5 | fill: rag | evidence: required -->
_Answer every row. A "yes" or "unclear" stops the process and escalates to Legal. Verify the list against the knowledge base, which may contain practices added by amendment._

| # | Practice (Art. 5(1)) | Engaged? | Reasoning | Source |
|---|---|---|---|---|
| a | Subliminal, purposefully manipulative or deceptive techniques causing significant harm | {{rc.art5.a.answer}} | {{rc.art5.a.reasoning}} | {{rc.art5.a.cite}} |
| b | Exploitation of vulnerabilities due to age, disability or social or economic situation | {{rc.art5.b.answer}} | {{rc.art5.b.reasoning}} | {{rc.art5.b.cite}} |
| c | Social scoring leading to detrimental or unfavourable treatment | {{rc.art5.c.answer}} | {{rc.art5.c.reasoning}} | {{rc.art5.c.cite}} |
| d | Risk assessment of criminal offending based solely on profiling or personality traits | {{rc.art5.d.answer}} | {{rc.art5.d.reasoning}} | {{rc.art5.d.cite}} |
| e | Untargeted scraping of facial images to build facial recognition databases | {{rc.art5.e.answer}} | {{rc.art5.e.reasoning}} | {{rc.art5.e.cite}} |
| f | Emotion inference in the workplace or education institutions | {{rc.art5.f.answer}} | {{rc.art5.f.reasoning}} | {{rc.art5.f.cite}} |
| g | Biometric categorisation deducing sensitive characteristics | {{rc.art5.g.answer}} | {{rc.art5.g.reasoning}} | {{rc.art5.g.cite}} |
| h | Real-time remote biometric identification in publicly accessible spaces for law enforcement | {{rc.art5.h.answer}} | {{rc.art5.h.reasoning}} | {{rc.art5.h.cite}} |
| + | Any further practice in the consolidated text: {{kb.eu_ai_act.art5.additional_practices}} | {{rc.art5.additional.answer}} | {{rc.art5.additional.reasoning}} | {{rc.art5.additional.cite}} |

Conclusion: prohibited practice = {{rc.art5.conclusion}}

## 4. High-risk: product safety route
<!-- basis: Reg. (EU) 2024/1689 Art. 6(1) and Annex I | fill: rag | evidence: required -->
_Both conditions must be met: (a) safety component of, or itself, a product covered by Annex I legislation, and (b) third-party conformity assessment required under that legislation._

| Test | Answer | Reasoning | Source |
|---|---|---|---|
| Art. 6(1)(a): safety component of a product, or itself a product, covered by Union harmonisation legislation in Annex I? Which act? | {{rc.art6_1.a.answer}} ({{rc.art6_1.annex_i_act}}) | {{rc.art6_1.a.reasoning}} | {{rc.art6_1.a.cite}} |
| Art. 6(1)(b): product required to undergo third-party conformity assessment under that act? | {{rc.art6_1.b.answer}} | {{rc.art6_1.b.reasoning}} | {{rc.art6_1.b.cite}} |

Conclusion: high-risk under Art. 6(1) = {{rc.art6_1.conclusion}}

## 5. High-risk: Annex III route
<!-- basis: Reg. (EU) 2024/1689 Art. 6(2) and Annex III | fill: rag | evidence: required -->
_Compare the intended purpose with each area; for a match, record the exact point and sub-point from the knowledge base text of Annex III._

| Annex III area | Match? | Specific point / use case | Reasoning | Source |
|---|---|---|---|---|
| 1. Biometrics | {{rc.annex3.p1.match}} | {{rc.annex3.p1.point}} | {{rc.annex3.p1.reasoning}} | {{rc.annex3.p1.cite}} |
| 2. Critical infrastructure | {{rc.annex3.p2.match}} | {{rc.annex3.p2.point}} | {{rc.annex3.p2.reasoning}} | {{rc.annex3.p2.cite}} |
| 3. Education and vocational training | {{rc.annex3.p3.match}} | {{rc.annex3.p3.point}} | {{rc.annex3.p3.reasoning}} | {{rc.annex3.p3.cite}} |
| 4. Employment, workers' management and access to self-employment | {{rc.annex3.p4.match}} | {{rc.annex3.p4.point}} | {{rc.annex3.p4.reasoning}} | {{rc.annex3.p4.cite}} |
| 5. Access to essential private services and essential public services and benefits | {{rc.annex3.p5.match}} | {{rc.annex3.p5.point}} | {{rc.annex3.p5.reasoning}} | {{rc.annex3.p5.cite}} |
| 6. Law enforcement | {{rc.annex3.p6.match}} | {{rc.annex3.p6.point}} | {{rc.annex3.p6.reasoning}} | {{rc.annex3.p6.cite}} |
| 7. Migration, asylum and border control management | {{rc.annex3.p7.match}} | {{rc.annex3.p7.point}} | {{rc.annex3.p7.reasoning}} | {{rc.annex3.p7.cite}} |
| 8. Administration of justice and democratic processes | {{rc.annex3.p8.match}} | {{rc.annex3.p8.point}} | {{rc.annex3.p8.reasoning}} | {{rc.annex3.p8.cite}} |

Conclusion: listed in Annex III = {{rc.annex3.conclusion}}

## 6. Art. 6(3) derogation and profiling exception
<!-- basis: Reg. (EU) 2024/1689 Art. 6(3) and Art. 6(4); Reg. (EU) 2016/679 Art. 4(4) (definition of profiling) | fill: rag | evidence: required -->
_Complete only if section 5 found a match. First the profiling exception: an Annex III system that performs profiling of natural persons is always high-risk, and the derogation is unavailable. Then test the conditions; the system must also pose no significant risk of harm to health, safety or fundamental rights._

| Test | Answer | Reasoning | Source |
|---|---|---|---|
| Does the system perform profiling of natural persons? (if yes: always high-risk, stop) | {{rc.art6_3.profiling.answer}} | {{rc.art6_3.profiling.reasoning}} | {{rc.art6_3.profiling.cite}} |
| (a) Performs a narrow procedural task | {{rc.art6_3.a.answer}} | {{rc.art6_3.a.reasoning}} | {{rc.art6_3.a.cite}} |
| (b) Improves the result of a previously completed human activity | {{rc.art6_3.b.answer}} | {{rc.art6_3.b.reasoning}} | {{rc.art6_3.b.cite}} |
| (c) Detects decision-making patterns or deviations without replacing or influencing the prior human assessment without proper human review | {{rc.art6_3.c.answer}} | {{rc.art6_3.c.reasoning}} | {{rc.art6_3.c.cite}} |
| (d) Performs a preparatory task to an assessment relevant for an Annex III use case | {{rc.art6_3.d.answer}} | {{rc.art6_3.d.reasoning}} | {{rc.art6_3.d.cite}} |
| No significant risk of harm, including by not materially influencing the outcome of decision-making | {{rc.art6_3.no_significant_risk.answer}} | {{rc.art6_3.no_significant_risk.reasoning}} | {{rc.art6_3.no_significant_risk.cite}} |

Derogation relied on = {{rc.art6_3.relied}}. If relied on: this document is the provider's documented assessment under Art. 6(4), made before placing on the market or putting into service; registration duty per knowledge base: {{kb.eu_ai_act.art6_4.registration_requirement}}. Commission guidelines consulted: {{kb.eu_ai_act.art6.guidelines}}

## 7. Transparency obligations
<!-- basis: Reg. (EU) 2024/1689 Art. 50 | fill: rag | evidence: required -->
_These apply in addition to, not instead of, high-risk requirements. Applicable from {{kb.eu_ai_act.timeline.art50}}._

| Trigger | Addressee | Engaged? | Reasoning | Source |
|---|---|---|---|---|
| Art. 50(1): system intended to interact directly with natural persons | Provider | {{rc.art50.p1.answer}} | {{rc.art50.p1.reasoning}} | {{rc.art50.p1.cite}} |
| Art. 50(2): system generating synthetic audio, image, video or text content | Provider | {{rc.art50.p2.answer}} | {{rc.art50.p2.reasoning}} | {{rc.art50.p2.cite}} |
| Art. 50(3): emotion recognition or biometric categorisation system | Deployer | {{rc.art50.p3.answer}} | {{rc.art50.p3.reasoning}} | {{rc.art50.p3.cite}} |
| Art. 50(4): deep fakes; AI-generated text published to inform the public on matters of public interest | Deployer | {{rc.art50.p4.answer}} | {{rc.art50.p4.reasoning}} | {{rc.art50.p4.cite}} |

## 8. General-purpose AI model
<!-- basis: Reg. (EU) 2024/1689 Art. 3(63), Art. 51, Art. 53, Art. 55 | fill: rag | evidence: required -->
_Relevant if the organisation provides a GPAI model or builds on one. Systemic-risk criteria and thresholds are read from the knowledge base._

| Test | Answer | Reasoning | Source |
|---|---|---|---|
| Is the organisation the provider of a general-purpose AI model? | {{rc.gpai.provider.answer}} | {{rc.gpai.provider.reasoning}} | {{rc.gpai.provider.cite}} |
| Does the system integrate a third-party GPAI model? Which? | {{rc.gpai.integrates.answer}} | {{rc.gpai.integrates.reasoning}} | {{rc.gpai.integrates.cite}} |
| Systemic risk under Art. 51 (criteria: {{kb.eu_ai_act.art51.criteria}}) | {{rc.gpai.systemic.answer}} | {{rc.gpai.systemic.reasoning}} | {{rc.gpai.systemic.cite}} |

## 9. Final classification
<!-- basis: Reg. (EU) 2024/1689 Art. 5, Art. 6, Art. 50, Art. 51 | fill: computed | evidence: required -->
_Derived from sections 2–8 by rule; the human approver may override only with written justification, which is logged._

| Field | Value |
|---|---|
| Computed class | {{rc.final.computed_class}} |
| Final class after human review | **{{rc.final.class}}** |
| Override justification (if different) | {{rc.final.override_justification}} |
| Legal hooks | {{rc.final.legal_hooks}} |
| Additional layers (Art. 50 transparency, GPAI) | {{rc.final.additional_layers}} |
| Resulting obligations for the organisation's role | {{rc.final.obligations}} |
| Applicable from (knowledge base) | {{rc.final.kb_applicable_date}} |
| Open uncertainties and assumptions | {{rc.final.uncertainties}} |
| Re-classification triggers and next review | {{rc.final.review_triggers}} / {{rc.final.next_review}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 6(4) (documented assessment) | fill: computed | evidence: required -->
_Every reasoning cell must resolve to evidence here, including the knowledge-base passages of the legal text used._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: internal HITL policy; Reg. (EU) 2024/1689 Art. 6(4) | fill: user | evidence: required -->
_Classification is a legal judgement: it is valid only when signed by the named human approver. The agent's proposal alone has no effect._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Legal / Compliance (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| AI Governance Lead | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
