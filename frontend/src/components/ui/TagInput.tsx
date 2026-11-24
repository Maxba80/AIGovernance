import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** Free-text tags: Enter or comma adds, Backspace on an empty field removes the last one. */
export function TagInput({ id, value, onChange, placeholder, ariaLabel }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-line-strong bg-surface px-1.5 py-1 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
      {value.map((tag) => (
        <span key={tag} className="inline-flex max-w-full items-center gap-1 rounded border border-line bg-surface2 py-0.5 pl-1.5 pr-0.5 text-xs text-fg">
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== tag))}
            aria-label={`Remove ${tag}`}
            className="rounded p-0.5 text-muted hover:bg-line hover:text-fg"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="h-6 min-w-[120px] flex-1 border-0 bg-transparent px-1 text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:ring-0"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
