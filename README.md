# AI Governance Tool

AI Governance, Risk & Compliance workspace for the EU AI Act, GDPR, ISO/IEC 42001 and NIST AI RMF.
Single user, multiple client workspaces, local or cloud models, every AI output traceable to its source.

**Status: Milestone 1** — Docker stack, database, model settings, evidence ingestion with citations, approval queue, audit trail.

## Start

```bash
cp .env.example .env
```

Edit `.env`: set `POSTGRES_PASSWORD`, `SECRET_KEY` (`openssl rand -hex 32`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

```bash
docker compose up -d --build
```

Open http://localhost:3000 and sign in with the admin account from `.env`.

Then go to **Settings**:
1. Add an AI provider (Ollama, LM Studio, vLLM, Anthropic, OpenAI, Google Gemini, Azure OpenAI, or any OpenAI-compatible endpoint).
2. Under **Model routing** choose a reasoning model and an embedding model. Changes apply at once, without a restart.

To run Ollama as a container instead of on the host:

```bash
docker compose --profile local-llm up -d
```

and set `OLLAMA_BASE_URL=http://ollama:11434` in `.env`.

## What is inside

| Service | Role |
|---|---|
| `frontend` | React single-page app served by nginx (port 3000) |
| `backend` | FastAPI: API, retrieval, settings, audit trail |
| `worker` | Same image as the backend: ingests documents from a PostgreSQL job queue |
| `database` | PostgreSQL 16 with pgvector: relational data and vectors |
| `ollama` | Optional local model server (profile `local-llm`) |

Volumes: `pgdata`, `uploads`, `exports`, `ollama`. The `knowledge-base/` folder is mounted read-only.

## How traceability works

- **Citations.** Every evidence link proposed by the Ingestion & Evidence Agent names the page, section and a verbatim quote. The quote is checked against the stored text; if it is not found, the proposal is marked and its confidence capped.
- **Human approval.** Proposals wait in the approval queue. Nothing counts as evidence until approved.
- **Audit trail.** Uploads, agent runs, approvals and settings changes are appended to `audit_log`. Each entry stores the SHA-256 of its content plus the previous entry's hash. The table refuses updates and deletes; *Activity → Verify chain* recomputes every hash and reports the first altered entry.
- **Workspace isolation.** PostgreSQL row-level security: the application role can only read rows of the workspace set for the current transaction.
- **Partial coverage is recorded.** For long documents the agent classifies from a sample of passages; the audit entry states how many of the total were considered.

## Known limits (Milestone 1)

- Scanned PDFs are not read (no OCR).
- Search is vector-only; exact search over all passages, no approximate index (fine for a single user's volumes).
- Changing the embedding model requires re-indexing (the app tells you and offers a button).
- The Anthropic adapter and the cloud presets have been written against the SDK documentation but only the OpenAI-compatible path has been exercised end to end (with a test server). Use *Settings → Test* after adding a key.
- The audit chain detects alteration; it does not prevent a database administrator from rewriting the whole chain. Export the head hash periodically if you need an external anchor.

## Tests

```bash
pip install -r backend/requirements-dev.txt
cd backend && pytest tests/test_units.py
```

End-to-end, against the running stack (uses a deterministic fake model server, tests only):

```bash
python backend/tests/fake_llm.py 18080 &
python backend/tests/e2e.py http://<backend-address>:8000 "$ADMIN_EMAIL" "$ADMIN_PASSWORD" http://host.docker.internal:18080/v1 knowledge-base/sources/raw/nist_ai_600-1.pdf
```

## Layout

```
backend/app/          API, LLM layer (llm/), ingestion (ingestion/), SQL migrations (migrations/)
frontend/             React + Vite + Tailwind
knowledge-base/       Normative content, crosswalks, templates, source manifest (see its README)
docs/                 API contract per milestone
```

## Roadmap

- **M2** LangGraph orchestrator and specialist agents, AI system inventory and Agent Cards, crosswalk data model.
- **M3** EU AI Act, GDPR, ISO 42001 and NIST modules, interactive compliance graph.
- **M4** Deliverable generation (DOCX, PDF, XLSX) with white-label branding, risk heat map.
- **M5** MCP server, UX refinement and testing.
