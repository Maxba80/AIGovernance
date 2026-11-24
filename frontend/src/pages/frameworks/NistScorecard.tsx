import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Gauge } from 'lucide-react';
import { api, qk, type NistCategory, type NistFunctionScore } from '../../lib/api';
import { cn } from '../../lib/format';
import { ComplianceStatusBadge, StatusCountsBar } from '../../components/grc';
import { RequirementPanel } from '../../components/RequirementDetail';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';

function levelText(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function MaturityBar({ value, label }: { value: number | null; label: string }) {
  const v = value == null ? 0 : Math.max(0, Math.min(5, value));
  return (
    <div>
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface2"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value == null ? 'No assessment yet' : `${levelText(v)} of 5`}
      >
        {value != null && <div className="h-full rounded-full bg-orange-500" style={{ width: `${(v / 5) * 100}%` }} />}
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className="absolute inset-y-0 w-px bg-surface" style={{ left: `${(n / 5) * 100}%` }} aria-hidden />
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-muted" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({ category, onOpen }: { category: NistCategory; onOpen: (ref: string) => void }) {
  const [open, setOpen] = useState(false);
  const subs = category.subcategories ?? [];
  const gaps = subs.filter((s) => s.status === 'gap').length;
  const partial = subs.filter((s) => s.status === 'partial').length;
  return (
    <li className="border-t border-line first:border-t-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-surface2/60">
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
        <span className="font-mono text-xs font-medium text-fg">{category.id}</span>
        <span className="text-xs tabular-nums text-muted">
          {subs.length} subcategor{subs.length === 1 ? 'y' : 'ies'}
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs tabular-nums">
          {gaps > 0 && <span className="font-medium text-red-600 dark:text-red-400">{gaps} gap{gaps === 1 ? '' : 's'}</span>}
          {partial > 0 && <span className="font-medium text-amber-700 dark:text-amber-300">{partial} partial</span>}
        </span>
      </button>
      {open &&
        (subs.length === 0 ? (
          <p className="px-4 pb-3 pl-10 text-xs text-muted">No subcategories.</p>
        ) : (
          <ul className="pb-2">
            {subs.map((s) => (
              <li key={s.ref}>
                <button type="button" onClick={() => onOpen(s.ref)} className="flex w-full flex-wrap items-start gap-x-3 gap-y-1 px-4 py-1.5 pl-10 text-left hover:bg-surface2/60">
                  <span className="w-28 shrink-0 font-mono text-[11px] leading-5 text-fg">{s.ref}</span>
                  <span className="min-w-0 flex-1 basis-48 text-xs leading-5 text-fg [overflow-wrap:anywhere]">{s.text}</span>
                  <ComplianceStatusBadge status={s.status} />
                </button>
              </li>
            ))}
          </ul>
        ))}
    </li>
  );
}

function FunctionCard({ fn, onOpen }: { fn: NistFunctionScore; onOpen: (ref: string) => void }) {
  const systems = fn.systems ?? [];
  const categories = fn.categories ?? [];
  return (
    <Card className="border-l-4 border-l-orange-500">
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-sm font-semibold tracking-wide text-fg">{fn.id}</h3>
          {fn.maturity == null ? (
            <span className="text-xs font-medium text-muted">No assessment yet</span>
          ) : (
            <span className="text-xs text-muted">
              Maturity <span className="text-lg font-semibold tabular-nums text-fg">{levelText(fn.maturity)}</span> / 5
            </span>
          )}
        </div>
        {fn.description && <p className="mt-0.5 text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">{fn.description}</p>}
        <div className="mt-2.5">
          <MaturityBar value={fn.maturity} label={`${fn.id} maturity`} />
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs font-medium text-muted">Per system — level from its latest completed assessment run</div>
          {systems.length === 0 ? (
            <p className="text-xs text-muted">No system has a completed assessment run yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {systems.map((s) => (
                <li key={s.system_id}>
                  <Link
                    to={`/inventory/${encodeURIComponent(s.system_id)}`}
                    title={`Open ${s.name}`}
                    className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-xs hover:bg-surface2"
                  >
                    <span className="truncate text-fg">{s.name}</span>
                    <span className={cn('font-semibold tabular-nums', s.level == null ? 'text-muted' : 'text-orange-700 dark:text-orange-300')}>
                      {s.level == null ? '—' : levelText(s.level)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3">
          <div className="mb-1 text-xs font-medium text-muted">Subcategories by status</div>
          <StatusCountsBar counts={fn.counts} label={`${fn.id} subcategories`} />
        </div>
      </div>

      <div className="border-t border-line">
        {categories.length === 0 ? <p className="px-4 py-3 text-xs text-muted">No categories.</p> : (
          <ul>
            {categories.map((c) => (
              <CategoryBlock key={c.id} category={c} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export function NistScorecard({ workspaceId }: { workspaceId: string }) {
  const scorecard = useQuery({ queryKey: qk.nistScorecard(workspaceId), queryFn: () => api.nistScorecard(workspaceId) });
  const [openRef, setOpenRef] = useState<string | null>(null);

  if (scorecard.isLoading) {
    return (
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    );
  }
  if (scorecard.isError || !scorecard.data) {
    return (
      <Card>
        <ErrorState error={scorecard.error} title="Could not load the scorecard" onRetry={() => void scorecard.refetch()} />
      </Card>
    );
  }
  const functions = scorecard.data.functions ?? [];
  if (functions.length === 0) {
    return (
      <Card>
        <EmptyState icon={<Gauge className="h-4 w-4" />} title="No scorecard" description="The server returned no NIST AI RMF function." />
      </Card>
    );
  }
  const statusByRef = new Map(functions.flatMap((f) => (f.categories ?? []).flatMap((c) => (c.subcategories ?? []).map((s) => [s.ref, s.status] as const))));

  return (
    <div className="space-y-4">
      <Notice>
        <span className="font-medium">Maturity scale (0–5).</span> {scorecard.data.scale_note ?? 'No scale note was provided.'} Levels are produced by the NIST agent
        during assessment runs; each function shows the average across systems.
      </Notice>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        {functions.map((f) => (
          <FunctionCard key={f.id} fn={f} onOpen={setOpenRef} />
        ))}
      </div>
      <RequirementPanel requirementRef={openRef} onClose={() => setOpenRef(null)} statusOf={(ref) => statusByRef.get(ref)} />
    </div>
  );
}
