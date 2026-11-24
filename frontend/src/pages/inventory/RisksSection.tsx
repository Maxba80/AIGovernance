import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, ShieldAlert, X } from 'lucide-react';
import { api, errorMessage, qk, type Risk, type RiskReview } from '../../lib/api';
import { cn } from '../../lib/format';
import { riskScore, riskScoreTone } from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { AiBadge } from '../../components/AiBadge';
import { RefChip, ReviewBadge } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';

const LEVELS = [1, 2, 3, 4, 5];

interface RiskRowProps {
  risk: Risk;
  busy: boolean;
  onReview: (body: RiskReview) => void;
}

function RiskRow({ risk: r, busy, onReview }: RiskRowProps) {
  const [editing, setEditing] = useState(false);
  const [likelihood, setLikelihood] = useState(r.likelihood);
  const [severity, setSeverity] = useState(r.severity);
  const score = riskScore(r);
  const rejected = r.review_status === 'rejected';
  const draftScore = likelihood * severity;

  const startEdit = () => {
    setLikelihood(r.likelihood);
    setSeverity(r.severity);
    setEditing(true);
  };

  return (
    <tr className={cn('[&:last-child>td]:border-b-0', rejected && 'opacity-60')}>
      <td className="td min-w-[180px] max-w-[260px] !align-top">
        <div className={cn('font-medium text-fg [overflow-wrap:anywhere]', rejected && 'line-through')}>{r.name}</div>
        <div className="mt-0.5 break-all font-mono text-[11px] text-muted">{r.risk_id}</div>
        {/* Transparency rule: the AI badge stays until a human has approved the risk. */}
        {r.review_status !== 'approved' && <AiBadge model={r.model} className="mt-1.5" />}
      </td>
      <td className="td max-w-[160px] !align-top text-muted [overflow-wrap:anywhere]">{r.domain ?? '—'}</td>
      <td className="td !align-top text-center tabular-nums">
        {editing ? (
          <Select aria-label={`Likelihood of ${r.name}`} value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))} className="h-7 w-14 px-1 text-xs">
            {LEVELS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        ) : (
          r.likelihood
        )}
      </td>
      <td className="td !align-top text-center tabular-nums">
        {editing ? (
          <Select aria-label={`Severity of ${r.name}`} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="h-7 w-14 px-1 text-xs">
            {LEVELS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        ) : (
          r.severity
        )}
      </td>
      <td className="td !align-top text-center">
        <Badge tone={riskScoreTone(editing ? draftScore : score)} className="min-w-[2rem] justify-center tabular-nums">
          {editing ? draftScore : score}
        </Badge>
      </td>
      <td className="td min-w-[220px] !align-top text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{r.rationale ?? '—'}</td>
      <td className="td !align-top">
        {(r.mitigating_objectives ?? []).length === 0 ? (
          <span className="text-muted">—</span>
        ) : (
          <div className="flex max-w-[160px] flex-wrap gap-1">
            {r.mitigating_objectives.map((o) => (
              <RefChip key={o}>{o}</RefChip>
            ))}
          </div>
        )}
      </td>
      <td className="td !align-top">
        <div className="flex flex-col items-end gap-1.5">
          <ReviewBadge status={r.review_status} />
          {editing ? (
            <div className="flex gap-1">
              <Button size="sm" disabled={busy} onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                loading={busy}
                title="Approve with the edited likelihood and severity"
                onClick={() => onReview({ decision: 'approve', likelihood, severity })}
              >
                Approve
              </Button>
            </div>
          ) : (
            <div className="flex gap-0.5">
              {r.review_status !== 'approved' && (
                <Button size="icon" variant="ghost" aria-label={`Approve ${r.name}`} title="Approve" disabled={busy} className="hover:!text-emerald-600" onClick={() => onReview({ decision: 'approve' })}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button size="icon" variant="ghost" aria-label={`Edit likelihood and severity of ${r.name}, then approve`} title="Edit likelihood / severity, then approve" disabled={busy} onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {r.review_status !== 'rejected' && (
                <Button size="icon" variant="ghost" aria-label={`Reject ${r.name}`} title="Reject" disabled={busy} className="hover:!text-red-600" onClick={() => onReview({ decision: 'reject' })}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

interface RisksSectionProps {
  workspaceId: string;
  systemId: string;
  /** Run being viewed; risks of other runs are hidden when the list spans several runs. */
  runId: string | null;
  active: boolean;
}

export function RisksSection({ workspaceId, systemId, runId, active }: RisksSectionProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(workspaceId);
  const key = qk.risks(workspaceId, systemId);

  const risks = useQuery({ queryKey: key, queryFn: () => api.listRisks(workspaceId, systemId) });

  const review = useMutation({
    mutationFn: (v: { id: string; body: RiskReview }) => api.reviewRisk(workspaceId, v.id, v.body),
    onSuccess: (saved, v) => {
      qc.setQueryData<Risk[]>(key, (old) => old?.map((r) => (r.id === saved.id ? saved : r)));
      invalidate();
      toast.success(v.body.decision === 'reject' ? 'Risk rejected' : 'Risk approved');
    },
    onError: (err) => toast.error(`Could not record the review: ${errorMessage(err)}`),
  });

  const all = risks.data ?? [];
  const forRun = runId ? all.filter((r) => r.run_id === runId) : [];
  const shown = (forRun.length > 0 ? forRun : all).slice().sort((a, b) => riskScore(b) - riskScore(a) || a.name.localeCompare(b.name));

  return (
    <Card>
      <CardHeader
        title="Risks"
        description="Risks the agents identified for this entry, highest score first. Score = likelihood × severity."
        actions={shown.length > 0 ? <span className="text-xs text-muted">{shown.length} risk{shown.length === 1 ? '' : 's'}</span> : undefined}
      />
      {risks.isLoading ? (
        <SkeletonRows rows={3} />
      ) : risks.isError ? (
        <ErrorState compact error={risks.error} title="Could not load risks" onRetry={() => void risks.refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          icon={<ShieldAlert className="h-4 w-4" />}
          title="No risks identified yet"
          description={active ? 'Risks appear once the crosswalk and risk step has finished.' : 'Risks are identified near the end of an assessment run.'}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">Risk</th>
                <th className="th">Domain</th>
                <th className="th text-center" title="Likelihood, 1–5">
                  Likelihood
                </th>
                <th className="th text-center" title="Severity, 1–5">
                  Severity
                </th>
                <th className="th text-center">Score</th>
                <th className="th">Rationale</th>
                <th className="th">Mitigating objectives</th>
                <th className="th text-right">Review</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <RiskRow
                  // Remount when the stored values change so an open editor never shows stale numbers.
                  key={`${r.id}-${r.likelihood}-${r.severity}-${r.review_status}`}
                  risk={r}
                  busy={review.isPending && review.variables?.id === r.id}
                  onReview={(body) => review.mutate({ id: r.id, body })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
