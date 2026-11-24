# API contract — Milestone 2 (additions to Milestone 1)

Same conventions as `api-m1.md`. Everything here is workspace-scoped unless noted.

## Inventory: AI systems and agents

System object:
```json
{"id": "uuid", "kind": "system | agent", "name": "CV Screening", "description": "…", "intended_purpose": "…",
 "business_owner": "HR", "org_role": "provider | deployer | importer | distributor | unknown",
 "lifecycle": "idea | development | production | retired", "uses_personal_data": true, "vendor": "…", "base_model": "…",
 "deployment": "free text, e.g. SaaS, EU region",
 "agent_card": null,
 "risk_class": "prohibited | high-risk-annex-i | high-risk-annex-iii | limited-transparency | minimal | out-of-scope | null",
 "risk_class_status": "none | proposed | approved",
 "risk_class_rationale": "text or null",
 "document_ids": ["uuid"],
 "last_run": {"id": "uuid", "status": "…", "created_at": "…"},
 "open_findings": {"gap": 2, "partial": 3},
 "created_at": "…", "updated_at": "…"}
```
`agent_card` (only when `kind` is `agent`):
```json
{"tools": [{"name": "send_email", "description": "…", "write_access": true}], "data_sources": ["CRM"],
 "guardrails": ["PII filter"], "autonomy_level": 3, "human_oversight": "…", "memory": "…", "kill_switch": "…",
 "agentic_risks": ["ASI01"]}
```
`autonomy_level`: 1 = suggests only, 2 = acts with approval of each step, 3 = acts within limits and reports, 4 = acts autonomously with monitoring, 5 = fully autonomous. `agentic_risks`: ids from `GET /api/kb/agentic-risks`.

- `GET /api/workspaces/{wid}/systems` → `[system]`
- `POST /api/workspaces/{wid}/systems` (all fields except id, risk_*, last_run, open_findings, timestamps; `name` and `kind` required) → system
- `GET | PUT | DELETE /api/workspaces/{wid}/systems/{id}`
- `PUT /api/workspaces/{wid}/systems/{id}/risk-class` `{risk_class, rationale}` → system (manual classification by the user: stored as `approved`, audited)

## Assessment runs (multi-agent orchestrator)

- `POST /api/workspaces/{wid}/systems/{id}/assess` → run. 409 if a run for this system is already active, or if no reasoning model is configured.

Run object:
```json
{"id": "uuid", "system_id": "uuid", "system_name": "…", "status": "queued | running | waiting_approval | completed | failed",
 "pending_approval_id": "uuid or null", "error": null, "summary": "executive synthesis or null",
 "steps": [{"key": "context", "agent": "Orchestrator", "label": "Collect system context and evidence",
            "status": "pending | running | done | failed | waiting | skipped", "model": "provider/model or null",
            "started_at": "…", "finished_at": "…", "summary": "one line", "error": null}],
 "result": {"classification": {…} , "gdpr": {…}, "nist": {…}} ,
 "created_at": "…", "finished_at": "…"}
```
Step keys, in order: `context`, `eu_ai_act_classification`, `classification_approval` (human), then in parallel `eu_ai_act_obligations`, `gdpr`, `iso_42001`, `nist`, then `crosswalk_risk`, `synthesis`.

`result.classification`: `{in_scope: bool, org_role, risk_class, annex_iii_point: "string or null", prohibited_practice: "string or null", art6_3_derogation: {applies: bool, reason}, transparency_obligations: ["Art. 50(1)", …], gpai: bool, confidence: 0–1, rationale, decision_path: [{step: 1, question, answer, basis: ["AIA-Art.5"]}], missing_information: ["…"], approved_class: "… or null", approved_by, approved_comment}`
`result.gdpr`: `{personal_data: bool, legal_basis: "string or null", dpia_required: bool, dpia_rationale, automated_decision_art22: bool, transfers_outside_eu: bool, summary}`
`result.nist`: `{maturity: {GOVERN: 0–5, MAP: 0–5, MEASURE: 0–5, MANAGE: 0–5}, summary}`
Any of these may be absent while the run is in progress.

- `GET /api/workspaces/{wid}/runs?system_id=&active=` → `[run]` newest first (poll every 2 s while any run is `queued`/`running`)
- `GET /api/workspaces/{wid}/runs/{id}` → run

## Findings

Finding object:
```json
{"id": "uuid", "run_id": "uuid", "system_id": "uuid", "framework": "eu-ai-act | gdpr | iso-42001 | nist-ai-rmf",
 "requirement_ref": "AIA-Art.10", "requirement_title": "Data and data governance",
 "status": "compliant | partial | gap | not_applicable | insufficient_evidence", "rationale": "…",
 "evidence": [{"document_id": "uuid", "filename": "…", "page": 4, "section": "…", "quote": "…", "quote_verified": true}],
 "origin": "agent | crosswalk", "via": "CCO-07 from ISO42001-A.7.4 or null",
 "review_status": "proposed | approved | rejected", "agent": "…", "model": "…", "created_at": "…"}
```
- `GET /api/workspaces/{wid}/systems/{id}/findings?run_id=` → `[finding]` (latest run by default)
- `POST /api/workspaces/{wid}/findings/{id}/review` `{decision: "approve" | "reject", status?: "<override status>", comment?}` → finding

## Risks (data for the heat map, shown as a list in M2)

Risk object: `{id, system_id, run_id, risk_id: "mit-ai-risk-subdomain-1.1", name, domain, likelihood: 1–5, severity: 1–5, score, rationale, mitigating_objectives: ["CCO-08"], review_status: "proposed | approved | rejected", model, created_at}`
- `GET /api/workspaces/{wid}/systems/{id}/risks` → `[risk]`
- `POST /api/workspaces/{wid}/risks/{id}/review` `{decision, likelihood?, severity?, comment?}` → risk

## Approval queue: new kinds

Same endpoints as M1. New `kind` values:
- `risk_classification` — the run is paused until decided. `payload`: `{run_id, system_id, proposed_class, rationale, decision_path, confidence, missing_information}`. Decide body may add `override_class` (one of the risk_class values) when approving a different class than proposed; rejecting stops the run (status `failed`, error "Classification rejected").
- `assessment_findings` — one per framework per run. `payload`: `{run_id, system_id, framework, finding_ids: [...], counts: {gap, partial, compliant, …}}`. Approving approves every finding in it that is still `proposed`; rejecting rejects them. Individual findings can be reviewed first through the findings endpoint.

## Compliance status ("assess once, comply many")

- `GET /api/workspaces/{wid}/compliance` →
```json
{"frameworks": [{"id": "eu-ai-act", "name": "EU AI Act", "total": 59, "compliant": 2, "partial": 4, "gap": 3,
                 "evidence_present": 10, "not_applicable": 0, "not_assessed": 40}],
 "objectives": [{"id": "CCO-07", "name_en": "…", "approved_evidence": 2, "documents": [{"id", "filename"}],
                 "requirements": [{"ref": "AIA-Art.10", "framework": "eu-ai-act", "title": "…", "strength": "primary | supporting",
                                   "status": "compliant | partial | gap | not_applicable | evidence_present | not_assessed"}]}]}
```
Only requirements that belong to at least one control objective are counted. A requirement's status is the worst approved finding across systems; otherwise `evidence_present` if an objective it belongs to (as primary) has approved evidence; otherwise `not_assessed`.

## Knowledge base lookups (not workspace-scoped)
- `GET /api/kb/requirements?framework=` → `[{ref, framework, title}]`
- `GET /api/kb/agentic-risks` → `[{id: "ASI01", name, description}]`

## Settings
`agent_roles` in `GET /api/settings/llm` now lists: `orchestrator`, `ingestion`, `eu_ai_act`, `gdpr`, `iso_42001`, `nist`, `crosswalk`. Routing for each works as in M1 (unset = reasoning model).
