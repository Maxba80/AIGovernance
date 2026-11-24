import { useState } from 'react';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { Check, ClipboardCheck, X } from 'lucide-react';
import { api, errorMessage, qk, type Approval } from '../../lib/api';
import { formatDateTime, formatPercent, humanize } from '../../lib/format';
import { AiBadge, SourceList } from '../../components/AiBadge';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';

interface ApprovalQueueProps {
  workspaceId: string;
  query: UseQueryResult<Approval[]>;
  onOpenDocument: (id: string) => void;
}

const KIND_LABELS: Record<string, string> = { evidence_tag: 'Evidence tag' };

interface ApprovalCardProps {
  workspaceId: string;
  approval: Approval;
  onOpenDocument: (id: string) => void;
}

function ApprovalCard({ workspaceId, approval, onOpenDocument }: ApprovalCardProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [comment, setComment] = useState('');

  const decide = useMutation({
    mutationFn: (decision: 'approve' | 'reject') => api.decideApproval(workspaceId, approval.id, decision, comment.trim() || undefined),
    onSuccess: (_res, decision) => {
      qc.setQueryData<Approval[]>(qk.approvals(workspaceId), (old) => old?.filter((a) => a.id !== approval.id));
      void qc.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
      void qc.invalidateQueries({ queryKey: qk.documents(workspaceId) });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(decision === 'approve' ? 'Approved' : 'Rejected');
    },
  });

  const documentId = approval.sources?.find((s) => s.document_id)?.document_id ?? null;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{KIND_LABELS[approval.kind] ?? humanize(approval.kind)}</Badge>
        <AiBadge model={approval.model} />
        <span className="ml-auto text-xs text-muted">{formatDateTime(approval.created_at)}</span>
      </div>

      <h3 className="mt-2.5 text-sm font-semibold text-fg">{approval.title}</h3>
      {approval.summary && <p className="mt-1 text-sm leading-relaxed text-fg">{approval.summary}</p>}

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <dt className="text-muted">Agent</dt>
          <dd className="font-medium text-fg">{approval.agent ?? '—'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Model</dt>
          <dd className="font-mono text-fg">{approval.model ?? '—'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Confidence</dt>
          <dd className="font-medium tabular-nums text-fg">{formatPercent(approval.confidence)}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Sources</span>
          {documentId && (
            <button type="button" onClick={() => onOpenDocument(documentId)} className="text-xs font-medium text-accent-text hover:underline">
              Open document
            </button>
          )}
        </div>
        <SourceList sources={approval.sources} emptyText="The agent did not cite a source for this proposal." />
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <Textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment (optional) — recorded with your decision"
          aria-label="Comment"
          className="text-xs"
        />
        {decide.isError && (
          <Notice tone="error" className="mt-2">
            Could not record the decision: {errorMessage(decide.error)}
          </Notice>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button
            icon={<X className="h-3.5 w-3.5" />}
            onClick={() => decide.mutate('reject')}
            loading={decide.isPending && decide.variables === 'reject'}
            disabled={decide.isPending}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            icon={<Check className="h-3.5 w-3.5" />}
            onClick={() => decide.mutate('approve')}
            loading={decide.isPending && decide.variables === 'approve'}
            disabled={decide.isPending}
          >
            Approve
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ApprovalQueue({ workspaceId, query, onOpenDocument }: ApprovalQueueProps) {
  if (query.isLoading) {
    return (
      <Card>
        <SkeletonRows rows={4} />
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} title="Could not load the approval queue" onRetry={() => void query.refetch()} />
      </Card>
    );
  }
  const approvals = query.data ?? [];
  if (approvals.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardCheck className="h-4 w-4" />}
          title="Nothing to review"
          description="Proposals from AI agents appear here. Nothing they produce is treated as approved evidence until you decide."
        />
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {approvals.map((a) => (
        <ApprovalCard key={a.id} workspaceId={workspaceId} approval={a} onOpenDocument={onOpenDocument} />
      ))}
    </div>
  );
}
