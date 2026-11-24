---
id: tpl-annex-iv-technical-documentation
title_en: Technical Documentation for a High-Risk AI System (Annex IV)
title_it: Documentazione tecnica del sistema di IA ad alto rischio (Allegato IV)
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 11", "Reg. (EU) 2024/1689 Annex IV", "Reg. (EU) 2024/1689 Art. 9", "Reg. (EU) 2024/1689 Art. 10", "Reg. (EU) 2024/1689 Art. 12", "Reg. (EU) 2024/1689 Art. 13", "Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Art. 15", "Reg. (EU) 2024/1689 Art. 18", "Reg. (EU) 2024/1689 Art. 47", "Reg. (EU) 2024/1689 Art. 72"]
related_frameworks: ["ISO/IEC 42001 A.6.2.3", "ISO/IEC 42001 A.6.2.4", "ISO/IEC 42001 A.6.2.7", "ISO/IEC 42001 A.7.4", "ISO/IEC 42001 A.7.5", "NIST AI RMF MAP 2.1", "NIST AI RMF MAP 2.2", "NIST AI RMF MEASURE 2.1", "NIST AI RMF MEASURE 2.3", "GDPR Art. 25"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Provider's Head of Engineering and Regulatory Affairs / Compliance Officer
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace (provider) | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| High-risk basis | {{classification.legal_hook}} (classification document {{classification.doc_ref}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Drawn up before placing on the market or putting into service and kept up to date (Art. 11(1)). Sections 1–9 follow Annex IV points 1–9. SMEs may use the simplified form where available: {{kb.eu_ai_act.art11.simplified_form}}. Requirements applicable from {{kb.eu_ai_act.timeline.high_risk_annex_iii}} / {{kb.eu_ai_act.timeline.high_risk_annex_i}}. Every item must point to a controlled source document; "see attachment" needs the attachment ID and hash._

## 1. General description of the AI system
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 1 | fill: rag | evidence: required -->
_Cover each lettered item of point 1; mark an item "not applicable" with reason rather than omitting it._

| Item | Content | Source |
|---|---|---|
| (a) Intended purpose, name of the provider, version of the system and its relation to previous versions | {{a4.p1.a}} | {{a4.p1.a_cite}} |
| (b) Interaction with, or use to interact with, hardware or software, including other AI systems, not part of the system | {{a4.p1.b}} | {{a4.p1.b_cite}} |
| (c) Versions of relevant software or firmware and version-update requirements | {{a4.p1.c}} | {{a4.p1.c_cite}} |
| (d) All forms in which the system is placed on the market or put into service (software package, download, API, embedded) | {{a4.p1.d}} | {{a4.p1.d_cite}} |
| (e) Hardware on which the system is intended to run | {{a4.p1.e}} | {{a4.p1.e_cite}} |
| (f) Where a component of products: photographs or illustrations of external features, marking and internal layout | {{a4.p1.f}} | {{a4.p1.f_cite}} |
| (g) Basic description of the user interface provided to the deployer | {{a4.p1.g}} | {{a4.p1.g_cite}} |
| (h) Instructions for use for the deployer | {{a4.p1.h}} | {{a4.p1.h_cite}} |

## 2. Detailed description of the elements of the AI system and of the process for its development
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 2; Art. 10; Art. 14; Art. 15 | fill: rag | evidence: required -->
_Extract from design documents, data sheets, model cards and test reports. Test logs and reports must be dated and signed by the responsible persons._

| Item | Content | Source |
|---|---|---|
| (a) Methods and steps of development, including use of pre-trained systems or third-party tools and how they were used, integrated or modified | {{a4.p2.a}} | {{a4.p2.a_cite}} |
| (b) Design specifications: general logic and algorithms; key design choices, rationale and assumptions, including persons or groups on which the system is intended to be used; main classification choices; what the system optimises for; expected output; trade-offs made to comply with Chapter III, Section 2 | {{a4.p2.b}} | {{a4.p2.b_cite}} |
| (c) System architecture: how software components build on or feed into each other; computational resources used to develop, train, test and validate | {{a4.p2.c}} | {{a4.p2.c_cite}} |
| (d) Data requirements: datasheets describing training methodologies and techniques and training data sets, including provenance, scope and main characteristics; how data was obtained and selected; labelling procedures; data cleaning methodologies | {{a4.p2.d}} | {{a4.p2.d_cite}} |
| (e) Assessment of the human oversight measures needed under Art. 14, including technical measures to help deployers interpret outputs | {{a4.p2.e}} | {{a4.p2.e_cite}} |
| (f) Pre-determined changes to the system and its performance, with the technical solutions ensuring continuous compliance | {{a4.p2.f}} | {{a4.p2.f_cite}} |
| (g) Validation and testing procedures: validation and testing data and their main characteristics; metrics for accuracy, robustness and compliance with other requirements, and for potentially discriminatory impacts; test logs and test reports, dated and signed | {{a4.p2.g}} | {{a4.p2.g_cite}} |
| (h) Cybersecurity measures put in place | {{a4.p2.h}} | {{a4.p2.h_cite}} |

| Test report | Date | Signed by | Metrics and results | Dataset | Source |
|---|---|---|---|---|---|
| {{a4.p2.tests[i].report}} | {{a4.p2.tests[i].date}} | {{a4.p2.tests[i].signed_by}} | {{a4.p2.tests[i].results}} | {{a4.p2.tests[i].dataset}} | {{a4.p2.tests[i].cite}} |

## 3. Monitoring, functioning and control of the AI system
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 3; Art. 13; Art. 14 | fill: rag | evidence: required -->
_State capabilities and limitations honestly, including for specific persons or groups; figures must match the test reports in section 2._

| Item | Content | Source |
|---|---|---|
| Capabilities and limitations in performance, including degrees of accuracy for specific persons or groups on which the system is intended to be used | {{a4.p3.capabilities_limitations}} | {{a4.p3.capabilities_limitations_cite}} |
| Overall expected level of accuracy in relation to the intended purpose | {{a4.p3.expected_accuracy}} | {{a4.p3.expected_accuracy_cite}} |
| Foreseeable unintended outcomes and sources of risks to health and safety, fundamental rights and discrimination | {{a4.p3.unintended_outcomes}} | {{a4.p3.unintended_outcomes_cite}} |
| Human oversight measures needed under Art. 14, including technical measures to facilitate interpretation of outputs by deployers | {{a4.p3.human_oversight}} | {{a4.p3.human_oversight_cite}} |
| Specifications on input data, as appropriate | {{a4.p3.input_specifications}} | {{a4.p3.input_specifications_cite}} |

## 4. Appropriateness of the performance metrics
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 4; Art. 15 | fill: rag | evidence: required -->
_Explain why each metric is appropriate for this specific system and intended purpose, not merely which metrics were used._

| Metric | Why appropriate for this system | Threshold / acceptance criterion | Source |
|---|---|---|---|
| {{a4.p4.metrics[i].name}} | {{a4.p4.metrics[i].justification}} | {{a4.p4.metrics[i].threshold}} | {{a4.p4.metrics[i].cite}} |

## 5. Risk management system
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 5; Art. 9 | fill: rag | evidence: required -->
_Describe the risk management system as a continuous iterative process and reference the current risk register._

| Item | Content | Source |
|---|---|---|
| Process description (identification, estimation, evaluation, measures, iteration) | {{a4.p5.process}} | {{a4.p5.process_cite}} |
| Known and reasonably foreseeable risks, including under reasonably foreseeable misuse | {{a4.p5.risks}} | {{a4.p5.risks_cite}} |
| Risk management measures and residual risk acceptability | {{a4.p5.measures_residual}} | {{a4.p5.measures_residual_cite}} |
| Consideration of persons under 18 and other vulnerable groups | {{a4.p5.vulnerable_groups}} | {{a4.p5.vulnerable_groups_cite}} |
| Risk register reference and version | {{a4.p5.register_ref}} | {{a4.p5.register_cite}} |

## 6. Relevant changes made through the life cycle
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 6 | fill: rag | evidence: required -->
_List changes made by the provider from the change log; indicate whether each amounts to a substantial modification._

| Date | Version | Change | Reason | Substantial modification? | Source |
|---|---|---|---|---|---|
| {{a4.p6.changes[i].date}} | {{a4.p6.changes[i].version}} | {{a4.p6.changes[i].description}} | {{a4.p6.changes[i].reason}} | {{a4.p6.changes[i].substantial}} | {{a4.p6.changes[i].cite}} |

## 7. Harmonised standards and other technical solutions
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 7; Art. 40 | fill: kb | evidence: required -->
_List harmonised standards applied in full or in part whose references are published in the Official Journal (status from the knowledge base: {{kb.eu_ai_act.harmonised_standards}}). Where none are applied, describe in detail the solutions adopted to meet Chapter III, Section 2, including other standards and technical specifications._

| Standard / specification | OJ reference (if harmonised) | Applied in full or in part (clauses) | Requirement covered | Source |
|---|---|---|---|---|
| {{a4.p7.standards[i].name}} | {{a4.p7.standards[i].oj_ref}} | {{a4.p7.standards[i].extent}} | {{a4.p7.standards[i].requirement}} | {{a4.p7.standards[i].cite}} |

Solutions adopted where harmonised standards were not applied: {{a4.p7.alternative_solutions}}

## 8. EU declaration of conformity
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 8; Art. 47 | fill: computed | evidence: required -->
_Attach a copy of the signed declaration; the app links the current version and its hash._

| Declaration reference | Version | Date of issue | Signed by | Hash (SHA-256) |
|---|---|---|---|---|
| {{a4.p8.doc_ref}} | {{a4.p8.version}} | {{a4.p8.issue_date}} | {{a4.p8.signatory}} | {{a4.p8.sha256}} |

## 9. Post-market monitoring system
<!-- basis: Reg. (EU) 2024/1689 Annex IV point 9; Art. 72 | fill: computed | evidence: required -->
_Describe the system for evaluating performance in the post-market phase and attach the post-market monitoring plan referred to in Art. 72(3)._

Summary of the post-market monitoring system: {{a4.p9.summary}}

| Post-market monitoring plan reference | Version | Date | Hash (SHA-256) |
|---|---|---|---|
| {{a4.p9.plan_ref}} | {{a4.p9.version}} | {{a4.p9.date}} | {{a4.p9.sha256}} |

## Completeness check and retention
<!-- basis: Reg. (EU) 2024/1689 Art. 11(1) and Art. 18 | fill: computed | evidence: required -->
_Computed on every save: an item with no content and no justified "not applicable" is a gap and blocks approval._

| Annex IV point | Items required | Items filled with source | Items justified n/a | Gaps |
|---|---|---|---|---|
| {{a4.check[i].point}} | {{a4.check[i].required}} | {{a4.check[i].filled}} | {{a4.check[i].na}} | {{a4.check[i].gaps}} |

Retention period for this documentation per knowledge base: {{kb.eu_ai_act.retention.documentation}}

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 11(1) | fill: computed | evidence: required -->
_Design documents, datasheets, test reports, risk register and standards used above, each with page or section and hash._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 16 (provider obligations); internal HITL policy | fill: user | evidence: required -->
_Technical content is confirmed by engineering; regulatory completeness by compliance. Both are required before the declaration of conformity is issued._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Head of Engineering (HITL, technical accuracy) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Regulatory Affairs / Compliance | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
