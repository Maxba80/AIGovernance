-- Milestone 1 schema. Workspace isolation is enforced by row-level security:
-- the application connects, switches to the unprivileged role aigov_app, and
-- sets app.workspace_id per transaction.
CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aigov_app') THEN
    CREATE ROLE aigov_app NOLOGIN;
  END IF;
END $$;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE llm_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('openai_compatible', 'anthropic')),
  preset text NOT NULL DEFAULT 'custom',
  base_url text,
  api_key_enc text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime text,
  size bigint NOT NULL,
  sha256 text NOT NULL,
  storage_path text NOT NULL,
  doc_type text,
  doc_type_source text,
  status text NOT NULL DEFAULT 'queued',
  progress int NOT NULL DEFAULT 0,
  stage_detail text,
  error text,
  pages int,
  chunk_count int,
  embedding_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, sha256)
);

CREATE TABLE chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  ordinal int NOT NULL,
  page int,
  section text,
  text text NOT NULL,
  -- no fixed dimension: the embedding model is configurable; rows are filtered by embedding_model
  embedding vector,
  embedding_model text
);
CREATE INDEX chunks_document_idx ON chunks (document_id, ordinal);

CREATE TABLE evidence_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  cco_id text NOT NULL,
  confidence real NOT NULL,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected')),
  rationale text,
  page int,
  section text,
  quote text,
  quote_verified boolean NOT NULL DEFAULT false,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  summary text,
  agent text,
  model text,
  confidence real,
  payload jsonb NOT NULL DEFAULT '{}',
  sources jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by text,
  decided_at timestamptz,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  stage text,
  progress int NOT NULL DEFAULT 0,
  agent text,
  model text,
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX jobs_queue_idx ON jobs (status, created_at);

-- Tamper-evident audit trail: append-only, each row hashes the previous one.
-- ts, payload and sources are stored as text so the hashed bytes are exactly reproducible.
CREATE TABLE audit_log (
  seq bigint PRIMARY KEY,
  ts text NOT NULL,
  workspace_id uuid,
  actor text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  summary text,
  payload text NOT NULL DEFAULT '{}',
  model text,
  sources text NOT NULL DEFAULT '[]',
  prev_hash text NOT NULL,
  hash text NOT NULL
);

CREATE FUNCTION audit_log_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END $$;
CREATE TRIGGER audit_log_no_change BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_immutable();

GRANT USAGE ON SCHEMA public TO aigov_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON users, workspaces, app_settings, llm_providers,
  documents, chunks, evidence_tags, approvals, jobs TO aigov_app;
GRANT SELECT, INSERT ON audit_log TO aigov_app;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY ws_isolation ON documents USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON chunks USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON evidence_tags USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON approvals USING (workspace_id::text = current_setting('app.workspace_id', true));
