import type {
  AssessmentStatus,
  ComplianceStatus,
  DecisionStep,
  FindingStatus,
  FrameworkId,
  ImplementationStatus,
  Lifecycle,
  NcGrade,
  NcStatus,
  OrgRole,
  ReviewStatus,
  RiskClass,
  RunStatus,
  SectionFill,
  StatusCounts,
  StepStatus,
} from './api';
import type { Tone } from '../components/ui/Badge';

/** Labels, colour semantics and small parsers shared by the Milestone 2 pages. */

export const RISK_CLASSES: RiskClass[] = [
  'prohibited',
  'high-risk-annex-i',
  'high-risk-annex-iii',
  'limited-transparency',
  'minimal',
  'out-of-scope',
];

export const RISK_CLASS_LABELS: Record<RiskClass, string> = {
  prohibited: 'Prohibited',
  'high-risk-annex-i': 'High-risk (Annex I)',
  'high-risk-annex-iii': 'High-risk (Annex III)',
  'limited-transparency': 'Limited risk (transparency)',
  minimal: 'Minimal risk',
  'out-of-scope': 'Out of scope',
};

export const RISK_CLASS_TONES: Record<RiskClass, Tone> = {
  prohibited: 'red',
  'high-risk-annex-i': 'red',
  'high-risk-annex-iii': 'red',
  'limited-transparency': 'amber',
  minimal: 'green',
  'out-of-scope': 'grey',
};

export function riskClassLabel(value: string | null | undefined): string {
  if (!value) return 'Not classified';
  return RISK_CLASS_LABELS[value as RiskClass] ?? value;
}

export function isRiskClass(value: unknown): value is RiskClass {
  return typeof value === 'string' && (RISK_CLASSES as string[]).includes(value);
}

export const ORG_ROLES: OrgRole[] = ['provider', 'deployer', 'importer', 'distributor', 'unknown'];
export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  provider: 'Provider',
  deployer: 'Deployer',
  importer: 'Importer',
  distributor: 'Distributor',
  unknown: 'Unknown',
};

export const LIFECYCLES: Lifecycle[] = ['idea', 'development', 'production', 'retired'];
export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  idea: 'Idea',
  development: 'Development',
  production: 'Production',
  retired: 'Retired',
};
export const LIFECYCLE_TONES: Record<Lifecycle, Tone> = {
  idea: 'grey',
  development: 'indigo',
  production: 'green',
  retired: 'grey',
};

/** Autonomy levels, with the wording of the API contract. */
export const AUTONOMY_LEVELS: Array<{ level: number; label: string }> = [
  { level: 1, label: 'Suggests only' },
  { level: 2, label: 'Acts with approval of each step' },
  { level: 3, label: 'Acts within limits and reports' },
  { level: 4, label: 'Acts autonomously with monitoring' },
  { level: 5, label: 'Fully autonomous' },
];

export function autonomyLabel(level: number | null | undefined): string {
  const found = AUTONOMY_LEVELS.find((a) => a.level === level);
  return found ? `${found.level} — ${found.label}` : 'Not set';
}

// ---------- Frameworks ----------

export interface FrameworkMeta {
  label: string;
  tone: Tone;
  /** Left-border colour for cards. */
  border: string;
}

const FRAMEWORKS: Record<string, FrameworkMeta> = {
  'eu-ai-act': { label: 'EU AI Act', tone: 'blue', border: 'border-l-blue-500' },
  gdpr: { label: 'GDPR', tone: 'violet', border: 'border-l-violet-500' },
  'iso-42001': { label: 'ISO/IEC 42001', tone: 'teal', border: 'border-l-teal-500' },
  'nist-ai-rmf': { label: 'NIST AI RMF', tone: 'orange', border: 'border-l-orange-500' },
};

export const FRAMEWORK_ORDER = ['eu-ai-act', 'gdpr', 'iso-42001', 'nist-ai-rmf'];

/** Framework chip colours: EU AI Act blue, GDPR violet, ISO 42001 teal, NIST orange. Unknown ids stay grey. */
export function frameworkMeta(id: string | null | undefined, name?: string | null): FrameworkMeta {
  const known = id ? FRAMEWORKS[id] : undefined;
  if (known) return name ? { ...known, label: name } : known;
  const key = `${id ?? ''} ${name ?? ''}`.toLowerCase();
  const label = name ?? id ?? 'Unknown framework';
  if (key.includes('gdpr')) return { ...FRAMEWORKS.gdpr, label };
  if (key.includes('42001') || key.includes('iso')) return { ...FRAMEWORKS['iso-42001'], label };
  if (key.includes('nist')) return { ...FRAMEWORKS['nist-ai-rmf'], label };
  if (key.includes('ai act') || key.includes('ai-act') || key.includes('ai_act') || key.includes('aia')) {
    return { ...FRAMEWORKS['eu-ai-act'], label };
  }
  return { label, tone: 'grey', border: 'border-l-slate-400' };
}

// ---------- Statuses ----------

export const FINDING_STATUSES: FindingStatus[] = ['gap', 'partial', 'compliant', 'insufficient_evidence', 'not_applicable'];

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  gap: 'Gap',
  not_applicable: 'Not applicable',
  insufficient_evidence: 'Insufficient evidence',
};

export const FINDING_STATUS_TONES: Record<FindingStatus, Tone> = {
  compliant: 'green',
  partial: 'amber',
  gap: 'red',
  not_applicable: 'grey',
  insufficient_evidence: 'grey',
};

export function findingStatusLabel(status: string): string {
  return FINDING_STATUS_LABELS[status as FindingStatus] ?? status.replace(/_/g, ' ');
}

export const REVIEW_LABELS: Record<ReviewStatus, string> = { proposed: 'Proposed', approved: 'Approved', rejected: 'Rejected' };
export const REVIEW_TONES: Record<ReviewStatus, Tone> = { proposed: 'amber', approved: 'green', rejected: 'red' };

export const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  'compliant',
  'partial',
  'gap',
  'evidence_present',
  'not_applicable',
  'not_assessed',
];

export const COMPLIANCE_LABELS: Record<ComplianceStatus, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  gap: 'Gap',
  evidence_present: 'Evidence present',
  not_applicable: 'Not applicable',
  not_assessed: 'Not assessed',
};

/** Fill colours for the coverage bars and status dots (plain divs, no chart library). */
export const COMPLIANCE_FILL: Record<ComplianceStatus, string> = {
  compliant: 'bg-emerald-500',
  partial: 'bg-amber-500',
  gap: 'bg-red-500',
  evidence_present: 'bg-indigo-400',
  not_applicable: 'bg-slate-400 dark:bg-slate-500',
  not_assessed: 'bg-slate-200 dark:bg-slate-700',
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  waiting_approval: 'Waiting for approval',
  completed: 'Completed',
  failed: 'Failed',
};

export const RUN_STATUS_TONES: Record<RunStatus, Tone> = {
  queued: 'grey',
  running: 'amber',
  waiting_approval: 'amber',
  completed: 'green',
  failed: 'red',
};

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  waiting: 'Waiting for a human decision',
  skipped: 'Skipped',
};

/** Specialist steps the orchestrator runs side by side. */
export const PARALLEL_STEP_KEYS = ['eu_ai_act_obligations', 'gdpr', 'iso_42001', 'nist'];

/** Score = likelihood × severity (1–25) when the server does not send one. */
export function riskScore(r: { score: number | null; likelihood: number; severity: number }): number {
  return r.score ?? r.likelihood * r.severity;
}

export function riskScoreTone(score: number): Tone {
  if (score >= 15) return 'red';
  if (score >= 8) return 'amber';
  return 'green';
}

// ---------- Safe readers for untyped approval payloads ----------

export function asString(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null;
}

export function asNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

export function asDecisionPath(v: unknown): DecisionStep[] {
  if (!Array.isArray(v)) return [];
  const out: DecisionStep[] = [];
  v.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    out.push({
      step: asNumber(o.step) ?? i + 1,
      question: asString(o.question) ?? '',
      answer: typeof o.answer === 'boolean' ? (o.answer ? 'Yes' : 'No') : (asString(o.answer) ?? ''),
      basis: asStringList(o.basis),
    });
  });
  return out;
}

export function asCountMap(v: unknown): Record<string, number> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  }
  return out;
}

// ---------- Milestone 3 ----------

/** Badge tones of the requirement statuses: green compliant, amber partial, red gap, indigo evidence present, grey otherwise. */
export const COMPLIANCE_TONES: Record<ComplianceStatus, Tone> = {
  compliant: 'green',
  partial: 'amber',
  gap: 'red',
  evidence_present: 'indigo',
  not_applicable: 'grey',
  not_assessed: 'grey',
};

export function complianceLabel(status: string | null | undefined): string {
  if (!status) return COMPLIANCE_LABELS.not_assessed;
  return COMPLIANCE_LABELS[status as ComplianceStatus] ?? status.replace(/_/g, ' ');
}

export const FRAMEWORK_IDS: FrameworkId[] = ['eu-ai-act', 'gdpr', 'iso-42001', 'nist-ai-rmf'];

export function isFrameworkId(value: unknown): value is FrameworkId {
  return typeof value === 'string' && (FRAMEWORK_IDS as string[]).includes(value);
}

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  draft: 'Draft',
  drafting: 'AI is drafting',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ASSESSMENT_STATUS_TONES: Record<AssessmentStatus, Tone> = {
  draft: 'grey',
  drafting: 'amber',
  in_review: 'amber',
  approved: 'green',
  rejected: 'red',
};

export const SECTION_FILL_LABELS: Record<SectionFill, string> = {
  rag: 'From evidence',
  user: 'Your input',
  computed: 'Computed',
  kb: 'From the knowledge base',
};

export const SECTION_FILL_HINTS: Record<SectionFill, string> = {
  rag: 'The agent drafts this section from the evidence documents and cites them.',
  user: 'Only you can provide this. The agent does not write it.',
  computed: 'Filled from data already in the workspace, such as the inventory entry.',
  kb: 'Filled from the regulatory knowledge base.',
};

export const NC_GRADES: NcGrade[] = ['major', 'minor', 'observation', 'opportunity'];
export const NC_GRADE_LABELS: Record<NcGrade, string> = {
  major: 'Major',
  minor: 'Minor',
  observation: 'Observation',
  opportunity: 'Opportunity for improvement',
};
export const NC_GRADE_TONES: Record<NcGrade, Tone> = { major: 'red', minor: 'amber', observation: 'indigo', opportunity: 'grey' };

export const NC_STATUSES: NcStatus[] = ['open', 'in_progress', 'implemented', 'verified', 'closed'];
export const NC_STATUS_LABELS: Record<NcStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  implemented: 'Implemented',
  verified: 'Verified',
  closed: 'Closed',
};
export const NC_STATUS_TONES: Record<NcStatus, Tone> = {
  open: 'red',
  in_progress: 'amber',
  implemented: 'indigo',
  verified: 'green',
  closed: 'grey',
};

export const IMPLEMENTATION_STATUSES: ImplementationStatus[] = ['not_started', 'in_progress', 'implemented'];
export const IMPLEMENTATION_LABELS: Record<ImplementationStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  implemented: 'Implemented',
};

/** Reads a count from a status-count object, tolerating missing keys. */
export function statusCount(counts: StatusCounts | null | undefined, status: ComplianceStatus): number {
  const n = counts?.[status];
  return typeof n === 'number' && n > 0 ? n : 0;
}
