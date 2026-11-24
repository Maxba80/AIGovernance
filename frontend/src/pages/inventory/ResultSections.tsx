import type { ReactNode } from 'react';
import { Gauge, Scale, ShieldQuestion } from 'lucide-react';
import type { AiSystem, ClassificationResult, GdprResult, NistFunction, NistResult } from '../../lib/api';
import { cn, formatPercent } from '../../lib/format';
import { ORG_ROLE_LABELS } from '../../lib/grc';
import { AiBadge } from '../../components/AiBadge';
import { DecisionPathList, MissingInfoList, RefChip, RiskClassBadge } from '../../components/grc';
import { Badge, type Tone } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Feedback';

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

function YesNo({ value, yesTone = 'grey' }: { value: boolean | null | undefined; yesTone?: Tone }) {
  if (value == null) return <span className="text-muted">—</span>;
  return <Badge tone={value ? yesTone : 'grey'}>{value ? 'Yes' : 'No'}</Badge>;
}

const pendingText = (active: boolean) =>
  active ? 'The agent has not reported this part yet. It appears here as soon as the step finishes.' : 'This run did not produce this result.';

// ---------- Classification ----------

interface ClassificationSectionProps {
  system: AiSystem;
  classification: ClassificationResult | null | undefined;
  model: string | null;
  /** The viewed run is still in progress. */
  active: boolean;
  hasRun: boolean;
}

export function ClassificationSection({ system, classification: c, model, active, hasRun }: ClassificationSectionProps) {
  const manual = system.risk_class_status === 'approved' && system.risk_class != null && system.risk_class !== (c?.approved_class ?? null);
  const approved = c?.approved_class != null;

  return (
    <Card>
      <CardHeader
        title="Classification"
        description="EU AI Act risk class: what the classifier proposed, and what a human approved."
        actions={c && !approved ? <AiBadge model={model} /> : undefined}
      />
      {!c ? (
        system.risk_class && system.risk_class_status === 'approved' ? (
          <div className="space-y-3 p-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Meta label="Approved class">
                <RiskClassBadge value={system.risk_class} status="approved" />
              </Meta>
              <Meta label="Source">Classified manually by a user</Meta>
            </dl>
            {system.risk_class_rationale && (
              <Sub title="Rationale">
                <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{system.risk_class_rationale}</p>
              </Sub>
            )}
          </div>
        ) : (
          <EmptyState
            compact
            icon={<Scale className="h-4 w-4" />}
            title="Not classified yet"
            description={hasRun ? pendingText(active) : 'Run an assessment to get a proposed risk class with its decision path, or classify the entry manually.'}
          />
        )
      ) : (
        <div className="space-y-4 p-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
            <Meta label="Proposed class">
              <RiskClassBadge value={c.risk_class} status={approved ? 'approved' : 'proposed'} />
            </Meta>
            <Meta label="Approved class">
              {approved ? (
                <RiskClassBadge value={c.approved_class} status="approved" />
              ) : (
                <Badge tone="amber" variant="outline">
                  Awaiting a human decision
                </Badge>
              )}
            </Meta>
            <Meta label="Confidence">
              <span className="font-medium tabular-nums">{formatPercent(c.confidence)}</span>
            </Meta>
            <Meta label="In scope of the AI Act">
              <YesNo value={c.in_scope} />
            </Meta>
            <Meta label="Organisation role">{c.org_role ? (ORG_ROLE_LABELS[c.org_role] ?? c.org_role) : '—'}</Meta>
            <Meta label="Annex III point">{c.annex_iii_point ?? '—'}</Meta>
            <Meta label="Prohibited practice">{c.prohibited_practice ?? '—'}</Meta>
            <Meta label="General-purpose AI model">
              <YesNo value={c.gpai} />
            </Meta>
            {approved && (
              <>
                <Meta label="Approved by">{c.approved_by ?? '—'}</Meta>
                <div className="col-span-2 lg:col-span-3">
                  <Meta label="Approval comment">{c.approved_comment ?? '—'}</Meta>
                </div>
              </>
            )}
          </dl>

          {approved && c.risk_class && c.approved_class !== c.risk_class && (
            <p className="text-xs text-muted">The approver chose a different class than the one the classifier proposed.</p>
          )}
          {manual && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface2 px-3 py-2 text-xs text-fg">
              Class currently on record for this entry: <RiskClassBadge value={system.risk_class} status="approved" />
              <span className="text-muted">(set outside this run, e.g. by manual classification)</span>
            </div>
          )}

          <Sub title="Rationale">
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{c.rationale ?? 'No rationale was recorded.'}</p>
          </Sub>

          <Sub title="Decision path">
            <DecisionPathList steps={c.decision_path ?? []} />
          </Sub>

          <MissingInfoList items={c.missing_information ?? []} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Sub title="Transparency obligations">
              {(c.transparency_obligations ?? []).length === 0 ? (
                <p className="text-xs text-muted">None identified.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {c.transparency_obligations.map((t) => (
                    <RefChip key={t}>{t}</RefChip>
                  ))}
                </div>
              )}
            </Sub>
            <Sub title="Art. 6(3) derogation">
              {c.art6_3_derogation ? (
                <div>
                  <Badge tone={c.art6_3_derogation.applies ? 'amber' : 'grey'}>{c.art6_3_derogation.applies ? 'Applies' : 'Does not apply'}</Badge>
                  {c.art6_3_derogation.reason && (
                    <p className="mt-1.5 text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{c.art6_3_derogation.reason}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted">Not assessed.</p>
              )}
            </Sub>
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- GDPR screening ----------

interface ScreeningProps<T> {
  result: T | null | undefined;
  model: string | null;
  active: boolean;
  hasRun: boolean;
}

export function GdprSection({ result: g, model, active, hasRun }: ScreeningProps<GdprResult>) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="GDPR screening" description="Personal data, legal basis and whether a DPIA is needed." actions={g ? <AiBadge model={model} /> : undefined} />
      {!g ? (
        <EmptyState
          compact
          icon={<ShieldQuestion className="h-4 w-4" />}
          title="No GDPR screening yet"
          description={hasRun ? pendingText(active) : 'Produced by the GDPR agent during an assessment run.'}
        />
      ) : (
        <div className="space-y-3 p-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Meta label="Personal data">
              <YesNo value={g.personal_data} yesTone="amber" />
            </Meta>
            <Meta label="Legal basis">{g.legal_basis ?? '—'}</Meta>
            <Meta label="DPIA required">
              <YesNo value={g.dpia_required} yesTone="amber" />
            </Meta>
            <Meta label="Automated decision (Art. 22)">
              <YesNo value={g.automated_decision_art22} yesTone="amber" />
            </Meta>
            <Meta label="Transfers outside the EU">
              <YesNo value={g.transfers_outside_eu} yesTone="amber" />
            </Meta>
          </dl>
          {g.dpia_rationale && (
            <Sub title="DPIA rationale">
              <p className="text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{g.dpia_rationale}</p>
            </Sub>
          )}
          {g.summary && (
            <Sub title="Summary">
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{g.summary}</p>
            </Sub>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- NIST maturity ----------

const NIST_FUNCTIONS: NistFunction[] = ['GOVERN', 'MAP', 'MEASURE', 'MANAGE'];

function maturityFill(v: number): string {
  if (v >= 4) return 'bg-emerald-500';
  if (v >= 2) return 'bg-amber-500';
  return 'bg-red-500';
}

export function NistSection({ result: n, model, active, hasRun }: ScreeningProps<NistResult>) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="NIST maturity" description="AI RMF functions, scored 0–5." actions={n ? <AiBadge model={model} /> : undefined} />
      {!n ? (
        <EmptyState
          compact
          icon={<Gauge className="h-4 w-4" />}
          title="No maturity scores yet"
          description={hasRun ? pendingText(active) : 'Produced by the NIST agent during an assessment run.'}
        />
      ) : (
        <div className="space-y-3 p-4">
          <ul className="space-y-2.5">
            {NIST_FUNCTIONS.map((f) => {
              const raw = n.maturity?.[f];
              const v = typeof raw === 'number' ? Math.max(0, Math.min(5, raw)) : null;
              return (
                <li key={f} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-mono text-xs text-fg">{f}</span>
                  <div
                    className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface2"
                    role="meter"
                    aria-label={`${f} maturity`}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={v ?? 0}
                  >
                    {v != null && <div className={cn('h-full rounded-full', maturityFill(v))} style={{ width: `${(v / 5) * 100}%` }} />}
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">{v != null ? `${Number.isInteger(v) ? v : v.toFixed(1)} / 5` : '—'}</span>
                </li>
              );
            })}
          </ul>
          {n.summary && (
            <Sub title="Summary">
              <p className="whitespace-pre-line text-sm leading-relaxed text-fg [overflow-wrap:anywhere]">{n.summary}</p>
            </Sub>
          )}
        </div>
      )}
    </Card>
  );
}
