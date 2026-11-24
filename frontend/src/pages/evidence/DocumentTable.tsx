import { useState } from 'react';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { FileText, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { api, errorMessage, isProcessing, qk, type DocType, type DocumentItem } from '../../lib/api';
import { cn, DOC_TYPE_LABELS, formatDate, formatNumber } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows } from '../../components/ui/Feedback';
import { ConfirmDialog } from '../../components/ui/Overlay';
import { useToast } from '../../components/ui/Toast';
import { DocStatusCell, TagChip } from './shared';

interface DocumentTableProps {
  workspaceId: string;
  query: UseQueryResult<DocumentItem[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MAX_TAGS = 6;

export function DocumentTable({ workspaceId, query, selectedId, onSelect }: DocumentTableProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [toDelete, setToDelete] = useState<DocumentItem | null>(null);
  const docsKey = qk.documents(workspaceId);

  const replaceInCache = (doc: DocumentItem) =>
    qc.setQueryData<DocumentItem[]>(docsKey, (old) => old?.map((d) => (d.id === doc.id ? doc : d)));

  const setType = useMutation({
    mutationFn: (v: { id: string; doc_type: DocType }) => api.updateDocument(workspaceId, v.id, { doc_type: v.doc_type }),
    onSuccess: (doc) => {
      replaceInCache(doc);
      toast.success('Document type updated');
    },
    onError: (err) => toast.error(`Could not update the type: ${errorMessage(err)}`),
  });

  const reprocess = useMutation({
    mutationFn: (id: string) => api.reprocessDocument(workspaceId, id),
    onSuccess: (doc) => {
      replaceInCache(doc);
      void qc.invalidateQueries({ queryKey: docsKey });
      toast.success(`“${doc.filename}” queued for reprocessing`);
    },
    onError: (err) => toast.error(`Could not reprocess: ${errorMessage(err)}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteDocument(workspaceId, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: docsKey });
      void qc.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
      void qc.invalidateQueries({ queryKey: qk.workspaces });
      toast.success('Document deleted');
      setToDelete(null);
    },
  });

  const docs = query.data ?? [];

  return (
    <Card>
      <CardHeader
        title="Documents"
        description={query.data ? `${docs.length} document${docs.length === 1 ? '' : 's'} in this workspace` : undefined}
      />
      {query.isLoading ? (
        <SkeletonRows rows={5} />
      ) : query.isError ? (
        <ErrorState error={query.error} title="Could not load documents" onRetry={() => void query.refetch()} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-4 w-4" />}
          title="No documents yet"
          description="Upload policies, governance documents, audit reports or logs above. Each file is parsed, split into passages, embedded and tagged against the common control objectives."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="th">Filename</th>
                <th className="th">Type</th>
                <th className="th">Status</th>
                <th className="th text-right">Pages</th>
                <th className="th text-right">Chunks</th>
                <th className="th">Tags</th>
                <th className="th">Created</th>
                <th className="th sticky right-0 bg-surface text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const visibleTags = doc.tags.filter((t) => t.status !== 'rejected');
                const processing = isProcessing(doc.status);
                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelect(doc.id)}
                    className={cn('cursor-pointer hover:bg-surface2/60 [&:last-child>td]:border-b-0', selectedId === doc.id && 'bg-accent/5')}
                  >
                    <td className="td max-w-[180px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(doc.id);
                        }}
                        className="block max-w-full truncate text-left font-medium text-fg hover:text-accent-text"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </button>
                    </td>
                    <td className="td" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Select
                          aria-label={`Type of ${doc.filename}`}
                          className="h-7 w-[108px] shrink-0 text-xs"
                          value={doc.doc_type ?? ''}
                          disabled={setType.isPending && setType.variables?.id === doc.id}
                          onChange={(e) => setType.mutate({ id: doc.id, doc_type: e.target.value as DocType })}
                        >
                          {doc.doc_type === null && (
                            <option value="" disabled>
                              Not classified
                            </option>
                          )}
                          {(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((t) => (
                            <option key={t} value={t}>
                              {DOC_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </Select>
                        {doc.doc_type_source === 'ai' && (
                          <span
                            title="AI-generated: the type was proposed by the ingestion agent. Pick a type to confirm or correct it."
                            className="inline-flex items-center gap-0.5 rounded border border-dashed border-amber-400 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/60 dark:text-amber-300"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> AI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td">
                      <DocStatusCell doc={doc} />
                    </td>
                    <td className="td text-right tabular-nums text-muted">{formatNumber(doc.pages)}</td>
                    <td className="td text-right tabular-nums text-muted">{formatNumber(doc.chunk_count)}</td>
                    <td className="td">
                      {visibleTags.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="flex min-w-[96px] max-w-[200px] flex-wrap gap-1">
                          {visibleTags.slice(0, MAX_TAGS).map((t) => (
                            <TagChip key={t.id} tag={t} />
                          ))}
                          {visibleTags.length > MAX_TAGS && (
                            <span className="text-xs text-muted" title={visibleTags.slice(MAX_TAGS).map((t) => t.cco_id).join(', ')}>
                              +{visibleTags.length - MAX_TAGS}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="td whitespace-nowrap text-muted">{formatDate(doc.created_at)}</td>
                    <td className="td sticky right-0 bg-surface" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Reprocess ${doc.filename}`}
                          title={processing ? 'Already processing' : 'Reprocess'}
                          disabled={processing}
                          loading={reprocess.isPending && reprocess.variables === doc.id}
                          onClick={() => reprocess.mutate(doc.id)}
                        >
                          {!(reprocess.isPending && reprocess.variables === doc.id) && <RefreshCw className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${doc.filename}`}
                          title="Delete"
                          className="hover:!text-red-600"
                          onClick={() => {
                            remove.reset();
                            setToDelete(doc);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="Delete document"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        message={
          <>
            Delete <span className="font-medium">{toDelete?.filename}</span>? Its passages, embeddings and tags are removed from this workspace. The
            deletion is recorded in the audit trail.
          </>
        }
      />
    </Card>
  );
}
