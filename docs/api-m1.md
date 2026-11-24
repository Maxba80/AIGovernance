# API contract — Milestone 1

Base path `/api`. JSON everywhere except file upload. Auth: `Authorization: Bearer <token>` on every route except `/api/health` and `/api/auth/login`. Errors: `{"detail": "message"}` with a 4xx/5xx status; 401 means the token is missing or expired.

## Auth
- `POST /api/auth/login` `{email, password}` → `{access_token, user: {id, email, name, role}}`
- `GET /api/auth/me` → `{id, email, name, role}`

## Health and knowledge base
- `GET /api/health` → `{status: "ok", database: true, version}`
- `GET /api/kb/summary` → `{frameworks: [{id, name, requirements}], common_control_objectives, templates, risks, sources: [{id, title, version, status, verification}]}`

## Workspaces
- `GET /api/workspaces` → `[{id, name, description, created_at, document_count}]`
- `POST /api/workspaces` `{name, description?}` → workspace
- `DELETE /api/workspaces/{wid}` → 204 (refused with 409 while it has documents)

## Documents (evidence)
`status`: `queued | parsing | chunking | embedding | tagging | ready | failed`. `progress`: 0–100.

Document object:
```json
{"id": "uuid", "filename": "Policy.pdf", "mime": "application/pdf", "size": 12345, "sha256": "…",
 "doc_type": "policy | use_case | governance | audit_report | technical_log | contract | other | null",
 "doc_type_source": "ai | user | null", "status": "ready", "progress": 100, "stage_detail": "text or null",
 "error": null, "pages": 12, "chunk_count": 40, "embedding_model": "provider/model or null",
 "tags": [{"id": "uuid", "cco_id": "CCO-07", "cco_name": "Data governance and data quality", "confidence": 0.82,
           "status": "proposed | approved | rejected", "rationale": "…",
           "citation": {"page": 4, "section": "3.1 Data quality", "quote": "…"}, "model": "provider/model"}],
 "created_at": "ISO-8601"}
```
- `POST /api/workspaces/{wid}/documents` multipart, field `files` (one or more) → `[document]` (status `queued`). Accepted: pdf, docx, xlsx, csv, txt, md, json. Duplicate content in the same workspace returns 409 with `{"detail": "...", "existing_id": "uuid"}`.
- `GET /api/workspaces/{wid}/documents` → `[document]` (poll every 2 s while any document is not `ready`/`failed`)
- `GET /api/workspaces/{wid}/documents/{id}` → document
- `DELETE /api/workspaces/{wid}/documents/{id}` → 204
- `POST /api/workspaces/{wid}/documents/{id}/reprocess` → document (re-queues)
- `PATCH /api/workspaces/{wid}/documents/{id}` `{doc_type}` → document
- `GET /api/workspaces/{wid}/documents/{id}/chunks?page=` → `[{id, ordinal, page, section, text}]`

## Search (RAG retrieval with citations)
- `POST /api/workspaces/{wid}/search` `{query, top_k?: 8}` → `{embedding_model, results: [{chunk_id, document_id, filename, page, section, text, score}]}`. 409 if no embedding model is configured.

## Approval queue (human-in-the-loop)
Approval object: `{id, kind: "evidence_tag", title, summary, agent, model, confidence, payload: {…}, sources: [{document_id, filename, page, section, quote}], status: "pending | approved | rejected", decided_by, decided_at, comment, created_at}`
- `GET /api/workspaces/{wid}/approvals?status=pending` → `[approval]`
- `POST /api/workspaces/{wid}/approvals/{id}/decide` `{decision: "approve" | "reject", comment?}` → approval

## LLM settings (take effect immediately, no restart)
Provider object: `{id, name, kind: "openai_compatible" | "anthropic", base_url: "string or null", has_api_key: bool, enabled: bool, preset: "ollama | lmstudio | vllm | openai | azure_openai | gemini | anthropic | custom"}`. API keys are write-only: never returned.
- `GET /api/settings/llm` → `{providers: [provider], routing: {reasoning: {provider_id, model} | null, embedding: {provider_id, model} | null, agents: {ingestion: {provider_id, model} | null}}, agent_roles: [{id: "ingestion", label, description}], presets: [{preset, kind, name, base_url, needs_api_key, suggested_models: {reasoning: [..], embedding: [..]}}]}`
- `POST /api/settings/llm/providers` `{name, kind, preset, base_url?, api_key?, enabled?}` → provider
- `PUT /api/settings/llm/providers/{id}` same body (omit `api_key` to keep the stored one; send `""` to clear) → provider
- `DELETE /api/settings/llm/providers/{id}` → 204
- `GET /api/settings/llm/providers/{id}/models` → `{models: ["id", …]}` (502 with detail if the provider cannot be reached)
- `PUT /api/settings/llm/routing` `{reasoning?, embedding?, agents?}` (each `{provider_id, model}` or `null`) → routing. Changing `embedding` returns `{..., "reindex_required": true, "documents_affected": n}`.
- `POST /api/settings/llm/test` `{provider_id, model, kind: "chat" | "embedding"}` → `{ok: bool, latency_ms, detail, dimensions?}`
- `POST /api/workspaces/{wid}/reindex` → `{queued: n}` (re-embeds all documents with the current embedding model)

## Audit trail (tamper-evident)
Entry: `{seq, ts, workspace_id, actor, actor_type: "user | agent | system", action, entity_type, entity_id, summary, payload, model, sources, prev_hash, hash}`
- `GET /api/audit?workspace_id=&limit=100&before_seq=` → `{entries: [entry], total}`
- `GET /api/audit/verify` → `{ok: bool, checked: n, first_broken_seq: n | null, head_hash}`

## Jobs (activity)
- `GET /api/workspaces/{wid}/jobs?active=true` → `[{id, kind, document_id, filename, status, stage, progress, agent, model, started_at, finished_at, error}]`
