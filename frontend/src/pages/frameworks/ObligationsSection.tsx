import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ListChecks, Scale } from 'lucide-react';
import { api, isStatus, qk } from '../../lib/api';
import { ORG_ROLE_LABELS } from '../../lib/grc';
import { ComplianceStatusBadge, ReviewBadge, RiskClassBadge } from '../../components/grc';
import { RequirementPanel } from '../../components/RequirementDetail';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { SystemPicker, SystemsState, useSystems } from './SystemPicker';

interface ObligationsSectionProps {
  workspaceId: string;
  systemId: string;
  onSystemChange: (id: string) => void;
  /** Jump to the classification wizard for this system. */
  onClassify: (systemId: string) => void;
}

export function ObligationsSection({ workspaceId, systemId, onSystemChange, onClassify }: ObligationsSectionProps) {
  const systems = useSystems(workspaceId);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const list = systems.data ?? [];
  const system = list.find((s) => s.id === systemId) ?? null;

  const obligations = useQuery({
    queryKey: qk.obligations(workspaceId, system?.id ?? ''),
    queryFn: () => api.systemObligations(workspaceId, system!.id),
    enabled: !!system,
    // 409 = the system has no approved class: that is guidance, not a failure to retry.
    retry: (count, err) => !isStatus(err, 409) && !isStatus(err, 404) && count < 2,
  });

  const data = obligations.data;
  const rows = data?.obligations ?? [];
  const statusByRef = new Map(rows.map((o) => [o.ref, o.status]));

  return (
    <Card>
      <CardHeader title="Obligations by system" description="The EU AI Act obligations that apply to one system, given its approved risk class and your organisation's role." />
      <div className="border-b border-line px-4 py-3">
        <div className="max-w-md">
          <Field label="System" htmlFor="obligations-system">
            <SystemPicker id="obligations-system" systems={list} value={system ? system.id : ''} onChange={onSystemChange} withClass disabled={list.length === 0} />
          </Field>
        </div>
      </div>

      {systems.isLoading || systems.isError || list.length === 0 ? (
        <SystemsState query={systems} />
      ) : !system ? (
        <EmptyState compact icon={<ListChecks className="h-4 w-4" />} title="Choose a system" description="Its obligations are listed as a checklist, with the status of each one." />
      ) : obligations.isLoading ? (
        <SkeletonRows rows={5} />
      ) : isStatus(obligations.error, 409) ? (
        <div className="p-4">
          <Notice tone="warning">
            <div className="flex items-start gap-2">
              <Scale className="mt-px h-4 w-4 shrink-0" />
              <div>
                <p>
                  <span className="font-medium">{system.name} has no approved risk class yet.</span> The obligations depend on the class, so classify the system first
                  {system.risk_class && system.risk_class_status === 'proposed' ? ' — a class has been proposed and is waiting for your approval' : ''}.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="primary" onClick={() => onClassify(system.id)}>
                    Open the classification wizard
                  </Button>
                  <Link
                    to={`/inventory/${encodeURIComponent(system.id)}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-xs font-medium text-fg shadow-sm hover:bg-surface2"
                  >
                    Open the system page <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </Notice>
        </div>
      ) : obligations.isError || !data ? (
        <ErrorState compact error={obligations.error} title="Could not load the obligations" onRetry={() => void obligations.refetch()} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line px-4 py-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted">Approved class</span>
              <RiskClassBadge value={data.risk_class} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted">Role</span>
              <span className="font-medium text-fg">{data.org_role ? (ORG_ROLE_LABELS[data.org_role] ?? data.org_role) : '—'}</span>
            </div>
            <span className="tabular-nums text-muted">
              {rows.length} obligation{rows.length === 1 ? '' : 's'}
            </span>
          </div>
          {data.basis_note && <p className="border-b border-line px-4 py-2.5 text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">{data.basis_note}</p>}
          {rows.length === 0 ? (
            <EmptyState compact title="No obligations apply" description="For this class and role the knowledge base lists no specific obligation." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="th">Ref</th>
                    <th className="th">Title</th>
                    <th className="th">Status</th>
                    <th className="th">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.ref} onClick={() => setOpenRef(o.ref)} className="cursor-pointer hover:bg-surface2/60 [&:last-child>td]:border-b-0">
                      <td className="td whitespace-nowrap">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenRef(o.ref); }} className="font-mono text-xs text-fg hover:text-accent-text" aria-label={`Open ${o.ref}`}>
                          {o.ref}
                        </button>
                      </td>
                      <td className="td text-fg [overflow-wrap:anywhere]">{o.title}</td>
                      <td className="td">
                        <ComplianceStatusBadge status={o.status} />
                      </td>
                      <td className="td">
                        {o.review_status ? (
                          o.finding_id ? (
                            <Link
                              to={`/inventory/${encodeURIComponent(system.id)}?framework=eu-ai-act#findings`}
                              onClick={(e) => e.stopPropagation()}
                              title="Open the finding on the system page"
                              className="inline-flex items-center gap-1 hover:opacity-80"
                            >
                              <ReviewBadge status={o.review_status} />
                              <ArrowRight className="h-3 w-3 text-muted" />
                            </Link>
                          ) : (
                            <ReviewBadge status={o.review_status} />
                          )
                        ) : (
                          <span className="text-xs text-muted">No finding yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <RequirementPanel requirementRef={openRef} onClose={() => setOpenRef(null)} statusOf={(ref) => statusByRef.get(ref)} />
    </Card>
  );
}
