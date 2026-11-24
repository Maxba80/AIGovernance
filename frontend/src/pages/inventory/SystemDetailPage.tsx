import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bot, Boxes, Pencil, Play, Scale } from 'lucide-react';
import { api, errorMessage, isRunActive, isStatus, qk, type AssessmentRun, type Workspace } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { RUN_STATUS_LABELS } from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { RiskClassBadge } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { FindingsSection } from './FindingsSection';
import { ClassificationSection, GdprSection, NistSection } from './ResultSections';
import { RisksSection } from './RisksSection';
import { RunSection } from './RunSection';
import { SystemFormPanel } from './SystemFormPanel';
import { AgentCardPanel, ClassifyDialog, ProfilePanel } from './SystemPanels';

function BackLink() {
  return (
    <Link to="/inventory" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
      <ArrowLeft className="h-3.5 w-3.5" /> Inventory
    </Link>
  );
}

/** Changes whenever the run moves, so dependent data can be refreshed at each step. */
function runSignature(run: AssessmentRun | undefined): string {
  if (!run) return '';
  return `${run.id}:${run.status}:${run.steps.map((s) => s.status).join(',')}`;
}

function SystemDetail({ workspace, systemId }: { workspace: Workspace; systemId: string }) {
  const wid = workspace.id;
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(wid);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);

  const system = useQuery({
    queryKey: qk.system(wid, systemId),
    queryFn: () => api.getSystem(wid, systemId),
    retry: (count, err) => !isStatus(err, 404) && count < 2,
  });

  const runs = useQuery({
    queryKey: qk.runs(wid, systemId),
    queryFn: () => api.listRuns(wid, { system_id: systemId }),
    // Contract: poll every 2 s while any run is queued / running. While a run waits for approval we
    // poll more slowly, so a decision taken elsewhere (or just now) is picked up without a reload.
    refetchInterval: (q) => {
      const data = q.state.data ?? [];
      if (data.some((r) => r.status === 'queued' || r.status === 'running')) return 2000;
      if (data.some((r) => r.status === 'waiting_approval')) return 4000;
      return false;
    },
  });

  const list = runs.data ?? [];
  const latest = list[0] ?? null;
  const run = (selectedRunId ? list.find((r) => r.id === selectedRunId) : null) ?? latest;
  const viewingLatest = run != null && latest != null && run.id === latest.id;
  const activeRun = list.find((r) => isRunActive(r.status)) ?? null;
  const viewedActive = run != null && isRunActive(run.status);

  const approvals = useQuery({
    queryKey: qk.approvals(wid),
    queryFn: () => api.listApprovals(wid, 'pending'),
    enabled: list.some((r) => r.status === 'waiting_approval'),
  });

  // Each time the latest run moves a step, refresh what that step may have produced.
  const signature = runSignature(latest ?? undefined);
  const lastSignature = useRef<string | null>(null);
  useEffect(() => {
    if (!runs.data) return;
    if (lastSignature.current !== null && lastSignature.current !== signature) {
      invalidate();
      void qc.invalidateQueries({ queryKey: qk.system(wid, systemId) });
    }
    lastSignature.current = signature;
  }, [signature, runs.data, invalidate, qc, wid, systemId]);

  const assess = useMutation({
    mutationFn: () => api.assessSystem(wid, systemId),
    onSuccess: (created) => {
      qc.setQueryData<AssessmentRun[]>(qk.runs(wid, systemId), (old) => [created, ...(old ?? []).filter((r) => r.id !== created.id)]);
      setSelectedRunId(null);
      void qc.invalidateQueries({ queryKey: qk.runsAll(wid) });
      void qc.invalidateQueries({ queryKey: qk.systems(wid) });
      toast.success('Assessment started');
    },
    // A 409 usually means a run started elsewhere: refresh so the page shows it.
    onError: () => void qc.invalidateQueries({ queryKey: qk.runsAll(wid) }),
  });

  if (system.isLoading) {
    return (
      <>
        <BackLink />
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      </>
    );
  }
  if (system.isError || !system.data) {
    const missing = isStatus(system.error, 404);
    return (
      <>
        <BackLink />
        <Card>
          {missing ? (
            <EmptyState
              icon={<Boxes className="h-4 w-4" />}
              title="This entry was not found"
              description={`It may have been deleted, or it belongs to another workspace than ${workspace.name}.`}
              action={
                <Link to="/inventory" className="text-sm font-medium text-accent-text hover:underline">
                  Back to the inventory
                </Link>
              }
            />
          ) : (
            <ErrorState error={system.error} title="Could not load this entry" onRetry={() => void system.refetch()} />
          )}
        </Card>
      </>
    );
  }

  const s = system.data;
  const isAgent = s.kind === 'agent';
  const stepModel = (key: string) => run?.steps.find((st) => st.key === key)?.model ?? null;
  const runDisabledReason = activeRun
    ? activeRun.status === 'waiting_approval'
      ? 'A run is waiting for your decision on the risk class. Decide it below before starting another run.'
      : `A run is already ${RUN_STATUS_LABELS[activeRun.status].toLowerCase()} for this entry. Wait for it to finish before starting another.`
    : null;

  return (
    <div>
      <BackLink />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-fg [overflow-wrap:anywhere]">{s.name}</h1>
            <Badge tone="indigo">
              {isAgent ? <Bot className="h-3 w-3" /> : <Boxes className="h-3 w-3" />}
              {isAgent ? 'Agent' : 'AI system'}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <RiskClassBadge value={s.risk_class} status={s.risk_class_status} />
            {s.risk_class && s.risk_class_status === 'approved' && <span>Approved by a human</span>}
            {s.risk_class && s.risk_class_status === 'proposed' && <span>Proposed by the classifier — awaiting approval</span>}
            <span aria-hidden>·</span>
            <span>Updated {formatDateTime(s.updated_at)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button icon={<Scale className="h-3.5 w-3.5" />} onClick={() => setClassifyOpen(true)}>
              Classify manually
            </Button>
            <Button
              variant="primary"
              icon={<Play className="h-3.5 w-3.5" />}
              disabled={activeRun !== null || runs.isLoading}
              loading={assess.isPending}
              title={runDisabledReason ?? undefined}
              onClick={() => assess.mutate()}
            >
              Run assessment
            </Button>
          </div>
          {runDisabledReason && <p className="max-w-sm text-right text-xs text-muted">{runDisabledReason}</p>}
        </div>
      </div>

      <div className="space-y-5">
        {assess.isError && (
          <Notice tone="error">
            <span className="font-medium">The assessment could not be started.</span> {errorMessage(assess.error)}
            {isStatus(assess.error, 409) && /model/i.test(errorMessage(assess.error)) && (
              <>
                {' '}
                <Link to="/settings#routing" className="font-medium underline">
                  Open model routing
                </Link>
              </>
            )}
          </Notice>
        )}

        <RunSection workspaceId={wid} runs={runs} run={run} onSelectRun={(id) => setSelectedRunId(id === latest?.id ? null : id)} approvals={approvals} />

        <div className={isAgent ? 'grid grid-cols-1 gap-5 xl:grid-cols-2' : undefined}>
          <ProfilePanel workspaceId={wid} system={s} />
          {isAgent && <AgentCardPanel system={s} />}
        </div>

        <ClassificationSection
          system={s}
          classification={run?.result?.classification}
          model={stepModel('eu_ai_act_classification')}
          active={viewedActive}
          hasRun={run != null}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GdprSection result={run?.result?.gdpr} model={stepModel('gdpr')} active={viewedActive} hasRun={run != null} />
          <NistSection result={run?.result?.nist} model={stepModel('nist')} active={viewedActive} hasRun={run != null} />
        </div>

        <FindingsSection workspaceId={wid} systemId={systemId} runId={viewingLatest || !run ? null : run.id} active={viewedActive} />
        <RisksSection workspaceId={wid} systemId={systemId} runId={run?.id ?? null} active={viewedActive} />
      </div>

      <SystemFormPanel workspaceId={wid} open={editOpen} kind={s.kind} system={s} onClose={() => setEditOpen(false)} />
      <ClassifyDialog workspaceId={wid} system={s} open={classifyOpen} onClose={() => setClassifyOpen(false)} />
    </div>
  );
}

export function SystemDetailPage() {
  const { id = '' } = useParams();
  return <WorkspaceGate>{(workspace) => <SystemDetail key={`${workspace.id}:${id}`} workspace={workspace} systemId={id} />}</WorkspaceGate>;
}
