import type { ReactNode } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import type { Workspace } from '../lib/api';
import { useWorkspace } from '../lib/workspace';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { EmptyState, ErrorState, SkeletonRows } from './ui/Feedback';

/** Renders its children once a current workspace is known; otherwise a loading, error or "create one" state. */
export function WorkspaceGate({ children }: { children: (workspace: Workspace) => ReactNode }) {
  const { current, isLoading, error, refetch, openCreate } = useWorkspace();

  if (current) return <>{children(current)}</>;
  return (
    <Card>
      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorState error={error} title="Could not load workspaces" onRetry={refetch} />
      ) : (
        <EmptyState
          icon={<FolderPlus className="h-4 w-4" />}
          title="No workspace yet"
          description="Create a workspace to start uploading evidence. Each workspace has its own documents, approvals and audit trail."
          action={
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              New workspace
            </Button>
          }
        />
      )}
    </Card>
  );
}
