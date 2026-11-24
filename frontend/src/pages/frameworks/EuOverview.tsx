import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { api, qk, type EuAiActOverview, type EuGuidance } from '../../lib/api';
import { cn, formatDate, formatNumber } from '../../lib/format';
import { RefChip } from '../../components/grc';
import { Badge, type Tone } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';

export function useEuOverview() {
  return useQuery({ queryKey: qk.euOverview, queryFn: api.euAiActOverview, staleTime: 5 * 60_000 });
}

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Timeline({ overview }: { overview: EuAiActOverview }) {
  const today = todayIso();
  const entries = [...(overview.timeline ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const nextIndex = entries.findIndex((e) => e.date.slice(0, 10) >= today);

  return (
    <Card>
      <CardHeader title="Application timeline" description="When each part of the Regulation starts to apply. Past dates are muted; the next one is highlighted." />
      {entries.length === 0 ? (
        <EmptyState compact icon={<CalendarClock className="h-4 w-4" />} title="No dates recorded" description="The knowledge base lists no application date." />
      ) : (
        <ol className="px-4 py-4">
          {entries.map((e, i) => {
            const past = nextIndex === -1 || i < nextIndex;
            const next = i === nextIndex;
            return (
              <li key={`${e.date}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
                {i < entries.length - 1 && <span className="absolute bottom-0 left-[5px] top-4 w-px bg-line-strong" aria-hidden />}
                <span
                  className={cn(
                    'relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2',
                    next ? 'border-accent bg-accent ring-4 ring-accent/20' : past ? 'border-line-strong bg-surface2' : 'border-line-strong bg-surface',
                  )}
                  aria-hidden
                />
                <div className={cn('min-w-0 flex-1', next && '-mt-1 rounded-md border border-accent/40 bg-accent/5 px-3 py-2')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <time dateTime={e.date} className={cn('text-sm font-semibold tabular-nums', past ? 'text-muted' : 'text-fg')}>
                      {formatDate(e.date)}
                    </time>
                    {next && <Badge tone="indigo">Next</Badge>}
                    {past && <span className="text-[11px] text-muted">Already applies</span>}
                    {e.basis && <RefChip>{e.basis}</RefChip>}
                  </div>
                  <p className={cn('mt-0.5 whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]', past ? 'text-muted' : 'text-fg')}>{e.what}</p>
                  {next && overview.timeline_verification && (
                    <p className="mt-1.5 border-t border-accent/20 pt-1.5 text-xs text-muted [overflow-wrap:anywhere]">
                      <span className="font-medium text-fg">Verification:</span> {overview.timeline_verification}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {/* All dates are in the past: the note has no "next" entry to sit under. */}
      {entries.length > 0 && nextIndex === -1 && overview.timeline_verification && (
        <div className="px-4 pb-4">
          <Notice>
            <span className="font-medium">Verification:</span> {overview.timeline_verification}
          </Notice>
        </div>
      )}
    </Card>
  );
}

function guidanceTone(status: string | null): Tone {
  const s = (status ?? '').toLowerCase();
  if (/not[\s_-]*published|withdrawn|missing/.test(s)) return 'red';
  if (/draft|consultation|pending|expected/.test(s)) return 'amber';
  if (/final|published|adopted|in[\s_-]*force/.test(s)) return 'green';
  return 'grey';
}

function GuidanceStatus({ item }: { item: EuGuidance }) {
  if (!item.status) return <span className="text-xs text-muted">—</span>;
  const tone = guidanceTone(item.status);
  return (
    <Badge tone={tone} variant={tone === 'green' || tone === 'grey' ? 'solid' : 'outline'} className="font-semibold uppercase tracking-wide">
      {item.status.replace(/_/g, ' ')}
    </Badge>
  );
}

function formatEur(n: number | null): string {
  return n == null ? '—' : `€ ${formatNumber(n)}`;
}

export function EuOverview() {
  const overview = useEuOverview();

  if (overview.isLoading) {
    return (
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <Card>
        <ErrorState error={overview.error} title="Could not load the EU AI Act overview" onRetry={() => void overview.refetch()} />
      </Card>
    );
  }
  const o = overview.data;
  const changes = o.key_changes ?? [];
  const penalties = o.penalties ?? [];
  const guidance = o.guidance ?? [];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Timeline overview={o} />

      <Card>
        <CardHeader title="Key changes introduced by the 2026 amendment" description="What the amending Regulation changed, article by article." />
        {changes.length === 0 ? (
          <EmptyState compact title="No changes recorded" description="The knowledge base lists no change for the amendment." />
        ) : (
          <ul className="divide-y divide-line">
            {changes.map((c, i) => (
              <li key={i} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
                <RefChip>{c.article}</RefChip>
                <p className="min-w-0 flex-1 basis-56 whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{c.change}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Penalties" description="Maximum administrative fines. For undertakings the higher of the two amounts applies, unless the Regulation says otherwise." />
        {penalties.length === 0 ? (
          <EmptyState compact title="No penalties recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Infringement</th>
                  <th className="th text-right">Maximum fine</th>
                  <th className="th text-right">Worldwide annual turnover</th>
                </tr>
              </thead>
              <tbody>
                {penalties.map((p, i) => (
                  <tr key={i} className="[&:last-child>td]:border-b-0">
                    <td className="td text-fg [overflow-wrap:anywhere]">{p.infringement}</td>
                    <td className="td whitespace-nowrap text-right font-medium tabular-nums text-fg">{formatEur(p.max_eur)}</td>
                    <td className="td whitespace-nowrap text-right font-medium tabular-nums text-fg">{p.max_turnover_pct == null ? '—' : `${p.max_turnover_pct}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Guidance register" description="Guidelines, codes and standards that support the Regulation, with their publication status." />
        {guidance.length === 0 ? (
          <EmptyState compact title="No guidance recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Title</th>
                  <th className="th">Date</th>
                  <th className="th">Status</th>
                  <th className="th">Verification</th>
                </tr>
              </thead>
              <tbody>
                {guidance.map((g, i) => (
                  <tr key={i} className="[&:last-child>td]:border-b-0">
                    <td className="td min-w-[200px] text-fg [overflow-wrap:anywhere]">
                      {g.url ? (
                        <a href={g.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-baseline gap-1 font-medium hover:text-accent-text hover:underline">
                          {g.title}
                          <ExternalLink className="h-3 w-3 shrink-0 self-center" aria-hidden />
                        </a>
                      ) : (
                        <span className="font-medium">{g.title}</span>
                      )}
                    </td>
                    <td className="td whitespace-nowrap text-muted">{g.date ? (/^\d{4}-\d{2}-\d{2}/.test(g.date) ? formatDate(g.date) : g.date) : '—'}</td>
                    <td className="td">
                      <GuidanceStatus item={g} />
                    </td>
                    <td className="td min-w-[160px] text-xs text-muted [overflow-wrap:anywhere]">{g.verification ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
