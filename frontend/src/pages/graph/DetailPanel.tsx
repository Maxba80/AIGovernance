import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Boxes, FileText, Sparkles, Target, X } from 'lucide-react';
import type { GraphEdge, GraphNode } from '../../lib/api';
import { cn, humanize } from '../../lib/format';
import { COMPLIANCE_FILL, FRAMEWORK_ORDER, complianceLabel, frameworkMeta } from '../../lib/grc';
import { ComplianceStatusBadge, FindingStatusBadge, FrameworkChip, RefChip, RiskClassBadge } from '../../components/grc';
import { RequirementDetail } from '../../components/RequirementDetail';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { frameworkRank, statusOfNode, type GraphModel } from './model';

function Heading({ children }: { children: ReactNode }) {
  return <h3 className="mb-1.5 text-xs font-medium text-muted">{children}</h3>;
}

/** Transparency rule: the graph does not carry the model name, so an unapproved AI output is marked as a proposal. */
function ProposedMark({ what = 'AI proposal' }: { what?: string }) {
  return (
    <span
      title="Produced by an AI agent — not yet approved by a human. Open the item to see the model and its sources."
      className="inline-flex items-center gap-1 rounded border border-dashed border-amber-400 px-1 text-[10px] font-medium leading-4 text-amber-700 dark:border-amber-500/60 dark:text-amber-300"
    >
      <Sparkles className="h-2.5 w-2.5" aria-hidden />
      {what}
    </span>
  );
}

function NodeButton({ node, onSelect, children }: { node: GraphNode; onSelect: (id: string) => void; children?: ReactNode }) {
  const status = statusOfNode(node);
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={cn(
        'flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md border border-line px-2 py-1 text-left hover:bg-surface2/60',
        node.type === 'requirement' && cn('border-l-2', frameworkMeta(node.framework).border),
      )}
    >
      {(node.type === 'requirement' || node.type === 'objective') && (
        <span className={cn('h-2 w-2 shrink-0 rounded-full', COMPLIANCE_FILL[status])} title={complianceLabel(status)} aria-label={complianceLabel(status)} />
      )}
      {node.type === 'document' && <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />}
      {node.type === 'system' && (node.kind === 'agent' ? <Bot className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden /> : <Boxes className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />)}
      {(node.type === 'requirement' || node.type === 'objective') && <span className="font-mono text-[11px] text-fg">{node.id}</span>}
      <span className="min-w-0 flex-1 basis-32 text-xs text-fg [overflow-wrap:anywhere]">{node.type === 'requirement' ? (node.title ?? node.label) : node.label}</span>
      {children}
    </button>
  );
}

function EvidenceLinks({ model, edges, onSelect, empty }: { model: GraphModel; edges: GraphEdge[]; onSelect: (id: string) => void; empty: string }) {
  // One row per document; approved wins over proposed.
  const byDoc = new Map<string, GraphEdge>();
  for (const e of edges) {
    const prev = byDoc.get(e.source);
    if (!prev || (prev.status !== 'approved' && e.status === 'approved')) byDoc.set(e.source, e);
  }
  if (byDoc.size === 0) return <p className="text-xs text-muted">{empty}</p>;
  return (
    <ul className="space-y-1">
      {[...byDoc.values()].map((e) => {
        const doc = model.nodes.get(e.source);
        if (!doc) return null;
        return (
          <li key={e.source}>
            <NodeButton node={doc} onSelect={onSelect}>
              {e.page != null && <span className="text-[11px] text-muted">p. {e.page}</span>}
              {e.status === 'approved' ? <Badge tone="green">Approved</Badge> : <ProposedMark what="Proposed tag" />}
            </NodeButton>
          </li>
        );
      })}
    </ul>
  );
}

function RequirementBody({ model, node, onSelect }: { model: GraphModel; node: GraphNode; onSelect: (id: string) => void }) {
  const objectives = model.reqObjectives.get(node.id) ?? [];
  const evidence = [...objectives.flatMap((o) => model.targetEvidence.get(o.id) ?? []), ...(model.targetEvidence.get(node.id) ?? [])];
  const findings = [...(model.reqFindings.get(node.id) ?? [])].sort((a, b) => (a.status ?? '').localeCompare(b.status ?? '') * -1);
  const gaps = findings.filter((f) => f.status === 'gap' || f.status === 'partial');

  return (
    <>
      <div className="space-y-4 border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <ComplianceStatusBadge status={node.status} />
          <span className="text-xs text-muted">Status in this workspace</span>
        </div>
        <div>
          <Heading>Evidence (through its control objectives)</Heading>
          <EvidenceLinks model={model} edges={evidence} onSelect={onSelect} empty="No document is tagged to an objective of this requirement." />
        </div>
        <div>
          <Heading>
            Gaps and findings{gaps.length > 0 ? ` — ${gaps.length} open` : ''}
          </Heading>
          {findings.length === 0 ? (
            <p className="text-xs text-muted">No system has a finding on this requirement.</p>
          ) : (
            <ul className="space-y-1">
              {findings.map((f, i) => {
                const sys = model.nodes.get(f.source);
                if (!sys) return null;
                return (
                  <li key={`${f.source}-${i}`}>
                    <NodeButton node={sys} onSelect={onSelect}>
                      <FindingStatusBadge status={f.status ?? ''} />
                      {f.review_status === 'proposed' && <ProposedMark />}
                      {f.origin === 'crosswalk' && <span className="text-[10px] text-muted" title="Inferred through the crosswalk — not assessed directly">crosswalk</span>}
                    </NodeButton>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <RequirementDetail
        key={node.id}
        requirementRef={node.id}
        onNavigate={onSelect}
        relatedHeading="Also satisfies"
        statusOf={(ref) => (model.nodes.has(ref) ? statusOfNode(model.nodes.get(ref)) : undefined)}
      />
    </>
  );
}

function ObjectiveBody({ model, node, onSelect }: { model: GraphModel; node: GraphNode; onSelect: (id: string) => void }) {
  const links = model.objRequirements.get(node.id) ?? [];
  const reqs = links.map((l) => ({ link: l, node: model.nodes.get(l.id) })).filter((x): x is { link: (typeof links)[number]; node: GraphNode } => !!x.node);
  const frameworks = [...new Set(reqs.map((r) => r.node.framework ?? ''))].sort((a, b) => frameworkRank(a) - frameworkRank(b));
  const evidence = model.targetEvidence.get(node.id) ?? [];
  const count = (s: string) => reqs.filter((r) => statusOfNode(r.node) === s).length;
  const gaps = count('gap');
  const partial = count('partial');
  const notAssessed = count('not_assessed');
  const proposedEvidence = evidence.filter((e) => e.status !== 'approved').length;
  const approvedEvidence = evidence.filter((e) => e.status === 'approved').length;
  const proposedFindings = reqs.flatMap((r) => model.reqFindings.get(r.node.id) ?? []).filter((f) => f.review_status === 'proposed').length;

  const actions: Array<{ text: string; to: string; label: string }> = [];
  if (gaps > 0) actions.push({ text: `Close ${gaps} gap${gaps === 1 ? '' : 's'}: one fix here counts for every framework that maps to this objective.`, to: '/frameworks/iso-42001?view=nonconformities', label: 'Record a corrective action' });
  if (partial > 0) actions.push({ text: `Complete ${partial} partially met requirement${partial === 1 ? '' : 's'}.`, to: '/inventory', label: 'Open the findings' });
  if (proposedEvidence + proposedFindings > 0) actions.push({ text: `Review ${proposedEvidence + proposedFindings} AI proposal${proposedEvidence + proposedFindings === 1 ? '' : 's'} waiting for a human decision.`, to: '/evidence?tab=approvals', label: 'Open the approval queue' });
  if (approvedEvidence === 0) actions.push({ text: 'Upload a document that evidences this objective and approve its tag.', to: '/evidence', label: 'Open the evidence library' });
  if (notAssessed > 0) actions.push({ text: `Run an assessment so that ${notAssessed} requirement${notAssessed === 1 ? ' is' : 's are'} checked against the evidence.`, to: '/inventory', label: 'Open the inventory' });

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RefChip>{node.id}</RefChip>
          <ComplianceStatusBadge status={node.status} />
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-fg [overflow-wrap:anywhere]">{node.label}</h2>
        <p className="mt-1 text-xs text-muted">
          Common control objective — {reqs.length} requirement{reqs.length === 1 ? '' : 's'} in {frameworks.length} framework{frameworks.length === 1 ? '' : 's'} are met by the same
          controls.
        </p>
      </div>

      <div>
        <Heading>Requirements by framework</Heading>
        {reqs.length === 0 ? (
          <p className="text-xs text-muted">No requirement is mapped to this objective.</p>
        ) : (
          <div className="space-y-3">
            {frameworks.map((fw) => (
              <div key={fw}>
                <FrameworkChip id={fw} />
                <ul className="mt-1.5 space-y-1">
                  {reqs
                    .filter((r) => (r.node.framework ?? '') === fw)
                    .sort((a, b) => a.node.id.localeCompare(b.node.id, undefined, { numeric: true }))
                    .map((r) => (
                      <li key={r.node.id}>
                        <NodeButton node={r.node} onSelect={onSelect}>
                          {r.link.strength === 'supporting' && <span className="text-[10px] text-muted">supporting</span>}
                        </NodeButton>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Heading>Documents</Heading>
        <EvidenceLinks model={model} edges={evidence} onSelect={onSelect} empty="No document is tagged to this objective yet." />
      </div>

      <div>
        <Heading>Typical actions</Heading>
        {actions.length === 0 ? (
          <p className="text-xs text-muted">Nothing is open for this objective.</p>
        ) : (
          <ul className="space-y-1.5">
            {actions.map((a, i) => (
              <li key={i} className="rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs text-fg">
                {a.text}{' '}
                <Link to={a.to} className="inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-accent-text hover:underline">
                  {a.label} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 text-[11px] text-muted">Derived from the status of this objective in the workspace.</p>
      </div>
    </div>
  );
}

function DocumentBody({ model, node, onSelect }: { model: GraphModel; node: GraphNode; onSelect: (id: string) => void }) {
  const edges = model.docEvidence.get(node.id) ?? [];
  const byTarget = new Map<string, GraphEdge>();
  for (const e of edges) {
    const prev = byTarget.get(e.target);
    if (!prev || (prev.status !== 'approved' && e.status === 'approved')) byTarget.set(e.target, e);
  }
  const docId = node.id.replace(/^doc:/, '');
  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
          <h2 className="min-w-0 text-base font-semibold leading-snug text-fg [overflow-wrap:anywhere]">{node.label}</h2>
        </div>
        <p className="mt-1 text-xs text-muted">Evidence document{node.doc_type ? ` · ${humanize(node.doc_type)}` : ''}</p>
        <Link to={`/evidence?doc=${encodeURIComponent(docId)}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
          Open the document <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        <Heading>Evidences these control objectives</Heading>
        {byTarget.size === 0 ? (
          <p className="text-xs text-muted">This document is not tagged to any objective.</p>
        ) : (
          <ul className="space-y-1">
            {[...byTarget.values()].map((e) => {
              const target = model.nodes.get(e.target);
              if (!target) return null;
              const reqCount = (model.objRequirements.get(e.target) ?? []).length;
              return (
                <li key={e.target}>
                  <NodeButton node={target} onSelect={onSelect}>
                    {e.page != null && <span className="text-[11px] text-muted">p. {e.page}</span>}
                    {target.type === 'objective' && <span className="text-[11px] tabular-nums text-muted">{reqCount} req.</span>}
                    {e.status === 'approved' ? <Badge tone="green">Approved</Badge> : <ProposedMark what="Proposed tag" />}
                  </NodeButton>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SystemBody({ model, node, onSelect }: { model: GraphModel; node: GraphNode; onSelect: (id: string) => void }) {
  const findings = model.sysFindings.get(node.id) ?? [];
  const systemId = node.id.replace(/^sys:/, '');
  const groups = ['gap', 'partial', 'compliant']
    .map((status) => ({ status, items: findings.filter((f) => f.status === status) }))
    .filter((g) => g.items.length > 0);
  const frameworks = (items: GraphEdge[]) =>
    [...new Set(items.map((f) => model.nodes.get(f.target)?.framework ?? ''))].sort((a, b) => FRAMEWORK_ORDER.indexOf(a) - FRAMEWORK_ORDER.indexOf(b));

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <div className="flex items-center gap-2">
          {node.kind === 'agent' ? <Bot className="h-4 w-4 shrink-0 text-muted" aria-hidden /> : <Boxes className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
          <h2 className="min-w-0 text-base font-semibold leading-snug text-fg [overflow-wrap:anywhere]">{node.label}</h2>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="indigo">{node.kind === 'agent' ? 'Agent' : 'AI system'}</Badge>
          <RiskClassBadge value={node.risk_class} />
        </div>
        <Link to={`/inventory/${encodeURIComponent(systemId)}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline">
          Open the system <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        <Heading>Findings on requirements ({findings.length})</Heading>
        {groups.length === 0 ? (
          <p className="text-xs text-muted">No finding links this system to a requirement yet. Run an assessment from its page.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.status}>
                <div className="flex items-center gap-1.5">
                  <FindingStatusBadge status={g.status} />
                  <span className="text-xs tabular-nums text-muted">{g.items.length}</span>
                </div>
                {frameworks(g.items).map((fw) => (
                  <ul key={fw} className="mt-1.5 space-y-1">
                    {g.items
                      .filter((f) => (model.nodes.get(f.target)?.framework ?? '') === fw)
                      .map((f, i) => {
                        const req = model.nodes.get(f.target);
                        if (!req) return null;
                        return (
                          <li key={`${f.target}-${i}`}>
                            <NodeButton node={req} onSelect={onSelect}>
                              {f.review_status === 'proposed' && <ProposedMark />}
                              {f.origin === 'crosswalk' && <span className="text-[10px] text-muted" title="Inferred through the crosswalk — not assessed directly">crosswalk</span>}
                            </NodeButton>
                          </li>
                        );
                      })}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailPanelProps {
  model: GraphModel;
  /** A node id, or a requirement reference that is not a node of the graph. */
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, string> = { objective: 'Control objective', requirement: 'Requirement', document: 'Document', system: 'System' };

export function DetailPanel({ model, selectedId, onSelect, onClose }: DetailPanelProps) {
  const node = model.nodes.get(selectedId);
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col rounded-lg border border-line bg-surface" aria-label="Details">
      <header className="flex items-center justify-between gap-2 border-b border-line px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted">
          <Target className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{node ? TYPE_LABELS[node.type] : 'Requirement (not in the graph)'}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details" className="-mr-2">
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!node ? (
          // Related requirements that belong to no control objective are not nodes: show the knowledge-base entry alone.
          <RequirementDetail key={selectedId} requirementRef={selectedId} onNavigate={onSelect} relatedHeading="Also satisfies" />
        ) : node.type === 'requirement' ? (
          <RequirementBody model={model} node={node} onSelect={onSelect} />
        ) : node.type === 'objective' ? (
          <ObjectiveBody model={model} node={node} onSelect={onSelect} />
        ) : node.type === 'document' ? (
          <DocumentBody model={model} node={node} onSelect={onSelect} />
        ) : (
          <SystemBody model={model} node={node} onSelect={onSelect} />
        )}
      </div>
    </aside>
  );
}
