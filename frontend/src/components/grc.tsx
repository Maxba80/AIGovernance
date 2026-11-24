import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { DecisionStep, FindingStatus, ReviewStatus, RiskClass, RiskClassStatus, RunStatus } from '../lib/api';
import { cn } from '../lib/format';
import {
  FINDING_STATUS_TONES,
  REVIEW_LABELS,
  REVIEW_TONES,
  RISK_CLASS_TONES,
  RUN_STATUS_LABELS,
  RUN_STATUS_TONES,
  findingStatusLabel,
  frameworkMeta,
  riskClassLabel,
} from '../lib/grc';
import { Badge } from './ui/Badge';

/** Monospace chip for a requirement / article / objective reference. */
export function RefChip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center whitespace-nowrap rounded border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[11px] leading-4 text-fg"
    >
      {children}
    </span>
  );
}

export function FrameworkChip({ id, name, className }: { id: string | null | undefined; name?: string | null; className?: string }) {
  const m = frameworkMeta(id, name);
  return (
    <Badge tone={m.tone} variant="outline" className={className}>
      {m.label}
    </Badge>
  );
}

interface RiskClassBadgeProps {
  value: RiskClass | string | null | undefined;
  /** `proposed` adds the "proposed" marker: the class came from an agent and no human has approved it yet. */
  status?: RiskClassStatus | null;
}

export function RiskClassBadge({ value, status }: RiskClassBadgeProps) {
  if (!value) {
    return (
      <Badge tone="grey" withDot>
        Not classified
      </Badge>
    );
  }
  const tone = RISK_CLASS_TONES[value as RiskClass] ?? 'grey';
  const proposed = status === 'proposed';
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge tone={tone} variant={proposed ? 'outline' : 'solid'} withDot>
        {riskClassLabel(value)}
      </Badge>
      {proposed && (
        <span
          title="Proposed by an AI agent — not yet approved by a human"
          className="rounded border border-dashed border-amber-400 px-1 text-[10px] font-medium leading-4 text-amber-700 dark:border-amber-500/60 dark:text-amber-300"
        >
          proposed
        </span>
      )}
    </span>
  );
}

export function FindingStatusBadge({ status }: { status: FindingStatus | string }) {
  return (
    <Badge tone={FINDING_STATUS_TONES[status as FindingStatus] ?? 'grey'} withDot>
      {findingStatusLabel(status)}
    </Badge>
  );
}

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge tone={REVIEW_TONES[status] ?? 'grey'} variant={status === 'proposed' ? 'outline' : 'solid'}>
      {REVIEW_LABELS[status] ?? status}
    </Badge>
  );
}

export function RunStatusBadge({ status }: { status: RunStatus | string }) {
  return (
    <Badge tone={RUN_STATUS_TONES[status as RunStatus] ?? 'grey'} withDot>
      {RUN_STATUS_LABELS[status as RunStatus] ?? status}
    </Badge>
  );
}

/** The classifier's decision path: numbered question → answer, with the legal basis as monospace chips. */
export function DecisionPathList({ steps }: { steps: DecisionStep[] }) {
  if (steps.length === 0) return <p className="text-xs text-muted">No decision path was recorded.</p>;
  const sorted = [...steps].sort((a, b) => a.step - b.step);
  return (
    <ol className="space-y-2">
      {sorted.map((s, i) => (
        <li key={`${s.step}-${i}`} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] font-medium tabular-nums text-muted">
            {s.step}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg [overflow-wrap:anywhere]">{s.question || '—'}</p>
            <p className="mt-0.5 text-sm font-medium text-fg [overflow-wrap:anywhere]">→ {s.answer || '—'}</p>
            {s.basis.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {s.basis.map((b) => (
                  <RefChip key={b}>{b}</RefChip>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Information the agent said it was missing — shown as a warning list. */
export function MissingInfoList({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        'rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 font-medium">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        Missing information ({items.length})
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {items.map((m, i) => (
          <li key={i} className="[overflow-wrap:anywhere]">
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}
