import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronDown, ChevronRight, ClipboardCheck, PauseCircle, X } from 'lucide-react';
import { api, errorMessage, qk, type Approval, type RiskClass } from '../../lib/api';
import { formatDateTime, formatPercent, humanize } from '../../lib/format';
import {
  FINDING_STATUSES,
  RISK_CLASSES,
  asCountMap,
  asDecisionPath,
  asNumber,
  asString,
  asStringList,
  findingStatusLabel,
  isRiskClass,
  riskClassLabel,
} from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { AiBadge, SourceList } from '../../components/AiBadge';
import { DecisionPathList, FindingStatusBadge, FrameworkChip, MissingInfoList, RiskClassBadge } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';

interface ApprovalQueueProps {
  workspaceId: string;
  query: UseQueryResult<Approval[]>;
  onOpenDocument: (id: string) => void;
}

const KIND_LABELS: Record<string, string> = {
  evidence_tag: 'Evidence tag',
  risk_classification: 'Risk classification',
  assessment_findings: 'Assessment findings',
};

interface ApprovalCardProps {
  workspaceId: string;
  approval: Approval;
  /** Omit where there is no document panel to open (e.g. inline on the system page). */
  onOpenDocument?: (id: string) => void;
  /** Hide links back to the system when the card is already shown on that system's page. */
  inline?: boolean;
}

interface Decision {
  decision: 'approve' | 'reject';
  override_class?: RiskClass;
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-xs font-medium text-muted">{children}</div>;
}

/** Looks up the system name from the (cached) inventory; falls back to nothing while unknown. */
function useSystemName(workspaceId: string, systemId: string | null): string | null {
  const systems = useQuery({
    queryKey: qk.systems(workspaceId),
    queryFn: () => api.listSystems(workspaceId),
    enabled: !!systemId,
    staleTime: 30_000,
  });
  return systems.data?.find((s) => s.id === systemId)?.name ?? null;
}

// ---------- risk_classification ----------

interface ClassificationBodyProps {
  workspaceId: string;
  approval: Approval;
  inline?: boolean;
}

function ClassificationBody({ workspaceId, approval, inline }: ClassificationBodyProps) {
  const p = approval.payload ?? {};
  const [pathOpen, setPathOpen] = useState(false);
  const systemId = asString(p.system_id);
  const systemName = useSystemName(workspaceId, systemId);
  const proposed = asString(p.proposed_class);
  const rationale = asString(p.rationale) ?? approval.summary;
  const confidence = asNumber(p.confidence) ?? approval.confidence;
  const path = asDecisionPath(p.decision_path);
  const missing = asStringList(p.missing_information);

  return (
    <div className="mt-3 space-y-3">
      <Notice tone="warning">
        <div className="flex items-start gap-2">
          <PauseCircle className="mt-px h-4 w-4 shrink-0" />
          <div>
            <span className="font-medium">The assessment is paused until you decide.</span> The specialist agents only start once the risk class
            is approved. Rejecting stops the run.
          </div>
        </div>
      </Notice>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs text-muted">System</dt>
          <dd className="mt-0.5 text-sm font-medium text-fg [overflow-wrap:anywhere]">
            {systemId && !inline ? (
              <Link to={`/inventory/${encodeURIComponent(systemId)}`} className="hover:text-accent-text hover:underline">
                {systemName ?? approval.title}
              </Link>
            ) : (
              (systemName ?? approval.title)
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Proposed class</dt>
          <dd className="mt-0.5">
            <RiskClassBadge value={proposed} status="proposed" />
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted">Confidence</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums text-fg">{formatPercent(confidence)}</dd>
        </div>
      </dl>

      <div>
        <Label>Rationale</Label>
        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">
          {rationale ?? 'The agent did not give a rationale.'}
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setPathOpen((o) => !o)}
          aria-expanded={pathOpen}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
        >
          {pathOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Decision path ({path.length} step{path.length === 1 ? '' : 's'})
        </button>
        {pathOpen && (
          <div className="mt-2 rounded-md border border-line bg-bg p-3">
            <DecisionPathList steps={path} />
          </div>
        )}
      </div>

      <MissingInfoList items={missing} />
    </div>
  );
}

// ---------- assessment_findings ----------

function FindingsBody({ workspaceId, approval, inline }: ClassificationBodyProps) {
  const p = approval.payload ?? {};
  const systemId = asString(p.system_id);
  const systemName = useSystemName(workspaceId, systemId);
  const framework = asString(p.framework);
  const counts = asCountMap(p.counts);
  const total = Array.isArray(p.finding_ids) ? p.finding_ids.length : Object.values(counts).reduce((n, c) => n + c, 0);
  // Known statuses first, in severity order; anything else the server sends is still shown.
  const known = FINDING_STATUSES.filter((s) => (counts[s] ?? 0) > 0);
  const other = Object.keys(counts).filter((k) => !(FINDING_STATUSES as string[]).includes(k) && counts[k] > 0);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FrameworkChip id={framework} />
        <span className="text-sm text-fg">
          {total} finding{total === 1 ? '' : 's'}
          {systemName ? (
            <>
              {' '}
              for <span className="font-medium">{systemName}</span>
            </>
          ) : null}
        </span>
      </div>

      <div>
        <Label>Findings by status</Label>
        {known.length + other.length === 0 ? (
          <p className="mt-0.5 text-xs text-muted">No counts were recorded.</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {known.map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <FindingStatusBadge status={s} />
                <span className="text-xs font-medium tabular-nums text-fg">{counts[s]}</span>
              </span>
            ))}
            {other.map((k) => (
              <span key={k} className="inline-flex items-center gap-1">
                <Badge tone="grey">{findingStatusLabel(k)}</Badge>
                <span className="text-xs font-medium tabular-nums text-fg">{counts[k]}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Approving approves every finding in this set that is still proposed; rejecting rejects them. Findings you have already reviewed one by one
        keep your decision.
      </p>

      {systemId && !inline && (
        <Link
          to={`/inventory/${encodeURIComponent(systemId)}${framework ? `?framework=${encodeURIComponent(framework)}` : ''}#findings`}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline"
        >
          Review the findings one by one <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ---------- Card ----------

export function ApprovalCard({ workspaceId, approval, onOpenDocument, inline }: ApprovalCardProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(workspaceId);
  const [comment, setComment] = useState('');
  const [override, setOverride] = useState<RiskClass | ''>('');

  const isClassification = approval.kind === 'risk_classification';
  const isFindings = approval.kind === 'assessment_findings';
  const isKnown = isClassification || isFindings || approval.kind === 'evidence_tag';
  const proposedClass = isClassification ? asString(approval.payload?.proposed_class) : null;

  const decide = useMutation({
    mutationFn: (d: Decision) =>
      api.decideApproval(workspaceId, approval.id, d.decision, {
        comment: comment.trim() || undefined,
        override_class: d.override_class,
      }),
    onSuccess: (_res, d) => {
      qc.setQueryData<Approval[]>(qk.approvals(workspaceId), (old) => old?.filter((a) => a.id !== approval.id));
      void qc.invalidateQueries({ queryKey: qk.documents(workspaceId) });
      invalidate();
      toast.success(
        d.decision === 'reject'
          ? 'Rejected'
          : d.override_class
            ? `Approved as ${riskClassLabel(d.override_class)}`
            : 'Approved',
      );
    },
  });

  const documentId = approval.sources?.find((s) => s.document_id)?.document_id ?? null;
  const hasSources = (approval.sources?.length ?? 0) > 0;
  const hasPayload = approval.payload != null && Object.keys(approval.payload).length > 0;
  const approving = decide.isPending && decide.variables?.decision === 'approve';
  const rejecting = decide.isPending && decide.variables?.decision === 'reject';

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="indigo">{KIND_LABELS[approval.kind] ?? humanize(approval.kind)}</Badge>
        <AiBadge model={approval.model} />
        <span className="ml-auto text-xs text-muted">{formatDateTime(approval.created_at)}</span>
      </div>

      <h3 className="mt-2.5 text-sm font-semibold text-fg [overflow-wrap:anywhere]">{approval.title}</h3>
      {approval.summary && !isClassification && (
        <p className="mt-1 text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{approval.summary}</p>
      )}

      {isClassification && <ClassificationBody workspaceId={workspaceId} approval={approval} inline={inline} />}
      {isFindings && <FindingsBody workspaceId={workspaceId} approval={approval} inline={inline} />}

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
        <div className="flex gap-1.5">
          <dt className="text-muted">Agent</dt>
          <dd className="font-medium text-fg">{approval.agent ?? '—'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted">Model</dt>
          <dd className="break-all font-mono text-fg">{approval.model ?? '—'}</dd>
        </div>
        {!isClassification && (
          <div className="flex gap-1.5">
            <dt className="text-muted">Confidence</dt>
            <dd className="font-medium tabular-nums text-fg">{formatPercent(approval.confidence)}</dd>
          </div>
        )}
      </dl>

      {/* Unknown future kinds: show whatever the server sent rather than hide it. */}
      {!isKnown && (
        <div className="mt-3">
          <Label>Payload</Label>
          {hasPayload ? (
            <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg">
              {JSON.stringify(approval.payload, null, 2)}
            </pre>
          ) : (
            <p className="mt-0.5 text-xs text-muted">No payload.</p>
          )}
        </div>
      )}

      {/* Findings sets cite their sources per finding, so an empty list here is not a missing citation. */}
      {(hasSources || !isFindings) && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Sources</span>
            {documentId && onOpenDocument && (
              <button type="button" onClick={() => onOpenDocument(documentId)} className="text-xs font-medium text-accent-text hover:underline">
                Open document
              </button>
            )}
          </div>
          <SourceList sources={approval.sources} emptyText="The agent did not cite a source for this proposal." />
        </div>
      )}

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
        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          {isClassification && (
            <Select
              aria-label="Approve as a different risk class"
              value={override}
              disabled={decide.isPending}
              onChange={(e) => setOverride(isRiskClass(e.target.value) ? e.target.value : '')}
              className="mr-auto h-9 w-auto max-w-full text-xs"
            >
              <option value="">Approve as… (keep the proposed class)</option>
              {RISK_CLASSES.filter((c) => c !== proposedClass).map((c) => (
                <option key={c} value={c}>
                  {riskClassLabel(c)}
                </option>
              ))}
            </Select>
          )}
          <Button
            icon={<X className="h-3.5 w-3.5" />}
            onClick={() => decide.mutate({ decision: 'reject' })}
            loading={rejecting}
            disabled={decide.isPending}
          >
            {isFindings ? 'Reject all' : 'Reject'}
          </Button>
          <Button
            variant="primary"
            icon={<Check className="h-3.5 w-3.5" />}
            onClick={() => decide.mutate({ decision: 'approve', override_class: isClassification && override ? override : undefined })}
            loading={approving}
            disabled={decide.isPending}
          >
            {isFindings ? 'Approve all' : isClassification && override ? `Approve as ${riskClassLabel(override)}` : 'Approve'}
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
