---
id: tpl-eu-declaration-of-conformity
title_en: EU Declaration of Conformity for a High-Risk AI System
title_it: Dichiarazione di conformità UE per sistema di IA ad alto rischio
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 47", "Reg. (EU) 2024/1689 Annex V", "Reg. (EU) 2024/1689 Art. 16", "Reg. (EU) 2024/1689 Art. 43", "Reg. (EU) 2024/1689 Art. 48", "Reg. (EU) 2024/1689 Art. 18"]
related_frameworks: ["ISO/IEC 17050-1 (supplier's declaration of conformity)", "ISO/IEC 42001 A.8.5", "GDPR Art. 5(2)"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Provider's legal representative or duly authorised signatory
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace (provider) | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| Declaration number | {{doc_conf.number}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver (signatory) | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Sections 1–8 reproduce Annex V points 1–8 and are the declaration itself. Sections 0 and 9 are internal control records and are omitted from the exported declaration. The declaration must be written, machine-readable, physical or electronically signed (Art. 47(1)), and translated into a language easily understood by the competent authorities of each Member State where the system is placed on the market or made available (Art. 47(2))._

## 0. Pre-issue checks (internal, not exported)
<!-- basis: Reg. (EU) 2024/1689 Art. 16, Art. 43 and Art. 47(1)-(2) | fill: computed | evidence: required -->
_The declaration may be issued only when every check passes; each check links to the evidence document._

| Check | Result | Evidence |
|---|---|---|
| System classified high-risk and classification signed | {{doc_conf.checks.classification.result}} | {{doc_conf.checks.classification.evidence}} |
| Conformity assessment procedure under Art. 43 completed | {{doc_conf.checks.conformity_assessment.result}} | {{doc_conf.checks.conformity_assessment.evidence}} |
| Technical documentation (Annex IV) complete and approved | {{doc_conf.checks.techdoc.result}} | {{doc_conf.checks.techdoc.evidence}} |
| Quality management system in place (Art. 17) | {{doc_conf.checks.qms.result}} | {{doc_conf.checks.qms.evidence}} |
| Translations available for all Member States of placing on the market | {{doc_conf.checks.translations.result}} | {{doc_conf.checks.translations.evidence}} |

## 1. AI system identification
<!-- basis: Reg. (EU) 2024/1689 Annex V point 1 | fill: rag | evidence: required -->
_Name and type of the AI system and any additional unambiguous reference allowing its identification and traceability; must match the technical documentation exactly._

| AI system name | Type | Version | Additional unambiguous reference (model / serial / build / registration ID) | Source |
|---|---|---|---|---|
| {{doc_conf.p1.name}} | {{doc_conf.p1.type}} | {{doc_conf.p1.version}} | {{doc_conf.p1.reference}} | {{doc_conf.p1.cite}} |

## 2. Provider
<!-- basis: Reg. (EU) 2024/1689 Annex V point 2 | fill: rag | evidence: required -->
_Name and address of the provider or, where applicable, of its authorised representative; take from the company register extract or mandate._

| Field | Value | Source |
|---|---|---|
| Provider name | {{doc_conf.p2.provider_name}} | {{doc_conf.p2.provider_cite}} |
| Provider address | {{doc_conf.p2.provider_address}} | {{doc_conf.p2.provider_cite}} |
| Authorised representative name and address (where applicable) | {{doc_conf.p2.authrep}} | {{doc_conf.p2.authrep_cite}} |

## 3. Statement of sole responsibility
<!-- basis: Reg. (EU) 2024/1689 Annex V point 3 | fill: kb | evidence: optional -->
_Fixed statement; do not alter the meaning._

This EU declaration of conformity is issued under the sole responsibility of the provider named in section 2.

## 4. Statement of conformity
<!-- basis: Reg. (EU) 2024/1689 Annex V point 4; Art. 47(2) and Art. 47(3) | fill: rag | evidence: required -->
_State conformity with the Regulation and, if applicable, with any other Union law providing for an EU declaration of conformity. Where other Union harmonisation legislation applies, a single declaration covers all of it and must identify each act._

The AI system identified in section 1 is in conformity with Regulation (EU) 2024/1689 of the European Parliament and of the Council (Artificial Intelligence Act), as amended, and meets the requirements set out in Chapter III, Section 2 thereof.

| Other Union law for which conformity is declared | Reference (act, OJ) | Source |
|---|---|---|
| {{doc_conf.p4.other_law[i].name}} | {{doc_conf.p4.other_law[i].reference}} | {{doc_conf.p4.other_law[i].cite}} |

## 5. Personal data protection statement
<!-- basis: Reg. (EU) 2024/1689 Annex V point 5 | fill: rag | evidence: required -->
_Required where the AI system involves the processing of personal data. If it does not, state so and keep the evidence for that conclusion._

Processing of personal data involved: {{doc_conf.p5.personal_data_involved}} (source: {{doc_conf.p5.cite}})

Where applicable: the AI system identified in section 1 complies with Regulation (EU) 2016/679, Regulation (EU) 2018/1725 and Directive (EU) 2016/680.

Supporting evidence (DPIA, records of processing): {{doc_conf.p5.evidence}}

## 6. Harmonised standards and common specifications
<!-- basis: Reg. (EU) 2024/1689 Annex V point 6; Art. 40 and Art. 41 | fill: rag | evidence: required -->
_References to any relevant harmonised standards used or any other common specification in relation to which conformity is declared; must be consistent with Annex IV point 7 of the technical documentation._

| Standard / common specification | Edition / date | OJ reference (where harmonised) | Applied in full or in part | Source |
|---|---|---|---|---|
| {{doc_conf.p6.standards[i].name}} | {{doc_conf.p6.standards[i].edition}} | {{doc_conf.p6.standards[i].oj_ref}} | {{doc_conf.p6.standards[i].extent}} | {{doc_conf.p6.standards[i].cite}} |

## 7. Notified body and conformity assessment
<!-- basis: Reg. (EU) 2024/1689 Annex V point 7; Art. 43 | fill: rag | evidence: required -->
_Where applicable: name and identification number of the notified body, description of the conformity assessment procedure performed, and identification of the certificate issued. If the procedure was based on internal control, state "not applicable – internal control (Annex VI)"._

| Field | Value | Source |
|---|---|---|
| Conformity assessment procedure performed | {{doc_conf.p7.procedure}} | {{doc_conf.p7.procedure_cite}} |
| Notified body name | {{doc_conf.p7.nb_name}} | {{doc_conf.p7.nb_cite}} |
| Notified body identification number | {{doc_conf.p7.nb_number}} | {{doc_conf.p7.nb_cite}} |
| Certificate identification and date | {{doc_conf.p7.certificate}} | {{doc_conf.p7.certificate_cite}} |

## 8. Place, date and signature
<!-- basis: Reg. (EU) 2024/1689 Annex V point 8; Art. 47(1) | fill: user | evidence: required -->
_Place and date of issue, name and function of the person who signed, an indication for or on behalf of whom that person signed, and the signature. The signatory must have authority to bind the provider._

| Field | Value |
|---|---|
| Place of issue | {{doc_conf.p8.place}} |
| Date of issue | {{doc_conf.p8.date}} |
| Name of signatory | {{doc_conf.p8.name}} |
| Function | {{doc_conf.p8.function}} |
| Signed for and on behalf of | {{doc_conf.p8.on_behalf_of}} |
| Signature (handwritten or electronic signature reference) | {{doc_conf.p8.signature}} |

## 9. Maintenance, retention and translations (internal, not exported)
<!-- basis: Reg. (EU) 2024/1689 Art. 47(1), Art. 47(2), Art. 47(4) and Art. 18 | fill: computed | evidence: required -->
_By drawing up the declaration the provider assumes responsibility for compliance and must keep it up to date (Art. 47(4)). The declaration is kept at the disposal of national competent authorities for the period held in the knowledge base._

| Field | Value |
|---|---|
| Retention period per knowledge base | {{kb.eu_ai_act.retention.documentation}} |
| Retain until (computed from date of placing on the market / putting into service) | {{doc_conf.retention.until}} |
| Storage location and custodian | {{doc_conf.retention.location}} |
| Events requiring a new or updated declaration | {{doc_conf.update.triggers}} |
| CE marking affixed (Art. 48) and EU database registration (Art. 49) | {{doc_conf.ce_marking}} / {{doc_conf.registration_ref}} |

| Language | Member State(s) | Translation reference | Hash (SHA-256) |
|---|---|---|---|
| {{doc_conf.translations[i].language}} | {{doc_conf.translations[i].member_states}} | {{doc_conf.translations[i].reference}} | {{doc_conf.translations[i].sha256}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 47(4) | fill: computed | evidence: required -->
_Company register extract, mandate, certificates, standards list and technical documentation used above. Attached to the internal record, not to the exported declaration._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 47(4); internal HITL policy | fill: user | evidence: required -->
_Internal release record preceding the legal signature in section 8. The agent never signs or issues the declaration._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Regulatory Affairs / Compliance (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Authorised signatory | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
