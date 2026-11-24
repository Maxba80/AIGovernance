import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, qk } from '../../lib/api';
import { Card, PageHeader } from '../../components/ui/Card';
import { ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { ProvidersSection } from './ProvidersSection';
import { RoutingSection } from './RoutingSection';
import { WorkspacesSection } from './WorkspacesSection';
import { AboutSection } from './AboutSection';

const SECTIONS = [
  { id: 'providers', label: 'AI providers' },
  { id: 'routing', label: 'Model routing' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'about', label: 'About' },
];

export function SettingsPage() {
  const llm = useQuery({ queryKey: qk.llm, queryFn: api.llmSettings });
  const { hash } = useLocation();
  const ready = !llm.isLoading;

  useEffect(() => {
    if (!hash || !ready) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, ready]);

  return (
    <>
      <PageHeader title="Settings" description="AI providers and models, workspaces, and version information. Changes take effect immediately." />
      <nav aria-label="Settings sections" className="mb-5 flex gap-4 border-b border-line pb-2 text-sm">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-muted hover:text-fg">
            {s.label}
          </a>
        ))}
      </nav>
      <div className="space-y-6">
        {llm.isLoading ? (
          <Card>
            <SkeletonRows rows={6} />
          </Card>
        ) : llm.isError || !llm.data ? (
          <Card>
            <ErrorState error={llm.error} title="Could not load AI settings" onRetry={() => void llm.refetch()} />
          </Card>
        ) : (
          <>
            <ProvidersSection settings={llm.data} />
            <RoutingSection settings={llm.data} />
          </>
        )}
        <WorkspacesSection />
        <AboutSection />
      </div>
    </>
  );
}
