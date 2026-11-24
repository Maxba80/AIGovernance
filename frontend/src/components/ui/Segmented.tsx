import { cn } from '../../lib/format';

interface SegmentedProps<T extends string> {
  options: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/** Compact segmented control (same look as the scope switch of the audit trail). */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-md border border-line bg-surface2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex h-7 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-xs font-medium',
            value === o.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular-nums text-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
