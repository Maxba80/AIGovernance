# AI Governance Tool

AI Governance, Risk & Compliance workspace for the EU AI Act, GDPR, ISO/IEC 42001 and NIST AI RMF.
Single user, multiple client workspaces, local or cloud models, every AI output traceable to its source.

**Status: Milestone 3** — Docker stack, model settings, evidence ingestion with citations, AI system inventory and Agent Cards, multi-agent assessments (LangGraph) with human approval, cross-framework status, framework modules, assisted assessments (FRIA, DPIA, LIA, TIA, Art. 22, RoPA, Annex IV), ISO Statement of Applicability and CAPA, NIST scorecard, interactive compliance graph, audit trail with export.

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

## Assessing an AI system (Milestone 2)

1. **Inventory → New system / New agent.** Describe it and link the relevant evidence documents. Agents get an Agent Card: base model, tools and write access, data sources, guardrails, autonomy level, oversight, kill switch, agentic risks (OWASP Agentic Top 10).
2. **Run assessment.** The orchestrator runs a fixed flow:
   - collect context and evidence passages;
   - the EU AI Act Specialist proposes a risk class with its decision path;
   - **the run pauses until you approve, change or reject the class**;
   - then, in parallel: EU AI Act obligations, GDPR screening, ISO/IEC 42001 gap analysis, NIST AI RMF maturity;
   - cross-framework propagation and risk identification (MIT AI Risk Repository);
   - an executive synthesis.
3. **Review.** Findings, risks and the synthesis are proposals. Only approved findings change the compliance status.

Rules the agents cannot bypass (enforced in code, not in the prompt):
- a finding must reference a requirement that exists in the knowledge base, or it is dropped;
- a quote must be found verbatim in the cited passage, or it is flagged;
- "compliant" or "partial" without a verified quote is downgraded to "insufficient evidence";
- findings inferred through a shared control objective are labelled as inferred and name their origin; only gaps and partial findings are propagated, at most 15 per run.

Each agent can use a different model (Settings → Model routing). A paused run is checkpointed in PostgreSQL and survives restarts.

## Framework modules and assisted assessments (Milestone 3)

- **Frameworks.** For each framework: every requirement with its status, the control objectives it belongs to, the evidence behind it, and the findings per system. Opening a requirement shows its text, its source and verification level, the 2026 amendments (verbatim) for the EU AI Act, and the related requirements in the other frameworks.
- **EU AI Act.** Application timeline as amended by Regulation (EU) 2026/1744, a manual classification wizard that walks the decision steps, and the obligations that apply to each system given its approved class and role.
- **ISO/IEC 42001.** Statement of Applicability (excluding a control requires a justification) and a nonconformity/CAPA log (closing requires a corrective action).
- **NIST AI RMF.** Maturity per function from the latest assessment of each system, and the status of the 72 subcategories.
- **Assisted assessments.** FRIA, Annex IV, DPIA, RoPA, LIA, Art. 22 and TIA follow the knowledge-base templates section by section. A specialist agent drafts from the evidence; it never overwrites what you wrote; where facts are missing it asks questions instead of inventing text; a section without a verified quote is flagged. Approval stores the SHA-256 of the approved content; revising starts a new version.
- **Compliance Graph.** Requirements, control objectives, documents and systems as an interactive graph: select a node to see everything connected to it.
- **One status definition.** A requirement's status is the most recent approved finding per system (worst across systems); otherwise "evidence present" when an objective it belongs to has approved evidence; otherwise "not assessed". Unapproved proposals never change it.
- **Audit export.** The whole trail as NDJSON, with the verification result on the last line.

## Known limits

- Scanned PDFs are not read (no OCR).
- Search is vector-only; exact search over all passages, no approximate index (fine for a single user's volumes).
- Changing the embedding model requires re-indexing (the app tells you and offers a button).
- The Anthropic adapter and the cloud presets have been written against the SDK documentation but only the OpenAI-compatible path has been exercised end to end (with a test server). Use *Settings → Test* after adding a key.
- Agent output quality has not been measured with real models. The tests prove the workflow, the validation rules and the audit trail, not the legal quality of the answers.
- Agents see at most 28 evidence passages per run (retrieved by similarity). The number used is recorded on the run and in the audit trail.
- The public repository carries ISO/IEC 42001 identifiers and titles only. With the licensed edition placed at `knowledge-base/frameworks/iso_42001/requirements.licensed.json`, the ISO auditor agent also sees the control statements.
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

```bash
python backend/tests/e2e_m2.py http://<backend-address>:8000 "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
```

```bash
python backend/tests/e2e_m3.py http://<backend-address>:8000 "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
```

## Layout

```
backend/app/          API (routers/), LLM layer (llm/), ingestion (ingestion/), specialist agents (agents/),
                      LangGraph orchestrator (orchestrator/), SQL migrations (migrations/)
frontend/             React + Vite + Tailwind
knowledge-base/       Normative content, crosswalks, templates, source manifest (see its README)
docs/                 API contract per milestone
```

## Roadmap

- **M4** Deliverable generation (DOCX, PDF, XLSX) with white-label branding, risk heat map.
- **M5** MCP server, UX refinement and testing.
