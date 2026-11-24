---
id: tpl-transparency-notices
title_en: AI Transparency Notices (Article 50)
title_it: Informative di trasparenza sull'IA (Articolo 50)
category: eu-ai-act
legal_basis: ["Reg. (EU) 2024/1689 Art. 50(1)", "Reg. (EU) 2024/1689 Art. 50(2)", "Reg. (EU) 2024/1689 Art. 50(3)", "Reg. (EU) 2024/1689 Art. 50(4)", "Reg. (EU) 2024/1689 Art. 50(5)", "Reg. (EU) 2024/1689 Art. 3(60)", "Reg. (EU) 2016/679 Art. 13", "Reg. (EU) 2016/679 Art. 14"]
related_frameworks: ["GDPR Art. 12", "GDPR Art. 13", "GDPR Art. 22", "ISO/IEC 42001 A.8.2", "ISO/IEC 42001 A.8.5", "NIST AI RMF GOVERN 5.1", "NIST AI RMF MEASURE 2.8"]
output_formats: [docx, pdf, md]
hitl_approval: required
approver_role: Legal / Compliance Officer with DPO consultation
version: 1.0.0
provenance: "AI-drafted template (2026-11-24); structure derived from the cited legal provisions; requires review by a qualified professional before use"
---
# {{title}}

| Field | Value |
|---|---|
| Organisation / workspace | {{workspace.name}} |
| AI system | {{ai_system.name}} (inventory ID {{ai_system.id}}, version {{ai_system.version}}) |
| Role of the organisation | {{ai_system.role}} |
| Document version | {{doc.version}} |
| Author | {{doc.author}} |
| Approver | {{doc.approver}} |
| Date | {{doc.date}} |
| Status | {{doc.status}} |
| Document hash (SHA-256) | {{doc.sha256}} |

_Notice texts below are starting points to adapt, not approved legal wording. Text in [square brackets] must be replaced. Obligations apply from {{kb.eu_ai_act.timeline.art50}}; check {{kb.eu_ai_act.art50.guidelines_and_code_of_practice}} for Commission guidelines and the code of practice on marking and labelling._

## 1. Applicability matrix
<!-- basis: Reg. (EU) 2024/1689 Art. 50(1)-(4) | fill: rag | evidence: required -->
_Decide which notices are needed, from the signed risk classification. Exceptions exist in each paragraph (for example where AI interaction is obvious, or uses authorised by law for criminal offences); claim one only with reasoning and the knowledge-base text: {{kb.eu_ai_act.art50.exceptions}}._

| Notice | Paragraph | Obligation on | Applies? | Exception claimed and reasoning | Source |
|---|---|---|---|---|---|
| A. AI interaction disclosure | Art. 50(1) | Provider (design of the system) | {{tn.matrix.a.applies}} | {{tn.matrix.a.exception}} | {{tn.matrix.a.cite}} |
| B. Marking of synthetic content | Art. 50(2) | Provider | {{tn.matrix.b.applies}} | {{tn.matrix.b.exception}} | {{tn.matrix.b.cite}} |
| C. Emotion recognition / biometric categorisation | Art. 50(3) | Deployer | {{tn.matrix.c.applies}} | {{tn.matrix.c.exception}} | {{tn.matrix.c.cite}} |
| D. Deep fake disclosure | Art. 50(4) | Deployer | {{tn.matrix.d.applies}} | {{tn.matrix.d.exception}} | {{tn.matrix.d.cite}} |
| E. AI-generated text on matters of public interest | Art. 50(4) | Deployer | {{tn.matrix.e.applies}} | {{tn.matrix.e.exception}} | {{tn.matrix.e.cite}} |

## 2. Notice A – AI interaction disclosure (chatbots, voice assistants)
<!-- basis: Reg. (EU) 2024/1689 Art. 50(1) | fill: user | evidence: required -->
_Systems intended to interact directly with natural persons must be designed so that the persons are informed they are interacting with an AI system. Show the notice before or at the start of the interaction; attach a screenshot or recording as evidence._

Text chat (short): "You are chatting with an AI assistant, not a human. [It can make mistakes; please check important information.] [To reach a person: {{tn.a.human_contact}}.]"

Voice (spoken at the start of the call): "Hello, this is an automated AI assistant of [organisation]. [You can ask to speak to a person at any time.]"

Email or message signature: "This message was written by an AI assistant on behalf of [organisation]."

| Channel | Final notice text | Where and when displayed | Evidence of implementation |
|---|---|---|---|
| {{tn.a.channels[i].channel}} | {{tn.a.channels[i].text}} | {{tn.a.channels[i].placement}} | {{tn.a.channels[i].evidence}} |

## 3. Notice B – Marking of AI-generated or manipulated content
<!-- basis: Reg. (EU) 2024/1689 Art. 50(2) | fill: rag | evidence: required -->
_Providers of systems generating synthetic audio, image, video or text must ensure outputs are marked in a machine-readable format and detectable as artificially generated or manipulated; the technical solution must be effective, interoperable, robust and reliable as far as technically feasible. This is primarily a technical measure; the visible label is complementary._

| Content type | Machine-readable marking technique (e.g. metadata, watermark, fingerprint) | Standard / specification | Robustness test evidence | Detection method available to third parties | Source |
|---|---|---|---|---|---|
| {{tn.b.content[i].type}} | {{tn.b.content[i].technique}} | {{tn.b.content[i].standard}} | {{tn.b.content[i].test_evidence}} | {{tn.b.content[i].detection}} | {{tn.b.content[i].cite}} |

Optional visible label: "AI-generated" / "Created with AI" / "Edited with AI" — final wording: {{tn.b.visible_label}}

## 4. Notice C – Emotion recognition or biometric categorisation
<!-- basis: Reg. (EU) 2024/1689 Art. 50(3); Reg. (EU) 2016/679 Art. 13 and Art. 9 | fill: user | evidence: required -->
_Deployers must inform the natural persons exposed to the system of its operation and process personal data in accordance with data protection law. Before using this notice, confirm the use is not a prohibited practice under Art. 5 (for example emotion inference in the workplace or education) and has a valid GDPR legal basis._

Art. 5 screening result: {{tn.c.art5_check}} — GDPR legal basis and Art. 9 condition: {{tn.c.gdpr_basis}} — DPIA reference: {{tn.c.dpia_ref}}

Notice text: "In this [area / service] we use an AI system that [recognises emotions from … / assigns people to categories based on biometric data such as …]. Purpose: [purpose]. The system operates [when / where]. Your personal data is processed by [controller] on the basis of [legal basis]; details and your rights: [link to privacy notice]. Questions or objections: {{tn.c.contact}}."

| Location / touchpoint | Final notice text | Format (sign, screen, spoken) | Evidence of implementation |
|---|---|---|---|
| {{tn.c.touchpoints[i].location}} | {{tn.c.touchpoints[i].text}} | {{tn.c.touchpoints[i].format}} | {{tn.c.touchpoints[i].evidence}} |

## 5. Notice D – Deep fake disclosure
<!-- basis: Reg. (EU) 2024/1689 Art. 50(4) and Art. 3(60) | fill: user | evidence: required -->
_Deployers of a system generating or manipulating image, audio or video content constituting a deep fake must disclose that the content has been artificially generated or manipulated. For evidently artistic, creative, satirical, fictional or analogous works, disclosure is limited to an appropriate manner that does not hamper the display or enjoyment of the work._

Standard label (on the content): "This [image / video / audio] was generated or altered using AI."

Caption or description: "Contains AI-generated or AI-manipulated content. [The person shown did not say or do what is depicted.]"

Artistic / satirical works (credits or description): "This work contains AI-generated or AI-manipulated scenes."

| Content item / campaign | Deep fake assessment (definition: {{kb.eu_ai_act.definitions.deep_fake}}) | Final disclosure text | Placement and duration | Evidence of implementation |
|---|---|---|---|---|
| {{tn.d.items[i].name}} | {{tn.d.items[i].assessment}} | {{tn.d.items[i].text}} | {{tn.d.items[i].placement}} | {{tn.d.items[i].evidence}} |

## 6. Notice E – AI-generated text on matters of public interest
<!-- basis: Reg. (EU) 2024/1689 Art. 50(4) | fill: user | evidence: required -->
_Deployers must disclose that text published to inform the public on matters of public interest was artificially generated or manipulated, unless the content has undergone human review or editorial control and a natural or legal person holds editorial responsibility for the publication. If relying on that exception, record the reviewer and the editorially responsible person._

Label: "This text was generated with the help of AI." / "AI-generated text."

| Publication | AI-generated or manipulated? | Human review / editorial control performed by | Editorially responsible person | Label applied or exception relied on | Evidence |
|---|---|---|---|---|---|
| {{tn.e.publications[i].name}} | {{tn.e.publications[i].ai_generated}} | {{tn.e.publications[i].reviewer}} | {{tn.e.publications[i].editor}} | {{tn.e.publications[i].label_or_exception}} | {{tn.e.publications[i].evidence}} |

## 7. Manner, timing and accessibility
<!-- basis: Reg. (EU) 2024/1689 Art. 50(5) | fill: user | evidence: required -->
_Information must be given in a clear and distinguishable manner at the latest at the time of the first interaction or exposure, and must conform to applicable accessibility requirements. Check each notice._

| Notice | Clear and distinguishable (not buried in terms)? | Given at or before first interaction / exposure? | Accessibility (screen reader, contrast, audio alternative, plain language)? | Languages |
|---|---|---|---|---|
| {{tn.manner[i].notice}} | {{tn.manner[i].clear}} | {{tn.manner[i].timing}} | {{tn.manner[i].accessibility}} | {{tn.manner[i].languages}} |

## 8. Interplay with other information duties
<!-- basis: Reg. (EU) 2024/1689 Art. 50(6); Art. 26 and Art. 86; Reg. (EU) 2016/679 Art. 13, Art. 14, Art. 22 | fill: kb | evidence: optional -->
_Art. 50 notices do not replace other transparency duties. Record where related information is given so the notices stay consistent._

| Related duty | Applies? | Where fulfilled (document / link) |
|---|---|---|
| GDPR privacy information, including automated decision-making (Art. 13, 14, 22) | {{tn.interplay.gdpr.applies}} | {{tn.interplay.gdpr.reference}} |
| Information to persons subject to decisions of high-risk Annex III systems (AI Act Art. 26) | {{tn.interplay.art26.applies}} | {{tn.interplay.art26.reference}} |
| Right to explanation of individual decision-making (AI Act Art. 86) | {{tn.interplay.art86.applies}} | {{tn.interplay.art86.reference}} |
| Information to workers and their representatives before workplace use (AI Act Art. 26) | {{tn.interplay.workers.applies}} | {{tn.interplay.workers.reference}} |

## 9. Maintenance
<!-- basis: ISO/IEC 42001 A.8.2 | fill: user | evidence: optional -->
_Notices must be re-checked when the system, channel or law changes._

| Notice owner | Review interval | Change triggers | Next review |
|---|---|---|---|
| {{tn.maintenance.owner}} | {{tn.maintenance.interval}} | {{tn.maintenance.triggers}} | {{tn.maintenance.next_review}} |

## Sources and evidence
<!-- basis: internal traceability requirement | fill: computed | evidence: required -->
_Classification document, screenshots or recordings of deployed notices, marking test reports and legal texts used above._

| # | Claim / field | Source document | Page / section | Retrieval date | Hash (SHA-256) |
|---|---|---|---|---|---|
{{citations}}

## Approval and sign-off
<!-- basis: internal HITL policy; Reg. (EU) 2024/1689 Art. 50 | fill: user | evidence: required -->
_Final notice wording and any exception relied on must be approved by Legal / Compliance before publication._

| Role | Name | Decision | Date | Signature / e-sign reference |
|---|---|---|---|---|
| Prepared by | {{doc.author}} | – | {{signoff.prepared.date}} | {{signoff.prepared.signature}} |
| Consulted: DPO | {{signoff.dpo.name}} | {{signoff.dpo.opinion}} | {{signoff.dpo.date}} | {{signoff.dpo.signature}} |
| Legal / Compliance (HITL) | {{hitl.reviewer}} | {{hitl.decision}} | {{hitl.timestamp}} | {{hitl.audit_log_id}} |
| Approved by | {{doc.approver}} | {{signoff.approved.decision}} | {{signoff.approved.date}} | {{signoff.approved.signature}} |

Reviewer comments: {{hitl.comments}}
