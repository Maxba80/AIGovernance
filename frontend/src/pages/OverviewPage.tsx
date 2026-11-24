import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpenCheck, ClipboardCheck, FileStack, Link2, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import { api, isProcessing, qk, type DocStatus, type KbFramework, type Workspace } from '../lib/api';
import { cn, DOC_STATUS_LABELS, DOC_STATUSES, formatNumber, humanize } from '../lib/format';
import { Badge, StatusDot, type Tone } from '../components/ui/Badge';
import { Card, CardHeader, PageHeader } from '../components/ui/Card';
import { HashChip } from '../components/ui/Copy';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '../components/ui/Feedback';
import { WorkspaceGate } from '../components/WorkspaceGate';

/** Framework chip colours — used for borders and labels only. */
function frameworkTone(f: KbFramework): { tone: Tone; border: string } {
  const key = `${f.id} ${f.name}`.toLowerCase();
  if (key.includes('gdpr')) return { tone: 'violet', border: 'border-l-violet-500' };
  if (key.includes('42001') || key.includes('iso')) return { tone: 'teal', border: 'border-l-teal-500' };
  if (key.includes('nist')) return { tone: 'orange', border: 'border-l-orange-500' };
  if (key.includes('ai act') || key.includes('ai_act') || key.includes('aia') || key.includes('eu')) {
    return { tone: 'blue', border: 'border-l-blue-500' };
  }
  return { tone: 'grey', border: 'border-l-slate-400' };
}

function levelTone(value: string | null): Tone {
  const v = (value ?? '').toLowerCase();
  if (!v) return 'grey';
  if (/(unverified|not[ _-]?verified|fail|reject|invalid|withdrawn|superseded)/.test(v)) return 'red';
  if (/(pending|partial|draft|proposed|progress|review)/.test(v)) return 'amber';
  if (/(verified|approved|in[ _-]?force|current|final|published|active|ok)/.test(v)) return 'green';
  return 'grey';
}

const statusTone: Record<DocStatus, Tone> = {
  queued: 'grey',
  parsing: 'amber',
  chunking: 'amber',
  embedding: 'amber',
  tagging: 'amber',
  ready: 'green',
  failed: 'red',
};

interface StatProps {
  label: string;
  value: number | undefined;
  icon: ReactNode;
  loading: boolean;
  hint: string;
}

function Stat({ label, value, icon, loading, hint }: StatProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(value)}</div>
      )}
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </Card>
  );
}

function KnowledgeBase() {
  const kb = useQuery({ queryKey: qk.kb, queryFn: api.kbSummary, staleTime: 60_000 });
  const frameworks = kb.data?.frameworks ?? [];
  const sources = kb.data?.sources ?? [];
  const totalReqs = frameworks.reduce((n, f) => n + (f.requirements ?? 0), 0);

  return (
    <>
      <section aria-label="Knowledge base">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-fg">Knowledge base</h2>
          {kb.data && (
            <span className="text-xs text-muted">
              {formatNumber(totalReqs)} requirements across {frameworks.length} framework{frameworks.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {kb.isError ? (
          <Card>
            <ErrorState error={kb.error} title="Could not load the knowledge base summary" onRetry={() => void kb.refetch()} />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {kb.isLoading &&
                Array.from({ length: 4 }, (_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-3 h-8 w-16" />
                  </Card>
                ))}
              {frameworks.map((f) => {
                const t = frameworkTone(f);
                return (
                  <Card key={f.id} className={cn('border-l-[3px] p-4', t.border)}>
                    <Badge tone={t.tone} variant="outline" className="max-w-full">
                      <span className="truncate">{f.name}</span>
                    </Badge>
                    <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(f.requirements)}</div>
                    <div className="mt-1 text-xs text-muted">requirements</div>
                  </Card>
                );
              })}
            </div>
            {kb.data && frameworks.length === 0 && (
              <Card>
                <EmptyState compact title="No frameworks loaded" description="The knowledge base does not contain any framework yet." />
              </Card>
            )}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Stat
                label="Control objectives"
                value={kb.data?.common_control_objectives}
                loading={kb.isLoading}
                icon={<Target className="h-4 w-4" />}
                hint="Common objectives shared across frameworks"
              />
              <Stat
                label="Templates"
                value={kb.data?.templates}
                loading={kb.isLoading}
                icon={<FileStack className="h-4 w-4" />}
                hint="Deliverable templates"
              />
              <Stat
                label="Risks"
                value={kb.data?.risks}
                loading={kb.isLoading}
                icon={<ShieldAlert className="h-4 w-4" />}
                hint="Entries in the risk catalogue"
              />
            </div>
          </>
        )}
      </section>

      <Card>
        <CardHeader
          title="Knowledge base sources"
          description="Where the normative content comes from, and whether each source has been verified against the official text."
        />
        {kb.isLoading ? (
          <SkeletonRows rows={4} />
        ) : kb.isError ? (
          <ErrorState compact error={kb.error} onRetry={() => void kb.refetch()} />
        ) : sources.length === 0 ? (
          <EmptyState
            compact
            icon={<BookOpenCheck className="h-4 w-4" />}
            title="No sources recorded"
            description="The knowledge base has not registered any source document."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Title</th>
                  <th className="th">Version</th>
                  <th className="th">Status</th>
                  <th className="th">Verification</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="[&:last-child>td]:border-b-0">
                    <td className="td">
                      <div className="font-medium text-fg">{s.title}</div>
                      <div className="font-mono text-[11px] text-muted">{s.id}</div>
                    </td>
                    <td className="td whitespace-nowrap text-muted">{s.version || '—'}</td>
                    <td className="td">{s.status ? <Badge tone={levelTone(s.status)}>{humanize(s.status)}</Badge> : <span className="text-muted">—</span>}</td>
                    <td className="td">
                      {s.verification ? (
                        <Badge tone={levelTone(s.verification)} withDot>
                          {humanize(s.verification)}
                        </Badge>
                      ) : (
                        <Badge tone="grey" withDot>
                          Not assessed
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function DocumentsCard({ workspace }: { workspace: Workspace }) {
  const docs = useQuery({
    queryKey: qk.documents(workspace.id),
    queryFn: () => api.listDocuments(workspace.id),
    refetchInterval: (q) => (q.state.data?.some((d) => isProcessing(d.status)) ? 2000 : false),
  });
  const list = docs.data ?? [];
  const counts = new Map<DocStatus, number>();
  for (const d of list) counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
  const shown = DOC_STATUSES.filter((s) => (counts.get(s) ?? 0) > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Documents"
        description={`Evidence in ${workspace.name}, by processing status`}
        actions={
          <Link to="/evidence" className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
            Evidence <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {docs.isLoading ? (
        <SkeletonRows rows={3} />
      ) : docs.isError ? (
        <ErrorState compact error={docs.error} onRetry={() => void docs.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact title="No documents yet" description="Upload policies, reports or logs on the Evidence page." />
      ) : (
        <div className="p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(list.length)}</span>
            <span className="text-xs text-muted">document{list.length === 1 ? '' : 's'}</span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {shown.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-fg">
                  <StatusDot tone={statusTone[s]} />
                  {DOC_STATUS_LABELS[s]}
                </span>
                <span className="tabular-nums text-muted">{counts.get(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ApprovalsCard({ workspace }: { workspace: Workspace }) {
  const approvals = useQuery({
    queryKey: qk.approvals(workspace.id),
    queryFn: () => api.listApprovals(workspace.id, 'pending'),
  });
  const n = approvals.data?.length ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Pending approvals"
        description="AI proposals waiting for a human decision"
        actions={
          <Link to="/evidence?tab=approvals" className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
            Review <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {approvals.isLoading ? (
        <SkeletonRows rows={2} />
      ) : approvals.isError ? (
        <ErrorState compact error={approvals.error} onRetry={() => void approvals.refetch()} />
      ) : (
        <div className="p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-fg">{formatNumber(n)}</span>
            <Badge tone={n > 0 ? 'amber' : 'green'} withDot>
              {n > 0 ? 'Awaiting review' : 'Queue is clear'}
            </Badge>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted">
            <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Nothing an AI agent proposes counts as evidence until a person approves it.
          </p>
        </div>
      )}
    </Card>
  );
}

function AuditChainCard() {
  const verify = useQuery({ queryKey: qk.auditVerify, queryFn: api.auditVerify });
  const v = verify.data;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Audit chain"
        description="Integrity of the tamper-evident audit trail"
        actions={
          <Link to="/activity" className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
            Activity <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {verify.isLoading ? (
        <SkeletonRows rows={2} />
      ) : verify.isError || !v ? (
        <ErrorState compact error={verify.error} title="Could not verify the audit chain" onRetry={() => void verify.refetch()} />
      ) : (
        <div className="p-4">
          <div className="flex items-center gap-2">
            {v.ok ? <ShieldCheck className="h-6 w-6 text-emerald-500" /> : <ShieldAlert className="h-6 w-6 text-red-500" />}
            <Badge tone={v.ok ? 'green' : 'red'} withDot>
              {v.ok ? 'Chain intact' : 'Chain broken'}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-muted">
            {v.ok
              ? `${formatNumber(v.checked)} entr${v.checked === 1 ? 'y' : 'ies'} verified.`
              : `First broken entry: seq ${v.first_broken_seq ?? 'unknown'} (${formatNumber(v.checked)} checked).`}
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted">
            <Link2 className="h-3 w-3" /> Head hash <HashChip value={v.head_hash} length={16} />
          </div>
        </div>
      )}
    </Card>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="The normative knowledge base, the evidence in this workspace and the state of the audit trail." />
      <div className="-mt-1 space-y-6">
        <WorkspaceGate>
          {(workspace) => (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <DocumentsCard workspace={workspace} />
              <ApprovalsCard workspace={workspace} />
              <AuditChainCard />
            </div>
          )}
        </WorkspaceGate>
        <KnowledgeBase />
      </div>
    </div>
  );
}
