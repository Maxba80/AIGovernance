import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, ChevronsDownUp, ChevronsUpDown, Maximize2, Search, Waypoints } from 'lucide-react';
import { api, qk, type ComplianceGraph, type ComplianceStatus, type GraphEdge, type GraphNode, type Workspace } from '../../lib/api';
import { cn } from '../../lib/format';
import { COMPLIANCE_FILL, COMPLIANCE_LABELS, COMPLIANCE_STATUSES, FRAMEWORK_ORDER, frameworkMeta, statusCount } from '../../lib/grc';
import { usePrefs } from '../../lib/prefs';
import { Button } from '../../components/ui/Button';
import { Card, PageHeader } from '../../components/ui/Card';
import { Input, Select, Switch } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { DetailPanel } from './DetailPanel';
import { computeLayout, isLeftFramework, type Box } from './layout';
import { buildModel, connectedTo, isTentativeFinding, statusOfNode, worstFinding, type GraphModel } from './model';
import { NODE_TYPES, STATUS_HEX, type FlowNode } from './nodes';

const EDGE_GREY = '#94a3b8';
const EVIDENCE_GREEN = '#10b981';
const FINDING_HEX: Record<string, string> = { gap: '#ef4444', partial: '#f59e0b', compliant: '#10b981' };

const FRAMEWORK_ON: Record<string, string> = {
  'eu-ai-act': 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-500/10 dark:text-blue-300',
  gdpr: 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500/60 dark:bg-violet-500/10 dark:text-violet-300',
  'iso-42001': 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-500/60 dark:bg-teal-500/10 dark:text-teal-300',
  'nist-ai-rmf': 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/10 dark:text-orange-300',
};

interface Scene {
  nodes: FlowNode[];
  edges: Edge[];
  boxes: Map<string, Box>;
  requirementsShown: number;
}

interface SceneInput {
  model: GraphModel;
  frameworks: Set<string>;
  status: ComplianceStatus | '';
  onlyGaps: boolean;
  expanded: Set<string>;
  selected: string | null;
  onToggle: (id: string) => void;
}

function buildScene({ model, frameworks, status, onlyGaps, expanded, selected, onToggle }: SceneInput): Scene {
  const passes = (n: GraphNode) => {
    const s = statusOfNode(n);
    return frameworks.has(n.framework ?? '') && (!status || s === status) && (!onlyGaps || s === 'gap');
  };
  const passing = new Set(model.requirements.filter(passes).map((n) => n.id));
  const filteringStatus = !!status || onlyGaps;

  // With a status filter, keep the objectives that match it themselves or hold a matching requirement.
  const objectives = model.objectives.filter((o) => {
    if (!filteringStatus) return true;
    const s = statusOfNode(o);
    const own = (!status || s === status) && (!onlyGaps || s === 'gap');
    return own || (model.objRequirements.get(o.id) ?? []).some((r) => passing.has(r.id));
  });
  const objectiveIds = objectives.map((o) => o.id);
  const visibleObjectives = new Set(objectiveIds);

  const requirementIds = new Set<string>();
  for (const id of passing) {
    if ((model.reqObjectives.get(id) ?? []).some((o) => expanded.has(o.id) && visibleObjectives.has(o.id))) requirementIds.add(id);
  }

  const boxes = computeLayout({
    model,
    objectiveIds,
    requirementIds,
    expanded,
    documentIds: model.documents.map((d) => d.id),
    systemIds: model.systems.map((s) => s.id),
  });

  const highlight = selected && model.nodes.has(selected) ? connectedTo(model, selected) : null;
  const isDim = (id: string) => highlight !== null && !highlight.has(id);

  const nodes: FlowNode[] = [];
  for (const [id, box] of boxes) {
    const node = model.nodes.get(id);
    if (!node) continue;
    nodes.push({
      id,
      type: node.type,
      position: { x: box.x, y: box.y },
      width: box.w,
      height: box.h,
      draggable: false,
      connectable: false,
      zIndex: node.type === 'objective' ? 2 : 1,
      data: {
        node,
        selected: selected === id,
        dim: isDim(id),
        ...(node.type === 'objective'
          ? {
              expanded: expanded.has(id),
              requirementCount: (model.objRequirements.get(id) ?? []).filter((r) => passing.has(r.id)).length,
              onToggle,
            }
          : {}),
      },
    });
  }

  const edges: Edge[] = [];
  const pushEdge = (key: string, source: string, target: string, sourceHandle: string, targetHandle: string, color: string, dashed: boolean, width: number) => {
    const lit = highlight !== null && highlight.has(source) && highlight.has(target);
    const dim = highlight !== null && !lit;
    edges.push({
      id: key,
      source,
      target,
      sourceHandle,
      targetHandle,
      focusable: false,
      selectable: false,
      zIndex: lit ? 1 : 0,
      style: { stroke: color, strokeWidth: lit ? width + 1 : width, strokeDasharray: dashed ? '5 4' : undefined, opacity: dim ? 0.07 : lit ? 1 : 0.75 },
    });
  };

  // belongs_to: requirement → objective, thin; dashed when the link is only supporting.
  for (const reqId of requirementIds) {
    const left = isLeftFramework(model.nodes.get(reqId)?.framework);
    for (const o of model.reqObjectives.get(reqId) ?? []) {
      if (!visibleObjectives.has(o.id)) continue;
      pushEdge(`b:${reqId}>${o.id}`, reqId, o.id, left ? 'r-s' : 'l-s', left ? 'l-t' : 'r-t', EDGE_GREY, o.strength === 'supporting', 1);
    }
  }

  // evidence: document → objective, green; dashed while the tag is only proposed. One edge per pair.
  const evidence = new Map<string, GraphEdge>();
  for (const d of model.documents) {
    for (const e of model.docEvidence.get(d.id) ?? []) {
      if (!boxes.has(e.target)) continue;
      const key = `e:${e.source}>${e.target}`;
      const prev = evidence.get(key);
      if (!prev || (prev.status !== 'approved' && e.status === 'approved')) evidence.set(key, e);
    }
  }
  for (const [key, e] of evidence) pushEdge(key, e.source, e.target, 'r-s', 'l-t', EVIDENCE_GREEN, e.status !== 'approved', 1.5);

  // finding: system → requirement, coloured by status; dashed when proposed or inferred through the crosswalk.
  // While a requirement is folded into its objective, its findings are drawn as one edge to that objective.
  const findings = new Map<string, { source: string; target: string; statuses: string[]; tentative: boolean[] }>();
  for (const s of model.systems) {
    for (const f of model.sysFindings.get(s.id) ?? []) {
      if (!passing.has(f.target)) continue;
      const targets = requirementIds.has(f.target)
        ? [f.target]
        : (model.reqObjectives.get(f.target) ?? []).filter((o) => visibleObjectives.has(o.id)).map((o) => o.id);
      for (const target of targets) {
        const key = `f:${f.source}>${target}`;
        const entry = findings.get(key) ?? { source: f.source, target, statuses: [], tentative: [] };
        entry.statuses.push(f.status ?? '');
        entry.tentative.push(isTentativeFinding(f));
        findings.set(key, entry);
      }
    }
  }
  for (const [key, f] of findings) {
    const worst = worstFinding(f.statuses);
    pushEdge(key, f.source, f.target, 'l-s', 'r-t', FINDING_HEX[worst] ?? EDGE_GREY, f.tentative.every(Boolean), 1.5);
  }

  return { nodes, edges, boxes, requirementsShown: requirementIds.size };
}

// ---------- Canvas ----------

/** A request to bring a node into view; `frame` lists the nodes to fit around it (just itself: centre it). */
interface Focus {
  id: string;
  frame: string[];
  n: number;
}

interface CanvasProps {
  scene: Scene;
  focus: Focus | null;
  fitSignal: number;
  onSelect: (id: string) => void;
  onClear: () => void;
}

function Canvas({ scene, focus, fitSignal, onSelect, onClear }: CanvasProps) {
  const flow = useReactFlow<FlowNode, Edge>();
  const { theme } = usePrefs();
  const boxesRef = useRef(scene.boxes);
  boxesRef.current = scene.boxes;

  // Bring a picked node into view once the layout that contains it is rendered: an objective is framed together
  // with its unfolded requirements; anything else is centred at a readable zoom.
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => {
      const box = boxesRef.current.get(focus.id);
      if (!box) return;
      if (focus.frame.length > 1) {
        void flow.fitView({ nodes: focus.frame.filter((id) => boxesRef.current.has(id)).map((id) => ({ id })), padding: 0.15, maxZoom: 1, duration: 400 });
      } else {
        void flow.setCenter(box.x + box.w / 2, box.y + box.h / 2, { zoom: Math.max(flow.getZoom(), 0.85), duration: 400 });
      }
    }, 160);
    return () => window.clearTimeout(t);
  }, [focus, flow]);

  useEffect(() => {
    if (fitSignal === 0) return;
    const t = window.setTimeout(() => void flow.fitView({ padding: 0.08, duration: 300 }), 60);
    return () => window.clearTimeout(t);
  }, [fitSignal, flow]);

  return (
    <ReactFlow<FlowNode, Edge>
      nodes={scene.nodes}
      edges={scene.edges}
      nodeTypes={NODE_TYPES}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={onClear}
      fitView
      fitViewOptions={{ padding: 0.08 }}
      minZoom={0.1}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      onlyRenderVisibleElements={scene.nodes.length > 150}
      forceColorMode={theme}
    >
      <Background gap={24} size={1} />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeStrokeWidth={2}
        nodeColor={(n) => {
          const node = (n as FlowNode).data.node;
          return node.type === 'document' ? '#a5b4fc' : node.type === 'system' ? '#64748b' : STATUS_HEX[statusOfNode(node)];
        }}
        style={{ width: 150, height: 100 }}
      />
    </ReactFlow>
  );
}

// ---------- Toolbar pieces ----------

function LegendLine({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <svg width="22" height="6" aria-hidden>
        <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} />
      </svg>
      {label}
    </span>
  );
}

interface SearchBoxProps {
  model: GraphModel;
  onPick: (id: string) => void;
}

function SearchBox({ model, onPick }: SearchBoxProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const q = text.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    const out: GraphNode[] = [];
    for (const n of model.nodes.values()) {
      const hay = `${n.id.replace(/^(doc|sys):.*/, '')} ${n.label} ${n.title ?? ''}`.toLowerCase();
      if (hay.includes(q)) out.push(n);
      if (out.length >= 40) break;
    }
    // Exact reference matches first, then shorter labels.
    return out
      .sort((a, b) => Number(b.id.toLowerCase() === q) - Number(a.id.toLowerCase() === q) || Number(b.id.toLowerCase().includes(q)) - Number(a.id.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [model, q]);

  const pick = (id: string) => {
    onPick(id);
    setOpen(false);
    setText('');
  };

  return (
    <div className="relative w-56">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].id);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Find ref, title or document"
        aria-label="Search the graph"
        className="h-8 pl-8 text-xs"
      />
      {open && q.length >= 2 && (
        <div className="absolute left-0 top-full z-30 mt-1 w-80 max-w-[80vw] rounded-lg border border-line bg-surface p-1 shadow-panel" role="listbox">
          {results.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-muted">Nothing in the graph matches “{text.trim()}”.</p>
          ) : (
            results.map((n) => (
              <button
                key={n.id}
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(n.id)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-surface2"
              >
                <span className="w-16 shrink-0 text-[10px] uppercase tracking-wide text-muted">{n.type === 'requirement' ? frameworkMeta(n.framework).label : n.type}</span>
                {(n.type === 'requirement' || n.type === 'objective') && <span className="shrink-0 font-mono text-[11px] text-fg">{n.id}</span>}
                <span className="min-w-0 flex-1 truncate text-fg">{n.type === 'requirement' ? n.title : n.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Page ----------

function GraphView({ graph }: { graph: ComplianceGraph }) {
  const model = useMemo(() => buildModel(graph), [graph]);
  const [frameworks, setFrameworks] = useState<Set<string>>(() => new Set(FRAMEWORK_ORDER));
  const [status, setStatus] = useState<ComplianceStatus | ''>('');
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [fitSignal, setFitSignal] = useState(0);
  const [confirmExpand, setConfirmExpand] = useState(false);

  // Frameworks present in the data that are not one of the four known ones stay switched on.
  const frameworkIds = useMemo(() => {
    const extra = [...new Set(model.requirements.map((r) => r.framework ?? ''))].filter((f) => !FRAMEWORK_ORDER.includes(f));
    return [...FRAMEWORK_ORDER, ...extra];
  }, [model]);
  const activeFrameworks = useMemo(() => new Set([...frameworks, ...frameworkIds.filter((f) => !FRAMEWORK_ORDER.includes(f))]), [frameworks, frameworkIds]);

  const allExpanded = model.objectives.length > 0 && model.objectives.every((o) => expanded.has(o.id));

  const toggleObjective = useCallback((id: string) => {
    setExpanded((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /** Select a node; a requirement or objective also unfolds what is needed to see it, and filters that hide it are lifted. */
  const select = useCallback(
    (id: string, centre = false) => {
      const node = model.nodes.get(id);
      setSelected(id);
      if (!node) return;
      if (node.type === 'objective') {
        setExpanded((old) => (old.has(id) ? old : new Set(old).add(id)));
      } else if (node.type === 'requirement') {
        const objectiveIds = (model.reqObjectives.get(id) ?? []).map((o) => o.id);
        setExpanded((old) => (objectiveIds.every((o) => old.has(o)) ? old : new Set([...old, ...objectiveIds])));
        setFrameworks((old) => (old.has(node.framework ?? '') || !FRAMEWORK_ORDER.includes(node.framework ?? '') ? old : new Set(old).add(node.framework ?? '')));
        const s = statusOfNode(node);
        setStatus((old) => (old && old !== s ? '' : old));
        setOnlyGaps((old) => (old && s !== 'gap' ? false : old));
      }
      if (centre) {
        const frame = node.type === 'objective' ? [id, ...(model.objRequirements.get(id) ?? []).map((r) => r.id)] : [id];
        setFocus((f) => ({ id, frame, n: (f?.n ?? 0) + 1 }));
      }
    },
    [model],
  );

  const scene = useMemo(
    () => buildScene({ model, frameworks: activeFrameworks, status, onlyGaps, expanded, selected, onToggle: toggleObjective }),
    [model, activeFrameworks, status, onlyGaps, expanded, selected, toggleObjective],
  );

  const expandAll = () => {
    setExpanded(new Set(model.objectives.map((o) => o.id)));
    setConfirmExpand(false);
    setFitSignal((n) => n + 1);
  };
  const collapseAll = () => {
    setExpanded(new Set());
    setConfirmExpand(false);
    setFitSignal((n) => n + 1);
  };

  const counts = graph.counts;
  const total = model.requirements.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Card className="shrink-0 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Frameworks">
            {frameworkIds
              .filter((f) => FRAMEWORK_ORDER.includes(f))
              .map((f) => {
                const on = frameworks.has(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFrameworks((old) => {
                        const next = new Set(old);
                        if (next.has(f)) next.delete(f);
                        else next.add(f);
                        return next;
                      })
                    }
                    title={on ? `Hide ${frameworkMeta(f).label}` : `Show ${frameworkMeta(f).label}`}
                    className={cn('h-7 rounded-md border px-2 text-xs font-medium', on ? FRAMEWORK_ON[f] : 'border-line bg-transparent text-muted line-through hover:text-fg')}
                  >
                    {frameworkMeta(f).label}
                  </button>
                );
              })}
          </div>
          <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as ComplianceStatus | '')} className="h-8 w-auto text-xs">
            <option value="">All statuses</option>
            {COMPLIANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {COMPLIANCE_LABELS[s]}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-xs text-fg">
            <Switch checked={onlyGaps} onChange={setOnlyGaps} label="Only gaps" />
            Only gaps
          </label>
          <SearchBox model={model} onPick={(id) => select(id, true)} />
          <div className="ml-auto flex items-center gap-1.5">
            {allExpanded || expanded.size > 0 ? (
              <Button size="sm" icon={<ChevronsDownUp className="h-3.5 w-3.5" />} onClick={collapseAll} title="Hide all requirement nodes">
                Collapse
              </Button>
            ) : null}
            {!allExpanded && (
              <Button size="sm" icon={<ChevronsUpDown className="h-3.5 w-3.5" />} onClick={() => setConfirmExpand(true)} title="Show the requirements of every objective">
                Expand all
              </Button>
            )}
            <Button size="sm" icon={<Maximize2 className="h-3.5 w-3.5" />} onClick={() => setFitSignal((n) => n + 1)}>
              Fit view
            </Button>
          </div>
        </div>

        {confirmExpand && (
          <Notice tone="warning" className="mt-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 basis-64">
                <span className="font-medium">This is dense.</span> Expanding everything draws all {total} requirements and their links at once. Expanding single
                objectives, or filtering first, is easier to read.
              </span>
              <Button size="sm" onClick={() => setConfirmExpand(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={expandAll}>
                Expand all {total}
              </Button>
            </div>
          </Notice>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 text-[11px] text-muted">
          <dl className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Requirements by status">
            {COMPLIANCE_STATUSES.filter((s) => s !== 'not_applicable' || statusCount(counts, s) > 0).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-sm', COMPLIANCE_FILL[s])} aria-hidden />
                <dt>{COMPLIANCE_LABELS[s]}</dt>
                <dd className="font-medium tabular-nums text-fg">{statusCount(counts, s)}</dd>
              </div>
            ))}
          </dl>
          <span className="hidden h-3 w-px bg-line-strong lg:block" aria-hidden />
          <LegendLine color={EDGE_GREY} label="belongs to" />
          <LegendLine color={EDGE_GREY} dashed label="supporting" />
          <LegendLine color={EVIDENCE_GREEN} label="evidence" />
          <LegendLine color={FINDING_HEX.gap} label="finding (by status)" />
          <LegendLine color={FINDING_HEX.partial} dashed label="proposed / crosswalk" />
          <span className="ml-auto tabular-nums">
            {scene.requirementsShown} of {total} requirements shown
          </span>
        </div>
      </Card>

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-line bg-bg">
          <ReactFlowProvider>
            <Canvas scene={scene} focus={focus} fitSignal={fitSignal} onSelect={(id) => select(id, true)} onClear={() => setSelected(null)} />
          </ReactFlowProvider>
          {scene.requirementsShown === 0 && !selected && (
            <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-md border border-line bg-surface/95 px-3 py-2 text-xs text-muted shadow-sm">
              <span className="font-medium text-fg">Click a control objective</span> to unfold its requirements in the four frameworks. Click any node to highlight what it is
              connected to; click the background to clear.
            </div>
          )}
        </div>
        {selected && <DetailPanel model={model} selectedId={selected} onSelect={(id) => select(id, true)} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

function GraphContent({ workspace }: { workspace: Workspace }) {
  const graph = useQuery({ queryKey: qk.graph(workspace.id), queryFn: () => api.graph(workspace.id) });

  if (graph.isLoading) {
    return (
      <Card>
        <SkeletonRows rows={8} />
      </Card>
    );
  }
  if (graph.isError || !graph.data) {
    return (
      <Card>
        <ErrorState error={graph.error} title="Could not load the compliance graph" onRetry={() => void graph.refetch()} />
      </Card>
    );
  }
  if ((graph.data.nodes ?? []).length === 0) {
    return (
      <Card>
        <EmptyState icon={<Waypoints className="h-4 w-4" />} title="The graph is empty" description="The server returned no control objective or requirement." />
      </Card>
    );
  }
  return <GraphView graph={graph.data} />;
}

export function GraphPage() {
  return (
    // Fills the viewport below the top bar, so the canvas stays usable at 1280×800.
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 48px)', minHeight: 540 }}>
      <PageHeader
        title="Compliance Graph"
        description="Assess once, comply many: requirements of the four frameworks meet in common control objectives, with their evidence and systems."
      />
      <WorkspaceGate>{(workspace) => <GraphContent key={workspace.id} workspace={workspace} />}</WorkspaceGate>
    </div>
  );
}
