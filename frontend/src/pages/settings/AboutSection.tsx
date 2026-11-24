import { useQuery } from '@tanstack/react-query';
import { api, qk } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { ErrorState, SkeletonRows } from '../../components/ui/Feedback';

export function AboutSection() {
  const health = useQuery({ queryKey: qk.health, queryFn: api.health });
  const h = health.data;

  return (
    <section id="about" className="scroll-mt-20">
      <Card>
        <CardHeader title="About" description="AI Governance, Risk & Compliance — Milestone 1: evidence ingestion, approvals and audit trail." />
        {health.isLoading ? (
          <SkeletonRows rows={2} />
        ) : health.isError || !h ? (
          <ErrorState compact error={health.error} title="Could not reach the server" onRetry={() => void health.refetch()} />
        ) : (
          <dl className="grid grid-cols-3 gap-4 p-4 text-sm">
            <div>
              <dt className="text-xs text-muted">Version</dt>
              <dd className="mt-1 font-mono text-fg">{h.version}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">API</dt>
              <dd className="mt-1">
                <Badge tone={h.status === 'ok' ? 'green' : 'red'} withDot>
                  {h.status === 'ok' ? 'Healthy' : h.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Database</dt>
              <dd className="mt-1">
                <Badge tone={h.database ? 'green' : 'red'} withDot>
                  {h.database ? 'Connected' : 'Unavailable'}
                </Badge>
              </dd>
            </div>
          </dl>
        )}
      </Card>
    </section>
  );
}
