import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, GitBranch, HelpCircle, RotateCcw, X } from 'lucide-react';
import { api, errorMessage, qk, type AiSystem, type DecisionTreeStep, type RiskClass } from '../../lib/api';
import { RISK_CLASSES, isRiskClass, riskClassLabel } from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { RefButton, RiskClassBadge } from '../../components/grc';
import { RequirementPanel } from '../../components/RequirementDetail';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Select, Textarea } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { useEuOverview } from './EuOverview';
import { SystemPicker, SystemsState, useSystems } from './SystemPicker';

type Branch = 'yes' | 'no';

interface Answer {
  step: number;
  /** What the user said. */
  answer: Branch | 'unsure';
  /** The branch that was followed (for "Not sure" the user chooses which one to continue on). */
  followed: Branch;
  note: string;
}

type Cursor = { kind: 'step'; step: DecisionTreeStep } | { kind: 'result'; result: string } | { kind: 'broken'; step: number } | { kind: 'empty' };

/** Replays the answers through the tree: `yes` / `no` are either the next step number or a result string. */
function walk(tree: DecisionTreeStep[], answers: Answer[]): Cursor {
  if (tree.length === 0) return { kind: 'empty' };
  const byStep = new Map(tree.map((s) => [s.step, s]));
  let current: DecisionTreeStep = tree[0];
  for (const a of answers) {
    const next = current[a.followed];
    if (typeof next === 'number') {
      const step = byStep.get(next);
      if (!step) return { kind: 'broken', step: next };
      current = step;
    } else {
      return { kind: 'result', result: String(next) };
    }
  }
  return { kind: 'step', step: current };
}

/** The risk class a result string names, when it matches a class id. */
function matchClass(result: string, classIds: string[]): RiskClass | null {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const found = classIds.find((id) => id === result) ?? classIds.find((id) => norm(id) === norm(result));
  return found && isRiskClass(found) ? found : null;
}

const ANSWER_LABELS: Record<Answer['answer'], string> = { yes: 'Yes', no: 'No', unsure: 'Not sure' };

function answerText(a: Answer): string {
  return a.answer === 'unsure' ? `Not sure (continued on the ${a.followed === 'yes' ? 'Yes' : 'No'} branch)` : ANSWER_LABELS[a.answer];
}

function composeRationale(tree: DecisionTreeStep[], answers: Answer[], result: string, finalClass: RiskClass | '', comment: string): string {
  const byStep = new Map(tree.map((s) => [s.step, s]));
  const lines: string[] = ['Manual classification with the EU AI Act decision tree.'];
  for (const a of answers) {
    const s = byStep.get(a.step);
    const basis = s && s.basis.length > 0 ? ` [${s.basis.join(', ')}]` : '';
    lines.push(`Step ${a.step}: ${s?.question ?? ''}${basis} — ${answerText(a)}.${a.note.trim() ? ` Note: ${a.note.trim()}` : ''}`);
  }
  lines.push(`Result of the decision tree: ${result}.`);
  if (finalClass) lines.push(`Class chosen by the reviewer: ${riskClassLabel(finalClass)} (${finalClass}).`);
  if (comment.trim()) lines.push(`Comment: ${comment.trim()}`);
  return lines.join('\n');
}

interface WizardBodyProps {
  workspaceId: string;
  system: AiSystem;
  tree: DecisionTreeStep[];
  classOptions: Array<{ id: RiskClass; label: string }>;
  onOpenRequirement: (ref: string) => void;
  onShowObligations: (systemId: string) => void;
}

function WizardBody({ workspaceId, system, tree, classOptions, onOpenRequirement, onShowObligations }: WizardBodyProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(workspaceId);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [note, setNote] = useState('');
  const [unsure, setUnsure] = useState(false);
  const [chosen, setChosen] = useState<RiskClass | ''>('');
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);

  const cursor = walk(tree, answers);
  const byStep = new Map(tree.map((s) => [s.step, s]));
  const matched = cursor.kind === 'result' ? matchClass(cursor.result, classOptions.map((c) => c.id)) : null;
  const finalClass: RiskClass | '' = chosen || matched || '';

  const save = useMutation({
    mutationFn: (body: { risk_class: RiskClass; rationale: string }) => api.setRiskClass(workspaceId, system.id, body),
    onSuccess: (res) => {
      qc.setQueryData<AiSystem>(qk.system(workspaceId, res.id), res);
      invalidate();
      setSaved(true);
      toast.success(`Classified as ${riskClassLabel(res.risk_class)}`);
    },
  });

  const record = (answer: Answer['answer'], followed: Branch) => {
    if (cursor.kind !== 'step') return;
    setAnswers((old) => [...old, { step: cursor.step.step, answer, followed, note }]);
    setNote('');
    setUnsure(false);
  };

  /** Go back to an answered step: it and everything after it is asked again. */
  const reopen = (index: number) => {
    setNote(answers[index]?.note ?? '');
    setAnswers((old) => old.slice(0, index));
    setUnsure(false);
    setChosen('');
    setSaved(false);
    save.reset();
  };

  const restart = () => {
    setAnswers([]);
    setNote('');
    setUnsure(false);
    setChosen('');
    setComment('');
    setSaved(false);
    save.reset();
  };

  const rationale = cursor.kind === 'result' ? composeRationale(tree, answers, cursor.result, finalClass, comment) : '';

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          Current class of <span className="font-medium text-fg">{system.name}</span>:
        </span>
        <RiskClassBadge value={system.risk_class} status={system.risk_class_status} />
        {answers.length > 0 && (
          <button type="button" onClick={restart} className="ml-auto inline-flex items-center gap-1 font-medium text-accent-text hover:underline">
            <RotateCcw className="h-3 w-3" /> Start over
          </button>
        )}
      </div>

      {answers.length > 0 && (
        <ol className="space-y-2">
          {answers.map((a, i) => {
            const s = byStep.get(a.step);
            return (
              <li key={`${a.step}-${i}`} className="flex gap-2.5 rounded-md border border-line bg-bg px-3 py-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] font-medium tabular-nums text-muted">{a.step}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg [overflow-wrap:anywhere]">{s?.question ?? '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={a.answer === 'unsure' ? 'amber' : 'grey'}>{answerText(a)}</Badge>
                    {(s?.basis ?? []).map((b) => (
                      <RefButton key={b} onClick={() => onOpenRequirement(b)} title={`Open ${b}`}>
                        {b}
                      </RefButton>
                    ))}
                  </div>
                  {a.note.trim() && <p className="mt-1 whitespace-pre-line text-xs text-muted [overflow-wrap:anywhere]">Note: {a.note.trim()}</p>}
                </div>
                <button type="button" onClick={() => reopen(i)} className="shrink-0 self-start text-xs font-medium text-accent-text hover:underline">
                  Change
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {cursor.kind === 'broken' && (
        <Notice tone="error">
          The decision tree points to step {cursor.step}, which does not exist. Change an earlier answer, or classify the system manually from its page.
        </Notice>
      )}

      {cursor.kind === 'step' && (
        <div className="rounded-lg border border-line-strong p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold tabular-nums text-white">{cursor.step.step}</span>
            Step {cursor.step.step} of the decision tree
          </div>
          <p className="mt-2 text-base font-medium leading-snug text-fg [overflow-wrap:anywhere]">{cursor.step.question}</p>
          {cursor.step.basis.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted">Legal basis</span>
              {cursor.step.basis.map((b) => (
                <RefButton key={b} onClick={() => onOpenRequirement(b)} title={`Open ${b}`}>
                  {b}
                </RefButton>
              ))}
            </div>
          )}
          <div className="mt-3">
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional) — why you answer this way; it becomes part of the rationale"
              aria-label={`Note for step ${cursor.step.step}`}
              className="text-xs"
            />
          </div>
          {unsure ? (
            <Notice tone="warning" className="mt-3">
              <p>
                <span className="font-medium">“Not sure” is recorded in the rationale.</span> The tree still needs a branch to continue on — choose the one to
                follow for now. Consider the stricter outcome, or run the AI-assisted assessment, which reports the information that is missing.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => record('unsure', 'yes')}>
                  Continue as “Yes”
                </Button>
                <Button size="sm" onClick={() => record('unsure', 'no')}>
                  Continue as “No”
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setUnsure(false)}>
                  Back
                </Button>
              </div>
            </Notice>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={() => record('yes', 'yes')}>
                Yes
              </Button>
              <Button icon={<X className="h-3.5 w-3.5" />} onClick={() => record('no', 'no')}>
                No
              </Button>
              <Button icon={<HelpCircle className="h-3.5 w-3.5" />} onClick={() => setUnsure(true)}>
                Not sure
              </Button>
            </div>
          )}
        </div>
      )}

      {cursor.kind === 'result' && (
        <div className="space-y-3 rounded-lg border border-line-strong p-4">
          <div>
            <div className="text-xs font-medium text-muted">Result of the decision tree</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {matched ? <RiskClassBadge value={matched} /> : <span className="text-base font-semibold text-fg [overflow-wrap:anywhere]">{cursor.result}</span>}
              {matched && <span className="font-mono text-xs text-muted">{cursor.result}</span>}
            </div>
            {!matched && (
              <p className="mt-1 text-xs text-muted">This result does not name one of the risk classes directly — choose the class that applies below.</p>
            )}
            {answers.some((a) => a.answer === 'unsure') && (
              <Notice tone="warning" className="mt-2">
                At least one step was answered “Not sure”. The result depends on the branch you chose to continue on — review it before saving.
              </Notice>
            )}
          </div>

          <Field label="Final risk class" htmlFor="wizard-class" hint="Pre-selected from the result when it matches a class. You decide: the class you save is stored as approved.">
            <Select id="wizard-class" value={finalClass} disabled={saved} onChange={(e) => setChosen(isRiskClass(e.target.value) ? e.target.value : '')}>
              <option value="" disabled>
                Choose a class…
              </option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Comment (optional)" htmlFor="wizard-comment">
            <Textarea id="wizard-comment" rows={2} value={comment} disabled={saved} onChange={(e) => setComment(e.target.value)} placeholder="Anything else that explains the choice" />
          </Field>

          <div>
            <div className="mb-1 text-xs font-medium text-fg">Rationale that will be saved</div>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-bg p-3 font-sans text-xs leading-relaxed text-fg [overflow-wrap:anywhere]">{rationale}</pre>
          </div>

          {save.isError && <Notice tone="error">Could not save the classification: {errorMessage(save.error)}</Notice>}

          {saved ? (
            <Notice tone="success">
              <span className="font-medium">Saved.</span> {system.name} is classified as {riskClassLabel(finalClass)} — stored as approved under your name and recorded in the
              audit trail.{' '}
              <button type="button" onClick={() => onShowObligations(system.id)} className="font-medium underline">
                See the obligations that apply
              </button>
            </Notice>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="mr-auto text-xs text-muted">Replaces any class proposed by the classifier.</span>
              <Button
                variant="primary"
                loading={save.isPending}
                disabled={!finalClass}
                onClick={() => finalClass && save.mutate({ risk_class: finalClass, rationale })}
              >
                Save classification
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ClassificationWizardProps {
  workspaceId: string;
  systemId: string;
  onSystemChange: (id: string) => void;
  onShowObligations: (systemId: string) => void;
}

export function ClassificationWizard({ workspaceId, systemId, onSystemChange, onShowObligations }: ClassificationWizardProps) {
  const overview = useEuOverview();
  const systems = useSystems(workspaceId);
  const [openRef, setOpenRef] = useState<string | null>(null);

  const list = systems.data ?? [];
  const system = list.find((s) => s.id === systemId) ?? null;
  const tree = overview.data?.decision_tree ?? [];
  const fromKb = (overview.data?.risk_classes ?? []).filter((c) => isRiskClass(c.id)).map((c) => ({ id: c.id, label: c.label_en || riskClassLabel(c.id) }));
  const classOptions = fromKb.length > 0 ? fromKb : RISK_CLASSES.map((id) => ({ id, label: riskClassLabel(id) }));

  return (
    <Card>
      <CardHeader
        title="Classification wizard"
        description="Walk the EU AI Act decision tree for one system, step by step, and record the class yourself."
      />
      <div className="border-b border-line px-4 py-3">
        <Notice>
          <div className="flex items-start gap-2">
            <GitBranch className="mt-px h-4 w-4 shrink-0 text-muted" />
            <div>
              <span className="font-medium">This is the manual path.</span> You answer each question and your classification is stored as approved, under your name.
              The AI-assisted path is <span className="font-medium">Run assessment</span> on the system page: the classifier proposes a class with its decision path,
              and you approve or correct it.
              {system && (
                <>
                  {' '}
                  <Link to={`/inventory/${encodeURIComponent(system.id)}`} className="inline-flex items-center gap-0.5 font-medium text-accent-text hover:underline">
                    Open {system.name} <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </Notice>
        <div className="mt-3 max-w-md">
          <Field label="System" htmlFor="wizard-system">
            <SystemPicker id="wizard-system" systems={list} value={system ? system.id : ''} onChange={onSystemChange} withClass disabled={list.length === 0} />
          </Field>
        </div>
      </div>

      {systems.isLoading || systems.isError || list.length === 0 ? (
        <SystemsState query={systems} />
      ) : overview.isLoading ? (
        <SkeletonRows rows={4} />
      ) : overview.isError ? (
        <ErrorState compact error={overview.error} title="Could not load the decision tree" onRetry={() => void overview.refetch()} />
      ) : tree.length === 0 ? (
        <EmptyState compact title="No decision tree" description="The knowledge base does not provide a decision tree. Classify the system manually from its page." />
      ) : !system ? (
        <EmptyState compact icon={<GitBranch className="h-4 w-4" />} title="Choose a system to start" description={`The tree has ${tree.length} question${tree.length === 1 ? '' : 's'}; most paths need only a few of them.`} />
      ) : (
        // A different system starts a fresh walk.
        <WizardBody
          key={system.id}
          workspaceId={workspaceId}
          system={system}
          tree={tree}
          classOptions={classOptions}
          onOpenRequirement={setOpenRef}
          onShowObligations={onShowObligations}
        />
      )}

      <RequirementPanel requirementRef={openRef} onClose={() => setOpenRef(null)} />
    </Card>
  );
}

