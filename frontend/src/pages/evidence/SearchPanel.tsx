import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { api, errorMessage, isStatus } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { EmptyState, Notice, SkeletonRows } from '../../components/ui/Feedback';

interface SearchPanelProps {
  workspaceId: string;
  onOpenDocument: (id: string) => void;
}

export function SearchPanel({ workspaceId, onOpenDocument }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const search = useMutation({ mutationFn: (q: string) => api.search(workspaceId, q, 8) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) search.mutate(q);
  };

  const clear = () => {
    setQuery('');
    search.reset();
  };

  const active = search.isPending || search.isError || search.isSuccess;
  const results = search.data?.results ?? [];

  return (
    <section aria-label="Search evidence">
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search evidence"
            aria-label="Search evidence"
            className="pl-9"
          />
        </div>
        <Button type="submit" loading={search.isPending} disabled={!query.trim()}>
          Search
        </Button>
        {active && (
          <Button variant="ghost" onClick={clear} icon={<X className="h-3.5 w-3.5" />}>
            Clear
          </Button>
        )}
      </form>

      {active && (
        <Card className="mt-3">
          {search.isPending ? (
            <SkeletonRows rows={3} />
          ) : search.isError ? (
            <div className="p-4">
              {isStatus(search.error, 409) ? (
                <Notice tone="warning">
                  <span className="font-medium">No embedding model is configured.</span> Semantic search needs one.{' '}
                  <Link to="/settings#routing" className="font-medium underline">
                    Choose an embedding model in Settings
                  </Link>
                  , then re-index this workspace.
                </Notice>
              ) : (
                <Notice tone="error">Search failed: {errorMessage(search.error)}</Notice>
              )}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              compact
              icon={<Search className="h-4 w-4" />}
              title="No matching passages"
              description="Try different wording. Only documents that finished processing are searchable."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs text-muted">
                <span>
                  {results.length} passage{results.length === 1 ? '' : 's'} for “{search.variables}”, ranked by similarity
                </span>
                {search.data?.embedding_model && (
                  <span>
                    Embedding model <span className="font-mono text-fg">{search.data.embedding_model}</span>
                  </span>
                )}
              </div>
              <ol className="divide-y divide-line">
                {results.map((r) => (
                  <li key={r.chunk_id} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => onOpenDocument(r.document_id)}
                        className="break-all text-left text-sm font-medium text-accent-text hover:underline"
                      >
                        {r.filename}
                      </button>
                      {r.page != null && <span className="text-muted">Page {r.page}</span>}
                      {r.section && <span className="text-muted">{r.section}</span>}
                      <span className="ml-auto font-mono tabular-nums text-muted" title="Similarity score">
                        score {r.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{r.text}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>
      )}
    </section>
  );
}
