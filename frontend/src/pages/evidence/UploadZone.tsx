import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Copy, FileText, UploadCloud, X } from 'lucide-react';
import { ACCEPT_ATTR, ACCEPTED_EXTENSIONS, ApiError, errorMessage, isAcceptedFile, qk, uploadDocuments } from '../../lib/api';
import { cn, formatBytes } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/Feedback';

type UploadState = 'uploading' | 'done' | 'duplicate' | 'error';

interface UploadItem {
  key: number;
  name: string;
  size: number;
  state: UploadState;
  progress: number;
  message?: string;
  /** For `done`: the new document; for `duplicate`: the document that already holds this content. */
  documentId?: string;
}

interface UploadZoneProps {
  workspaceId: string;
  onOpenDocument: (id: string) => void;
}

export function UploadZone({ workspaceId, onOpenDocument }: UploadZoneProps) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(1);
  const aborts = useRef(new Map<number, () => void>());
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  // Cancel anything still in flight when leaving the page or switching workspace.
  useEffect(() => {
    const pending = aborts.current;
    return () => {
      pending.forEach((abort) => abort());
      pending.clear();
    };
  }, []);

  const patch = useCallback((key: number, changes: Partial<UploadItem>) => {
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...changes } : x)));
  }, []);

  const start = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const added: UploadItem[] = [];
      for (const file of files) {
        const key = nextKey.current++;
        if (!isAcceptedFile(file.name)) {
          added.push({
            key,
            name: file.name,
            size: file.size,
            state: 'error',
            progress: 0,
            message: `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}.`,
          });
          continue;
        }
        added.push({ key, name: file.name, size: file.size, state: 'uploading', progress: 0 });

        // One request per file, so progress and duplicate handling are per file.
        const handle = uploadDocuments(workspaceId, [file], (p) => patch(key, { progress: p }));
        aborts.current.set(key, handle.abort);
        handle.promise
          .then((docs) => {
            patch(key, { state: 'done', progress: 100, documentId: docs[0]?.id });
            void qc.invalidateQueries({ queryKey: qk.documents(workspaceId) });
            void qc.invalidateQueries({ queryKey: qk.workspaces });
          })
          .catch((err: unknown) => {
            if (err instanceof ApiError && err.status === 409) {
              const existing = err.body?.existing_id;
              patch(key, {
                state: 'duplicate',
                message: 'This file is already in the workspace — nothing was uploaded.',
                documentId: typeof existing === 'string' ? existing : undefined,
              });
            } else {
              patch(key, { state: 'error', message: errorMessage(err, 'Upload failed') });
            }
          })
          .finally(() => aborts.current.delete(key));
      }
      setItems((xs) => [...added.reverse(), ...xs]);
    },
    [workspaceId, patch, qc],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    start(Array.from(e.dataTransfer.files));
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    start(Array.from(e.target.files ?? []));
    e.target.value = '';
  };

  const remove = (key: number) => {
    aborts.current.get(key)?.();
    setItems((xs) => xs.filter((x) => x.key !== key));
  };

  const finished = items.filter((i) => i.state !== 'uploading').length;

  return (
    <section aria-label="Upload documents">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-7 text-center transition-colors',
          dragging ? 'border-accent bg-accent/5' : 'border-line-strong bg-surface',
        )}
      >
        <UploadCloud className={cn('h-6 w-6', dragging ? 'text-accent-text' : 'text-muted')} />
        <p className="mt-2 text-sm text-fg">
          Drag and drop files here, or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-accent-text hover:underline">
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-muted">
          {ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')} · several files at once
        </p>
        <input ref={inputRef} type="file" multiple accept={ACCEPT_ATTR} onChange={onPick} className="hidden" aria-label="Choose files to upload" />
      </div>

      {items.length > 0 && (
        <div className="mt-3 rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-xs font-medium text-muted">
              Uploads · {finished} of {items.length} finished
            </span>
            {finished > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setItems((xs) => xs.filter((x) => x.state === 'uploading'))}>
                Clear finished
              </Button>
            )}
          </div>
          <ul className="max-h-64 divide-y divide-line overflow-y-auto">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2">
                <div className="shrink-0">
                  {item.state === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : item.state === 'duplicate' ? (
                    <Copy className="h-4 w-4 text-amber-500" />
                  ) : item.state === 'error' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm text-fg" title={item.name}>
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{formatBytes(item.size)}</span>
                  </div>
                  {item.state === 'uploading' ? (
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar value={item.progress} tone="accent" />
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">{item.progress}%</span>
                    </div>
                  ) : (
                    <p
                      className={cn(
                        'mt-0.5 text-xs',
                        item.state === 'done' && 'text-muted',
                        item.state === 'duplicate' && 'text-amber-700 dark:text-amber-300',
                        item.state === 'error' && 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {item.state === 'done' ? 'Uploaded — queued for processing.' : item.message}
                    </p>
                  )}
                </div>
                {item.state === 'duplicate' && item.documentId && (
                  <Button size="sm" onClick={() => onOpenDocument(item.documentId!)}>
                    View existing
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(item.key)}
                  aria-label={item.state === 'uploading' ? `Cancel upload of ${item.name}` : `Dismiss ${item.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
