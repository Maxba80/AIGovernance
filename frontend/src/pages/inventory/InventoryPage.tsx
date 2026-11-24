import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Boxes, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage, isRunActive, qk, type AiSystem, type SystemKind, type Workspace } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { LIFECYCLE_LABELS, LIFECYCLE_TONES, ORG_ROLE_LABELS } from '../../lib/grc';
import { RiskClassBadge, RunStatusBadge } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { Tabs } from '../../components/ui/Tabs';
import { useToast } from '../../components/ui/Toast';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { SystemFormPanel } from './SystemFormPanel';

const KIND_NOUN: Record<SystemKind, string> = { system: 'system', agent: 'agent' };

function OpenFindings({ system }: { system: AiSystem }) {
  const gap = system.open_findings?.gap ?? 0;
  const partial = system.open_findings?.partial ?? 0;
  if (gap === 0 && partial === 0) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {gap > 0 && (
        <Badge tone="red" withDot title={`${gap} open gap${gap === 1 ? '' : 's'}`}>
          {gap} gap{gap === 1 ? '' : 's'}
        </Badge>
      )}
      {partial > 0 && (
        <Badge tone="amber" withDot title={`${partial} partially met requirement${partial === 1 ? '' : 's'}`}>
          {partial} partial
        </Badge>
      )}
    </div>
  );
}

function InventoryContent({ workspace }: { workspace: Workspace }) {
  const wid = workspace.id;
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: SystemKind = params.get('tab') === 'agents' ? 'agent' : 'system';
  const setTab = (k: SystemKind) => setParams(k === 'agent' ? { tab: 'agents' } : {}, { replace: true });

  const [form, setForm] = useState<{ open: boolean; system: AiSystem | null }>({ open: false, system: null });
  const [toDelete, setToDelete] = useState<AiSystem | null>(null);

  const systems = useQuery({
    queryKey: qk.systems(wid),
    queryFn: () => api.listSystems(wid),
    // Keep "last run" fresh while an assessment is moving.
    refetchInterval: (q) => (q.state.data?.some((s) => isRunActive(s.last_run?.status)) ? 4000 : false),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteSystem(wid, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.systems(wid) });
      void qc.invalidateQueries({ queryKey: qk.approvals(wid) });
      void qc.invalidateQueries({ queryKey: qk.runsAll(wid) });
      void qc.invalidateQueries({ queryKey: qk.compliance(wid) });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success('Removed from the inventory');
      setToDelete(null);
    },
  });

  const all = systems.data ?? [];
  const nSystems = all.filter((s) => s.kind !== 'agent').length;
  const nAgents = all.filter((s) => s.kind === 'agent').length;
  const rows = all.filter((s) => (tab === 'agent' ? s.kind === 'agent' : s.kind !== 'agent')).sort((a, b) => a.name.localeCompare(b.name));
  const noun = KIND_NOUN[tab];

  const newButton = (
    <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setForm({ open: true, system: null })}>
      New {noun}
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <Tabs<SystemKind>
            tabs={[
              { id: 'system', label: systems.data ? `AI systems (${nSystems})` : 'AI systems' },
              { id: 'agent', label: systems.data ? `Agents (${nAgents})` : 'Agents' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div className="pb-1.5">{newButton}</div>
      </div>

      <Card className="mt-5">
        {systems.isLoading ? (
          <SkeletonRows rows={5} />
        ) : systems.isError ? (
          <ErrorState error={systems.error} title="Could not load the inventory" onRetry={() => void systems.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={tab === 'agent' ? <Bot className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
            title={tab === 'agent' ? 'No agents registered yet' : 'No AI systems registered yet'}
            description={
              tab === 'agent'
                ? 'Register each AI agent with its Agent Card: tools, data sources, guardrails, autonomy and oversight. Then run an assessment against the EU AI Act, GDPR, ISO/IEC 42001 and the NIST AI RMF.'
                : 'Register the AI systems and use cases in scope, then run an assessment against the EU AI Act, GDPR, ISO/IEC 42001 and the NIST AI RMF.'
            }
            action={newButton}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Org role</th>
                  <th className="th">Lifecycle</th>
                  <th className="th">Risk class</th>
                  <th className="th">Open findings</th>
                  <th className="th">Last run</th>
                  <th className="th">Updated</th>
                  <th className="th sticky right-0 bg-surface text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/inventory/${encodeURIComponent(s.id)}`)}
                    className="cursor-pointer hover:bg-surface2/60 [&:last-child>td]:border-b-0"
                  >
                    <td className="td max-w-[260px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inventory/${encodeURIComponent(s.id)}`);
                        }}
                        className="block max-w-full truncate text-left font-medium text-fg hover:text-accent-text"
                        title={s.name}
                      >
                        {s.name}
                      </button>
                      {s.business_owner && <div className="truncate text-xs text-muted">{s.business_owner}</div>}
                    </td>
                    <td className="td whitespace-nowrap text-muted">{s.org_role ? (ORG_ROLE_LABELS[s.org_role] ?? s.org_role) : '—'}</td>
                    <td className="td">
                      {s.lifecycle ? (
                        <Badge tone={LIFECYCLE_TONES[s.lifecycle] ?? 'grey'}>{LIFECYCLE_LABELS[s.lifecycle] ?? s.lifecycle}</Badge>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="td">
                      <RiskClassBadge value={s.risk_class} status={s.risk_class_status} />
                    </td>
                    <td className="td">
                      <OpenFindings system={s} />
                    </td>
                    <td className="td">
                      {s.last_run ? (
                        <div>
                          <RunStatusBadge status={s.last_run.status} />
                          <div className="mt-0.5 whitespace-nowrap text-xs text-muted">{formatDate(s.last_run.created_at)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Never assessed</span>
                      )}
                    </td>
                    <td className="td whitespace-nowrap text-muted">{formatDate(s.updated_at)}</td>
                    <td className="td sticky right-0 bg-surface" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${s.name}`} title="Edit" onClick={() => setForm({ open: true, system: s })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${s.name}`}
                          title="Delete"
                          className="hover:!text-red-600"
                          onClick={() => {
                            remove.reset();
                            setToDelete(s);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SystemFormPanel
        workspaceId={wid}
        open={form.open}
        kind={tab}
        system={form.system}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title={toDelete?.kind === 'agent' ? 'Delete agent' : 'Delete AI system'}
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        message={
          <>
            Delete <span className="font-medium">{toDelete?.name}</span>? This cannot be undone. Linked documents stay
            in the workspace. The deletion is recorded in the audit trail.
          </>
        }
      />
    </>
  );
}

export function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="The AI systems and agents in scope, with their owners, purpose and risk classification. Open one to run an assessment."
      />
      <WorkspaceGate>{(workspace) => <InventoryContent key={workspace.id} workspace={workspace} />}</WorkspaceGate>
    </>
  );
}
