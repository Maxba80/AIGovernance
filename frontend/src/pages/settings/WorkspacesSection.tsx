import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderPlus, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage, isStatus, qk, type Workspace } from '../../lib/api';
import { formatDate, formatNumber } from '../../lib/format';
import { useWorkspace } from '../../lib/workspace';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';

export function WorkspacesSection() {
  const { workspaces, current, isLoading, error, refetch, select, openCreate } = useWorkspace();
  const qc = useQueryClient();
  const toast = useToast();
  const [toDelete, setToDelete] = useState<Workspace | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteWorkspace(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.workspaces });
      toast.success('Workspace deleted');
      setToDelete(null);
    },
  });

  const deleteError = remove.isError
    ? isStatus(remove.error, 409)
      ? `This workspace still contains documents, so it cannot be deleted. Delete its documents on the Evidence page first. (${errorMessage(remove.error)})`
      : errorMessage(remove.error)
    : null;

  return (
    <section id="workspaces" className="scroll-mt-20">
      <Card>
        <CardHeader
          title="Workspaces"
          description="Each workspace has its own evidence, approvals and jobs."
          actions={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              New workspace
            </Button>
          }
        />
        {isLoading ? (
          <SkeletonRows rows={3} />
        ) : error ? (
          <ErrorState compact error={error} title="Could not load workspaces" onRetry={refetch} />
        ) : workspaces.length === 0 ? (
          <EmptyState compact icon={<FolderPlus className="h-4 w-4" />} title="No workspaces yet" description="Create one to start uploading evidence." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Description</th>
                  <th className="th text-right">Documents</th>
                  <th className="th">Created</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((w) => (
                  <tr key={w.id} className="[&:last-child>td]:border-b-0">
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-fg">{w.name}</span>
                        {w.id === current?.id && <Badge tone="indigo">Current</Badge>}
                      </div>
                    </td>
                    <td className="td max-w-[320px] truncate text-muted" title={w.description ?? undefined}>
                      {w.description || '—'}
                    </td>
                    <td className="td text-right tabular-nums text-muted">{formatNumber(w.document_count)}</td>
                    <td className="td whitespace-nowrap text-muted">{formatDate(w.created_at)}</td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {w.id !== current?.id && (
                          <Button size="sm" variant="ghost" onClick={() => select(w.id)}>
                            Switch to
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${w.name}`}
                          title="Delete"
                          className="hover:!text-red-600"
                          onClick={() => {
                            remove.reset();
                            setToDelete(w);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="Delete workspace"
        loading={remove.isPending}
        error={deleteError}
        message={
          <>
            Delete the workspace <span className="font-medium">{toDelete?.name}</span>? A workspace can only be deleted once it has no documents
            {toDelete && toDelete.document_count > 0 ? ` — this one has ${toDelete.document_count}.` : '.'}
          </>
        }
      />
    </section>
  );
}
