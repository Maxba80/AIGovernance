import { CalendarClock } from 'lucide-react';
import { NAV_ITEMS } from '../components/layout/nav';
import { Badge } from '../components/ui/Badge';
import { Card, PageHeader } from '../components/ui/Card';

type PlaceholderId = 'frameworks' | 'graph' | 'risks' | 'deliverables';

const CONTENT: Record<PlaceholderId, { path: string; milestone: string; purpose: string }> = {
  frameworks: {
    path: '/frameworks',
    milestone: 'Milestone 3',
    purpose: 'Browse the requirements of the EU AI Act, GDPR, ISO/IEC 42001 and the NIST AI RMF, and see how well each one is covered.',
  },
  graph: {
    path: '/graph',
    milestone: 'Milestone 3',
    purpose: 'An interactive graph linking requirements, common control objectives, evidence and AI systems, so gaps and overlaps are visible.',
  },
  risks: {
    path: '/risks',
    milestone: 'Milestone 4',
    purpose: 'A risk register for AI systems with assessment, treatment and links to the controls and evidence that mitigate each risk.',
  },
  deliverables: {
    path: '/deliverables',
    milestone: 'Milestone 4',
    purpose: 'Generate audit-ready documents from the templates in the knowledge base, each one reviewed and approved by a human.',
  },
};

export function PlaceholderPage({ id }: { id: PlaceholderId }) {
  const c = CONTENT[id];
  const nav = NAV_ITEMS.find((n) => n.to === c.path);
  const Icon = nav?.icon ?? CalendarClock;
  const title = nav?.label ?? 'Coming soon';

  return (
    <>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center px-6 py-16 text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface2 text-muted">
          <Icon className="h-5 w-5" />
        </div>
        <Badge tone="grey">Planned for {c.milestone}</Badge>
        <h2 className="mt-3 text-base font-semibold text-fg">{title} is not part of Milestone 1</h2>
        <p className="mt-1.5 max-w-lg text-sm text-muted">{c.purpose}</p>
        <p className="mt-4 text-xs text-muted">No data is shown here until the feature is delivered.</p>
      </Card>
    </>
  );
}
