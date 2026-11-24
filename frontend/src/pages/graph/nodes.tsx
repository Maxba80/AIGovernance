import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Bot, Boxes, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { ComplianceStatus, GraphNode } from '../../lib/api';
import { cn } from '../../lib/format';
import { COMPLIANCE_FILL, complianceLabel, frameworkMeta, riskClassLabel } from '../../lib/grc';

export type FlowNodeData = {
  node: GraphNode;
  selected: boolean;
  dim: boolean;
  /** Objectives only. */
  expanded?: boolean;
  requirementCount?: number;
  onToggle?: (id: string) => void;
};

export type FlowNode = Node<FlowNodeData>;

/** Node fill and border by status: green compliant, amber partial, red gap, indigo evidence present, grey not assessed. */
const STATUS_BOX: Record<ComplianceStatus, string> = {
  compliant: 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-950',
  partial: 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950',
  gap: 'border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-950',
  evidence_present: 'border-indigo-300 bg-indigo-50 dark:border-indigo-500/60 dark:bg-indigo-950',
  not_applicable: 'border-line-strong bg-surface2',
  not_assessed: 'border-line-strong bg-surface',
};

/** Hex colours for SVG (edges, minimap), matching the Tailwind status colours. */
export const STATUS_HEX: Record<ComplianceStatus, string> = {
  compliant: '#10b981',
  partial: '#f59e0b',
  gap: '#ef4444',
  evidence_present: '#818cf8',
  not_applicable: '#94a3b8',
  not_assessed: '#cbd5e1',
};

function statusOf(n: GraphNode): ComplianceStatus {
  return (n.status ?? 'not_assessed') as ComplianceStatus;
}

const HANDLE = '!h-1 !w-1 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0';

/** Invisible connection points on both sides; edges choose the side that faces their other end. */
function Handles() {
  return (
    <>
      <Handle id="l-t" type="target" position={Position.Left} isConnectable={false} className={HANDLE} />
      <Handle id="l-s" type="source" position={Position.Left} isConnectable={false} className={HANDLE} />
      <Handle id="r-t" type="target" position={Position.Right} isConnectable={false} className={HANDLE} />
      <Handle id="r-s" type="source" position={Position.Right} isConnectable={false} className={HANDLE} />
    </>
  );
}

function frame(d: FlowNodeData): string {
  return cn('h-full w-full cursor-pointer border transition-opacity', d.selected && 'ring-2 ring-accent ring-offset-1 ring-offset-bg', d.dim && 'opacity-20');
}

export const ObjectiveNode = memo(function ObjectiveNode({ data }: NodeProps<FlowNode>) {
  const n = data.node;
  const status = statusOf(n);
  return (
    <div className={cn(frame(data), 'flex items-center gap-2 rounded-lg border-2 px-2.5 shadow-sm', STATUS_BOX[status])} title={`${n.id} — ${n.label}\n${complianceLabel(status)}`}>
      <Handles />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', COMPLIANCE_FILL[status])} aria-hidden />
          <span className="font-mono text-[11px] font-semibold text-fg">{n.id}</span>
          <span className="text-[10px] tabular-nums text-muted">{data.requirementCount ?? 0} req.</span>
        </div>
        <div className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-fg">{n.label}</div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          data.onToggle?.(n.id);
        }}
        aria-label={data.expanded ? `Collapse ${n.id}` : `Expand ${n.id}`}
        title={data.expanded ? 'Hide its requirements' : 'Show its requirements'}
        className="nodrag nopan flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line-strong bg-surface text-muted hover:text-fg"
      >
        {data.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
});

export const RequirementNode = memo(function RequirementNode({ data }: NodeProps<FlowNode>) {
  const n = data.node;
  const status = statusOf(n);
  const fw = frameworkMeta(n.framework);
  return (
    <div
      className={cn(frame(data), 'flex items-center gap-1.5 rounded border-l-4 px-1.5', STATUS_BOX[status], fw.border)}
      title={`${n.id} — ${n.title ?? ''}\n${fw.label} · ${complianceLabel(status)}`}
    >
      <Handles />
      <span className="shrink-0 whitespace-nowrap font-mono text-[11px] font-medium text-fg">{n.label}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted">{n.title}</span>
    </div>
  );
});

export const DocumentNode = memo(function DocumentNode({ data }: NodeProps<FlowNode>) {
  const n = data.node;
  return (
    <div className={cn(frame(data), 'flex items-center gap-1.5 rounded-full border-indigo-300 bg-surface px-3 dark:border-indigo-500/50')} title={`${n.label}${n.doc_type ? `\n${n.doc_type.replace(/_/g, ' ')}` : ''}`}>
      <Handles />
      <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs text-fg">{n.label}</span>
    </div>
  );
});

export const SystemNode = memo(function SystemNode({ data }: NodeProps<FlowNode>) {
  const n = data.node;
  const Icon = n.kind === 'agent' ? Bot : Boxes;
  return (
    <div className={cn(frame(data), 'flex items-center gap-2 rounded-md border-2 border-slate-500 bg-surface px-2 dark:border-slate-400')} title={`${n.label}\n${riskClassLabel(n.risk_class)}`}>
      <Handles />
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-600 text-white dark:bg-slate-300 dark:text-slate-900">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium leading-tight text-fg">{n.label}</span>
        <span className="block truncate text-[10px] leading-tight text-muted">{riskClassLabel(n.risk_class)}</span>
      </span>
    </div>
  );
});

export const NODE_TYPES = {
  objective: ObjectiveNode,
  requirement: RequirementNode,
  document: DocumentNode,
  system: SystemNode,
};
