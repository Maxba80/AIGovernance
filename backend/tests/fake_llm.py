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
            content = json.dumps(classify(user)) if "Ingestion & Evidence Agent" in system else "ready"
            return self._send({"id": "x", "object": "chat.completion", "model": req["model"],
                               "choices": [{"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}],
                               "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}})
        self._send({"error": {"message": "not found"}}, 404)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv) > 1 else 18080), H).serve_forever()
