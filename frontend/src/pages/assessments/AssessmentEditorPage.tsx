import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, FileSignature, History, Loader2, Save, Send, ShieldCheck, Sparkles, Trash2, UserPen } from 'lucide-react';
import { api, errorMessage, isStatus, qk, type Assessment, type AssessmentSection, type AssessmentStatus, type Workspace } from '../../lib/api';
import { cn, formatDateTime } from '../../lib/format';
import { SECTION_FILL_HINTS, SECTION_FILL_LABELS } from '../../lib/grc';
import { AiBadge } from '../../components/AiBadge';
import { AssessmentStatusBadge, FrameworkChip, RefChip } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CopyValue } from '../../components/ui/Copy';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { ApprovalCard } from '../evidence/ApprovalQueue';
import { EvidenceList } from '../inventory/FindingsSection';

type SectionState = 'unsupported' | 'empty' | 'ai' | 'edited';

function isUnsupported(s: AssessmentSection): boolean {
  return s.supported === false && (s.source === 'ai' || s.source === 'ai_edited');
}

function sectionState(s: AssessmentSection): SectionState {
  if (isUnsupported(s)) return 'unsupported';
  if (s.source === 'empty' || !(s.content ?? '').trim()) return 'empty';
  return s.source === 'ai' ? 'ai' : 'edited';
}

const STATE_LABELS: Record<SectionState, string> = {
  unsupported: 'Unsupported',
  empty: 'Empty',
  ai: 'AI draft',
  edited: 'Written or edited by you',
};

const STATE_DOT: Record<SectionState, string> = {
  unsupported: 'bg-red-500',
  empty: 'border border-line-strong bg-transparent',
  ai: 'bg-amber-500',
  edited: 'bg-slate-600 dark:bg-slate-300',
};

function isEditable(status: AssessmentStatus): boolean {
  return status === 'draft' || status === 'rejected';
}

function lockReason(a: Assessment): string | null {
  switch (a.status) {
    case 'drafting':
      return 'Locked while the agent is drafting. Sections you have edited are never overwritten.';
    case 'in_review':
      return 'Locked while the document is in review. If the approval is rejected, it can be edited again.';
    case 'approved':
      return `Version ${a.version} is approved and locked. Use “Revise” to start version ${a.version + 1}.`;
    default:
      return null;
  }
}

function sectionAnchor(id: string): string {
  return `section-${id}`;
}

// ---------- Section card ----------

interface SectionCardProps {
  workspaceId: string;
  assessment: Assessment;
  section: AssessmentSection;
  onDirtyChange: (sectionId: string, dirty: boolean) => void;
}

function SectionCard({ workspaceId, assessment, section: s, onDirtyChange }: SectionCardProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const serverContent = s.content ?? '';
  const [draft, setDraft] = useState(serverContent);
  const [base, setBase] = useState(serverContent);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLTextAreaElement>(null);
  const editable = isEditable(assessment.status);
  const dirty = draft !== base;

  // New content from the server (an AI draft, a save elsewhere) replaces the text unless there are unsaved edits.
  useEffect(() => {
    if (serverContent === base) return;
    if (draft === base) setDraft(serverContent);
    setBase(serverContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverContent]);

  useEffect(() => {
    onDirtyChange(s.id, dirty);
  }, [dirty, onDirtyChange, s.id]);
  useEffect(() => () => onDirtyChange(s.id, false), [onDirtyChange, s.id]);

  // Auto-grow: the textarea is as tall as its content.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight + 2, 96)}px`;
  }, [draft]);

  const save = useMutation({
    mutationFn: (content: string) => api.updateAssessmentSection(workspaceId, assessment.id, s.id, content),
    onSuccess: (res, content) => {
      qc.setQueryData<Assessment>(qk.assessment(workspaceId, res.id), res);
      setBase(content);
      void qc.invalidateQueries({ queryKey: qk.assessmentsAll(workspaceId), refetchType: 'none' });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(`Section ${s.number} saved`);
    },
  });

  const state = sectionState(s);
  const unsupported = isUnsupported(s);
  const approved = assessment.status === 'approved';
  const needs = s.needs_input ?? [];
  const evidence = s.evidence ?? [];
  const reason = lockReason(assessment);

  return (
    <section id={sectionAnchor(s.id)} className="scroll-mt-20">
      <Card className={cn(unsupported && 'border-red-300 dark:border-red-500/40')}>
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-line px-4 py-3">
          <span className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-surface2 px-1.5 text-xs font-semibold tabular-nums text-fg">{s.number}</span>
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="text-sm font-semibold text-fg [overflow-wrap:anywhere]">{s.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {s.basis && <RefChip>{s.basis}</RefChip>}
              <Badge tone="grey" title={SECTION_FILL_HINTS[s.fill]}>
                {SECTION_FILL_LABELS[s.fill] ?? s.fill}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Transparency rule: AI-written text carries the badge and the model until a human approves the document. */}
            {s.source === 'ai' &&
              (approved ? (
                <span className="text-xs text-muted">
                  Drafted by AI{assessment.model ? <span className="font-mono"> · {assessment.model}</span> : null} — approved by a human
                </span>
              ) : (
                <AiBadge model={assessment.model} />
              ))}
            {s.source === 'ai_edited' && (
              <Badge tone="amber" variant="outline" title={assessment.model ? `Originally drafted by ${assessment.model}, then edited by a person.` : 'Originally drafted by AI, then edited by a person.'}>
                <UserPen className="h-3 w-3" aria-hidden />
                AI draft edited by you
                {assessment.model && !approved && <span className="font-mono text-[11px] font-normal opacity-80">· {assessment.model}</span>}
              </Badge>
            )}
            {s.source === 'user' && (
              <Badge tone="grey">
                <UserPen className="h-3 w-3" aria-hidden />
                Written by you
              </Badge>
            )}
            {s.source === 'empty' && (
              <Badge tone="grey" variant="outline">
                Empty
              </Badge>
            )}
            {dirty && (
              <Badge tone="amber" withDot>
                Unsaved
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {s.guidance && (
            <p className="rounded-md bg-surface2/70 px-3 py-2 text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
              <span className="font-medium text-fg">What belongs here:</span> {s.guidance}
            </p>
          )}

          {unsupported && (
            <Notice tone="error">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">Unsupported: no verified source.</span> The agent wrote this section, but no quote behind it could be verified in the
                  evidence. Check every statement, add the evidence, or rewrite it yourself before submitting.
                </div>
              </div>
            </Notice>
          )}

          {needs.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Your input is needed ({needs.length})
              </div>
              <ul className="mt-1.5 space-y-1">
                {needs.map((q, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={answered.has(i)}
                        onChange={() =>
                          setAnswered((old) => {
                            const next = new Set(old);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          })
                        }
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-amber-400 accent-amber-600"
                      />
                      <span className={cn('[overflow-wrap:anywhere]', answered.has(i) && 'line-through opacity-70')}>{q}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 opacity-80">Answer in the text below. The ticks are a reading aid for you and are not saved.</p>
            </div>
          )}

          <div>
            <textarea
              ref={ref}
              value={draft}
              readOnly={!editable}
              onChange={(e) => {
                setDraft(e.target.value);
                if (save.isError) save.reset();
              }}
              aria-label={`Section ${s.number}: ${s.title}`}
              placeholder={
                editable
                  ? s.fill === 'user'
                    ? 'Write this section — the agent does not fill it.'
                    : 'Empty. Write it yourself, or use “Draft with AI”.'
                  : 'This section is empty.'
              }
              className={cn(
                'block w-full resize-none overflow-hidden rounded-md border border-line-strong px-3 py-2 text-sm leading-relaxed text-fg shadow-sm placeholder:text-muted/70',
                'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
                editable ? 'bg-surface' : 'cursor-default bg-surface2/60',
              )}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 text-xs text-muted">{editable ? 'Markdown. Saving an AI-drafted section marks it as edited by you; the agent will not overwrite it.' : reason}</p>
              {editable && (
                <div className="flex items-center gap-2">
                  {dirty && (
                    <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => setDraft(base)}>
                      Discard
                    </Button>
                  )}
                  <Button size="sm" variant={dirty ? 'primary' : 'secondary'} icon={<Save className="h-3.5 w-3.5" />} disabled={!dirty} loading={save.isPending} onClick={() => save.mutate(draft)}>
                    Save section
                  </Button>
                </div>
              )}
            </div>
            {save.isError && (
              <Notice tone="error" className="mt-2">
                Could not save section {s.number}: {errorMessage(save.error)}
              </Notice>
            )}
          </div>

          {(evidence.length > 0 || s.fill === 'rag') && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted">Evidence cited ({evidence.length})</div>
              <EvidenceList
                evidence={evidence}
                emptyText={state === 'empty' ? 'No evidence yet — the agent cites its sources here when it drafts this section.' : 'No evidence is cited for this section.'}
              />
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

// ---------- Outline ----------

interface OutlineProps {
  sections: AssessmentSection[];
  dirty: Set<string>;
}

function Outline({ sections, dirty }: OutlineProps) {
  const states = sections.map(sectionState);
  const empty = states.filter((x) => x === 'empty').length;
  const unsupported = states.filter((x) => x === 'unsupported').length;
  const filled = sections.length - empty;
  const pct = sections.length > 0 ? (filled / sections.length) * 100 : 0;

  return (
    <Card className="p-3">
      <div className="text-xs font-semibold text-fg">Progress</div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={sections.length} aria-valuenow={filled} aria-label="Sections filled">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <dl className="mt-2 grid grid-cols-3 gap-1 text-center">
        <div>
          <dd className="text-base font-semibold tabular-nums text-fg">{filled}</dd>
          <dt className="text-[11px] text-muted">Filled</dt>
        </div>
        <div>
          <dd className={cn('text-base font-semibold tabular-nums', empty > 0 ? 'text-fg' : 'text-muted')}>{empty}</dd>
          <dt className="text-[11px] text-muted">Empty</dt>
        </div>
        <div>
          <dd className={cn('text-base font-semibold tabular-nums', unsupported > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted')}>{unsupported}</dd>
          <dt className="text-[11px] text-muted">Unsupported</dt>
        </div>
      </dl>

      <nav aria-label="Sections" className="mt-3 border-t border-line pt-2">
        <ul className="max-h-[calc(100vh-380px)] min-h-[120px] space-y-px overflow-y-auto">
          {sections.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => document.getElementById(sectionAnchor(s.id))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                title={`${s.number} ${s.title} — ${STATE_LABELS[states[i]]}${dirty.has(s.id) ? ' (unsaved changes)' : ''}`}
                className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs text-fg hover:bg-surface2"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', STATE_DOT[states[i]])} aria-label={STATE_LABELS[states[i]]} />
                <span className="w-5 shrink-0 tabular-nums text-muted">{s.number}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {dirty.has(s.id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-[11px] text-muted">
        {(['empty', 'ai', 'edited', 'unsupported'] as SectionState[]).map((st) => (
          <li key={st} className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', STATE_DOT[st])} aria-hidden />
            {st === 'edited' ? 'Edited' : st === 'ai' ? 'AI' : STATE_LABELS[st]}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------- Page ----------

function BackLink({ systemId }: { systemId?: string }) {
  return (
    <Link
      to={systemId ? `/inventory/${encodeURIComponent(systemId)}#assessments` : '/frameworks'}
      className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {systemId ? 'Back to the system' : 'Frameworks'}
    </Link>
  );
}

function AssessmentEditor({ workspace, assessmentId }: { workspace: Workspace; assessmentId: string }) {
  const wid = workspace.id;
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const key = qk.assessment(wid, assessmentId);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onDirtyChange = useCallback((sectionId: string, isDirty: boolean) => {
    setDirty((old) => {
      if (old.has(sectionId) === isDirty) return old;
      const next = new Set(old);
      if (isDirty) next.add(sectionId);
      else next.delete(sectionId);
      return next;
    });
  }, []);

  const query = useQuery({
    queryKey: key,
    queryFn: () => api.getAssessment(wid, assessmentId),
    retry: (count, err) => !isStatus(err, 404) && count < 2,
    // Contract: poll every 2 s while drafting. In review we poll slowly, so a decision taken elsewhere shows up.
    refetchInterval: (q) => (q.state.data?.status === 'drafting' ? 2000 : q.state.data?.status === 'in_review' ? 5000 : false),
  });
  const a = query.data;

  const approvals = useQuery({
    queryKey: qk.approvals(wid),
    queryFn: () => api.listApprovals(wid, 'pending'),
    enabled: a?.status === 'in_review',
  });

  // Keep the lists in step when the status changes (drafting finished, approved, rejected…).
  const lastStatus = useRef<AssessmentStatus | null>(null);
  useEffect(() => {
    if (!a) return;
    if (lastStatus.current !== null && lastStatus.current !== a.status) {
      void qc.invalidateQueries({ queryKey: qk.assessments(wid, null) });
      void qc.invalidateQueries({ queryKey: qk.assessments(wid, a.system_id) });
      void qc.invalidateQueries({ queryKey: qk.approvals(wid) });
    }
    lastStatus.current = a.status;
  }, [a, qc, wid]);

  const onChanged = (res: Assessment) => {
    qc.setQueryData<Assessment>(key, res);
    void qc.invalidateQueries({ queryKey: qk.assessmentsAll(wid), refetchType: 'none' });
    void qc.invalidateQueries({ queryKey: qk.approvals(wid) });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  };
  // A 409 usually means the status changed elsewhere: refresh so the page shows it.
  const onConflict = () => void qc.invalidateQueries({ queryKey: key });

  const draftAi = useMutation({
    mutationFn: () => api.draftAssessment(wid, assessmentId),
    onSuccess: (res) => {
      onChanged(res);
      toast.success('The agent is drafting');
    },
    onError: onConflict,
  });
  const submit = useMutation({
    mutationFn: () => api.submitAssessment(wid, assessmentId),
    onSuccess: (res) => {
      onChanged(res);
      toast.success('Submitted for approval');
    },
    onError: onConflict,
  });
  const revise = useMutation({
    mutationFn: () => api.reviseAssessment(wid, assessmentId),
    onSuccess: (res) => {
      // The contract returns "a new draft": follow it if it comes back under a new id.
      qc.setQueryData<Assessment>(qk.assessment(wid, res.id), res);
      void qc.invalidateQueries({ queryKey: qk.assessmentsAll(wid), refetchType: res.id === assessmentId ? 'none' : 'active' });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(`Version ${res.version} started`);
      if (res.id !== assessmentId) navigate(`/assessments/${encodeURIComponent(res.id)}`);
    },
    onError: onConflict,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteAssessment(wid, assessmentId),
    onSuccess: () => {
      const systemId = a?.system_id;
      qc.removeQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: qk.assessmentsAll(wid) });
      void qc.invalidateQueries({ queryKey: qk.approvals(wid) });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success('Assessment deleted');
      navigate(systemId ? `/inventory/${encodeURIComponent(systemId)}` : '/frameworks');
    },
  });

  if (query.isLoading) {
    return (
      <>
        <BackLink />
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      </>
    );
  }
  if (query.isError || !a) {
    return (
      <>
        <BackLink />
        <Card>
          {isStatus(query.error, 404) ? (
            <EmptyState
              icon={<FileSignature className="h-4 w-4" />}
              title="This assessment was not found"
              description={`It may have been deleted, or it belongs to another workspace than ${workspace.name}.`}
            />
          ) : (
            <ErrorState error={query.error} title="Could not load this assessment" onRetry={() => void query.refetch()} />
          )}
        </Card>
      </>
    );
  }

  const sections = a.sections ?? [];
  const states = sections.map(sectionState);
  const emptyCount = states.filter((x) => x === 'empty').length;
  const unsupportedCount = states.filter((x) => x === 'unsupported').length;
  const editable = isEditable(a.status);
  const unsaved = dirty.size > 0;
  const unsavedTitle = unsaved ? 'Save or discard your unsaved sections first.' : undefined;
  const pendingApproval = a.status === 'in_review' ? (approvals.data ?? []).find((x) => x.id === a.pending_approval_id) ?? null : null;
  const actionError = [
    { m: draftAi, what: 'The AI draft could not be started.' },
    { m: submit, what: 'The document could not be submitted.' },
    { m: revise, what: 'A new version could not be started.' },
  ].find((x) => x.m.isError);

  return (
    <div>
      <BackLink systemId={a.system_id} />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-fg [overflow-wrap:anywhere]">{a.title}</h1>
            <AssessmentStatusBadge status={a.status} />
            <Badge tone="grey">Version {a.version}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted">
            <FrameworkChip id={a.category} />
            <span className="font-mono">{a.type}</span>
            {(a.legal_basis ?? []).map((b) => (
              <RefChip key={b}>{b}</RefChip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>
              System{' '}
              <Link to={`/inventory/${encodeURIComponent(a.system_id)}`} className="font-medium text-accent-text hover:underline">
                {a.system_name}
              </Link>
            </span>
            {a.agent && (
              <>
                <span aria-hidden>·</span>
                <span>Agent {a.agent}</span>
              </>
            )}
            {a.model && (
              <>
                <span aria-hidden>·</span>
                {a.status === 'approved' ? (
                  <span>
                    Model <span className="font-mono text-fg">{a.model}</span>
                  </span>
                ) : (
                  <AiBadge model={a.model} />
                )}
              </>
            )}
            <span aria-hidden>·</span>
            <span>Updated {formatDateTime(a.updated_at)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {a.status !== 'approved' && (
              <Button icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => { remove.reset(); setConfirmDelete(true); }} disabled={a.status === 'drafting'}>
                Delete
              </Button>
            )}
            {editable && (
              <>
                <Button icon={<Sparkles className="h-3.5 w-3.5" />} loading={draftAi.isPending} disabled={unsaved || submit.isPending} title={unsavedTitle} onClick={() => draftAi.mutate()}>
                  Draft with AI
                </Button>
                <Button
                  variant="primary"
                  icon={<Send className="h-3.5 w-3.5" />}
                  loading={submit.isPending}
                  disabled={unsaved || draftAi.isPending}
                  title={unsavedTitle}
                  onClick={() => submit.mutate()}
                >
                  Submit for approval
                </Button>
              </>
            )}
            {a.status === 'drafting' && (
              <Button disabled icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />}>
                Drafting…
              </Button>
            )}
            {a.status === 'approved' && (
              <Button variant="primary" icon={<History className="h-3.5 w-3.5" />} loading={revise.isPending} onClick={() => revise.mutate()}>
                Revise
              </Button>
            )}
          </div>
          {unsaved && editable && (
            <p className="text-right text-xs text-amber-700 dark:text-amber-300">
              {dirty.size} section{dirty.size === 1 ? ' has' : 's have'} unsaved changes — save them before drafting or submitting.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {actionError && (
          <Notice tone="error">
            <span className="font-medium">{actionError.what}</span> {errorMessage(actionError.m.error)}
            {isStatus(actionError.m.error, 409) && /model/i.test(errorMessage(actionError.m.error)) && (
              <>
                {' '}
                <Link to="/settings#routing" className="font-medium underline">
                  Open model routing
                </Link>
              </>
            )}
          </Notice>
        )}

        {a.draft_error && (
          <Notice tone="error">
            <span className="font-medium">The last AI draft failed.</span> {a.draft_error}
          </Notice>
        )}

        {a.status === 'drafting' && (
          <Notice tone="warning">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>
                <span className="font-medium">{a.agent ?? 'The agent'} is drafting.</span> It fills the sections that are still empty or AI-written; sections you have
                edited are never overwritten. This page updates automatically.
              </span>
            </div>
          </Notice>
        )}

        {a.status === 'rejected' && (
          <Notice tone="error">
            <span className="font-medium">This version was rejected.</span> Edit a section to bring the document back to draft, then submit it again.
          </Notice>
        )}

        {editable && sections.length > 0 && (emptyCount > 0 || unsupportedCount > 0) && (
          <Notice tone="warning">
            {emptyCount > 0 && (
              <>
                <span className="font-medium">
                  {emptyCount} section{emptyCount === 1 ? ' is' : 's are'} empty
                </span>
                {unsupportedCount > 0 ? ' and ' : '. '}
              </>
            )}
            {unsupportedCount > 0 && (
              <>
                <span className="font-medium">
                  {unsupportedCount} AI-written section{unsupportedCount === 1 ? ' has' : 's have'} no verified source
                </span>
                .{' '}
              </>
            )}
            You can still submit; the approver sees these counts.
          </Notice>
        )}

        {a.status === 'in_review' && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-fg">Pending approval</h2>
            {pendingApproval ? (
              <ApprovalCard workspaceId={wid} approval={pendingApproval} inline />
            ) : approvals.isLoading ? (
              <Card>
                <SkeletonRows rows={2} />
              </Card>
            ) : approvals.isError ? (
              <Card>
                <ErrorState compact error={approvals.error} title="Could not load the pending approval" onRetry={() => void approvals.refetch()} />
              </Card>
            ) : (
              <Notice>
                This document is waiting for a decision, but its approval was not found among the pending ones — it may just have been decided.{' '}
                <Link to="/evidence?tab=approvals" className="font-medium text-accent-text underline">
                  Open the approval queue
                </Link>
              </Notice>
            )}
          </div>
        )}

        {a.status === 'approved' && (
          <Card className="border-emerald-200 p-4 dark:border-emerald-500/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-fg">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Approved by a human
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
              <dt className="text-xs text-muted">Approved by</dt>
              <dd className="text-sm text-fg">
                {a.approved_by ?? '—'}
                {a.approved_at ? <span className="text-muted"> · {formatDateTime(a.approved_at)}</span> : null}
              </dd>
              <dt className="text-xs text-muted">Content hash (SHA-256)</dt>
              <dd>{a.content_hash ? <CopyValue value={a.content_hash} /> : <span className="text-sm text-muted">Not recorded</span>}</dd>
            </dl>
            <p className="mt-2 text-xs text-muted">The hash identifies exactly the approved text of version {a.version}. It stays in the audit trail when the document is revised.</p>
          </Card>
        )}

        {sections.length === 0 ? (
          <Card>
            <EmptyState title="This assessment has no sections" description="The template of this type defines no section." />
          </Card>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <aside className="lg:sticky lg:top-[72px] lg:order-2 lg:w-64 lg:shrink-0">
              <Outline sections={sections} dirty={dirty} />
            </aside>
            <div className="min-w-0 flex-1 space-y-4 lg:order-1">
              {sections.map((s) => (
                <SectionCard key={s.id} workspaceId={wid} assessment={a} section={s} onDirtyChange={onDirtyChange} />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        title="Delete assessment"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        message={
          <>
            Delete <span className="font-medium">{a.title}</span> (version {a.version})? Its text is lost. This cannot be undone; the deletion is recorded in the audit trail.
          </>
        }
      />
    </div>
  );
}

export function AssessmentEditorPage() {
  const { id = '' } = useParams();
  return <WorkspaceGate>{(workspace) => <AssessmentEditor key={`${workspace.id}:${id}`} workspace={workspace} assessmentId={id} />}</WorkspaceGate>;
}
