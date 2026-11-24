---
id: tpl-ai-governance-raci-matrix
title_en: AI Governance RACI Matrix
title_it: Matrice RACI della governance dell'IA
category: executive
legal_basis: ["ISO/IEC 42001:2023 Clause 5.3", "ISO/IEC 42001:2023 Annex A.3.2", "Reg. (EU) 2024/1689 Art. 17", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2016/679 Art. 24", "Reg. (EU) 2016/679 Art. 37-39"]
related_frameworks: ["ISO/IEC 42001 A.3.2", "ISO/IEC 42001 A.3.3", "ISO/IEC 42001 A.10.2", "NIST AI RMF GOVERN 2.1", "NIST AI RMF GOVERN 2.3", "GDPR Art. 39"]
output_formats: [xlsx, docx, pdf, md]
hitl_approval: required
approver_role: Top management / AI Governance Committee chair
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{raci.scope}} (organisation-wide or system-specific: {{ai_system.name}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

## 1. Purpose, scope and legend
<!-- basis: ISO/IEC 42001 Clause 5.3; A.3.2 | fill: user | evidence: optional -->
_State whether the matrix is organisation-wide or for one AI system, and the organisation's AI Act role(s), since provider and deployer activities differ._

Scope: {{raci.scope_description}} — AI Act role(s) of the organisation: {{raci.aiact_roles}}

| Code | Meaning | Rule |
|---|---|---|
| R | Responsible – performs the activity | At least one R per activity |
| A | Accountable – answers for the result and approves | Exactly one A per activity |
| C | Consulted – gives input before the activity or decision | Two-way communication |
| I | Informed – notified of the result | One-way communication |

## 2. Roles and named holders
<!-- basis: ISO/IEC 42001 Clause 5.3; Reg. (EU) 2016/679 Art. 37-39 (DPO); Reg. (EU) 2024/1689 Art. 26 (persons assigned human oversight) | fill: rag | evidence: required -->
_Extract holders from organisation charts, appointment letters and job descriptions, citing each. A role without a named holder is a finding._

| Role code | Role | Named holder | Deputy | Appointment evidence | Source |
|---|---|---|---|---|---|
| BRD | Board / top management | {{raci.roles.brd.holder}} | {{raci.roles.brd.deputy}} | {{raci.roles.brd.evidence}} | {{raci.roles.brd.cite}} |
| AIG | AI governance lead / committee | {{raci.roles.aig.holder}} | {{raci.roles.aig.deputy}} | {{raci.roles.aig.evidence}} | {{raci.roles.aig.cite}} |
| OWN | AI system owner (business) | {{raci.roles.own.holder}} | {{raci.roles.own.deputy}} | {{raci.roles.own.evidence}} | {{raci.roles.own.cite}} |
| DEV | AI / ML engineering | {{raci.roles.dev.holder}} | {{raci.roles.dev.deputy}} | {{raci.roles.dev.evidence}} | {{raci.roles.dev.cite}} |
| DPO | Data Protection Officer | {{raci.roles.dpo.holder}} | {{raci.roles.dpo.deputy}} | {{raci.roles.dpo.evidence}} | {{raci.roles.dpo.cite}} |
| SEC | Information security (CISO) | {{raci.roles.sec.holder}} | {{raci.roles.sec.deputy}} | {{raci.roles.sec.evidence}} | {{raci.roles.sec.cite}} |
| LEG | Legal / compliance | {{raci.roles.leg.holder}} | {{raci.roles.leg.deputy}} | {{raci.roles.leg.evidence}} | {{raci.roles.leg.cite}} |
| RSK | Risk management | {{raci.roles.rsk.holder}} | {{raci.roles.rsk.deputy}} | {{raci.roles.rsk.evidence}} | {{raci.roles.rsk.cite}} |
| HOV | Human oversight operator | {{raci.roles.hov.holder}} | {{raci.roles.hov.deputy}} | {{raci.roles.hov.evidence}} | {{raci.roles.hov.cite}} |
| PRC | Procurement / vendor management | {{raci.roles.prc.holder}} | {{raci.roles.prc.deputy}} | {{raci.roles.prc.evidence}} | {{raci.roles.prc.cite}} |
| HR | Human resources / training | {{raci.roles.hr.holder}} | {{raci.roles.hr.deputy}} | {{raci.roles.hr.evidence}} | {{raci.roles.hr.cite}} |
| AUD | Internal audit (independent) | {{raci.roles.aud.holder}} | {{raci.roles.aud.deputy}} | {{raci.roles.aud.evidence}} | {{raci.roles.aud.cite}} |

## 3. RACI matrix
<!-- basis: ISO/IEC 42001 Clause 5.3 and A.3.2; Reg. (EU) 2024/1689 Art. 17 (accountability framework within the provider's quality management system) and Art. 26 | fill: user | evidence: optional -->
_Assign one code per cell (or leave blank). The activity list and legal references are proposed from the knowledge base; delete activities that do not apply to the organisation's AI Act role. Internal audit should not hold R or A on activities it audits._

| # | Activity | Reference | BRD | AIG | OWN | DEV | DPO | SEC | LEG | RSK | HOV | PRC | HR | AUD |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Approve AI policy and objectives | ISO/IEC 42001 5.2, 6.2 | {{raci.m.a1.brd}} | {{raci.m.a1.aig}} | {{raci.m.a1.own}} | {{raci.m.a1.dev}} | {{raci.m.a1.dpo}} | {{raci.m.a1.sec}} | {{raci.m.a1.leg}} | {{raci.m.a1.rsk}} | {{raci.m.a1.hov}} | {{raci.m.a1.prc}} | {{raci.m.a1.hr}} | {{raci.m.a1.aud}} |
| 2 | Maintain the AI system inventory | NIST GOVERN 1.6 | {{raci.m.a2.brd}} | {{raci.m.a2.aig}} | {{raci.m.a2.own}} | {{raci.m.a2.dev}} | {{raci.m.a2.dpo}} | {{raci.m.a2.sec}} | {{raci.m.a2.leg}} | {{raci.m.a2.rsk}} | {{raci.m.a2.hov}} | {{raci.m.a2.prc}} | {{raci.m.a2.hr}} | {{raci.m.a2.aud}} |
| 3 | Risk classification and sign-off | AI Act Art. 5, 6, 50 | {{raci.m.a3.brd}} | {{raci.m.a3.aig}} | {{raci.m.a3.own}} | {{raci.m.a3.dev}} | {{raci.m.a3.dpo}} | {{raci.m.a3.sec}} | {{raci.m.a3.leg}} | {{raci.m.a3.rsk}} | {{raci.m.a3.hov}} | {{raci.m.a3.prc}} | {{raci.m.a3.hr}} | {{raci.m.a3.aud}} |
| 4 | AI risk assessment and treatment | AI Act Art. 9; ISO/IEC 42001 6.1.2–6.1.3 | {{raci.m.a4.brd}} | {{raci.m.a4.aig}} | {{raci.m.a4.own}} | {{raci.m.a4.dev}} | {{raci.m.a4.dpo}} | {{raci.m.a4.sec}} | {{raci.m.a4.leg}} | {{raci.m.a4.rsk}} | {{raci.m.a4.hov}} | {{raci.m.a4.prc}} | {{raci.m.a4.hr}} | {{raci.m.a4.aud}} |
| 5 | FRIA / AI system impact assessment | AI Act Art. 27; ISO/IEC 42001 6.1.4 | {{raci.m.a5.brd}} | {{raci.m.a5.aig}} | {{raci.m.a5.own}} | {{raci.m.a5.dev}} | {{raci.m.a5.dpo}} | {{raci.m.a5.sec}} | {{raci.m.a5.leg}} | {{raci.m.a5.rsk}} | {{raci.m.a5.hov}} | {{raci.m.a5.prc}} | {{raci.m.a5.hr}} | {{raci.m.a5.aud}} |
| 6 | DPIA | GDPR Art. 35 | {{raci.m.a6.brd}} | {{raci.m.a6.aig}} | {{raci.m.a6.own}} | {{raci.m.a6.dev}} | {{raci.m.a6.dpo}} | {{raci.m.a6.sec}} | {{raci.m.a6.leg}} | {{raci.m.a6.rsk}} | {{raci.m.a6.hov}} | {{raci.m.a6.prc}} | {{raci.m.a6.hr}} | {{raci.m.a6.aud}} |
| 7 | Data governance for training, validation and testing data | AI Act Art. 10 | {{raci.m.a7.brd}} | {{raci.m.a7.aig}} | {{raci.m.a7.own}} | {{raci.m.a7.dev}} | {{raci.m.a7.dpo}} | {{raci.m.a7.sec}} | {{raci.m.a7.leg}} | {{raci.m.a7.rsk}} | {{raci.m.a7.hov}} | {{raci.m.a7.prc}} | {{raci.m.a7.hr}} | {{raci.m.a7.aud}} |
| 8 | Technical documentation and record-keeping | AI Act Art. 11, 12, 18 | {{raci.m.a8.brd}} | {{raci.m.a8.aig}} | {{raci.m.a8.own}} | {{raci.m.a8.dev}} | {{raci.m.a8.dpo}} | {{raci.m.a8.sec}} | {{raci.m.a8.leg}} | {{raci.m.a8.rsk}} | {{raci.m.a8.hov}} | {{raci.m.a8.prc}} | {{raci.m.a8.hr}} | {{raci.m.a8.aud}} |
| 9 | Human oversight in operation | AI Act Art. 14, 26 | {{raci.m.a9.brd}} | {{raci.m.a9.aig}} | {{raci.m.a9.own}} | {{raci.m.a9.dev}} | {{raci.m.a9.dpo}} | {{raci.m.a9.sec}} | {{raci.m.a9.leg}} | {{raci.m.a9.rsk}} | {{raci.m.a9.hov}} | {{raci.m.a9.prc}} | {{raci.m.a9.hr}} | {{raci.m.a9.aud}} |
| 10 | Accuracy, robustness and cybersecurity | AI Act Art. 15 | {{raci.m.a10.brd}} | {{raci.m.a10.aig}} | {{raci.m.a10.own}} | {{raci.m.a10.dev}} | {{raci.m.a10.dpo}} | {{raci.m.a10.sec}} | {{raci.m.a10.leg}} | {{raci.m.a10.rsk}} | {{raci.m.a10.hov}} | {{raci.m.a10.prc}} | {{raci.m.a10.hr}} | {{raci.m.a10.aud}} |
| 11 | Conformity assessment, EU declaration, registration | AI Act Art. 43, 47, 49 | {{raci.m.a11.brd}} | {{raci.m.a11.aig}} | {{raci.m.a11.own}} | {{raci.m.a11.dev}} | {{raci.m.a11.dpo}} | {{raci.m.a11.sec}} | {{raci.m.a11.leg}} | {{raci.m.a11.rsk}} | {{raci.m.a11.hov}} | {{raci.m.a11.prc}} | {{raci.m.a11.hr}} | {{raci.m.a11.aud}} |
| 12 | Transparency notices | AI Act Art. 50; GDPR Art. 13–14 | {{raci.m.a12.brd}} | {{raci.m.a12.aig}} | {{raci.m.a12.own}} | {{raci.m.a12.dev}} | {{raci.m.a12.dpo}} | {{raci.m.a12.sec}} | {{raci.m.a12.leg}} | {{raci.m.a12.rsk}} | {{raci.m.a12.hov}} | {{raci.m.a12.prc}} | {{raci.m.a12.hr}} | {{raci.m.a12.aud}} |
| 13 | Supplier due diligence and contracts | AI Act Art. 25; ISO/IEC 42001 A.10 | {{raci.m.a13.brd}} | {{raci.m.a13.aig}} | {{raci.m.a13.own}} | {{raci.m.a13.dev}} | {{raci.m.a13.dpo}} | {{raci.m.a13.sec}} | {{raci.m.a13.leg}} | {{raci.m.a13.rsk}} | {{raci.m.a13.hov}} | {{raci.m.a13.prc}} | {{raci.m.a13.hr}} | {{raci.m.a13.aud}} |
| 14 | AI literacy and training | AI Act Art. 4; ISO/IEC 42001 7.2 | {{raci.m.a14.brd}} | {{raci.m.a14.aig}} | {{raci.m.a14.own}} | {{raci.m.a14.dev}} | {{raci.m.a14.dpo}} | {{raci.m.a14.sec}} | {{raci.m.a14.leg}} | {{raci.m.a14.rsk}} | {{raci.m.a14.hov}} | {{raci.m.a14.prc}} | {{raci.m.a14.hr}} | {{raci.m.a14.aud}} |
| 15 | Post-market monitoring | AI Act Art. 72 | {{raci.m.a15.brd}} | {{raci.m.a15.aig}} | {{raci.m.a15.own}} | {{raci.m.a15.dev}} | {{raci.m.a15.dpo}} | {{raci.m.a15.sec}} | {{raci.m.a15.leg}} | {{raci.m.a15.rsk}} | {{raci.m.a15.hov}} | {{raci.m.a15.prc}} | {{raci.m.a15.hr}} | {{raci.m.a15.aud}} |
| 16 | Serious incident and data breach reporting | AI Act Art. 73; GDPR Art. 33 | {{raci.m.a16.brd}} | {{raci.m.a16.aig}} | {{raci.m.a16.own}} | {{raci.m.a16.dev}} | {{raci.m.a16.dpo}} | {{raci.m.a16.sec}} | {{raci.m.a16.leg}} | {{raci.m.a16.rsk}} | {{raci.m.a16.hov}} | {{raci.m.a16.prc}} | {{raci.m.a16.hr}} | {{raci.m.a16.aud}} |
| 17 | Internal audit and management review | ISO/IEC 42001 9.2, 9.3 | {{raci.m.a17.brd}} | {{raci.m.a17.aig}} | {{raci.m.a17.own}} | {{raci.m.a17.dev}} | {{raci.m.a17.dpo}} | {{raci.m.a17.sec}} | {{raci.m.a17.leg}} | {{raci.m.a17.rsk}} | {{raci.m.a17.hov}} | {{raci.m.a17.prc}} | {{raci.m.a17.hr}} | {{raci.m.a17.aud}} |
| 18 | Decommissioning of an AI system | ISO/IEC 42001 A.6 | {{raci.m.a18.brd}} | {{raci.m.a18.aig}} | {{raci.m.a18.own}} | {{raci.m.a18.dev}} | {{raci.m.a18.dpo}} | {{raci.m.a18.sec}} | {{raci.m.a18.leg}} | {{raci.m.a18.rsk}} | {{raci.m.a18.hov}} | {{raci.m.a18.prc}} | {{raci.m.a18.hr}} | {{raci.m.a18.aud}} |

## 4. Consistency checks
<!-- basis: ISO/IEC 42001 Clause 5.3 | fill: computed | evidence: required -->
_Run automatically on every save; the matrix cannot be approved while a blocking check fails._

| Check | Result | Details |
|---|---|---|
| Exactly one A per activity | {{raci.checks.single_a.result}} | {{raci.checks.single_a.details}} |
| At least one R per activity | {{raci.checks.has_r.result}} | {{raci.checks.has_r.details}} |
| Every role has a named holder | {{raci.checks.holders.result}} | {{raci.checks.holders.details}} |
| Segregation: AUD holds no R/A on audited activities | {{raci.checks.segregation.result}} | {{raci.checks.segregation.details}} |
| DPO independence: DPO not A for decisions on purposes and means of processing | {{raci.checks.dpo.result}} | {{raci.checks.dpo.details}} |

## 5. Escalation and third parties
<!-- basis: ISO/IEC 42001 A.3.3 and A.10.2 | fill: user | evidence: optional -->
_Describe the escalation path for unresolved disagreements and which responsibilities sit with suppliers or customers by contract._

Escalation path: {{raci.escalation}}

| Third party | Responsibility allocated | Contract clause | Source |
|---|---|---|---|
| {{raci.third_parties[i].name}} | {{raci.third_parties[i].responsibility}} | {{raci.third_parties[i].clause}} | {{raci.third_parties[i].cite}} |

## Sources and evidence
<!-- basis: internal traceability requirement; ISO/IEC 42001 Clause 7.5 | fill: computed | evidence: required -->
_Each named holder and third-party allocation must resolve to a source row; user-declared assignments are labelled as such._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 Clause 5.3 (top management assigns responsibilities and authorities) | fill: user | evidence: required -->
_Top management approval is what makes the assignments effective; holders should acknowledge their role._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
