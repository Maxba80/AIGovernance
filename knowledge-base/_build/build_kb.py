#!/usr/bin/env python3
"""Builds the structured Knowledge Base from the raw sources.

Every output file carries a `_meta` block (source ids, licence, extraction
method, verification level) so each record is traceable to its origin.
Run: python3 _build/build_kb.py <atlas_kg_dir> <iso42001_layout_txt> <study_guide_html>
"""
import hashlib, html, json, os, re, sys, datetime
import yaml, openpyxl

KB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(KB, "sources", "raw")
ATLAS, ISO_TXT, GUIDE_HTML = sys.argv[1:4]
TODAY = "2026-11-24"
REPORT = []
AMENDMENTS = []


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def out(rel, meta, data):
    path = os.path.join(KB, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    meta = {"kb_file": rel, "generated": TODAY, **meta}
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"_meta": meta, **data}, f, ensure_ascii=False, indent=1, default=str)
    n = {k: len(v) for k, v in data.items() if isinstance(v, list)}
    REPORT.append((rel, n))


def clean(s):
    return re.sub(r"\s+", " ", s or "").strip()


def parse_omnibus():
    """Regulation (EU) 2026/1744, Article 1: amendment points to Regulation (EU) 2024/1689 (verbatim)."""
    t = open(os.path.join(KB, "_build", "cache", "reg_2026_1744.txt"), encoding="utf-8").read()
    a = t.index("\nArticle 1\nAmendments to Regulation (EU) 2024/1689")
    b = t.index("\nArticle 2\n", a)
    body = t[a:b]
    marks, last = [], 0
    for m in re.finditer(r"(?m)^\((\d+)\) ", body):
        if int(m.group(1)) == last + 1:
            marks.append(m)
            last += 1
    points = []
    for i, m in enumerate(marks):
        txt = body[m.start():marks[i + 1].start() if i + 1 < len(marks) else len(body)].strip()
        head = txt.split("\n")[0]
        targets = ["AIA-Art." + x for x in re.findall(r"Article (\d+)", head)] + ["AIA-Annex." + x for x in re.findall(r"Annex ([IVX]+)", head)]
        inserted = []
        heads = list(re.finditer(r"(?m)^‘?Article (\d+[a-z]+)\n", txt))
        for k, h in enumerate(heads):
            seg = txt[h.end():heads[k + 1].start() if k + 1 < len(heads) else len(txt)].split("\n")
            nt = 2 if len(seg[0]) >= 85 else 1  # wrapped title
            inserted.append({"number": h.group(1), "title": clean(" ".join(seg[:nt])),
                             "text": "\n".join(seg[nt:]).strip().rstrip("’;").strip()})
        points.append({"n": int(m.group(1)), "head": head, "targets": targets[:1] if targets else [], "text": txt, "inserted": inserted})
    assert len(points) == 43, len(points)
    return points


def build_gdpr_full():
    txt = open(os.path.join(KB, "_build", "cache", "gdpr_raw.txt"), encoding="utf-8").read().replace("\x0c", "\n")
    lines = [l for l in txt.split("\n") if not re.match(r"^(4\.5\.2016|EN|Official Journal of the European Union|L 119/\d+)\s*$", l.strip())]
    start = next(i for i, l in enumerate(lines) if l.strip() == "CHAPTER I")
    arts, cur, chapter, last = [], None, None, 0
    i = start
    while i < len(lines):
        l = lines[i].strip()
        nxt = next((x.strip() for x in lines[i + 1:i + 5] if x.strip()), "")
        if re.match(r"^CHAPTER [IVX]+$", l) and last < 99:
            chapter, cur = l + " — " + nxt, None
        elif re.match(r"^Section \d+$", l):
            cur = None
        elif re.match(r"^Article \d+$", l) and int(l.split()[1]) == last + 1:
            last += 1
            j = i + 1
            while not lines[j].strip():
                j += 1
            title = lines[j].strip()
            while len(lines[j].strip()) >= 85 and not re.match(r"^\d+\.$", lines[j + 1].strip()):  # wrapped title
                j += 1
                title += " " + lines[j].strip()
            cur = {"id": f"GDPR-Art.{last}", "number": last, "title": title, "chapter": chapter, "body": [],
                   "citation": f"Regulation (EU) 2016/679, Article {last}"}
            arts.append(cur)
            i = j + 1
            continue
        elif cur is not None:
            cur["body"].append(lines[i])
        i += 1
    assert len(arts) == 99, len(arts)
    for a in arts:
        body = re.sub(r"\n{2,}", "\n\n", "\n".join(a.pop("body"))).strip()
        if a["number"] == 99:
            body = body.split("Done at Brussels")[0].strip()
        a["text"] = body
    out("frameworks/gdpr/articles.json", {
        "source_ids": ["gdpr-2016-679"], "licence": "EU legal text, reuse permitted (Decision 2011/833/EU)",
        "extraction": "automatic (pdftotext) from the Official Journal PDF of 4.5.2016; verbatim text of the 99 articles (recitals not included)",
        "verification": "primary source read; structure checked (99 articles in sequence). Original 2016 text: corrigenda published later are not applied.",
        "language": "en"}, {"articles": arts})
    return {a["number"]: a for a in arts}


# ---------------------------------------------------------------- EU AI Act
def build_ai_act():
    txt = open(os.path.join(KB, "_build", "cache", "eu_ai_act_raw.txt"), encoding="utf-8").read()
    txt = txt.replace("\x0c", "\n")
    lines = [l for l in txt.split("\n")
             if not re.match(r"^(ELI: http\S+|\d+/144|EN|OJ L, 12\.7\.2024)\s*$", l.strip())]
    start = next(i for i, l in enumerate(lines) if l.strip() == "CHAPTER I")
    head = re.compile(r"^(CHAPTER [IVX]+|SECTION \d+|Article \d+|ANNEX [IVX]+)$")
    items, cur = [], None
    chapter = section = None
    last_art = 0
    i = start
    while i < len(lines):
        l = lines[i].strip()
        m = head.match(l)
        if m and l.startswith("Article "):
            if int(l.split()[1]) == last_art + 1:
                last_art += 1
            else:
                m = None  # a line break inside running text, not a heading
        if m and l.startswith(("CHAPTER", "SECTION")) and last_art >= 113:
            m = None
        if m:
            nxt = next((x.strip() for x in lines[i + 1:i + 4] if x.strip()), "")
            kind = l.split()[0]
            if kind == "CHAPTER":
                chapter, section = {"id": l, "title": nxt}, None
                cur = None
            elif kind == "SECTION":
                section = {"id": l, "title": nxt}
                cur = None
            else:
                cur = {"kind": "article" if kind == "Article" else "annex", "ref": l, "title": nxt,
                       "chapter": chapter if kind == "Article" else None,
                       "section": section if kind == "Article" else None, "body": []}
                items.append(cur)
            # skip the title line
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            i = j + 1
            continue
        if cur is not None:
            cur["body"].append(lines[i])
        i += 1
    arts, annexes = [], []
    for it in items:
        body = "\n".join(it["body"])
        body = re.sub(r"\n{2,}", "\n\n", body).strip()
        if it["kind"] == "article":
            n = int(it["ref"].split()[1])
            if n == 113:  # cut the signature block
                body = body.split("Done at Brussels")[0].strip()
            arts.append({"id": f"AIA-Art.{n}", "number": n, "title": it["title"],
                         "chapter": it["chapter"]["id"] + " — " + it["chapter"]["title"],
                         "section": (it["section"]["id"] + " — " + it["section"]["title"]) if it["section"] else None,
                         "text": body, "citation": f"Regulation (EU) 2024/1689, Article {n}"})
        else:
            r = it["ref"].split()[1]
            annexes.append({"id": f"AIA-Annex.{r}", "number": r, "title": it["title"], "text": body,
                            "citation": f"Regulation (EU) 2024/1689, Annex {r}"})
    assert [a["number"] for a in arts] == list(range(1, 114)), "article sequence broken"
    assert len(annexes) == 13, len(annexes)
    by = {x["id"]: x for x in arts + annexes}
    ACT = "Regulation (EU) 2026/1744"
    amendments, new_arts = [], []
    for p in parse_omnibus():
        ref = f"{ACT}, Article 1({p['n']})"
        amendments.append({"id": f"AIA-AMD-2026-1744-{p['n']}", "point": p["n"], "targets": p["targets"] + ["AIA-Art." + x["number"] for x in p["inserted"]],
                           "instruction": p["text"], "citation": ref})
        for tid in p["targets"]:
            if tid in by:
                by[tid].setdefault("amendments", []).append({"act": ACT, "citation": ref, "amendment_id": f"AIA-AMD-2026-1744-{p['n']}"})
                m = re.match(r"\(\d+\) Article (\d+) is replaced by the following:\n‘Article \d+\n(.*?)\n(.*)", p["text"], flags=re.S)
                if m:
                    by[tid]["title_as_amended"] = clean(m.group(2))
                    by[tid]["text_as_amended"] = m.group(3).strip().rstrip("’;").strip()
        for x in p["inserted"]:
            new_arts.append({"id": "AIA-Art." + x["number"], "number": x["number"], "title": x["title"], "chapter": None, "section": None,
                             "text": x["text"], "inserted_by": ref, "citation": f"Regulation (EU) 2024/1689, Article {x['number']} (inserted by {ACT})"})
    for x in arts + annexes:
        x["status"] = "amended by Regulation (EU) 2026/1744 — see `amendments`" if x.get("amendments") else "original text in force"
    arts += new_arts
    if "Annex XIV" in open(os.path.join(KB, "_build", "cache", "reg_2026_1744.txt"), encoding="utf-8").read():
        annexes.append({"id": "AIA-Annex.XIV", "number": "XIV", "title": "Codes, categories and types of AI systems for notified body designation (added by Regulation (EU) 2026/1744)",
                        "text": None, "inserted_by": f"{ACT}, Article 1(43)", "citation": "Regulation (EU) 2024/1689, Annex XIV", "status": "added by Regulation (EU) 2026/1744 — text in the amendment record"})
    AMENDMENTS.extend(amendments)
    out("frameworks/eu_ai_act/articles.json", {
        "source_ids": ["eu-ai-act-2024-1689-oj"], "licence": "EU legal text, reuse permitted (Decision 2011/833/EU)",
        "extraction": "automatic (pdftotext) from the Official Journal PDF; verbatim text",
        "verification": "primary source read; structure checked (113 articles, 13 annexes)",
        "source_ids_amendments": ["eu-reg-2026-1744"],
        "warning": "NOT A CONSOLIDATED VERSION. `text` is the original 2024 wording. Articles changed by Regulation (EU) 2026/1744 carry "
                   "`status` and an `amendments` list pointing to the verbatim amending instruction in `amendments_2026_1744`. "
                   "`text_as_amended` is given only where a whole article was replaced (Art. 4). Inserted articles (4a, 60a, 75a) are included with `inserted_by`.",
        "language": "en"}, {"articles": arts, "annexes": annexes, "amendments_2026_1744": AMENDMENTS})
    return {a["id"] for a in arts} | {a["id"] for a in annexes}


AIA_OVERLAY = {
 "risk_classes": [
  {"id": "prohibited", "label_en": "Prohibited practice", "label_it": "Pratica vietata", "basis": ["AIA-Art.5"]},
  {"id": "high-risk-annex-i", "label_en": "High-risk (product safety, Annex I)", "label_it": "Alto rischio (sicurezza prodotti, Allegato I)", "basis": ["AIA-Art.6", "AIA-Annex.I"]},
  {"id": "high-risk-annex-iii", "label_en": "High-risk (stand-alone, Annex III)", "label_it": "Alto rischio (Allegato III)", "basis": ["AIA-Art.6", "AIA-Annex.III"]},
  {"id": "limited-transparency", "label_en": "Limited risk (transparency obligations)", "label_it": "Rischio limitato (obblighi di trasparenza)", "basis": ["AIA-Art.50"]},
  {"id": "minimal", "label_en": "Minimal risk", "label_it": "Rischio minimo", "basis": ["AIA-Art.95"]},
  {"id": "gpai", "label_en": "General-purpose AI model", "label_it": "Modello di IA per finalità generali", "basis": ["AIA-Art.51", "AIA-Art.53"]},
  {"id": "gpai-systemic", "label_en": "GPAI model with systemic risk", "label_it": "Modello GPAI con rischio sistemico", "basis": ["AIA-Art.51", "AIA-Art.55"]}],
 "classification_decision_tree": [
  {"step": 1, "question": "Is it an 'AI system' (Art. 3(1)) or a GPAI model (Art. 3(63)) within the scope of Art. 2, and no exclusion of Art. 2 applies?", "basis": ["AIA-Art.2", "AIA-Art.3"], "no": "out-of-scope", "yes": 2},
  {"step": 2, "question": "Does the use fall under any prohibited practice of Art. 5?", "basis": ["AIA-Art.5"], "yes": "prohibited", "no": 3},
  {"step": 3, "question": "Is the system a safety component of a product, or itself a product, covered by Annex I legislation AND subject to third-party conformity assessment under that legislation? (See Art. 6(1a)-(1c), inserted in 2026: components used only for non-safety aspects are not safety components.)", "basis": ["AIA-Art.6", "AIA-Annex.I"], "yes": "high-risk-annex-i", "no": 4},
  {"step": 4, "question": "Is the system used in one of the areas and use cases listed in Annex III?", "basis": ["AIA-Art.6", "AIA-Annex.III"], "yes": 5, "no": 6},
  {"step": 5, "question": "Does a derogation of Art. 6(3) apply (narrow procedural task, improving a completed human activity, detecting decision patterns, preparatory task) AND the system does NOT perform profiling of natural persons?", "basis": ["AIA-Art.6"], "yes": "not high-risk — document the assessment (Art. 6(4)) and register (Art. 49(2)); continue at step 6", "no": "high-risk-annex-iii"},
  {"step": 6, "question": "Does the system interact with natural persons, generate synthetic content, perform emotion recognition / biometric categorisation, or produce deep fakes?", "basis": ["AIA-Art.50"], "yes": "limited-transparency", "no": "minimal"},
  {"step": 7, "question": "Independently of steps 2–6: is the organisation the provider of a GPAI model? If yes, does it meet the systemic-risk criteria of Art. 51?", "basis": ["AIA-Art.51", "AIA-Art.53", "AIA-Art.55"], "yes": "gpai / gpai-systemic", "no": "n/a"}],
 "hitl_gate": "The final class is always confirmed by a human (HITL) and recorded in the audit log with the rationale.",
 "roles": [
  {"id": "provider", "label_it": "Fornitore", "definition": "AIA-Art.3", "obligations": ["AIA-Art.16", "AIA-Art.17", "AIA-Art.18", "AIA-Art.19", "AIA-Art.20", "AIA-Art.21", "AIA-Art.9", "AIA-Art.10", "AIA-Art.11", "AIA-Art.12", "AIA-Art.13", "AIA-Art.14", "AIA-Art.15", "AIA-Art.43", "AIA-Art.47", "AIA-Art.48", "AIA-Art.49", "AIA-Art.72", "AIA-Art.73", "AIA-Art.4", "AIA-Art.50"]},
  {"id": "deployer", "label_it": "Deployer (utilizzatore)", "definition": "AIA-Art.3", "obligations": ["AIA-Art.26", "AIA-Art.27", "AIA-Art.4", "AIA-Art.50", "AIA-Art.86", "AIA-Art.49"]},
  {"id": "importer", "label_it": "Importatore", "definition": "AIA-Art.3", "obligations": ["AIA-Art.23"]},
  {"id": "distributor", "label_it": "Distributore", "definition": "AIA-Art.3", "obligations": ["AIA-Art.24"]},
  {"id": "authorised-representative", "label_it": "Rappresentante autorizzato", "definition": "AIA-Art.3", "obligations": ["AIA-Art.22", "AIA-Art.54"]},
  {"id": "gpai-provider", "label_it": "Fornitore di modello GPAI", "definition": "AIA-Art.3", "obligations": ["AIA-Art.53", "AIA-Art.54", "AIA-Art.55", "AIA-Annex.XI", "AIA-Annex.XII"]}],
 "role_change_rule": {"basis": ["AIA-Art.25"], "note": "A distributor, importer, deployer or other third party becomes a provider when it rebrands, substantially modifies, or changes the intended purpose of a high-risk system."},
 "timeline": {
  "original_regulation_art_113": {"verification": "primary source read (Art. 113)", "entries": [
   {"date": "2024-08-01", "what": "Entry into force"},
   {"date": "2025-02-02", "what": "Chapters I and II apply (general provisions incl. AI literacy Art. 4; prohibited practices Art. 5)"},
   {"date": "2025-08-02", "what": "Chapter III Section 4, Chapter V (GPAI), Chapter VII, Chapter XII and Art. 78 apply (penalties except Art. 101)"},
   {"date": "2026-08-02", "what": "General date of application (incl. Annex III high-risk obligations and Art. 50 in the original text)"},
   {"date": "2027-08-02", "what": "Art. 6(1) and corresponding obligations (Annex I high-risk) in the original text"}]},
  "as_amended_by_reg_2026_1744": {
   "verification": "primary source read: Regulation (EU) 2026/1744 (OJ L, 24.7.2026), Article 1(39), 1(40) and Article 4",
   "entries": [
    {"date": "2025-02-02", "what": "Chapters I and II apply (unchanged), except the new prohibitions below", "basis": "Art. 113(a) as amended"},
    {"date": "2025-08-02", "what": "GPAI obligations, governance, penalties (unchanged)", "basis": "Art. 113(b)"},
    {"date": "2026-07-27", "what": "Entry into force of Regulation (EU) 2026/1744 (third day after publication on 24.7.2026); Articles 102 to 110 apply", "basis": "2026/1744 Art. 4; Art. 113(d)"},
    {"date": "2026-08-02", "what": "General date of application, incl. Art. 50 transparency obligations (unchanged)", "basis": "Art. 113, second paragraph"},
    {"date": "2026-12-02", "what": "New prohibitions of Art. 5(1)(ba) and (bb) with Art. 5(1a) and (1b) apply; providers of generative AI systems placed on the market before 2 Aug 2026 must comply with Art. 50(2)", "basis": "Art. 113(a) and Art. 111(4) as amended"},
    {"date": "2027-08-02", "what": "National AI regulatory sandboxes operational; Commission delegated acts under Art. 2(13) due", "basis": "Art. 57(1) and Art. 2(13) as amended"},
    {"date": "2027-09-02", "what": "Commission guidance and template for the post-market monitoring plan due", "basis": "Art. 72(3) as amended"},
    {"date": "2027-12-02", "what": "Chapter III Sections 1-3 apply to high-risk AI systems under Art. 6(2) and Annex III", "basis": "Art. 113(c)(i) as amended"},
    {"date": "2028-01-28", "what": "Notified bodies under Annex I Section A legislation must apply for designation", "basis": "Art. 43(3) as amended"},
    {"date": "2028-08-02", "what": "Chapter III Sections 1-3 apply to high-risk AI systems under Art. 6(1) and Annex I", "basis": "Art. 113(c)(ii) as amended"},
    {"date": "2030-08-02", "what": "High-risk AI systems intended for public authorities placed on the market before application must comply", "basis": "Art. 111(2) as amended"}],
   "key_changes": [
    {"article": "AIA-Art.4", "change": "AI literacy: providers and deployers 'shall take measures to support the development of AI literacy'; no duty to guarantee a specific level for any individual"},
    {"article": "AIA-Art.4a", "change": "New article on processing special categories of personal data for bias detection and correction; replaces Art. 10(5), which is deleted, and extends the possibility to other AI systems and to deployers under the same safeguards"},
    {"article": "AIA-Art.5", "change": "New prohibited practices (ba) non-consensual intimate or sexually explicit content of identifiable persons and (bb) child sexual abuse material, with conditions in (1a) and (1b)"},
    {"article": "AIA-Art.6", "change": "New paragraphs 1a-1c narrowing what counts as a safety component and as third-party conformity assessment"},
    {"article": "AIA-Art.11", "change": "Simplified technical documentation form extended to small mid-caps (SMCs)"},
    {"article": "AIA-Art.25", "change": "Initial provider must cooperate with the new provider; written agreement in 25(4) now also covers AI models"},
    {"article": "AIA-Art.27", "change": "FRIA may cross-reference or include the relevant parts of the DPIA; AI Office template to allow this"},
    {"article": "AIA-Art.75", "change": "AI Office exclusively competent for AI systems based on a GPAI model of the same provider and for systems integrated in very large online platforms or search engines, with listed exceptions"},
    {"article": "AIA-Art.99", "change": "SMEs' and SMCs' interests to be taken into account; for SMCs each fine is capped at the lower of the percentage or the amount; breaches of Art. 25(2) and (4) added to Art. 99(4)"}]}},
 "penalties_original_art_99": {"verification": "primary source read (Art. 99 and its amendment by 2026/1744 Art. 1(38)): amounts unchanged; for SMEs and SMCs each fine is the lower of the percentage or the amount (Art. 99(6) and new 6a)", "tiers": [
  {"infringement": "Prohibited practices (Art. 5)", "max_eur": 35000000, "max_turnover_pct": 7},
  {"infringement": "Other operator obligations (Art. 99(4))", "max_eur": 15000000, "max_turnover_pct": 3},
  {"infringement": "Incorrect, incomplete or misleading information to authorities", "max_eur": 7500000, "max_turnover_pct": 1}],
  "gpai": {"basis": "AIA-Art.101", "max_eur": 15000000, "max_turnover_pct": 3}},
 "guidance_register": [
  {"title": "Commission Guidelines on prohibited AI practices (Art. 5)", "date": "2025-02-04", "status": "adopted", "verification": "model knowledge, not re-checked"},
  {"title": "Commission Guidelines on the definition of an AI system", "date": "2025-02-06", "status": "adopted", "verification": "model knowledge, not re-checked"},
  {"title": "General-Purpose AI Code of Practice (Transparency, Copyright, Safety & Security chapters)", "date": "2025-07-10", "status": "final", "verification": "confirmed via IBM ai-atlas-nexus dataset metadata"},
  {"title": "Commission Guidelines on obligations for providers of GPAI models", "date": "2025-07-18", "status": "adopted", "verification": "model knowledge, not re-checked"},
  {"title": "Template for the public summary of training content (Art. 53(1)(d))", "date": "2025-07-24", "status": "adopted", "verification": "model knowledge, not re-checked"},
  {"title": "Code of Practice on transparency of AI-generated content", "date": "2026-06-10", "status": "final (voluntary)", "verification": "official site search hit; date from secondary source", "url": "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content"},
  {"title": "Commission Guidelines on transparency obligations (Art. 50), C(2026) 5054", "date": "2026-07-20", "status": "adopted", "verification": "official site search hit", "url": "https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems"},
  {"title": "Guidelines on high-risk classification (Art. 6)", "date": "2026-05-19", "status": "DRAFT", "verification": "secondary"},
  {"title": "Guidance on serious incident reporting (Art. 73)", "date": "2025-09-26", "status": "DRAFT", "verification": "secondary"},
  {"title": "AI Office FRIA template (Art. 27(5))", "date": None, "status": "NOT PUBLISHED", "verification": "secondary"},
  {"title": "EN 18286:2026 Quality management system for EU AI Act regulatory purposes (cited by Implementing Decision (EU) 2026/2274)", "date": "2026-10-14", "status": "harmonised standard cited in OJ (reported)", "verification": "secondary"}]}

# ---------------------------------------------------------------- GDPR (structured index, text pending)
GDPR = [
 (5, "Principles relating to processing of personal data", "Lawfulness, fairness, transparency, purpose limitation, minimisation, accuracy, storage limitation, integrity/confidentiality and accountability apply to training data, prompts, outputs and logs."),
 (6, "Lawfulness of processing", "A legal basis is needed for each AI processing purpose (training, fine-tuning, inference); legitimate interest requires a LIA."),
 (9, "Processing of special categories of personal data", "Special-category data in training sets or inferred by models; link to AI Act Art. 10(5) bias-detection exception."),
 (12, "Transparent information, communication and modalities", "Form and timing of information on AI-supported processing."),
 (13, "Information to be provided where personal data are collected from the data subject", "Includes existence of automated decision-making and meaningful information about the logic involved."),
 (14, "Information to be provided where personal data have not been obtained from the data subject", "Relevant for scraped or third-party training data."),
 (15, "Right of access by the data subject", "Access to data and to information on automated decision-making logic."),
 (16, "Right to rectification", "Rectifying inaccurate personal data, including inaccurate model outputs about a person."),
 (17, "Right to erasure ('right to be forgotten')", "Erasure requests versus data embedded in trained models."),
 (21, "Right to object", "Objection to processing based on legitimate interest, including AI training."),
 (22, "Automated individual decision-making, including profiling", "Right not to be subject to solely automated decisions with legal or similarly significant effects; safeguards and human intervention."),
 (24, "Responsibility of the controller", "Accountability measures, policies, review and update."),
 (25, "Data protection by design and by default", "Privacy engineering in AI design: minimisation, pseudonymisation, default settings."),
 (26, "Joint controllers", "Shared determination of purposes between organisations and AI providers."),
 (28, "Processor", "AI/LLM vendors acting as processors; DPA content and sub-processors."),
 (30, "Records of processing activities", "RoPA entries for AI processing, including recipients and transfers to model providers."),
 (32, "Security of processing", "Security measures for AI pipelines, model endpoints, prompts and logs."),
 (33, "Notification of a personal data breach to the supervisory authority", "Breach notification; coordinate with AI Act serious-incident reporting."),
 (34, "Communication of a personal data breach to the data subject", "Communication to individuals after high-risk breaches."),
 (35, "Data protection impact assessment", "DPIA for high-risk AI processing; reused by the FRIA under AI Act Art. 27(4)."),
 (36, "Prior consultation", "Consult the authority where the DPIA shows high residual risk."),
 (37, "Designation of the data protection officer", "DPO involvement in AI governance."),
 (39, "Tasks of the data protection officer", "Advice on DPIA, monitoring, awareness-raising and training."),
 (44, "General principle for transfers", "Transfers of personal data to non-EU AI/LLM API providers."),
 (45, "Transfers on the basis of an adequacy decision", "Adequacy decisions (e.g. EU-US Data Privacy Framework participants)."),
 (46, "Transfers subject to appropriate safeguards", "SCCs (Decision (EU) 2021/914), BCRs; requires a TIA."),
 (49, "Derogations for specific situations", "Narrow derogations where no adequacy or safeguards exist."),
 (77, "Right to lodge a complaint with a supervisory authority", "Complaint channel; compare AI Act Art. 85."),
 (83, "General conditions for imposing administrative fines", "Fines up to EUR 20 million or 4% of worldwide annual turnover."),
 (89, "Safeguards and derogations relating to processing for archiving, scientific or historical research or statistical purposes", "Research exemptions relevant to model development."),
]

# ---------------------------------------------------------------- ISO/IEC 42001 clauses (titles + paraphrase)
ISO_CLAUSES = [
 ("4.1", "Understanding the organization and its context", "Determine external and internal issues, the organisation's AI roles and whether climate change is a relevant issue."),
 ("4.2", "Understanding the needs and expectations of interested parties", "Identify interested parties and which of their requirements the AIMS addresses."),
 ("4.3", "Determining the scope of the AI management system", "Define and document the boundaries and applicability of the AIMS."),
 ("4.4", "AI management system", "Establish, implement, maintain and continually improve the AIMS."),
 ("5.1", "Leadership and commitment", "Top management demonstrates leadership: policy, objectives, resources, integration into business processes."),
 ("5.2", "AI policy", "Establish a documented AI policy with commitments to requirements and continual improvement."),
 ("5.3", "Roles, responsibilities and authorities", "Assign and communicate responsibilities and authorities for the AIMS."),
 ("6.1.1", "Actions to address risks and opportunities — General", "Plan actions for risks and opportunities; define AI risk criteria."),
 ("6.1.2", "AI risk assessment", "Define and apply a repeatable AI risk assessment process: identify, analyse, evaluate."),
 ("6.1.3", "AI risk treatment", "Select treatment options, determine controls, compare with Annex A, produce the Statement of Applicability and treatment plan."),
 ("6.1.4", "AI system impact assessment", "Assess consequences of AI systems for individuals, groups and societies; document results."),
 ("6.2", "AI objectives and planning to achieve them", "Set measurable AI objectives and plans to achieve them."),
 ("6.3", "Planning of changes", "Carry out changes to the AIMS in a planned manner."),
 ("7.1", "Resources", "Provide the resources needed for the AIMS."),
 ("7.2", "Competence", "Determine and ensure competence of persons affecting AI performance; keep evidence."),
 ("7.3", "Awareness", "Ensure awareness of the AI policy, contribution and implications of nonconformity."),
 ("7.4", "Communication", "Determine internal and external communications relevant to the AIMS."),
 ("7.5", "Documented information", "Create, update and control documented information."),
 ("8.1", "Operational planning and control", "Plan, implement and control processes, including outsourced ones and changes."),
 ("8.2", "AI risk assessment", "Perform risk assessments at planned intervals or on significant change; retain results."),
 ("8.3", "AI risk treatment", "Implement the risk treatment plan and verify effectiveness; retain results."),
 ("8.4", "AI system impact assessment", "Perform impact assessments at planned intervals or on significant change; retain results."),
 ("9.1", "Monitoring, measurement, analysis and evaluation", "Determine what is monitored and measured, methods, timing; evaluate AIMS performance."),
 ("9.2", "Internal audit", "Plan and conduct internal audits through an audit programme; report results."),
 ("9.3", "Management review", "Top management reviews the AIMS at planned intervals with defined inputs and results."),
 ("10.1", "Continual improvement", "Continually improve suitability, adequacy and effectiveness of the AIMS."),
 ("10.2", "Nonconformity and corrective action", "React to nonconformities, determine causes, implement and review corrective actions."),
]


def build_iso(guide):
    lines = open(ISO_TXT, encoding="utf-8").read().replace("\x0c", "\n").split("\n")
    a0 = next(i for i, l in enumerate(lines) if re.search(r"\bA\.2\.2\s+AI policy", l))
    a1 = next(i for i in range(a0, len(lines)) if re.search(r"Annex B", lines[i]) and i > a0 + 100)
    rowre = re.compile(r"^(\s*)(A\.\d+\.\d+(?:\.\d+)?)(\s+)(\S.*?)(\s+)((?:The organization shall|As part of|Roles and responsibilities for AI shall|The AI policy shall).*)$")
    objre = re.compile(r"^\s*(A\.\d+(?:\.\d+)?)\s+(\S.*)$")
    controls, objectives, cur = [], [], None
    for l in lines[a0 - 6:a1]:
        if re.search(r"©|ISO/IEC 42001:2023|Licensed|NSAI|^\s*\d+\s*$|Table A\.1", l):
            continue
        m = rowre.match(l)
        if m and re.match(r"A\.\d+\.\d+(\.\d+)?$", m.group(2)) and ("shall" in l or len(m.group(6)) > 20):
            tcol = len(m.group(1)) + len(m.group(2)) + len(m.group(3))
            ccol = tcol + len(m.group(4)) + len(m.group(5))
            cur = {"id": m.group(2), "t": [m.group(4)], "c": [m.group(6)], "tcol": tcol, "ccol": ccol}
            controls.append(cur)
            continue
        mo = objre.match(l)
        if mo and not m:
            objectives.append((mo.group(1), clean(mo.group(2))))
            cur = None
            continue
        if cur and l.strip() and not l.strip().startswith(("Objective", "Topic", "Control")):
            left = l[:cur["ccol"] - 1].strip() if len(l) >= cur["tcol"] else ""
            right = l[cur["ccol"] - 1:].strip() if len(l) > cur["ccol"] - 1 else ""
            # tolerate small column drift
            if not right and left and len(l) - len(l.lstrip()) > cur["tcol"] + 12:
                right, left = left, ""
            if left:
                cur["t"].append(left)
            if right:
                cur["c"].append(right)
        elif not l.strip():
            pass

    def join(parts):
        return clean(re.sub(r"(\w)- (\w)", r"\1\2", " ".join(parts)))
    objective_titles = {"A.2": "Policies related to AI", "A.3": "Internal organization", "A.4": "Resources for AI systems",
                        "A.5": "Assessing impacts of AI systems", "A.6": "AI system life cycle", "A.7": "Data for AI systems",
                        "A.8": "Information for interested parties of AI systems", "A.9": "Use of AI systems",
                        "A.10": "Third-party and customer relationships"}
    res = []
    for c in controls:
        cid = c["id"]
        g = guide.get(cid, {})
        res.append({"id": f"ISO42001-{cid}", "control_id": cid, "objective": ".".join(cid.split(".")[:2]),
                    "objective_title": objective_titles[".".join(cid.split(".")[:2])],
                    "title": join(c["t"]), "control": join(c["c"]),
                    "citation": f"ISO/IEC 42001:2023, Annex A, {cid}",
                    "audit_procedure": g.get("audit_steps", []), "typical_evidence": g.get("evidence", []),
                    "audit_procedure_source": "iso42001-lead-auditor-study-guide" if g else None})
    ids = [r["control_id"] for r in res]
    assert len(ids) == 38 and len(set(ids)) == 38, (len(ids), ids)
    clauses = [{"id": f"ISO42001-{n}", "clause": n, "title": t, "summary_paraphrased": s,
                "citation": f"ISO/IEC 42001:2023, clause {n}"} for n, t, s in ISO_CLAUSES]
    out("frameworks/iso_42001/requirements.json", {
        "source_ids": ["iso-iec-42001-2023", "iso42001-lead-auditor-study-guide"],
        "licence": "RESTRICTED — ISO/IEC copyright; single-user licensed copy (NSAI). Personal use only by the licence holder. Do not redistribute or expose to other users.",
        "extraction": "Annex A control ids, titles and control statements: automatic from the licensed PDF (column parsing; check wording against the PDF before quoting in a deliverable). Clause summaries: paraphrased by AI. Audit procedures and typical evidence: parsed from the owner's study guide.",
        "verification": "control count checked (38); clause list from model knowledge cross-checked with the PDF table of contents",
        "language": "en"}, {"clauses": clauses, "annex_a_controls": res})
    return {r["id"] for r in res} | {c["id"] for c in clauses}


def parse_guide():
    h = open(GUIDE_HTML, encoding="utf-8").read()

    def text(x):
        return clean(html.unescape(re.sub(r"<[^>]+>", " ", x)))
    guide = {}
    blocks = re.split(r'<div class="ctrl-block">', h)[1:]
    for b in blocks:
        m = re.search(r'ctrl-block-id">([^<]+)<', b)
        if not m:
            continue
        cid = m.group(1).strip()
        aud = b.split('class="ctrl-col-audit"')[1] if 'class="ctrl-col-audit"' in b else ""
        mo = re.search(r"<ol[^>]*>(.*?)</ol>", aud, flags=re.S)
        steps = [text(x) for x in re.findall(r"<li>(.*?)</li>", mo.group(1), flags=re.S)] if mo else []
        mr = re.search(r'class="evidence-row">(.*?)</div>', aud, flags=re.S)
        ev = [re.sub(r"^[^A-Za-z0-9]+", "", text(x)) for x in mr.group(1).split('<span class="ev-chip">')[1:]] if mr else []
        if not ev:
            me = re.search(r"Evidence to request:\s*</strong>(.*?)</div>", aud, flags=re.S)
            ev = [e.strip(" .") for e in text(me.group(1)).split(",") if e.strip(" .")] if me else []
        guide[cid] = {"audit_steps": steps, "evidence": ev}
    # quiz bank
    quiz = []
    for q in re.split(r'<div class="qz-item', h)[1:]:
        q = q.split('<div class="qz-item')[0]
        quiz.append(text(q)[:1200])
    return guide, quiz


# ---------------------------------------------------------------- NIST AI RMF core
def build_nist():
    lines = open(os.path.join(KB, "_build", "cache", "nist_ai_100-1.txt"), encoding="utf-8").read().replace("\x0c", "\n").split("\n")
    idre = re.compile(r"\b(GOVERN|MAP|MEASURE|MANAGE) (\d)\.(\d+):")
    catre = re.compile(r"^\s*(GOVERN|MAP|MEASURE|MANAGE) (\d):")
    subs, cur, col = [], None, None
    cats = {}
    for i, l in enumerate(lines):
        m = idre.search(l)
        if m:
            col = m.start()
            cur = {"fn": m.group(1), "cat": int(m.group(2)), "n": int(m.group(3)), "parts": [l[m.end():]]}
            subs.append(cur)
        elif cur is not None:
            if re.search(r"NIST AI 100-1|^\s*Page \d+|Table \d+:|Categories\s+Subcategories|Continued on next page", l) or \
               re.match(r"^\s*(\d+\.\d*\s+\w|Practices related to|[A-Z][a-z]+ing AI risks)", l) and len(l) - len(l.lstrip()) < 6 and not l[col:col + 1].strip():
                if not re.search(r"Continued on next page|Categories\s+Subcategories", l) and not re.search(r"NIST AI 100-1|Page \d+", l):
                    cur = None
                continue
            seg = l[col:] if len(l) > col else ""
            if len(l) > col and col > 0 and l[col - 1] != " ":
                # line starts left of the subcategory column and runs into it: category cell text only
                k = l.rfind("  ", 0, col + 6)
                seg = l[k:] if k >= col - 3 else ""
            if seg.strip():
                cur["parts"].append(seg)
            elif not l.strip() and len(cur["parts"]) > 0 and i + 1 < len(lines) and not lines[i + 1][col:col + 80].strip() and not lines[i + 1].strip():
                pass
        mc = catre.match(l)
        if mc:
            cats.setdefault((mc.group(1), int(mc.group(2))), None)
    res, seen = [], set()
    for s in subs:
        key = (s["fn"], s["cat"], s["n"])
        if key in seen:
            continue
        seen.add(key)
        t = clean(re.sub(r"(\w)- (\w)", r"\1\2", " ".join(p.strip() for p in s["parts"])))
        res.append({"id": f"NIST-{s['fn']}-{s['cat']}.{s['n']}", "function": s["fn"], "category": f"{s['fn']} {s['cat']}",
                    "subcategory": f"{s['fn']} {s['cat']}.{s['n']}", "text": t,
                    "citation": f"NIST AI 100-1 (AI RMF 1.0), {s['fn']} {s['cat']}.{s['n']}"})
    counts = {f: sum(1 for r in res if r["function"] == f) for f in ("GOVERN", "MAP", "MEASURE", "MANAGE")}
    assert counts == {"GOVERN": 19, "MAP": 18, "MEASURE": 22, "MANAGE": 13}, counts
    out("frameworks/nist_ai_rmf/core.json", {
        "source_ids": ["nist-ai-100-1"], "licence": "Public domain (U.S. Government work)",
        "extraction": "automatic (pdftotext -layout, column parsing of Tables 1-4). Wording must be spot-checked against the PDF: table extraction can clip or merge cells.",
        "verification": "primary source read; counts checked (19/18/22/13 = 72)", "language": "en"},
        {"functions": [{"id": f, "description": d} for f, d in [
            ("GOVERN", "A culture of risk management is cultivated and present."),
            ("MAP", "Context is recognized and risks related to context are identified."),
            ("MEASURE", "Identified risks are assessed, analyzed, or tracked."),
            ("MANAGE", "Risks are prioritized and acted upon based on a projected impact.")]],
         "subcategories": res})
    # GenAI profile from atlas
    d = yaml.safe_load(open(os.path.join(ATLAS, "nist_ai_rmf_data.yaml")))
    a = yaml.safe_load(open(os.path.join(ATLAS, "nist_ai_rmf_actions_data.yaml")))
    risks = [{"id": e["id"], "name": e["name"], "description": clean(e.get("description")),
              "related_actions": e.get("hasRelatedAction", []), "citation": "NIST AI 600-1, section 2"} for e in d["entries"]]
    abbr = {"GV": "GOVERN", "MP": "MAP", "MS": "MEASURE", "MG": "MANAGE"}
    actions = []
    for x in a["actions"]:
        m = re.match(r"(GV|MP|MS|MG)-(\d)\.(\d+)-(\d+)", x["id"])
        actions.append({"id": "NIST600-" + x["id"], "action_id": x["id"],
                        "subcategory_ref": f"NIST-{abbr[m.group(1)]}-{m.group(2)}.{m.group(3)}" if m else None,
                        "text": clean(x.get("description")), "related_risks": x.get("hasRelatedRisk", []),
                        "ai_actor_tasks": x.get("hasAiActorTask", []), "citation": f"NIST AI 600-1, {x['id']}"})
    out("frameworks/nist_ai_rmf/genai_profile_600-1.json", {
        "source_ids": ["nist-ai-600-1", "ibm-ai-atlas-nexus"], "licence": "Public domain content (NIST); structured by IBM ai-atlas-nexus (Apache-2.0)",
        "extraction": "converted from ai-atlas-nexus YAML; the official PDF is stored in sources/raw for citation checks",
        "verification": "counts: 12 risks expected", "language": "en"}, {"genai_risks": risks, "suggested_actions": actions})
    assert len(risks) == 12
    return {r["id"] for r in res}


# ---------------------------------------------------------------- risk taxonomies
def conv_tax(fname, rel, src_ids, licence, extra_meta=None):
    d = yaml.safe_load(open(os.path.join(ATLAS, fname)))
    data = {}
    for k in ("taxonomies", "documents", "groups", "entries"):
        if k in d:
            data[k] = [{kk: (clean(vv) if isinstance(vv, str) else vv) for kk, vv in e.items()} for e in d[k]]
    out(rel, {"source_ids": src_ids, "licence": licence,
              "extraction": f"converted 1:1 from ai-atlas-nexus `{fname}` (YAML to JSON), ids preserved",
              "verification": "upstream structured dataset; not re-checked entry by entry", **(extra_meta or {})}, data)
    return data


def build_risks():
    ids = set()
    ibm = conv_tax("risk_atlas_data.yaml", "risk-taxonomy/ibm_ai_risk_atlas.json", ["ibm-ai-atlas-nexus"], "Apache-2.0 (IBM ai-atlas-nexus)")
    mit = conv_tax("mit_ai_risk_repository_data.yaml", "risk-taxonomy/mit_ai_risk_taxonomies.json", ["mit-ai-risk-repository-v4", "ibm-ai-atlas-nexus"], "CC BY 4.0 (MIT AI Risk Repository); structured by ai-atlas-nexus (Apache-2.0)")
    conv_tax("mit_ai_risk_mitigation_data.yaml", "risk-taxonomy/mit_ai_risk_mitigation_taxonomy.json", ["mit-ai-risk-mitigation-taxonomy", "ibm-ai-atlas-nexus"], "CC BY 4.0 (MIT); structured by ai-atlas-nexus (Apache-2.0)", {"status": "DRAFT taxonomy upstream"})
    ol = conv_tax("owasp_llm_2.0_data.yaml", "risk-taxonomy/owasp_llm_top10_2025.json", ["owasp-llm-top10-2025", "ibm-ai-atlas-nexus"], "CC BY-SA 4.0 (OWASP)", {"warning": "A 2026 edition has been reported by secondary sources; identifiers here are the 2025 edition."})
    oa = conv_tax("owasp_asi_data.yaml", "risk-taxonomy/owasp_agentic_top10_2026.json", ["owasp-agentic-top10-2026", "ibm-ai-atlas-nexus"], "CC BY-SA 4.0 (OWASP)")
    for d in (ibm, mit, ol, oa):
        ids |= {e["id"] for e in d.get("entries", [])} | {g["id"] for g in d.get("groups", [])}
    # MIT full database
    wb = openpyxl.load_workbook(os.path.join(RAW, "mit_ai_risk_repository_v4.xlsx"), read_only=True, data_only=True)
    ws = wb["AI Risk Database v4"]
    rows = list(ws.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r and r[0] == "Title" and "QuickRef" in r)
    hdr = [clean(str(c)) if c else f"col{j}" for j, c in enumerate(rows[hi])]
    keep = ["Title", "QuickRef", "Ev_ID", "Category level", "Risk category", "Risk subcategory", "Description",
            "Additional ev.", "P.Def", "Entity", "Intent", "Timing", "Domain", "Sub-domain"]
    recs = []
    for r in rows[hi + 1:]:
        d = dict(zip(hdr, r))
        if not d.get("Title"):
            continue
        rec = {k.lower().replace(" ", "_").replace(".", "").replace("-", "_"): (clean(str(d[k])) if d.get(k) is not None else None) for k in keep if k in d}
        recs.append(rec)
    out("risk-taxonomy/mit_ai_risk_database_v4.json", {
        "source_ids": ["mit-ai-risk-repository-v4"], "licence": "CC BY 4.0 — attribution: MIT AI Risk Repository (Slattery et al., 2024), airisk.mit.edu",
        "extraction": "automatic from the official Google Sheet (xlsx export of 'AI Risk Database v4', updated 03 December 2025); cached formula values",
        "verification": "primary source read; rows include paper-, category- and subcategory-level entries (see category_level)"},
        {"risks": recs})
    # causal taxonomy constants
    return ids


def build_risk_mappings():
    mdir = os.path.join(ATLAS, "mappings")
    wanted = {"ibm2nistgenai_from_tsv_data.yaml": "ibm_to_nist_genai", "mit-ai-risk-repository_ibm-risk-atlas_from_tsv_data.yaml": "ibm_to_mit",
              "ibm2owasp_from_tsv_data.yaml": "ibm_to_owasp_llm", "owasp_asi2ibm_risk_atlas_from_tsv_data.yaml": "owasp_agentic_to_ibm",
              "owasp_asi2owasp_llm_from_tsv_data.yaml": "owasp_agentic_to_owasp_llm"}
    rel_keys = {"exact_mappings": "exactMatch", "close_mappings": "closeMatch", "broad_mappings": "broadMatch",
                "narrow_mappings": "narrowMatch", "related_mappings": "relatedMatch"}
    for f, name in wanted.items():
        p = os.path.join(mdir, f)
        if not os.path.exists(p):
            continue
        d = yaml.safe_load(open(p))
        edges = []
        for sect in d.values():
            if not isinstance(sect, list):
                continue
            for e in sect:
                for k, v in e.items():
                    if k in rel_keys and v:
                        for t in v:
                            edges.append({"source": e["id"], "relation": rel_keys[k], "target": t})
        seen, uniq = set(), []
        for e in edges:
            key = (e["source"], e["relation"], e["target"])
            if key not in seen:
                seen.add(key)
                uniq.append(e)
        out(f"crosswalks/risk/{name}.json", {
            "source_ids": ["ibm-ai-atlas-nexus"], "licence": "Apache-2.0", "relation_vocabulary": "SKOS mapping relations",
            "extraction": f"converted from ai-atlas-nexus `mappings/{f}`", "verification": "upstream mapping; not re-validated"},
            {"mappings": uniq})


# ---------------------------------------------------------------- common control objectives (crosswalk hub)
# "~" prefix = supporting (partial) link; no prefix = primary link.
CCO = [
 ("CCO-01", "Legal and regulatory requirements", "Requisiti legali e normativi", "Applicable AI, data-protection and sector rules are identified, documented and kept current.",
  ["AIA-Art.2", "AIA-Art.3", "GDPR-Art.24", "~GDPR-Art.5", "ISO42001-4.1", "ISO42001-4.2", "NIST-GOVERN-1.1", "~NIST-MAP-1.1"],
  ["legal register", "regulatory applicability analysis"], ["tpl-cross-framework-gap-analysis-roadmap"]),
 ("CCO-02", "AI policy and leadership commitment", "Policy AI e impegno della direzione", "A documented AI policy approved by top management sets principles, objectives and commitments.",
  ["ISO42001-5.1", "ISO42001-5.2", "ISO42001-A.2.2", "ISO42001-A.2.3", "ISO42001-A.2.4", "~AIA-Art.17", "~GDPR-Art.24", "NIST-GOVERN-1.2", "NIST-GOVERN-1.4", "NIST-GOVERN-2.3", "~NIST-GOVERN-4.1"],
  ["AI policy", "acceptable use policy", "board minutes"], ["tpl-corporate-ai-policy", "tpl-genai-acceptable-use-policy"]),
 ("CCO-03", "Roles, responsibilities and accountability", "Ruoli, responsabilità e accountability", "AI roles (incl. regulatory role as provider/deployer and controller/processor) are assigned and documented.",
  ["AIA-Art.16", "AIA-Art.26", "AIA-Art.25", "~AIA-Art.22", "GDPR-Art.24", "GDPR-Art.26", "GDPR-Art.28", "~GDPR-Art.37", "ISO42001-5.3", "ISO42001-A.3.2", "ISO42001-A.10.2", "NIST-GOVERN-2.1", "NIST-GOVERN-2.3"],
  ["organisation chart", "RACI matrix", "job descriptions", "committee charter"], ["tpl-ai-governance-raci-matrix"]),
 ("CCO-04", "AI system inventory and risk classification", "Inventario dei sistemi AI e classificazione del rischio", "All AI systems and agents are inventoried with purpose, role and risk class.",
  ["AIA-Art.5", "AIA-Art.6", "AIA-Annex.I", "AIA-Annex.III", "AIA-Art.49", "~AIA-Art.51", "~GDPR-Art.30", "ISO42001-4.3", "ISO42001-A.4.2", "NIST-GOVERN-1.6", "NIST-MAP-1.1", "NIST-MAP-2.1", "~NIST-MAP-3.3"],
  ["AI inventory", "use case description", "classification memo"], ["tpl-ai-use-case-inventory-record", "tpl-agent-card", "tpl-risk-classification-rationale"]),
 ("CCO-05", "AI risk management process", "Processo di gestione del rischio AI", "A repeatable process identifies, analyses, evaluates and treats AI risks across the lifecycle.",
  ["AIA-Art.9", "~GDPR-Art.32", "~GDPR-Art.35", "ISO42001-6.1.1", "ISO42001-6.1.2", "ISO42001-6.1.3", "ISO42001-8.2", "ISO42001-8.3", "NIST-GOVERN-1.3", "NIST-MAP-1.5", "NIST-MAP-5.1", "NIST-MANAGE-1.2", "NIST-MANAGE-1.3", "NIST-MANAGE-1.4"],
  ["risk methodology", "risk register", "risk treatment plan"], ["tpl-ai-risk-assessment-treatment-plan", "tpl-risk-heat-map-report", "tpl-statement-of-applicability"]),
 ("CCO-06", "Impact assessment on individuals, groups and society", "Valutazione d'impatto su persone, gruppi e società", "Impacts on fundamental rights, individuals and society are assessed before deployment and on change.",
  ["AIA-Art.27", "GDPR-Art.35", "GDPR-Art.36", "ISO42001-6.1.4", "ISO42001-8.4", "ISO42001-A.5.2", "ISO42001-A.5.3", "ISO42001-A.5.4", "ISO42001-A.5.5", "NIST-MAP-5.1", "NIST-MAP-3.1", "NIST-MAP-3.2", "~NIST-MAP-1.1"],
  ["FRIA", "DPIA", "AI system impact assessment"], ["tpl-fria", "tpl-ai-enhanced-dpia", "tpl-ai-system-impact-assessment"]),
 ("CCO-07", "Data governance and data quality", "Governance e qualità dei dati", "Training, validation, testing and operational data are governed for provenance, quality, relevance and lawfulness.",
  ["AIA-Art.10", "~AIA-Art.4a", "GDPR-Art.5", "GDPR-Art.6", "~GDPR-Art.9", "~GDPR-Art.25", "ISO42001-A.7.2", "ISO42001-A.7.3", "ISO42001-A.7.4", "ISO42001-A.7.5", "ISO42001-A.7.6", "ISO42001-A.4.3", "NIST-MAP-2.3", "~NIST-MEASURE-2.9"],
  ["data governance policy", "dataset documentation / datasheet", "data lineage records", "data quality report"], ["tpl-data-governance-bias-audit-report"]),
 ("CCO-08", "Bias and fairness", "Bias ed equità", "Bias is examined, measured and mitigated in data and outcomes.",
  ["AIA-Art.10", "AIA-Art.4a", "~AIA-Art.15", "~GDPR-Art.5", "GDPR-Art.9", "~GDPR-Art.22", "ISO42001-A.5.4", "ISO42001-A.7.4", "~ISO42001-A.6.2.4", "NIST-MEASURE-2.11", "~NIST-GOVERN-3.1"],
  ["bias audit report", "fairness metrics", "test results by subgroup"], ["tpl-data-governance-bias-audit-report"]),
 ("CCO-09", "Technical documentation", "Documentazione tecnica", "System design, development, performance and limitations are documented and kept up to date.",
  ["AIA-Art.11", "AIA-Annex.IV", "AIA-Art.18", "~GDPR-Art.30", "ISO42001-7.5", "ISO42001-A.6.2.3", "ISO42001-A.6.2.7", "ISO42001-A.4.2", "~ISO42001-A.4.4", "~ISO42001-A.4.5", "NIST-GOVERN-4.2", "NIST-MAP-2.1", "NIST-MAP-2.2", "~NIST-MEASURE-2.1"],
  ["technical documentation", "model card", "system architecture", "design specification"], ["tpl-annex-iv-technical-documentation"]),
 ("CCO-10", "Logging and record-keeping", "Registrazione degli eventi e conservazione dei log", "Events are logged automatically and logs are retained to ensure traceability.",
  ["AIA-Art.12", "AIA-Art.19", "~AIA-Art.26", "~GDPR-Art.5", "~GDPR-Art.32", "ISO42001-A.6.2.8", "~NIST-MEASURE-2.4", "~NIST-MEASURE-2.8", "~NIST-MANAGE-4.1"],
  ["logging specification", "log samples", "log retention policy"], []),
 ("CCO-11", "Transparency and information to users and affected persons", "Trasparenza e informazione a utenti e interessati", "Deployers, users and affected persons receive clear information about the AI system and its outputs.",
  ["AIA-Art.13", "AIA-Art.50", "~AIA-Art.26", "~AIA-Art.86", "GDPR-Art.12", "GDPR-Art.13", "GDPR-Art.14", "~GDPR-Art.15", "ISO42001-A.8.2", "ISO42001-A.8.5", "~ISO42001-A.9.4", "NIST-MEASURE-2.8", "NIST-MEASURE-2.9", "~NIST-MAP-3.4"],
  ["instructions for use", "privacy notice", "AI disclosure notice", "user documentation"], ["tpl-instructions-for-use", "tpl-transparency-notices"]),
 ("CCO-12", "Human oversight", "Sorveglianza umana", "Humans can understand, monitor, intervene in and override the system; oversight roles are competent and empowered.",
  ["AIA-Art.14", "AIA-Art.26", "GDPR-Art.22", "ISO42001-A.9.2", "~ISO42001-A.9.3", "~ISO42001-A.6.1.3", "NIST-GOVERN-3.2", "NIST-MAP-3.5", "NIST-MAP-2.2", "~NIST-MANAGE-2.4"],
  ["human oversight procedure", "escalation / override procedure", "operator training records"], ["tpl-agent-card", "tpl-art22-automated-decision-assessment"]),
 ("CCO-13", "Accuracy, robustness and cybersecurity", "Accuratezza, robustezza e cibersicurezza", "The system reaches declared accuracy, is resilient to errors and attacks, and is secured.",
  ["AIA-Art.15", "GDPR-Art.32", "ISO42001-A.6.2.4", "ISO42001-A.6.2.6", "~ISO42001-A.6.2.2", "NIST-MEASURE-2.5", "NIST-MEASURE-2.6", "NIST-MEASURE-2.7", "~NIST-MEASURE-2.3"],
  ["test report", "penetration test / red-team report", "security architecture", "performance metrics"], ["tpl-genai-risk-profile-tevv-summary"]),
 ("CCO-14", "Testing, evaluation, verification and validation (TEVV)", "Test, valutazione, verifica e validazione (TEVV)", "Systems are tested against defined metrics before release and periodically, with independent review where appropriate.",
  ["AIA-Art.9", "~AIA-Art.15", "~AIA-Art.60", "ISO42001-A.6.2.4", "ISO42001-9.1", "NIST-MEASURE-1.1", "NIST-MEASURE-1.2", "NIST-MEASURE-1.3", "NIST-MEASURE-2.1", "NIST-MEASURE-2.2", "NIST-MEASURE-2.3", "NIST-MEASURE-2.13", "NIST-MEASURE-4.1", "NIST-MEASURE-4.2", "NIST-MAP-2.3"],
  ["test plan", "validation report", "evaluation benchmark results"], ["tpl-genai-risk-profile-tevv-summary"]),
 ("CCO-15", "Quality management and lifecycle processes", "Gestione della qualità e processi del ciclo di vita", "Documented lifecycle processes cover design, development, deployment, change and retirement.",
  ["AIA-Art.17", "ISO42001-8.1", "ISO42001-6.3", "ISO42001-A.6.1.2", "ISO42001-A.6.1.3", "ISO42001-A.6.2.2", "ISO42001-A.6.2.5", "NIST-GOVERN-1.4", "NIST-GOVERN-1.7", "~NIST-GOVERN-4.1", "NIST-MAP-1.6", "NIST-MANAGE-1.1"],
  ["quality manual", "SDLC / MLOps procedure", "change management records", "release approval"], []),
 ("CCO-16", "Conformity assessment, declaration and registration", "Valutazione di conformità, dichiarazione e registrazione", "Conformity is assessed, declared and registered before placing on the market or putting into service.",
  ["AIA-Art.43", "AIA-Art.47", "AIA-Annex.V", "AIA-Art.48", "AIA-Art.49", "~ISO42001-9.2", "~NIST-MEASURE-1.3"],
  ["conformity assessment report", "EU declaration of conformity", "certificate", "EU database registration"], ["tpl-eu-declaration-of-conformity"]),
 ("CCO-17", "Monitoring, post-market monitoring and continual improvement", "Monitoraggio, post-market monitoring e miglioramento continuo", "Performance and risks are monitored in operation; findings feed improvement.",
  ["AIA-Art.72", "~AIA-Art.26", "~GDPR-Art.35", "ISO42001-9.1", "ISO42001-10.1", "ISO42001-A.6.2.6", "NIST-GOVERN-1.5", "NIST-MEASURE-2.4", "NIST-MEASURE-3.1", "NIST-MEASURE-3.2", "NIST-MEASURE-4.3", "NIST-MANAGE-4.1", "NIST-MANAGE-4.2", "NIST-MANAGE-2.2"],
  ["post-market monitoring plan", "monitoring dashboard / KPI report", "drift report"], ["tpl-post-market-monitoring-plan"]),
 ("CCO-18", "Incident management and reporting", "Gestione e segnalazione degli incidenti", "Incidents, malfunctions and breaches are detected, handled, reported to authorities and communicated.",
  ["AIA-Art.73", "AIA-Art.20", "~AIA-Art.26", "GDPR-Art.33", "GDPR-Art.34", "ISO42001-A.8.4", "~ISO42001-A.8.3", "ISO42001-10.2", "NIST-GOVERN-4.3", "NIST-MANAGE-4.3", "NIST-MANAGE-2.3", "~NIST-MANAGE-4.1"],
  ["incident response procedure", "incident log", "breach notification records"], ["tpl-serious-incident-report", "tpl-audit-readiness-nc-capa-log"]),
 ("CCO-19", "Third-party, supplier and value-chain management", "Gestione di terze parti, fornitori e catena del valore", "Suppliers of models, data and components are assessed, contracted and monitored.",
  ["AIA-Art.25", "~AIA-Art.23", "~AIA-Art.24", "~AIA-Art.53", "GDPR-Art.28", "~GDPR-Art.26", "ISO42001-A.10.2", "ISO42001-A.10.3", "ISO42001-A.10.4", "NIST-GOVERN-6.1", "NIST-GOVERN-6.2", "NIST-MAP-4.1", "NIST-MAP-4.2", "NIST-MANAGE-3.1", "NIST-MANAGE-3.2"],
  ["vendor assessment", "contract / DPA", "supplier SLA", "model provider documentation"], ["tpl-vendor-third-party-risk-assessment"]),
 ("CCO-20", "Competence, awareness and AI literacy", "Competenza, consapevolezza e alfabetizzazione AI", "Staff and other persons dealing with AI have sufficient AI literacy and role-specific competence.",
  ["AIA-Art.4", "~AIA-Art.26", "~AIA-Art.14", "~GDPR-Art.39", "ISO42001-7.2", "ISO42001-7.3", "ISO42001-A.4.6", "NIST-GOVERN-2.2", "NIST-MAP-3.4", "~NIST-GOVERN-3.1"],
  ["training plan", "training records", "competence matrix"], ["tpl-ai-literacy-plan"]),
 ("CCO-21", "Stakeholder engagement, feedback and complaints", "Coinvolgimento degli stakeholder, feedback e reclami", "Interested parties can raise concerns and their feedback is considered.",
  ["~AIA-Art.27", "AIA-Art.85", "~AIA-Art.26", "~GDPR-Art.35", "~GDPR-Art.77", "ISO42001-4.2", "ISO42001-7.4", "ISO42001-A.3.3", "ISO42001-A.8.3", "NIST-GOVERN-5.1", "NIST-GOVERN-5.2", "NIST-MAP-5.2", "NIST-MEASURE-3.3", "~NIST-MAP-1.2"],
  ["whistleblowing / concern-reporting procedure", "stakeholder consultation records", "complaint log"], []),
 ("CCO-22", "Automated decision-making and right to explanation", "Decisioni automatizzate e diritto alla spiegazione", "Individuals subject to automated or AI-assisted decisions get safeguards, explanation and a way to contest.",
  ["AIA-Art.86", "~AIA-Art.14", "~AIA-Art.26", "GDPR-Art.22", "~GDPR-Art.13", "~GDPR-Art.15", "~GDPR-Art.21", "~ISO42001-A.5.4", "~ISO42001-A.8.2", "NIST-MEASURE-2.9", "~NIST-MEASURE-3.3"],
  ["ADM assessment", "explanation procedure", "contestation / appeal procedure"], ["tpl-art22-automated-decision-assessment"]),
 ("CCO-23", "Privacy and data protection by design", "Privacy e protezione dei dati fin dalla progettazione", "Personal data use in AI is minimised, lawful and protected by design; data subject rights can be exercised.",
  ["GDPR-Art.25", "GDPR-Art.5", "GDPR-Art.6", "~GDPR-Art.16", "~GDPR-Art.17", "GDPR-Art.30", "~AIA-Art.10", "~AIA-Art.4a", "~GDPR-Art.9", "~ISO42001-A.7.3", "~ISO42001-A.7.5", "NIST-MEASURE-2.10"],
  ["RoPA", "LIA", "privacy-by-design assessment", "data subject request procedure"], ["tpl-ropa-ai-processing", "tpl-legitimate-interest-assessment", "tpl-ai-enhanced-dpia"]),
 ("CCO-24", "International data transfers", "Trasferimenti internazionali di dati", "Transfers of personal data to non-EU AI providers rely on a valid mechanism and a transfer impact assessment.",
  ["GDPR-Art.44", "GDPR-Art.45", "GDPR-Art.46", "~GDPR-Art.49", "~GDPR-Art.28", "~ISO42001-A.10.3", "~NIST-GOVERN-6.1"],
  ["TIA", "standard contractual clauses", "data flow map"], ["tpl-transfer-impact-assessment"]),
 ("CCO-25", "General-purpose AI model obligations", "Obblighi per i modelli GPAI", "GPAI providers document the model, inform downstream providers, respect copyright and manage systemic risk.",
  ["AIA-Art.51", "AIA-Art.53", "AIA-Art.54", "AIA-Art.55", "AIA-Annex.XI", "AIA-Annex.XII", "~ISO42001-A.6.2.7", "~ISO42001-A.10.4", "~NIST-MANAGE-3.2", "~NIST-GOVERN-6.1"],
  ["model documentation", "training-data summary", "copyright policy", "systemic risk assessment"], []),
 ("CCO-26", "Internal audit and management review", "Audit interno e riesame della direzione", "The governance system is audited and reviewed by management at planned intervals.",
  ["ISO42001-9.2", "ISO42001-9.3", "ISO42001-10.2", "~AIA-Art.17", "~GDPR-Art.24", "NIST-GOVERN-1.5", "~NIST-MEASURE-1.3"],
  ["internal audit programme", "audit report", "management review minutes", "CAPA log"], ["tpl-audit-readiness-nc-capa-log", "tpl-board-executive-compliance-report"]),
 ("CCO-27", "Objectives, resources and environmental considerations", "Obiettivi, risorse e aspetti ambientali", "AI objectives are set and resourced; computing and environmental impacts are considered.",
  ["ISO42001-6.2", "ISO42001-7.1", "ISO42001-A.9.3", "ISO42001-A.4.5", "~ISO42001-A.4.4", "NIST-MAP-1.3", "NIST-MAP-1.4", "NIST-MANAGE-2.1", "NIST-MEASURE-2.12", "~AIA-Art.95"],
  ["AI objectives", "budget / resource plan", "sustainability report"], []),
]

# MIT domain taxonomy subdomain -> CCOs that primarily mitigate it
RISK_TO_CCO = {
 "1.1": ["CCO-08", "CCO-07", "CCO-06"], "1.2": ["CCO-13", "CCO-14", "CCO-11"], "1.3": ["CCO-08", "CCO-14"],
 "2.1": ["CCO-23", "CCO-07", "CCO-24"], "2.2": ["CCO-13", "CCO-19", "CCO-18"],
 "3.1": ["CCO-13", "CCO-11", "CCO-12"], "3.2": ["CCO-11", "CCO-06"],
 "4.1": ["CCO-11", "CCO-04"], "4.2": ["CCO-13", "CCO-04"], "4.3": ["CCO-13", "CCO-11"],
 "5.1": ["CCO-12", "CCO-20", "CCO-11"], "5.2": ["CCO-12", "CCO-22"],
 "6.1": ["CCO-06", "CCO-19"], "6.2": ["CCO-06", "CCO-21"], "6.3": ["CCO-06"], "6.4": ["CCO-02", "CCO-15"],
 "6.5": ["CCO-02", "CCO-03", "CCO-26"], "6.6": ["CCO-27"],
 "7.1": ["CCO-14", "CCO-12", "CCO-05"], "7.2": ["CCO-12", "CCO-14"], "7.3": ["CCO-13", "CCO-14"],
 "7.4": ["CCO-11", "CCO-09", "CCO-10"], "7.5": ["CCO-06"], "7.6": ["CCO-12", "CCO-14", "CCO-10"],
}


def build_crosswalk(valid):
    fw = {"AIA": "eu-ai-act", "GDPR": "gdpr", "ISO42001": "iso-42001", "NIST": "nist-ai-rmf"}
    ccos, edges, missing = [], [], []
    for cid, en, it, desc, refs, ev, tpls in CCO:
        reqs = []
        for r in refs:
            strength = "supporting" if r.startswith("~") else "primary"
            r = r.lstrip("~")
            if r not in valid:
                missing.append((cid, r))
            reqs.append({"ref": r, "framework": fw[r.split("-")[0]], "strength": strength})
        ccos.append({"id": cid, "name_en": en, "name_it": it, "description": desc, "requirements": reqs,
                     "typical_evidence": ev, "deliverables": tpls, "validation_status": "draft — not yet validated by a human"})
        for i, a in enumerate(reqs):
            for b in reqs[i + 1:]:
                if a["framework"] != b["framework"]:
                    edges.append({"source": a["ref"], "target": b["ref"], "via": cid,
                                  "relation": "relatedMatch" if "supporting" in (a["strength"], b["strength"]) else "closeMatch"})
    assert not missing, missing
    meta = {"source_ids": ["eu-ai-act-2024-1689-oj", "gdpr-2016-679", "iso-iec-42001-2023", "nist-ai-100-1"],
            "licence": "Original work of this knowledge base",
            "extraction": "AUTHORED BY AI (Claude) from the framework texts — NOT an official crosswalk. Every referenced requirement id is checked to exist in frameworks/.",
            "verification": "integrity-checked only; semantic correctness requires validation by a qualified professional. Official NIST crosswalks (AI RMF to ISO/IEC 42001) exist and should be used to validate ISO-NIST links.",
            "method": "Hub-and-spoke: each Common Control Objective (CCO) groups requirements from all frameworks that the same evidence can satisfy ('assess once, comply many'). Pairwise edges are derived from shared CCO membership. closeMatch = both links primary; relatedMatch = at least one supporting."}
    out("crosswalks/common_control_objectives.json", meta, {"common_control_objectives": ccos})
    out("crosswalks/framework_edges.json", {**meta, "derived_from": "crosswalks/common_control_objectives.json"}, {"edges": edges})
    r2c = [{"risk": f"mit-ai-risk-subdomain-{k}", "mitigating_objectives": v} for k, v in RISK_TO_CCO.items()]
    return r2c, meta


GARTNER = {
 "ai_maturity_model": {"levels": [
  {"level": 1, "name": "Awareness", "description": "AI is discussed but no pilots or strategy exist; interest is ad hoc."},
  {"level": 2, "name": "Active", "description": "Experiments and proofs of concept; knowledge sharing starts."},
  {"level": 3, "name": "Operational", "description": "At least one AI project is in production with budget, ownership and supporting practices."},
  {"level": 4, "name": "Systemic", "description": "AI is considered in every new digital initiative and is embedded in business processes."},
  {"level": 5, "name": "Transformational", "description": "AI is part of the business DNA and central to the operating model."}],
  "assessment_pillars": ["Strategy", "Product / value", "Governance", "Engineering", "Data", "Operating models", "Culture"],
  "nist_bridge_note": "The app's NIST maturity scorecard uses a 0–5 scale per subcategory; map 0 = not started, 1–5 = the five levels above."},
 "ai_trism": {"name": "AI Trust, Risk and Security Management (AI TRiSM)", "layers": [
  {"id": "trism-governance", "name": "AI governance", "scope": "Inventory of AI assets, policies, accountability, risk and compliance tracking", "related_cco": ["CCO-02", "CCO-03", "CCO-04", "CCO-05"]},
  {"id": "trism-runtime", "name": "AI runtime inspection and enforcement", "scope": "Real-time inspection of models, applications and agent interactions; guardrails and policy enforcement", "related_cco": ["CCO-10", "CCO-12", "CCO-13", "CCO-17"]},
  {"id": "trism-information-governance", "name": "Information governance", "scope": "Data classification, access rights and protection of data used by AI", "related_cco": ["CCO-07", "CCO-23", "CCO-24"]},
  {"id": "trism-infrastructure", "name": "Infrastructure and stack", "scope": "Traditional technology protection: endpoint, network, cloud, identity, workload security", "related_cco": ["CCO-13", "CCO-19"]}],
  "risk_categories": ["Explainability / model monitoring", "ModelOps", "AI application security", "Privacy", "Third-party model and data risk", "Agentic AI runtime risk"]}}


def main():
    valid = set()
    valid |= build_ai_act()
    out("frameworks/eu_ai_act/classification_roles_timeline.json", {
        "source_ids": ["eu-ai-act-2024-1689-oj", "eu-reg-2026-1744"], "licence": "Original work of this knowledge base",
        "extraction": "AUTHORED BY AI (Claude) from the Regulation; each element cites the articles it derives from",
        "verification": "see the `verification` field on each block; the timeline is verified against the OJ text of Regulation (EU) 2026/1744"}, AIA_OVERLAY)
    full = build_gdpr_full()
    gd, title_diffs = [], []
    for n, t, r in GDPR:
        off = full[n]["title"]
        if clean(off).lower() != clean(t).lower():
            title_diffs.append((n, t, off))
        gd.append({"id": f"GDPR-Art.{n}", "number": n, "title": off, "ai_relevance": r, "citation": f"Regulation (EU) 2016/679, Article {n}", "text": full[n]["text"]})
    print("GDPR title corrections from official text:", title_diffs)
    out("frameworks/gdpr/ai_relevant_articles.json", {
        "source_ids": ["gdpr-2016-679"], "licence": "EU legal text, reuse permitted; `ai_relevance` notes are original work",
        "extraction": "titles and text: automatic from the Official Journal PDF. `ai_relevance`: one-line note AUTHORED BY AI (Claude).",
        "verification": "titles and text taken from the primary source; relevance notes not reviewed by a professional"}, {"articles": gd})
    for n in full:
        valid.add(f"GDPR-Art.{n}")
    valid |= {g["id"] for g in gd}
    guide, quiz = parse_guide()
    valid |= build_iso(guide)
    valid |= build_nist()
    risk_ids = build_risks()
    build_risk_mappings()
    r2c, meta = build_crosswalk(valid)
    bad = [r["risk"] for r in r2c if r["risk"] not in risk_ids]
    assert not bad, bad
    out("crosswalks/risk/mit_subdomain_to_control_objectives.json", {**meta, "method": "Each MIT domain-taxonomy subdomain is linked to the Common Control Objectives that primarily mitigate it; used to place risks on the heat map and to suggest controls."}, {"mappings": r2c})
    out("frameworks/gartner/ai_maturity_and_trism.json", {
        "source_ids": ["gartner-public-summaries"], "licence": "Gartner research is proprietary. This file is a short paraphrased summary of publicly described models, not Gartner content.",
        "extraction": "AUTHORED BY AI (Claude) from model knowledge", "verification": "NOT verified against Gartner publications; a Gartner licence is needed to consult the originals. Links to CCOs are this knowledge base's own."}, GARTNER)
    out("checklists/iso42001_lead_auditor_quiz.json", {
        "source_ids": ["iso42001-lead-auditor-study-guide"], "licence": "Owner's personal study material — personal use",
        "extraction": "automatic from the study-guide HTML (question text flattened)", "verification": "not reviewed"}, {"questions": [{"n": i + 1, "text": q} for i, q in enumerate(quiz)]})
    for rel, n in REPORT:
        print(rel, n)


main()
