"""End-to-end check of Milestone 2 (inventory, orchestrator, findings, compliance).
Run after e2e.py on the same stack (it reuses the 'Fake local' provider and the policy document).

Usage: python e2e_m2.py <api_base_url> <admin_email> <admin_password>
"""
import json
import sys
import time
import urllib.error
import urllib.request

BASE, EMAIL, PASSWORD = sys.argv[1:4]
TOKEN = None
PASSED = 0


def call(method, path, body=None, expect=200):
    headers = {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}
    data = json.dumps(body).encode() if body is not None else None
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    assert status == expect, f"{method} {path}: expected {expect}, got {status}: {raw[:400]}"
    return json.loads(raw) if raw else None


def ok(name, cond, detail=""):
    global PASSED
    assert cond, f"FAILED: {name} {detail}"
    PASSED += 1
    print(f"  ok  {name}")


def wait_run(wid, run_id, until, timeout=120):
    end = time.time() + timeout
    while time.time() < end:
        r = call("GET", f"/api/workspaces/{wid}/runs/{run_id}")
        if r["status"] in until:
            return r
        time.sleep(1)
    raise AssertionError(f"timeout: run is {r['status']}: {r}")


TOKEN = call("POST", "/api/auth/login", {"email": EMAIL, "password": PASSWORD})["access_token"]
A = call("GET", "/api/workspaces")[0]["id"]
roles = [r["id"] for r in call("GET", "/api/settings/llm")["agent_roles"]]
ok("seven agent roles", roles == ["orchestrator", "ingestion", "eu_ai_act", "gdpr", "iso_42001", "nist", "crosswalk"], str(roles))
docs = call("GET", f"/api/workspaces/{A}/documents")
policy = next(d for d in docs if d["filename"] == "Data Governance Policy.md")

print("inventory")
ok("kb lookups", len(call("GET", "/api/kb/agentic-risks")) == 10 and len(call("GET", "/api/kb/requirements?framework=iso-42001")) == 65)
call("POST", f"/api/workspaces/{A}/systems", {"kind": "robot", "name": "x"}, expect=422)
sysm = call("POST", f"/api/workspaces/{A}/systems", {"kind": "system", "name": "CV Screening", "intended_purpose": "Rank job applicants",
            "org_role": "deployer", "lifecycle": "production", "uses_personal_data": True, "vendor": "HireCo", "document_ids": [policy["id"]]})
agent = call("POST", f"/api/workspaces/{A}/systems", {"kind": "agent", "name": "Support Agent", "base_model": "claude-opus-5-5",
             "agent_card": {"tools": [{"name": "refund", "description": "Issue refunds", "write_access": True}], "data_sources": ["CRM"],
                            "guardrails": ["PII filter"], "autonomy_level": 3, "human_oversight": "Refunds above 100 EUR need approval",
                            "kill_switch": "Feature flag", "agentic_risks": ["ASI01", "ASI02"]}})
ok("system and agent card stored", sysm["risk_class"] is None and sysm["risk_class_status"] == "none" and agent["agent_card"]["tools"][0]["write_access"] is True
   and agent["agent_card"]["autonomy_level"] == 3)
ok("listed", len(call("GET", f"/api/workspaces/{A}/systems")) >= 2)

print("orchestrated assessment")
run = call("POST", f"/api/workspaces/{A}/systems/{sysm['id']}/assess")
ok("run created with nine steps", [s["key"] for s in run["steps"]] == ["context", "eu_ai_act_classification", "classification_approval", "eu_ai_act_obligations",
                                                                        "gdpr", "iso_42001", "nist", "crosswalk_risk", "synthesis"])
call("POST", f"/api/workspaces/{A}/systems/{sysm['id']}/assess", expect=409)
run = wait_run(A, run["id"], ("waiting_approval", "failed"))
ok("orchestrator pauses for human approval", run["status"] == "waiting_approval" and run["pending_approval_id"], str(run)[:400])
steps = {s["key"]: s for s in run["steps"]}
ok("steps before the gate are done, later ones untouched", steps["context"]["status"] == "done" and steps["eu_ai_act_classification"]["status"] == "done"
   and steps["classification_approval"]["status"] == "waiting" and steps["gdpr"]["status"] == "pending", str({k: v["status"] for k, v in steps.items()}))
ok("context step cites the linked document", "passages" in steps["context"]["summary"])
cl = run["result"]["classification"]
ok("classification proposed, invalid basis removed", cl["risk_class"] == "high-risk-annex-iii" and cl["approved_class"] is None
   and cl["decision_path"][0]["basis"] == ["AIA-Art.5"], str(cl["decision_path"]))
s1 = call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}")
ok("system shows the class as proposed only", s1["risk_class"] == "high-risk-annex-iii" and s1["risk_class_status"] == "proposed")
ap = next(a for a in call("GET", f"/api/workspaces/{A}/approvals?status=pending") if a["id"] == run["pending_approval_id"])
ok("approval carries decision path and missing information", ap["kind"] == "risk_classification" and ap["payload"]["missing_information"] and ap["model"])
ok("nothing downstream has run before approval", call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}/findings") == [])
call("POST", f"/api/workspaces/{A}/approvals/{ap['id']}/decide", {"decision": "approve", "comment": "Recruitment use confirmed"})
run = wait_run(A, run["id"], ("completed", "failed"))
ok("run completes after approval", run["status"] == "completed", str(run.get("error")))
ok("all steps done", all(s["status"] == "done" for s in run["steps"]), str({s["key"]: (s["status"], s["error"]) for s in run["steps"]}))
ok("approval recorded in result", run["result"]["classification"]["approved_class"] == "high-risk-annex-iii" and run["result"]["classification"]["approved_by"] == EMAIL)
ok("gdpr and nist results", run["result"]["gdpr"]["dpia_required"] is True and run["result"]["nist"]["maturity"]["GOVERN"] == 2)
ok("executive synthesis", "human review" in run["summary"])
ok("system class approved", call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}")["risk_class_status"] == "approved")

print("findings")
fs = call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}/findings")
by = {f["requirement_ref"]: f for f in fs if f["origin"] == "agent"}
ok("invalid requirement id dropped", "AIA-Art.1234" not in by and {"AIA-Art.26", "AIA-Art.27", "AIA-Art.4", "GDPR-Art.35", "ISO42001-A.7.4", "NIST-MAP-2.3"} <= set(by), str(sorted(by)))
ok("verified quote keeps its status with citation", by["AIA-Art.26"]["status"] == "partial" and by["AIA-Art.26"]["evidence"][0]["quote_verified"]
   and by["AIA-Art.26"]["evidence"][0]["filename"] == "Data Governance Policy.md")
ok("unverifiable 'compliant' claim downgraded", by["AIA-Art.27"]["status"] == "insufficient_evidence" and "Downgraded" in by["AIA-Art.27"]["rationale"])
ok("titles and review state", by["GDPR-Art.35"]["requirement_title"] == "Data protection impact assessment" and all(f["review_status"] == "proposed" for f in fs))
inferred = [f for f in fs if f["origin"] == "crosswalk"]
ok("crosswalk infers findings in other frameworks, clearly marked", len(inferred) > 3 and all(f["via"] and f["rationale"].startswith("Inferred") for f in inferred)
   and all(f["requirement_ref"] not in by for f in inferred), f"{len(inferred)} inferred")
via_iso = [f for f in inferred if "ISO42001-A.7.4" in f["via"]]
ok("ISO data-quality finding propagates to AI Act Art. 10 via CCO", any(f["requirement_ref"] == "AIA-Art.10" for f in inferred), str([(f["requirement_ref"], f["via"]) for f in inferred][:8]))

print("risks")
rs = call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}/risks")
ok("risks from the MIT taxonomy, invalid id dropped, sorted by score", [r["risk_id"] for r in rs] == ["mit-ai-risk-subdomain-1.1", "mit-ai-risk-subdomain-2.1"]
   and rs[0]["score"] == 16 and rs[0]["domain"] and rs[0]["mitigating_objectives"], str(rs)[:300])
r2 = call("POST", f"/api/workspaces/{A}/risks/{rs[0]['id']}/review", {"decision": "approve", "likelihood": 3})
ok("reviewer can adjust the score", r2["review_status"] == "approved" and r2["score"] == 12)

print("compliance status")
before = call("GET", f"/api/workspaces/{A}/compliance")
fw = {f["id"]: f for f in before["frameworks"]}
ok("unapproved findings do not count", all(f["gap"] == 0 and f["partial"] == 0 for f in fw.values()), str(fw))
cco7 = next(o for o in before["objectives"] if o["id"] == "CCO-07")
ok("approved evidence marks linked requirements in every framework", cco7["approved_evidence"] >= 1
   and {r["framework"] for r in cco7["requirements"] if r["status"] == "evidence_present"} == {"eu-ai-act", "gdpr", "iso-42001", "nist-ai-rmf"})
pend = [a for a in call("GET", f"/api/workspaces/{A}/approvals?status=pending") if a["kind"] == "assessment_findings" and a["payload"]["run_id"] == run["id"]]
ok("one findings approval per framework", {a["payload"]["framework"] for a in pend} == {"eu-ai-act", "gdpr", "iso-42001", "nist-ai-rmf"})
gd = next(a for a in pend if a["payload"]["framework"] == "gdpr")
call("POST", f"/api/workspaces/{A}/approvals/{gd['id']}/decide", {"decision": "approve"})
f26 = call("POST", f"/api/workspaces/{A}/findings/{by['AIA-Art.26']['id']}/review", {"decision": "approve", "status": "gap", "comment": "Logs not kept"})
ok("reviewer can override a finding's status", f26["status"] == "gap" and f26["review_status"] == "approved")
after = {f["id"]: f for f in call("GET", f"/api/workspaces/{A}/compliance")["frameworks"]}
ok("approved findings now count", after["gdpr"]["gap"] >= 1 and after["gdpr"]["partial"] >= 1 and after["eu-ai-act"]["gap"] == 1, str(after))
ok("system shows open findings", call("GET", f"/api/workspaces/{A}/systems/{sysm['id']}")["open_findings"]["gap"] >= 2)

print("rejecting a classification stops the run; override on approval")
run2 = call("POST", f"/api/workspaces/{A}/systems/{agent['id']}/assess")
run2 = wait_run(A, run2["id"], ("waiting_approval", "failed"))
call("POST", f"/api/workspaces/{A}/approvals/{run2['pending_approval_id']}/decide", {"decision": "reject", "comment": "Not a recruitment tool"})
run2 = wait_run(A, run2["id"], ("completed", "failed"))
ok("rejected: run failed, later steps skipped, class cleared", run2["status"] == "failed" and "rejected" in run2["error"].lower()
   and {s["status"] for s in run2["steps"] if s["key"] in ("gdpr", "nist", "synthesis")} == {"skipped"}
   and call("GET", f"/api/workspaces/{A}/systems/{agent['id']}")["risk_class"] is None, str(run2["error"]))
run3 = call("POST", f"/api/workspaces/{A}/systems/{agent['id']}/assess")
run3 = wait_run(A, run3["id"], ("waiting_approval", "failed"))
call("POST", f"/api/workspaces/{A}/approvals/{run3['pending_approval_id']}/decide", {"decision": "approve", "override_class": "limited-transparency", "comment": "Chatbot only"})
run3 = wait_run(A, run3["id"], ("completed", "failed"))
a3 = call("GET", f"/api/workspaces/{A}/systems/{agent['id']}")
ok("override: human's class wins and drives the obligations assessed", run3["status"] == "completed" and a3["risk_class"] == "limited-transparency"
   and run3["result"]["classification"]["approved_class"] == "limited-transparency", str(run3.get("error")))
man = call("PUT", f"/api/workspaces/{A}/systems/{agent['id']}/risk-class", {"risk_class": "minimal", "rationale": "Internal tool"})
ok("manual classification", man["risk_class"] == "minimal" and man["risk_class_status"] == "approved")

print("audit")
entries = call("GET", f"/api/audit?workspace_id={A}&limit=400")["entries"]
mine = [e for e in entries if e["entity_id"] == run["id"]]
actions = [e["action"] for e in reversed(mine)]
ok("every agent hand-off is in the audit trail, in order", actions[:3] == ["run.started", "run.context", "run.eu_ai_act_classification"] and actions[-1] == "run.completed"
   and {"run.gdpr", "run.iso_42001", "run.nist", "run.eu_ai_act_obligations", "run.crosswalk_risk", "run.synthesis"} <= set(actions), str(actions))
g = next(e for e in mine if e["action"] == "run.gdpr")
ok("agent entries name the model and the documents consulted", g["actor"] == "Data Protection & GDPR Specialist" and g["actor_type"] == "agent" and g["model"]
   and g["sources"][0]["filename"] == "Data Governance Policy.md")
dec = next(e for e in entries if e["action"] == "approval.approved" and e["payload"].get("run_id") == run["id"] and e["payload"]["kind"] == "risk_classification")
ok("classification approval names the approver and both classes", dec["actor"] == EMAIL and dec["payload"]["proposed_class"] == dec["payload"]["final_class"] == "high-risk-annex-iii")
v = call("GET", "/api/audit/verify")
ok("hash chain still verifies", v["ok"], str(v))
print(f"\n{PASSED} checks passed")
