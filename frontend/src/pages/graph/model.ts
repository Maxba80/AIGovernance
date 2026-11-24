import type { ComplianceGraph, ComplianceStatus, GraphEdge, GraphNode } from '../../lib/api';
import { FRAMEWORK_ORDER } from '../../lib/grc';

/** Lookups over the graph payload, built once per response. */
export interface GraphModel {
  nodes: Map<string, GraphNode>;
  objectives: GraphNode[];
  requirements: GraphNode[];
  documents: GraphNode[];
  systems: GraphNode[];
  /** requirement → its objectives (belongs_to). */
  reqObjectives: Map<string, Array<{ id: string; strength: string }>>;
  /** objective → its requirements. */
  objRequirements: Map<string, Array<{ id: string; strength: string }>>;
  /** objective (or any evidence target) → evidence edges. */
  targetEvidence: Map<string, GraphEdge[]>;
  /** document → evidence edges. */
  docEvidence: Map<string, GraphEdge[]>;
  /** requirement → finding edges. */
  reqFindings: Map<string, GraphEdge[]>;
  /** system → finding edges. */
  sysFindings: Map<string, GraphEdge[]>;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function buildModel(graph: ComplianceGraph): GraphModel {
  const nodes = new Map<string, GraphNode>();
  for (const n of graph.nodes ?? []) nodes.set(n.id, n);
  const m: GraphModel = {
    nodes,
    objectives: [],
    requirements: [],
    documents: [],
    systems: [],
    reqObjectives: new Map(),
    objRequirements: new Map(),
    targetEvidence: new Map(),
    docEvidence: new Map(),
    reqFindings: new Map(),
    sysFindings: new Map(),
  };
  for (const n of nodes.values()) {
    if (n.type === 'objective') m.objectives.push(n);
    else if (n.type === 'requirement') m.requirements.push(n);
    else if (n.type === 'document') m.documents.push(n);
    else if (n.type === 'system') m.systems.push(n);
  }
  for (const e of graph.edges ?? []) {
    if (!nodes.has(e.source) || !nodes.has(e.target)) continue;
    if (e.type === 'belongs_to') {
      const strength = e.strength ?? 'primary';
      push(m.reqObjectives, e.source, { id: e.target, strength });
      push(m.objRequirements, e.target, { id: e.source, strength });
    } else if (e.type === 'evidence') {
      push(m.targetEvidence, e.target, e);
      push(m.docEvidence, e.source, e);
    } else if (e.type === 'finding') {
      push(m.reqFindings, e.target, e);
      push(m.sysFindings, e.source, e);
    }
  }
  return m;
}

export function frameworkRank(id: string | null | undefined): number {
  const i = FRAMEWORK_ORDER.indexOf(id ?? '');
  return i === -1 ? FRAMEWORK_ORDER.length : i;
}

export function statusOfNode(n: GraphNode | undefined): ComplianceStatus {
  return (n?.status ?? 'not_assessed') as ComplianceStatus;
}

const FINDING_SEVERITY: Record<string, number> = { gap: 3, partial: 2, compliant: 1 };

export function worstFinding(statuses: string[]): string {
  return [...statuses].sort((a, b) => (FINDING_SEVERITY[b] ?? 0) - (FINDING_SEVERITY[a] ?? 0))[0] ?? 'compliant';
}

/** A finding that is not (yet) a human-confirmed, directly assessed result: drawn dashed. */
export function isTentativeFinding(e: GraphEdge): boolean {
  return e.review_status === 'proposed' || e.origin === 'crosswalk';
}

/**
 * Everything connected to a node, for highlighting.
 * Requirement: its objectives and, through them, the related requirements in the other frameworks, the documents
 * that evidence those objectives and the systems with findings on it. Objective: its requirements, documents and
 * the systems with findings on those requirements. Document: the objectives it evidences and their requirements.
 * System: the requirements it has findings on and their objectives.
 */
export function connectedTo(m: GraphModel, id: string): Set<string> {
  const out = new Set<string>([id]);
  const node = m.nodes.get(id);
  if (!node) return out;

  const addObjective = (objId: string, withSystems: boolean) => {
    out.add(objId);
    for (const r of m.objRequirements.get(objId) ?? []) {
      out.add(r.id);
      if (withSystems) for (const f of m.reqFindings.get(r.id) ?? []) out.add(f.source);
    }
    for (const e of m.targetEvidence.get(objId) ?? []) out.add(e.source);
  };

  if (node.type === 'requirement') {
    for (const o of m.reqObjectives.get(id) ?? []) addObjective(o.id, false);
    for (const f of m.reqFindings.get(id) ?? []) out.add(f.source);
    for (const e of m.targetEvidence.get(id) ?? []) out.add(e.source);
  } else if (node.type === 'objective') {
    addObjective(id, true);
  } else if (node.type === 'document') {
    for (const e of m.docEvidence.get(id) ?? []) {
      const target = m.nodes.get(e.target);
      if (target?.type === 'objective') {
        out.add(e.target);
        for (const r of m.objRequirements.get(e.target) ?? []) out.add(r.id);
      } else {
        out.add(e.target);
      }
    }
  } else if (node.type === 'system') {
    for (const f of m.sysFindings.get(id) ?? []) {
      out.add(f.target);
      for (const o of m.reqObjectives.get(f.target) ?? []) out.add(o.id);
    }
  }
  return out;
}
