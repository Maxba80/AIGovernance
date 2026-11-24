/**
 * Typed client for the Milestone 1 and Milestone 2 API contracts (docs/api-m1.md, docs/api-m2.md).
 */

// ---------- Types ----------

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Health {
  status: string;
  database: boolean;
  version: string;
}

export interface KbFramework {
  id: string;
  name: string;
  requirements: number;
}

export interface KbSource {
  id: string;
  title: string;
  version: string | null;
  status: string | null;
  verification: string | null;
}

export interface KbSummary {
  frameworks: KbFramework[];
  common_control_objectives: number;
  templates: number;
  risks: number;
  sources: KbSource[];
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  document_count: number;
}

export type DocStatus = 'queued' | 'parsing' | 'chunking' | 'embedding' | 'tagging' | 'ready' | 'failed';

export type DocType = 'policy' | 'use_case' | 'governance' | 'audit_report' | 'technical_log' | 'contract' | 'other';

export type TagStatus = 'proposed' | 'approved' | 'rejected';

export interface Citation {
  page: number | null;
  section: string | null;
  quote: string | null;
}

export interface DocumentTag {
  id: string;
  cco_id: string;
  cco_name: string;
  confidence: number | null;
  status: TagStatus;
  rationale: string | null;
  citation: Citation | null;
  model: string | null;
}

export interface DocumentItem {
  id: string;
  filename: string;
  mime: string | null;
  size: number;
  sha256: string;
  doc_type: DocType | null;
  doc_type_source: 'ai' | 'user' | null;
  status: DocStatus;
  progress: number;
  stage_detail: string | null;
  error: string | null;
  pages: number | null;
  chunk_count: number | null;
  embedding_model: string | null;
  tags: DocumentTag[];
  created_at: string;
}

export interface Chunk {
  id: string;
  ordinal: number;
  page: number | null;
  section: string | null;
  text: string;
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number | null;
  section: string | null;
  text: string;
  score: number;
}

export interface SearchResponse {
  embedding_model: string | null;
  results: SearchResult[];
}

export interface SourceRef {
  document_id?: string | null;
  filename?: string | null;
  page?: number | null;
  section?: string | null;
  quote?: string | null;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  kind: string;
  title: string;
  summary: string | null;
  agent: string | null;
  model: string | null;
  confidence: number | null;
  payload: Record<string, unknown> | null;
  sources: SourceRef[] | null;
  status: ApprovalStatus;
  decided_by: string | null;
  decided_at: string | null;
  comment: string | null;
  created_at: string;
}

export type ProviderKind = 'openai_compatible' | 'anthropic';

export type ProviderPreset =
  | 'ollama'
  | 'lmstudio'
  | 'vllm'
  | 'openai'
  | 'azure_openai'
  | 'gemini'
  | 'anthropic'
  | 'custom';

export interface Provider {
  id: string;
  name: string;
  kind: ProviderKind;
  base_url: string | null;
  has_api_key: boolean;
  enabled: boolean;
  preset: ProviderPreset;
}

export interface ModelRef {
  provider_id: string;
  model: string;
}

export interface Routing {
  reasoning: ModelRef | null;
  embedding: ModelRef | null;
  agents: Record<string, ModelRef | null>;
}

export interface RoutingUpdateResponse extends Routing {
  reindex_required?: boolean;
  documents_affected?: number;
}

export interface RoutingUpdate {
  reasoning?: ModelRef | null;
  embedding?: ModelRef | null;
  agents?: Record<string, ModelRef | null>;
}

export interface AgentRole {
  id: string;
  label: string;
  description: string;
}

export interface PresetInfo {
  preset: ProviderPreset;
  kind: ProviderKind;
  name: string;
  base_url: string | null;
  needs_api_key: boolean;
  suggested_models: { reasoning: string[]; embedding: string[] };
}

export interface LlmSettings {
  providers: Provider[];
  routing: Routing;
  agent_roles: AgentRole[];
  presets: PresetInfo[];
}

export interface ProviderInput {
  name: string;
  kind: ProviderKind;
  preset: ProviderPreset;
  base_url?: string | null;
  /** Omit to keep the stored key; empty string clears it. */
  api_key?: string;
  enabled?: boolean;
}

export type TestKind = 'chat' | 'embedding';

export interface TestResult {
  ok: boolean;
  latency_ms: number | null;
  detail: string | null;
  dimensions?: number | null;
}

export type ActorType = 'user' | 'agent' | 'system';

export interface AuditEntry {
  seq: number;
  ts: string;
  workspace_id: string | null;
  actor: string;
  actor_type: ActorType;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  payload: Record<string, unknown> | null;
  model: string | null;
  sources: SourceRef[] | null;
  prev_hash: string | null;
  hash: string;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
}

export interface AuditVerify {
  ok: boolean;
  checked: number;
  first_broken_seq: number | null;
  head_hash: string | null;
}

export interface Job {
  id: string;
  kind: string;
  document_id: string | null;
  filename: string | null;
  status: string;
  stage: string | null;
  progress: number | null;
  agent: string | null;
  model: string | null;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
}

// ---------- Milestone 2: inventory, assessment runs, findings, risks, compliance ----------

export type SystemKind = 'system' | 'agent';
export type OrgRole = 'provider' | 'deployer' | 'importer' | 'distributor' | 'unknown';
export type Lifecycle = 'idea' | 'development' | 'production' | 'retired';
export type RiskClass =
  | 'prohibited'
  | 'high-risk-annex-i'
  | 'high-risk-annex-iii'
  | 'limited-transparency'
  | 'minimal'
  | 'out-of-scope';
export type RiskClassStatus = 'none' | 'proposed' | 'approved';

export interface AgentTool {
  name: string;
  description: string | null;
  write_access: boolean;
}

export interface AgentCard {
  tools: AgentTool[];
  data_sources: string[];
  guardrails: string[];
  /** 1 = suggests only … 5 = fully autonomous. */
  autonomy_level: number | null;
  human_oversight: string | null;
  memory: string | null;
  kill_switch: string | null;
  /** Ids from GET /api/kb/agentic-risks. */
  agentic_risks: string[];
}

export type RunStatus = 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'waiting' | 'skipped';

export interface RunRef {
  id: string;
  status: RunStatus;
  created_at: string;
}

export interface AiSystem {
  id: string;
  kind: SystemKind;
  name: string;
  description: string | null;
  intended_purpose: string | null;
  business_owner: string | null;
  org_role: OrgRole | null;
  lifecycle: Lifecycle | null;
  uses_personal_data: boolean | null;
  vendor: string | null;
  base_model: string | null;
  deployment: string | null;
  agent_card: AgentCard | null;
  risk_class: RiskClass | null;
  risk_class_status: RiskClassStatus;
  risk_class_rationale: string | null;
  document_ids: string[];
  last_run: RunRef | null;
  open_findings: { gap: number; partial: number } | null;
  created_at: string;
  updated_at: string;
}

/** Body of POST / PUT systems: every field except id, risk_*, last_run, open_findings and timestamps. */
export interface SystemInput {
  kind: SystemKind;
  name: string;
  description: string | null;
  intended_purpose: string | null;
  business_owner: string | null;
  org_role: OrgRole;
  lifecycle: Lifecycle;
  uses_personal_data: boolean;
  vendor: string | null;
  base_model: string | null;
  deployment: string | null;
  agent_card: AgentCard | null;
  document_ids: string[];
}

export interface RunStep {
  key: string;
  agent: string | null;
  label: string;
  status: StepStatus;
  model: string | null;
  started_at: string | null;
  finished_at: string | null;
  summary: string | null;
  error: string | null;
}

export interface DecisionStep {
  step: number;
  question: string;
  answer: string;
  basis: string[];
}

export interface ClassificationResult {
  in_scope: boolean;
  org_role: OrgRole | null;
  risk_class: RiskClass | null;
  annex_iii_point: string | null;
  prohibited_practice: string | null;
  art6_3_derogation: { applies: boolean; reason: string | null } | null;
  transparency_obligations: string[];
  gpai: boolean;
  confidence: number | null;
  rationale: string | null;
  decision_path: DecisionStep[];
  missing_information: string[];
  approved_class: RiskClass | null;
  approved_by: string | null;
  approved_comment: string | null;
}

export interface GdprResult {
  personal_data: boolean;
  legal_basis: string | null;
  dpia_required: boolean;
  dpia_rationale: string | null;
  automated_decision_art22: boolean;
  transfers_outside_eu: boolean;
  summary: string | null;
}

export type NistFunction = 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE';

export interface NistResult {
  maturity: Partial<Record<NistFunction, number>>;
  summary: string | null;
}

/** Any part may be absent while the run is in progress. */
export interface RunResult {
  classification?: ClassificationResult | null;
  gdpr?: GdprResult | null;
  nist?: NistResult | null;
}

export interface AssessmentRun {
  id: string;
  system_id: string;
  system_name: string;
  status: RunStatus;
  pending_approval_id: string | null;
  error: string | null;
  summary: string | null;
  steps: RunStep[];
  result: RunResult | null;
  created_at: string;
  finished_at: string | null;
}

export type FrameworkId = 'eu-ai-act' | 'gdpr' | 'iso-42001' | 'nist-ai-rmf';
export type FindingStatus = 'compliant' | 'partial' | 'gap' | 'not_applicable' | 'insufficient_evidence';
export type ReviewStatus = 'proposed' | 'approved' | 'rejected';
export type ReviewDecision = 'approve' | 'reject';

export interface FindingEvidence {
  document_id: string | null;
  filename: string | null;
  page: number | null;
  section: string | null;
  quote: string | null;
  quote_verified: boolean;
}

export interface Finding {
  id: string;
  run_id: string;
  system_id: string;
  framework: FrameworkId;
  requirement_ref: string;
  requirement_title: string | null;
  status: FindingStatus;
  rationale: string | null;
  evidence: FindingEvidence[];
  origin: 'agent' | 'crosswalk';
  via: string | null;
  review_status: ReviewStatus;
  agent: string | null;
  model: string | null;
  created_at: string;
}

export interface FindingReview {
  decision: ReviewDecision;
  /** Override status, when approving the finding with a different status than proposed. */
  status?: FindingStatus;
  comment?: string;
}

export interface Risk {
  id: string;
  system_id: string;
  run_id: string;
  risk_id: string;
  name: string;
  domain: string | null;
  likelihood: number;
  severity: number;
  score: number | null;
  rationale: string | null;
  mitigating_objectives: string[];
  review_status: ReviewStatus;
  model: string | null;
  created_at: string;
}

export interface RiskReview {
  decision: ReviewDecision;
  likelihood?: number;
  severity?: number;
  comment?: string;
}

export interface ApprovalDecisionOptions {
  comment?: string;
  /** `risk_classification` only: approve a different class than the one proposed. */
  override_class?: RiskClass;
}

export type ComplianceStatus = 'compliant' | 'partial' | 'gap' | 'not_applicable' | 'evidence_present' | 'not_assessed';

export interface ComplianceFramework {
  id: string;
  name: string;
  total: number;
  compliant: number;
  partial: number;
  gap: number;
  evidence_present: number;
  not_applicable: number;
  not_assessed: number;
}

export interface ComplianceRequirement {
  ref: string;
  framework: string;
  title: string | null;
  strength: 'primary' | 'supporting';
  status: ComplianceStatus;
}

export interface ComplianceObjective {
  id: string;
  name_en: string;
  approved_evidence: number;
  documents: Array<{ id: string; filename: string }>;
  requirements: ComplianceRequirement[];
}

export interface Compliance {
  frameworks: ComplianceFramework[];
  objectives: ComplianceObjective[];
}

export interface KbRequirement {
  ref: string;
  framework: string;
  title: string;
}

export interface AgenticRisk {
  id: string;
  name: string;
  description: string | null;
}

// ---------- Token storage & errors ----------

const TOKEN_KEY = 'aigrc.token';
export const UNAUTHORIZED_EVENT = 'aigrc:unauthorized';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown> | null;

  constructor(status: number, message: string, body: Record<string, unknown> | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function isStatus(err: unknown, status: number): boolean {
  return err instanceof ApiError && err.status === status;
}

function handleUnauthorized(): void {
  setToken(null);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

function detailFrom(body: Record<string, unknown> | null, status: number, statusText: string): string {
  const d = body?.detail;
  if (typeof d === 'string' && d) return d;
  if (Array.isArray(d)) {
    // FastAPI validation errors: [{loc, msg, type}]
    const msgs = d
      .map((x) => (x && typeof x === 'object' && 'msg' in x ? String((x as { msg: unknown }).msg) : ''))
      .filter(Boolean);
    if (msgs.length) return msgs.join('; ');
  }
  if (status === 0) return 'Cannot reach the server';
  return `Request failed (${status}${statusText ? ' ' + statusText : ''})`;
}

function parseBody(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try {
    const v: unknown = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Do not treat 401 as an expired session (used by login). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return `/api${path}`;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `/api${path}?${qs}` : `/api${path}`;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token && !opts.anonymous) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Cannot reach the server', null);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!res.ok) {
    const body = parseBody(text);
    if (res.status === 401 && !opts.anonymous) handleUnauthorized();
    throw new ApiError(res.status, detailFrom(body, res.status, res.statusText), body);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, 'The server returned an invalid response', null);
  }
}

// ---------- Upload (XMLHttpRequest for progress) ----------

export const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'md', 'json'] as const;
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',');

export function isAcceptedFile(name: string): boolean {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext);
}

export interface UploadHandle {
  promise: Promise<DocumentItem[]>;
  abort: () => void;
}

/** Uploads one or more files in a single multipart request (field `files`). */
export function uploadDocuments(
  workspaceId: string,
  files: File[],
  onProgress?: (percent: number) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<DocumentItem[]>((resolve, reject) => {
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);

    xhr.open('POST', `/api/workspaces/${encodeURIComponent(workspaceId)}/documents`);
    xhr.setRequestHeader('Accept', 'application/json');
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed: unknown = JSON.parse(xhr.responseText);
          resolve(Array.isArray(parsed) ? (parsed as DocumentItem[]) : [parsed as DocumentItem]);
        } catch {
          reject(new ApiError(xhr.status, 'The server returned an invalid response', null));
        }
        return;
      }
      const body = parseBody(xhr.responseText);
      if (xhr.status === 401) handleUnauthorized();
      reject(new ApiError(xhr.status, detailFrom(body, xhr.status, xhr.statusText), body));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Cannot reach the server', null));
    xhr.onabort = () => reject(new ApiError(0, 'Upload cancelled', null));
    xhr.send(form);
  });
  return { promise, abort: () => xhr.abort() };
}

// ---------- Endpoints ----------

const ws = (wid: string) => `/workspaces/${encodeURIComponent(wid)}`;
const enc = encodeURIComponent;

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, anonymous: true }),
  me: () => request<User>('/auth/me'),

  // Health and knowledge base
  health: () => request<Health>('/health', { anonymous: true }),
  kbSummary: () => request<KbSummary>('/kb/summary'),

  // Workspaces
  listWorkspaces: () => request<Workspace[]>('/workspaces'),
  createWorkspace: (body: { name: string; description?: string }) =>
    request<Workspace>('/workspaces', { method: 'POST', body }),
  deleteWorkspace: (wid: string) => request<void>(ws(wid), { method: 'DELETE' }),

  // Documents
  listDocuments: (wid: string) => request<DocumentItem[]>(`${ws(wid)}/documents`),
  getDocument: (wid: string, id: string) => request<DocumentItem>(`${ws(wid)}/documents/${enc(id)}`),
  deleteDocument: (wid: string, id: string) =>
    request<void>(`${ws(wid)}/documents/${enc(id)}`, { method: 'DELETE' }),
  reprocessDocument: (wid: string, id: string) =>
    request<DocumentItem>(`${ws(wid)}/documents/${enc(id)}/reprocess`, { method: 'POST' }),
  updateDocument: (wid: string, id: string, body: { doc_type: DocType | null }) =>
    request<DocumentItem>(`${ws(wid)}/documents/${enc(id)}`, { method: 'PATCH', body }),
  listChunks: (wid: string, id: string, page?: number) =>
    request<Chunk[]>(`${ws(wid)}/documents/${enc(id)}/chunks`, { query: { page } }),

  // Search
  search: (wid: string, query: string, top_k = 8) =>
    request<SearchResponse>(`${ws(wid)}/search`, { method: 'POST', body: { query, top_k } }),

  // Approvals
  listApprovals: (wid: string, status: ApprovalStatus = 'pending') =>
    request<Approval[]>(`${ws(wid)}/approvals`, { query: { status } }),
  decideApproval: (wid: string, id: string, decision: 'approve' | 'reject', opts: ApprovalDecisionOptions = {}) =>
    request<Approval>(`${ws(wid)}/approvals/${enc(id)}/decide`, {
      method: 'POST',
      body: {
        decision,
        ...(opts.comment ? { comment: opts.comment } : {}),
        ...(opts.override_class ? { override_class: opts.override_class } : {}),
      },
    }),

  // LLM settings
  llmSettings: () => request<LlmSettings>('/settings/llm'),
  createProvider: (body: ProviderInput) =>
    request<Provider>('/settings/llm/providers', { method: 'POST', body }),
  updateProvider: (id: string, body: ProviderInput) =>
    request<Provider>(`/settings/llm/providers/${enc(id)}`, { method: 'PUT', body }),
  deleteProvider: (id: string) => request<void>(`/settings/llm/providers/${enc(id)}`, { method: 'DELETE' }),
  providerModels: (id: string) => request<{ models: string[] }>(`/settings/llm/providers/${enc(id)}/models`),
  updateRouting: (body: RoutingUpdate) =>
    request<RoutingUpdateResponse>('/settings/llm/routing', { method: 'PUT', body }),
  testModel: (body: { provider_id: string; model: string; kind: TestKind }) =>
    request<TestResult>('/settings/llm/test', { method: 'POST', body }),
  reindex: (wid: string) => request<{ queued: number }>(`${ws(wid)}/reindex`, { method: 'POST' }),

  // Audit
  audit: (params: { workspace_id?: string; limit?: number; before_seq?: number }) =>
    request<AuditPage>('/audit', { query: params }),
  auditVerify: () => request<AuditVerify>('/audit/verify'),

  // Jobs
  listJobs: (wid: string, active = true) => request<Job[]>(`${ws(wid)}/jobs`, { query: { active } }),

  // Inventory (M2)
  listSystems: (wid: string) => request<AiSystem[]>(`${ws(wid)}/systems`),
  getSystem: (wid: string, id: string) => request<AiSystem>(`${ws(wid)}/systems/${enc(id)}`),
  createSystem: (wid: string, body: SystemInput) => request<AiSystem>(`${ws(wid)}/systems`, { method: 'POST', body }),
  updateSystem: (wid: string, id: string, body: SystemInput) =>
    request<AiSystem>(`${ws(wid)}/systems/${enc(id)}`, { method: 'PUT', body }),
  deleteSystem: (wid: string, id: string) => request<void>(`${ws(wid)}/systems/${enc(id)}`, { method: 'DELETE' }),
  setRiskClass: (wid: string, id: string, body: { risk_class: RiskClass; rationale: string }) =>
    request<AiSystem>(`${ws(wid)}/systems/${enc(id)}/risk-class`, { method: 'PUT', body }),

  // Assessment runs (M2)
  assessSystem: (wid: string, id: string) => request<AssessmentRun>(`${ws(wid)}/systems/${enc(id)}/assess`, { method: 'POST' }),
  listRuns: (wid: string, params: { system_id?: string; active?: boolean } = {}) =>
    request<AssessmentRun[]>(`${ws(wid)}/runs`, { query: params }),
  getRun: (wid: string, id: string) => request<AssessmentRun>(`${ws(wid)}/runs/${enc(id)}`),

  // Findings and risks (M2)
  listFindings: (wid: string, systemId: string, runId?: string) =>
    request<Finding[]>(`${ws(wid)}/systems/${enc(systemId)}/findings`, { query: { run_id: runId } }),
  reviewFinding: (wid: string, id: string, body: FindingReview) =>
    request<Finding>(`${ws(wid)}/findings/${enc(id)}/review`, { method: 'POST', body }),
  listRisks: (wid: string, systemId: string) => request<Risk[]>(`${ws(wid)}/systems/${enc(systemId)}/risks`),
  reviewRisk: (wid: string, id: string, body: RiskReview) =>
    request<Risk>(`${ws(wid)}/risks/${enc(id)}/review`, { method: 'POST', body }),

  // Compliance status (M2)
  compliance: (wid: string) => request<Compliance>(`${ws(wid)}/compliance`),

  // Knowledge base lookups (M2, not workspace-scoped)
  kbRequirements: (framework?: string) => request<KbRequirement[]>('/kb/requirements', { query: { framework } }),
  kbAgenticRisks: () => request<AgenticRisk[]>('/kb/agentic-risks'),
};

// ---------- Query keys ----------

export const qk = {
  me: ['me'] as const,
  health: ['health'] as const,
  kb: ['kb-summary'] as const,
  workspaces: ['workspaces'] as const,
  documents: (wid: string) => ['documents', wid] as const,
  chunks: (wid: string, id: string, page: number | null) => ['chunks', wid, id, page] as const,
  approvals: (wid: string) => ['approvals', wid, 'pending'] as const,
  llm: ['llm-settings'] as const,
  models: (providerId: string) => ['llm-models', providerId] as const,
  audit: (workspaceId: string | null) => ['audit', workspaceId] as const,
  auditVerify: ['audit-verify'] as const,
  jobs: (wid: string) => ['jobs', wid] as const,
  systems: (wid: string) => ['systems', wid] as const,
  system: (wid: string, id: string) => ['systems', wid, id] as const,
  /** Prefix of every runs query of a workspace — use it to invalidate them all. */
  runsAll: (wid: string) => ['runs', wid] as const,
  runs: (wid: string, systemId: string) => ['runs', wid, 'system', systemId] as const,
  activeRuns: (wid: string) => ['runs', wid, 'active'] as const,
  findingsAll: (wid: string) => ['findings', wid] as const,
  findings: (wid: string, systemId: string, runId: string | null) => ['findings', wid, systemId, runId] as const,
  risksAll: (wid: string) => ['risks', wid] as const,
  risks: (wid: string, systemId: string) => ['risks', wid, systemId] as const,
  compliance: (wid: string) => ['compliance', wid] as const,
  agenticRisks: ['kb-agentic-risks'] as const,
};

/** A run that is still moving, or paused on a human decision. */
export function isRunActive(status: RunStatus | null | undefined): boolean {
  return status === 'queued' || status === 'running' || status === 'waiting_approval';
}

export function isProcessing(status: DocStatus): boolean {
  return status !== 'ready' && status !== 'failed';
}
