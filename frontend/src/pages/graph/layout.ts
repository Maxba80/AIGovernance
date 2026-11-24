import type { GraphModel } from './model';
import { frameworkRank } from './model';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Column layout, computed here (no layout library):
 *
 *   documents | EU AI Act | GDPR | control objectives | ISO 42001 | NIST AI RMF | systems
 *
 * Each visible objective owns a horizontal band. A requirement is placed in the band of its "home" objective
 * (its first primary objective among the expanded ones), in the column of its framework, so it sits next to
 * the objective it belongs to. Documents and systems are ordered by the average height of what they link to.
 */
export const SIZE = {
  objective: { w: 250, h: 58 },
  requirement: { w: 172, h: 32 },
  document: { w: 200, h: 34 },
  system: { w: 200, h: 40 },
};

const COLUMN_X = {
  document: 0,
  'eu-ai-act': 260,
  gdpr: 446,
  objective: 660,
  'iso-42001': 952,
  'nist-ai-rmf': 1138,
  system: 1370,
};

const REQ_GAP = 6;
const BAND_GAP = 16;
const SIDE_GAP = 10;

type RequirementColumn = 'eu-ai-act' | 'gdpr' | 'iso-42001' | 'nist-ai-rmf';

/** Unknown frameworks share the outer column of the side they would sort to. */
function columnOf(framework: string | null | undefined): RequirementColumn {
  if (framework === 'eu-ai-act' || framework === 'gdpr' || framework === 'iso-42001' || framework === 'nist-ai-rmf') return framework;
  return 'nist-ai-rmf';
}

/** Whether a requirement column lies left of the objectives (its edges leave on the right). */
export function isLeftFramework(framework: string | null | undefined): boolean {
  const c = columnOf(framework);
  return c === 'eu-ai-act' || c === 'gdpr';
}

export interface LayoutInput {
  model: GraphModel;
  /** Visible objectives, in display order. */
  objectiveIds: string[];
  /** Visible requirement nodes. */
  requirementIds: Set<string>;
  /** Objectives whose requirements are shown; decides the home band of a requirement. */
  expanded: Set<string>;
  documentIds: string[];
  systemIds: string[];
}

export function computeLayout({ model, objectiveIds, requirementIds, expanded, documentIds, systemIds }: LayoutInput): Map<string, Box> {
  const boxes = new Map<string, Box>();
  const visibleObjectives = new Set(objectiveIds);

  // Home band of each visible requirement.
  const bands = new Map<string, Record<RequirementColumn, string[]>>();
  for (const id of objectiveIds) bands.set(id, { 'eu-ai-act': [], gdpr: [], 'iso-42001': [], 'nist-ai-rmf': [] });
  for (const reqId of requirementIds) {
    const links = (model.reqObjectives.get(reqId) ?? []).filter((o) => visibleObjectives.has(o.id));
    const home =
      links.find((o) => expanded.has(o.id) && o.strength === 'primary') ?? links.find((o) => expanded.has(o.id)) ?? links.find((o) => o.strength === 'primary') ?? links[0];
    if (!home) continue;
    bands.get(home.id)?.[columnOf(model.nodes.get(reqId)?.framework)].push(reqId);
  }

  const step = SIZE.requirement.h + REQ_GAP;
  let top = 0;
  for (const objId of objectiveIds) {
    const cols = bands.get(objId)!;
    const tallest = Math.max(...Object.values(cols).map((c) => c.length));
    const bandH = Math.max(SIZE.objective.h, tallest * step - REQ_GAP);
    boxes.set(objId, { x: COLUMN_X.objective, y: top + (bandH - SIZE.objective.h) / 2, ...SIZE.objective });
    for (const [col, ids] of Object.entries(cols) as Array<[RequirementColumn, string[]]>) {
      ids.sort(
        (a, b) =>
          frameworkRank(model.nodes.get(a)?.framework) - frameworkRank(model.nodes.get(b)?.framework) || a.localeCompare(b, undefined, { numeric: true }),
      );
      const colH = ids.length * step - REQ_GAP;
      let y = top + (bandH - colH) / 2;
      for (const id of ids) {
        boxes.set(id, { x: COLUMN_X[col], y, ...SIZE.requirement });
        y += step;
      }
    }
    top += bandH + BAND_GAP;
  }
  const totalH = Math.max(top - BAND_GAP, 0);

  const centreY = (id: string): number | null => {
    const b = boxes.get(id);
    return b ? b.y + b.h / 2 : null;
  };
  const mean = (ys: Array<number | null>): number | null => {
    const v = ys.filter((y): y is number => y != null);
    return v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };

  /** Stack a side column: sorted by the height of what each node links to, pushed down only as far as needed. */
  const placeSide = (ids: string[], x: number, size: { w: number; h: number }, anchor: (id: string) => number | null) => {
    const withAnchor = ids.map((id) => ({ id, at: anchor(id) }));
    const linked = withAnchor.filter((n) => n.at != null).sort((a, b) => (a.at as number) - (b.at as number));
    const loose = withAnchor.filter((n) => n.at == null);
    // Spread evenly when the column is shorter than the graph, so the nodes do not pile up at their anchors.
    const needed = ids.length * (size.h + SIDE_GAP) - SIDE_GAP;
    let y = Math.max(0, Math.min(linked[0]?.at != null ? (linked[0].at as number) - size.h / 2 : 0, totalH - needed));
    for (const n of linked) {
      y = Math.max(y, (n.at as number) - size.h / 2);
      boxes.set(n.id, { x, y, ...size });
      y += size.h + SIDE_GAP;
    }
    for (const n of loose) {
      boxes.set(n.id, { x, y, ...size });
      y += size.h + SIDE_GAP;
    }
  };

  placeSide(documentIds, COLUMN_X.document, SIZE.document, (id) => mean((model.docEvidence.get(id) ?? []).map((e) => centreY(e.target))));
  placeSide(systemIds, COLUMN_X.system, SIZE.system, (id) =>
    mean(
      (model.sysFindings.get(id) ?? []).flatMap((f) => {
        const direct = centreY(f.target);
        return direct != null ? [direct] : (model.reqObjectives.get(f.target) ?? []).map((o) => centreY(o.id));
      }),
    ),
  );

  return boxes;
}
