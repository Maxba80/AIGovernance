---
id: tpl-ai-use-case-inventory-record
title_en: AI Use Case Inventory Record
title_it: Scheda di inventario del caso d'uso di IA
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 3", "Reg. (EU) 2024/1689 Art. 5", "Reg. (EU) 2024/1689 Art. 6", "Reg. (EU) 2024/1689 Art. 25", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Art. 49", "Reg. (EU) 2024/1689 Art. 50", "Reg. (EU) 2016/679 Art. 30"]
related_frameworks: ["ISO/IEC 42001 Clause 4.3", "ISO/IEC 42001 A.4.2", "ISO/IEC 42001 A.9.4", "ISO/IEC 42001 A.10.3", "NIST AI RMF GOVERN 1.6", "NIST AI RMF MAP 1.1", "GDPR Art. 30", "GDPR Art. 35"]
output_formats: [xlsx, docx, pdf, md]
hitl_approval: required
approver_role: AI system owner, countersigned by AI Governance Lead
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_One record per AI system or use case. In XLSX export each "Field" below becomes a column and each record a row; the "Fill" and "Source" columns are exported alongside the value._

## 1. Identification
<!-- basis: NIST AI RMF GOVERN 1.6; ISO/IEC 42001 A.4.2 | fill: rag | evidence: required -->
_Identify the system unambiguously. Supplier and version must come from a contract, order form or product documentation._

| Field | Value | Fill | Source |
|---|---|---|---|
| System / use case name | {{ai_system.name}} | user | {{ai_system.name_cite}} |
| Version / release | {{ai_system.version}} | rag | {{ai_system.version_cite}} |
| Short description | {{ai_system.description}} | rag | {{ai_system.description_cite}} |
| Supplier / developer (legal entity, country) | {{ai_system.supplier}} | rag | {{ai_system.supplier_cite}} |
| Underlying model(s), incl. general-purpose AI models | {{ai_system.models}} | rag | {{ai_system.models_cite}} |
| Business owner | {{ai_system.owner}} | user | user-declared |
| Business unit / process | {{ai_system.business_unit}} | user | user-declared |
| Life-cycle status (idea, pilot, production, retired) | {{ai_system.lifecycle_status}} | user | user-declared |
| Date first put into service / used | {{ai_system.first_use_date}} | rag | {{ai_system.first_use_cite}} |

## 2. Qualification as an AI system and scope
<!-- basis: Reg. (EU) 2024/1689 Art. 3(1) and Art. 2 | fill: rag | evidence: required -->
_State whether the tool meets the AI system definition and whether a scope exclusion applies; reasoning in one or two lines, with source._

| Field | Value | Source |
|---|---|---|
| Meets the definition of AI system (Art. 3(1))? | {{scope.is_ai_system}} – {{scope.is_ai_system_reasoning}} | {{scope.is_ai_system_cite}} |
| Scope exclusion under Art. 2 claimed? | {{scope.exclusion}} – {{scope.exclusion_reasoning}} | {{scope.exclusion_cite}} |
| Placed on the market / put into service / used in the Union, or output used in the Union? | {{scope.union_nexus}} | {{scope.union_nexus_cite}} |

## 3. Role of the organisation
<!-- basis: Reg. (EU) 2024/1689 Art. 3(3)-(8) and Art. 25 | fill: rag | evidence: required -->
_Select every role that applies and justify it from contracts or branding facts. Check whether Art. 25 turns a deployer, importer or distributor into a provider (own name or trademark, substantial modification, change of intended purpose)._

| Role | Applies? | Justification | Source |
|---|---|---|---|
| Provider (Art. 3(3)) | {{role.provider.applies}} | {{role.provider.justification}} | {{role.provider.cite}} |
| Deployer (Art. 3(4)) | {{role.deployer.applies}} | {{role.deployer.justification}} | {{role.deployer.cite}} |
| Authorised representative (Art. 3(5)) | {{role.authrep.applies}} | {{role.authrep.justification}} | {{role.authrep.cite}} |
| Importer (Art. 3(6)) | {{role.importer.applies}} | {{role.importer.justification}} | {{role.importer.cite}} |
| Distributor (Art. 3(7)) | {{role.distributor.applies}} | {{role.distributor.justification}} | {{role.distributor.cite}} |
| Deemed provider under Art. 25? | {{role.art25.applies}} | {{role.art25.justification}} | {{role.art25.cite}} |

## 4. Intended purpose and context of use
<!-- basis: Reg. (EU) 2024/1689 Art. 3(12) (intended purpose) and Art. 26 (use in accordance with the instructions for use); ISO/IEC 42001 A.9.4 | fill: rag | evidence: required -->
_Quote the provider's intended purpose from the instructions for use or contract, then describe the actual use. Any difference between the two must be flagged._

| Field | Value | Source |
|---|---|---|
| Intended purpose as stated by the provider | {{purpose.provider_statement}} | {{purpose.provider_statement_cite}} |
| Actual use in the organisation | {{purpose.actual_use}} | {{purpose.actual_use_cite}} |
| Deviation from intended purpose? | {{purpose.deviation}} | {{purpose.deviation_cite}} |
| Users (internal functions, number) | {{purpose.users}} | {{purpose.users_cite}} |
| Persons affected by outputs (categories, vulnerable groups) | {{purpose.affected_persons}} | {{purpose.affected_persons_cite}} |
| Decisions influenced and degree of automation | {{purpose.decisions}} | {{purpose.decisions_cite}} |
| Geographic scope | {{purpose.geography}} | {{purpose.geography_cite}} |

## 5. Data
<!-- basis: Reg. (EU) 2016/679 Art. 30 and Art. 35; Reg. (EU) 2024/1689 Art. 10 (high-risk systems) | fill: rag | evidence: required -->
_Link to the record of processing activities rather than duplicating it._

| Field | Value | Source |
|---|---|---|
| Input data categories | {{data.inputs}} | {{data.inputs_cite}} |
| Personal data processed? Special categories? | {{data.personal}} / {{data.special_categories}} | {{data.personal_cite}} |
| Output types | {{data.outputs}} | {{data.outputs_cite}} |
| Organisation's data used for training or fine-tuning? | {{data.training_use}} | {{data.training_use_cite}} |
| ROPA entry / DPIA reference | {{data.ropa_ref}} / {{data.dpia_ref}} | {{data.ropa_cite}} |
| Data location and transfers outside the EEA | {{data.location_transfers}} | {{data.location_cite}} |

## 6. Risk classification summary
<!-- basis: Reg. (EU) 2024/1689 Art. 5, Art. 6, Art. 50, Art. 51 | fill: computed | evidence: required -->
_Copied automatically from the signed Risk Classification Rationale; do not edit here. "Not yet classified" blocks approval of the record._

| Field | Value |
|---|---|
| Final risk class | {{classification.final_class}} |
| Legal hook (e.g. Annex III point, Annex I act, Art. 50 paragraph) | {{classification.legal_hook}} |
| Art. 6(3) derogation relied on? | {{classification.art6_3_relied}} |
| Classification rationale document / version / signed on | {{classification.doc_ref}} / {{classification.doc_version}} / {{classification.signed_date}} |
| Obligations applicable from (knowledge base) | {{classification.kb_applicable_date}} |

## 7. Applicable obligations and status
<!-- basis: Reg. (EU) 2024/1689 Art. 16, Art. 26, Art. 27, Art. 49, Art. 50 | fill: computed | evidence: required -->
_Generated from role (section 3) and class (section 6) using the knowledge-base obligation map; status comes from validated assessments._

| Obligation | Legal basis | Status | Evidence / deliverable | Owner | Due |
|---|---|---|---|---|---|
| {{obligations[i].name}} | {{obligations[i].basis}} | {{obligations[i].status}} | {{obligations[i].evidence_ref}} | {{obligations[i].owner}} | {{obligations[i].due}} |

EU database registration (Art. 49) required: {{registration.required}} — registration reference: {{registration.reference}}

## 8. Third parties and contracts
<!-- basis: Reg. (EU) 2024/1689 Art. 25; Reg. (EU) 2016/679 Art. 28; ISO/IEC 42001 A.10.3 | fill: rag | evidence: required -->
_List contracts governing the system and whether provider documentation (instructions for use, declaration of conformity) has been received._

| Counterparty | Contract / DPA | AI Act role of counterparty | Documentation received | Source |
|---|---|---|---|---|
| {{contracts[i].counterparty}} | {{contracts[i].reference}} | {{contracts[i].role}} | {{contracts[i].documentation}} | {{contracts[i].cite}} |

## 9. Human oversight, monitoring and review
<!-- basis: Reg. (EU) 2024/1689 Art. 14 and Art. 26; ISO/IEC 42001 A.6.2.6 | fill: user | evidence: optional -->
_Name the oversight person and when this record is next reviewed; any change of purpose, model or supplier triggers re-classification._

| Oversight person / role | Monitoring in place | Incidents to date | Next review | Re-classification triggers |
|---|---|---|---|---|
| {{oversight.person}} | {{oversight.monitoring}} | {{oversight.incident_count}} | {{review.next_date}} | {{review.triggers}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Every "Source" reference above resolves to a row here; user-declared values carry the declaring person and date._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: internal HITL policy; ISO/IEC 42001 Clause 7.5 | fill: user | evidence: required -->
_The record enters the official inventory only after owner confirmation and governance countersignature._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| AI system owner (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| AI Governance Lead | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
