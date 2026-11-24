import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ListTree, Pencil, Plus, Server, Trash2 } from 'lucide-react';
import { api, errorMessage, qk, type LlmSettings, type Provider } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Field';
import { EmptyState, Notice } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';
import { ProviderDialog } from './ProviderDialog';

const KIND_LABELS: Record<Provider['kind'], string> = { openai_compatible: 'OpenAI-compatible', anthropic: 'Anthropic' };

interface RowProps {
  provider: Provider;
  presetName: string;
  needsKey: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ProviderRow({ provider, presetName, needsKey, onEdit, onDelete }: RowProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [showModels, setShowModels] = useState(false);

  // Loaded on demand; the result also feeds the model suggestions under "Model routing".
  const models = useQuery({
    queryKey: qk.models(provider.id),
    queryFn: () => api.providerModels(provider.id),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  const toggle = useMutation({
    // PUT takes the full provider; `api_key` is omitted so the stored key is kept.
    mutationFn: (enabled: boolean) =>
      api.updateProvider(provider.id, {
        name: provider.name,
        kind: provider.kind,
        preset: provider.preset,
        base_url: provider.base_url,
        enabled,
      }),
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: qk.llm });
      toast.success(`${p.name} ${p.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (err) => toast.error(`Could not update the provider: ${errorMessage(err)}`),
  });

  const list = models.data?.models ?? [];

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-fg">{provider.name}</span>
            <Badge tone="grey">{presetName}</Badge>
            <span className="text-xs text-muted">{KIND_LABELS[provider.kind] ?? provider.kind}</span>
          </div>
          <div className="mt-0.5 truncate font-mono text-[11px] text-muted" title={provider.base_url ?? undefined}>
            {provider.base_url ?? 'Default endpoint'}
          </div>
        </div>
        {provider.has_api_key ? (
          <Badge tone="green" withDot>
            <KeyRound className="h-3 w-3" /> Key stored
          </Badge>
        ) : needsKey ? (
          <Badge tone="amber" withDot>
            API key missing
          </Badge>
        ) : (
          <Badge tone="grey">No key needed</Badge>
        )}
        <div className="flex items-center gap-2 text-xs text-muted">
          <Switch
            checked={provider.enabled}
            onChange={(v) => toggle.mutate(v)}
            disabled={toggle.isPending}
            label={provider.enabled ? `Disable ${provider.name}` : `Enable ${provider.name}`}
          />
          <span className="w-14">{provider.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            icon={<ListTree className="h-3.5 w-3.5" />}
            loading={models.isFetching}
            onClick={() => {
              setShowModels(true);
              void models.refetch();
            }}
          >
            Load models
          </Button>
          <Button size="icon" variant="ghost" aria-label={`Edit ${provider.name}`} title="Edit" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" aria-label={`Delete ${provider.name}`} title="Delete" className="hover:!text-red-600" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showModels && !models.isFetching && (models.isError || models.data) && (
        <div className="mt-2.5">
          {models.isError ? (
            <Notice tone="error">
              <span className="font-medium">Could not load models from this provider.</span> {errorMessage(models.error)}
            </Notice>
          ) : list.length === 0 ? (
            <Notice>The provider is reachable but returned no models.</Notice>
          ) : (
            <div className="rounded-md border border-line bg-bg p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                <span>
                  {list.length} model{list.length === 1 ? '' : 's'} available — offered as suggestions under Model routing
                </span>
                <button type="button" className="hover:text-fg" onClick={() => setShowModels(false)}>
                  Hide
                </button>
              </div>
              <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
                {list.map((m) => (
                  <span key={m} className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] text-fg">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function ProvidersSection({ settings }: { settings: LlmSettings }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [dialog, setDialog] = useState<{ provider: Provider | null } | null>(null);
  const [toDelete, setToDelete] = useState<Provider | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProvider(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.llm });
      toast.success('Provider deleted');
      setToDelete(null);
    },
  });

  const presetOf = (p: Provider) => settings.presets.find((x) => x.preset === p.preset);

  return (
    <section id="providers" className="scroll-mt-20">
      <Card>
        <CardHeader
          title="AI providers"
          description="Local runtimes (Ollama, LM Studio, vLLM) or hosted APIs. API keys are write-only: they are stored by the server and never shown again."
          actions={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setDialog({ provider: null })}>
              Add provider
            </Button>
          }
        />
        {settings.providers.length === 0 ? (
          <EmptyState
            icon={<Server className="h-4 w-4" />}
            title="No AI provider configured"
            description="Add a provider, then choose the reasoning and embedding models below. Without them documents can be uploaded but not embedded, tagged or searched."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setDialog({ provider: null })}>
                Add provider
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {settings.providers.map((p) => (
              <ProviderRow
                key={p.id}
                provider={p}
                presetName={presetOf(p)?.name ?? p.preset}
                needsKey={presetOf(p)?.needs_api_key ?? false}
                onEdit={() => setDialog({ provider: p })}
                onDelete={() => {
                  remove.reset();
                  setToDelete(p);
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      {dialog && <ProviderDialog provider={dialog.provider} presets={settings.presets} onClose={() => setDialog(null)} />}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="Delete provider"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        message={
          <>
            Delete <span className="font-medium">{toDelete?.name}</span> and its stored API key? Any model routing that uses this provider will stop
            working until you choose another one.
          </>
        }
      />
    </section>
  );
}
