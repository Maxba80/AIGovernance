"""End-to-end check of Milestone 1 against a running stack.

Usage: python e2e.py <api_base_url> <admin_email> <admin_password> <fake_llm_base_url_seen_from_backend> <pdf_path>
"""
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE, EMAIL, PASSWORD, LLM_URL, PDF = sys.argv[1:6]
TOKEN = None
PASSED = 0


def call(method, path, body=None, files=None, expect=200):
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}
    data = None
    if files:
        boundary = uuid.uuid4().hex
        parts = b""
        for name, content in files:
            parts += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"{name}\"\r\nContent-Type: application/octet-stream\r\n\r\n").encode() + content + b"\r\n"
        data = parts + f"--{boundary}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    assert status == expect, f"{method} {path}: expected {expect}, got {status}: {raw[:300]}"
    return json.loads(raw) if raw else None


def ok(name, cond, detail=""):
    global PASSED
    assert cond, f"FAILED: {name} {detail}"
    PASSED += 1
    print(f"  ok  {name}")


POLICY = b"""# Data Governance Policy

## 1. Purpose
This policy defines how Acme manages data used to train and operate AI systems.

## 2. Data quality
Training, validation and testing data sets must meet documented data quality requirements before use. Each data set has an owner who records its provenance and known limitations.

## 3. Human oversight
Operators can stop any AI system at any time and escalate to the AI governance committee.
"""

print("auth")
call("GET", "/api/workspaces", expect=401)
call("POST", "/api/auth/login", {"email": EMAIL, "password": "wrong-password"}, expect=401)
TOKEN = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})["access_token"]
ok("login and bearer auth", call("GET", "/api/auth/me")["email"] == EMAIL)

print("knowledge base")
kb = call("GET", "/api/kb/summary")
ok("kb summary", kb["common_control_objectives"] == 27 and len(kb["frameworks"]) == 4 and kb["templates"] == 31, str(kb)[:200])

print("workspaces")
ws = call("GET", "/api/workspaces")
A = ws[0]["id"]
B = call("POST", "/api/workspaces", {"name": f"Client B {uuid.uuid4().hex[:6]}"})["id"]

print("llm settings")
s = call("GET", "/api/settings/llm")
ok("presets offered", {"ollama", "anthropic", "openai", "gemini", "azure_openai", "lmstudio", "vllm"} <= {p["preset"] for p in s["presets"]})
p = call("POST", "/api/settings/llm/providers", {"name": "Fake local", "kind": "openai_compatible", "preset": "custom", "base_url": LLM_URL, "api_key": "secret-key-123"})
ok("api key never returned", p["has_api_key"] is True and "api_key" not in p and "secret-key-123" not in json.dumps(call("GET", "/api/settings/llm")))
ok("list models", "fake-embed" in call("GET", f"/api/settings/llm/providers/{p['id']}/models")["models"])
t = call("POST", "/api/settings/llm/test", {"provider_id": p["id"], "model": "fake-embed", "kind": "embedding"})
ok("embedding test", t["ok"] and t["dimensions"] == 96, str(t))
t = call("POST", "/api/settings/llm/test", {"provider_id": p["id"], "model": "fake-chat", "kind": "chat"})
ok("chat test", t["ok"], str(t))
bad = call("POST", "/api/settings/llm/providers", {"name": "Unreachable", "kind": "openai_compatible", "preset": "custom", "base_url": "http://127.0.0.1:9/v1"})
t = call("POST", "/api/settings/llm/test", {"provider_id": bad["id"], "model": "x", "kind": "chat"})
ok("unreachable provider reported, not crashed", t["ok"] is False and "reach" in t["detail"].lower(), str(t))
call("DELETE", f"/api/settings/llm/providers/{bad['id']}", expect=204)

print("ingestion without any model configured")
call("PUT", "/api/settings/llm/routing", {"reasoning": None, "embedding": None, "agents": {"ingestion": None}})
d0 = call("POST", f"/api/workspaces/{B}/documents", files=[("notes.txt", b"Plain notes about nothing in particular.\n" * 3)])[0]


def wait(wid, doc_id, timeout=180):
    end = time.time() + timeout
    while time.time() < end:
        d = call("GET", f"/api/workspaces/{wid}/documents/{doc_id}")
        if d["status"] in ("ready", "failed"):
            return d
        time.sleep(1)
    raise AssertionError(f"timeout waiting for {doc_id}: {d}")


d0 = wait(B, d0["id"])
ok("ready without models, with an explicit note", d0["status"] == "ready" and "no embedding model" in (d0["stage_detail"] or "") and d0["tags"] == [], str(d0))
call("POST", f"/api/workspaces/{B}/search", {"query": "notes"}, expect=409)

print("routing")
r = call("PUT", "/api/settings/llm/routing", {"reasoning": {"provider_id": p["id"], "model": "fake-chat"}, "embedding": {"provider_id": p["id"], "model": "fake-embed"}})
ok("routing saved, reindex flagged", r["embedding"]["model"] == "fake-embed" and r.get("reindex_required") is True and r["documents_affected"] >= 1, str(r))
ok("reindex queued", call("POST", f"/api/workspaces/{B}/reindex")["queued"] == 1)
ok("reindexed document is searchable", wait(B, d0["id"])["embedding_model"] == "Fake local/fake-embed")

print("ingestion with models")
call("POST", f"/api/workspaces/{A}/documents", files=[("malware.exe", b"MZ")], expect=415)
docs = call("POST", f"/api/workspaces/{A}/documents", files=[("Data Governance Policy.md", POLICY), ("NIST AI 600-1.pdf", open(PDF, "rb").read())])
call("POST", f"/api/workspaces/{A}/documents", files=[("copy.md", POLICY)], expect=409)
ok("duplicate content refused", True)
policy = wait(A, docs[0]["id"])
pdf = wait(A, docs[1]["id"], timeout=300)
ok("policy ready", policy["status"] == "ready" and policy["chunk_count"] >= 3 and policy["doc_type"] == "policy" and policy["doc_type_source"] == "ai", str(policy)[:300])
ok("pdf parsed with pages", pdf["status"] == "ready" and pdf["pages"] > 50 and pdf["chunk_count"] > 100, f"{pdf['status']} pages={pdf['pages']} chunks={pdf['chunk_count']} err={pdf['error']}")
tags = {t["cco_id"]: t for t in policy["tags"]}
ok("unknown objective dropped", set(tags) == {"CCO-07", "CCO-12"}, str(list(tags)))
ok("verbatim quote verified, with section", tags["CCO-07"]["citation"]["quote_verified"] and tags["CCO-07"]["confidence"] > 0.8 and tags["CCO-07"]["citation"]["section"] == "2. Data quality", str(tags["CCO-07"]))
ok("fabricated quote flagged and confidence capped", not tags["CCO-12"]["citation"]["quote_verified"] and tags["CCO-12"]["confidence"] <= 0.5)
ok("all proposals await approval", all(t["status"] == "proposed" for t in policy["tags"]))
chunks = call("GET", f"/api/workspaces/{A}/documents/{pdf['id']}/chunks?page=10")
ok("chunks by page", len(chunks) > 0 and all(c["page"] == 10 for c in chunks))

print("search with citations")
res = call("POST", f"/api/workspaces/{A}/search", {"query": "data quality requirements for training data sets", "top_k": 5})["results"]
ok("search finds the policy passage", res[0]["filename"] == "Data Governance Policy.md" and "data quality" in res[0]["text"].lower(), str(res[0])[:200])
res = call("POST", f"/api/workspaces/{A}/search", {"query": "confabulation hallucination generative", "top_k": 5})["results"]
ok("search cites pdf pages", any(r["filename"].endswith(".pdf") and r["page"] for r in res))

print("approvals (human in the loop)")
pending = [a for a in call("GET", f"/api/workspaces/{A}/approvals?status=pending") if a["payload"]["document_id"] == policy["id"]]
ok("approval items carry agent, model and sources", len(pending) == 2 and all(a["agent"] and a["model"] and a["sources"][0]["quote"] for a in pending))
by = {a["payload"]["cco_id"]: a for a in pending}
ok("unverified quote warned in summary", "not found verbatim" in by["CCO-12"]["summary"])
call("POST", f"/api/workspaces/{A}/approvals/{by['CCO-07']['id']}/decide", {"decision": "approve", "comment": "Section 2 is explicit"})
call("POST", f"/api/workspaces/{A}/approvals/{by['CCO-12']['id']}/decide", {"decision": "reject"})
call("POST", f"/api/workspaces/{A}/approvals/{by['CCO-07']['id']}/decide", {"decision": "reject"}, expect=409)
st = {t["cco_id"]: t["status"] for t in call("GET", f"/api/workspaces/{A}/documents/{policy['id']}")["tags"]}
ok("decisions applied to tags", st == {"CCO-07": "approved", "CCO-12": "rejected"}, str(st))

print("workspace isolation")
ok("workspace B does not list A's documents", all(d["id"] not in (policy["id"], pdf["id"]) for d in call("GET", f"/api/workspaces/{B}/documents")))
call("GET", f"/api/workspaces/{B}/documents/{policy['id']}", expect=404)
call("DELETE", f"/api/workspaces/{B}/documents/{policy['id']}", expect=404)
resB = call("POST", f"/api/workspaces/{B}/search", {"query": "data quality requirements for training data sets"})["results"]
ok("search in B never returns A's passages", all(r["document_id"] == d0["id"] for r in resB), str(resB)[:200])
ok("approvals isolated", call("GET", f"/api/workspaces/{B}/approvals?status=") == [])

print("audit trail")
v = call("GET", "/api/audit/verify")
ok("hash chain verifies", v["ok"] and v["checked"] > 15, str(v))
entries = call("GET", f"/api/audit?workspace_id={A}&limit=200")["entries"]
actions = {e["action"] for e in entries}
ok("key events recorded", {"document.uploaded", "document.ingested", "approval.approved", "approval.rejected"} <= actions, str(actions))
ap = next(e for e in entries if e["action"] == "approval.approved")
ok("approval entry names approver, model and source", ap["actor"] == EMAIL and ap["model"] and ap["sources"][0]["filename"] and ap["payload"]["comment"] == "Section 2 is explicit")
ing = next(e for e in entries if e["action"] == "document.ingested" and e["entity_id"] == policy["id"])
ok("ingestion entry records coverage and verification counts", ing["actor_type"] == "agent" and ing["payload"]["tagging"]["chunks_considered"] == ing["payload"]["tagging"]["chunks_total"] and ing["payload"]["tagging"]["quotes_verified"] == 1)
big = next(e for e in entries if e["action"] == "document.ingested" and e["entity_id"] == pdf["id"])
ok("partial coverage of a long document is recorded, not hidden", big["payload"]["tagging"]["chunks_considered"] < big["payload"]["tagging"]["chunks_total"])

print("cleanup")
call("DELETE", f"/api/workspaces/{B}", expect=409)
call("DELETE", f"/api/workspaces/{B}/documents/{d0['id']}", expect=204)
call("DELETE", f"/api/workspaces/{B}", expect=204)
call("DELETE", f"/api/settings/llm/providers/{p['id']}", expect=409)
ok("provider in use cannot be deleted", True)
print(f"\n{PASSED} checks passed")
