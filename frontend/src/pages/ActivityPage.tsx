import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Cpu, Download, PlayCircle, RefreshCw, ScrollText, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api, errorMessage, qk, saveBlob, type ActorType, type AuditEntry, type AssessmentRun, type AuditPage, type Job } from '../lib/api';
import { cn, formatDate, formatDateTime, formatNumber, formatTime, humanize } from '../lib/format';
import { useWorkspace } from '../lib/workspace';
import { SourceList } from '../components/AiBadge';
import { RunStatusBadge } from '../components/grc';
import { Badge, type Tone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { CopyValue, HashChip } from '../components/ui/Copy';
import { EmptyState, ErrorState, Notice, ProgressBar, SkeletonRows } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';

const PAGE_SIZE = 100;

// ---------- Running jobs ----------

function jobTone(status: string): Tone {
  const s = status.toLowerCase();
  if (/(fail|error)/.test(s)) return 'red';
  if (/(done|complete|success|ready|finished)/.test(s)) return 'green';
  if (/(queue|pending|wait)/.test(s)) return 'grey';
  return 'amber';
}

function RunningJobs() {
  const { current } = useWorkspace();
  const wid = current?.id ?? '';
  const jobs = useQuery({
    queryKey: qk.jobs(wid),
    queryFn: () => api.listJobs(wid, true),
    enabled: !!wid,
    refetchInterval: (q) => ((q.state.data?.length ?? 0) > 0 ? 2000 : 5000),
  });
  const list: Job[] = jobs.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Running jobs"
        description={current ? `Background work in ${current.name}. Updates automatically.` : 'Background work in the current workspace.'}
        actions={list.length > 0 ? <Badge tone="amber" withDot>{list.length} active</Badge> : undefined}
      />
      {!wid ? (
        <EmptyState compact title="No workspace selected" description="Create or choose a workspace to see its jobs." />
      ) : jobs.isLoading ? (
        <SkeletonRows rows={2} />
      ) : jobs.isError ? (
        <ErrorState compact error={jobs.error} title="Could not load jobs" onRetry={() => void jobs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact icon={<Cpu className="h-4 w-4" />} title="No jobs are running" description="Document processing and re-indexing jobs appear here while they run." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">Job</th>
                <th className="th">Document</th>
                <th className="th">Status</th>
                <th className="th w-[220px]">Progress</th>
                <th className="th">Agent / model</th>
                <th className="th">Started</th>
              </tr>
            </thead>
            <tbody>
              {list.map((j) => (
                <tr key={j.id} className="[&:last-child>td]:border-b-0">
                  <td className="td font-medium text-fg">{humanize(j.kind)}</td>
                  <td className="td max-w-[240px] truncate text-muted" title={j.filename ?? undefined}>
                    {j.filename ?? '—'}
                  </td>
                  <td className="td">
                    <Badge tone={jobTone(j.status)} withDot>
                      {humanize(j.status)}
                    </Badge>
                    {j.error && (
                      <div className="mt-1 max-w-[220px] truncate text-xs text-red-600 dark:text-red-400" title={j.error}>
                        {j.error}
                      </div>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={j.progress} />
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">{Math.round(j.progress ?? 0)}%</span>
                    </div>
                    {j.stage && <div className="mt-1 truncate text-xs text-muted">{humanize(j.stage)}</div>}
                  </td>
                  <td className="td text-xs">
                    <div className="text-fg">{j.agent ?? '—'}</div>
                    {j.model && <div className="font-mono text-[11px] text-muted">{j.model}</div>}
                  </td>
                  <td className="td whitespace-nowrap text-xs text-muted">{formatDateTime(j.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Assessment runs ----------

function ActiveRuns() {
  const { current } = useWorkspace();
  const wid = current?.id ?? '';
  const runs = useQuery({
    queryKey: qk.activeRuns(wid),
    queryFn: () => api.listRuns(wid, { active: true }),
    enabled: !!wid,
    refetchInterval: (q) => ((q.state.data?.length ?? 0) > 0 ? 2000 : 5000),
  });
  const list: AssessmentRun[] = runs.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Assessment runs"
        description="Multi-agent assessments in progress, including runs paused for a human decision. Updates automatically."
        actions={list.length > 0 ? <Badge tone="amber" withDot>{list.length} active</Badge> : undefined}
      />
      {!wid ? (
        <EmptyState compact title="No workspace selected" description="Create or choose a workspace to see its assessment runs." />
      ) : runs.isLoading ? (
        <SkeletonRows rows={2} />
      ) : runs.isError ? (
        <ErrorState compact error={runs.error} title="Could not load assessment runs" onRetry={() => void runs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          compact
          icon={<PlayCircle className="h-4 w-4" />}
          title="No assessment is running"
          description="Start one from an AI system or agent in the Inventory."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">System</th>
                <th className="th">Status</th>
                <th className="th w-[220px]">Progress</th>
                <th className="th">Current step</th>
                <th className="th">Agent / model</th>
                <th className="th">Started</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const steps = r.steps ?? [];
                const finished = steps.filter((s) => s.status === 'done' || s.status === 'skipped').length;
                const percent = steps.length > 0 ? (finished / steps.length) * 100 : 0;
                const now = steps.filter((s) => s.status === 'running' || s.status === 'waiting');
                const first = now[0];
                return (
                  <tr key={r.id} className="[&:last-child>td]:border-b-0">
                    <td className="td max-w-[240px]">
                      <Link
                        to={`/inventory/${encodeURIComponent(r.system_id)}`}
                        className="block truncate font-medium text-fg hover:text-accent-text hover:underline"
                        title={r.system_name}
                      >
                        {r.system_name || 'Open system'}
                      </Link>
                    </td>
                    <td className="td">
                      <RunStatusBadge status={r.status} />
                      {r.status === 'waiting_approval' && (
                        <div className="mt-1 text-xs">
                          <Link to={`/inventory/${encodeURIComponent(r.system_id)}`} className="font-medium text-accent-text hover:underline">
                            Decide the risk class
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={percent} />
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">
                          {finished}/{steps.length}
                        </span>
                      </div>
                    </td>
                    <td className="td max-w-[260px] text-xs text-fg">
                      {now.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="truncate" title={now.map((s) => s.label).join(' · ')}>
                          {now.length > 1 ? `${now.length} agents in parallel` : first.label}
                        </div>
                      )}
                    </td>
                    <td className="td text-xs">
                      <div className="text-fg">{now.length > 1 ? now.map((s) => s.agent).filter(Boolean).join(', ') : (first?.agent ?? '—')}</div>
                      {now.length === 1 && first.model && <div className="font-mono text-[11px] text-muted">{first.model}</div>}
                    </td>
                    <td className="td whitespace-nowrap text-xs text-muted">{formatDateTime(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Audit trail ----------

const actorTone: Record<ActorType, Tone> = { user: 'indigo', agent: 'amber', system: 'grey' };

function VerifyChain() {
  // Runs only when asked: the button is the explicit "verify now" action.
  const verify = useQuery({ queryKey: qk.auditVerify, queryFn: api.auditVerify, enabled: false, staleTime: 0 });
  const v = verify.data;

  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          loading={verify.isFetching}
          onClick={() => void verify.refetch()}
        >
          Verify chain
        </Button>
        {!v && !verify.isError && !verify.isFetching && (
          <span className="text-xs text-muted">Recomputes every hash and checks that each entry links to the one before it.</span>
        )}
        {verify.isError && !verify.isFetching && (
          <Notice tone="error" className="min-w-0 flex-1">
            Verification could not run: {verify.error instanceof Error ? verify.error.message : 'unknown error'}
          </Notice>
        )}
        {v && !verify.isError && (
          <div
            role="status"
            className={cn(
              'flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-1.5 text-xs',
              v.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
            )}
          >
            {v.ok ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
            {v.ok ? (
              <>
                <span className="font-medium">Chain intact.</span>
                <span>
                  {formatNumber(v.checked)} entr{v.checked === 1 ? 'y' : 'ies'} verified.
                </span>
                <span className="flex items-center gap-1">
                  Head hash <HashChip value={v.head_hash} length={20} className="!text-current hover:!bg-black/5" />
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">Chain broken.</span>
                <span>
                  First broken entry: seq <span className="font-mono font-semibold">{v.first_broken_seq ?? 'unknown'}</span>.
                </span>
                <span>{formatNumber(v.checked)} entries checked.</span>
              </>
            )}
            <span className="ml-auto opacity-70">Checked {formatDateTime(new Date(verify.dataUpdatedAt).toISOString())}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs font-medium text-muted">{label}</div>
      {children}
    </div>
  );
}

function AuditRow({ entry, open, onToggle }: { entry: AuditEntry; open: boolean; onToggle: () => void }) {
  const hasPayload = entry.payload != null && Object.keys(entry.payload).length > 0;
  return (
    <Fragment>
      <tr onClick={onToggle} className={cn('cursor-pointer hover:bg-surface2/60', open && 'bg-surface2/60')}>
        <td className="td w-8 pr-0 text-muted">
          <button type="button" aria-label={open ? 'Collapse entry' : 'Expand entry'} aria-expanded={open} className="flex items-center">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </td>
        <td className="td font-mono text-xs tabular-nums text-muted">{entry.seq}</td>
        <td className="td whitespace-nowrap text-xs text-muted">
          <div>{formatDate(entry.ts)}</div>
          <div className="tabular-nums">{formatTime(entry.ts)}</div>
        </td>
        <td className="td">
          <div className="flex items-center gap-1.5">
            <span className="max-w-[140px] truncate text-fg" title={entry.actor}>
              {entry.actor}
            </span>
            <Badge tone={actorTone[entry.actor_type] ?? 'grey'}>{entry.actor_type}</Badge>
          </div>
        </td>
        <td className="td whitespace-nowrap font-mono text-xs text-fg">{entry.action}</td>
        <td className="td text-xs">
          {entry.entity_type ? (
            <>
              <div className="text-fg">{humanize(entry.entity_type)}</div>
              {entry.entity_id && (
                <div className="max-w-[110px] truncate font-mono text-[11px] text-muted" title={entry.entity_id}>
                  {entry.entity_id}
                </div>
              )}
            </>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>
        <td className="td max-w-[280px] text-fg">
          <div className="line-clamp-2 [overflow-wrap:anywhere]">{entry.summary ?? '—'}</div>
        </td>
        <td className="td">
          <HashChip value={entry.hash} />
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={8} className="border-b border-line bg-bg px-4 py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Detail label="Payload">
                {hasPayload ? (
                  <pre className="max-h-72 overflow-auto rounded-md border border-line bg-surface p-3 font-mono text-[11px] leading-relaxed text-fg">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-muted">No payload.</p>
                )}
              </Detail>
              <div className="space-y-3">
                <Detail label="Previous hash (prev_hash)">
                  {entry.prev_hash ? <CopyValue value={entry.prev_hash} /> : <p className="text-xs text-muted">None — first entry of the chain.</p>}
                </Detail>
                <Detail label="Hash">
                  <CopyValue value={entry.hash} />
                </Detail>
                <Detail label="Model">
                  {entry.model ? <span className="font-mono text-xs text-fg">{entry.model}</span> : <p className="text-xs text-muted">No model involved.</p>}
                </Detail>
                <Detail label="Sources">
                  <SourceList sources={entry.sources} emptyText="No sources recorded." />
                </Detail>
              </div>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

type Scope = 'workspace' | 'all';

/** Downloads the whole trail as NDJSON (oldest first; the last line is the chain verification). */
function ExportButton() {
  const toast = useToast();
  const exportTrail = useMutation({
    mutationFn: api.auditExport,
    onSuccess: (blob) => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      saveBlob(blob, `audit-trail-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.ndjson`);
      toast.success('Audit trail exported');
    },
    onError: (err) => toast.error(`Could not export the audit trail: ${errorMessage(err)}`),
  });
  return (
    <Button
      size="sm"
      icon={<Download className="h-3.5 w-3.5" />}
      loading={exportTrail.isPending}
      onClick={() => exportTrail.mutate()}
      title="Download every entry as NDJSON, one per line, oldest first. The last line is the result of the chain verification."
    >
      Export audit trail
    </Button>
  );
}

function AuditTrail() {
  const { current } = useWorkspace();
  const [scope, setScope] = useState<Scope>('workspace');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const scopeId = scope === 'workspace' && current ? current.id : null;

  const audit = useInfiniteQuery({
    queryKey: qk.audit(scopeId),
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => api.audit({ workspace_id: scopeId ?? undefined, limit: PAGE_SIZE, before_seq: pageParam }),
    getNextPageParam: (last: AuditPage, pages: AuditPage[]) => {
      if (last.entries.length === 0) return undefined;
      const loaded = pages.reduce((n, p) => n + p.entries.length, 0);
      const minSeq = Math.min(...pages.flatMap((p) => p.entries.map((e) => e.seq)));
      if (loaded >= last.total || minSeq <= 1) return undefined;
      return minSeq;
    },
  });

  // Newest first, de-duplicated in case pages overlap.
  const bySeq = new Map<number, AuditEntry>();
  for (const p of audit.data?.pages ?? []) for (const e of p.entries) bySeq.set(e.seq, e);
  const entries = [...bySeq.values()].sort((a, b) => b.seq - a.seq);
  const total = audit.data?.pages[audit.data.pages.length - 1]?.total ?? 0;

  const toggle = (seq: number) =>
    setExpanded((old) => {
      const next = new Set(old);
      if (next.has(seq)) next.delete(seq);
      else next.add(seq);
      return next;
    });

  return (
    <Card>
      <CardHeader
        title="Audit trail"
        description="Append-only and hash-chained: every entry includes the hash of the one before it, so any later change is detectable."
        actions={
          <>
            <div role="radiogroup" aria-label="Scope" className="flex h-7 items-center rounded-md border border-line bg-surface2 p-0.5">
              {(
                [
                  { id: 'workspace', label: 'This workspace' },
                  { id: 'all', label: 'All' },
                ] as Array<{ id: Scope; label: string }>
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={scope === s.id}
                  disabled={s.id === 'workspace' && !current}
                  onClick={() => setScope(s.id)}
                  className={cn(
                    'h-full rounded px-2 text-xs font-medium disabled:opacity-50',
                    scope === s.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              icon={<RefreshCw className={cn('h-3.5 w-3.5', audit.isRefetching && 'animate-spin')} />}
              onClick={() => void audit.refetch()}
              disabled={audit.isFetching}
            >
              Refresh
            </Button>
            <ExportButton />
          </>
        }
      />
      <VerifyChain />

      {audit.isLoading ? (
        <SkeletonRows rows={8} />
      ) : audit.isError && entries.length === 0 ? (
        <ErrorState error={audit.error} title="Could not load the audit trail" onRetry={() => void audit.refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-4 w-4" />}
          title="No audit entries yet"
          description={scopeId ? 'Nothing has been recorded for this workspace. Switch to “All” to include actions outside a workspace, such as settings changes.' : 'Actions by users, agents and the system are recorded here.'}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th w-8" />
                  <th className="th">Seq</th>
                  <th className="th">Time</th>
                  <th className="th">Actor</th>
                  <th className="th">Action</th>
                  <th className="th">Entity</th>
                  <th className="th">Summary</th>
                  <th className="th">Hash</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <AuditRow key={e.seq} entry={e} open={expanded.has(e.seq)} onToggle={() => toggle(e.seq)} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs text-muted">
              Showing {formatNumber(entries.length)} of {formatNumber(Math.max(total, entries.length))} entries
            </span>
            {audit.isError && <span className="text-xs text-red-600 dark:text-red-400">Could not load more entries.</span>}
            {audit.hasNextPage ? (
              <Button size="sm" loading={audit.isFetchingNextPage} onClick={() => void audit.fetchNextPage()}>
                Load more
              </Button>
            ) : (
              <span className="text-xs text-muted">Beginning of the trail</span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export function ActivityPage() {
  return (
    <>
      <PageHeader title="Activity" description="What is running now, and the tamper-evident record of everything that has happened." />
      <div className="space-y-5">
        <RunningJobs />
        <ActiveRuns />
        <AuditTrail />
      </div>
    </>
  );
}
