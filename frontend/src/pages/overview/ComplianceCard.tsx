import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, Layers } from 'lucide-react';
import {
  api,
  isRunActive,
  qk,
  type ComplianceFramework,
  type ComplianceObjective,
  type ComplianceStatus,
  type RiskClass,
  type Workspace,
} from '../../lib/api';
import { cn, formatNumber } from '../../lib/format';
import {
  COMPLIANCE_FILL,
  COMPLIANCE_LABELS,
  COMPLIANCE_STATUSES,
  FRAMEWORK_ORDER,
  RISK_CLASSES,
  RISK_CLASS_TONES,
  frameworkMeta,
  riskClassLabel,
} from '../../lib/grc';
import { FrameworkChip } from '../../components/grc';
import { StatusDot } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';

// ---------- AI systems by risk class ----------

export function SystemsCard({ workspace }: { workspace: Workspace }) {
  const systems = useQuery({
    queryKey: qk.systems(workspace.id),
    queryFn: () => api.listSystems(workspace.id),
    refetchInterval: (q) => (q.state.data?.some((s) => isRunActive(s.last_run?.status)) ? 4000 : false),
  });
  const list = systems.data ?? [];
  const agents = list.filter((s) => s.kind === 'agent').length;
  const counts = new Map<RiskClass, number>();
  let unclassified = 0;
  let proposed = 0;
  for (const s of list) {
    if (!s.risk_class) unclassified++;
    else counts.set(s.risk_class, (counts.get(s.risk_class) ?? 0) + 1);
    if (s.risk_class && s.risk_class_status === 'proposed') proposed++;
  }
  const shown = RISK_CLASSES.filter((c) => (counts.get(c) ?? 0) > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="AI systems"
        description="Inventory by EU AI Act risk class"
        actions={
          <Link to="/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
            Inventory <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {systems.isLoading ? (
        <SkeletonRows rows={3} />
      ) : systems.isError ? (
        <ErrorState compact error={systems.error} onRetry={() => void systems.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={<Boxes className="h-4 w-4" />} title="No AI systems yet" description="Register systems and agents on the Inventory page." />
      ) : (
        <div className="p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(list.length)}</span>
            <span className="text-xs text-muted">
              entr{list.length === 1 ? 'y' : 'ies'}
              {agents > 0 ? ` · ${agents} agent${agents === 1 ? '' : 's'}` : ''}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {shown.map((c) => (
              <li key={c} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-fg">
                  <StatusDot tone={RISK_CLASS_TONES[c]} />
                  <span className="truncate">{riskClassLabel(c)}</span>
                </span>
                <span className="tabular-nums text-muted">{counts.get(c)}</span>
              </li>
            ))}
            {unclassified > 0 && (
              <li className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-fg">
                  <StatusDot tone="grey" />
                  Not classified
                </span>
                <span className="tabular-nums text-muted">{unclassified}</span>
              </li>
            )}
          </ul>
          {proposed > 0 && (
            <p className="mt-3 text-xs text-muted">
              {proposed} class{proposed === 1 ? ' is' : 'es are'} proposed by AI and not yet approved.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- Compliance coverage ----------

function count(f: ComplianceFramework, s: ComplianceStatus): number {
  const n = f[s];
  return typeof n === 'number' && n > 0 ? n : 0;
}

function FrameworkBar({ framework: f }: { framework: ComplianceFramework }) {
  const segments = COMPLIANCE_STATUSES.map((s) => ({ status: s, n: count(f, s) })).filter((x) => x.n > 0);
  const sum = segments.reduce((n, x) => n + x.n, 0);
  const total = Math.max(f.total ?? 0, sum);
  const assessed = count(f, 'compliant') + count(f, 'partial') + count(f, 'gap') + count(f, 'not_applicable');
  const summary = COMPLIANCE_STATUSES.map((s) => `${COMPLIANCE_LABELS[s]}: ${count(f, s)}`).join(', ');

  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <FrameworkChip id={f.id} name={f.name} />
        <span className="text-xs tabular-nums text-muted">
          {formatNumber(assessed)} of {formatNumber(total)} requirements assessed
        </span>
      </div>
      <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-surface2" role="img" aria-label={`${f.name} — ${summary}`}>
        {total > 0 &&
          segments.map((x) => (
            <div
              key={x.status}
              className={cn('h-full border-r border-surface last:border-r-0', COMPLIANCE_FILL[x.status])}
              style={{ width: `${(x.n / total) * 100}%` }}
              title={`${COMPLIANCE_LABELS[x.status]}: ${x.n}`}
            />
          ))}
      </div>
      <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
        {COMPLIANCE_STATUSES.filter((s) => s !== 'not_applicable' || count(f, s) > 0).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-sm', COMPLIANCE_FILL[s])} aria-hidden />
            <dt className="text-muted">{COMPLIANCE_LABELS[s]}</dt>
            <dd className={cn('font-medium tabular-nums', count(f, s) > 0 ? 'text-fg' : 'text-muted')}>{count(f, s)}</dd>
          </div>
        ))}
      </dl>
    </li>
  );
}

function ObjectiveRow({ objective: o }: { objective: ComplianceObjective }) {
  // Primary links first, then by framework, so the dots read the same way in every row.
  const reqs = [...(o.requirements ?? [])].sort(
    (a, b) =>
      Number(b.strength === 'primary') - Number(a.strength === 'primary') ||
      FRAMEWORK_ORDER.indexOf(a.framework) - FRAMEWORK_ORDER.indexOf(b.framework) ||
      a.ref.localeCompare(b.ref, undefined, { numeric: true }),
  );
  const docs = (o.documents ?? []).map((d) => d.filename).join(', ');
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
      <span className="w-16 shrink-0 font-mono text-xs font-semibold text-fg">{o.id}</span>
      <span className="min-w-0 flex-1 basis-40 truncate text-sm text-fg" title={o.name_en}>
        {o.name_en}
      </span>
      <span
        className={cn('shrink-0 text-xs tabular-nums', o.approved_evidence > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted')}
        title={docs ? `Approved evidence: ${docs}` : 'No approved evidence is linked to this objective yet'}
      >
        {o.approved_evidence} approved evidence
      </span>
      <span className="flex w-full flex-wrap gap-1 sm:w-[168px] sm:shrink-0 sm:justify-end">
        {reqs.length === 0 ? (
          <span className="text-xs text-muted">No linked requirement</span>
        ) : (
          reqs.map((r) => (
            <span
              key={`${r.framework}:${r.ref}`}
              role="img"
              tabIndex={0}
              aria-label={`${r.ref}: ${COMPLIANCE_LABELS[r.status] ?? r.status}`}
              title={`${r.ref} — ${COMPLIANCE_LABELS[r.status] ?? r.status}${r.title ? `\n${r.title}` : ''}\n${frameworkMeta(r.framework).label} · ${r.strength} link`}
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                COMPLIANCE_FILL[r.status] ?? COMPLIANCE_FILL.not_assessed,
                r.strength !== 'primary' && 'opacity-60',
              )}
            />
          ))
        )}
      </span>
    </li>
  );
}

export function ComplianceCard({ workspace }: { workspace: Workspace }) {
  const compliance = useQuery({ queryKey: qk.compliance(workspace.id), queryFn: () => api.compliance(workspace.id) });
  const frameworks = [...(compliance.data?.frameworks ?? [])].sort((a, b) => {
    const ia = FRAMEWORK_ORDER.indexOf(a.id);
    const ib = FRAMEWORK_ORDER.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const objectives = compliance.data?.objectives ?? [];

  return (
    <Card className="flex min-w-0 flex-col lg:col-span-2">
      <CardHeader
        title="Compliance coverage"
        description="Assess once, comply many: approved findings and evidence roll up to every framework through the common control objectives."
      />
      {compliance.isLoading ? (
        <SkeletonRows rows={5} />
      ) : compliance.isError ? (
        <ErrorState compact error={compliance.error} title="Could not load compliance coverage" onRetry={() => void compliance.refetch()} />
      ) : frameworks.length === 0 && objectives.length === 0 ? (
        <EmptyState
          compact
          icon={<Layers className="h-4 w-4" />}
          title="No coverage data yet"
          description="Coverage appears once the knowledge base links requirements to control objectives."
        />
      ) : (
        <>
          {frameworks.length > 0 && (
            <ul className="space-y-4 p-4">
              {frameworks.map((f) => (
                <FrameworkBar key={f.id} framework={f} />
              ))}
            </ul>
          )}
          <div className="border-t border-line">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pb-1 pt-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Control objectives ({objectives.length})</h3>
              <span className="text-xs text-muted">One dot per linked requirement — hover for the reference and status. Faded dots are supporting links.</span>
            </div>
            {objectives.length === 0 ? (
              <p className="px-4 pb-4 pt-1 text-xs text-muted">No control objectives are defined.</p>
            ) : (
              <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                {objectives.map((o) => (
                  <ObjectiveRow key={o.id} objective={o} />
                ))}
              </ul>
            )}
          </div>
          <p className="border-t border-line px-4 py-2 text-xs text-muted">
            Only requirements linked to a control objective are counted, and only findings and evidence approved by a human.
          </p>
        </>
      )}
    </Card>
  );
}
