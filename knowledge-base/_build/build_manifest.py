#!/usr/bin/env python3
"""Writes sources/manifest.json (provenance of every source) and INDEX.json (hash of every KB file)."""
import hashlib, json, os
KB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def sha(p):
    h = hashlib.sha256(); h.update(open(p, "rb").read()); return h.hexdigest()
def raw(f):
    p = os.path.join(KB, "sources", "raw", f)
    in_standards = f in ("eu_ai_act_2024_1689_oj.pdf", "nist_ai_100-1.pdf")  # already in Drive Standards/, not duplicated
    return {"kb_copy": None if in_standards else "sources/raw/" + f, "sha256": sha(p), "bytes": os.path.getsize(p)}
D = "Google Drive: AI Governance Tool/Standards/"
ISO_LIC = "ISO/IEC copyright; single-user licensed copy (NSAI). Personal use by the licence holder only."
S = [
 {"id": "eu-ai-act-2024-1689-oj", "title": "Regulation (EU) 2024/1689 (Artificial Intelligence Act)", "issuer": "European Union", "version": "OJ L, 12.7.2024 (original, not consolidated)", "url": "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", "licence": "EU legal text, reuse permitted", "status": "in force, amended by Regulation (EU) 2026/1744 (amendments recorded in the KB)", "verification": "primary source read in full", "drive_location": D + "EU AI ACT.pdf", **raw("eu_ai_act_2024_1689_oj.pdf")},
 {"id": "eu-reg-2026-1744", "title": "Regulation (EU) 2026/1744 (Digital Omnibus on AI)", "issuer": "European Union", "version": "OJ L, 24.7.2026 (reported)", "url": "https://eur-lex.europa.eu/eli/reg/2026/1744/oj", "licence": "EU legal text, reuse permitted", "status": "in force since 27.7.2026", "verification": "primary source read (Article 1 in full); provided by the owner", "drive_location": D + "OJ_L_202601744_EN_TXT.pdf", "kb_copy": None, "sha256": "0bea4d808256b08275777949ba9cb3c70b7d02e4ebb3ac9b205671b1f552d386"},
 {"id": "gdpr-2016-679", "title": "Regulation (EU) 2016/679 (GDPR)", "issuer": "European Union", "version": "OJ L 119, 4.5.2016", "url": "https://eur-lex.europa.eu/eli/reg/2016/679/oj", "licence": "EU legal text, reuse permitted", "status": "in force (the GDPR Digital Omnibus is reported as not adopted)", "verification": "primary source read; 99 articles extracted; provided by the owner", "drive_location": D + "CELEX_32016R0679_EN_TXT.pdf", "kb_copy": None, "sha256": "bd84e63f5b622b739a83389afc3b30d240f792bb88d8eb03a816c9a82b0c2499"},
 {"id": "eu-scc-2021-914", "title": "Commission Implementing Decision (EU) 2021/914 (standard contractual clauses)", "issuer": "European Commission", "version": "4.6.2021", "url": "https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj", "licence": "EU legal text, reuse permitted", "status": "in force", "verification": "document identity checked (31 pages); not structured — available for RAG; provided by the owner", "drive_location": D + "CELEX_32021D0914_EN_TXT.pdf", "kb_copy": None, "sha256": "e79903f89a984f0414b02a154e164bd6b0cbf24d7f3bfc9b2afa511c84ac8d11"},
 {"id": "nist-ai-100-1", "title": "Artificial Intelligence Risk Management Framework (AI RMF 1.0)", "issuer": "NIST", "version": "NIST AI 100-1, January 2023", "url": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf", "licence": "Public domain", "status": "current (revision announced, no draft)", "verification": "primary source downloaded from NIST and read", "drive_location": D + "NIST.AI RM Framework.pdf", **raw("nist_ai_100-1.pdf")},
 {"id": "nist-ai-600-1", "title": "AI RMF: Generative Artificial Intelligence Profile", "issuer": "NIST", "version": "NIST AI 600-1, July 2024", "url": "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf", "licence": "Public domain", "status": "current", "verification": "primary source downloaded from NIST; structured content taken from ai-atlas-nexus", **raw("nist_ai_600-1.pdf")},
 {"id": "edpb-opinion-28-2024", "title": "Opinion 28/2024 on certain data protection aspects related to the processing of personal data in the context of AI models", "issuer": "EDPB", "version": "17 December 2024", "url": "https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf", "licence": "EDPB reuse policy (source acknowledged)", "status": "adopted", "verification": "primary source downloaded; not yet structured (available for RAG)", **raw("edpb_opinion_28_2024_ai_models.pdf")},
 {"id": "edpb-rec-01-2020", "title": "Recommendations 01/2020 on measures that supplement transfer tools, v2.0", "issuer": "EDPB", "version": "18 June 2021", "url": "https://www.edpb.europa.eu/system/files/2021-06/edpb_recommendations_202001vo.2.0_supplementarymeasurestransferstools_en.pdf", "licence": "EDPB reuse policy (source acknowledged)", "status": "adopted", "verification": "primary source downloaded; not yet structured (available for RAG)", **raw("edpb_rec_01_2020_supplementary_measures.pdf")},
 {"id": "mit-ai-risk-repository-v4", "title": "The AI Risk Repository V4", "issuer": "MIT FutureTech / MIT AI Risk Initiative", "version": "V4, updated 03 December 2025", "url": "https://airisk.mit.edu/", "licence": "CC BY 4.0", "status": "latest version found", "verification": "primary source (official Google Sheet) downloaded and read", **raw("mit_ai_risk_repository_v4.xlsx")},
 {"id": "mit-ai-risk-mitigation-taxonomy", "title": "MIT Draft AI Risk Mitigation Taxonomy", "issuer": "MIT AI Risk Initiative", "version": "as packaged in ai-atlas-nexus", "url": "https://airisk.mit.edu/ai-risk-mitigations", "licence": "CC BY 4.0", "status": "draft", "verification": "via ai-atlas-nexus", "kb_copy": None, "sha256": None},
 {"id": "ibm-ai-atlas-nexus", "title": "IBM AI Atlas Nexus (IBM AI Risk Atlas, mappings to NIST, MIT, OWASP)", "issuer": "IBM", "version": "git commit 3c68049285bc1c314758ba12ce110ffeb41f0cf5 (23 Nov 2026)", "url": "https://github.com/IBM/ai-atlas-nexus", "licence": "Apache-2.0", "status": "current", "verification": "repository cloned; YAML converted", "kb_copy": None, "sha256": None},
 {"id": "owasp-llm-top10-2025", "title": "OWASP Top 10 for LLM Applications 2025", "issuer": "OWASP", "version": "2025", "url": "https://genai.owasp.org/llm-top-10/", "licence": "CC BY-SA 4.0", "status": "a 2026 edition is reported by secondary sources — verify", "verification": "via ai-atlas-nexus", "kb_copy": None, "sha256": None},
 {"id": "owasp-agentic-top10-2026", "title": "OWASP Top 10 for Agentic Applications 2026", "issuer": "OWASP", "version": "December 2025", "url": "https://genai.owasp.org/", "licence": "CC BY-SA 4.0", "status": "current", "verification": "via ai-atlas-nexus", "kb_copy": None, "sha256": None},
 {"id": "iso-iec-42001-2023", "title": "ISO/IEC 42001:2023 AI management system", "issuer": "ISO/IEC", "version": "Edition 1, 2023-12", "url": "https://www.iso.org/standard/42001", "licence": ISO_LIC, "status": "current", "verification": "primary source read in full", "drive_location": D + "_42001 AI Management Systems.pdf", "kb_copy": None, "sha256": "995b12f7c329f5be4193b6c70b318f17e2bdb9ddfbc2447edc73e63ce5730437"},
 {"id": "iso42001-lead-auditor-study-guide", "title": "ISO/IEC 42001 Lead Auditor study guide (ISO42001_LeadAuditor_v7.2.html)", "issuer": "Owner's personal study material (PECB course)", "version": "footer: v2.1, May 2026", "url": None, "licence": "Personal use", "status": "n/a", "verification": "read in full; audit procedures are study notes, not normative text", "drive_location": "Google Drive: AI Governance Tool/ISO42001_LeadAuditor_v7.2.html", "kb_copy": None, "sha256": "b309a3ba921f1253ae5d5281ae8baf5a75205d8447dce97a845c8917abe17732"},
 {"id": "gartner-public-summaries", "title": "Gartner AI Maturity Model and AI TRiSM (public descriptions)", "issuer": "Gartner", "version": "n/a", "url": "https://www.gartner.com/", "licence": "Proprietary research — not reproduced", "status": "n/a", "verification": "model knowledge only; NOT verified", "kb_copy": None, "sha256": None},
] + [
 {"id": i, "title": t, "issuer": "ISO/IEC", "version": v, "url": None, "licence": ISO_LIC, "status": "current", "verification": "read in full; not structured — available for RAG ingestion from Drive", "drive_location": D + f, "kb_copy": None, "sha256": None}
 for i, t, v, f in [
  ("iso-iec-42005-2025", "ISO/IEC 42005:2025 AI system impact assessment", "Edition 1, 2025-05", "42005 Impact Assessment.pdf"),
  ("iso-iec-23894-2023", "ISO/IEC 23894:2023 Guidance on risk management (I.S. EN ISO/IEC 23894:2024)", "2023", "23894 Guidance on Risk Management.pdf"),
  ("iso-iec-42006-2025", "ISO/IEC 42006:2025 Requirements for bodies providing audit and certification of AIMS", "Edition 1, 2025-07", "42006 Requirements for body providing audit and certification.pdf"),
  ("iso-iec-17021-1-2015", "ISO/IEC 17021-1:2015 Conformity assessment", "2015", "17021 Conformity assessment.pdf"),
  ("iso-iec-38507-2022", "ISO/IEC 38507:2022 Governance implications of the use of AI", "2022", "38507 Governance Implications of the use of AI.pdf"),
  ("iso-iec-22989-2022", "ISO/IEC 22989:2022 AI concepts and terminology", "2022", "22989 AI Contepts and Methodology .pdf"),
  ("iso-iec-23053-2022", "ISO/IEC 23053:2022 Framework for AI systems using ML", "2022", "23053 Framework of AI Systems using ML.pdf"),
  ("iso-iec-tr-24028-2020", "ISO/IEC TR 24028:2020 Overview of trustworthiness in AI", "2020", "24028 Trustworthiness in AI.pdf")]]
json.dump({"_meta": {"kb_file": "sources/manifest.json", "generated": "2026-11-24", "retrieved": "2026-11-24",
  "verification_levels": ["primary source read", "official-site search hit", "secondary sources", "model knowledge (not verified)"]}, "sources": S},
  open(os.path.join(KB, "sources", "manifest.json"), "w"), ensure_ascii=False, indent=1)
idx = []
for root, _, files in os.walk(KB):
    for f in sorted(files):
        rel = os.path.relpath(os.path.join(root, f), KB)
        if rel.startswith("_build/cache") or rel == "INDEX.json":
            continue
        idx.append({"path": rel, "sha256": sha(os.path.join(root, f)), "bytes": os.path.getsize(os.path.join(root, f))})
idx.sort(key=lambda x: x["path"])
json.dump({"_meta": {"generated": "2026-11-24", "purpose": "Tamper-evidence: SHA-256 of every knowledge-base file"}, "files": idx}, open(os.path.join(KB, "INDEX.json"), "w"), indent=1)
print(len(S), "sources;", len(idx), "files indexed")
