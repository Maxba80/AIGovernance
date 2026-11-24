import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage, qk, type AiSystem, type RiskClass } from '../../lib/api';
import { LIFECYCLE_LABELS, ORG_ROLE_LABELS, RISK_CLASSES, autonomyLabel, isRiskClass, riskClassLabel } from '../../lib/grc';
import { useInvalidateGovernance } from '../../lib/invalidate';
import { RefChip } from '../../components/grc';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Field, Select, Textarea } from '../../components/ui/Field';
import { Notice } from '../../components/ui/Feedback';
import { Dialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';

function Meta({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-sm text-fg [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

const dash = (v: string | null | undefined) => v || '—';

// ---------- Profile ----------

export function ProfilePanel({ workspaceId, system }: { workspaceId: string; system: AiSystem }) {
  const linked = system.document_ids ?? [];
  const documents = useQuery({
    queryKey: qk.documents(workspaceId),
    queryFn: () => api.listDocuments(workspaceId),
    enabled: linked.length > 0,
  });
  const nameOf = (id: string) => documents.data?.find((d) => d.id === id)?.filename ?? null;

  return (
    <Card className="flex flex-col">
      <CardHeader title="Profile" description="What was registered in the inventory. The agents use it as context." />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-4">
        <Meta label="Description" wide>
          {dash(system.description)}
        </Meta>
        <Meta label="Intended purpose" wide>
          {dash(system.intended_purpose)}
        </Meta>
        <Meta label="Business owner">{dash(system.business_owner)}</Meta>
        <Meta label="Vendor">{dash(system.vendor)}</Meta>
        <Meta label="Organisation role">{system.org_role ? (ORG_ROLE_LABELS[system.org_role] ?? system.org_role) : '—'}</Meta>
        <Meta label="Lifecycle">{system.lifecycle ? (LIFECYCLE_LABELS[system.lifecycle] ?? system.lifecycle) : '—'}</Meta>
        <Meta label="Deployment">{dash(system.deployment)}</Meta>
        <Meta label="Uses personal data">
          {system.uses_personal_data == null ? '—' : <Badge tone={system.uses_personal_data ? 'amber' : 'grey'}>{system.uses_personal_data ? 'Yes' : 'No'}</Badge>}
        </Meta>
        {system.kind !== 'agent' && <Meta label="Base model">{system.base_model ? <span className="font-mono text-xs">{system.base_model}</span> : '—'}</Meta>}
        <Meta label={`Linked documents (${linked.length})`} wide>
          {linked.length === 0 ? (
            <span className="text-muted">None linked. Edit the entry to link evidence from this workspace.</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {linked.map((id) => (
                <Badge key={id} tone="grey" className="max-w-full" title={nameOf(id) ?? id}>
                  <span className="truncate">{nameOf(id) ?? (documents.isLoading ? 'Loading…' : `${id.slice(0, 8)}…`)}</span>
                </Badge>
              ))}
            </span>
          )}
        </Meta>
      </dl>
    </Card>
  );
}

// ---------- Agent Card ----------

export function AgentCardPanel({ system }: { system: AiSystem }) {
  const card = system.agent_card;
  const riskIds = card?.agentic_risks ?? [];
  const catalogue = useQuery({
    queryKey: qk.agenticRisks,
    queryFn: api.kbAgenticRisks,
    enabled: riskIds.length > 0,
    staleTime: 5 * 60_000,
  });
  const riskName = (id: string) => catalogue.data?.find((r) => r.id === id)?.name ?? null;
  const tools = card?.tools ?? [];
  const writeTools = tools.filter((t) => t.write_access).length;

  return (
    <Card className="flex flex-col">
      <CardHeader title="Agent Card" description="What the agent can do, what it can reach and how it is kept under control." />
      {!card ? (
        <p className="p-4 text-sm text-muted">No Agent Card has been filled in yet. Edit the agent to add one.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-4">
          <Meta label="Base model">{system.base_model ? <span className="font-mono text-xs">{system.base_model}</span> : '—'}</Meta>
          <Meta label="Autonomy level">{autonomyLabel(card.autonomy_level)}</Meta>
          <Meta label={`Tools (${tools.length}${writeTools > 0 ? `, ${writeTools} with write access` : ''})`} wide>
            {tools.length === 0 ? (
              '—'
            ) : (
              <ul className="space-y-1">
                {tools.map((t, i) => (
                  <li key={`${t.name}-${i}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <RefChip>{t.name}</RefChip>
                    <Badge tone={t.write_access ? 'amber' : 'grey'}>{t.write_access ? 'Write access' : 'Read-only'}</Badge>
                    {t.description && <span className="min-w-0 text-xs text-muted">{t.description}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Meta>
          <Meta label="Data sources">
            {(card.data_sources ?? []).length === 0 ? (
              '—'
            ) : (
              <span className="flex flex-wrap gap-1">
                {card.data_sources.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </span>
            )}
          </Meta>
          <Meta label="Guardrails">
            {(card.guardrails ?? []).length === 0 ? (
              '—'
            ) : (
              <span className="flex flex-wrap gap-1">
                {card.guardrails.map((g) => (
                  <Badge key={g} tone="green" variant="outline">
                    {g}
                  </Badge>
                ))}
              </span>
            )}
          </Meta>
          <Meta label="Human oversight" wide>
            {dash(card.human_oversight)}
          </Meta>
          <Meta label="Memory">{dash(card.memory)}</Meta>
          <Meta label="Kill switch">{dash(card.kill_switch)}</Meta>
          <Meta label="Agentic risks" wide>
            {riskIds.length === 0 ? (
              '—'
            ) : (
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {riskIds.map((id) => (
                  <span key={id} className="inline-flex items-baseline gap-1.5">
                    <RefChip>{id}</RefChip>
                    {riskName(id) && <span className="text-xs text-muted">{riskName(id)}</span>}
                  </span>
                ))}
              </span>
            )}
          </Meta>
        </dl>
      )}
    </Card>
  );
}

// ---------- Manual classification ----------

interface ClassifyDialogProps {
  workspaceId: string;
  system: AiSystem;
  open: boolean;
  onClose: () => void;
}

function ClassifyForm({ workspaceId, system, onClose }: Omit<ClassifyDialogProps, 'open'>) {
  const qc = useQueryClient();
  const toast = useToast();
  const invalidate = useInvalidateGovernance(workspaceId);
  const [riskClass, setRiskClass] = useState<RiskClass | ''>(system.risk_class ?? '');
  const [rationale, setRationale] = useState('');
  const [touched, setTouched] = useState(false);

  const save = useMutation({
    mutationFn: (body: { risk_class: RiskClass; rationale: string }) => api.setRiskClass(workspaceId, system.id, body),
    onSuccess: (saved) => {
      qc.setQueryData<AiSystem>(qk.system(workspaceId, saved.id), saved);
      invalidate();
      toast.success(`Classified as ${riskClassLabel(saved.risk_class)}`);
      onClose();
    },
  });

  const classError = touched && !riskClass ? 'Choose a risk class.' : null;
  const rationaleError = touched && !rationale.trim() ? 'Explain why this class applies — it is recorded in the audit trail.' : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!riskClass || !rationale.trim()) return;
    save.mutate({ risk_class: riskClass, rationale: rationale.trim() });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <Notice>
        Your classification is stored as <span className="font-medium">approved</span> and recorded in the audit trail under your name. It replaces
        any class proposed by the classifier.
      </Notice>
      <Field label="Risk class" htmlFor="classify-class" error={classError}>
        <Select id="classify-class" value={riskClass} onChange={(e) => setRiskClass(isRiskClass(e.target.value) ? e.target.value : '')}>
          <option value="" disabled>
            Choose a class…
          </option>
          {RISK_CLASSES.map((c) => (
            <option key={c} value={c}>
              {riskClassLabel(c)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Rationale" htmlFor="classify-rationale" error={rationaleError}>
        <Textarea id="classify-rationale" rows={4} value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="e.g. Used to rank job applicants — Annex III, point 4(a)." />
      </Field>
      {save.isError && <Notice tone="error">Could not save the classification: {errorMessage(save.error)}</Notice>}
      <div className="flex justify-end gap-2 pt-1">
        <Button onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={save.isPending}>
          Save classification
        </Button>
      </div>
    </form>
  );
}

export function ClassifyDialog({ workspaceId, system, open, onClose }: ClassifyDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Classify manually" description={`Set the EU AI Act risk class of “${system.name}” yourself.`}>
      <ClassifyForm workspaceId={workspaceId} system={system} onClose={onClose} />
    </Dialog>
  );
}
