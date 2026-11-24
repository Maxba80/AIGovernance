---
id: tpl-ai-literacy-plan
title_en: AI Literacy Plan
title_it: Piano di alfabetizzazione in materia di IA
category: executive
legal_basis: ["Reg. (EU) 2024/1689 Art. 4", "Reg. (EU) 2024/1689 Art. 3(56)", "Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Art. 26"]
related_frameworks: ["ISO/IEC 42001 Clause 7.2", "ISO/IEC 42001 Clause 7.3", "ISO/IEC 42001 A.4.6", "NIST AI RMF GOVERN 2.2", "GDPR Art. 39(1)(b)"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: AI Governance Lead with HR / Learning and Development
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{literacy.scope}} (all AI systems operated or used, or a named subset) |
| Plan period | {{literacy.period_start}} – {{literacy.period_end}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

## 1. Legal basis and objective
<!-- basis: Reg. (EU) 2024/1689 Art. 4 and Art. 3(56) | fill: kb | evidence: required -->
_The text and current status of the AI literacy provision are read from the knowledge base, because the Regulation was amended after adoption and the wording and addressees of Art. 4 must be checked against the consolidated text; do not paraphrase from memory._

Provision as currently in force: {{kb.eu_ai_act.art4.current_text}}
Applicable from: {{kb.eu_ai_act.timeline.art4}} — Knowledge-base version: {{kb.eu_ai_act.version}}
Definition of AI literacy: {{kb.eu_ai_act.definitions.ai_literacy}}

Objective of this plan: {{literacy.objective}}

## 2. Organisational context
<!-- basis: Reg. (EU) 2024/1689 Art. 4 (context in which the AI systems are to be used; persons on whom they are to be used) | fill: rag | evidence: required -->
_Summarise from the AI inventory which systems are used, in which role, their risk class, and the persons or groups on whom they are used. Cite inventory records._

| AI system | Role of the organisation | Risk class | Context of use | Persons or groups affected | Source |
|---|---|---|---|---|---|
| {{literacy.systems[i].name}} | {{literacy.systems[i].role}} | {{literacy.systems[i].risk_class}} | {{literacy.systems[i].context}} | {{literacy.systems[i].affected_persons}} | {{literacy.systems[i].cite}} |

## 3. Target groups
<!-- basis: Reg. (EU) 2024/1689 Art. 4 (staff and other persons dealing with the operation and use of AI systems on the organisation's behalf) | fill: user | evidence: optional -->
_Include non-employees acting on the organisation's behalf (contractors, service providers). Group by how people interact with AI, not by hierarchy alone._

| Group | Who | Headcount | Interaction with AI systems | Includes external persons? |
|---|---|---|---|---|
| G1 Board and executives | {{literacy.groups.g1.who}} | {{literacy.groups.g1.headcount}} | {{literacy.groups.g1.interaction}} | {{literacy.groups.g1.external}} |
| G2 General users of AI tools | {{literacy.groups.g2.who}} | {{literacy.groups.g2.headcount}} | {{literacy.groups.g2.interaction}} | {{literacy.groups.g2.external}} |
| G3 Human oversight operators of high-risk systems | {{literacy.groups.g3.who}} | {{literacy.groups.g3.headcount}} | {{literacy.groups.g3.interaction}} | {{literacy.groups.g3.external}} |
| G4 Developers, data and ML staff | {{literacy.groups.g4.who}} | {{literacy.groups.g4.headcount}} | {{literacy.groups.g4.interaction}} | {{literacy.groups.g4.external}} |
| G5 Governance, risk, legal, DPO, audit | {{literacy.groups.g5.who}} | {{literacy.groups.g5.headcount}} | {{literacy.groups.g5.interaction}} | {{literacy.groups.g5.external}} |
| G6 Procurement and vendor managers | {{literacy.groups.g6.who}} | {{literacy.groups.g6.headcount}} | {{literacy.groups.g6.interaction}} | {{literacy.groups.g6.external}} |

## 4. Needs assessment
<!-- basis: Reg. (EU) 2024/1689 Art. 4 (technical knowledge, experience, education and training of the persons concerned); ISO/IEC 42001 Clause 7.2 | fill: rag | evidence: required -->
_Record the baseline per group (survey, test, training records) and the gap to the required level. Cite the survey or HR records used._

| Group | Baseline knowledge and experience | Required level | Gap | Assessment method | Source |
|---|---|---|---|---|---|
| {{literacy.needs[i].group}} | {{literacy.needs[i].baseline}} | {{literacy.needs[i].required}} | {{literacy.needs[i].gap}} | {{literacy.needs[i].method}} | {{literacy.needs[i].cite}} |

## 5. Learning objectives and curriculum
<!-- basis: Reg. (EU) 2024/1689 Art. 3(56) (skills, knowledge and understanding to make an informed deployment and gain awareness of opportunities, risks and possible harm) | fill: user | evidence: optional -->
_Map modules to groups. Core modules below are a proposal; add system-specific modules for each high-risk system, based on the provider's instructions for use._

| Module | Learning objective | G1 | G2 | G3 | G4 | G5 | G6 |
|---|---|---|---|---|---|---|---|
| M1 What AI is, capabilities and limits | {{literacy.modules.m1.objective}} | {{literacy.modules.m1.g1}} | {{literacy.modules.m1.g2}} | {{literacy.modules.m1.g3}} | {{literacy.modules.m1.g4}} | {{literacy.modules.m1.g5}} | {{literacy.modules.m1.g6}} |
| M2 Risks and possible harm (bias, errors, security, privacy) | {{literacy.modules.m2.objective}} | {{literacy.modules.m2.g1}} | {{literacy.modules.m2.g2}} | {{literacy.modules.m2.g3}} | {{literacy.modules.m2.g4}} | {{literacy.modules.m2.g5}} | {{literacy.modules.m2.g6}} |
| M3 Legal framework: AI Act roles and obligations, GDPR | {{literacy.modules.m3.objective}} | {{literacy.modules.m3.g1}} | {{literacy.modules.m3.g2}} | {{literacy.modules.m3.g3}} | {{literacy.modules.m3.g4}} | {{literacy.modules.m3.g5}} | {{literacy.modules.m3.g6}} |
| M4 Internal AI policy and GenAI acceptable use | {{literacy.modules.m4.objective}} | {{literacy.modules.m4.g1}} | {{literacy.modules.m4.g2}} | {{literacy.modules.m4.g3}} | {{literacy.modules.m4.g4}} | {{literacy.modules.m4.g5}} | {{literacy.modules.m4.g6}} |
| M5 Human oversight: interpreting output, automation bias, override and stop | {{literacy.modules.m5.objective}} | {{literacy.modules.m5.g1}} | {{literacy.modules.m5.g2}} | {{literacy.modules.m5.g3}} | {{literacy.modules.m5.g4}} | {{literacy.modules.m5.g5}} | {{literacy.modules.m5.g6}} |
| M6 System-specific training: {{literacy.modules.m6.system}} | {{literacy.modules.m6.objective}} | {{literacy.modules.m6.g1}} | {{literacy.modules.m6.g2}} | {{literacy.modules.m6.g3}} | {{literacy.modules.m6.g4}} | {{literacy.modules.m6.g5}} | {{literacy.modules.m6.g6}} |
| M7 Incident and concern reporting | {{literacy.modules.m7.objective}} | {{literacy.modules.m7.g1}} | {{literacy.modules.m7.g2}} | {{literacy.modules.m7.g3}} | {{literacy.modules.m7.g4}} | {{literacy.modules.m7.g5}} | {{literacy.modules.m7.g6}} |

## 6. Human oversight competence (high-risk systems)
<!-- basis: Reg. (EU) 2024/1689 Art. 26 (deployers assign human oversight to natural persons with the necessary competence, training and authority) and Art. 14 | fill: rag | evidence: required -->
_For each high-risk system list the persons assigned to oversight and the evidence that they are competent, trained and have authority. Leave empty and state "no high-risk systems" if none._

| AI system | Oversight person / role | Competence evidence | Training completed | Authority to override or stop | Source |
|---|---|---|---|---|---|
| {{literacy.oversight[i].system}} | {{literacy.oversight[i].person}} | {{literacy.oversight[i].competence}} | {{literacy.oversight[i].training}} | {{literacy.oversight[i].authority}} | {{literacy.oversight[i].cite}} |

## 7. Delivery plan
<!-- basis: ISO/IEC 42001 Clause 7.2; A.4.6 | fill: user | evidence: optional -->
_Plan formats, providers, dates and budget; include onboarding for new joiners and refreshers after material changes to systems or law._

| Module | Format | Provider | Duration | Audience | Scheduled | Refresher interval | Budget |
|---|---|---|---|---|---|---|---|
| {{literacy.delivery[i].module}} | {{literacy.delivery[i].format}} | {{literacy.delivery[i].provider}} | {{literacy.delivery[i].duration}} | {{literacy.delivery[i].audience}} | {{literacy.delivery[i].date}} | {{literacy.delivery[i].refresher}} | {{literacy.delivery[i].budget}} |

## 8. Effectiveness, records and KPIs
<!-- basis: ISO/IEC 42001 Clause 7.2 (evaluate effectiveness; retain documented information as evidence of competence) and Clause 9.1 | fill: computed | evidence: required -->
_Completion and assessment figures are computed from training records; the records themselves are the evidence that measures were taken._

| KPI | Target | Current | Calculation reference |
|---|---|---|---|
| Completion rate per group | {{literacy.kpi.completion.target}} | {{literacy.kpi.completion.current}} | {{literacy.kpi.completion.calc_ref}} |
| Assessment pass rate | {{literacy.kpi.pass.target}} | {{literacy.kpi.pass.current}} | {{literacy.kpi.pass.calc_ref}} |
| Oversight operators trained before assignment | {{literacy.kpi.oversight.target}} | {{literacy.kpi.oversight.current}} | {{literacy.kpi.oversight.calc_ref}} |
| New joiners trained within the onboarding window | {{literacy.kpi.onboarding.target}} | {{literacy.kpi.onboarding.current}} | {{literacy.kpi.onboarding.calc_ref}} |

Records kept: {{literacy.records.description}} — Location: {{literacy.records.location}} — Retention: {{literacy.records.retention}}

## 9. Roles, review and update triggers
<!-- basis: ISO/IEC 42001 Clause 5.3 and Clause 10.1 | fill: user | evidence: optional -->
_Name the plan owner and when the plan is reviewed: at least periodically, and when new AI systems, roles, incidents or legal changes occur._

| Plan owner | Delivery owner | Review interval | Update triggers |
|---|---|---|---|
| {{literacy.owner}} | {{literacy.delivery_owner}} | {{literacy.review.interval}} | {{literacy.review.triggers}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Inventory records, surveys, training records and legal texts used above; user-declared content is labelled as such._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 Clause 5.1; internal HITL policy | fill: user | evidence: required -->
_The plan is approved after human validation of the needs assessment and oversight table._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
