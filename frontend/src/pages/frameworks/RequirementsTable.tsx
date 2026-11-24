import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { ComplianceStatus, FrameworkDetail, FrameworkFindingRef, FrameworkRequirement } from '../../lib/api';
import { cn } from '../../lib/format';
import { COMPLIANCE_LABELS, COMPLIANCE_STATUSES, FINDING_STATUS_TONES, findingStatusLabel } from '../../lib/grc';
import { ComplianceStatusBadge, RefChip } from '../../components/grc';
import { RequirementPanel } from '../../components/RequirementDetail';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select, Switch } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/Feedback';

const UNGROUPED = 'Other';

/** One finding of one system: tone by status; dashed outline while it is still an unapproved AI proposal. */
function FindingBadge({ finding: f }: { finding: FrameworkFindingRef }) {
  const proposed = f.review_status === 'proposed';
  const title = [
    `${f.system_name}: ${findingStatusLabel(f.status)}`,
    proposed ? 'Proposed by an AI agent — not yet approved by a human' : f.review_status,
    f.origin === 'crosswalk' ? 'Inferred through the crosswalk — not assessed directly' : null,
  ]
    .filter(Boolean)
    .join('\n');
  return (
    <Badge
      tone={FINDING_STATUS_TONES[f.status] ?? 'grey'}
      variant={proposed ? 'outline' : 'solid'}
      strike={f.review_status === 'rejected'}
      title={title}
      className={cn('max-w-[150px]', proposed && 'border-dashed')}
    >
      <span className="truncate">{f.system_name}</span>
      {proposed && <span className="text-[10px] font-normal opacity-80">proposed</span>}
    </Badge>
  );
}

interface RequirementsTableProps {
  framework: FrameworkDetail;
}

export function RequirementsTable({ framework }: RequirementsTableProps) {
  const [status, setStatus] = useState<ComplianceStatus | ''>('');
  const [text, setText] = useState('');
  const [onlyGaps, setOnlyGaps] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openRef, setOpenRef] = useState<string | null>(null);

  const requirements = framework.requirements ?? [];
  const statusByRef = useMemo(() => new Map(requirements.map((r) => [r.ref, r.status])), [requirements]);

  const q = text.trim().toLowerCase();
  const rows = requirements.filter((r) => {
    if (onlyGaps && r.status !== 'gap') return false;
    if (status && r.status !== status) return false;
    if (q && !`${r.ref} ${r.title} ${(r.objectives ?? []).join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });

  // Groups in the order the server lists them; anything else follows.
  const groupNames = [...(framework.groups ?? [])];
  for (const r of rows) {
    const g = r.group ?? UNGROUPED;
    if (!groupNames.includes(g)) groupNames.push(g);
  }
  const groups = groupNames
    .map((name) => ({ name, items: rows.filter((r) => (r.group ?? UNGROUPED) === name) }))
    .filter((g) => g.items.length > 0);

  const filtering = !!status || !!q || onlyGaps;
  const toggle = (name: string) =>
    setCollapsed((old) => {
      const next = new Set(old);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <Card>
      <CardHeader
        title="Requirements"
        description={
          filtering
            ? `${rows.length} of ${requirements.length} requirements match the filters`
            : `${requirements.length} requirement${requirements.length === 1 ? '' : 's'}. Open one to read its text, amendments and related requirements.`
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search ref, title or objective" aria-label="Search requirements" className="h-8 pl-8 text-xs" />
        </div>
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as ComplianceStatus | '')} className="h-8 w-auto text-xs">
          <option value="">All statuses</option>
          {COMPLIANCE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {COMPLIANCE_LABELS[s]} ({requirements.filter((r) => r.status === s).length})
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-xs text-fg">
          <Switch checked={onlyGaps} onChange={setOnlyGaps} label="Only gaps" />
          Only gaps
        </label>
        {groups.length > 1 && (
          <button
            type="button"
            className="ml-auto text-xs font-medium text-accent-text hover:underline"
            onClick={() => setCollapsed(collapsed.size > 0 ? new Set() : new Set(groups.map((g) => g.name)))}
          >
            {collapsed.size > 0 ? 'Expand all groups' : 'Collapse all groups'}
          </button>
        )}
      </div>

      {requirements.length === 0 ? (
        <EmptyState compact title="No requirements" description="The knowledge base lists no requirement for this framework." />
      ) : rows.length === 0 ? (
        <EmptyState compact title="No requirement matches the filters" description="Change the status, clear the search or switch off “Only gaps”." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">Ref</th>
                <th className="th">Title</th>
                <th className="th">Status</th>
                <th className="th">Objectives</th>
                <th className="th text-right">Evidence</th>
                <th className="th">Findings</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const open = !collapsed.has(g.name);
                return (
                  <Fragment key={g.name}>
                    <tr>
                      <td colSpan={6} className="border-b border-line bg-surface2/60 p-0">
                        <button
                          type="button"
                          onClick={() => toggle(g.name)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-xs font-semibold text-fg hover:bg-surface2"
                        >
                          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                          <span className="min-w-0 [overflow-wrap:anywhere]">{g.name}</span>
                          <span className="font-normal tabular-nums text-muted">{g.items.length}</span>
                          <GroupDots items={g.items} />
                        </button>
                      </td>
                    </tr>
                    {open &&
                      g.items.map((r) => (
                        <tr key={r.ref} onClick={() => setOpenRef(r.ref)} className="cursor-pointer hover:bg-surface2/60">
                          <td className="td whitespace-nowrap">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setOpenRef(r.ref); }} className="font-mono text-xs text-fg hover:text-accent-text" aria-label={`Open ${r.ref}`}>
                              {r.ref}
                            </button>
                          </td>
                          <td className="td min-w-[220px] text-fg [overflow-wrap:anywhere]">{r.title}</td>
                          <td className="td">
                            <ComplianceStatusBadge status={r.status} />
                          </td>
                          <td className="td">
                            <div className="flex max-w-[180px] flex-wrap gap-1">
                              {(r.objectives ?? []).length === 0 ? <span className="text-xs text-muted">—</span> : r.objectives.map((o) => <RefChip key={o}>{o}</RefChip>)}
                            </div>
                          </td>
                          <td className="td text-right tabular-nums">
                            {r.evidence_documents > 0 ? <span className="font-medium text-fg">{r.evidence_documents}</span> : <span className="text-muted">0</span>}
                          </td>
                          <td className="td">
                            <div className="flex max-w-[260px] flex-wrap gap-1">
                              {(r.findings ?? []).length === 0 ? (
                                <span className="text-xs text-muted">—</span>
                              ) : (
                                r.findings.map((f, i) => <FindingBadge key={`${f.system_id}-${i}`} finding={f} />)
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RequirementPanel requirementRef={openRef} onClose={() => setOpenRef(null)} statusOf={(ref) => statusByRef.get(ref)} />
    </Card>
  );
}

/** Tiny per-group roll-up: how many gaps and partials the group holds. */
function GroupDots({ items }: { items: FrameworkRequirement[] }) {
  const gaps = items.filter((r) => r.status === 'gap').length;
  const partial = items.filter((r) => r.status === 'partial').length;
  if (gaps + partial === 0) return null;
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5 font-normal">
      {gaps > 0 && (
        <Badge tone="red" withDot>
          {gaps} gap{gaps === 1 ? '' : 's'}
        </Badge>
      )}
      {partial > 0 && (
        <Badge tone="amber" withDot>
          {partial} partial
        </Badge>
      )}
    </span>
  );
}
