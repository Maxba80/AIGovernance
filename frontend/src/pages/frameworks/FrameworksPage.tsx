import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, qk, type FrameworkId, type Workspace } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { FRAMEWORK_IDS, frameworkMeta, isFrameworkId, statusCount } from '../../lib/grc';
import { FrameworkChip, StatusCountsBar } from '../../components/grc';
import { Card, PageHeader } from '../../components/ui/Card';
import { ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { Segmented } from '../../components/ui/Segmented';
import { Tabs } from '../../components/ui/Tabs';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { AssessmentsSection } from '../assessments/AssessmentsSection';
import { ClassificationWizard } from './ClassificationWizard';
import { EuOverview } from './EuOverview';
import { NistScorecard } from './NistScorecard';
import { NonconformitiesSection } from './NonconformitiesSection';
import { ObligationsSection } from './ObligationsSection';
import { RequirementsTable } from './RequirementsTable';
import { SoaSection } from './SoaSection';

type ViewId = 'requirements' | 'overview' | 'wizard' | 'obligations' | 'assessments' | 'soa' | 'nonconformities' | 'scorecard';

const VIEWS: Record<FrameworkId, Array<{ id: ViewId; label: string }>> = {
  'eu-ai-act': [
    { id: 'requirements', label: 'Requirements' },
    { id: 'overview', label: 'Overview' },
    { id: 'wizard', label: 'Classification wizard' },
    { id: 'obligations', label: 'Obligations by system' },
    { id: 'assessments', label: 'Assessments' },
  ],
  gdpr: [
    { id: 'requirements', label: 'Requirements' },
    { id: 'assessments', label: 'Assessments' },
  ],
  'iso-42001': [
    { id: 'requirements', label: 'Requirements' },
    { id: 'soa', label: 'Statement of Applicability' },
    { id: 'nonconformities', label: 'Nonconformities & CAPA' },
  ],
  'nist-ai-rmf': [
    { id: 'requirements', label: 'Requirements' },
    { id: 'scorecard', label: 'Scorecard' },
  ],
};

function FrameworkView({ workspace, fid }: { workspace: Workspace; fid: FrameworkId }) {
  const wid = workspace.id;
  const [params, setParams] = useSearchParams();
  const views = VIEWS[fid];
  const requested = params.get('view');
  const view: ViewId = views.find((v) => v.id === requested)?.id ?? 'requirements';
  const systemId = params.get('system') ?? '';

  const setView = (id: ViewId, system?: string) => {
    const next: Record<string, string> = {};
    if (id !== 'requirements') next.view = id;
    const sys = system ?? systemId;
    if (sys && (id === 'wizard' || id === 'obligations')) next.system = sys;
    setParams(next, { replace: true });
  };

  const framework = useQuery({ queryKey: qk.framework(wid, fid), queryFn: () => api.framework(wid, fid) });
  const f = framework.data;
  const counts = f?.counts;
  const total = Math.max(counts?.total ?? 0, f?.requirements?.length ?? 0);
  const assessed = statusCount(counts, 'compliant') + statusCount(counts, 'partial') + statusCount(counts, 'gap') + statusCount(counts, 'not_applicable');

  return (
    <div className="space-y-5">
      <Card className="px-4 py-3">
        {framework.isLoading ? (
          <SkeletonRows rows={1} />
        ) : framework.isError || !f ? (
          <ErrorState compact error={framework.error} title="Could not load the status of this framework" onRetry={() => void framework.refetch()} />
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <FrameworkChip id={fid} name={f.name} />
              <span className="text-xs tabular-nums text-muted">
                {formatNumber(assessed)} of {formatNumber(total)} requirements assessed in {workspace.name}
              </span>
            </div>
            <StatusCountsBar counts={counts} label={f.name} />
          </>
        )}
      </Card>

      <div className="overflow-x-auto">
        <Segmented<ViewId> label="Section" options={views} value={view} onChange={(id) => setView(id)} className="flex-nowrap" />
      </div>

      {view === 'requirements' &&
        (framework.isLoading ? (
          <Card>
            <SkeletonRows rows={8} />
          </Card>
        ) : framework.isError || !f ? (
          <Card>
            <ErrorState error={framework.error} title="Could not load the requirements" onRetry={() => void framework.refetch()} />
          </Card>
        ) : (
          <RequirementsTable framework={f} />
        ))}

      {fid === 'eu-ai-act' && view === 'overview' && <EuOverview />}
      {fid === 'eu-ai-act' && view === 'wizard' && (
        <ClassificationWizard workspaceId={wid} systemId={systemId} onSystemChange={(id) => setView('wizard', id)} onShowObligations={(id) => setView('obligations', id)} />
      )}
      {fid === 'eu-ai-act' && view === 'obligations' && (
        <ObligationsSection workspaceId={wid} systemId={systemId} onSystemChange={(id) => setView('obligations', id)} onClassify={(id) => setView('wizard', id)} />
      )}
      {fid === 'eu-ai-act' && view === 'assessments' && (
        <AssessmentsSection
          workspaceId={wid}
          category="eu-ai-act"
          description="Fundamental rights impact assessments (FRIA) and Annex IV technical documentation: drafted by an agent from the evidence, edited by you, approved by a human."
        />
      )}
      {fid === 'gdpr' && view === 'assessments' && (
        <AssessmentsSection
          workspaceId={wid}
          category="gdpr"
          description="DPIA, record of processing (RoPA), legitimate interest assessment (LIA), Art. 22 and transfer impact assessment (TIA), per system."
        />
      )}
      {fid === 'iso-42001' && view === 'soa' && <SoaSection workspaceId={wid} />}
      {fid === 'iso-42001' && view === 'nonconformities' && <NonconformitiesSection workspaceId={wid} />}
      {fid === 'nist-ai-rmf' && view === 'scorecard' && <NistScorecard workspaceId={wid} />}
    </div>
  );
}

export function FrameworksPage() {
  const { fid } = useParams();
  const navigate = useNavigate();
  if (!isFrameworkId(fid)) return <Navigate to="/frameworks/eu-ai-act" replace />;

  return (
    <>
      <PageHeader
        title="Frameworks"
        description="The requirements of each framework, how well they are covered in this workspace, and the working tools that belong to each one."
      />
      <div className="mb-5 overflow-x-auto">
        <Tabs<FrameworkId> tabs={FRAMEWORK_IDS.map((id) => ({ id, label: frameworkMeta(id).label }))} value={fid} onChange={(id) => navigate(`/frameworks/${id}`)} />
      </div>
      <WorkspaceGate>{(workspace) => <FrameworkView key={`${workspace.id}:${fid}`} workspace={workspace} fid={fid} />}</WorkspaceGate>
    </>
  );
}
