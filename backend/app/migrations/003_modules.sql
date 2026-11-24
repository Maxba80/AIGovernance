-- Milestone 3: ISO Statement of Applicability, nonconformities/CAPA, assisted assessments.

CREATE TABLE soa_entries (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  control_ref text NOT NULL,
  applicable boolean NOT NULL DEFAULT true,
  justification text,
  implementation_status text NOT NULL DEFAULT 'not_started' CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented')),
  owner text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  PRIMARY KEY (workspace_id, control_ref)
);

CREATE TABLE nonconformities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requirement_ref text NOT NULL,
  system_id uuid REFERENCES ai_systems(id) ON DELETE SET NULL,
  finding_id uuid REFERENCES findings(id) ON DELETE SET NULL,
  grade text NOT NULL CHECK (grade IN ('major', 'minor', 'observation', 'opportunity')),
  title text NOT NULL,
  description text,
  root_cause text,
  correction text,
  corrective_action text,
  owner text,
  due_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'implemented', 'verified', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  verified_by text
);

CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES ai_systems(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'drafting', 'in_review', 'approved', 'rejected')),
  version int NOT NULL DEFAULT 1,
  sections jsonb NOT NULL DEFAULT '[]',
  agent text,
  model text,
  draft_error text,
  content_hash text,
  approved_by text,
  approved_at timestamptz,
  pending_approval_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ADD COLUMN assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE;

GRANT SELECT, INSERT, UPDATE, DELETE ON soa_entries, nonconformities, assessments TO aigov_app;
ALTER TABLE soa_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ws_isolation ON soa_entries USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON nonconformities USING (workspace_id::text = current_setting('app.workspace_id', true));
CREATE POLICY ws_isolation ON assessments USING (workspace_id::text = current_setting('app.workspace_id', true));
