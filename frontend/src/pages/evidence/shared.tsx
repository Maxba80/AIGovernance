import type { DocStatus, DocumentItem, DocumentTag } from '../../lib/api';
import { isProcessing } from '../../lib/api';
import { DOC_STATUS_LABELS, formatPercent } from '../../lib/format';
import { Badge, type Tone } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/Feedback';

const statusTone: Record<DocStatus, Tone> = {
  queued: 'grey',
  parsing: 'amber',
  chunking: 'amber',
  embedding: 'amber',
  tagging: 'amber',
  ready: 'green',
  failed: 'red',
};

/** Status badge; while processing it also shows a progress bar and the stage text. */
export function DocStatusCell({ doc }: { doc: DocumentItem }) {
  const processing = isProcessing(doc.status);
  return (
    <div className="min-w-[110px]">
      <div className="flex items-center gap-2">
        <Badge tone={statusTone[doc.status] ?? 'grey'} withDot>
          {DOC_STATUS_LABELS[doc.status] ?? doc.status}
        </Badge>
        {processing && <span className="text-xs tabular-nums text-muted">{Math.round(doc.progress ?? 0)}%</span>}
      </div>
      {processing && (
        <>
          <ProgressBar value={doc.progress} className="mt-1.5" />
          {doc.stage_detail && (
            <div className="mt-1 max-w-[140px] truncate text-xs text-muted" title={doc.stage_detail}>
              {doc.stage_detail}
            </div>
          )}
        </>
      )}
      {doc.status === 'failed' && doc.error && (
        <div className="mt-1 max-w-[140px] truncate text-xs text-red-600 dark:text-red-400" title={doc.error}>
          {doc.error}
        </div>
      )}
    </div>
  );
}

const tagTone: Record<DocumentTag['status'], Tone> = { proposed: 'amber', approved: 'green', rejected: 'grey' };
const tagLabel: Record<DocumentTag['status'], string> = {
  proposed: 'Proposed by AI — awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

/** CCO id chip: amber outline if proposed, green if approved, struck through if rejected. */
export function TagChip({ tag }: { tag: DocumentTag }) {
  const conf = tag.confidence != null ? ` · confidence ${formatPercent(tag.confidence)}` : '';
  return (
    <Badge
      tone={tagTone[tag.status] ?? 'grey'}
      variant={tag.status === 'approved' ? 'solid' : 'outline'}
      mono
      strike={tag.status === 'rejected'}
      title={`${tag.cco_id} ${tag.cco_name} — ${tagLabel[tag.status] ?? tag.status}${conf}`}
    >
      {tag.cco_id}
    </Badge>
  );
}
