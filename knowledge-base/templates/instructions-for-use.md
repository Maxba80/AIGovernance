---
id: tpl-instructions-for-use
title_en: Instructions for Use for a High-Risk AI System
title_it: Istruzioni per l'uso del sistema di IA ad alto rischio
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 13", "Reg. (EU) 2024/1689 Art. 12", "Reg. (EU) 2024/1689 Art. 14", "Reg. (EU) 2024/1689 Art. 15", "Reg. (EU) 2024/1689 Art. 26", "Reg. (EU) 2024/1689 Annex IV point 1"]
related_frameworks: ["ISO/IEC 42001 A.8.2", "ISO/IEC 42001 A.9.4", "ISO/IEC 42001 A.6.2.7", "NIST AI RMF MAP 2.2", "NIST AI RMF MEASURE 2.8", "NIST AI RMF MEASURE 2.9", "GDPR Art. 35"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Provider's Product Owner and Regulatory Affairs / Compliance Officer
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace (provider) | {{workspace.name}} |
| AI system | {{ai_system.name}} (version {{ai_system.version}}; applies to versions {{ifu.applicable_versions}}) |
| Language | {{ifu.language}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Addressed to deployers. Art. 13(2) requires concise, complete, correct and clear information that is relevant, accessible and comprehensible to deployers, in an appropriate digital format or otherwise. Sections 1–6 follow Art. 13(3)(a)–(f). Every figure must match the technical documentation (Annex IV); the "Source" column is retained in the internal version and may be hidden in the version shipped to deployers._

## 1. Provider identity and contact details
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(a) | fill: rag | evidence: required -->
_Identity and contact details of the provider and, where applicable, of its authorised representative._

| Field | Value | Source |
|---|---|---|
| Provider name and address | {{ifu.provider.name_address}} | {{ifu.provider.cite}} |
| Contact for deployers (support, compliance) | {{ifu.provider.contact}} | {{ifu.provider.contact_cite}} |
| Authorised representative (where applicable) | {{ifu.provider.authrep}} | {{ifu.provider.authrep_cite}} |

## 2. Characteristics, capabilities and limitations of performance
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(b) | fill: rag | evidence: required -->
_Cover each item (i)–(vii). State limitations as plainly as capabilities; items marked "where applicable" or "when appropriate" in the law need a reason if omitted._

### 2.1 Intended purpose — Art. 13(3)(b)(i)
{{ifu.b.i.intended_purpose}} (source: {{ifu.b.i.cite}})

Uses outside the intended purpose (not permitted / not validated): {{ifu.b.i.excluded_uses}}

### 2.2 Accuracy, robustness and cybersecurity — Art. 13(3)(b)(ii)
_Level of accuracy, including its metrics, robustness and cybersecurity (Art. 15) against which the system was tested and validated and which can be expected, plus known and foreseeable circumstances that may affect them._

| Property | Metric | Tested / validated level | Test conditions and dataset | Circumstances that may reduce it | Source |
|---|---|---|---|---|---|
| {{ifu.b.ii.metrics[i].property}} | {{ifu.b.ii.metrics[i].metric}} | {{ifu.b.ii.metrics[i].level}} | {{ifu.b.ii.metrics[i].conditions}} | {{ifu.b.ii.metrics[i].degrading_circumstances}} | {{ifu.b.ii.metrics[i].cite}} |

### 2.3 Circumstances that may lead to risks — Art. 13(3)(b)(iii)
_Known or foreseeable circumstances, in use according to the intended purpose or under reasonably foreseeable misuse, which may lead to risks to health and safety or fundamental rights._

| Circumstance / foreseeable misuse | Risk | What the deployer should do | Source |
|---|---|---|---|
| {{ifu.b.iii.risks[i].circumstance}} | {{ifu.b.iii.risks[i].risk}} | {{ifu.b.iii.risks[i].deployer_action}} | {{ifu.b.iii.risks[i].cite}} |

### 2.4 Explainability capabilities — Art. 13(3)(b)(iv)
_Where applicable: technical capabilities and characteristics of the system to provide information relevant to explain its output._

{{ifu.b.iv.explainability}} (source: {{ifu.b.iv.cite}})

### 2.5 Performance regarding specific persons or groups — Art. 13(3)(b)(v)
_When appropriate: performance regarding the specific persons or groups on which the system is intended to be used._

| Person group | Metric | Performance | Known disparity or limitation | Source |
|---|---|---|---|---|
| {{ifu.b.v.groups[i].group}} | {{ifu.b.v.groups[i].metric}} | {{ifu.b.v.groups[i].performance}} | {{ifu.b.v.groups[i].limitation}} | {{ifu.b.v.groups[i].cite}} |

### 2.6 Input data specifications and data set information — Art. 13(3)(b)(vi)
_When appropriate: specifications for the input data, or other relevant information on the training, validation and testing data sets, taking into account the intended purpose._

| Input | Format and quality requirements | Out-of-range behaviour | Source |
|---|---|---|---|
| {{ifu.b.vi.inputs[i].name}} | {{ifu.b.vi.inputs[i].requirements}} | {{ifu.b.vi.inputs[i].out_of_range}} | {{ifu.b.vi.inputs[i].cite}} |

Training, validation and testing data summary: {{ifu.b.vi.dataset_summary}} (source: {{ifu.b.vi.dataset_cite}})

### 2.7 Interpreting and using the output — Art. 13(3)(b)(vii)
_Where applicable: information enabling deployers to interpret the output and use it appropriately (meaning of scores, confidence, thresholds, typical errors)._

{{ifu.b.vii.output_interpretation}} (source: {{ifu.b.vii.cite}})

## 3. Pre-determined changes
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(c) | fill: rag | evidence: required -->
_Changes to the system and its performance pre-determined by the provider at the time of the initial conformity assessment, if any. State "none" explicitly where that is the case._

| Pre-determined change | Effect on performance | How the deployer is informed | Source |
|---|---|---|---|
| {{ifu.c.changes[i].change}} | {{ifu.c.changes[i].effect}} | {{ifu.c.changes[i].notification}} | {{ifu.c.changes[i].cite}} |

## 4. Human oversight measures
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(d); Art. 14 | fill: rag | evidence: required -->
_Human oversight measures, including technical measures put in place to facilitate interpretation of outputs by deployers. Write them as instructions the deployer's overseers can follow._

| Oversight measure | Built into the system or to be implemented by the deployer | How to perform it | Required competence of the overseer | Source |
|---|---|---|---|---|
| Understand capacities and limitations; monitor operation and detect anomalies | {{ifu.d.monitor.type}} | {{ifu.d.monitor.how}} | {{ifu.d.monitor.competence}} | {{ifu.d.monitor.cite}} |
| Remain aware of automation bias | {{ifu.d.automation_bias.type}} | {{ifu.d.automation_bias.how}} | {{ifu.d.automation_bias.competence}} | {{ifu.d.automation_bias.cite}} |
| Correctly interpret the output | {{ifu.d.interpret.type}} | {{ifu.d.interpret.how}} | {{ifu.d.interpret.competence}} | {{ifu.d.interpret.cite}} |
| Decide not to use, disregard, override or reverse the output | {{ifu.d.override.type}} | {{ifu.d.override.how}} | {{ifu.d.override.competence}} | {{ifu.d.override.cite}} |
| Intervene or interrupt through a stop button or similar procedure | {{ifu.d.stop.type}} | {{ifu.d.stop.how}} | {{ifu.d.stop.competence}} | {{ifu.d.stop.cite}} |
| Additional measure: {{ifu.d.other[i].measure}} | {{ifu.d.other[i].type}} | {{ifu.d.other[i].how}} | {{ifu.d.other[i].competence}} | {{ifu.d.other[i].cite}} |

## 5. Resources, lifetime, maintenance and updates
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(e) | fill: rag | evidence: required -->
_Computational and hardware resources needed, expected lifetime, and maintenance and care measures including their frequency, to ensure proper functioning, including software updates._

| Field | Value | Source |
|---|---|---|
| Computational and hardware resources needed | {{ifu.e.resources}} | {{ifu.e.resources_cite}} |
| Expected lifetime of the system | {{ifu.e.lifetime}} | {{ifu.e.lifetime_cite}} |
| Maintenance and care measures and their frequency | {{ifu.e.maintenance}} | {{ifu.e.maintenance_cite}} |
| Software updates (delivery, deployer actions, support period) | {{ifu.e.updates}} | {{ifu.e.updates_cite}} |

## 6. Logs
<!-- basis: Reg. (EU) 2024/1689 Art. 13(3)(f); Art. 12; Art. 26 (deployers keep logs under their control) | fill: rag | evidence: required -->
_Where relevant: mechanisms included in the system that allow deployers to properly collect, store and interpret the logs. Minimum retention by deployers per knowledge base: {{kb.eu_ai_act.retention.logs}}._

| Log / event type | Content | How to collect and export | How to interpret | Storage and retention guidance | Source |
|---|---|---|---|---|---|
| {{ifu.f.logs[i].type}} | {{ifu.f.logs[i].content}} | {{ifu.f.logs[i].collection}} | {{ifu.f.logs[i].interpretation}} | {{ifu.f.logs[i].retention}} | {{ifu.f.logs[i].cite}} |

## 7. Deployer obligations and reporting to the provider
<!-- basis: Reg. (EU) 2024/1689 Art. 26; Art. 72; Art. 73 | fill: kb | evidence: optional -->
_Not required content under Art. 13(3) but helpful: remind deployers of their own duties and give the channel for reporting risks and serious incidents to the provider. The obligation summary is generated from the knowledge base._

Summary of deployer obligations: {{kb.eu_ai_act.art26.summary}}

Channel for reporting risks, malfunctions and serious incidents to the provider: {{ifu.reporting.channel}} — Expected information: {{ifu.reporting.expected_information}}

## 8. Consistency check against the technical documentation
<!-- basis: Reg. (EU) 2024/1689 Art. 13(2) (correct information); Annex IV point 1 | fill: computed | evidence: required -->
_Computed: each figure and statement is compared with the approved Annex IV documentation; mismatches block approval._

| Item | Value in these instructions | Value in technical documentation | Match? |
|---|---|---|---|
| {{ifu.check[i].item}} | {{ifu.check[i].ifu_value}} | {{ifu.check[i].techdoc_value}} | {{ifu.check[i].match}} |

## Sources and evidence
<!-- basis: internal traceability requirement; Reg. (EU) 2024/1689 Art. 13(2) | fill: computed | evidence: required -->
_Test reports, design documents, risk register entries and technical documentation sections used above._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: Reg. (EU) 2024/1689 Art. 16 (provider obligations); internal HITL policy | fill: user | evidence: required -->
_Released to deployers only after product and regulatory approval of this exact version._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Product Owner (HITL, technical accuracy) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Regulatory Affairs / Compliance | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
