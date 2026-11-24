---
id: tpl-fria
title_en: Fundamental Rights Impact Assessment (FRIA)
title_it: Valutazione d'impatto sui diritti fondamentali (FRIA)
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 27", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 13", "Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Annex III", "Charter of Fundamental Rights of the European Union"]
related_frameworks: ["GDPR Art. 35", "ISO/IEC 42001 Clause 6.1.4", "ISO/IEC 42001 A.5.2", "ISO/IEC 42001 A.5.3", "ISO/IEC 42001 A.5.4", "ISO/IEC 42001 A.5.5", "ISO/IEC 42005:2025", "NIST AI RMF MAP 5.1", "NIST AI RMF MAP 3.5"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Deployer's accountable manager, with DPO consultation
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace (deployer) | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}); provider: {{ai_system.provider}} |
| Assessment type | {{fria.type}} (first use / update) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Sections 1–6 follow Art. 27(1)(a)–(f). Where the AI Office template questionnaire under Art. 27(5) is available ({{kb.eu_ai_act.art27.ai_office_template}}), its structure prevails and this document maps onto it._

## 0. Applicability and timing
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1) and Art. 27(2); Art. 6(2) | fill: rag | evidence: required -->
_Confirm why a FRIA is required and that it is performed before first use. Obligation applicable from {{kb.eu_ai_act.timeline.high_risk_annex_iii}}._

| Test | Answer | Reasoning | Source |
|---|---|---|---|
| High-risk system under Art. 6(2) (Annex III point) | {{fria.applicability.annex3_point}} | {{fria.applicability.annex3_reasoning}} | {{fria.applicability.annex3_cite}} |
| Not an Annex III point 2 (critical infrastructure) system | {{fria.applicability.not_point2}} | {{fria.applicability.not_point2_reasoning}} | {{fria.applicability.not_point2_cite}} |
| Deployer is a body governed by public law, or a private entity providing public services | {{fria.applicability.public_body}} | {{fria.applicability.public_body_reasoning}} | {{fria.applicability.public_body_cite}} |
| Or: system referred to in Annex III point 5(b) or 5(c) | {{fria.applicability.point5bc}} | {{fria.applicability.point5bc_reasoning}} | {{fria.applicability.point5bc_cite}} |
| Performed prior to first use? Planned date of first use | {{fria.applicability.before_first_use}} | {{fria.applicability.first_use_date}} | {{fria.applicability.first_use_cite}} |
| Reliance on an earlier FRIA or on the provider's impact assessment (Art. 27(2)) | {{fria.applicability.reliance}} | {{fria.applicability.reliance_reasoning}} | {{fria.applicability.reliance_cite}} |

## 1. Deployer's processes in which the system will be used
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(a) | fill: rag | evidence: required -->
_Describe the processes in which the system is used, in line with its intended purpose. Quote the provider's intended purpose and show the fit._

| Field | Value | Source |
|---|---|---|
| Intended purpose stated by the provider | {{fria.a.intended_purpose}} | {{fria.a.intended_purpose_cite}} |
| Deployer's process(es) and decision points supported | {{fria.a.processes}} | {{fria.a.processes_cite}} |
| Role of the system output in the decision (advisory, determinative) | {{fria.a.output_role}} | {{fria.a.output_role_cite}} |
| Consistency of use with the intended purpose | {{fria.a.consistency}} | {{fria.a.consistency_cite}} |

## 2. Period and frequency of use
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(b) | fill: user | evidence: optional -->
_State the period within which, and how often, the system is intended to be used._

| Start of use | Planned duration / end | Frequency of use | Expected volume (cases, persons per period) |
|---|---|---|---|
| {{fria.b.start}} | {{fria.b.duration}} | {{fria.b.frequency}} | {{fria.b.volume}} |

## 3. Categories of natural persons and groups likely to be affected
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(c) | fill: rag | evidence: required -->
_Identify affected categories in the specific context, including persons affected indirectly and vulnerable groups._

| Category of persons / group | How affected (directly / indirectly) | Estimated number | Vulnerability factors | Source |
|---|---|---|---|---|
| {{fria.c.categories[i].name}} | {{fria.c.categories[i].how}} | {{fria.c.categories[i].number}} | {{fria.c.categories[i].vulnerability}} | {{fria.c.categories[i].cite}} |

## 4. Specific risks of harm
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(d); Art. 13 (information given by the provider); Charter of Fundamental Rights of the EU | fill: rag | evidence: required -->
_For each category in section 3, assess the specific risks of harm, taking into account the provider's information under Art. 13 (accuracy, known limitations, performance for specific groups). The list of rights is a prompt, not exhaustive; mark rights not engaged with a reason._

Provider information relied on (instructions for use, version): {{fria.d.provider_information}} — {{fria.d.provider_information_cite}}

| Right (Charter article) | Affected category | Risk of harm in this context | Likelihood | Severity (scale, reversibility) | Risk level | Source |
|---|---|---|---|---|---|---|
| Human dignity (Art. 1) | {{fria.d.dignity.category}} | {{fria.d.dignity.risk}} | {{fria.d.dignity.likelihood}} | {{fria.d.dignity.severity}} | {{fria.d.dignity.level}} | {{fria.d.dignity.cite}} |
| Private and family life; protection of personal data (Art. 7, 8) | {{fria.d.privacy.category}} | {{fria.d.privacy.risk}} | {{fria.d.privacy.likelihood}} | {{fria.d.privacy.severity}} | {{fria.d.privacy.level}} | {{fria.d.privacy.cite}} |
| Freedom of expression and information (Art. 11) | {{fria.d.expression.category}} | {{fria.d.expression.risk}} | {{fria.d.expression.likelihood}} | {{fria.d.expression.severity}} | {{fria.d.expression.level}} | {{fria.d.expression.cite}} |
| Non-discrimination; equality between women and men (Art. 21, 23) | {{fria.d.nondiscrimination.category}} | {{fria.d.nondiscrimination.risk}} | {{fria.d.nondiscrimination.likelihood}} | {{fria.d.nondiscrimination.severity}} | {{fria.d.nondiscrimination.level}} | {{fria.d.nondiscrimination.cite}} |
| Rights of the child, the elderly, persons with disabilities (Art. 24, 25, 26) | {{fria.d.vulnerable.category}} | {{fria.d.vulnerable.risk}} | {{fria.d.vulnerable.likelihood}} | {{fria.d.vulnerable.severity}} | {{fria.d.vulnerable.level}} | {{fria.d.vulnerable.cite}} |
| Fair and just working conditions (Art. 31) | {{fria.d.work.category}} | {{fria.d.work.risk}} | {{fria.d.work.likelihood}} | {{fria.d.work.severity}} | {{fria.d.work.level}} | {{fria.d.work.cite}} |
| Social security and social assistance (Art. 34) | {{fria.d.social.category}} | {{fria.d.social.risk}} | {{fria.d.social.likelihood}} | {{fria.d.social.severity}} | {{fria.d.social.level}} | {{fria.d.social.cite}} |
| Good administration; effective remedy and fair trial (Art. 41, 47) | {{fria.d.remedy.category}} | {{fria.d.remedy.risk}} | {{fria.d.remedy.likelihood}} | {{fria.d.remedy.severity}} | {{fria.d.remedy.level}} | {{fria.d.remedy.cite}} |
| Other right engaged: {{fria.d.other[i].right}} | {{fria.d.other[i].category}} | {{fria.d.other[i].risk}} | {{fria.d.other[i].likelihood}} | {{fria.d.other[i].severity}} | {{fria.d.other[i].level}} | {{fria.d.other[i].cite}} |

Risk scale used: {{fria.d.risk_scale}}

## 5. Implementation of human oversight measures
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(e); Art. 14; Art. 26 | fill: rag | evidence: required -->
_Describe how oversight is implemented according to the instructions for use: who, with what competence and authority, at which point, and how automation bias is countered._

| Oversight measure (from instructions for use) | Implementation by the deployer | Responsible person / role | Competence, training and authority evidence | Source |
|---|---|---|---|---|
| {{fria.e.measures[i].measure}} | {{fria.e.measures[i].implementation}} | {{fria.e.measures[i].responsible}} | {{fria.e.measures[i].competence}} | {{fria.e.measures[i].cite}} |

## 6. Measures if risks materialise
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1)(f) | fill: user | evidence: required -->
_Set out the measures to be taken if the risks in section 4 materialise, including internal governance arrangements and complaint mechanisms._

| Risk (section 4 reference) | Mitigation / response measure | Owner | Trigger for action | Residual risk |
|---|---|---|---|---|
| {{fria.f.measures[i].risk_ref}} | {{fria.f.measures[i].measure}} | {{fria.f.measures[i].owner}} | {{fria.f.measures[i].trigger}} | {{fria.f.measures[i].residual}} |

| Arrangement | Description |
|---|---|
| Internal governance (escalation, decision to suspend use) | {{fria.f.governance}} |
| Complaint mechanism for affected persons | {{fria.f.complaint_mechanism}} |
| Information to affected persons and right to explanation (Art. 26 and Art. 86) | {{fria.f.information_explanation}} |
| Serious incident reporting route (Art. 26 and Art. 73) | {{fria.f.incident_route}} |

## 7. Relationship with the data protection impact assessment
<!-- basis: Reg. (EU) 2024/1689 Art. 27(4); Reg. (EU) 2016/679 Art. 35 | fill: rag | evidence: required -->
_Where a DPIA already covers some of the obligations, this FRIA complements it: reference the DPIA and state what is covered where, avoiding duplication._

| DPIA reference and version | Elements covered by the DPIA | Elements covered only here | DPO opinion | Source |
|---|---|---|---|---|
| {{fria.dpia.reference}} | {{fria.dpia.covered}} | {{fria.dpia.fria_only}} | {{fria.dpia.dpo_opinion}} | {{fria.dpia.cite}} |

## 8. Stakeholder involvement
<!-- basis: good practice (not mandated by Art. 27); ISO/IEC 42001 A.5.4 | fill: user | evidence: optional -->
_Record any consultation of affected groups, worker representatives, or independent experts and how the input was used._

{{fria.stakeholders}}

## 9. Conclusion, notification and updates
<!-- basis: Reg. (EU) 2024/1689 Art. 27(2) and Art. 27(3) | fill: user | evidence: required -->
_State the overall conclusion and record notification of the results to the market surveillance authority using the template questionnaire, unless an exemption applies. Update when any element of Art. 27(1) changes or is no longer current._

| Field | Value |
|---|---|
| Overall conclusion (proceed / proceed with conditions / do not deploy) | {{fria.conclusion.decision}} |
| Conditions before first use | {{fria.conclusion.conditions}} |
| Market surveillance authority notified (authority, date, reference) | {{fria.notification.authority}} / {{fria.notification.date}} / {{fria.notification.reference}} |
| Exemption from notification claimed and basis | {{fria.notification.exemption}} |
| Update triggers and next review date | {{fria.update.triggers}} / {{fria.update.next_review}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 27(1)(d) (reliance on provider information) | fill: computed | evidence: required -->
_Provider instructions for use, process documentation, DPIA, statistics and consultation records used above; user-declared assessments are labelled with author and date._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 27(1) (obligation on the deployer); internal HITL policy | fill: user | evidence: required -->
_The assessment of rights impacts is a human judgement: the FRIA is valid only when approved by the deployer's accountable manager._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Consulted: DPO | {{signoff.dpo.name}} | {{signoff.dpo.opinion}} | {{signoff.dpo.date}} | {{signoff.dpo.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by (accountable manager) | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
