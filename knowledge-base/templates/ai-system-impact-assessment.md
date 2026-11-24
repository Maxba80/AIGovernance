---
id: tpl-ai-system-impact-assessment
title_en: "AI System Impact Assessment (AISIA)"
title_it: "Valutazione d'impatto del sistema di IA (AISIA)"
category: iso-42001
legal_basis: ["ISO/IEC 42001:2023 6.1.4", "ISO/IEC 42001:2023 8.4", "ISO/IEC 42001:2023 A.5.2", "ISO/IEC 42001:2023 A.5.3", "ISO/IEC 42001:2023 A.5.4", "ISO/IEC 42001:2023 A.5.5"]
related_frameworks: ["ISO/IEC 42005:2025", "Reg. (EU) 2024/1689 Art. 27", "GDPR Art. 35", "NIST AI RMF MAP 5.1", "NIST AI RMF MAP 5.2", "NIST AI RMF MAP 1.1"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "AI system owner; AIMS manager as reviewer"
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited provisions; requires review by a qualified professional before use"
---
# {{title}}
| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} ({{ai_system.id}}) |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} ({{doc.approver_role}}) |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

> Traceability rule: every filled value carries a citation marker `[S#]` that resolves to one row of "Sources and evidence". Values with no source are rendered as `{{flag.unsourced}}` and block approval.

> Structure note: sections follow the documentation topics of ISO/IEC 42005:2025 as understood by the template author; no clause numbers of ISO/IEC 42005 are cited. Verify against the licensed text: {{kb.iso42005.structure}}.

## 1. Assessment scope and trigger
<!-- basis: ISO/IEC 42001 6.1.4; 8.4; A.5.2 | fill: user | evidence: required -->
*The assessment covers potential consequences for individuals, groups of individuals and societies from the development, provision or use of the AI system. It is performed at planned intervals and when significant changes occur.*

| Element | Value | Evidence |
|---|---|---|
| Trigger (new system / periodic / significant change / incident) | {{aisia.trigger}} | {{aisia.trigger.evidence_ref}} |
| Life cycle stage at assessment | {{aisia.lifecycle_stage}} | {{aisia.lifecycle_stage.evidence_ref}} |
| Organisation's role for this system | {{aisia.role}} | {{aisia.role.evidence_ref}} |
| Assessors and persons consulted | {{aisia.team}} | {{aisia.team.evidence_ref}} |
| Related assessments (AI risk assessment, DPIA, FRIA) | {{aisia.related}} | {{aisia.related.evidence_ref}} |

## 2. AI system information
<!-- basis: ISO/IEC 42001 6.1.4; A.5.3; ISO/IEC 42005:2025 | fill: rag | evidence: required -->
*Describe the system precisely enough for a reader outside the project to understand what it does and where.*

| Element | Description | Evidence |
|---|---|---|
| Intended purpose and intended uses | {{system.intended_purpose}} | {{system.intended_purpose.evidence_ref}} |
| Functionality, capabilities and limitations | {{system.functionality}} | {{system.functionality.evidence_ref}} |
| Algorithms and models (type, provider, version) | {{system.models}} | {{system.models.evidence_ref}} |
| Data used (training, validation, test, operational; personal data) | {{system.data}} | {{system.data.evidence_ref}} |
| Technical and societal deployment context (sector, geography, users) | {{system.context}} | {{system.context.evidence_ref}} |
| Degree of automation and human oversight | {{system.automation}} | {{system.automation.evidence_ref}} |

## 3. Foreseeable misuse and unintended use
<!-- basis: ISO/IEC 42001 6.1.4; ISO/IEC 42005:2025 | fill: user | evidence: required -->
*Consider the intended purpose together with reasonably foreseeable misuse, system failures and uses outside the intended context.*

| Scenario | Type (misuse / failure / out-of-context use) | Who is affected | Evidence |
|---|---|---|---|
{{#each aisia.misuse_scenarios}}
| {{scenario}} | {{type}} | {{affected}} | {{evidence_ref}} |
{{/each}}

## 4. Relevant interested parties
<!-- basis: ISO/IEC 42001 6.1.4; A.5.4; A.5.5 | fill: rag | evidence: required -->
*Identify individuals and groups directly or indirectly affected, including those who do not interact with the system, and note vulnerable groups. Record how their views were obtained.*

| Party / group | Relationship to the system | Vulnerability factors | Consulted (how / when) | Evidence |
|---|---|---|---|---|
{{#each aisia.interested_parties}}
| {{party}} | {{relationship}} | {{vulnerability}} | {{consultation}} | {{evidence_ref}} |
{{/each}}

## 5. Impacts on individuals and groups of individuals
<!-- basis: ISO/IEC 42001 6.1.4; A.5.4 | fill: user | evidence: required -->
*Assess actual and potential benefits and harms across the life cycle. Suggested dimensions are pre-filled; add or mark not applicable with a reason. Scale: {{kb.impact_scale}}.*

| ID | Dimension | Benefit / harm description | Affected group | Likelihood (1-5) | Severity (1-5) | Reversibility | Level | Evidence |
|---|---|---|---|---|---|---|---|---|
| I-01 | Fairness and non-discrimination | {{impact.i01.description}} | {{impact.i01.group}} | {{impact.i01.l}} | {{impact.i01.s}} | {{impact.i01.reversibility}} | {{impact.i01.level}} | {{impact.i01.evidence_ref}} |
| I-02 | Privacy and data protection | {{impact.i02.description}} | {{impact.i02.group}} | {{impact.i02.l}} | {{impact.i02.s}} | {{impact.i02.reversibility}} | {{impact.i02.level}} | {{impact.i02.evidence_ref}} |
| I-03 | Safety, health and well-being | {{impact.i03.description}} | {{impact.i03.group}} | {{impact.i03.l}} | {{impact.i03.s}} | {{impact.i03.reversibility}} | {{impact.i03.level}} | {{impact.i03.evidence_ref}} |
| I-04 | Autonomy, transparency and explainability | {{impact.i04.description}} | {{impact.i04.group}} | {{impact.i04.l}} | {{impact.i04.s}} | {{impact.i04.reversibility}} | {{impact.i04.level}} | {{impact.i04.evidence_ref}} |
| I-05 | Accountability and access to redress | {{impact.i05.description}} | {{impact.i05.group}} | {{impact.i05.l}} | {{impact.i05.s}} | {{impact.i05.reversibility}} | {{impact.i05.level}} | {{impact.i05.evidence_ref}} |
| I-06 | Economic and employment situation; access to services | {{impact.i06.description}} | {{impact.i06.group}} | {{impact.i06.l}} | {{impact.i06.s}} | {{impact.i06.reversibility}} | {{impact.i06.level}} | {{impact.i06.evidence_ref}} |
{{#each impacts.individual_additional}}
| {{id}} | {{dimension}} | {{description}} | {{group}} | {{l}} | {{s}} | {{reversibility}} | {{level}} | {{evidence_ref}} |
{{/each}}

## 6. Societal impacts
<!-- basis: ISO/IEC 42001 6.1.4; A.5.5 | fill: user | evidence: required -->
*Assess wider effects, positive and negative, beyond the directly affected persons.*

| ID | Dimension | Description | Scale of effect | Level | Evidence |
|---|---|---|---|---|---|
| S-01 | Environment and resource use | {{impact.s01.description}} | {{impact.s01.scale}} | {{impact.s01.level}} | {{impact.s01.evidence_ref}} |
| S-02 | Information ecosystem and democratic processes | {{impact.s02.description}} | {{impact.s02.scale}} | {{impact.s02.level}} | {{impact.s02.evidence_ref}} |
| S-03 | Labour market and economy | {{impact.s03.description}} | {{impact.s03.scale}} | {{impact.s03.level}} | {{impact.s03.evidence_ref}} |
| S-04 | Culture, norms and social cohesion | {{impact.s04.description}} | {{impact.s04.scale}} | {{impact.s04.level}} | {{impact.s04.evidence_ref}} |
{{#each impacts.societal_additional}}
| {{id}} | {{dimension}} | {{description}} | {{scale}} | {{level}} | {{evidence_ref}} |
{{/each}}

## 7. Measures to address harms and realise benefits
<!-- basis: ISO/IEC 42001 6.1.4; 6.1.3; A.5.3 | fill: rag | evidence: required -->
*List measures per impact and the remaining level after the measure. Measures that are risk controls must also appear in the risk treatment plan.*

| Impact ID | Measure | Owner | Status | Remaining level | Risk treatment ref | Evidence |
|---|---|---|---|---|---|---|
{{#each aisia.measures}}
| {{impact_id}} | {{measure}} | {{owner}} | {{status}} | {{remaining_level}} | {{treatment_ref}} | {{evidence_ref}} |
{{/each}}

## 8. Result and use in the risk assessment
<!-- basis: ISO/IEC 42001 6.1.4; 6.1.2; 8.4 | fill: user | evidence: required -->
*State the overall conclusion and how the result was considered in the AI risk assessment. Results are retained as documented information and, where appropriate, made available to interested parties.*

Overall conclusion: {{aisia.conclusion}} | Decision (proceed / proceed with conditions / do not proceed): {{aisia.decision}}
Risk register entries created or updated: {{aisia.risk_refs}} | Information shared with interested parties: {{aisia.disclosure}}

## 9. Review
<!-- basis: ISO/IEC 42001 8.4 | fill: user | evidence: optional -->
*Set the next planned review and the change triggers (model change, new use, new affected group, incident).*

Next review: {{review.next_date}} | Triggers: {{review.triggers}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 6.1.4; 8.4 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
