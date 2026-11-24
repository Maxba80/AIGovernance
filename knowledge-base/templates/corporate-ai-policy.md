---
id: tpl-corporate-ai-policy
title_en: Corporate AI Policy
title_it: Policy aziendale sull'intelligenza artificiale
category: executive
legal_basis: ["ISO/IEC 42001:2023 Clause 5.2", "ISO/IEC 42001:2023 Annex A.2", "Reg. (EU) 2024/1689 Art. 4", "Reg. (EU) 2024/1689 Art. 5", "Reg. (EU) 2024/1689 Art. 17", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2016/679 Art. 24"]
related_frameworks: ["ISO/IEC 42001 A.2.2", "ISO/IEC 42001 A.2.3", "ISO/IEC 42001 A.2.4", "ISO/IEC 42001 A.3.2", "ISO/IEC 42001 A.3.3", "NIST AI RMF GOVERN 1.1", "NIST AI RMF GOVERN 1.2", "GDPR Art. 5", "GDPR Art. 25"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Top management (CEO / Board of Directors)
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | Not system-specific – applies to all AI systems in the scope of section 2 |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Next review due | {{policy.next_review_date}} |
| Document hash (SHA-256) | {{doc.sha256}} |

## 1. Purpose and context
<!-- basis: ISO/IEC 42001 Clause 5.2 (a); Clause 4.1 | fill: user | evidence: optional -->
_State why the organisation uses or develops AI and how this policy fits its purpose and strategy. Keep it specific to the organisation, not generic._

{{policy.purpose}}

## 2. Scope
<!-- basis: ISO/IEC 42001 Clause 4.3; Reg. (EU) 2024/1689 Art. 2 and Art. 3 (definitions of operator roles) | fill: user | evidence: optional -->
_Define the legal entities, business units, AI systems, life-cycle stages and third parties covered, and the organisation's roles under the AI Act._

| Scope element | Description |
|---|---|
| Legal entities and locations | {{policy.scope.entities}} |
| Persons bound by the policy | {{policy.scope.persons}} |
| AI systems and models covered | {{policy.scope.systems}} |
| AI Act roles held by the organisation | {{policy.scope.aiact_roles}} |
| Exclusions and justification | {{policy.scope.exclusions}} |

## 3. Principles for responsible AI
<!-- basis: ISO/IEC 42001 A.2.2; NIST AI RMF GOVERN 1.2 | fill: user | evidence: optional -->
_Adapt the principles to the organisation; each must be actionable and linked to a control or procedure. Remove rows that do not apply rather than leaving empty commitments._

| Principle | Commitment of the organisation | Implemented through |
|---|---|---|
| Lawfulness and respect for fundamental rights | {{policy.principles.lawfulness}} | {{policy.principles.lawfulness_ref}} |
| Human agency and oversight | {{policy.principles.oversight}} | {{policy.principles.oversight_ref}} |
| Safety, robustness and security | {{policy.principles.safety}} | {{policy.principles.safety_ref}} |
| Privacy and data governance | {{policy.principles.privacy}} | {{policy.principles.privacy_ref}} |
| Transparency and explainability | {{policy.principles.transparency}} | {{policy.principles.transparency_ref}} |
| Fairness and non-discrimination | {{policy.principles.fairness}} | {{policy.principles.fairness_ref}} |
| Accountability and traceability | {{policy.principles.accountability}} | {{policy.principles.accountability_ref}} |

## 4. Framework for AI objectives
<!-- basis: ISO/IEC 42001 Clause 5.2 (b); Clause 6.2 | fill: user | evidence: optional -->
_The policy must provide a framework for setting AI objectives. List the objectives or point to where they are maintained, with measure and owner._

| AI objective | Measure / KPI | Target | Owner | Review frequency |
|---|---|---|---|---|
| {{policy.objectives[i].objective}} | {{policy.objectives[i].measure}} | {{policy.objectives[i].target}} | {{policy.objectives[i].owner}} | {{policy.objectives[i].frequency}} |

## 5. Commitment to meet applicable requirements
<!-- basis: ISO/IEC 42001 Clause 5.2 (c); Reg. (EU) 2024/1689 Art. 5, Art. 16, Art. 26, Art. 50; Reg. (EU) 2016/679 Art. 24 | fill: kb | evidence: required -->
_The list of applicable requirements is generated from the knowledge base according to the roles declared in section 2; application dates are those in force in the knowledge base._

The organisation commits to satisfy the legal, regulatory, contractual and voluntary requirements applicable to its AI activities, including:

| Requirement source | Applies because | Key obligations | Applicable from | Source |
|---|---|---|---|---|
| {{policy.requirements[i].source}} | {{policy.requirements[i].applicability}} | {{policy.requirements[i].obligations}} | {{policy.requirements[i].kb_date}} | {{policy.requirements[i].cite}} |

Prohibited practices: the organisation does not develop, place on the market, put into service or use AI systems for practices prohibited by Art. 5 of Regulation (EU) 2024/1689 ({{kb.eu_ai_act.art5.summary}}).

## 6. Governance, roles and responsibilities
<!-- basis: ISO/IEC 42001 Clause 5.3; A.3.2; Reg. (EU) 2024/1689 Art. 26 (assignment of human oversight by deployers) | fill: user | evidence: optional -->
_Name roles, not only functions; detailed allocation lives in the AI Governance RACI Matrix._

| Role | Responsibility under this policy | Holder |
|---|---|---|
| Top management | {{policy.roles.top_management.responsibility}} | {{policy.roles.top_management.holder}} |
| AI governance lead / committee | {{policy.roles.ai_governance.responsibility}} | {{policy.roles.ai_governance.holder}} |
| AI system owners | {{policy.roles.system_owner.responsibility}} | {{policy.roles.system_owner.holder}} |
| Data Protection Officer | {{policy.roles.dpo.responsibility}} | {{policy.roles.dpo.holder}} |
| Information security | {{policy.roles.security.responsibility}} | {{policy.roles.security.holder}} |
| All personnel | {{policy.roles.personnel.responsibility}} | all |

RACI reference: {{policy.raci_document_ref}}

## 7. AI system life cycle requirements
<!-- basis: ISO/IEC 42001 Clause 6.1.2, 6.1.3, 6.1.4; A.5.2; A.6; A.10; Reg. (EU) 2024/1689 Art. 6 and Art. 9 | fill: user | evidence: optional -->
_State the mandatory gates every AI initiative must pass; reference the procedure that implements each gate._

| Gate | Requirement | Procedure / template |
|---|---|---|
| Registration | Every AI use case is recorded in the AI inventory before use | {{policy.lifecycle.inventory_ref}} |
| Risk classification | Classification under the AI Act is documented and signed off | {{policy.lifecycle.classification_ref}} |
| Risk and impact assessment | AI risk assessment and, where required, AI system impact assessment / FRIA / DPIA | {{policy.lifecycle.assessment_ref}} |
| Third parties | Supplier and customer responsibilities are allocated contractually | {{policy.lifecycle.third_party_ref}} |
| Operation and monitoring | Human oversight, logging, monitoring and incident handling are in place | {{policy.lifecycle.operation_ref}} |
| Retirement | Decommissioning and data disposal are documented | {{policy.lifecycle.retirement_ref}} |

## 8. Alignment with other organisational policies
<!-- basis: ISO/IEC 42001 A.2.3 | fill: rag | evidence: required -->
_Identify existing policies affected by or affecting AI (security, privacy, procurement, HR, quality) and note any conflict resolved. Cite the policy documents retrieved._

| Related policy | Version | Intersection with AI | Alignment action | Source |
|---|---|---|---|---|
| {{policy.related[i].name}} | {{policy.related[i].version}} | {{policy.related[i].intersection}} | {{policy.related[i].action}} | {{policy.related[i].cite}} |

## 9. AI literacy, awareness and communication
<!-- basis: Reg. (EU) 2024/1689 Art. 4; ISO/IEC 42001 Clause 7.3, 7.4 and Clause 5.2 (communication and availability of the policy) | fill: user | evidence: optional -->
_Describe how the policy is communicated internally, made available to interested parties, and supported by the AI literacy plan._

{{policy.communication}}

AI literacy plan reference: {{policy.literacy_plan_ref}}

## 10. Reporting of concerns, exceptions and non-compliance
<!-- basis: ISO/IEC 42001 A.3.3; Clause 10.2 | fill: user | evidence: optional -->
_Describe the channel for reporting concerns (including confidentiality and protection from retaliation), how exceptions are approved, and the consequences of breaches._

| Topic | Rule |
|---|---|
| Reporting channel | {{policy.concerns.channel}} |
| Exception approval | {{policy.exceptions.process}} |
| Consequences of non-compliance | {{policy.noncompliance.consequences}} |

## 11. Continual improvement and policy review
<!-- basis: ISO/IEC 42001 Clause 5.2 (d); Clause 10.1; A.2.4 | fill: user | evidence: optional -->
_State the commitment to continual improvement of the AI management system, the review interval and the events that trigger an extraordinary review (for example legal amendments)._

{{policy.improvement_commitment}}

| Review interval | Extraordinary review triggers | Review owner |
|---|---|---|
| {{policy.review.interval}} | {{policy.review.triggers}} | {{policy.review.owner}} |

## Sources and evidence
<!-- basis: internal traceability requirement; ISO/IEC 42001 Clause 7.5 | fill: computed | evidence: required -->
_List every document used to fill this policy. Statements made by the organisation itself are labelled "user-declared" with the declaring person and date._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 Clause 5.2 (policy established by top management) | fill: user | evidence: required -->
_The policy takes effect only when approved by top management; the HITL decision is recorded in the audit log._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Reviewed by (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by (top management) | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
