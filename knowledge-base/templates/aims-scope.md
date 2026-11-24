---
id: tpl-aims-scope
title_en: "AI Management System (AIMS) Context and Scope Statement"
title_it: "Contesto e campo di applicazione del sistema di gestione dell'IA (AIMS)"
category: iso-42001
legal_basis: ["ISO/IEC 42001:2023 4.1", "ISO/IEC 42001:2023 4.2", "ISO/IEC 42001:2023 4.3", "ISO/IEC 42001:2023 4.4"]
related_frameworks: ["ISO/IEC 42001:2023 5.2", "ISO/IEC 42001:2023 6.2", "Reg. (EU) 2024/1689 Art. 3", "GDPR Art. 4(7)-(8)", "NIST AI RMF GOVERN 1.1", "NIST AI RMF GOVERN 1.6", "NIST AI RMF MAP 1.1"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: "Top management (ISO/IEC 42001 5.1)"
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

## 1. Organisation and intended purpose of the AIMS
<!-- basis: ISO/IEC 42001 4.1 | fill: rag | evidence: required -->
*Describe the organisation, its purpose and what the AIMS is intended to achieve.*

| Element | Description | Evidence |
|---|---|---|
| Legal entity / entities and locations | {{org.entities}} | {{org.entities.evidence_ref}} |
| Business activities and strategic direction relevant to AI | {{org.activities}} | {{org.activities.evidence_ref}} |
| Intended results of the AIMS | {{aims.intended_results}} | {{aims.intended_results.evidence_ref}} |

## 2. Roles of the organisation with respect to AI systems
<!-- basis: ISO/IEC 42001 4.1 | fill: rag | evidence: required -->
*Determine the organisation's roles for the AI systems it provides, develops or uses (e.g. AI provider, AI producer, AI customer / user, AI partner, AI subject, relevant authority). Record the regulatory role separately; it is determined by law, not by the standard.*

| AI system / use case | ISO role(s) | EU AI Act role | GDPR role | AI Act risk class | Evidence |
|---|---|---|---|---|---|
{{#each aims.ai_inventory}}
| {{name}} | {{iso_roles}} | {{ai_act_role}} | {{gdpr_role}} | {{ai_act_class}} | {{evidence_ref}} |
{{/each}}

## 3. External and internal issues
<!-- basis: ISO/IEC 42001 4.1 | fill: rag | evidence: required -->
*List issues relevant to the organisation's purpose that affect its ability to achieve the intended results of the AIMS. Record explicitly whether climate change is a relevant issue (2024 amendment to management system standards).*

| ID | Issue | Type (external / internal) | Category (legal, policy, ethical, competitive, technological, cultural, governance, contractual, resources) | Effect on the AIMS | Evidence |
|---|---|---|---|---|---|
{{#each aims.issues}}
| {{id}} | {{issue}} | {{type}} | {{category}} | {{effect}} | {{evidence_ref}} |
{{/each}}

Applicable legal requirements, including prohibited uses of AI: {{aims.legal_requirements}} (source: {{kb.legal_register}})
Climate change determined relevant (Y/N) and reasoning: {{aims.climate_change}}

## 4. Interested parties and their requirements
<!-- basis: ISO/IEC 42001 4.2 | fill: rag | evidence: required -->
*Identify interested parties relevant to the AIMS, their relevant requirements and which of those will be addressed through the AIMS.*

| Interested party | Relevant requirements / expectations | Source (law, contract, policy, consultation) | Addressed through the AIMS (Y/N) | How | Evidence |
|---|---|---|---|---|---|
{{#each aims.interested_parties}}
| {{party}} | {{requirements}} | {{source}} | {{addressed}} | {{how}} | {{evidence_ref}} |
{{/each}}

## 5. Scope of the AIMS
<!-- basis: ISO/IEC 42001 4.3 | fill: user | evidence: required -->
*Set the boundaries and applicability, taking into account sections 2 to 4. The scope must be available as documented information; use the statement below unchanged on certificates and in the SoA.*

Scope statement: {{aims.scope_statement}}

| Dimension | In scope | Out of scope | Justification for exclusion | Evidence |
|---|---|---|---|---|
| Organisational units and legal entities | {{scope.org.in}} | {{scope.org.out}} | {{scope.org.justification}} | {{scope.org.evidence_ref}} |
| Locations | {{scope.locations.in}} | {{scope.locations.out}} | {{scope.locations.justification}} | {{scope.locations.evidence_ref}} |
| AI systems, products and services | {{scope.systems.in}} | {{scope.systems.out}} | {{scope.systems.justification}} | {{scope.systems.evidence_ref}} |
| AI life cycle stages | {{scope.lifecycle.in}} | {{scope.lifecycle.out}} | {{scope.lifecycle.justification}} | {{scope.lifecycle.evidence_ref}} |
| Roles covered (from section 2) | {{scope.roles.in}} | {{scope.roles.out}} | {{scope.roles.justification}} | {{scope.roles.evidence_ref}} |

Interfaces and dependencies with activities performed by other organisations (suppliers, model providers, group functions): {{scope.interfaces}}

## 6. The AI management system
<!-- basis: ISO/IEC 42001 4.4 | fill: rag | evidence: required -->
*Show that the AIMS is established, implemented, maintained and continually improved, by pointing to the processes and their documented information.*

| AIMS process | Clause | Owner | Documented information | Evidence |
|---|---|---|---|---|
{{#each aims.processes}}
| {{process}} | {{clause}} | {{owner}} | {{document}} | {{evidence_ref}} |
{{/each}}

Integration with other management systems (e.g. ISO/IEC 27001, ISO 9001): {{aims.integration}}

## 7. Review and change control
<!-- basis: ISO/IEC 42001 6.3; 9.3 | fill: user | evidence: optional -->
*The context and scope are reviewed at management review and when AI systems, roles or legal requirements change.*

Next review: {{review.next_date}} | Change triggers: {{review.triggers}} | Change log: {{review.change_log}}

## Sources and evidence
<!-- basis: ISO/IEC 42001 7.5 | fill: computed | evidence: required -->
*Generated from the retrieval and validation log. Every `[S#]` marker in the document must resolve to exactly one row; rows are frozen when the document is approved.*

| # | Claim / field | Source document | Page / section | Retrieval date | Source hash (SHA-256) | Validated by |
|---|---|---|---|---|---|---|
{{#each citations}}
| {{id}} | {{claim}} | {{source_document}} | {{locator}} | {{retrieved_at}} | {{source_sha256}} | {{validated_by}} |
{{/each}}

## Approval and sign-off
<!-- basis: ISO/IEC 42001 4.3; 5.1 | fill: user | evidence: required -->
*Sign-off refers to the document hash in the control table; any later edit invalidates the approval and creates a new version.*

| Role | Name | Decision (approved / changes requested / rejected) | Date | Signature / audit-trail ID |
|---|---|---|---|---|
| Author | {{doc.author}} | {{approval.author.decision}} | {{approval.author.date}} | {{approval.author.audit_id}} |
| Reviewer ({{approval.reviewer.role}}) | {{approval.reviewer.name}} | {{approval.reviewer.decision}} | {{approval.reviewer.date}} | {{approval.reviewer.audit_id}} |
| Approver ({{doc.approver_role}}) | {{doc.approver}} | {{approval.approver.decision}} | {{approval.approver.date}} | {{approval.approver.audit_id}} |

Approver comments: {{approval.comments}}
