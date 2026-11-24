# Template review notes (2026-11-24)

All 31 templates were drafted by AI from model knowledge. This file records what has been checked and what has not.

## Checked automatically
- Every template's front matter parses and its `id` matches the file name.
- Every ISO/IEC 42001 Annex A control id and every NIST AI RMF subcategory number cited in a template exists in `frameworks/`.
- Every deliverable referenced by a Common Control Objective exists as a template.
- These AI Act references were compared with the 2024 Official Journal text and match: Art. 3 points (12), (23), (49), (56), (60), (63); Art. 6(4); Art. 10(5) (since deleted, see below); Art. 17(1)(m); Art. 25(4); Art. 26(9), 26(11); Art. 27(4); Art. 47(2)–(4); Art. 49(2); Art. 50(6); Art. 72(4); Art. 73(3), (6), (9), (10).

## Checked against Regulation (EU) 2026/1744 (Official Journal text, read 2026-11-24)
- Art. 10(5) is deleted and replaced by new Art. 4a: the bias-audit and RoPA templates now cite Art. 4a.
- Art. 4 (AI literacy) is replaced: the duty is to "take measures to support the development of AI literacy". The literacy plan template takes the wording from the knowledge base (`text_as_amended`).
- Art. 5(1) gains points (ba) and (bb): the classification template has a row for added practices; fill it from the knowledge base.
- Art. 6(4) and Art. 49(2) (registration of systems using the Art. 6(3) derogation) are NOT amended. Annex VIII Section B points 7 and 9 are deleted.
- Art. 27(4) and (5), Art. 11(1), Art. 25(2) and (4), Art. 72(3), Art. 99 are amended; paragraph numbers used in the templates are unchanged.
- Art. 73 is not amended; new Art. 75(1a) sends serious-incident reports to the AI Office for systems under its exclusive competence — the incident template does not yet mention this.

## Not checked — needs a qualified reviewer
- **GDPR and EDPB references**: article and recital paraphrases, WP248 rev.01, WP251 rev.01, EDPB Guidelines 1/2024, Recommendations 01/2020 (six steps, Annex 2) and 02/2020, Opinion 28/2024 (paraphrased).
- **CJEU case numbers** in the Art. 22 template: C-634/21 (SCHUFA), C-203/22 (Dun & Bradstreet Austria).
- **Standard contractual clauses** (Decision (EU) 2021/914): Clauses 9, 14, 15.1 and Annexes I–III.
- **ISO/IEC 42005:2025** clause structure (no clause numbers are cited), ISO/IEC 17050-1, and paraphrases of ISO/IEC 42001 clauses 4.1, 6.1.3, 9.3.
- **Nonconformity grading** (major / minor / observation / OFI): certification practice, not defined in ISO/IEC 42001.
- **NIST maturity scale 0–5**: defined by this application; NIST AI RMF defines no maturity levels.
- **EU Charter article numbers** listed in the FRIA.
- **Art. 50 notice texts**: original drafting, to be adapted.

## Placeholder conventions
- Handlebars style: `{{a.b}}`, `{{#each x}}…{{/each}}`, repeating rows as `{{list[i].field}}`.
- Each `##` section has `<!-- basis: … | fill: rag|user|computed|kb | evidence: required|optional -->`; `fill` is a single value naming the primary source.
- Sign-off placeholders: `{{hitl.reviewer}}`, `{{hitl.decision}}`, `{{hitl.timestamp}}`, `{{hitl.audit_log_id}}`, `{{signoff.*}}`; document hash `{{doc.sha256}}`.
