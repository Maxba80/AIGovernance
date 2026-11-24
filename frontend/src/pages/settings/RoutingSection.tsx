import { useEffect, useId, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FlaskConical, ListTree, XCircle } from 'lucide-react';
import {
  api,
  errorMessage,
  qk,
  type LlmSettings,
  type ModelRef,
  type PresetInfo,
  type Provider,
  type Routing,
  type RoutingUpdate,
  type TestKind,
  type TestResult,
} from '../../lib/api';
import { useWorkspace } from '../../lib/workspace';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';

/** Editable form of a routing slot; an empty provider means "not set". */
interface Slot {
  provider_id: string;
  model: string;
}

interface Draft {
  reasoning: Slot;
  embedding: Slot;
  agents: Record<string, Slot>;
}

interface ReindexNotice {
  required: boolean;
  documents_affected: number | null;
}

const NO_REINDEX: ReindexNotice = { required: false, documents_affected: null };

const REINDEX_KEY = ['reindex-notice'] as const;

const toSlot = (ref: ModelRef | null | undefined): Slot => ({ provider_id: ref?.provider_id ?? '', model: ref?.model ?? '' });
const toRef = (slot: Slot): ModelRef | null =>
  slot.provider_id && slot.model.trim() ? { provider_id: slot.provider_id, model: slot.model.trim() } : null;
const sameRef = (a: ModelRef | null | undefined, b: ModelRef | null | undefined) =>
  (a?.provider_id ?? '') === (b?.provider_id ?? '') && (a?.model ?? '') === (b?.model ?? '');
const incomplete = (slot: Slot) => !!slot.provider_id && !slot.model.trim();

function draftFrom(routing: Routing, roleIds: string[]): Draft {
  const agents: Record<string, Slot> = {};
  for (const id of roleIds) agents[id] = toSlot(routing.agents?.[id]);
  return { reasoning: toSlot(routing.reasoning), embedding: toSlot(routing.embedding), agents };
}

type TestState = { status: 'running' } | { status: 'done'; result: TestResult } | { status: 'error'; message: string };

interface RoutingRowProps {
  label: string;
  description: string;
  kind: TestKind;
  slot: Slot;
  onChange: (slot: Slot) => void;
  providers: Provider[];
  presets: PresetInfo[];
  /** Label of the empty option, e.g. "Not set" or "Use the Reasoning model". */
  emptyLabel: string;
}

function RoutingRow({ label, description, kind, slot, onChange, providers, presets, emptyLabel }: RoutingRowProps) {
  const listId = useId();
  const [test, setTest] = useState<TestState | null>(null);
  const provider = providers.find((p) => p.id === slot.provider_id);

  // Models loaded from the provider (shared with the "Load models" button under AI providers).
  const models = useQuery({
    queryKey: qk.models(slot.provider_id),
    queryFn: () => api.providerModels(slot.provider_id),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  const suggestions = useMemo(() => {
    const preset = presets.find((p) => p.preset === provider?.preset);
    const suggested = preset?.suggested_models?.[kind === 'embedding' ? 'embedding' : 'reasoning'] ?? [];
    return [...new Set([...suggested, ...(models.data?.models ?? [])])];
  }, [presets, provider?.preset, kind, models.data]);

  const runTest = async () => {
    const ref = toRef(slot);
    if (!ref) return;
    setTest({ status: 'running' });
    try {
      const result = await api.testModel({ ...ref, kind });
      setTest({ status: 'done', result });
    } catch (err) {
      setTest({ status: 'error', message: errorMessage(err) });
    }
  };

  const update = (next: Slot) => {
    setTest(null);
    onChange(next);
  };

  const ok = test?.status === 'done' && test.result.ok;

  return (
    <div className="px-4 py-3.5">
      <div className="grid grid-cols-1 items-start gap-x-4 gap-y-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
        <div className="min-w-0">
          <div className="text-sm font-medium text-fg">{label}</div>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
        <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Select
            aria-label={`${label}: provider`}
            className="w-44 shrink-0"
            value={slot.provider_id}
            onChange={(e) => update({ provider_id: e.target.value, model: e.target.value ? slot.model : '' })}
          >
            <option value="">{emptyLabel}</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.enabled ? '' : ' (disabled)'}
              </option>
            ))}
            {slot.provider_id && !provider && <option value={slot.provider_id}>Unknown provider</option>}
          </Select>
          <Input
            aria-label={`${label}: model`}
            list={listId}
            className="min-w-[160px] flex-1 font-mono text-xs"
            value={slot.model}
            disabled={!slot.provider_id}
            onChange={(e) => update({ ...slot, model: e.target.value })}
            placeholder={slot.provider_id ? 'Model id' : '—'}
            spellCheck={false}
            autoComplete="off"
          />
          <datalist id={listId}>
            {suggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <Button
            size="icon"
            aria-label={`${label}: load models from the provider`}
            title="Load models from the provider"
            disabled={!slot.provider_id}
            loading={models.isFetching}
            onClick={() => void models.refetch()}
          >
            {!models.isFetching && <ListTree className="h-3.5 w-3.5" />}
          </Button>
          <Button
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            disabled={!toRef(slot)}
            loading={test?.status === 'running'}
            onClick={() => void runTest()}
          >
            Test
          </Button>
        </div>

      <div className="mt-2 space-y-1.5 empty:hidden">
        {incomplete(slot) && <p className="text-xs text-amber-700 dark:text-amber-300">Enter a model id for this provider.</p>}
        {provider && !provider.enabled && <p className="text-xs text-amber-700 dark:text-amber-300">This provider is disabled.</p>}
        {models.isError && !models.isFetching && (
          <p className="text-xs text-red-600 dark:text-red-400">Could not load models: {errorMessage(models.error)}</p>
        )}
        {test?.status === 'done' && (
          <div
            role="status"
            className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}
          >
            <span className="inline-flex items-center gap-1 font-medium">
              {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {ok ? 'Test passed' : 'Test failed'}
            </span>
            {test.result.latency_ms != null && <span className="tabular-nums">{Math.round(test.result.latency_ms)} ms</span>}
            {test.result.dimensions != null && <span className="tabular-nums">{test.result.dimensions} dimensions</span>}
            {test.result.detail && <span className="min-w-0 break-words text-muted">{test.result.detail}</span>}
          </div>
        )}
        {test?.status === 'error' && (
          <p className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
            <XCircle className="h-3.5 w-3.5" /> Test could not run: {test.message}
          </p>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}

export function RoutingSection({ settings }: { settings: LlmSettings }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { current } = useWorkspace();
  const { routing, providers, presets, agent_roles: roles } = settings;
  const roleIds = useMemo(() => roles.map((r) => r.id), [roles]);

  const serverKey = JSON.stringify([routing, roleIds]);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(routing, roleIds));
  // Re-sync when the saved routing changes on the server (not on every background refetch).
  useEffect(() => {
    setDraft(draftFrom(routing, roleIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  // Kept in the query cache so the notice survives moving between pages.
  const noticeState = useQuery<ReindexNotice>({
    queryKey: REINDEX_KEY,
    queryFn: () => NO_REINDEX,
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  }).data;
  const notice = noticeState?.required ? noticeState : null;

  const changes = useMemo(() => {
    const body: RoutingUpdate = {};
    const reasoning = toRef(draft.reasoning);
    const embedding = toRef(draft.embedding);
    if (!sameRef(reasoning, routing.reasoning)) body.reasoning = reasoning;
    if (!sameRef(embedding, routing.embedding)) body.embedding = embedding;
    const agentsChanged = roleIds.some((id) => !sameRef(toRef(draft.agents[id] ?? toSlot(null)), routing.agents?.[id]));
    if (agentsChanged) {
      // Send every role so the result is the same whether the server merges or replaces `agents`.
      const agents: Record<string, ModelRef | null> = {};
      for (const id of roleIds) agents[id] = toRef(draft.agents[id] ?? toSlot(null));
      body.agents = agents;
    }
    return body;
  }, [draft, routing, roleIds]);

  const dirty = Object.keys(changes).length > 0;
  const invalid = incomplete(draft.reasoning) || incomplete(draft.embedding) || roleIds.some((id) => incomplete(draft.agents[id] ?? toSlot(null)));

  const save = useMutation({
    mutationFn: () => api.updateRouting(changes),
    onSuccess: (res) => {
      const { reindex_required, documents_affected, ...saved } = res;
      qc.setQueryData<LlmSettings>(qk.llm, (old) => (old ? { ...old, routing: { ...old.routing, ...saved } } : old));
      void qc.invalidateQueries({ queryKey: qk.llm });
      if (reindex_required) qc.setQueryData<ReindexNotice>(REINDEX_KEY, { required: true, documents_affected: documents_affected ?? null });
      toast.success('Model routing saved');
    },
  });

  const reindex = useMutation({
    mutationFn: (wid: string) => api.reindex(wid),
    onSuccess: (res, wid) => {
      qc.setQueryData<ReindexNotice>(REINDEX_KEY, NO_REINDEX);
      void qc.invalidateQueries({ queryKey: qk.documents(wid) });
      void qc.invalidateQueries({ queryKey: qk.jobs(wid) });
      toast.success(`${res.queued} document${res.queued === 1 ? '' : 's'} queued for re-indexing`);
    },
  });

  const setAgent = (id: string, slot: Slot) => setDraft((d) => ({ ...d, agents: { ...d.agents, [id]: slot } }));

  return (
    <section id="routing" className="scroll-mt-20">
      <Card>
        <CardHeader
          title="Model routing"
          description="Which provider and model each task uses. Agents without their own model use the Reasoning model."
        />

        {notice && (
          <div className="border-b border-line p-4">
            <Notice tone="warning">
              <div className="flex flex-wrap items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">Re-index required: the embedding model changed.</div>
                  <div className="mt-0.5">
                    {notice.documents_affected != null
                      ? `${notice.documents_affected} document${notice.documents_affected === 1 ? ' was' : 's were'} embedded with the previous model. `
                      : 'Existing documents were embedded with the previous model. '}
                    Search will not match them correctly until they are re-embedded.
                    {current
                      ? ` “Re-index now” re-embeds the documents of the current workspace (${current.name}); repeat it in any other workspace.`
                      : ' Select a workspace to re-index its documents.'}
                  </div>
                  {reindex.isError && <div className="mt-1 font-medium">Re-index failed: {errorMessage(reindex.error)}</div>}
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!current}
                  loading={reindex.isPending}
                  onClick={() => current && reindex.mutate(current.id)}
                >
                  Re-index now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => qc.setQueryData<ReindexNotice>(REINDEX_KEY, NO_REINDEX)}>
                  Dismiss
                </Button>
              </div>
            </Notice>
          </div>
        )}

        {providers.length === 0 && (
          <div className="border-b border-line p-4">
            <Notice>Add an AI provider above before choosing models.</Notice>
          </div>
        )}

        <div className="divide-y divide-line">
          <RoutingRow
            label="Reasoning"
            description="Default chat model for analysis and for any agent without its own model."
            kind="chat"
            slot={draft.reasoning}
            onChange={(s) => setDraft((d) => ({ ...d, reasoning: s }))}
            providers={providers}
            presets={presets}
            emptyLabel="Not set"
          />
          <RoutingRow
            label="Embedding"
            description="Turns passages into vectors for search. Changing it requires re-indexing existing documents."
            kind="embedding"
            slot={draft.embedding}
            onChange={(s) => setDraft((d) => ({ ...d, embedding: s }))}
            providers={providers}
            presets={presets}
            emptyLabel="Not set"
          />
          {roles.length > 0 && (
            <div className="bg-surface2/50 px-4 py-2 text-xs text-muted">
              <span className="font-medium text-fg">Agents ({roles.length})</span> — optional per-agent overrides. An agent left on “Use the Reasoning
              model” follows the Reasoning model above.
            </div>
          )}
          {roles.map((role) => (
            <RoutingRow
              key={role.id}
              label={`Agent: ${role.label}`}
              description={role.description}
              kind="chat"
              slot={draft.agents[role.id] ?? toSlot(null)}
              onChange={(s) => setAgent(role.id, s)}
              providers={providers}
              presets={presets}
              emptyLabel="Use the Reasoning model"
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-4 py-3">
          {save.isError && (
            <Notice tone="error" className="min-w-0 flex-1">
              Could not save: {errorMessage(save.error)}
            </Notice>
          )}
          {dirty && !save.isError && <span className="text-xs text-muted">Unsaved changes</span>}
          <Button disabled={!dirty || save.isPending} onClick={() => setDraft(draftFrom(routing, roleIds))}>
            Reset
          </Button>
          <Button variant="primary" disabled={!dirty || invalid} loading={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
        </div>
      </Card>
    </section>
  );
}
