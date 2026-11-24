import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import {
  api,
  errorMessage,
  qk,
  type AgentCard,
  type AgentTool,
  type AiSystem,
  type Lifecycle,
  type OrgRole,
  type SystemInput,
  type SystemKind,
} from '../../lib/api';
import { cn } from '../../lib/format';
import { AUTONOMY_LEVELS, LIFECYCLES, LIFECYCLE_LABELS, ORG_ROLES, ORG_ROLE_LABELS } from '../../lib/grc';
import { Button } from '../../components/ui/Button';
import { CheckList } from '../../components/ui/CheckList';
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/Field';
import { Notice, Skeleton } from '../../components/ui/Feedback';
import { SlideOver } from '../../components/ui/Overlay';
import { TagInput } from '../../components/ui/TagInput';
import { useToast } from '../../components/ui/Toast';

interface SystemFormPanelProps {
  workspaceId: string;
  open: boolean;
  /** Kind of the entry being created; ignored when editing. */
  kind: SystemKind;
  /** The entry being edited, or null to create one. */
  system: AiSystem | null;
  onClose: () => void;
  onSaved?: (system: AiSystem) => void;
}

interface ToolDraft {
  key: number;
  name: string;
  description: string;
  write_access: boolean;
}

interface Draft {
  name: string;
  description: string;
  intended_purpose: string;
  business_owner: string;
  org_role: OrgRole;
  lifecycle: Lifecycle;
  uses_personal_data: boolean;
  vendor: string;
  base_model: string;
  deployment: string;
  document_ids: string[];
  tools: ToolDraft[];
  data_sources: string[];
  guardrails: string[];
  autonomy_level: number | null;
  human_oversight: string;
  memory: string;
  kill_switch: string;
  agentic_risks: string[];
}

let toolKey = 1;

function draftFrom(s: AiSystem | null): Draft {
  const card = s?.agent_card ?? null;
  return {
    name: s?.name ?? '',
    description: s?.description ?? '',
    intended_purpose: s?.intended_purpose ?? '',
    business_owner: s?.business_owner ?? '',
    org_role: s?.org_role ?? 'unknown',
    lifecycle: s?.lifecycle ?? 'idea',
    uses_personal_data: s?.uses_personal_data ?? false,
    vendor: s?.vendor ?? '',
    base_model: s?.base_model ?? '',
    deployment: s?.deployment ?? '',
    document_ids: s?.document_ids ?? [],
    tools: (card?.tools ?? []).map((t) => ({
      key: toolKey++,
      name: t.name ?? '',
      description: t.description ?? '',
      write_access: !!t.write_access,
    })),
    data_sources: card?.data_sources ?? [],
    guardrails: card?.guardrails ?? [],
    autonomy_level: card?.autonomy_level ?? null,
    human_oversight: card?.human_oversight ?? '',
    memory: card?.memory ?? '',
    kill_switch: card?.kill_switch ?? '',
    agentic_risks: card?.agentic_risks ?? [],
  };
}

const text = (v: string): string | null => v.trim() || null;

function toInput(kind: SystemKind, d: Draft): SystemInput {
  let agent_card: AgentCard | null = null;
  if (kind === 'agent') {
    const tools: AgentTool[] = d.tools
      .filter((t) => t.name.trim())
      .map((t) => ({ name: t.name.trim(), description: text(t.description), write_access: t.write_access }));
    agent_card = {
      tools,
      data_sources: d.data_sources,
      guardrails: d.guardrails,
      autonomy_level: d.autonomy_level,
      human_oversight: text(d.human_oversight),
      memory: text(d.memory),
      kill_switch: text(d.kill_switch),
      agentic_risks: d.agentic_risks,
    };
  }
  return {
    kind,
    name: d.name.trim(),
    description: text(d.description),
    intended_purpose: text(d.intended_purpose),
    business_owner: text(d.business_owner),
    org_role: d.org_role,
    lifecycle: d.lifecycle,
    uses_personal_data: d.uses_personal_data,
    vendor: text(d.vendor),
    base_model: text(d.base_model),
    deployment: text(d.deployment),
    agent_card,
    document_ids: d.document_ids,
  };
}

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

interface FormProps {
  workspaceId: string;
  kind: SystemKind;
  system: AiSystem | null;
  onClose: () => void;
  onSaved?: (system: AiSystem) => void;
}

function SystemForm({ workspaceId, kind, system, onClose, onSaved }: FormProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [d, setD] = useState<Draft>(() => draftFrom(system));
  const [touched, setTouched] = useState(false);
  const isAgent = kind === 'agent';
  const noun = isAgent ? 'agent' : 'system';

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((old) => ({ ...old, [key]: value }));

  const documents = useQuery({ queryKey: qk.documents(workspaceId), queryFn: () => api.listDocuments(workspaceId) });
  const agenticRisks = useQuery({
    queryKey: qk.agenticRisks,
    queryFn: api.kbAgenticRisks,
    enabled: isAgent,
    staleTime: 5 * 60_000,
  });

  const save = useMutation({
    mutationFn: (body: SystemInput) => (system ? api.updateSystem(workspaceId, system.id, body) : api.createSystem(workspaceId, body)),
    onSuccess: (saved) => {
      qc.setQueryData<AiSystem>(qk.system(workspaceId, saved.id), saved);
      void qc.invalidateQueries({ queryKey: qk.systems(workspaceId) });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(system ? `“${saved.name}” updated` : `“${saved.name}” added to the inventory`);
      onSaved?.(saved);
      onClose();
    },
  });

  const nameError = touched && !d.name.trim() ? 'A name is required.' : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!d.name.trim()) return;
    save.mutate(toInput(kind, d));
  };

  const setTool = (key: number, patch: Partial<ToolDraft>) =>
    set(
      'tools',
      d.tools.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    );

  // Keep ids that are selected but no longer listed (e.g. a deleted document) visible, so they can be unticked.
  const docOptions = [
    ...(documents.data ?? []).map((doc) => ({ id: doc.id, label: doc.filename })),
    ...d.document_ids
      .filter((id) => documents.data && !documents.data.some((doc) => doc.id === id))
      .map((id) => ({ id, label: <span className="font-mono text-xs">{id}</span>, description: 'Not found in this workspace' })),
  ];
  const riskOptions = [
    ...(agenticRisks.data ?? []).map((r) => ({
      id: r.id,
      label: (
        <>
          <span className="font-mono text-xs font-semibold">{r.id}</span> {r.name}
        </>
      ),
      description: r.description,
    })),
    ...d.agentic_risks
      .filter((id) => agenticRisks.data && !agenticRisks.data.some((r) => r.id === id))
      .map((id) => ({ id, label: <span className="font-mono text-xs">{id}</span>, description: 'Not in the knowledge base' })),
  ];

  return (
    <form onSubmit={onSubmit} className="flex min-h-full flex-col" noValidate>
      <div className="flex-1">
        <FormSection title="General">
          <Field label="Name" htmlFor="sys-name" error={nameError}>
            <Input id="sys-name" value={d.name} onChange={(e) => set('name', e.target.value)} autoFocus maxLength={200} placeholder={isAgent ? 'e.g. Customer support agent' : 'e.g. CV screening'} />
          </Field>
          <Field label="Description" htmlFor="sys-description">
            <Textarea id="sys-description" rows={2} value={d.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field
            label="Intended purpose"
            htmlFor="sys-purpose"
            hint="What it is meant to do, for whom and in which context. The classifier relies on this."
          >
            <Textarea id="sys-purpose" rows={3} value={d.intended_purpose} onChange={(e) => set('intended_purpose', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Business owner" htmlFor="sys-owner">
              <Input id="sys-owner" value={d.business_owner} onChange={(e) => set('business_owner', e.target.value)} placeholder="e.g. HR" />
            </Field>
            <Field label="Vendor" htmlFor="sys-vendor">
              <Input id="sys-vendor" value={d.vendor} onChange={(e) => set('vendor', e.target.value)} placeholder="Leave empty if built in-house" />
            </Field>
            <Field label="Role of your organisation" htmlFor="sys-role" hint="Under the EU AI Act">
              <Select id="sys-role" value={d.org_role} onChange={(e) => set('org_role', e.target.value as OrgRole)}>
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ORG_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Lifecycle" htmlFor="sys-lifecycle">
              <Select id="sys-lifecycle" value={d.lifecycle} onChange={(e) => set('lifecycle', e.target.value as Lifecycle)}>
                {LIFECYCLES.map((l) => (
                  <option key={l} value={l}>
                    {LIFECYCLE_LABELS[l]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Deployment" htmlFor="sys-deployment">
            <Input id="sys-deployment" value={d.deployment} onChange={(e) => set('deployment', e.target.value)} placeholder="e.g. SaaS, EU region" />
          </Field>
          {!isAgent && (
            <Field label="Base model" htmlFor="sys-model" hint="The underlying model, if any.">
              <Input id="sys-model" value={d.base_model} onChange={(e) => set('base_model', e.target.value)} placeholder="e.g. provider/model" />
            </Field>
          )}
          <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2.5">
            <div>
              <div className="text-sm font-medium text-fg">Uses personal data</div>
              <div className="text-xs text-muted">Processes data about identifiable people (drives the GDPR screening).</div>
            </div>
            <Switch checked={d.uses_personal_data} onChange={(v) => set('uses_personal_data', v)} label="Uses personal data" />
          </div>
        </FormSection>

        {isAgent && (
          <FormSection title="Agent Card" description="What the agent can do, what it can reach and how it is kept under control.">
            <Field label="Base model" htmlFor="agent-model">
              <Input id="agent-model" value={d.base_model} onChange={(e) => set('base_model', e.target.value)} placeholder="e.g. provider/model" />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-fg">Tools</span>
                <Button
                  size="sm"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => set('tools', [...d.tools, { key: toolKey++, name: '', description: '', write_access: false }])}
                >
                  Add tool
                </Button>
              </div>
              {d.tools.length === 0 ? (
                <p className="rounded-md border border-dashed border-line-strong px-3 py-3 text-center text-xs text-muted">
                  No tools yet. Add each tool or API the agent can call.
                </p>
              ) : (
                <ul className="space-y-2">
                  {d.tools.map((t, i) => (
                    <li key={t.key} className="rounded-md border border-line p-2.5">
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label={`Tool ${i + 1} name`}
                          value={t.name}
                          onChange={(e) => setTool(t.key, { name: e.target.value })}
                          placeholder="Name, e.g. send_email"
                          className="h-8 font-mono text-xs"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove tool ${t.name || i + 1}`}
                          title="Remove tool"
                          className="hover:!text-red-600"
                          onClick={() =>
                            set(
                              'tools',
                              d.tools.filter((x) => x.key !== t.key),
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input
                        aria-label={`Tool ${i + 1} description`}
                        value={t.description}
                        onChange={(e) => setTool(t.key, { description: e.target.value })}
                        placeholder="What it does"
                        className="mt-2 h-8 text-xs"
                      />
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <Switch checked={t.write_access} onChange={(v) => setTool(t.key, { write_access: v })} label={`Write access for tool ${t.name || i + 1}`} />
                        <span className={cn(t.write_access && 'font-medium text-amber-700 dark:text-amber-300')}>
                          {t.write_access ? 'Write access — can change data or act on the outside world' : 'Read-only'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field label="Data sources" htmlFor="agent-sources" hint="Press Enter or comma to add.">
              <TagInput id="agent-sources" value={d.data_sources} onChange={(v) => set('data_sources', v)} placeholder="e.g. CRM" />
            </Field>
            <Field label="Guardrails" htmlFor="agent-guardrails" hint="Press Enter or comma to add.">
              <TagInput id="agent-guardrails" value={d.guardrails} onChange={(v) => set('guardrails', v)} placeholder="e.g. PII filter" />
            </Field>

            <div>
              <div className="mb-1 text-xs font-medium text-fg">Autonomy level</div>
              <div role="radiogroup" aria-label="Autonomy level" className="overflow-hidden rounded-md border border-line-strong">
                {AUTONOMY_LEVELS.map((a) => {
                  const active = d.autonomy_level === a.level;
                  return (
                    <button
                      key={a.level}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set('autonomy_level', a.level)}
                      className={cn(
                        'flex w-full items-center gap-2.5 border-b border-line px-3 py-1.5 text-left text-sm last:border-b-0',
                        active ? 'bg-accent/10 font-medium text-accent-text' : 'text-fg hover:bg-surface2/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                          active ? 'bg-accent text-white' : 'bg-surface2 text-muted',
                        )}
                      >
                        {a.level}
                      </span>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Human oversight" htmlFor="agent-oversight" hint="Who reviews or can intervene, and when.">
              <Textarea id="agent-oversight" rows={2} value={d.human_oversight} onChange={(e) => set('human_oversight', e.target.value)} />
            </Field>
            <Field label="Memory" htmlFor="agent-memory" hint="What the agent remembers between runs, and for how long.">
              <Textarea id="agent-memory" rows={2} value={d.memory} onChange={(e) => set('memory', e.target.value)} />
            </Field>
            <Field label="Kill switch" htmlFor="agent-kill" hint="How the agent is stopped, and by whom.">
              <Textarea id="agent-kill" rows={2} value={d.kill_switch} onChange={(e) => set('kill_switch', e.target.value)} />
            </Field>

            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-medium text-fg">Agentic risks</span>
                <span className="text-xs text-muted">{d.agentic_risks.length} selected</span>
              </div>
              {agenticRisks.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : agenticRisks.isError && riskOptions.length === 0 ? (
                <Notice tone="error">
                  Could not load the agentic risk catalogue: {errorMessage(agenticRisks.error)}{' '}
                  <button type="button" className="font-medium underline" onClick={() => void agenticRisks.refetch()}>
                    Try again
                  </button>
                </Notice>
              ) : riskOptions.length === 0 ? (
                <p className="text-xs text-muted">The knowledge base does not list any agentic risk.</p>
              ) : (
                <CheckList label="Agentic risks" options={riskOptions} value={d.agentic_risks} onChange={(v) => set('agentic_risks', v)} />
              )}
            </div>
          </FormSection>
        )}

        <FormSection title="Linked documents" description={`Evidence from this workspace that describes the ${noun}. The assessment agents read these first.`}>
          <div className="flex items-baseline justify-end">
            <span className="text-xs text-muted">{d.document_ids.length} selected</span>
          </div>
          {documents.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : documents.isError && docOptions.length === 0 ? (
            <Notice tone="error">
              Could not load the documents: {errorMessage(documents.error)}{' '}
              <button type="button" className="font-medium underline" onClick={() => void documents.refetch()}>
                Try again
              </button>
            </Notice>
          ) : docOptions.length === 0 ? (
            <p className="rounded-md border border-dashed border-line-strong px-3 py-3 text-center text-xs text-muted">
              This workspace has no documents yet. Upload them on the Evidence page, then link them here.
            </p>
          ) : (
            <CheckList label="Linked documents" options={docOptions} value={d.document_ids} onChange={(v) => set('document_ids', v)} />
          )}
        </FormSection>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface px-5 py-3">
        {save.isError && (
          <Notice tone="error" className="mb-2">
            Could not save: {errorMessage(save.error)}
          </Notice>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={save.isPending}>
            {system ? 'Save changes' : `Create ${noun}`}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function SystemFormPanel({ workspaceId, open, kind, system, onClose, onSaved }: SystemFormPanelProps) {
  const effectiveKind = system?.kind ?? kind;
  const noun = effectiveKind === 'agent' ? 'agent' : 'AI system';
  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={system ? `Edit ${system.name}` : `New ${noun}`}
      subtitle={effectiveKind === 'agent' ? 'Agent — with an Agent Card' : 'AI system'}
    >
      {/* Remount per entry so the form never shows another entry's values. */}
      <SystemForm key={system?.id ?? `new-${effectiveKind}`} workspaceId={workspaceId} kind={effectiveKind} system={system} onClose={onClose} onSaved={onSaved} />
    </SlideOver>
  );
}
