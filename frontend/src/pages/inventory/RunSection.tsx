import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { UseQueryResult } from '@tanstack/react-query';
import { CheckCircle2, Circle, Loader2, MinusCircle, PauseCircle, PlayCircle, UserCheck, XCircle } from 'lucide-react';
import type { Approval, AssessmentRun, RunStep, StepStatus } from '../../lib/api';
import { cn, formatDateTime } from '../../lib/format';
import { PARALLEL_STEP_KEYS, RUN_STATUS_LABELS, STEP_STATUS_LABELS } from '../../lib/grc';
import { AiBadge } from '../../components/AiBadge';
import { RunStatusBadge } from '../../components/grc';
import { Card, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, Skeleton, SkeletonRows } from '../../components/ui/Feedback';
import { ApprovalCard } from '../evidence/ApprovalQueue';

function StepIcon({ status, className }: { status: StepStatus; className?: string }) {
  const c = cn('h-[18px] w-[18px] shrink-0', className);
  const label = STEP_STATUS_LABELS[status] ?? status;
  switch (status) {
    case 'done':
      return <CheckCircle2 className={cn(c, 'text-emerald-500')} aria-label={label} />;
    case 'running':
      return <Loader2 className={cn(c, 'animate-spin text-amber-500')} aria-label={label} />;
    case 'failed':
      return <XCircle className={cn(c, 'text-red-500')} aria-label={label} />;
    case 'waiting':
      return <PauseCircle className={cn(c, 'text-amber-500')} aria-label={label} />;
    case 'skipped':
      return <MinusCircle className={cn(c, 'text-slate-400')} aria-label={label} />;
    default:
      return <Circle className={cn(c, 'text-slate-300 dark:text-slate-600')} aria-label={label} />;
  }
}

/** One status for a group of parallel steps. */
function groupStatus(steps: RunStep[]): StepStatus {
  const has = (s: StepStatus) => steps.some((x) => x.status === s);
  if (has('running')) return 'running';
  if (has('failed')) return 'failed';
  if (has('waiting')) return 'waiting';
  if (steps.every((x) => x.status === 'skipped')) return 'skipped';
  if (steps.every((x) => x.status === 'done' || x.status === 'skipped')) return 'done';
  if (has('done')) return 'running';
  return 'pending';
}

function StepBody({ step, compact }: { step: RunStep; compact?: boolean }) {
  const muted = step.status === 'pending' || step.status === 'skipped';
  return (
    <div className={cn('min-w-0', muted && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-fg">{step.agent ?? 'Agent'}</span>
        {step.key === 'classification_approval' && (
          <span className="inline-flex items-center gap-1 rounded border border-line px-1 text-[10px] font-medium leading-4 text-muted">
            <UserCheck className="h-3 w-3" /> Human
          </span>
        )}
        {!compact && <span className="text-xs text-muted">{STEP_STATUS_LABELS[step.status] ?? step.status}</span>}
      </div>
      <div className="text-xs text-muted [overflow-wrap:anywhere]">{step.label}</div>
      {/* Transparency rule: what a model produced in this step is labelled with the model that produced it. */}
      {step.model && <AiBadge model={step.model} className="mt-1" />}
      {step.summary && <p className="mt-1 text-sm leading-snug text-fg [overflow-wrap:anywhere]">{step.summary}</p>}
      {step.error && <p className="mt-1 text-xs text-red-600 [overflow-wrap:anywhere] dark:text-red-400">{step.error}</p>}
    </div>
  );
}

type Group = { kind: 'single'; step: RunStep } | { kind: 'parallel'; steps: RunStep[] };

function groupSteps(steps: RunStep[]): Group[] {
  const groups: Group[] = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (PARALLEL_STEP_KEYS.includes(step.key)) {
      if (last && last.kind === 'parallel') last.steps.push(step);
      else groups.push({ kind: 'parallel', steps: [step] });
    } else {
      groups.push({ kind: 'single', step });
    }
  }
  return groups;
}

function Rail({ icon, last, children }: { icon: ReactNode; last: boolean; children: ReactNode }) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute bottom-0 left-[8.5px] top-[22px] w-px bg-line" aria-hidden />}
      <span className="relative mt-px flex shrink-0 bg-surface">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function Stepper({ steps }: { steps: RunStep[] }) {
  const groups = groupSteps(steps);
  return (
    <ol>
      {groups.map((g, i) => {
        const last = i === groups.length - 1;
        if (g.kind === 'single') {
          return (
            <Rail key={g.step.key} last={last} icon={<StepIcon status={g.step.status} />}>
              <StepBody step={g.step} />
            </Rail>
          );
        }
        return (
          <Rail key={`parallel-${i}`} last={last} icon={<StepIcon status={groupStatus(g.steps)} />}>
            <div className="text-sm font-medium text-fg">Specialist agents (in parallel)</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {g.steps.map((s) => (
                <div key={s.key} className="flex min-w-0 gap-2 rounded-md border border-line bg-bg p-2.5">
                  <StepIcon status={s.status} className="mt-px !h-4 !w-4" />
                  <StepBody step={s} compact />
                </div>
              ))}
            </div>
          </Rail>
        );
      })}
    </ol>
  );
}

interface PendingApprovalProps {
  workspaceId: string;
  approvalId: string | null;
  approvals: UseQueryResult<Approval[]>;
}

/** The decision the run is waiting for, rendered in place so the user does not have to leave the page. */
function PendingApproval({ workspaceId, approvalId, approvals }: PendingApprovalProps) {
  const approval = approvalId ? approvals.data?.find((a) => a.id === approvalId) : undefined;
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50/60 p-3 dark:border-amber-500/60 dark:bg-amber-500/5">
      <div className="mb-3 flex items-start gap-2 px-1">
        <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <div className="text-sm font-semibold text-fg">Your decision is needed — the assessment is paused</div>
          <p className="mt-0.5 text-xs text-muted">
            The classifier proposed a risk class. Approve it, approve a different class or reject it; the specialist agents start only after that.
          </p>
        </div>
      </div>
      {approval ? (
        <ApprovalCard workspaceId={workspaceId} approval={approval} inline />
      ) : approvals.isLoading ? (
        <Card className="p-4">
          <Skeleton className="h-24 w-full" />
        </Card>
      ) : approvals.isError ? (
        <Card>
          <ErrorState compact error={approvals.error} title="Could not load the pending approval" onRetry={() => void approvals.refetch()} />
        </Card>
      ) : (
        <Notice tone="warning">
          The pending approval could not be found in the queue — it may have just been decided.{' '}
          <button type="button" className="font-medium underline" onClick={() => void approvals.refetch()}>
            Refresh
          </button>{' '}
          or open the{' '}
          <Link to="/evidence?tab=approvals" className="font-medium underline">
            approval queue
          </Link>
          .
        </Notice>
      )}
    </div>
  );
}

interface RunSectionProps {
  workspaceId: string;
  runs: UseQueryResult<AssessmentRun[]>;
  /** The run being viewed (the latest unless an earlier one was picked). */
  run: AssessmentRun | null;
  onSelectRun: (id: string) => void;
  approvals: UseQueryResult<Approval[]>;
}

export function RunSection({ workspaceId, runs, run, onSelectRun, approvals }: RunSectionProps) {
  const list = runs.data ?? [];
  const isLatest = run != null && list[0]?.id === run.id;
  const synthesisModel = run?.steps.find((s) => s.key === 'synthesis')?.model ?? null;

  return (
    <Card>
      <CardHeader
        title="Assessment run"
        description={
          run
            ? `${isLatest ? 'Latest run' : 'Earlier run'} · started ${formatDateTime(run.created_at)}${run.finished_at ? ` · finished ${formatDateTime(run.finished_at)}` : ''}`
            : 'The orchestrator classifies the system, pauses for your approval, then runs the specialist agents.'
        }
        actions={
          run ? (
            <>
              <RunStatusBadge status={run.status} />
              {list.length > 1 && (
                <Select aria-label="Run history" value={run.id} onChange={(e) => onSelectRun(e.target.value)} className="h-7 w-auto max-w-[260px] text-xs">
                  {list.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {formatDateTime(r.created_at)} — {RUN_STATUS_LABELS[r.status] ?? r.status}
                      {i === 0 ? ' (latest)' : ''}
                    </option>
                  ))}
                </Select>
              )}
            </>
          ) : undefined
        }
      />
      {runs.isLoading ? (
        <SkeletonRows rows={4} />
      ) : runs.isError && !run ? (
        <ErrorState compact error={runs.error} title="Could not load assessment runs" onRetry={() => void runs.refetch()} />
      ) : !run ? (
        <EmptyState
          compact
          icon={<PlayCircle className="h-4 w-4" />}
          title="Not assessed yet"
          description="Run an assessment to classify this entry under the EU AI Act and check it against GDPR, ISO/IEC 42001 and the NIST AI RMF."
        />
      ) : (
        <div className="space-y-4 p-4">
          {runs.isError && <Notice tone="error">Live updates are failing — the status below may be out of date.</Notice>}
          {!isLatest && <Notice>You are viewing an earlier run. The sections below show its results.</Notice>}

          {run.status === 'waiting_approval' && <PendingApproval workspaceId={workspaceId} approvalId={run.pending_approval_id} approvals={approvals} />}

          {run.status === 'failed' && (
            <Notice tone="error">
              <span className="font-medium">The run failed.</span> {run.error ?? 'No error message was recorded.'}
            </Notice>
          )}

          {run.summary && (
            <div className="rounded-md border border-line bg-bg p-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Executive synthesis</span>
                <AiBadge model={synthesisModel} />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{run.summary}</p>
            </div>
          )}

          {run.steps.length === 0 ? <p className="text-xs text-muted">The run has not reported any step yet.</p> : <Stepper steps={run.steps} />}
        </div>
      )}
    </Card>
  );
}
