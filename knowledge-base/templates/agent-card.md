---
id: tpl-agent-card
title_en: AI Agent Card
title_it: Scheda dell'agente di IA
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 3(1)", "Reg. (EU) 2024/1689 Art. 6", "Reg. (EU) 2024/1689 Art. 12", "Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Art. 15", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 50", "Reg. (EU) 2016/679 Art. 22", "Reg. (EU) 2016/679 Art. 32"]
related_frameworks: ["OWASP Top 10 for Agentic Applications (ASI01-ASI10)", "ISO/IEC 42001 A.6.2.6", "ISO/IEC 42001 A.6.2.8", "ISO/IEC 42001 A.9.2", "ISO/IEC 42001 A.10.3", "NIST AI RMF MAP 3.5", "NIST AI RMF MANAGE 2.4", "NIST AI RMF GOVERN 3.2", "GDPR Art. 25"]
output_formats: [docx, pdf, md, xlsx]
hitl_approval: required
approver_role: AI system owner and CISO, countersigned by AI Governance Lead
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{agent.name}} (agent ID {{agent.id}}; inventory ID {{ai_system.id}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_The AI Act has no agent-specific chapter: Art. 12, 14 and 15 bind only where the agent is, or is part of, a high-risk AI system. For other agents this card applies the same structure as good practice; the classification in section 1 determines which applies._

## 1. Identity, purpose and classification
<!-- basis: Reg. (EU) 2024/1689 Art. 3(1) and Art. 6; link to inventory record and risk classification rationale | fill: rag | evidence: required -->
_Describe what the agent is for and, equally, what it must not do. Risk class is copied from the signed classification, not assessed here._

| Field | Value | Source |
|---|---|---|
| Agent name and version | {{agent.name}} {{agent.version}} | {{agent.version_cite}} |
| Owner (business) / operator (technical) | {{agent.owner}} / {{agent.operator}} | user-declared |
| Purpose and tasks | {{agent.purpose}} | {{agent.purpose_cite}} |
| Out-of-scope tasks (explicit) | {{agent.out_of_scope}} | {{agent.out_of_scope_cite}} |
| Acts on behalf of (user, team, organisation) | {{agent.principal}} | {{agent.principal_cite}} |
| Environment (production, sandbox) and channels | {{agent.environment}} | {{agent.environment_cite}} |
| AI Act risk class / classification document | {{classification.final_class}} / {{classification.doc_ref}} | computed |

## 2. Base model and configuration
<!-- basis: Reg. (EU) 2024/1689 Art. 25 (value chain) and Art. 53 (information from GPAI model providers to downstream providers); ISO/IEC 42001 A.10.3 | fill: rag | evidence: required -->
_Record exact model identifiers and the versioned system prompt; a change to either is a change to the agent._

| Field | Value | Source |
|---|---|---|
| Base model(s): provider, model ID, version | {{agent.model.id}} | {{agent.model.cite}} |
| Hosting (API, cloud region, on-premises) | {{agent.model.hosting}} | {{agent.model.hosting_cite}} |
| Model documentation received (model card, usage policy) | {{agent.model.documentation}} | {{agent.model.documentation_cite}} |
| System prompt / policy version and hash | {{agent.system_prompt.version}} / {{agent.system_prompt.sha256}} | computed |
| Orchestration framework and version | {{agent.framework}} | {{agent.framework_cite}} |
| Fine-tuning or adapters | {{agent.finetuning}} | {{agent.finetuning_cite}} |

## 3. Authorised tools and APIs
<!-- basis: Reg. (EU) 2024/1689 Art. 15 (high-risk systems); Reg. (EU) 2016/679 Art. 32; least-privilege principle | fill: rag | evidence: required -->
_Allow-list only: a tool not listed is not authorised. Extract permissions from the actual configuration (manifest, IAM policy), not from intentions._

| Tool / API | Purpose | Permission (read / write / execute) | Credential and scope | Side effects (irreversible?) | Approval needed per call? | Source |
|---|---|---|---|---|---|---|
| {{agent.tools[i].name}} | {{agent.tools[i].purpose}} | {{agent.tools[i].permission}} | {{agent.tools[i].credential_scope}} | {{agent.tools[i].side_effects}} | {{agent.tools[i].approval}} | {{agent.tools[i].cite}} |

Other agents it can call or be called by: {{agent.inter_agent_links}}

## 4. Data sources and memory
<!-- basis: Reg. (EU) 2016/679 Art. 5, Art. 25, Art. 32; Reg. (EU) 2024/1689 Art. 10 (high-risk systems) | fill: rag | evidence: required -->
_Distinguish trusted from untrusted content: anything the agent reads from outside (web, email, uploaded files) is a potential injection vector._

| Data source / knowledge base | Content | Personal data? | Trust level | Access control | Source |
|---|---|---|---|---|---|
| {{agent.data_sources[i].name}} | {{agent.data_sources[i].content}} | {{agent.data_sources[i].personal_data}} | {{agent.data_sources[i].trust_level}} | {{agent.data_sources[i].access_control}} | {{agent.data_sources[i].cite}} |

| Memory type | What is stored | Retention | Isolation (per user / tenant) | Who can inspect or delete |
|---|---|---|---|---|
| Session / context | {{agent.memory.session.content}} | {{agent.memory.session.retention}} | {{agent.memory.session.isolation}} | {{agent.memory.session.control}} |
| Persistent / long-term | {{agent.memory.persistent.content}} | {{agent.memory.persistent.retention}} | {{agent.memory.persistent.isolation}} | {{agent.memory.persistent.control}} |

## 5. Autonomy level and human oversight
<!-- basis: Reg. (EU) 2024/1689 Art. 14 and Art. 26 (high-risk systems); Reg. (EU) 2016/679 Art. 22; NIST AI RMF MAP 3.5 | fill: user | evidence: required -->
_Choose the autonomy level from the organisation's scale and list which actions always need human approval. Name the oversight person; "the team" is not a person._

| Field | Value |
|---|---|
| Autonomy level (scale: {{kb.agent.autonomy_scale}}) | {{agent.autonomy.level}} |
| Actions the agent may take without approval | {{agent.autonomy.unattended_actions}} |
| Actions requiring human approval before execution | {{agent.autonomy.approval_actions}} |
| Limits (spend, volume, rate, time window) | {{agent.autonomy.limits}} |
| Oversight person(s), competence and authority | {{agent.oversight.persons}} |
| How the overseer sees what the agent did and why | {{agent.oversight.observability}} |
| Decisions with legal or similarly significant effect on individuals? | {{agent.oversight.art22_assessment}} |

## 6. Guardrails
<!-- basis: Reg. (EU) 2024/1689 Art. 15 (high-risk systems); Reg. (EU) 2016/679 Art. 32 | fill: rag | evidence: required -->
_List controls actually implemented, with the test evidence showing they work._

| Guardrail | Type (input / output / action / identity) | Implementation | Test evidence | Source |
|---|---|---|---|---|
| {{agent.guardrails[i].name}} | {{agent.guardrails[i].type}} | {{agent.guardrails[i].implementation}} | {{agent.guardrails[i].test_evidence}} | {{agent.guardrails[i].cite}} |

## 7. Agentic risk assessment
<!-- basis: OWASP Top 10 for Agentic Applications (ASI01-ASI10) via knowledge base; Reg. (EU) 2024/1689 Art. 9 (high-risk systems) | fill: kb | evidence: required -->
_Risk identifiers and titles are loaded from the knowledge base ({{kb.owasp_asi}}, version {{kb.owasp_asi.version}}); assess every row, including typical themes such as goal hijack and prompt injection, tool misuse, privilege abuse, memory poisoning and scope drift. "Not applicable" needs a reason._

| ID | Risk (knowledge-base title) | Applicable? | Scenario for this agent | Likelihood | Impact | Mitigation (section 3–6 reference) | Residual risk | Source |
|---|---|---|---|---|---|---|---|---|
| ASI01 | {{kb.owasp_asi.ASI01.title}} | {{agent.risks.ASI01.applicable}} | {{agent.risks.ASI01.scenario}} | {{agent.risks.ASI01.likelihood}} | {{agent.risks.ASI01.impact}} | {{agent.risks.ASI01.mitigation}} | {{agent.risks.ASI01.residual}} | {{agent.risks.ASI01.cite}} |
| ASI02 | {{kb.owasp_asi.ASI02.title}} | {{agent.risks.ASI02.applicable}} | {{agent.risks.ASI02.scenario}} | {{agent.risks.ASI02.likelihood}} | {{agent.risks.ASI02.impact}} | {{agent.risks.ASI02.mitigation}} | {{agent.risks.ASI02.residual}} | {{agent.risks.ASI02.cite}} |
| ASI03 | {{kb.owasp_asi.ASI03.title}} | {{agent.risks.ASI03.applicable}} | {{agent.risks.ASI03.scenario}} | {{agent.risks.ASI03.likelihood}} | {{agent.risks.ASI03.impact}} | {{agent.risks.ASI03.mitigation}} | {{agent.risks.ASI03.residual}} | {{agent.risks.ASI03.cite}} |
| ASI04 | {{kb.owasp_asi.ASI04.title}} | {{agent.risks.ASI04.applicable}} | {{agent.risks.ASI04.scenario}} | {{agent.risks.ASI04.likelihood}} | {{agent.risks.ASI04.impact}} | {{agent.risks.ASI04.mitigation}} | {{agent.risks.ASI04.residual}} | {{agent.risks.ASI04.cite}} |
| ASI05 | {{kb.owasp_asi.ASI05.title}} | {{agent.risks.ASI05.applicable}} | {{agent.risks.ASI05.scenario}} | {{agent.risks.ASI05.likelihood}} | {{agent.risks.ASI05.impact}} | {{agent.risks.ASI05.mitigation}} | {{agent.risks.ASI05.residual}} | {{agent.risks.ASI05.cite}} |
| ASI06 | {{kb.owasp_asi.ASI06.title}} | {{agent.risks.ASI06.applicable}} | {{agent.risks.ASI06.scenario}} | {{agent.risks.ASI06.likelihood}} | {{agent.risks.ASI06.impact}} | {{agent.risks.ASI06.mitigation}} | {{agent.risks.ASI06.residual}} | {{agent.risks.ASI06.cite}} |
| ASI07 | {{kb.owasp_asi.ASI07.title}} | {{agent.risks.ASI07.applicable}} | {{agent.risks.ASI07.scenario}} | {{agent.risks.ASI07.likelihood}} | {{agent.risks.ASI07.impact}} | {{agent.risks.ASI07.mitigation}} | {{agent.risks.ASI07.residual}} | {{agent.risks.ASI07.cite}} |
| ASI08 | {{kb.owasp_asi.ASI08.title}} | {{agent.risks.ASI08.applicable}} | {{agent.risks.ASI08.scenario}} | {{agent.risks.ASI08.likelihood}} | {{agent.risks.ASI08.impact}} | {{agent.risks.ASI08.mitigation}} | {{agent.risks.ASI08.residual}} | {{agent.risks.ASI08.cite}} |
| ASI09 | {{kb.owasp_asi.ASI09.title}} | {{agent.risks.ASI09.applicable}} | {{agent.risks.ASI09.scenario}} | {{agent.risks.ASI09.likelihood}} | {{agent.risks.ASI09.impact}} | {{agent.risks.ASI09.mitigation}} | {{agent.risks.ASI09.residual}} | {{agent.risks.ASI09.cite}} |
| ASI10 | {{kb.owasp_asi.ASI10.title}} | {{agent.risks.ASI10.applicable}} | {{agent.risks.ASI10.scenario}} | {{agent.risks.ASI10.likelihood}} | {{agent.risks.ASI10.impact}} | {{agent.risks.ASI10.mitigation}} | {{agent.risks.ASI10.residual}} | {{agent.risks.ASI10.cite}} |

## 8. Kill switch and fallback
<!-- basis: Reg. (EU) 2024/1689 Art. 14 (ability to intervene or interrupt through a stop button or similar procedure, high-risk systems); NIST AI RMF MANAGE 2.4 | fill: user | evidence: required -->
_Describe how the agent is stopped, by whom, how fast, and what happens to in-flight actions. Attach the record of the last test._

| Field | Value |
|---|---|
| Stop mechanism (technical description) | {{agent.kill_switch.mechanism}} |
| Who can trigger it (roles, availability) | {{agent.kill_switch.authorised_roles}} |
| Credential / token revocation procedure | {{agent.kill_switch.revocation}} |
| Handling of in-flight and already executed actions (rollback) | {{agent.kill_switch.rollback}} |
| Automatic stop conditions (thresholds, anomalies) | {{agent.kill_switch.auto_conditions}} |
| Fallback process while the agent is stopped | {{agent.kill_switch.fallback}} |
| Last test: date, result, evidence | {{agent.kill_switch.last_test}} |

## 9. Logging and traceability
<!-- basis: Reg. (EU) 2024/1689 Art. 12 and Art. 26 (log keeping by deployers, high-risk systems); ISO/IEC 42001 A.6.2.8 | fill: rag | evidence: required -->
_Logs must allow reconstruction of what the agent did: prompt, retrieved context, tool calls with parameters and results, approvals, and final output. Retention for high-risk systems follows the knowledge base._

| Event logged | Fields captured | Storage and integrity protection | Retention | Access | Source |
|---|---|---|---|---|---|
| {{agent.logging[i].event}} | {{agent.logging[i].fields}} | {{agent.logging[i].storage}} | {{agent.logging[i].retention}} | {{agent.logging[i].access}} | {{agent.logging[i].cite}} |

Minimum log retention for high-risk systems per knowledge base: {{kb.eu_ai_act.retention.logs}}

## 10. Transparency to persons interacting with the agent
<!-- basis: Reg. (EU) 2024/1689 Art. 50 | fill: user | evidence: optional -->
_State how people are told they are interacting with an AI system and how AI-generated content is marked; reference the Transparency Notices document._

{{agent.transparency.description}} — Notice reference: {{agent.transparency.notice_ref}}

## 11. Change management and review
<!-- basis: ISO/IEC 42001 A.6.2.6; Reg. (EU) 2024/1689 Art. 3(23) (substantial modification, high-risk systems) | fill: user | evidence: optional -->
_Any change to model, system prompt, tools, data sources or autonomy level requires a new version of this card and re-approval._

| Change triggers | Review interval | Next review | Change log reference |
|---|---|---|---|
| {{agent.change.triggers}} | {{agent.review.interval}} | {{agent.review.next_date}} | {{agent.change.log_ref}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Configuration files, manifests, contracts, test reports and logs used above, each with hash; user-declared values are labelled._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: internal HITL policy; Reg. (EU) 2024/1689 Art. 26 (assignment of human oversight, high-risk systems) | fill: user | evidence: required -->
_The agent may not run in production until this card is approved._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| AI system owner (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| CISO | {{signoff.ciso.name}} | {{signoff.ciso.decision}} | {{signoff.ciso.date}} | {{signoff.ciso.signature}} |
| AI Governance Lead | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
