import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage, qk, type PresetInfo, type Provider, type ProviderInput, type ProviderKind, type ProviderPreset } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Switch } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Feedback';
import { Dialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';

interface ProviderDialogProps {
  /** `null` to add a provider. */
  provider: Provider | null;
  presets: PresetInfo[];
  onClose: () => void;
}

export function ProviderDialog({ provider, presets, onClose }: ProviderDialogProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const editing = provider !== null;
  const first = presets[0];

  const [preset, setPreset] = useState<ProviderPreset>(provider?.preset ?? first?.preset ?? 'custom');
  const [name, setName] = useState(provider?.name ?? first?.name ?? '');
  const [kind, setKind] = useState<ProviderKind>(provider?.kind ?? first?.kind ?? 'openai_compatible');
  const [baseUrl, setBaseUrl] = useState(provider?.base_url ?? first?.base_url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [enabled, setEnabled] = useState(provider?.enabled ?? true);

  const info = presets.find((p) => p.preset === preset);
  const needsKey = info?.needs_api_key ?? false;
  const hasStoredKey = editing && provider.has_api_key;

  // Choosing a preset fills kind, name and base URL; whether a key is needed follows from the preset.
  const choosePreset = (value: ProviderPreset) => {
    const next = presets.find((p) => p.preset === value);
    const previous = presets.find((p) => p.preset === preset);
    setPreset(value);
    if (!next) return;
    setKind(next.kind);
    setBaseUrl(next.base_url ?? '');
    if (!name.trim() || name === previous?.name) setName(next.name);
  };

  const save = useMutation({
    mutationFn: () => {
      const body: ProviderInput = {
        name: name.trim(),
        kind,
        preset,
        base_url: baseUrl.trim() || null,
        enabled,
      };
      // Contract: omit `api_key` to keep the stored key, send "" to clear it.
      if (apiKey) body.api_key = apiKey;
      else if (editing && clearKey) body.api_key = '';
      return editing ? api.updateProvider(provider.id, body) : api.createProvider(body);
    },
    onSuccess: (p) => {
      void qc.invalidateQueries({ queryKey: qk.llm });
      void qc.removeQueries({ queryKey: qk.models(p.id) });
      toast.success(editing ? `${p.name} updated` : `${p.name} added`);
      onClose();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) save.mutate();
  };

  const missingKey = needsKey && !apiKey && (!hasStoredKey || clearKey);

  return (
    <Dialog open onClose={onClose} title={editing ? `Edit ${provider.name}` : 'Add AI provider'}>
      <form onSubmit={submit} className="space-y-4" autoComplete="off">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Preset" htmlFor="prov-preset">
            <Select id="prov-preset" value={preset} onChange={(e) => choosePreset(e.target.value as ProviderPreset)}>
              {presets.map((p) => (
                <option key={p.preset} value={p.preset}>
                  {p.name}
                </option>
              ))}
              {!presets.some((p) => p.preset === preset) && <option value={preset}>{preset}</option>}
            </Select>
          </Field>
          <Field label="API type" htmlFor="prov-kind">
            <Select id="prov-kind" value={kind} onChange={(e) => setKind(e.target.value as ProviderKind)}>
              <option value="openai_compatible">OpenAI-compatible</option>
              <option value="anthropic">Anthropic</option>
            </Select>
          </Field>
        </div>

        <Field label="Name" htmlFor="prov-name">
          <Input id="prov-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
        </Field>

        <Field label="Base URL" htmlFor="prov-url" hint="Leave empty to use the provider's default endpoint.">
          <Input
            id="prov-url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={info?.base_url ?? 'https://…'}
            className="font-mono text-xs"
            spellCheck={false}
          />
        </Field>

        <Field
          label={needsKey ? 'API key' : 'API key (optional for this preset)'}
          htmlFor="prov-key"
          hint={
            hasStoredKey
              ? 'Key stored. It is never displayed; leave this empty to keep it, or type a new key to replace it.'
              : 'The key is sent once to the server and is never displayed again.'
          }
        >
          <Input
            id="prov-key"
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (e.target.value) setClearKey(false);
            }}
            placeholder={hasStoredKey ? 'Key stored' : needsKey ? 'Paste the API key' : 'Not required'}
            autoComplete="new-password"
            disabled={clearKey}
            className="font-mono text-xs"
          />
        </Field>
        {hasStoredKey && (
          <label className="-mt-2 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={clearKey}
              onChange={(e) => {
                setClearKey(e.target.checked);
                if (e.target.checked) setApiKey('');
              }}
              className="h-3.5 w-3.5 accent-indigo-600"
            />
            Remove the stored key
          </label>
        )}
        {missingKey && <Notice tone="warning">This preset normally needs an API key. You can save without one, but calls to the provider will fail.</Notice>}

        <div className="flex items-center gap-2.5">
          <Switch checked={enabled} onChange={setEnabled} label="Enabled" />
          <span className="text-sm text-fg">Enabled</span>
          <span className="text-xs text-muted">Disabled providers are kept but not used.</span>
        </div>

        {save.isError && <Notice tone="error">{errorMessage(save.error)}</Notice>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={save.isPending} disabled={!name.trim()}>
            {editing ? 'Save changes' : 'Add provider'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
