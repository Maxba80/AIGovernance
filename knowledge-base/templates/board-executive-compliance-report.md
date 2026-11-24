---
id: tpl-board-executive-compliance-report
title_en: Board and Executive AI Compliance Report
title_it: Report di conformità AI per il Consiglio di Amministrazione e la Direzione
category: executive
legal_basis: ["Reg. (EU) 2024/1689 Art. 99", "Reg. (EU) 2024/1689 Art. 113", "Reg. (EU) 2016/679 Art. 83", "Reg. (EU) 2016/679 Art. 5(2)", "Reg. (EU) 2016/679 Art. 24"]
related_frameworks: ["ISO/IEC 42001 Clause 5.1", "ISO/IEC 42001 Clause 9.1", "ISO/IEC 42001 Clause 9.3", "NIST AI RMF GOVERN 1.1", "NIST AI RMF GOVERN 2.3"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: Chief Compliance Officer / AI Governance Lead (presented to the Board)
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system(s) in scope | {{report.scope}} ({{report.ai_system_count}} systems) |
| Reporting period | {{report.period_start}} – {{report.period_end}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

## 1. Executive summary
<!-- basis: ISO/IEC 42001 Clause 9.3 (management review inputs) | fill: user | evidence: optional -->
_Maximum ten lines: overall posture, what changed since the last report, and the decisions requested in section 8. Drafted by the agent from sections 2–7, confirmed by the author._

{{summary.text}}

Overall status: **{{summary.rag_status}}** (previous period: {{summary.rag_status_previous}})

## 2. Compliance status per framework
<!-- basis: Reg. (EU) 2024/1689 Art. 113; Reg. (EU) 2016/679 Art. 5(2) and Art. 24; ISO/IEC 42001 Clause 9.1 | fill: computed | evidence: required -->
_Percentages are computed by the app from validated control assessments only; unvalidated items count as open. Applicable dates come from the knowledge base, never typed by hand._

| Framework | Requirements in scope | Met | Partially met | Not met | Not assessed | Score | Next applicable date | Source |
|---|---|---|---|---|---|---|---|---|
| EU AI Act (Reg. (EU) 2024/1689 as amended) | {{fw.aiact.total}} | {{fw.aiact.met}} | {{fw.aiact.partial}} | {{fw.aiact.not_met}} | {{fw.aiact.not_assessed}} | {{fw.aiact.score}} | {{kb.eu_ai_act.timeline.next_milestone}} | {{fw.aiact.cite}} |
| GDPR (Reg. (EU) 2016/679) | {{fw.gdpr.total}} | {{fw.gdpr.met}} | {{fw.gdpr.partial}} | {{fw.gdpr.not_met}} | {{fw.gdpr.not_assessed}} | {{fw.gdpr.score}} | in force | {{fw.gdpr.cite}} |
| ISO/IEC 42001:2023 | {{fw.iso42001.total}} | {{fw.iso42001.met}} | {{fw.iso42001.partial}} | {{fw.iso42001.not_met}} | {{fw.iso42001.not_assessed}} | {{fw.iso42001.score}} | {{fw.iso42001.next_audit}} | {{fw.iso42001.cite}} |
| NIST AI RMF 1.0 (voluntary) | {{fw.nist.total}} | {{fw.nist.met}} | {{fw.nist.partial}} | {{fw.nist.not_met}} | {{fw.nist.not_assessed}} | {{fw.nist.score}} | n/a | {{fw.nist.cite}} |

AI Act timeline applied in this report (knowledge-base version {{kb.eu_ai_act.version}}): {{kb.eu_ai_act.timeline.summary}}

## 3. AI system portfolio
<!-- basis: Reg. (EU) 2024/1689 Art. 5, Art. 6, Art. 50, Art. 51; NIST AI RMF GOVERN 1.6 | fill: computed | evidence: required -->
_Counts are derived from the AI use-case inventory; each class must link to a signed risk classification rationale._

| Risk class | Systems | As provider | As deployer | Classification signed off | Open gaps |
|---|---|---|---|---|---|
| Prohibited practice (Art. 5) | {{portfolio.prohibited.count}} | {{portfolio.prohibited.provider}} | {{portfolio.prohibited.deployer}} | {{portfolio.prohibited.signed}} | {{portfolio.prohibited.gaps}} |
| High-risk (Art. 6) | {{portfolio.high.count}} | {{portfolio.high.provider}} | {{portfolio.high.deployer}} | {{portfolio.high.signed}} | {{portfolio.high.gaps}} |
| Transparency obligations (Art. 50) | {{portfolio.transparency.count}} | {{portfolio.transparency.provider}} | {{portfolio.transparency.deployer}} | {{portfolio.transparency.signed}} | {{portfolio.transparency.gaps}} |
| General-purpose AI model (Art. 51 ff.) | {{portfolio.gpai.count}} | {{portfolio.gpai.provider}} | {{portfolio.gpai.deployer}} | {{portfolio.gpai.signed}} | {{portfolio.gpai.gaps}} |
| Minimal / no specific obligations | {{portfolio.minimal.count}} | {{portfolio.minimal.provider}} | {{portfolio.minimal.deployer}} | {{portfolio.minimal.signed}} | {{portfolio.minimal.gaps}} |
| Not yet classified | {{portfolio.unclassified.count}} | – | – | – | – |

## 4. Sanction exposure
<!-- basis: Reg. (EU) 2024/1689 Art. 99; Reg. (EU) 2016/679 Art. 83 | fill: kb | evidence: required -->
_Maximum fine levels are read from the knowledge base (never hardcoded). Exposure is a theoretical ceiling, not a forecast; turnover is user-declared and must cite the financial statements used._

Reference turnover: {{exposure.turnover_amount}} ({{exposure.turnover_year}}, source: {{exposure.turnover_cite}})

| Regime | Infringement tier | Maximum per knowledge base | Open findings in this tier | Theoretical ceiling for the organisation | Source |
|---|---|---|---|---|---|
| AI Act Art. 99 | Prohibited practices (Art. 5) | {{kb.eu_ai_act.penalties.prohibited_practices}} | {{exposure.aiact.prohibited.findings}} | {{exposure.aiact.prohibited.ceiling}} | {{kb.eu_ai_act.penalties.cite}} |
| AI Act Art. 99 | Operator and other listed obligations | {{kb.eu_ai_act.penalties.operator_obligations}} | {{exposure.aiact.operator.findings}} | {{exposure.aiact.operator.ceiling}} | {{kb.eu_ai_act.penalties.cite}} |
| AI Act Art. 99 | Incorrect, incomplete or misleading information to authorities | {{kb.eu_ai_act.penalties.misleading_information}} | {{exposure.aiact.info.findings}} | {{exposure.aiact.info.ceiling}} | {{kb.eu_ai_act.penalties.cite}} |
| GDPR Art. 83 | Lower tier | {{kb.gdpr.penalties.lower_tier}} | {{exposure.gdpr.lower.findings}} | {{exposure.gdpr.lower.ceiling}} | {{kb.gdpr.penalties.cite}} |
| GDPR Art. 83 | Higher tier | {{kb.gdpr.penalties.higher_tier}} | {{exposure.gdpr.higher.findings}} | {{exposure.gdpr.higher.ceiling}} | {{kb.gdpr.penalties.cite}} |

SME / start-up regime applicable: {{exposure.sme_regime}} ({{kb.eu_ai_act.penalties.sme_rule}})

## 5. Key performance indicators
<!-- basis: ISO/IEC 42001 Clause 9.1; NIST AI RMF GOVERN 1.5 | fill: computed | evidence: required -->
_KPIs are calculated by the app from workspace records; the formula and data snapshot of each KPI are stored in the audit log._

| KPI | Current | Previous | Target | Trend | Calculation reference |
|---|---|---|---|---|---|
| AI systems inventoried and classified (%) | {{kpi.classified.current}} | {{kpi.classified.previous}} | {{kpi.classified.target}} | {{kpi.classified.trend}} | {{kpi.classified.calc_ref}} |
| High-risk systems with complete technical documentation (%) | {{kpi.techdoc.current}} | {{kpi.techdoc.previous}} | {{kpi.techdoc.target}} | {{kpi.techdoc.trend}} | {{kpi.techdoc.calc_ref}} |
| FRIA / DPIA completed where required (%) | {{kpi.fria.current}} | {{kpi.fria.previous}} | {{kpi.fria.target}} | {{kpi.fria.trend}} | {{kpi.fria.calc_ref}} |
| Staff covered by AI literacy measures (%) | {{kpi.literacy.current}} | {{kpi.literacy.previous}} | {{kpi.literacy.target}} | {{kpi.literacy.trend}} | {{kpi.literacy.calc_ref}} |
| Incidents / serious incidents in period | {{kpi.incidents.current}} | {{kpi.incidents.previous}} | {{kpi.incidents.target}} | {{kpi.incidents.trend}} | {{kpi.incidents.calc_ref}} |
| Overdue remediation actions | {{kpi.overdue.current}} | {{kpi.overdue.previous}} | {{kpi.overdue.target}} | {{kpi.overdue.trend}} | {{kpi.overdue.calc_ref}} |
| Evidence items with verified source and hash (%) | {{kpi.traceability.current}} | {{kpi.traceability.previous}} | {{kpi.traceability.target}} | {{kpi.traceability.trend}} | {{kpi.traceability.calc_ref}} |

## 6. Top risks
<!-- basis: ISO/IEC 42001 Clause 6.1.2 and 6.1.3; Reg. (EU) 2024/1689 Art. 9 (high-risk systems) | fill: rag | evidence: required -->
_List at most ten risks from the validated risk register, ranked by residual score. Each row must cite the register entry._

| # | Risk | AI system | Framework reference | Inherent | Residual | Owner | Treatment and due date | Source |
|---|---|---|---|---|---|---|---|---|
| {{top_risks[i].rank}} | {{top_risks[i].description}} | {{top_risks[i].ai_system}} | {{top_risks[i].framework_ref}} | {{top_risks[i].inherent}} | {{top_risks[i].residual}} | {{top_risks[i].owner}} | {{top_risks[i].treatment}} | {{top_risks[i].cite}} |

## 7. Budget and roadmap
<!-- basis: ISO/IEC 42001 Clause 7.1 and Clause 6.2 | fill: user | evidence: optional -->
_Budget figures are user-declared; milestones should be aligned to the regulatory dates held in the knowledge base._

| Item | Approved budget | Spent to date | Forecast | Variance | Comment |
|---|---|---|---|---|---|
| {{budget[i].item}} | {{budget[i].approved}} | {{budget[i].spent}} | {{budget[i].forecast}} | {{budget[i].variance}} | {{budget[i].comment}} |

| Milestone | Regulatory driver | Regulatory date (knowledge base) | Planned date | Owner | Status |
|---|---|---|---|---|---|
| {{roadmap[i].milestone}} | {{roadmap[i].driver}} | {{roadmap[i].kb_date}} | {{roadmap[i].planned_date}} | {{roadmap[i].owner}} | {{roadmap[i].status}} |

## 8. Decisions requested
<!-- basis: ISO/IEC 42001 Clause 5.1 and Clause 9.3 (management review outputs) | fill: user | evidence: optional -->
_State each decision so that it can be minuted: what is asked, why, cost, and the consequence of not deciding._

| # | Decision requested | Rationale | Cost / resources | Consequence of no decision | Board resolution |
|---|---|---|---|---|---|
| {{decisions[i].n}} | {{decisions[i].request}} | {{decisions[i].rationale}} | {{decisions[i].cost}} | {{decisions[i].consequence}} | {{decisions[i].resolution}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2016/679 Art. 5(2) | fill: computed | evidence: required -->
_Every figure and claim above must resolve to a row here. Values without a document source are labelled "user-declared" with the declaring person and date._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 Clause 5.1; internal HITL policy | fill: user | evidence: required -->
_The report may not be exported as final until the human reviewer has recorded a decision._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by ({{doc.approver_role}}) | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
