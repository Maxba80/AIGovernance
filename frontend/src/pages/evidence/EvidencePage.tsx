import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, isProcessing, qk, type Workspace } from '../../lib/api';
import { PageHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { WorkspaceGate } from '../../components/WorkspaceGate';
import { UploadZone } from './UploadZone';
import { SearchPanel } from './SearchPanel';
import { DocumentTable } from './DocumentTable';
import { DocumentPanel } from './DocumentPanel';
import { ApprovalQueue } from './ApprovalQueue';

type TabId = 'documents' | 'approvals';

function EvidenceContent({ workspace }: { workspace: Workspace }) {
  const [params, setParams] = useSearchParams();
  const tab: TabId = params.get('tab') === 'approvals' ? 'approvals' : 'documents';
  // Deep link from the Compliance Graph: /evidence?doc=<id> opens that document.
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get('doc'));

  const documents = useQuery({
    queryKey: qk.documents(workspace.id),
    queryFn: () => api.listDocuments(workspace.id),
    // Contract: poll every 2 s while any document is still being processed.
    refetchInterval: (q) => (q.state.data?.some((d) => isProcessing(d.status)) ? 2000 : false),
  });
  const anyProcessing = documents.data?.some((d) => isProcessing(d.status)) ?? false;

  const approvals = useQuery({
    queryKey: qk.approvals(workspace.id),
    queryFn: () => api.listApprovals(workspace.id, 'pending'),
    // Tagging produces new proposals, so keep the queue fresh while documents are processing.
    refetchInterval: anyProcessing ? 4000 : false,
  });

  const setTab = (id: TabId) => setParams(id === 'approvals' ? { tab: 'approvals' } : {}, { replace: true });
  const selected = selectedId ? (documents.data?.find((d) => d.id === selectedId) ?? null) : null;

  return (
    <>
      <Tabs<TabId>
        tabs={[
          { id: 'documents', label: 'Documents' },
          { id: 'approvals', label: 'Approval queue', count: approvals.data?.length ?? 0 },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'documents' ? (
        <div className="mt-5 space-y-5">
          <UploadZone workspaceId={workspace.id} onOpenDocument={setSelectedId} />
          <SearchPanel workspaceId={workspace.id} onOpenDocument={setSelectedId} />
          <DocumentTable workspaceId={workspace.id} query={documents} onSelect={setSelectedId} selectedId={selectedId} />
        </div>
      ) : (
        <div className="mt-5">
          <ApprovalQueue workspaceId={workspace.id} query={approvals} onOpenDocument={setSelectedId} />
        </div>
      )}

      <DocumentPanel
        workspaceId={workspace.id}
        open={selectedId !== null}
        document={selected}
        loading={documents.isLoading}
        onClose={() => setSelectedId(null)}
        onOpenApprovals={() => {
          setSelectedId(null);
          setTab('approvals');
        }}
      />
    </>
  );
}

export function EvidencePage() {
  return (
    <>
      <PageHeader
        title="Evidence"
        description="Upload documents, review how the ingestion agent tagged them, and approve or reject its proposals."
      />
      {/* Remount on workspace change so selection, uploads and search results never leak between workspaces. */}
      <WorkspaceGate>{(workspace) => <EvidenceContent key={workspace.id} workspace={workspace} />}</WorkspaceGate>
    </>
  );
}
