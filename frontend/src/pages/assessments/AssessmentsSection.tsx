import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileSignature, Plus } from 'lucide-react';
import { api, errorMessage, isStatus, qk, type Assessment, type AssessmentCategory, type AssessmentSummary, type AssessmentType } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { frameworkMeta } from '../../lib/grc';
import { AiBadge } from '../../components/AiBadge';
import { AssessmentStatusBadge, FrameworkChip, RefChip } from '../../components/grc';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { Dialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';
import { SystemPicker, useSystems } from '../frameworks/SystemPicker';

const CATEGORY_ORDER: AssessmentCategory[] = ['eu-ai-act', 'gdpr'];

interface NewAssessmentFormProps {
  workspaceId: string;
  category?: AssessmentCategory;
  /** Fixed system (on the system page); otherwise the user picks one. */
  systemId?: string;
  existing: AssessmentSummary[];
  onClose: () => void;
}

function NewAssessmentForm({ workspaceId, category, systemId, existing, onClose }: NewAssessmentFormProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const types = useQuery({ queryKey: qk.assessmentTypes, queryFn: api.assessmentTypes, staleTime: 5 * 60_000 });
  const systems = useSystems(workspaceId);
  const [type, setType] = useState('');
  const [system, setSystem] = useState(systemId ?? '');
  const [touched, setTouched] = useState(false);

  const offered = (types.data ?? []).filter((t) => !category || t.category === category);
  const categories = [...CATEGORY_ORDER, ...new Set(offered.map((t) => t.category).filter((c) => !CATEGORY_ORDER.includes(c)))].filter((c) =>
    offered.some((t) => t.category === c),
  );
  const chosen: AssessmentType | undefined = offered.find((t) => t.id === type);
  const duplicate = system && type ? existing.find((a) => a.system_id === system && a.type === type && a.status !== 'rejected') : undefined;

  const create = useMutation({
    mutationFn: (body: { system_id: string; type: string }) => api.createAssessment(workspaceId, body),
    onSuccess: (created) => {
      qc.setQueryData<Assessment>(qk.assessment(workspaceId, created.id), created);
      void qc.invalidateQueries({ queryKey: qk.assessmentsAll(workspaceId) });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success('Assessment created');
      onClose();
      navigate(`/assessments/${encodeURIComponent(created.id)}`);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!type || !system) return;
    create.mutate({ system_id: system, type });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      {!systemId && (
        <Field label="System" htmlFor="assessment-system" error={touched && !system ? 'Choose the system the assessment is about.' : null}>
          <SystemPicker id="assessment-system" systems={systems.data ?? []} value={system} onChange={setSystem} disabled={systems.isLoading} />
        </Field>
      )}
      {systems.isError && <Notice tone="error">Could not load the inventory: {errorMessage(systems.error)}</Notice>}
      <Field label="Type" htmlFor="assessment-type" error={touched && !type ? 'Choose the type of assessment.' : null}>
        <Select id="assessment-type" value={type} onChange={(e) => setType(e.target.value)} disabled={types.isLoading}>
          <option value="" disabled>
            {types.isLoading ? 'Loading types…' : 'Choose a type…'}
          </option>
          {categories.map((c) => (
            <optgroup key={c} label={frameworkMeta(c).label}>
              {offered
                .filter((t) => t.category === c)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title_en}
                  </option>
                ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      {types.isError && <Notice tone="error">Could not load the assessment types: {errorMessage(types.error)}</Notice>}

      {chosen && (
        <div className="rounded-md border border-line bg-bg px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <FrameworkChip id={chosen.category} />
            {(chosen.legal_basis ?? []).map((b) => (
              <RefChip key={b}>{b}</RefChip>
            ))}
          </div>
          <p className="mt-1.5 text-muted">
            {chosen.sections} section{chosen.sections === 1 ? '' : 's'} from the template
            {chosen.agent ? (
              <>
                {' '}
                · drafted on request by the <span className="font-medium text-fg">{chosen.agent}</span> agent
              </>
            ) : null}
            . Nothing is written until you ask for an AI draft or type it yourself.
          </p>
        </div>
      )}

      {duplicate && !create.isError && (
        <Notice tone="warning">
          This system already has an assessment of this type ({duplicate.status.replace(/_/g, ' ')}, version {duplicate.version}).{' '}
          <Link to={`/assessments/${encodeURIComponent(duplicate.id)}`} className="font-medium underline" onClick={onClose}>
            Open it
          </Link>{' '}
          — a new one can only be created once that one is rejected; an approved one can be revised.
        </Notice>
      )}
      {create.isError && (
        <Notice tone="error">
          <span className="font-medium">Could not create the assessment.</span> {errorMessage(create.error)}
          {isStatus(create.error, 409) && duplicate && (
            <>
              {' '}
              <Link to={`/assessments/${encodeURIComponent(duplicate.id)}`} className="font-medium underline" onClick={onClose}>
                Open the existing one
              </Link>
            </>
          )}
        </Notice>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onClose} disabled={create.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={create.isPending}>
          Create assessment
        </Button>
      </div>
    </form>
  );
}

interface AssessmentsSectionProps {
  workspaceId: string;
  /** Only assessments (and types) of this category. */
  category?: AssessmentCategory;
  /** Only assessments of this system (the system detail page). */
  systemId?: string;
  description?: string;
}

/** List of assisted assessments (FRIA, Annex IV, DPIA, RoPA, LIA, Art. 22, TIA) with "New assessment". */
export function AssessmentsSection({ workspaceId, category, systemId, description }: AssessmentsSectionProps) {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const list = useQuery({
    queryKey: qk.assessments(workspaceId, systemId ?? null),
    queryFn: () => api.listAssessments(workspaceId, systemId),
    // Contract: poll every 2 s while an assessment is being drafted.
    refetchInterval: (q) => ((q.state.data ?? []).some((a) => a.status === 'drafting') ? 2000 : false),
  });

  const all = list.data ?? [];
  const rows = all
    .filter((a) => !category || a.category === category)
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));

  const newButton = (
    <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreateOpen(true)}>
      New assessment
    </Button>
  );

  return (
    <section id="assessments" className="scroll-mt-20">
      <Card>
        <CardHeader
          title="Assessments"
          description={description ?? 'Assisted assessment documents: an agent drafts from the evidence, you edit, and a human approves the final version.'}
          actions={newButton}
        />
        {list.isLoading ? (
          <SkeletonRows rows={3} />
        ) : list.isError ? (
          <ErrorState compact error={list.error} title="Could not load the assessments" onRetry={() => void list.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            compact
            icon={<FileSignature className="h-4 w-4" />}
            title="No assessments yet"
            description={
              category === 'gdpr'
                ? 'Create a DPIA, a record of processing (RoPA), a legitimate interest assessment, an Art. 22 assessment or a transfer impact assessment for a system.'
                : category === 'eu-ai-act'
                  ? 'Create a fundamental rights impact assessment (FRIA) or the Annex IV technical documentation for a system.'
                  : 'Create a FRIA, Annex IV technical documentation, DPIA, RoPA, LIA, Art. 22 or transfer impact assessment for this system.'
            }
            action={newButton}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Type</th>
                  {!systemId && <th className="th">System</th>}
                  <th className="th">Status</th>
                  <th className="th">Version</th>
                  <th className="th">Model</th>
                  <th className="th">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const to = `/assessments/${encodeURIComponent(a.id)}`;
                  return (
                    <tr key={a.id} onClick={() => navigate(to)} className="cursor-pointer hover:bg-surface2/60 [&:last-child>td]:border-b-0">
                      <td className="td min-w-[220px]">
                        <Link to={to} onClick={(e) => e.stopPropagation()} className="font-medium text-fg hover:text-accent-text [overflow-wrap:anywhere]">
                          {a.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {!category && <FrameworkChip id={a.category} />}
                          <span className="font-mono text-[11px] text-muted">{a.type}</span>
                        </div>
                      </td>
                      {!systemId && (
                        <td className="td max-w-[180px] truncate text-muted" title={a.system_name}>
                          {a.system_name}
                        </td>
                      )}
                      <td className="td">
                        <AssessmentStatusBadge status={a.status} />
                        {a.draft_error && <div className="mt-1 max-w-[200px] truncate text-xs text-red-600 dark:text-red-400" title={a.draft_error}>{a.draft_error}</div>}
                      </td>
                      <td className="td tabular-nums text-muted">v{a.version}</td>
                      <td className="td">
                        {/* Transparency rule: the AI badge stays until a human has approved the document. */}
                        {!a.model ? (
                          <span className="text-xs text-muted">—</span>
                        ) : a.status === 'approved' ? (
                          <span className="font-mono text-[11px] text-muted">{a.model}</span>
                        ) : (
                          <AiBadge model={a.model} className="max-w-[220px]" />
                        )}
                      </td>
                      <td className="td whitespace-nowrap text-xs text-muted">{formatDateTime(a.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="New assessment" description="Starts an empty document from the template of the chosen type.">
        {createOpen && <NewAssessmentForm workspaceId={workspaceId} category={category} systemId={systemId} existing={all} onClose={() => setCreateOpen(false)} />}
      </Dialog>
    </section>
  );
}
