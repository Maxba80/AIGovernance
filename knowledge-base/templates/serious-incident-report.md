---
id: tpl-serious-incident-report
title_en: Serious Incident Report for a High-Risk AI System
title_it: Segnalazione di incidente grave relativo a sistema di IA ad alto rischio
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 73", "Reg. (EU) 2024/1689 Art. 3(49)", "Reg. (EU) 2024/1689 Art. 20", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 72"]
related_frameworks: ["GDPR Art. 33", "GDPR Art. 34", "ISO/IEC 42001 Clause 10.2", "ISO/IEC 42001 A.8.3", "ISO/IEC 42001 A.8.4", "NIST AI RMF MANAGE 4.3", "NIST AI RMF GOVERN 4.3"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Provider's legal representative or designated regulatory contact (with Legal / Compliance)
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| Incident reference | {{incident.id}} |
| Report type | {{incident.report_type}} (initial / follow-up / final) — report no. {{incident.report_sequence}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Time-critical document: an initial report that is incomplete may be submitted and completed later (Art. 73(5)). Do not delay submission to fill optional fields. Where the authority or the Commission provides a reporting form ({{kb.eu_ai_act.art73.reporting_form_and_guidance}}), that form prevails and this document feeds it. Facts not yet verified must be marked "preliminary"._

## 1. Reporting obligation and deadline tracker
<!-- basis: Reg. (EU) 2024/1689 Art. 73(1)-(5) | fill: kb | evidence: required -->
_Deadlines are read from the knowledge base and run from when the provider (or, where applicable, the deployer) becomes aware. The report is due immediately after a causal link, or the reasonable likelihood of one, is established and in any event within the deadline for the incident type. The app computes due dates from the awareness timestamp; a human confirms the incident type._

| Incident type | Basis | Deadline per knowledge base | Applies to this incident? |
|---|---|---|---|
| Serious incident (general rule) | Art. 73(2) | {{kb.eu_ai_act.art73.deadlines.general}} | {{incident.deadline.general.applies}} |
| Widespread infringement, or serious incident under Art. 3(49)(b) (critical infrastructure) | Art. 73(3) | {{kb.eu_ai_act.art73.deadlines.widespread_or_critical_infrastructure}} | {{incident.deadline.widespread.applies}} |
| Death of a person | Art. 73(4) | {{kb.eu_ai_act.art73.deadlines.death}} | {{incident.deadline.death.applies}} |

| Milestone | Timestamp (UTC) | Source |
|---|---|---|
| Incident occurred | {{incident.occurred_at}} | {{incident.occurred_cite}} |
| Organisation became aware | {{incident.aware_at}} | {{incident.aware_cite}} |
| Causal link or reasonable likelihood established | {{incident.causal_link_at}} | {{incident.causal_link_cite}} |
| Report due (computed) | {{incident.due_at}} | computed |
| Report submitted | {{incident.submitted_at}} | {{incident.submission_receipt_cite}} |

Sector-specific limitation of the reporting duty (Art. 73(9)–(10), per knowledge base {{kb.eu_ai_act.art73.sectoral_rules}}): {{incident.sectoral_rule_applies}}

## 2. Reporting entity and recipient authority
<!-- basis: Reg. (EU) 2024/1689 Art. 73(1); Art. 26 (deployer's duty to inform provider, then importer or distributor and authorities) | fill: rag | evidence: required -->
_Providers report to the market surveillance authorities of the Member States where the incident occurred. A deployer that identifies a serious incident informs the provider first; if the provider cannot be reached, Art. 73 applies to the deployer mutatis mutandis._

| Field | Value | Source |
|---|---|---|
| Reporting entity and role (provider / deployer) | {{incident.reporter.entity}} / {{incident.reporter.role}} | {{incident.reporter.cite}} |
| Contact person (name, function, phone, email) | {{incident.reporter.contact}} | user-declared |
| Provider (if different) and date informed | {{incident.provider.name}} / {{incident.provider.informed_at}} | {{incident.provider.cite}} |
| Authorised representative (where applicable) | {{incident.authrep}} | {{incident.authrep_cite}} |
| Recipient market surveillance authority / Member State(s) | {{incident.authority.name}} / {{incident.authority.member_states}} | {{kb.eu_ai_act.authorities.cite}} |
| Other parties informed (importer, distributor, deployers) | {{incident.others_informed}} | {{incident.others_informed_cite}} |

## 3. AI system identification
<!-- basis: Reg. (EU) 2024/1689 Art. 73(1); Art. 49 (registration) | fill: computed | evidence: required -->
_Copied from the inventory record and technical documentation; confirm the version actually running at the time of the incident._

| Field | Value |
|---|---|
| System name, type and version involved | {{incident.system.name_version}} |
| High-risk basis (Annex III point or Annex I act) | {{classification.legal_hook}} |
| EU database registration number | {{registration.reference}} |
| Declaration of conformity reference / notified body (where applicable) | {{incident.system.doc_ref}} / {{incident.system.notified_body}} |
| Deployer and context of use at the time | {{incident.system.deployer_context}} |

## 4. Classification as a serious incident
<!-- basis: Reg. (EU) 2024/1689 Art. 3(49) | fill: rag | evidence: required -->
_Tick each limb that applies and justify it. An incident or malfunction qualifies when it directly or indirectly leads to any of the following._

| Limb | Outcome | Applies? | Justification | Source |
|---|---|---|---|---|
| Art. 3(49)(a) | Death of a person, or serious harm to a person's health | {{incident.class.a.applies}} | {{incident.class.a.justification}} | {{incident.class.a.cite}} |
| Art. 3(49)(b) | Serious and irreversible disruption of the management or operation of critical infrastructure | {{incident.class.b.applies}} | {{incident.class.b.justification}} | {{incident.class.b.cite}} |
| Art. 3(49)(c) | Infringement of obligations under Union law intended to protect fundamental rights | {{incident.class.c.applies}} | {{incident.class.c.justification}} | {{incident.class.c.cite}} |
| Art. 3(49)(d) | Serious harm to property or the environment | {{incident.class.d.applies}} | {{incident.class.d.justification}} | {{incident.class.d.cite}} |

## 5. Description of the incident
<!-- basis: Reg. (EU) 2024/1689 Art. 73(1) and Art. 73(5) | fill: rag | evidence: required -->
_Describe facts chronologically from logs, tickets and witness reports. Separate established facts from assumptions._

| Field | Value | Source |
|---|---|---|
| Place of the incident (Member State, site) | {{incident.place}} | {{incident.place_cite}} |
| What happened (factual narrative) | {{incident.narrative}} | {{incident.narrative_cite}} |
| System input, output and behaviour involved | {{incident.system_behaviour}} | {{incident.system_behaviour_cite}} |
| How the incident was detected, and by whom | {{incident.detection}} | {{incident.detection_cite}} |
| Human oversight in place at the time and how it operated | {{incident.oversight_at_time}} | {{incident.oversight_cite}} |
| Used in accordance with the instructions for use? | {{incident.use_per_ifu}} | {{incident.use_per_ifu_cite}} |

| Time (UTC) | Event | Source |
|---|---|---|
| {{incident.timeline[i].time}} | {{incident.timeline[i].event}} | {{incident.timeline[i].cite}} |

## 6. Harm and affected persons
<!-- basis: Reg. (EU) 2024/1689 Art. 3(49); Art. 73(6) | fill: rag | evidence: required -->
_Quantify where possible. Do not include names or directly identifying data of affected persons in this report._

| Field | Value | Source |
|---|---|---|
| Nature and severity of harm | {{incident.harm.nature}} | {{incident.harm.nature_cite}} |
| Number and categories of persons affected (including vulnerable groups) | {{incident.harm.persons}} | {{incident.harm.persons_cite}} |
| Reversibility and ongoing risk | {{incident.harm.reversibility}} | {{incident.harm.reversibility_cite}} |
| Other deployments where the same incident could occur | {{incident.harm.other_deployments}} | {{incident.harm.other_deployments_cite}} |

## 7. Causal link
<!-- basis: Reg. (EU) 2024/1689 Art. 73(2) | fill: rag | evidence: required -->
_State whether a causal link between the AI system and the incident is established or reasonably likely, and on what evidence. "Under investigation" is acceptable in an initial report._

| Status of causal link | Reasoning | Contributing factors (data, model, integration, human, misuse, third party) | Source |
|---|---|---|---|
| {{incident.causal.status}} | {{incident.causal.reasoning}} | {{incident.causal.contributing_factors}} | {{incident.causal.cite}} |

## 8. Immediate measures and preservation of evidence
<!-- basis: Reg. (EU) 2024/1689 Art. 73(6); Art. 20 | fill: rag | evidence: required -->
_Record containment actions. The provider must not perform any investigation that alters the AI system in a way that may affect later evaluation of the causes before informing the competent authorities: confirm that state, logs and model version have been preserved._

| Measure taken (suspension, rollback, disabling, notification of deployers) | Date and time | Responsible | Source |
|---|---|---|---|
| {{incident.measures[i].measure}} | {{incident.measures[i].time}} | {{incident.measures[i].responsible}} | {{incident.measures[i].cite}} |

| Evidence preserved | Location | Hash (SHA-256) | System altered since the incident? |
|---|---|---|---|
| {{incident.evidence[i].item}} | {{incident.evidence[i].location}} | {{incident.evidence[i].sha256}} | {{incident.evidence[i].altered}} |

## 9. Investigation, risk assessment and corrective action
<!-- basis: Reg. (EU) 2024/1689 Art. 73(6); Art. 20; Art. 9 | fill: user | evidence: required -->
_After reporting, the provider must without delay investigate the incident and the system, including a risk assessment and corrective action, cooperating with the competent authorities and, where relevant, the notified body. Complete progressively in follow-up and final reports._

| Field | Value | Source |
|---|---|---|
| Investigation plan and status | {{incident.investigation.status}} | {{incident.investigation.cite}} |
| Root cause (final report) | {{incident.investigation.root_cause}} | {{incident.investigation.root_cause_cite}} |
| Risk assessment of the incident and of recurrence | {{incident.investigation.risk_assessment}} | {{incident.investigation.risk_assessment_cite}} |
| Corrective and preventive actions, owner, due date | {{incident.investigation.corrective_actions}} | {{incident.investigation.corrective_actions_cite}} |
| Updates to risk register, technical documentation, instructions for use | {{incident.investigation.document_updates}} | {{incident.investigation.document_updates_cite}} |
| Notified body informed (where relevant) | {{incident.investigation.notified_body_informed}} | {{incident.investigation.notified_body_cite}} |

## 10. Parallel notifications
<!-- basis: Reg. (EU) 2016/679 Art. 33 and Art. 34; other Union reporting regimes per knowledge base | fill: user | evidence: optional -->
_Check whether the same event triggers other notification duties, each with its own deadline: {{kb.incident.parallel_regimes}}._

| Regime | Applies? | Authority | Deadline (knowledge base) | Submitted on / reference |
|---|---|---|---|---|
| Personal data breach (GDPR Art. 33; data subjects Art. 34) | {{incident.parallel.gdpr.applies}} | {{incident.parallel.gdpr.authority}} | {{kb.gdpr.art33.deadline}} | {{incident.parallel.gdpr.reference}} |
| {{incident.parallel.other[i].regime}} | {{incident.parallel.other[i].applies}} | {{incident.parallel.other[i].authority}} | {{incident.parallel.other[i].deadline}} | {{incident.parallel.other[i].reference}} |

## 11. Submission history
<!-- basis: Reg. (EU) 2024/1689 Art. 73(5) | fill: computed | evidence: required -->
_One row per report sent, with the authority's acknowledgement as evidence._

| Report no. | Type | Submitted at (UTC) | Channel | Authority acknowledgement | Document hash (SHA-256) |
|---|---|---|---|---|---|
| {{incident.submissions[i].n}} | {{incident.submissions[i].type}} | {{incident.submissions[i].submitted_at}} | {{incident.submissions[i].channel}} | {{incident.submissions[i].acknowledgement}} | {{incident.submissions[i].sha256}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 73(6) | fill: computed | evidence: required -->
_Logs, tickets, communications, witness statements and technical records used above. Preliminary or user-declared facts are labelled as such with author and time._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 73(1) (obligation on the provider); internal HITL policy | fill: user | evidence: required -->
_The decision to report and the content sent to an authority are always human decisions. The agent drafts and tracks deadlines; it never submits._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Legal / Compliance (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Authorised regulatory contact | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
