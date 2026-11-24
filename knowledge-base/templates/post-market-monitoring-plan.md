---
id: tpl-post-market-monitoring-plan
title_en: Post-Market Monitoring Plan for a High-Risk AI System
title_it: Piano di monitoraggio successivo all'immissione sul mercato
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 72", "Reg. (EU) 2024/1689 Annex IV point 9", "Reg. (EU) 2024/1689 Art. 9", "Reg. (EU) 2024/1689 Art. 12", "Reg. (EU) 2024/1689 Art. 17", "Reg. (EU) 2024/1689 Art. 20", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 73"]
related_frameworks: ["ISO/IEC 42001 Clause 9.1", "ISO/IEC 42001 Clause 10.2", "ISO/IEC 42001 A.6.2.6", "ISO/IEC 42001 A.8.3", "ISO/IEC 42001 A.8.4", "NIST AI RMF MANAGE 4.1", "NIST AI RMF MEASURE 2.4", "NIST AI RMF MEASURE 3.1", "GDPR Art. 33"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: Provider's Quality / Regulatory Affairs Manager and AI system owner
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace (provider) | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| High-risk basis | {{classification.legal_hook}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_The plan is part of the technical documentation (Art. 72(3), Annex IV point 9). Where the Commission's implementing act establishing the plan template is available ({{kb.eu_ai_act.art72.implementing_act_template}}), its structure prevails and this document maps onto it. Obligation applicable from {{kb.eu_ai_act.timeline.high_risk_annex_iii}} / {{kb.eu_ai_act.timeline.high_risk_annex_i}}._

## 1. Scope and objectives
<!-- basis: Reg. (EU) 2024/1689 Art. 72(1) and Art. 72(2) | fill: user | evidence: optional -->
_The system must be proportionate to the nature of the AI technology and the risks of the high-risk system, and must let the provider evaluate continuous compliance with Chapter III, Section 2 throughout the system's lifetime._

| Field | Value |
|---|---|
| System versions and deployments covered | {{pmm.scope.versions_deployments}} |
| Intended purpose (from technical documentation) | {{pmm.scope.intended_purpose}} |
| Objectives of monitoring | {{pmm.scope.objectives}} |
| Proportionality rationale (technology, risk level, scale of deployment) | {{pmm.scope.proportionality}} |
| Expected lifetime of the system / monitoring period | {{pmm.scope.lifetime}} |

## 2. Roles and responsibilities
<!-- basis: Reg. (EU) 2024/1689 Art. 17 (quality management system includes the post-market monitoring system); ISO/IEC 42001 Clause 5.3 | fill: user | evidence: optional -->
_Name who collects, analyses, decides and reports; include the deployer-facing contact._

| Activity | Responsible | Accountable | Deputy |
|---|---|---|---|
| Data collection and quality | {{pmm.roles.collection.r}} | {{pmm.roles.collection.a}} | {{pmm.roles.collection.deputy}} |
| Analysis and trend reporting | {{pmm.roles.analysis.r}} | {{pmm.roles.analysis.a}} | {{pmm.roles.analysis.deputy}} |
| Decision on corrective action | {{pmm.roles.corrective.r}} | {{pmm.roles.corrective.a}} | {{pmm.roles.corrective.deputy}} |
| Serious incident reporting to authorities | {{pmm.roles.incident.r}} | {{pmm.roles.incident.a}} | {{pmm.roles.incident.deputy}} |
| Deployer communication | {{pmm.roles.deployer_comms.r}} | {{pmm.roles.deployer_comms.a}} | {{pmm.roles.deployer_comms.deputy}} |

## 3. Data sources and collection methods
<!-- basis: Reg. (EU) 2024/1689 Art. 72(2); Art. 12; Art. 26 | fill: rag | evidence: required -->
_Collection must be active and systematic: data may be provided by deployers or collected through other sources. Cite the contract clause or technical mechanism that makes each source available. Sensitive operational data of deployers that are law-enforcement authorities is excluded._

| Data source | Data collected | Method (automatic / periodic request / ad hoc) | Frequency | Legal or contractual basis for access | Personal data? Safeguards | Source |
|---|---|---|---|---|---|---|
| Automatically generated logs (Art. 12) | {{pmm.sources.logs.data}} | {{pmm.sources.logs.method}} | {{pmm.sources.logs.frequency}} | {{pmm.sources.logs.basis}} | {{pmm.sources.logs.personal_data}} | {{pmm.sources.logs.cite}} |
| Deployer feedback and reports (Art. 26) | {{pmm.sources.deployers.data}} | {{pmm.sources.deployers.method}} | {{pmm.sources.deployers.frequency}} | {{pmm.sources.deployers.basis}} | {{pmm.sources.deployers.personal_data}} | {{pmm.sources.deployers.cite}} |
| Complaints from affected persons | {{pmm.sources.complaints.data}} | {{pmm.sources.complaints.method}} | {{pmm.sources.complaints.frequency}} | {{pmm.sources.complaints.basis}} | {{pmm.sources.complaints.personal_data}} | {{pmm.sources.complaints.cite}} |
| Performance and drift telemetry | {{pmm.sources.telemetry.data}} | {{pmm.sources.telemetry.method}} | {{pmm.sources.telemetry.frequency}} | {{pmm.sources.telemetry.basis}} | {{pmm.sources.telemetry.personal_data}} | {{pmm.sources.telemetry.cite}} |
| Security events and vulnerability reports | {{pmm.sources.security.data}} | {{pmm.sources.security.method}} | {{pmm.sources.security.frequency}} | {{pmm.sources.security.basis}} | {{pmm.sources.security.personal_data}} | {{pmm.sources.security.cite}} |
| External sources (literature, incident databases, authority notices) | {{pmm.sources.external.data}} | {{pmm.sources.external.method}} | {{pmm.sources.external.frequency}} | {{pmm.sources.external.basis}} | {{pmm.sources.external.personal_data}} | {{pmm.sources.external.cite}} |

## 4. Indicators and thresholds
<!-- basis: Reg. (EU) 2024/1689 Art. 72(2) (continuous compliance with Chapter III, Section 2); Art. 9, Art. 10, Art. 13, Art. 14, Art. 15 | fill: rag | evidence: required -->
_Derive baselines from the validated test results in the technical documentation. Each indicator needs an alert threshold and an action threshold with an owner._

| Requirement monitored | Indicator | Baseline (from technical documentation) | Alert threshold | Action threshold | Measurement frequency | Owner | Source |
|---|---|---|---|---|---|---|---|
| Accuracy (Art. 15) | {{pmm.kpi.accuracy.indicator}} | {{pmm.kpi.accuracy.baseline}} | {{pmm.kpi.accuracy.alert}} | {{pmm.kpi.accuracy.action}} | {{pmm.kpi.accuracy.frequency}} | {{pmm.kpi.accuracy.owner}} | {{pmm.kpi.accuracy.cite}} |
| Robustness and drift (Art. 15) | {{pmm.kpi.robustness.indicator}} | {{pmm.kpi.robustness.baseline}} | {{pmm.kpi.robustness.alert}} | {{pmm.kpi.robustness.action}} | {{pmm.kpi.robustness.frequency}} | {{pmm.kpi.robustness.owner}} | {{pmm.kpi.robustness.cite}} |
| Cybersecurity (Art. 15) | {{pmm.kpi.security.indicator}} | {{pmm.kpi.security.baseline}} | {{pmm.kpi.security.alert}} | {{pmm.kpi.security.action}} | {{pmm.kpi.security.frequency}} | {{pmm.kpi.security.owner}} | {{pmm.kpi.security.cite}} |
| Bias and performance for specific groups (Art. 10, Art. 15) | {{pmm.kpi.fairness.indicator}} | {{pmm.kpi.fairness.baseline}} | {{pmm.kpi.fairness.alert}} | {{pmm.kpi.fairness.action}} | {{pmm.kpi.fairness.frequency}} | {{pmm.kpi.fairness.owner}} | {{pmm.kpi.fairness.cite}} |
| Human oversight effectiveness (Art. 14) | {{pmm.kpi.oversight.indicator}} | {{pmm.kpi.oversight.baseline}} | {{pmm.kpi.oversight.alert}} | {{pmm.kpi.oversight.action}} | {{pmm.kpi.oversight.frequency}} | {{pmm.kpi.oversight.owner}} | {{pmm.kpi.oversight.cite}} |
| Use outside intended purpose / foreseeable misuse (Art. 9) | {{pmm.kpi.misuse.indicator}} | {{pmm.kpi.misuse.baseline}} | {{pmm.kpi.misuse.alert}} | {{pmm.kpi.misuse.action}} | {{pmm.kpi.misuse.frequency}} | {{pmm.kpi.misuse.owner}} | {{pmm.kpi.misuse.cite}} |
| Complaints and incidents | {{pmm.kpi.complaints.indicator}} | {{pmm.kpi.complaints.baseline}} | {{pmm.kpi.complaints.alert}} | {{pmm.kpi.complaints.action}} | {{pmm.kpi.complaints.frequency}} | {{pmm.kpi.complaints.owner}} | {{pmm.kpi.complaints.cite}} |

## 5. Interaction with other AI systems
<!-- basis: Reg. (EU) 2024/1689 Art. 72(2) | fill: rag | evidence: required -->
_Where relevant, monitoring must include an analysis of the interaction with other AI systems. State "not relevant" with reasoning if the system operates in isolation._

| Other AI system / model | Nature of interaction | Risk from interaction | How monitored | Source |
|---|---|---|---|---|
| {{pmm.interactions[i].system}} | {{pmm.interactions[i].nature}} | {{pmm.interactions[i].risk}} | {{pmm.interactions[i].monitoring}} | {{pmm.interactions[i].cite}} |

## 6. Analysis, documentation and review cycle
<!-- basis: Reg. (EU) 2024/1689 Art. 72(2) (collect, document and analyse); ISO/IEC 42001 Clause 9.1 | fill: user | evidence: optional -->
_Define how data is analysed, where results are documented and how often they are reviewed by management._

| Field | Value |
|---|---|
| Analysis methods (trend analysis, statistical tests, root-cause analysis) | {{pmm.analysis.methods}} |
| Periodic monitoring report: frequency and recipients | {{pmm.analysis.report_frequency}} / {{pmm.analysis.report_recipients}} |
| Where findings are recorded | {{pmm.analysis.records_location}} |
| Management review of monitoring results | {{pmm.analysis.management_review}} |

## 7. Feedback into risk management and technical documentation
<!-- basis: Reg. (EU) 2024/1689 Art. 9 (risk management takes account of post-market monitoring data); Art. 11 (documentation kept up to date) | fill: user | evidence: optional -->
_Describe how findings update the risk register, technical documentation, instructions for use and, where needed, trigger a new conformity assessment._

{{pmm.feedback.process}}

## 8. Corrective actions and serious incidents
<!-- basis: Reg. (EU) 2024/1689 Art. 20; Art. 73 | fill: kb | evidence: required -->
_Link action thresholds (section 4) to concrete responses. Reporting deadlines are read from the knowledge base and are not typed here; use the Serious Incident Report template for the notification itself._

| Trigger | Response (corrective action, withdrawal, disabling, recall) | Who is informed (deployers, distributors, importers, authorised representative, authorities) | Decision owner | Time limit |
|---|---|---|---|---|
| {{pmm.corrective[i].trigger}} | {{pmm.corrective[i].response}} | {{pmm.corrective[i].informed}} | {{pmm.corrective[i].owner}} | {{pmm.corrective[i].time_limit}} |

Serious incident definition and reporting deadlines per knowledge base: {{kb.eu_ai_act.definitions.serious_incident}} — {{kb.eu_ai_act.art73.deadlines}}
Internal escalation path from detection to reporting decision: {{pmm.incident.escalation_path}}

## 9. Integration with existing monitoring systems
<!-- basis: Reg. (EU) 2024/1689 Art. 72(4) | fill: user | evidence: optional -->
_For systems covered by Annex I, Section A legislation, or by financial services law with internal governance requirements, the plan may be integrated into the existing post-market monitoring system if an equivalent level of protection is achieved. State whether this option is used._

| Existing system / legislation | Integration approach | Equivalence justification |
|---|---|---|
| {{pmm.integration.existing_system}} | {{pmm.integration.approach}} | {{pmm.integration.equivalence}} |

## 10. Plan maintenance
<!-- basis: Reg. (EU) 2024/1689 Art. 72(3) (plan is part of the technical documentation); Art. 18 | fill: user | evidence: optional -->
_The plan is version-controlled with the technical documentation and retained for the same period ({{kb.eu_ai_act.retention.documentation}})._

| Review interval | Update triggers | Next review | Linked technical documentation version |
|---|---|---|---|
| {{pmm.review.interval}} | {{pmm.review.triggers}} | {{pmm.review.next_date}} | {{pmm.review.techdoc_version}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Technical documentation, test reports, deployer contracts, logging specifications and risk register entries used above._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 72(1) (providers establish and document the system); internal HITL policy | fill: user | evidence: required -->
_Thresholds and escalation paths are human decisions and must be confirmed before the plan takes effect._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| AI system owner (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Quality / Regulatory Affairs Manager | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
