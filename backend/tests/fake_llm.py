"""Minimal OpenAI-compatible server for tests only. Deterministic, no model behind it.

- /v1/embeddings: hashed bag-of-words vectors, so texts sharing words are close.
- /v1/chat/completions: for the ingestion agent prompt it returns a classification that
  contains one well-supported link (verbatim quote), one link whose quote is NOT in the
  text, and one link to a control objective that does not exist — to exercise validation.
"""
import hashlib
import json
import math
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DIM = 96


def embed(text: str) -> list[float]:
    v = [0.0] * DIM
    for w in re.findall(r"[a-z]{3,}", text.lower()):
        v[int(hashlib.md5(w.encode()).hexdigest(), 16) % DIM] += 1.0
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def classify(user: str) -> dict:
    excerpts = re.findall(r"\[excerpt (\d+) \| page [^\]]*\]\n(.*?)(?=\n\n\[excerpt |\Z)", user, flags=re.S)
    target = next(((int(n), t) for n, t in excerpts if "data quality" in t.lower()), (int(excerpts[0][0]), excerpts[0][1]))
    sentence = next((s for s in re.split(r"(?<=[.!?])\s+", target[1]) if "data quality" in s.lower()), target[1][:120])
    return {"doc_type": "policy", "summary": "Test classification.", "tags": [
        {"cco_id": "CCO-07", "confidence": 0.9, "rationale": "Sets data quality requirements.", "chunk": target[0], "quote": sentence.strip()[:300]},
        {"cco_id": "CCO-12", "confidence": 0.85, "rationale": "Mentions oversight.", "chunk": target[0], "quote": "this sentence does not appear in the document"},
        {"cco_id": "CCO-99", "confidence": 0.9, "rationale": "Invalid objective.", "chunk": target[0], "quote": "x"},
    ]}


def _passage_with(user: str, needle: str):
    ps = re.findall(r"\[passage (\d+) \|[^\]]*\]\n(.*?)(?=\n\n\[passage |\Z)", user, flags=re.S)
    for n, t in ps:
        if needle in t.lower():
            sentence = next((x for x in re.split(r"(?<=[.!?])\s+", t) if needle in x.lower()), t[:100])
            return int(n), sentence.strip()[:300]
    return (int(ps[0][0]), ps[0][1][:80]) if ps else (1, "no passages")


def respond(system: str, user: str) -> str:
    """Canned, deliberately imperfect answers per agent, to exercise validation."""
    if "Ingestion & Evidence Agent" in system:
        return json.dumps(classify(user))
    n, q = _passage_with(user, "data quality")
    if "EU AI Act Specialist of an AI governance tool. Classify" in system:
        return json.dumps({"in_scope": True, "org_role": "deployer", "risk_class": "high-risk-annex-iii", "annex_iii_point": "4(a) recruitment or selection",
                           "prohibited_practice": None, "art6_3_derogation": {"applies": False, "reason": "The system profiles natural persons."},
                           "transparency_obligations": ["Art. 50(1)"], "gpai": False, "confidence": 0.82, "rationale": "Used to screen job applicants.",
                           "decision_path": [{"step": 2, "question": "Prohibited practice?", "answer": "No", "basis": ["AIA-Art.5", "AIA-Art.999"]},
                                             {"step": 4, "question": "Annex III area?", "answer": "Yes, employment", "basis": ["AIA-Annex.III"]}],
                           "missing_information": ["Whether the vendor is established in the EU"]})
    if "EU AI Act Specialist. The system below has been classified" in system:
        return json.dumps({"summary": "Deployer obligations partly evidenced.", "findings": [
            {"requirement_ref": "AIA-Art.26", "status": "partial", "rationale": "Data quality is addressed.", "evidence": [{"passage": n, "quote": q}]},
            {"requirement_ref": "AIA-Art.27", "status": "compliant", "rationale": "Claims a FRIA exists.", "evidence": [{"passage": n, "quote": "a fundamental rights impact assessment was completed"}]},
            {"requirement_ref": "AIA-Art.4", "status": "gap", "rationale": "No training evidence.", "evidence": []},
            {"requirement_ref": "AIA-Art.1234", "status": "gap", "rationale": "Invalid id.", "evidence": []}]})
    if "GDPR Specialist" in system:
        return json.dumps({"personal_data": True, "legal_basis": None, "dpia_required": True, "dpia_rationale": "Systematic evaluation of candidates.",
                           "automated_decision_art22": True, "transfers_outside_eu": False, "summary": "DPIA needed.", "findings": [
                               {"requirement_ref": "GDPR-Art.35", "status": "gap", "rationale": "No DPIA in the evidence.", "evidence": []},
                               {"requirement_ref": "GDPR-Art.5", "status": "partial", "rationale": "Accuracy addressed through data quality.", "evidence": [{"passage": n, "quote": q}]}]})
    if "ISO/IEC 42001 Auditor" in system:
        return json.dumps({"summary": "Data controls partly in place.", "findings": [
            {"requirement_ref": "ISO42001-A.7.4", "status": "partial", "rationale": "Quality requirements documented.", "evidence": [{"passage": n, "quote": q}]},
            {"requirement_ref": "ISO42001-6.1.2", "status": "gap", "rationale": "No risk assessment method.", "evidence": []}]})
    if "NIST AI RMF Specialist" in system:
        return json.dumps({"maturity": {"GOVERN": 2, "MAP": 1, "MEASURE": 0, "MANAGE": 1}, "summary": "Early maturity.", "findings": [
            {"requirement_ref": "NIST-MAP-2.3", "status": "partial", "rationale": "Data considerations documented.", "evidence": [{"passage": n, "quote": q}]}]})
    if "Draft the sections of a" in system:
        ids = re.findall(r"(?m)^(s\d+) — ", user)
        out = []
        for i, sid in enumerate(ids):
            if i == 1:
                out.append({"id": sid, "content": "The organisation states that every decision is reviewed by two people.", "evidence": [{"passage": n, "quote": "every decision is reviewed by two people"}], "needs_input": []})
            elif i == 2:
                out.append({"id": sid, "content": "", "evidence": [], "needs_input": ["How often will the system be used?", "For how long?"]})
            else:
                out.append({"id": sid, "content": f"Draft for {sid}: data sets are subject to quality requirements.", "evidence": [{"passage": n, "quote": q}], "needs_input": []})
        out.append({"id": "s999", "content": "Section that does not exist.", "evidence": [], "needs_input": []})
        return json.dumps({"sections": out})
    if "Crosswalk & Risk Engine" in system:
        return json.dumps({"risks": [{"risk_id": "mit-ai-risk-subdomain-1.1", "likelihood": 4, "severity": 4, "rationale": "Screening can discriminate."},
                                     {"risk_id": "mit-ai-risk-subdomain-2.1", "likelihood": 3, "severity": 4, "rationale": "Candidate data."},
                                     {"risk_id": "mit-ai-risk-subdomain-99.9", "likelihood": 5, "severity": 5, "rationale": "Invalid id."}]})
    if "You are the Orchestrator" in system:
        return "The system is high-risk under Annex III. Main gaps: DPIA and AI literacy. All findings were proposed by AI agents and need human review."
    return "ready"


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.rstrip("/").endswith("/models"):
            return self._send({"object": "list", "data": [{"id": "fake-chat", "object": "model"}, {"id": "fake-embed", "object": "model"}]})
        self._send({"error": {"message": "not found"}}, 404)

    def do_POST(self):
        req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if self.path.endswith("/embeddings"):
            texts = req["input"] if isinstance(req["input"], list) else [req["input"]]
            return self._send({"object": "list", "model": req["model"], "data": [{"object": "embedding", "index": i, "embedding": embed(t)} for i, t in enumerate(texts)],
                               "usage": {"prompt_tokens": 1, "total_tokens": 1}})
        if self.path.endswith("/chat/completions"):
            system = req["messages"][0]["content"]
            user = req["messages"][-1]["content"]
            content = respond(system, user)
            return self._send({"id": "x", "object": "chat.completion", "model": req["model"],
                               "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
                               "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}})
        self._send({"error": {"message": "not found"}}, 404)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv) > 1 else 18080), H).serve_forever()
