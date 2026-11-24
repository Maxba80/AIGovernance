import { useEffect, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, FilePenLine } from 'lucide-react';
import { api, isStatus, qk, type ComplianceStatus, type KbRelatedRequirement } from '../lib/api';
import { cn } from '../lib/format';
import { COMPLIANCE_FILL, FRAMEWORK_ORDER, complianceLabel, frameworkMeta } from '../lib/grc';
import { ComplianceStatusBadge, FrameworkChip, RefChip } from './grc';
import { Badge } from './ui/Badge';
import { EmptyState, ErrorState, Notice, SkeletonRows } from './ui/Feedback';
import { SlideOver } from './ui/Overlay';

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 text-xs font-medium text-muted">{children}</h3>;
}

const RELATION_LABELS: Record<string, string> = { closeMatch: 'Close match', relatedMatch: 'Related' };

function groupByFramework(related: KbRelatedRequirement[]): Array<{ framework: string; items: KbRelatedRequirement[] }> {
  const map = new Map<string, KbRelatedRequirement[]>();
  for (const r of related) {
    const list = map.get(r.framework) ?? [];
    list.push(r);
    map.set(r.framework, list);
  }
  const rank = (id: string) => {
    const i = FRAMEWORK_ORDER.indexOf(id);
    return i === -1 ? FRAMEWORK_ORDER.length : i;
  };
  return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0])).map(([framework, items]) => ({ framework, items }));
}

interface RequirementDetailProps {
  requirementRef: string;
  /** Called when a related requirement is clicked. */
  onNavigate: (ref: string) => void;
  /** Heading of the related-requirements block (the graph calls it "Also satisfies"). */
  relatedHeading?: string;
  /** Workspace status of a related requirement, where the caller knows it. */
  statusOf?: (ref: string) => ComplianceStatus | null | undefined;
}

/**
 * A requirement from the knowledge base: citation, text, amendments, objectives, related requirements
 * in the other frameworks and the source line. Shared by the Frameworks module and the Compliance Graph.
 */
export function RequirementDetail({ requirementRef, onNavigate, relatedHeading = 'Related requirements in other frameworks', statusOf }: RequirementDetailProps) {
  const query = useQuery({
    queryKey: qk.kbRequirement(requirementRef),
    queryFn: () => api.kbRequirement(requirementRef),
    staleTime: 5 * 60_000,
    retry: (count, err) => !isStatus(err, 404) && count < 2,
  });

  if (query.isLoading) return <SkeletonRows rows={6} />;
  if (query.isError || !query.data) {
    return isStatus(query.error, 404) ? (
      <EmptyState compact icon={<BookOpen className="h-4 w-4" />} title="Not in the knowledge base" description={`No requirement with the reference ${requirementRef} was found.`} />
    ) : (
      <ErrorState compact error={query.error} title="Could not load this requirement" onRetry={() => void query.refetch()} />
    );
  }

  const r = query.data;
  const amendments = r.amendments ?? [];
  const objectives = r.objectives ?? [];
  const related = groupByFramework(r.related ?? []);
  const amended = !!r.status_note || amendments.length > 0;

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RefChip>{r.ref}</RefChip>
          <FrameworkChip id={r.framework} />
          {amended && <Badge tone="amber">Amended</Badge>}
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-fg [overflow-wrap:anywhere]">{r.title}</h2>
        {r.citation && <p className="mt-1 text-xs text-muted [overflow-wrap:anywhere]">{r.citation}</p>}
        {r.group && <p className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">{r.group}</p>}
      </div>

      {amended && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
            <FilePenLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Amended
          </div>
          {r.status_note && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed [overflow-wrap:anywhere]">{r.status_note}</p>}
          {amendments.length > 0 && (
            <ul className="mt-2 space-y-2">
              {amendments.map((a, i) => (
                <li key={i} className="rounded border border-amber-300/70 bg-surface/60 px-2.5 py-2 dark:border-amber-500/30 dark:bg-transparent">
                  <div className="text-xs font-medium [overflow-wrap:anywhere]">{a.citation}</div>
                  <blockquote className="mt-1 whitespace-pre-line border-l-2 border-amber-400 pl-2.5 text-xs leading-relaxed [overflow-wrap:anywhere]">
                    {a.instruction}
                  </blockquote>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <Heading>{r.text ? 'Text' : 'Summary'}</Heading>
        {r.text ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{r.text}</p>
        ) : (
          <>
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">
              {r.summary ?? 'No summary is available for this requirement.'}
            </p>
            <Notice className="mt-2">
              The full text of this requirement is not included in the knowledge base{r.summary ? '; this is a paraphrased summary' : ''}. Refer to the
              source below for the authoritative wording.
            </Notice>
          </>
        )}
        {r.text && r.summary && (
          <div className="mt-3">
            <Heading>Summary</Heading>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted [overflow-wrap:anywhere]">{r.summary}</p>
          </div>
        )}
      </div>

      <div>
        <Heading>Control objectives</Heading>
        {objectives.length === 0 ? (
          <p className="text-xs text-muted">This requirement is not mapped to a common control objective.</p>
        ) : (
          <ul className="space-y-1">
            {objectives.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <RefChip>{o.id}</RefChip>
                <span className="min-w-0 flex-1 text-fg [overflow-wrap:anywhere]">{o.name_en}</span>
                <Badge tone="grey" variant={o.strength === 'primary' ? 'solid' : 'outline'}>
                  {o.strength}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Heading>{relatedHeading}</Heading>
        {related.length === 0 ? (
          <p className="text-xs text-muted">No related requirement in another framework.</p>
        ) : (
          <div className="space-y-3">
            {related.map((g) => (
              <div key={g.framework}>
                <FrameworkChip id={g.framework} />
                <ul className="mt-1.5 space-y-1">
                  {g.items.map((x, i) => {
                    const status = statusOf?.(x.ref);
                    return (
                      <li key={`${x.ref}-${x.via ?? ''}-${i}`}>
                        <button
                          type="button"
                          onClick={() => onNavigate(x.ref)}
                          className={cn(
                            'flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-line border-l-2 px-2.5 py-1.5 text-left hover:bg-surface2/60',
                            frameworkMeta(g.framework).border,
                          )}
                        >
                          {status && (
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', COMPLIANCE_FILL[status])} title={complianceLabel(status)} aria-label={complianceLabel(status)} />
                          )}
                          <span className="font-mono text-[11px] text-fg">{x.ref}</span>
                          <span className="min-w-0 flex-1 basis-40 text-xs text-fg [overflow-wrap:anywhere]">{x.title ?? ''}</span>
                          <span className="text-[11px] text-muted">
                            {x.via ? (
                              <>
                                via <span className="font-mono">{x.via}</span> ·{' '}
                              </>
                            ) : null}
                            {RELATION_LABELS[x.relation] ?? x.relation}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line pt-3">
        <Heading>Source</Heading>
        {r.source ? (
          <dl className="space-y-0.5 text-xs">
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted">Title</dt>
              <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">{r.source.title}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted">Version</dt>
              <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">{r.source.version ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 text-muted">Verification</dt>
              <dd className="min-w-0 text-fg [overflow-wrap:anywhere]">{r.source.verification ?? 'Not recorded'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-muted">No source is recorded for this requirement.</p>
        )}
      </div>
    </div>
  );
}

interface RequirementPanelProps {
  /** The requirement to open; null closes the panel. */
  requirementRef: string | null;
  onClose: () => void;
  /** Workspace status of a requirement, where known (shown in the panel header). */
  statusOf?: (ref: string) => ComplianceStatus | null | undefined;
}

/** Slide-over around RequirementDetail. Clicking a related requirement swaps the panel to it, with a way back. */
export function RequirementPanel({ requirementRef, onClose, statusOf }: RequirementPanelProps) {
  const [trail, setTrail] = useState<string[]>([]);

  // A new requirement opened from outside starts a fresh trail.
  useEffect(() => {
    setTrail(requirementRef ? [requirementRef] : []);
  }, [requirementRef]);

  const current = trail[trail.length - 1] ?? requirementRef;
  const status = current ? statusOf?.(current) : null;

  return (
    <SlideOver
      open={requirementRef !== null}
      onClose={onClose}
      title={<span className="font-mono">{current ?? ''}</span>}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {trail.length > 1 && (
            <button type="button" onClick={() => setTrail((t) => t.slice(0, -1))} className="inline-flex items-center gap-1 font-medium text-accent-text hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to <span className="font-mono">{trail[trail.length - 2]}</span>
            </button>
          )}
          {status ? <ComplianceStatusBadge status={status} /> : trail.length <= 1 ? 'Requirement from the knowledge base' : null}
        </span>
      }
    >
      {current && <RequirementDetail key={current} requirementRef={current} onNavigate={(ref) => setTrail((t) => [...t, ref])} statusOf={statusOf} />}
    </SlideOver>
  );
}
