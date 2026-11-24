import type { ReactNode } from 'react';
import { cn } from '../../lib/format';

export interface CheckOption {
  id: string;
  label: ReactNode;
  description?: string | null;
}

interface CheckListProps {
  options: CheckOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/** Multi-select as a scrollable list of checkboxes. Selected ids missing from the options are kept. */
export function CheckList({ options, value, onChange, label, className }: CheckListProps) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div role="group" aria-label={label} className={cn('max-h-52 overflow-y-auto rounded-md border border-line-strong bg-surface', className)}>
      {options.map((o) => {
        const checked = value.includes(o.id);
        return (
          <label
            key={o.id}
            className={cn(
              'flex cursor-pointer items-start gap-2.5 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface2/60',
              checked && 'bg-accent/5',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(o.id)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-line-strong accent-indigo-600"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-fg [overflow-wrap:anywhere]">{o.label}</span>
              {o.description && <span className="mt-0.5 block text-xs text-muted">{o.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
