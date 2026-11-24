"""End-to-end check of Milestone 3 (framework modules, assessments, graph, audit export).
Run after e2e.py on the same stack (reuses the 'Fake local' provider). Repeatable: uses a new workspace.

Usage: python e2e_m3.py <api_base_url> <admin_email> <admin_password>
"""
import json
import sys
import time
import urllib.error
import urllib.request
import uuid

BASE, EMAIL, PASSWORD = sys.argv[1:4]
TOKEN = None
PASSED = 0


def call(method, path, body=None, expect=200, raw=False):
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}
    data = json.dumps(body).encode() if body is not None else None
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status, out = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, out = e.code, e.read()
    assert status == expect, f"{method} {path}: expected {expect}, got {status}: {out[:400]}"
    return out if raw else (json.loads(out) if out else None)


def ok(name, cond, detail=""):
    global PASSED
    assert cond, f"FAILED: {name} {detail}"
    PASSED += 1
    print(f"  ok  {name}")


def wait(path, done, timeout=120):
    end = time.time() + timeout
    while time.time() < end:
        r = call("GET", path)
        if done(r):
            return r
        time.sleep(1)
    raise AssertionError(f"timeout on {path}: {str(r)[:300]}")


TOKEN = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})["access_token"]

print("knowledge base detail")
d = call("GET", "/api/kb/requirements/AIA-Art.10")
ok("requirement detail with amendment, objectives, related and source", d["group"].startswith("CHAPTER III") and d["text"] and "amended" in d["status_note"]
   and "paragraph 5 is deleted" in d["amendments"][0]["instruction"] and any(o["id"] == "CCO-07" for o in d["objectives"])
   and any(r["ref"] == "ISO42001-A.7.4" and r["via"] == "CCO-07" for r in d["related"]) and d["source"]["verification"], str(d)[:300])
a4 = call("GET", "/api/kb/requirements/AIA-Art.4")
ok("replaced article shows the 2026 wording", "support the development of AI literacy" in a4["text"] and a4["amendments"] == [])
ok("inserted article available", call("GET", "/api/kb/requirements/AIA-Art.4a")["status_note"].startswith("inserted by"))
call("GET", "/api/kb/requirements/AIA-Art.999", expect=404)
ov = call("GET", "/api/kb/eu-ai-act/overview")
ok("AI Act overview: verified timeline and decision tree", any(t["date"] == "2027-12-02" for t in ov["timeline"]) and "primary source" in ov["timeline_verification"]
   and len(ov["decision_tree"]) == 7 and ov["penalties"][0]["max_eur"] == 35000000)
types = call("GET", "/api/kb/assessment-types")
ok("seven assessment types", [t["id"] for t in types][:2] == ["fria", "annex-iv-technical-documentation"] and len(types) == 7 and all(t["sections"] >= 6 for t in types))

print("workspace setup")
A = call("POST", "/api/workspaces", {"name": f"M3 test {uuid.uuid4().hex[:8]}"})["id"]
POLICY = b"# Data Governance Policy\n\n## 2. Data quality\nTraining, validation and testing data sets must meet documented data quality requirements before use.\n"
boundary = uuid.uuid4().hex
body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"files\"; filename=\"Data Governance Policy.md\"\r\nContent-Type: text/markdown\r\n\r\n").encode() + POLICY + f"\r\n--{boundary}--\r\n".encode()
req = urllib.request.Request(BASE + f"/api/workspaces/{A}/documents", data=body, method="POST",
                             headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": f"multipart/form-data; boundary={boundary}"})
doc = json.loads(urllib.request.urlopen(req, timeout=60).read())[0]
wait(f"/api/workspaces/{A}/documents/{doc['id']}", lambda r: r["status"] in ("ready", "failed"))
tag = next(a for a in call("GET", f"/api/workspaces/{A}/approvals?status=pending") if a["payload"].get("cco_id") == "CCO-07")
call("POST", f"/api/workspaces/{A}/approvals/{tag['id']}/decide", {"decision": "approve"})
system = call("POST", f"/api/workspaces/{A}/systems", {"kind": "system", "name": "CV Screening", "org_role": "deployer", "document_ids": [doc["id"]]})
call("GET", f"/api/workspaces/{A}/systems/{system['id']}/obligations", expect=409)
run = call("POST", f"/api/workspaces/{A}/systems/{system['id']}/assess")
run = wait(f"/api/workspaces/{A}/runs/{run['id']}", lambda r: r["status"] in ("waiting_approval", "failed"))
call("POST", f"/api/workspaces/{A}/approvals/{run['pending_approval_id']}/decide", {"decision": "approve"})
run = wait(f"/api/workspaces/{A}/runs/{run['id']}", lambda r: r["status"] in ("completed", "failed"))
ok("assessment run completed", run["status"] == "completed", str(run.get("error")))
for ap in call("GET", f"/api/workspaces/{A}/approvals?status=pending"):
    if ap["kind"] == "assessment_findings" and ap["payload"]["framework"] in ("iso-42001", "gdpr"):
        call("POST", f"/api/workspaces/{A}/approvals/{ap['id']}/decide", {"decision": "approve"})

print("framework modules")
iso = call("GET", f"/api/workspaces/{A}/frameworks/iso-42001")
rows = {r["ref"]: r for r in iso["requirements"]}
ok("ISO module: 65 requirements in two groups with statuses", iso["counts"]["total"] == 65 and iso["groups"] == ["Clauses 4–10", "Annex A"]
   and rows["ISO42001-A.7.4"]["status"] == "partial" and rows["ISO42001-6.1.2"]["status"] == "gap" and rows["ISO42001-A.7.4"]["evidence_documents"] == 1
   and rows["ISO42001-A.7.4"]["findings"][0]["system_name"] == "CV Screening", str(iso["counts"]))
ok("evidence on one objective marks other ISO controls", rows["ISO42001-A.7.2"]["status"] == "evidence_present")
ai = call("GET", f"/api/workspaces/{A}/frameworks/eu-ai-act")
air = {r["ref"]: r for r in ai["requirements"]}
ok("AI Act module: proposals do not change status, evidence does", air["AIA-Art.10"]["status"] == "evidence_present" and air["AIA-Art.4"]["status"] == "not_assessed"
   and any(f["review_status"] == "proposed" for f in air["AIA-Art.4"]["findings"]) and "AIA-Art.4a" in air and ai["counts"]["gap"] == 0, str(ai["counts"]))
gd = call("GET", f"/api/workspaces/{A}/frameworks/gdpr")
ok("GDPR module lists the 30 AI-relevant articles", gd["counts"]["total"] == 30 and next(r for r in gd["requirements"] if r["ref"] == "GDPR-Art.35")["status"] == "gap")
call("GET", f"/api/workspaces/{A}/frameworks/unknown", expect=404)
ob = call("GET", f"/api/workspaces/{A}/systems/{system['id']}/obligations")
obl = {o["ref"]: o for o in ob["obligations"]}
ok("obligations follow the approved class and role", ob["risk_class"] == "high-risk-annex-iii" and ob["org_role"] == "deployer" and {"AIA-Art.26", "AIA-Art.27", "AIA-Art.4"} <= set(obl)
   and "AIA-Art.9" not in obl and obl["AIA-Art.26"]["status"] == "partial" and obl["AIA-Art.26"]["review_status"] == "proposed", str(list(obl)))

print("ISO statement of applicability")
soa = call("GET", f"/api/workspaces/{A}/iso/soa")
ok("38 controls with defaults and computed status", len(soa) == 38 and all(r["applicable"] and r["implementation_status"] == "not_started" for r in soa)
   and next(r for r in soa if r["control_id"] == "A.7.4")["evidence_documents"][0]["filename"] == "Data Governance Policy.md")
call("PUT", f"/api/workspaces/{A}/iso/soa/ISO42001-A.10.4", {"applicable": False}, expect=422)
row = call("PUT", f"/api/workspaces/{A}/iso/soa/ISO42001-A.10.4", {"applicable": False, "justification": "No customers: internal use only", "owner": "CISO"})
ok("exclusion needs a justification and records who decided", row["applicable"] is False and row["updated_by"] == EMAIL and row["owner"] == "CISO")
call("PUT", f"/api/workspaces/{A}/iso/soa/ISO42001-A.99.9", {"applicable": True}, expect=404)

print("nonconformities and CAPA")
call("POST", f"/api/workspaces/{A}/nonconformities", {"requirement_ref": "ISO42001-NOPE", "title": "x", "grade": "minor"}, expect=422)
nc = call("POST", f"/api/workspaces/{A}/nonconformities", {"requirement_ref": "ISO42001-6.1.2", "title": "No AI risk assessment method", "grade": "major",
                                                           "system_id": system["id"], "due_date": "2027-01-31"})
ok("nonconformity raised", nc["status"] == "open" and nc["requirement_title"] == "AI risk assessment" and nc["system_name"] == "CV Screening" and nc["due_date"] == "2027-01-31")
call("PUT", f"/api/workspaces/{A}/nonconformities/{nc['id']}", {"status": "closed"}, expect=422)
nc = call("PUT", f"/api/workspaces/{A}/nonconformities/{nc['id']}", {"root_cause": "No owner assigned", "corrective_action": "Adopt ISO 23894 method", "status": "closed"})
ok("closing requires a corrective action and records the verifier", nc["status"] == "closed" and nc["verified_by"] == EMAIL and nc["closed_at"])
ok("filter by status", len(call("GET", f"/api/workspaces/{A}/nonconformities?status=open")) == 0 and len(call("GET", f"/api/workspaces/{A}/nonconformities?status=closed")) == 1)

print("NIST scorecard")
sc = call("GET", f"/api/workspaces/{A}/nist/scorecard")
fn = {f["id"]: f for f in sc["functions"]}
ok("maturity per function from the latest run, 72 subcategories", fn["GOVERN"]["maturity"] == 2.0 and fn["MEASURE"]["maturity"] == 0.0 and fn["GOVERN"]["systems"][0]["name"] == "CV Screening"
   and sum(len(c["subcategories"]) for f in sc["functions"] for c in f["categories"]) == 72 and "no maturity levels" in sc["scale_note"])

print("assisted assessment (FRIA)")
call("POST", f"/api/workspaces/{A}/assessments", {"system_id": system["id"], "type": "nope"}, expect=422)
fria = call("POST", f"/api/workspaces/{A}/assessments", {"system_id": system["id"], "type": "fria"})
ok("created from the template, empty", fria["status"] == "draft" and len(fria["sections"]) == 10 and fria["sections"][1]["basis"].endswith("Art. 27(1)(a)")
   and all(s["source"] == "empty" for s in fria["sections"]) and fria["agent"] == "EU AI Act Specialist")
call("POST", f"/api/workspaces/{A}/assessments", {"system_id": system["id"], "type": "fria"}, expect=409)
fria = call("PUT", f"/api/workspaces/{A}/assessments/{fria['id']}/sections/s0", {"content": "FRIA required: Annex III point 4 deployer in recruitment."})
ok("user-written section", fria["sections"][0]["source"] == "user")
call("POST", f"/api/workspaces/{A}/assessments/{fria['id']}/draft")
call("POST", f"/api/workspaces/{A}/assessments/{fria['id']}/submit", expect=409)
fria = wait(f"/api/workspaces/{A}/assessments/{fria['id']}", lambda r: r["status"] != "drafting")
s = fria["sections"]
ok("agent never overwrites what the user wrote", s[0]["content"].startswith("FRIA required") and s[0]["source"] == "user", fria.get("draft_error") or "")
ok("drafted sections carry verified citations", s[1]["source"] == "ai" and s[1]["supported"] and s[1]["evidence"][0]["quote_verified"] and s[1]["evidence"][0]["filename"] == "Data Governance Policy.md"
   and fria["model"], str(s[1])[:300])
ok("section with a fabricated quote is flagged unsupported", s[2]["source"] == "ai" and s[2]["supported"] is False and s[2]["evidence"][0]["quote_verified"] is False)
ok("missing facts become questions, not invented text", s[3]["content"] == "" and s[3]["source"] == "empty" and len(s[3]["needs_input"]) == 2)
fria = call("PUT", f"/api/workspaces/{A}/assessments/{fria['id']}/sections/s1", {"content": s[1]["content"] + " Reviewed."})
ok("editing an AI section is tracked", fria["sections"][1]["source"] == "ai_edited")
fria = call("POST", f"/api/workspaces/{A}/assessments/{fria['id']}/submit")
ap = next(a for a in call("GET", f"/api/workspaces/{A}/approvals?status=pending") if a["id"] == fria["pending_approval_id"])
ok("approval warns about empty and unsupported sections", ap["kind"] == "assessment_document" and ap["payload"]["sections_empty"] == 1 and ap["payload"]["sections_unsupported"] == 1
   and "without a verified source" in ap["summary"])
call("PUT", f"/api/workspaces/{A}/assessments/{fria['id']}/sections/s1", {"content": "x"}, expect=409)
call("POST", f"/api/workspaces/{A}/approvals/{ap['id']}/decide", {"decision": "approve", "comment": "Accepted with open points"})
fria = call("GET", f"/api/workspaces/{A}/assessments/{fria['id']}")
ok("approved with a content hash and approver", fria["status"] == "approved" and len(fria["content_hash"]) == 64 and fria["approved_by"] == EMAIL
   and fria["content_hash"] == ap["payload"]["content_hash"])
call("DELETE", f"/api/workspaces/{A}/assessments/{fria['id']}", expect=409)
approved_hash = fria["content_hash"]
fria = call("POST", f"/api/workspaces/{A}/assessments/{fria['id']}/revise")
ok("revision starts version 2 as a draft", fria["status"] == "draft" and fria["version"] == 2 and fria["content_hash"] is None)
dpia = call("POST", f"/api/workspaces/{A}/assessments", {"system_id": system["id"], "type": "ai-enhanced-dpia"})
ok("DPIA uses the GDPR specialist", dpia["agent"] == "Data Protection & GDPR Specialist" and dpia["category"] == "gdpr" and len(call("GET", f"/api/workspaces/{A}/assessments?system_id={system['id']}")) == 2)
call("DELETE", f"/api/workspaces/{A}/assessments/{dpia['id']}", expect=204)

print("compliance graph")
g = call("GET", f"/api/workspaces/{A}/graph")
nodes = {n["id"]: n for n in g["nodes"]}
kinds = {}
for n in g["nodes"]:
    kinds[n["type"]] = kinds.get(n["type"], 0) + 1
ok("nodes: 27 objectives, requirements, the document and the system", kinds["objective"] == 27 and kinds["requirement"] > 180 and kinds["document"] == 1 and kinds["system"] == 1, str(kinds))
ok("every edge connects existing nodes", all(e["source"] in nodes and e["target"] in nodes for e in g["edges"]))
ok("statuses on nodes", nodes["ISO42001-A.7.4"]["status"] == "partial" and nodes["AIA-Art.10"]["status"] == "evidence_present" and nodes["CCO-07"]["status"] == "partial"
   and nodes["CCO-05"]["status"] == "gap", f"{nodes['CCO-07']['status']} {nodes['CCO-05']['status']}")
ok("evidence and finding edges", any(e["type"] == "evidence" and e["target"] == "CCO-07" and e["status"] == "approved" for e in g["edges"])
   and any(e["type"] == "finding" and e["target"] == "ISO42001-A.7.4" and e["review_status"] == "approved" for e in g["edges"])
   and any(e["type"] == "finding" and e["origin"] == "crosswalk" for e in g["edges"]))
ok("one click away: Art. 10 reaches ISO A.7.4 through CCO-07", {"AIA-Art.10", "ISO42001-A.7.4"} <= {e["source"] for e in g["edges"] if e["target"] == "CCO-07" and e["type"] == "belongs_to"})

print("audit")
entries = call("GET", f"/api/audit?workspace_id={A}&limit=400")["entries"]
actions = {e["action"] for e in entries}
ok("module actions are audited", {"soa.updated", "nonconformity.raised", "nonconformity.updated", "assessment.created", "assessment.drafted", "assessment.section_edited",
                                  "assessment.submitted", "assessment.revision_started"} <= actions, str(sorted(actions)))
dec = next(e for e in entries if e["action"] == "approval.approved" and e["payload"].get("assessment_id") == fria["id"])
ok("approval entry stores the hash of the approved content", dec["payload"]["content_hash"] == approved_hash and dec["payload"]["sections_unsupported"] == 1 and dec["actor"] == EMAIL)
export = call("GET", "/api/audit/export", raw=True).decode().strip().split("\n")
last = json.loads(export[-1])
ok("audit export: one line per entry plus the verification result", last["verify"]["ok"] and last["verify"]["checked"] == len(export) - 1 and json.loads(export[0])["seq"] == 1)
print(f"\n{PASSED} checks passed")
