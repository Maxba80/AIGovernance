-- Milestone 2: AI system inventory, agent cards, assessment runs, findings, risks.

CREATE TABLE ai_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('system', 'agent')),
  name text NOT NULL,
  description text,
  intended_purpose text,
  business_owner text,
  org_role text NOT NULL DEFAULT 'unknown' CHECK (org_role IN ('provider', 'deployer', 'importer', 'distributor', 'unknown')),
  lifecycle text NOT NULL DEFAULT 'idea' CHECK (lifecycle IN ('idea', 'development', 'production', 'retired')),
  uses_personal_data boolean,
  vendor text,
  base_model text,
  deployment text,
  agent_card jsonb,
  document_ids uuid[] NOT NULL DEFAULT '{}',
  risk_class text,
  risk_class_status text NOT NULL DEFAULT 'none' CHECK (risk_class_status IN ('none', 'proposed', 'approved')),
  risk_class_rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'waiting_approval', 'completed', 'failed')),
  pending_approval_id uuid,
  error text,
  summary text,
  result jsonb NOT NULL DEFAULT '{}',
  started_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE run_steps (
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  position int NOT NULL,
  agent text NOT NULL,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'waiting', 'skipped')),
  model text,
  started_at timestamptz,
  finished_at timestamptz,
  summary text,
  error text,
  PRIMARY KEY (run_id, key)
);

CREATE TABLE findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  framework text NOT NULL,
  requirement_ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('compliant', 'partial', 'gap', 'not_applicable', 'insufficient_evidence')),
  rationale text,
  evidence jsonb NOT NULL DEFAULT '[]',
  origin text NOT NULL DEFAULT 'agent' CHECK (origin IN ('agent', 'crosswalk')),
  via text,
  review_status text NOT NULL DEFAULT 'proposed' CHECK (review_status IN ('proposed', 'approved', 'rejected')),
  reviewed_by text,
  agent text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX findings_system_idx ON findings (system_id, run_id);

CREATE TABLE system_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  risk_id text NOT NULL,
  likelihood int NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  rationale text,
  mitigating_objectives text[] NOT NULL DEFAULT '{}',
  review_status text NOT NULL DEFAULT 'proposed' CHECK (review_status IN ('proposed', 'approved', 'rejected')),
  reviewed_by text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ADD COLUMN run_id uuid REFERENCES runs(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN payload jsonb NOT NULL DEFAULT '{}';

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_systems, runs, run_steps, findings, system_risks TO aigov_app;

ALTER TABLE ai_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ws_isolation ON ai_systems USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON runs USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON run_steps USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON findings USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON system_risks USING (workspace_id::text = current_setting('app.workspace_id', true));
