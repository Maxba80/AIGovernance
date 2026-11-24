import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  api,
  errorMessage,
  isStatus,
  qk,
  type AiSystem,
  type KbRequirement,
  type NcGrade,
  type NcStatus,
  type Nonconformity,
  type NonconformityCreate,
  type NonconformityUpdate,
} from '../../lib/api';
import { cn, formatDate, formatDateTime } from '../../lib/format';
import { NC_GRADES, NC_GRADE_LABELS, NC_GRADE_TONES, NC_STATUSES, NC_STATUS_LABELS, NC_STATUS_TONES } from '../../lib/grc';
import { RefChip } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Input, Select, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { ConfirmDialog, Dialog, SlideOver } from '../../components/ui/Overlay';
import { Segmented } from '../../components/ui/Segmented';
import { useToast } from '../../components/ui/Toast';
import { SystemPicker, useSystems } from './SystemPicker';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Past its due date and not yet verified or closed. */
function isOverdue(nc: Nonconformity): boolean {
  return !!nc.due_date && nc.due_date.slice(0, 10) < todayIso() && nc.status !== 'closed' && nc.status !== 'verified';
}

function useInvalidateNc(workspaceId: string): () => void {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: qk.nonconformitiesAll(workspaceId) });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  };
}

function useIsoRequirements() {
  return useQuery({ queryKey: qk.kbRequirements('iso-42001'), queryFn: () => api.kbRequirements('iso-42001'), staleTime: 5 * 60_000 });
}

function RequirementSelect({ id, value, onChange, options, loading }: { id: string; value: string; onChange: (ref: string) => void; options: KbRequirement[]; loading: boolean }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={loading}>
      <option value="" disabled>
        {loading ? 'Loading requirements…' : 'Choose a clause or control…'}
      </option>
      {/* Keep a stored reference selectable even if the knowledge base no longer lists it. */}
      {value && !options.some((o) => o.ref === value) && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.ref} value={o.ref}>
          {o.ref} — {o.title}
        </option>
      ))}
    </Select>
  );
}

// ---------- Create ----------

interface CreateFormProps {
  workspaceId: string;
  systems: AiSystem[];
  onClose: () => void;
}

function CreateForm({ workspaceId, systems, onClose }: CreateFormProps) {
  const toast = useToast();
  const invalidate = useInvalidateNc(workspaceId);
  const requirements = useIsoRequirements();
  const [requirementRef, setRequirementRef] = useState('');
  const [grade, setGrade] = useState<NcGrade>('minor');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemId, setSystemId] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [touched, setTouched] = useState(false);

  const create = useMutation({
    mutationFn: (body: NonconformityCreate) => api.createNonconformity(workspaceId, body),
    onSuccess: () => {
      invalidate();
      toast.success('Nonconformity recorded');
      onClose();
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!requirementRef || !title.trim()) return;
    create.mutate({
      requirement_ref: requirementRef,
      title: title.trim(),
      grade,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(systemId ? { system_id: systemId } : {}),
      ...(owner.trim() ? { owner: owner.trim() } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <Field label="Requirement" htmlFor="nc-new-req" error={touched && !requirementRef ? 'Choose the clause or control that is not met.' : null}>
        <RequirementSelect id="nc-new-req" value={requirementRef} onChange={setRequirementRef} options={requirements.data ?? []} loading={requirements.isLoading} />
      </Field>
      {requirements.isError && <Notice tone="error">Could not load the ISO/IEC 42001 requirements: {errorMessage(requirements.error)}</Notice>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Grade" htmlFor="nc-new-grade">
          <Select id="nc-new-grade" value={grade} onChange={(e) => setGrade(e.target.value as NcGrade)}>
            {NC_GRADES.map((g) => (
              <option key={g} value={g}>
                {NC_GRADE_LABELS[g]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="nc-new-due">
          <Input id="nc-new-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Title" htmlFor="nc-new-title" error={touched && !title.trim() ? 'Give the nonconformity a short title.' : null}>
        <Input id="nc-new-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. No documented AI impact assessment process" />
      </Field>
      <Field label="Description" htmlFor="nc-new-desc">
        <Textarea id="nc-new-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was observed, and the objective evidence" />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="System (optional)" htmlFor="nc-new-system">
          <SystemPicker id="nc-new-system" systems={systems} value={systemId} onChange={setSystemId} placeholder="Not tied to one system" />
        </Field>
        <Field label="Owner" htmlFor="nc-new-owner">
          <Input id="nc-new-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who is responsible" />
        </Field>
      </div>
      {create.isError && <Notice tone="error">Could not record the nonconformity: {errorMessage(create.error)}</Notice>}
      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onClose} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={create.isPending}>
          Record nonconformity
        </Button>
      </div>
    </form>
  );
}

// ---------- Edit ----------

interface EditFormProps {
  workspaceId: string;
  nc: Nonconformity;
  systems: AiSystem[];
  onClose: () => void;
}

function EditForm({ workspaceId, nc, systems, onClose }: EditFormProps) {
  const toast = useToast();
  const invalidate = useInvalidateNc(workspaceId);
  const requirements = useIsoRequirements();
  const [form, setForm] = useState({
    requirement_ref: nc.requirement_ref,
    title: nc.title,
    grade: nc.grade,
    description: nc.description ?? '',
    system_id: nc.system_id ?? '',
    owner: nc.owner ?? '',
    due_date: nc.due_date ? nc.due_date.slice(0, 10) : '',
    root_cause: nc.root_cause ?? '',
    correction: nc.correction ?? '',
    corrective_action: nc.corrective_action ?? '',
    status: nc.status,
  });
  const [touched, setTouched] = useState(false);

  const update = useMutation({
    mutationFn: (body: NonconformityUpdate) => api.updateNonconformity(workspaceId, nc.id, body),
    onSuccess: (res) => {
      invalidate();
      toast.success(res.status === nc.status ? 'Nonconformity saved' : `Status set to ${NC_STATUS_LABELS[res.status] ?? res.status}`);
      onClose();
    },
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (update.isError) update.reset();
  };

  const closingWithoutAction = form.status === 'closed' && !form.corrective_action.trim();
  const titleError = touched && !form.title.trim() ? 'A title is required.' : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!form.title.trim()) return;
    // The closing rule is enforced by the server (422); the warning above the buttons explains it beforehand.
    update.mutate({
      requirement_ref: form.requirement_ref,
      title: form.title.trim(),
      grade: form.grade,
      description: form.description.trim() || null,
      system_id: form.system_id || null,
      owner: form.owner.trim() || null,
      due_date: form.due_date || null,
      root_cause: form.root_cause.trim() || null,
      correction: form.correction.trim() || null,
      corrective_action: form.corrective_action.trim() || null,
      status: form.status,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 px-5 py-4" noValidate>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone={NC_STATUS_TONES[nc.status] ?? 'grey'} withDot>
          {NC_STATUS_LABELS[nc.status] ?? nc.status}
        </Badge>
        <span>Recorded {formatDateTime(nc.created_at)}</span>
        {nc.verified_by && <span>· Verified by {nc.verified_by}</span>}
        {nc.closed_at && <span>· Closed {formatDateTime(nc.closed_at)}</span>}
        {nc.finding_id && <span>· Raised from a finding</span>}
      </div>

      <Field label="Title" htmlFor="nc-title" error={titleError}>
        <Input id="nc-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Requirement" htmlFor="nc-req" hint={nc.requirement_title ?? undefined}>
        <RequirementSelect id="nc-req" value={form.requirement_ref} onChange={(v) => set('requirement_ref', v)} options={requirements.data ?? []} loading={requirements.isLoading} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Grade" htmlFor="nc-grade">
          <Select id="nc-grade" value={form.grade} onChange={(e) => set('grade', e.target.value as NcGrade)}>
            {NC_GRADES.map((g) => (
              <option key={g} value={g}>
                {NC_GRADE_LABELS[g]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="nc-due">
          <Input id="nc-due" type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
        </Field>
        <Field label="System" htmlFor="nc-system">
          <SystemPicker id="nc-system" systems={systems} value={form.system_id} onChange={(v) => set('system_id', v)} placeholder="Not tied to one system" />
        </Field>
        <Field label="Owner" htmlFor="nc-owner">
          <Input id="nc-owner" value={form.owner} onChange={(e) => set('owner', e.target.value)} />
        </Field>
      </div>
      <Field label="Description" htmlFor="nc-desc">
        <Textarea id="nc-desc" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>

      <div className="space-y-3 border-t border-line pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Corrective and preventive action</h3>
        <Field label="Root cause" htmlFor="nc-root" hint="Why the nonconformity occurred.">
          <Textarea id="nc-root" rows={3} value={form.root_cause} onChange={(e) => set('root_cause', e.target.value)} />
        </Field>
        <Field label="Correction" htmlFor="nc-correction" hint="The immediate fix of what was found.">
          <Textarea id="nc-correction" rows={3} value={form.correction} onChange={(e) => set('correction', e.target.value)} />
        </Field>
        <Field label="Corrective action" htmlFor="nc-ca" hint="What removes the cause so that it does not recur. Required before closing.">
          <Textarea
            id="nc-ca"
            rows={3}
            value={form.corrective_action}
            onChange={(e) => set('corrective_action', e.target.value)}
            className={closingWithoutAction ? 'border-amber-400' : undefined}
          />
        </Field>
      </div>

      <div className="border-t border-line pt-4">
        <div className="mb-1 text-xs font-medium text-fg">Status</div>
        <Segmented<NcStatus>
          label="Status"
          value={form.status}
          onChange={(s) => set('status', s)}
          options={NC_STATUSES.map((s) => ({ id: s, label: NC_STATUS_LABELS[s] }))}
        />
        <p className="mt-1.5 text-xs text-muted">Setting “Verified” or “Closed” records you as the verifier.</p>
        {closingWithoutAction && !update.isError && (
          <Notice tone="warning" className="mt-2">
            A nonconformity can only be closed once its corrective action is described. Fill in “Corrective action” above first.
          </Notice>
        )}
      </div>

      {update.isError && (
        <Notice tone="error">
          <span className="font-medium">{isStatus(update.error, 422) ? 'The server rejected the change (422).' : 'Could not save.'}</span> {errorMessage(update.error)}
        </Notice>
      )}

      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <Button onClick={onClose} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={update.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}

// ---------- Section ----------

type StatusFilter = NcStatus | 'all';

export function NonconformitiesSection({ workspaceId }: { workspaceId: string }) {
  const toast = useToast();
  const invalidate = useInvalidateNc(workspaceId);
  const systems = useSystems(workspaceId);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Nonconformity | null>(null);
  const [toDelete, setToDelete] = useState<Nonconformity | null>(null);

  const list = useQuery({
    queryKey: qk.nonconformities(workspaceId, filter === 'all' ? null : filter),
    queryFn: () => api.listNonconformities(workspaceId, filter === 'all' ? undefined : filter),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteNonconformity(workspaceId, id),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast.success('Nonconformity deleted');
    },
  });

  const rows = [...(list.data ?? [])].sort((a, b) => {
    const od = Number(isOverdue(b)) - Number(isOverdue(a));
    if (od !== 0) return od;
    return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || b.created_at.localeCompare(a.created_at);
  });
  const overdue = rows.filter(isOverdue).length;

  const newButton = (
    <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>
      New nonconformity
    </Button>
  );

  return (
    <Card>
      <CardHeader
        title="Nonconformities & CAPA"
        description="Requirements that are not met, with their root cause, correction and corrective action (clause 10.2)."
        actions={newButton}
      />
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <Segmented<StatusFilter>
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={[{ id: 'all', label: 'All' }, ...NC_STATUSES.map((s) => ({ id: s as StatusFilter, label: NC_STATUS_LABELS[s] }))]}
        />
        {overdue > 0 && (
          <Badge tone="red" withDot>
            {overdue} overdue
          </Badge>
        )}
      </div>

      {list.isLoading ? (
        <SkeletonRows rows={4} />
      ) : list.isError ? (
        <ErrorState error={list.error} title="Could not load the nonconformities" onRetry={() => void list.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-4 w-4" />}
          title={filter === 'all' ? 'No nonconformities recorded' : `No nonconformity is ${NC_STATUS_LABELS[filter].toLowerCase()}`}
          description={
            filter === 'all'
              ? 'Record a nonconformity when a clause or control of ISO/IEC 42001 is not met, then track its corrective action to closure.'
              : 'Choose another status, or “All”.'
          }
          action={filter === 'all' ? newButton : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">Grade</th>
                <th className="th">Requirement</th>
                <th className="th">Title</th>
                <th className="th">System</th>
                <th className="th">Owner</th>
                <th className="th">Due</th>
                <th className="th">Status</th>
                <th className="th sticky right-0 bg-surface text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((nc) => {
                const late = isOverdue(nc);
                return (
                  <tr key={nc.id} onClick={() => setEditing(nc)} className="cursor-pointer hover:bg-surface2/60 [&:last-child>td]:border-b-0">
                    <td className="td">
                      <Badge tone={NC_GRADE_TONES[nc.grade] ?? 'grey'}>{NC_GRADE_LABELS[nc.grade] ?? nc.grade}</Badge>
                    </td>
                    <td className="td">
                      <RefChip title={nc.requirement_title ?? undefined}>{nc.requirement_ref}</RefChip>
                    </td>
                    <td className="td min-w-[200px] font-medium text-fg [overflow-wrap:anywhere]">{nc.title}</td>
                    <td className="td max-w-[160px] truncate text-muted" title={nc.system_name ?? undefined}>
                      {nc.system_name ?? '—'}
                    </td>
                    <td className="td max-w-[140px] truncate text-muted" title={nc.owner ?? undefined}>
                      {nc.owner ?? '—'}
                    </td>
                    <td className={cn('td whitespace-nowrap', late ? 'font-medium text-red-600 dark:text-red-400' : 'text-muted')}>
                      {nc.due_date ? formatDate(nc.due_date) : '—'}
                      {late && <div className="text-[11px] font-semibold uppercase tracking-wide">Overdue</div>}
                    </td>
                    <td className="td">
                      <Badge tone={NC_STATUS_TONES[nc.status] ?? 'grey'} withDot>
                        {NC_STATUS_LABELS[nc.status] ?? nc.status}
                      </Badge>
                    </td>
                    <td className="td sticky right-0 bg-surface" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" aria-label={`Edit ${nc.title}`} title="Edit" onClick={() => setEditing(nc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${nc.title}`}
                          title="Delete"
                          className="hover:!text-red-600"
                          onClick={() => {
                            remove.reset();
                            setToDelete(nc);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New nonconformity" description="Record a clause or control of ISO/IEC 42001 that is not met.">
        {createOpen && <CreateForm workspaceId={workspaceId} systems={systems.data ?? []} onClose={() => setCreateOpen(false)} />}
      </Dialog>

      <SlideOver
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.title ?? ''}
        subtitle={editing ? <span className="font-mono">{editing.requirement_ref}</span> : undefined}
      >
        {editing && <EditForm key={editing.id} workspaceId={workspaceId} nc={editing} systems={systems.data ?? []} onClose={() => setEditing(null)} />}
      </SlideOver>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="Delete nonconformity"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        message={
          <>
            Delete <span className="font-medium">{toDelete?.title}</span>? This cannot be undone. The deletion is recorded in the audit trail.
          </>
        }
      />
    </Card>
  );
}
