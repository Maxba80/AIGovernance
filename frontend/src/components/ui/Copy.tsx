import { useState, type MouseEvent } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn, copyText, shortHash } from '../../lib/format';

function useCopied(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    void copyText(text).then((ok) => {
      if (!ok) return;
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };
  return [copied, copy];
}

/** Truncated monospace hash; click to copy the full value. */
export function HashChip({ value, length = 10, className }: { value: string | null | undefined; length?: number; className?: string }) {
  const [copied, copy] = useCopied();
  if (!value) return <span className="text-muted">—</span>;
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    copy(value);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={copied ? 'Copied' : `${value} — click to copy`}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[11px] text-muted hover:bg-surface2 hover:text-fg',
        className,
      )}
    >
      {shortHash(value, length)}
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
    </button>
  );
}

/** Full monospace value with a copy button. */
export function CopyValue({ value }: { value: string }) {
  const [copied, copy] = useCopied();
  return (
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-fg">{value}</code>
      <button
        type="button"
        onClick={() => copy(value)}
        aria-label="Copy to clipboard"
        title={copied ? 'Copied' : 'Copy'}
        className="shrink-0 rounded p-1 text-muted hover:bg-surface2 hover:text-fg"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
