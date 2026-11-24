---
id: tpl-genai-acceptable-use-policy
title_en: Generative AI Acceptable Use Policy
title_it: Policy di uso accettabile dell'IA generativa
category: executive
legal_basis: ["Reg. (EU) 2024/1689 Art. 4", "Reg. (EU) 2024/1689 Art. 5", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 50", "Reg. (EU) 2016/679 Art. 5", "Reg. (EU) 2016/679 Art. 6", "Reg. (EU) 2016/679 Art. 9", "Reg. (EU) 2016/679 Art. 22", "Reg. (EU) 2016/679 Art. 28", "Reg. (EU) 2016/679 Art. 32"]
related_frameworks: ["ISO/IEC 42001 A.2.2", "ISO/IEC 42001 A.9.2", "ISO/IEC 42001 A.9.3", "ISO/IEC 42001 A.9.4", "ISO/IEC 42001 A.10.3", "NIST AI RMF GOVERN 1.2", "NIST AI RMF GOVERN 6.1", "NIST AI 600-1 (Generative AI Profile)"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: AI Governance Lead with DPO and CISO consultation
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | All generative AI tools listed in section 3 |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

## 1. Purpose and scope
<!-- basis: ISO/IEC 42001 A.2.2 and A.9.2 | fill: user | evidence: optional -->
_Say who must follow the policy (employees, contractors, agents acting on the organisation's behalf) and which uses it covers, including personal accounts and devices used for work._

{{aup.purpose}}

Applies to: {{aup.scope.persons}} — Covers: {{aup.scope.uses}}

## 2. Definitions
<!-- basis: Reg. (EU) 2024/1689 Art. 3 | fill: kb | evidence: required -->
_Definitions are taken verbatim or summarised from the knowledge base with article reference; do not rewrite legal definitions by hand._

| Term | Definition | Source |
|---|---|---|
| AI system | {{kb.eu_ai_act.definitions.ai_system}} | Reg. (EU) 2024/1689 Art. 3 |
| General-purpose AI model | {{kb.eu_ai_act.definitions.gpai_model}} | Reg. (EU) 2024/1689 Art. 3 |
| Deep fake | {{kb.eu_ai_act.definitions.deep_fake}} | Reg. (EU) 2024/1689 Art. 3 |
| Personal data | {{kb.gdpr.definitions.personal_data}} | Reg. (EU) 2016/679 Art. 4 |
| Approved tool | A generative AI tool listed in section 3 with status "approved" | internal |

## 3. Approved tools and accounts
<!-- basis: ISO/IEC 42001 A.9.4; A.10.3; Reg. (EU) 2016/679 Art. 28 | fill: rag | evidence: required -->
_Populate from the AI inventory and supplier contracts. For each tool cite the contract or DPA that supports the data-handling statement._

| Tool / model | Supplier | Approved use | Highest data class allowed | Training on our data | DPA / contract reference | Status | Source |
|---|---|---|---|---|---|---|---|
| {{aup.tools[i].name}} | {{aup.tools[i].supplier}} | {{aup.tools[i].approved_use}} | {{aup.tools[i].max_data_class}} | {{aup.tools[i].training_on_data}} | {{aup.tools[i].contract_ref}} | {{aup.tools[i].status}} | {{aup.tools[i].cite}} |

Tools not listed are not approved. Request procedure for new tools: {{aup.tool_request_process}}

## 4. Permitted uses
<!-- basis: ISO/IEC 42001 A.9.4 (use according to intended use) | fill: user | evidence: optional -->
_List concrete permitted use cases per function so users can recognise their own work._

{{aup.permitted_uses}}

## 5. Prohibited uses
<!-- basis: Reg. (EU) 2024/1689 Art. 5; Reg. (EU) 2016/679 Art. 9 and Art. 22 | fill: kb | evidence: required -->
_The first row is generated from the knowledge base; the remaining rows are organisational rules to adapt._

| # | Prohibited use | Basis |
|---|---|---|
| 1 | Any use amounting to a prohibited AI practice: {{kb.eu_ai_act.art5.summary}} | Reg. (EU) 2024/1689 Art. 5 |
| 2 | Decisions producing legal or similarly significant effects on individuals based solely on generative AI output | Reg. (EU) 2016/679 Art. 22 |
| 3 | Entering special categories of personal data into any tool not approved for that data class | Reg. (EU) 2016/679 Art. 9 |
| 4 | Using a generative AI tool for a purpose that would make it a high-risk AI system without prior classification and approval | Reg. (EU) 2024/1689 Art. 6; internal |
| 5 | Using non-approved tools or personal accounts for work content | internal |
| 6 | {{aup.prohibited[i].use}} | {{aup.prohibited[i].basis}} |

## 6. Data input rules
<!-- basis: Reg. (EU) 2016/679 Art. 5, Art. 6, Art. 32 | fill: user | evidence: optional -->
_Map the organisation's own data classification scheme to what may be entered into prompts, files and connectors._

| Data class | Examples | May be entered into approved tools? | Conditions |
|---|---|---|---|
| Public | {{aup.data.public.examples}} | {{aup.data.public.allowed}} | {{aup.data.public.conditions}} |
| Internal | {{aup.data.internal.examples}} | {{aup.data.internal.allowed}} | {{aup.data.internal.conditions}} |
| Confidential / trade secrets | {{aup.data.confidential.examples}} | {{aup.data.confidential.allowed}} | {{aup.data.confidential.conditions}} |
| Personal data | {{aup.data.personal.examples}} | {{aup.data.personal.allowed}} | {{aup.data.personal.conditions}} |
| Special categories / criminal data | {{aup.data.special.examples}} | {{aup.data.special.allowed}} | {{aup.data.special.conditions}} |
| Credentials and secrets | passwords, API keys, tokens | Never | – |

## 7. Output review and accountability
<!-- basis: ISO/IEC 42001 A.9.2; NIST AI 600-1 | fill: user | evidence: optional -->
_The user remains accountable for any output used. Define the minimum human review before output leaves the organisation or informs a decision._

| Output type | Required review before use | Reviewer |
|---|---|---|
| Factual statements, figures, legal or regulatory content | Verify against a primary source; record the source | {{aup.review.factual_reviewer}} |
| Software code | {{aup.review.code_rule}} | {{aup.review.code_reviewer}} |
| Content sent to customers or published | {{aup.review.external_rule}} | {{aup.review.external_reviewer}} |
| Content about identifiable individuals | {{aup.review.individuals_rule}} | {{aup.review.individuals_reviewer}} |

## 8. Transparency and disclosure
<!-- basis: Reg. (EU) 2024/1689 Art. 50 | fill: kb | evidence: required -->
_Summarise when AI-generated or AI-manipulated content must be disclosed. Obligations and their application date are read from the knowledge base; notice texts are in the Transparency Notices template._

Obligations in force per knowledge base: {{kb.eu_ai_act.art50.summary}} (applicable from {{kb.eu_ai_act.timeline.art50}})

Internal rule on labelling AI-assisted work products: {{aup.disclosure.internal_rule}}

## 9. Intellectual property and confidentiality
<!-- basis: internal policy; contractual terms of the approved tools | fill: user | evidence: optional -->
_Cover third-party copyright in inputs, ownership and licensing of outputs under each supplier's terms, and customer confidentiality clauses._

{{aup.ip_confidentiality}}

## 10. Security
<!-- basis: Reg. (EU) 2016/679 Art. 32; ISO/IEC 42001 A.9.2 | fill: user | evidence: optional -->
_State rules for authentication, plug-ins/connectors/agents, handling of untrusted content (prompt injection) and retention of chat history._

{{aup.security_rules}}

## 11. Training, monitoring and incident reporting
<!-- basis: Reg. (EU) 2024/1689 Art. 4; ISO/IEC 42001 Clause 7.3 and A.3.3 | fill: user | evidence: optional -->
_Describe the mandatory training before access, any monitoring of use (with its legal basis and workforce information), and how to report misuse, data leakage or harmful output._

| Topic | Rule |
|---|---|
| Training required before access | {{aup.training.requirement}} |
| Monitoring of use and its legal basis | {{aup.monitoring.description}} |
| Incident and concern reporting channel | {{aup.incident.channel}} |
| Reporting time expectation | {{aup.incident.timeframe}} |

## 12. Exceptions, enforcement and review
<!-- basis: ISO/IEC 42001 A.2.4; Clause 10.2 | fill: user | evidence: optional -->
_Define who can grant exceptions, consequences of violations and the review interval._

| Exception approver | Consequences of violation | Review interval | Policy owner |
|---|---|---|---|
| {{aup.exceptions.approver}} | {{aup.enforcement.consequences}} | {{aup.review.interval}} | {{aup.owner}} |

## 13. User acknowledgement
<!-- basis: ISO/IEC 42001 Clause 7.3 | fill: user | evidence: required -->
_Acknowledgements are collected per user and stored as evidence of awareness._

I have read and understood this policy and agree to comply with it.

| Name | Function | Date | Signature / acknowledgement ID |
|---|---|---|---|
| {{aup.ack[i].name}} | {{aup.ack[i].function}} | {{aup.ack[i].date}} | {{aup.ack[i].id}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Every tool, contract and legal statement above must resolve to a row here; user-declared content is labelled as such._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 A.2.2; internal HITL policy | fill: user | evidence: required -->
_Approval requires recorded consultation of the DPO and the CISO._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Consulted: DPO | {{signoff.dpo.name}} | {{signoff.dpo.opinion}} | {{signoff.dpo.date}} | {{signoff.dpo.signature}} |
| Consulted: CISO | {{signoff.ciso.name}} | {{signoff.ciso.opinion}} | {{signoff.ciso.date}} | {{signoff.ciso.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
