import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ChevronDown, ListChecks, Waypoints, X } from 'lucide-react';
import { api, errorMessage, qk, type Finding, type FindingEvidence, type FindingReview, type FindingStatus } from '../../lib/api';
import { cn } from '../../lib/format';
import { FINDING_STATUSES, FINDING_STATUS_LABELS, FRAMEWORK_ORDER, frameworkMeta } from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { AiBadge } from '../../components/AiBadge';
import { FindingStatusBadge, RefChip, ReviewBadge } from '../../components/grc';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';

export function EvidenceList({ evidence, emptyText = 'No evidence was cited for this finding.' }: { evidence: FindingEvidence[]; emptyText?: string }) {
  if (evidence.length === 0) return <p className="text-xs text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-1.5">
      {evidence.map((e, i) => {
        const where = [e.page != null ? `p. ${e.page}` : null, e.section].filter(Boolean).join(' · ');
        return (
          <li key={i} className="rounded-md border border-line bg-bg px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="break-all font-medium text-fg">{e.filename ?? e.document_id ?? 'Source'}</span>
              {where && <span className="text-muted">{where}</span>}
              {e.quote && e.quote_verified === false && (
                <span
                  className="inline-flex items-center gap-1 self-center font-medium text-amber-700 dark:text-amber-300"
                  title="This quote could not be found word for word in the document. Check the source before relying on it."
                >
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Quote not verified
                </span>
              )}
            </div>
            {e.quote && (
              <blockquote
                className={cn(
                  'mt-1.5 border-l-2 pl-2.5 text-xs italic leading-relaxed text-muted',
                  e.quote_verified === false ? 'border-amber-400' : 'border-line-strong',
                )}
              >
                “{e.quote}”
              </blockquote>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface FindingRowProps {
  finding: Finding;
  busy: boolean;
  onReview: (body: FindingReview) => void;
}

function FindingRow({ finding: f, busy, onReview }: FindingRowProps) {
  const crosswalk = f.origin === 'crosswalk';
  const rejected = f.review_status === 'rejected';
  const proposed = f.review_status === 'proposed';
  return (
    <li
      className={cn(
        'rounded-md border p-3',
        crosswalk ? 'border-dashed border-line-strong bg-surface2/50' : 'border-line',
        rejected && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-start gap-x-2 gap-y-1.5">
        <RefChip>{f.requirement_ref}</RefChip>
        <span className={cn('min-w-0 flex-1 basis-48 text-sm font-medium text-fg [overflow-wrap:anywhere]', rejected && 'line-through')}>
          {f.requirement_title ?? 'Untitled requirement'}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <FindingStatusBadge status={f.status} />
          <ReviewBadge status={f.review_status} />
        </div>
      </div>

      {crosswalk && (
        <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Waypoints className="h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">
            Inferred via <span className="font-mono">{f.via ?? 'crosswalk'}</span> — not assessed directly against evidence
          </span>
        </div>
      )}

      {f.rationale && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{f.rationale}</p>}

      <div className="mt-2">
        <div className="mb-1 text-xs font-medium text-muted">Evidence</div>
        <EvidenceList evidence={f.evidence ?? []} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Transparency rule: the AI badge stays until a human has approved the finding. */}
        {f.review_status !== 'approved' ? (
          <AiBadge model={f.model} />
        ) : (
          f.model && (
            <span className="text-xs text-muted">
              Model <span className="font-mono text-fg">{f.model}</span>
            </span>
          )
        )}
        {f.agent && <span className="text-xs text-muted">Agent {f.agent}</span>}
        <div className="ml-auto flex items-center gap-1.5">
          {proposed && (
            <>
              <Button size="sm" icon={<X className="h-3.5 w-3.5" />} disabled={busy} onClick={() => onReview({ decision: 'reject' })}>
                Reject
              </Button>
              <Button size="sm" variant="primary" icon={<Check className="h-3.5 w-3.5" />} loading={busy} onClick={() => onReview({ decision: 'approve' })}>
                Approve
              </Button>
            </>
          )}
          <Menu
            align="right"
            width="w-60"
            trigger={({ toggle, open }) => (
              <Button size="sm" onClick={toggle} disabled={busy} aria-haspopup="menu" aria-expanded={open} aria-label="More review options" title="More review options">
                {!proposed && 'Change'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            )}
          >
            {(close) => (
              <>
                <div className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted">Approve with a different status</div>
                {FINDING_STATUSES.filter((s) => s !== f.status).map((s) => (
                  <MenuItem
                    key={s}
                    onClick={() => {
                      close();
                      onReview({ decision: 'approve', status: s });
                    }}
                  >
                    Approve as {FINDING_STATUS_LABELS[s]}
                  </MenuItem>
                ))}
                <div className="my-1 border-t border-line" />
                {!proposed && f.review_status !== 'approved' && (
                  <MenuItem
                    onClick={() => {
                      close();
                      onReview({ decision: 'approve' });
                    }}
                  >
                    Approve as {FINDING_STATUS_LABELS[f.status] ?? f.status}
                  </MenuItem>
                )}
                {f.review_status !== 'rejected' && (
                  <MenuItem
                    onClick={() => {
                      close();
                      onReview({ decision: 'reject' });
                    }}
                  >
                    Reject
                  </MenuItem>
                )}
              </>
            )}
          </Menu>
        </div>
      </div>
    </li>
  );
}

interface FindingsSectionProps {
  workspaceId: string;
  systemId: string;
  /** Run to show; null asks the server for the latest run's findings. */
  runId: string | null;
  /** The viewed run is still producing findings. */
  active: boolean;
}

export function FindingsSection({ workspaceId, systemId, runId, active }: FindingsSectionProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(workspaceId);
  const [params] = useSearchParams();
  const [framework, setFramework] = useState<string | null>(params.get('framework'));
  const [status, setStatus] = useState<FindingStatus | ''>('');
  const sectionRef = useRef<HTMLElement>(null);
  const key = qk.findings(workspaceId, systemId, runId);

  const findings = useQuery({
    queryKey: key,
    queryFn: () => api.listFindings(workspaceId, systemId, runId ?? undefined),
  });

  // Deep link from the approval queue: /inventory/:id?framework=…#findings
  const scrolled = useRef(false);
  useEffect(() => {
    if (scrolled.current || findings.isLoading || window.location.hash !== '#findings') return;
    scrolled.current = true;
    sectionRef.current?.scrollIntoView({ block: 'start' });
  }, [findings.isLoading]);

  const review = useMutation({
    mutationFn: (v: { id: string; body: FindingReview }) => api.reviewFinding(workspaceId, v.id, v.body),
    onSuccess: (saved, v) => {
      qc.setQueryData<Finding[]>(key, (old) => old?.map((f) => (f.id === saved.id ? saved : f)));
      invalidate();
      toast.success(v.body.decision === 'reject' ? 'Finding rejected' : v.body.status ? `Finding approved as ${FINDING_STATUS_LABELS[v.body.status]}` : 'Finding approved');
    },
    onError: (err) => toast.error(`Could not record the review: ${errorMessage(err)}`),
  });

  const all = findings.data ?? [];
  const extra = [...new Set(all.map((f) => f.framework as string))].filter((id) => !FRAMEWORK_ORDER.includes(id));
  const frameworkIds = [...FRAMEWORK_ORDER, ...extra];
  const firstWithFindings = frameworkIds.find((id) => all.some((f) => f.framework === id));
  const activeFramework = framework && frameworkIds.includes(framework) ? framework : (firstWithFindings ?? frameworkIds[0]);

  const inFramework = all.filter((f) => f.framework === activeFramework);
  const order = (s: FindingStatus) => {
    const i = FINDING_STATUSES.indexOf(s);
    return i === -1 ? FINDING_STATUSES.length : i;
  };
  const rows = inFramework
    .filter((f) => !status || f.status === status)
    .sort((a, b) => order(a.status) - order(b.status) || a.requirement_ref.localeCompare(b.requirement_ref, undefined, { numeric: true }));
  const proposedCount = all.filter((f) => f.review_status === 'proposed').length;

  return (
    <section id="findings" ref={sectionRef} className="scroll-mt-20">
      <Card>
        <CardHeader
          title="Findings"
          description={
            findings.data
              ? `${all.length} finding${all.length === 1 ? '' : 's'} across the frameworks${proposedCount > 0 ? ` · ${proposedCount} awaiting review` : ''}`
              : 'Each requirement checked against the evidence, with citations.'
          }
          actions={
            all.length > 0 ? (
              <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as FindingStatus | '')} className="h-7 w-auto text-xs">
                <option value="">All statuses</option>
                {FINDING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {FINDING_STATUS_LABELS[s]} ({inFramework.filter((f) => f.status === s).length})
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        />
        {findings.isLoading ? (
          <SkeletonRows rows={4} />
        ) : findings.isError ? (
          <ErrorState compact error={findings.error} title="Could not load findings" onRetry={() => void findings.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState
            compact
            icon={<ListChecks className="h-4 w-4" />}
            title="No findings yet"
            description={
              active
                ? 'The specialist agents report their findings here as each one finishes.'
                : 'Findings are produced by an assessment run, after the risk class has been approved.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto px-4 pb-px pt-2">
              <Tabs<string>
                tabs={frameworkIds.map((id) => ({
                  id,
                  label: frameworkMeta(id).label,
                  count: all.filter((f) => f.framework === id).length,
                }))}
                value={activeFramework}
                onChange={setFramework}
              />
            </div>
            {rows.length === 0 ? (
              <EmptyState
                compact
                title={inFramework.length === 0 ? 'No findings for this framework' : 'No findings with this status'}
                description={inFramework.length === 0 ? 'The run did not produce findings for this framework.' : 'Choose another status, or “All statuses”.'}
              />
            ) : (
              <ul className="space-y-2 p-4">
                {rows.map((f) => (
                  <FindingRow
                    key={f.id}
                    finding={f}
                    busy={review.isPending && review.variables?.id === f.id}
                    onReview={(body) => review.mutate({ id: f.id, body })}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
