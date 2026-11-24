import { Fragment, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Save } from 'lucide-react';
import { api, errorMessage, isStatus, qk, type ImplementationStatus, type SoaInput, type SoaRow } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { IMPLEMENTATION_LABELS, IMPLEMENTATION_STATUSES } from '../../lib/grc';
import { ComplianceStatusBadge } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select, Switch, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';

function toInput(row: SoaRow): SoaInput {
  return {
    applicable: row.applicable,
    justification: row.justification ?? '',
    implementation_status: row.implementation_status,
    owner: row.owner ?? '',
    notes: row.notes ?? '',
  };
}

function sameInput(a: SoaInput, b: SoaInput): boolean {
  return (
    a.applicable === b.applicable &&
    a.justification === b.justification &&
    a.implementation_status === b.implementation_status &&
    a.owner === b.owner &&
    a.notes === b.notes
  );
}

interface SoaTableRowProps {
  workspaceId: string;
  row: SoaRow;
  onDirtyChange: (controlRef: string, dirty: boolean) => void;
}

function SoaTableRow({ workspaceId, row, onDirtyChange }: SoaTableRowProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<SoaInput>(() => toInput(row));
  const [touched, setTouched] = useState(false);
  const saved = toInput(row);
  const dirty = !sameInput(draft, saved);

  useEffect(() => {
    onDirtyChange(row.control_ref, dirty);
  }, [dirty, onDirtyChange, row.control_ref]);

  const save = useMutation({
    mutationFn: (body: SoaInput) => api.updateSoa(workspaceId, row.control_ref, body),
    onSuccess: (res) => {
      qc.setQueryData<SoaRow[]>(qk.soa(workspaceId), (old) => old?.map((r) => (r.control_ref === res.control_ref ? res : r)));
      setDraft(toInput(res));
      setTouched(false);
      void qc.invalidateQueries({ queryKey: qk.framework(workspaceId, 'iso-42001') });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(`${res.control_id} saved`);
    },
  });

  const set = <K extends keyof SoaInput>(key: K, value: SoaInput[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    if (save.isError) save.reset();
  };

  const missingJustification = !draft.applicable && !draft.justification.trim();
  const localError = touched && missingJustification ? 'A justification is required when a control is not applicable.' : null;
  const serverError = save.isError
    ? `${isStatus(save.error, 422) ? 'The server rejected the row (422)' : 'Could not save'}: ${errorMessage(save.error)}`
    : null;
  const error = localError ?? serverError;
  const docs = row.evidence_documents ?? [];

  const onSave = () => {
    setTouched(true);
    if (missingJustification) return;
    save.mutate({ ...draft, justification: draft.justification.trim(), owner: draft.owner.trim(), notes: draft.notes.trim() });
  };

  return (
    <>
      <tr className={dirty ? 'bg-amber-50/50 dark:bg-amber-500/5' : undefined}>
        <td className="td align-top">
          <div className="font-mono text-xs text-fg">{row.control_id}</div>
          <div className="mt-0.5 max-w-[220px] text-xs text-muted [overflow-wrap:anywhere]">{row.title}</div>
        </td>
        <td className="td align-top">
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={draft.applicable} onChange={(v) => set('applicable', v)} label={`${row.control_id} applicable`} />
            <span className="text-xs text-muted">{draft.applicable ? 'Yes' : 'No'}</span>
          </div>
        </td>
        <td className="td align-top">
          <Textarea
            rows={2}
            value={draft.justification}
            onChange={(e) => set('justification', e.target.value)}
            aria-label={`${row.control_id} justification`}
            aria-invalid={!!localError}
            placeholder={draft.applicable ? 'Why it applies (optional)' : 'Why it is excluded (required)'}
            className={`min-w-[180px] text-xs ${!draft.applicable && missingJustification ? 'border-amber-400' : ''}`}
          />
        </td>
        <td className="td align-top">
          <Select
            value={draft.implementation_status}
            onChange={(e) => set('implementation_status', e.target.value as ImplementationStatus)}
            aria-label={`${row.control_id} implementation status`}
            disabled={!draft.applicable}
            className="h-8 w-[130px] text-xs"
          >
            {IMPLEMENTATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {IMPLEMENTATION_LABELS[s]}
              </option>
            ))}
          </Select>
        </td>
        <td className="td align-top">
          <Input value={draft.owner} onChange={(e) => set('owner', e.target.value)} aria-label={`${row.control_id} owner`} placeholder="Owner" className="h-8 w-[120px] text-xs" />
        </td>
        <td className="td align-top">
          <Textarea rows={2} value={draft.notes} onChange={(e) => set('notes', e.target.value)} aria-label={`${row.control_id} notes`} placeholder="Notes" className="min-w-[150px] text-xs" />
        </td>
        <td className="td align-top">
          <div className="pt-1">
            <ComplianceStatusBadge status={row.status} />
          </div>
        </td>
        <td className="td align-top">
          {docs.length === 0 ? (
            <span className="text-xs text-muted">None</span>
          ) : (
            <ul className="max-w-[170px] space-y-0.5">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-1 text-xs text-fg" title={d.filename}>
                  <FileText className="h-3 w-3 shrink-0 text-indigo-500" aria-hidden />
                  <span className="truncate">{d.filename}</span>
                </li>
              ))}
            </ul>
          )}
        </td>
        <td className="td sticky right-0 bg-surface align-top">
          <div className="flex flex-col items-end gap-1">
            <Button size="sm" variant={dirty ? 'primary' : 'secondary'} icon={<Save className="h-3.5 w-3.5" />} disabled={!dirty} loading={save.isPending} onClick={onSave}>
              Save
            </Button>
            {dirty ? (
              <Badge tone="amber" withDot>
                Unsaved
              </Badge>
            ) : (
              row.updated_at && (
                <span className="whitespace-nowrap text-[11px] text-muted" title={`Last saved ${formatDateTime(row.updated_at)}${row.updated_by ? ` by ${row.updated_by}` : ''}`}>
                  Saved
                </span>
              )
            )}
          </div>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={9} className="border-b border-line bg-red-50 px-4 py-1.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">
            <span className="font-mono">{row.control_id}</span> — {error}
          </td>
        </tr>
      )}
    </>
  );
}

export function SoaSection({ workspaceId }: { workspaceId: string }) {
  const soa = useQuery({ queryKey: qk.soa(workspaceId), queryFn: () => api.listSoa(workspaceId) });
  const [dirtyRefs, setDirtyRefs] = useState<Set<string>>(new Set());

  // Stable identity: each row reports its own dirty state.
  const [onDirtyChange] = useState(
    () => (controlRef: string, dirty: boolean) =>
      setDirtyRefs((old) => {
        if (old.has(controlRef) === dirty) return old;
        const next = new Set(old);
        if (dirty) next.add(controlRef);
        else next.delete(controlRef);
        return next;
      }),
  );

  const rows = soa.data ?? [];
  const applicable = rows.filter((r) => r.applicable);
  const implemented = applicable.filter((r) => r.implementation_status === 'implemented').length;
  const inProgress = applicable.filter((r) => r.implementation_status === 'in_progress').length;

  const objectives: Array<{ id: string; title: string | null; rows: SoaRow[] }> = [];
  for (const r of rows) {
    let g = objectives.find((o) => o.id === r.objective);
    if (!g) {
      g = { id: r.objective, title: r.objective_title, rows: [] };
      objectives.push(g);
    }
    g.rows.push(r);
  }

  return (
    <Card>
      <CardHeader
        title="Statement of Applicability"
        description="The Annex A controls: whether each one applies, why, and how far it is implemented. Each row is saved on its own."
        actions={
          dirtyRefs.size > 0 ? (
            <Badge tone="amber" withDot>
              {dirtyRefs.size} unsaved row{dirtyRefs.size === 1 ? '' : 's'}
            </Badge>
          ) : undefined
        }
      />
      {soa.isLoading ? (
        <SkeletonRows rows={8} />
      ) : soa.isError ? (
        <ErrorState error={soa.error} title="Could not load the Statement of Applicability" onRetry={() => void soa.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No controls" description="The server returned no Annex A control." />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-px border-b border-line bg-line sm:grid-cols-5">
            {[
              { label: 'Controls', value: rows.length },
              { label: 'Applicable', value: applicable.length },
              { label: 'Excluded', value: rows.length - applicable.length },
              { label: 'Implemented', value: implemented },
              { label: 'In progress', value: inProgress },
            ].map((x) => (
              <div key={x.label} className="bg-surface px-4 py-2.5">
                <dt className="text-xs text-muted">{x.label}</dt>
                <dd className="text-lg font-semibold tabular-nums text-fg">{x.value}</dd>
              </div>
            ))}
          </dl>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Control</th>
                  <th className="th">Applicable</th>
                  <th className="th">Justification</th>
                  <th className="th">Implementation</th>
                  <th className="th">Owner</th>
                  <th className="th">Notes</th>
                  <th className="th">Status</th>
                  <th className="th">Evidence</th>
                  <th className="th sticky right-0 bg-surface text-right">Save</th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((o) => (
                  <Fragment key={o.id}>
                    <tr>
                      <td colSpan={9} className="border-b border-line bg-surface2/60 px-4 py-1.5 text-xs font-semibold text-fg">
                        <span className="font-mono">{o.id}</span>
                        {o.title ? <span className="ml-2">{o.title}</span> : null}
                        <span className="ml-2 font-normal tabular-nums text-muted">
                          {o.rows.filter((r) => r.applicable).length} of {o.rows.length} applicable
                        </span>
                      </td>
                    </tr>
                    {o.rows.map((r) => (
                      <SoaTableRow key={r.control_ref} workspaceId={workspaceId} row={r} onDirtyChange={onDirtyChange} />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
