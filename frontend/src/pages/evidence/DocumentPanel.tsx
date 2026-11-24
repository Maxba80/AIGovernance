import { useEffect, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, qk, type DocumentItem, type DocumentTag } from '../../lib/api';
import { DOC_TYPE_LABELS, formatBytes, formatDateTime, formatNumber, formatPercent } from '../../lib/format';
import { AiBadge } from '../../components/AiBadge';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CopyValue } from '../../components/ui/Copy';
import { Input } from '../../components/ui/Field';
import { EmptyState, ErrorState, Notice, SkeletonRows } from '../../components/ui/Feedback';
import { SlideOver } from '../../components/ui/Overlay';
import { DocStatusCell } from './shared';

interface DocumentPanelProps {
  workspaceId: string;
  open: boolean;
  document: DocumentItem | null;
  loading: boolean;
  onClose: () => void;
  onOpenApprovals: () => void;
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-fg">{children}</dd>
    </div>
  );
}

const tagStatus: Record<DocumentTag['status'], { tone: 'amber' | 'green' | 'red'; label: string }> = {
  proposed: { tone: 'amber', label: 'Proposed' },
  approved: { tone: 'green', label: 'Approved' },
  rejected: { tone: 'red', label: 'Rejected' },
};

function TagCard({ tag }: { tag: DocumentTag }) {
  const s = tagStatus[tag.status] ?? tagStatus.proposed;
  const c = tag.citation;
  const rejected = tag.status === 'rejected';
  return (
    <li className={`rounded-md border border-line p-3 ${rejected ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`font-mono text-xs font-semibold text-fg ${rejected ? 'line-through' : ''}`}>{tag.cco_id}</span>
        <span className={`min-w-0 flex-1 text-sm text-fg ${rejected ? 'line-through' : ''}`}>{tag.cco_name}</span>
        <Badge tone={s.tone} variant={tag.status === 'proposed' ? 'outline' : 'solid'} withDot>
          {s.label}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>
          Confidence <span className="font-medium tabular-nums text-fg">{formatPercent(tag.confidence)}</span>
        </span>
        {/* Transparency rule: the AI badge stays until a human has approved the tag. */}
        {tag.status === 'proposed' ? (
          <AiBadge model={tag.model} />
        ) : (
          tag.model && (
            <span>
              Model <span className="font-mono text-fg">{tag.model}</span>
            </span>
          )
        )}
      </div>
      {tag.rationale && (
        <div className="mt-2">
          <div className="text-xs font-medium text-muted">Rationale</div>
          <p className="mt-0.5 text-sm leading-relaxed text-fg">{tag.rationale}</p>
        </div>
      )}
      <div className="mt-2">
        <div className="text-xs font-medium text-muted">Citation</div>
        {c && (c.page != null || c.section || c.quote) ? (
          <div className="mt-1 rounded-md border border-line bg-bg px-3 py-2">
            <div className="text-xs text-muted">
              {[c.page != null ? `Page ${c.page}` : null, c.section].filter(Boolean).join(' · ') || 'Location not recorded'}
            </div>
            {c.quote && <blockquote className="mt-1 border-l-2 border-line-strong pl-2 text-xs italic leading-relaxed text-fg">“{c.quote}”</blockquote>}
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-muted">No citation was recorded for this tag.</p>
        )}
      </div>
    </li>
  );
}

function ChunkBrowser({ workspaceId, doc }: { workspaceId: string; doc: DocumentItem }) {
  // Documents with page numbers are browsed one page at a time; others (csv, txt, …) are listed in full.
  const paged = doc.pages != null && doc.pages > 0;
  const lastPage = paged ? (doc.pages as number) : 1;
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('1');

  const go = (p: number) => {
    const next = Math.max(1, Math.min(lastPage, Math.round(p) || 1));
    setPage(next);
    setDraft(String(next));
  };

  const hasChunks = (doc.chunk_count ?? 0) > 0;
  const chunks = useQuery({
    queryKey: qk.chunks(workspaceId, doc.id, paged ? page : null),
    queryFn: () => api.listChunks(workspaceId, doc.id, paged ? page : undefined),
    enabled: hasChunks,
    placeholderData: keepPreviousData,
  });

  if (!hasChunks) {
    return (
      <EmptyState
        compact
        title="No passages yet"
        description={doc.status === 'failed' ? 'Processing failed before the document was split into passages.' : 'Passages appear once the document has been parsed and chunked.'}
      />
    );
  }

  const list = [...(chunks.data ?? [])].sort((a, b) => a.ordinal - b.ordinal);

  return (
    <div>
      {paged && (
        <div className="mb-3 flex items-center gap-2">
          <Button size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => go(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <form
            className="flex items-center gap-1.5 text-xs text-muted"
            onSubmit={(e) => {
              e.preventDefault();
              go(Number(draft));
            }}
          >
            Page
            <Input
              aria-label="Page number"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => go(Number(draft))}
              className="h-8 w-14 px-2 text-center text-xs"
            />
            of {lastPage}
          </form>
          <Button size="icon" aria-label="Next page" disabled={page >= lastPage} onClick={() => go(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {chunks.isFetching && <span className="text-xs text-muted">Loading…</span>}
        </div>
      )}

      {chunks.isLoading ? (
        <SkeletonRows rows={3} />
      ) : chunks.isError ? (
        <ErrorState compact error={chunks.error} title="Could not load passages" onRetry={() => void chunks.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState compact title={paged ? `No passages on page ${page}` : 'No passages'} description={paged ? 'This page has no extractable text.' : undefined} />
      ) : (
        <ol className="space-y-2">
          {list.map((ch) => (
            <li key={ch.id} className="rounded-md border border-line bg-bg px-3 py-2">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
                <span className="font-mono">#{ch.ordinal}</span>
                {ch.page != null && <span>Page {ch.page}</span>}
                {ch.section && <span className="min-w-0 truncate">{ch.section}</span>}
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-fg">{ch.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function DocumentPanel({ workspaceId, open, document: doc, loading, onClose, onOpenApprovals }: DocumentPanelProps) {
  // Keep the last document while it is briefly absent from the list (e.g. during a refetch).
  const [last, setLast] = useState<DocumentItem | null>(doc);
  useEffect(() => {
    if (doc) setLast(doc);
    else if (!open) setLast(null);
  }, [doc, open]);
  const shown = doc ?? (open ? last : null);

  const tags = shown?.tags ?? [];
  const proposed = tags.filter((t) => t.status === 'proposed').length;
  const order: Record<DocumentTag['status'], number> = { proposed: 0, approved: 1, rejected: 2 };
  const sorted = [...tags].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) || a.cco_id.localeCompare(b.cco_id));

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={shown?.filename ?? 'Document'}
      subtitle={shown ? `${shown.mime ?? 'Unknown type'} · ${formatBytes(shown.size)}` : undefined}
    >
      {!shown ? (
        loading ? (
          <SkeletonRows rows={6} />
        ) : (
          <EmptyState title="Document not found" description="It may have been deleted, or it belongs to another workspace." />
        )
      ) : (
        <>
          <Section title="Metadata">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Meta label="Status">
                <DocStatusCell doc={shown} />
              </Meta>
              <Meta label="Type">
                <span className="flex flex-wrap items-center gap-2">
                  {shown.doc_type ? (DOC_TYPE_LABELS[shown.doc_type] ?? shown.doc_type) : 'Not classified'}
                  {shown.doc_type_source === 'ai' && <AiBadge />}
                  {shown.doc_type_source === 'user' && <span className="text-xs text-muted">set by a user</span>}
                </span>
              </Meta>
              <Meta label="Pages">{formatNumber(shown.pages)}</Meta>
              <Meta label="Chunks">{formatNumber(shown.chunk_count)}</Meta>
              <Meta label="Created">{formatDateTime(shown.created_at)}</Meta>
              <Meta label="Embedding model">
                {shown.embedding_model ? <span className="font-mono text-xs">{shown.embedding_model}</span> : '—'}
              </Meta>
              <div className="col-span-2">
                <Meta label="SHA-256">
                  <CopyValue value={shown.sha256} />
                </Meta>
              </div>
            </dl>
            {shown.status === 'failed' && shown.error && (
              <Notice tone="error" className="mt-3">
                <span className="font-medium">Processing failed.</span> {shown.error}
              </Notice>
            )}
          </Section>

          <Section
            title={`Tags (${tags.length})`}
            aside={
              proposed > 0 ? (
                <Button size="sm" onClick={onOpenApprovals}>
                  Review {proposed} in approval queue
                </Button>
              ) : undefined
            }
          >
            {tags.length === 0 ? (
              <EmptyState
                compact
                title="No tags"
                description="The ingestion agent proposes links to common control objectives once the document reaches the tagging stage."
              />
            ) : (
              <ul className="space-y-2">
                {sorted.map((t) => (
                  <TagCard key={t.id} tag={t} />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Passages">
            <ChunkBrowser key={shown.id} workspaceId={workspaceId} doc={shown} />
          </Section>
        </>
      )}
    </SlideOver>
  );
}
