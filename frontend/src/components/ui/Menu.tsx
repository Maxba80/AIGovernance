import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/format';

interface MenuProps {
  /** Renders the trigger; call `toggle` on click. */
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  align?: 'left' | 'right';
  width?: string;
  children: (close: () => void) => ReactNode;
}

export function Menu({ trigger, align = 'left', width = 'w-64', children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-30 mt-1.5 rounded-lg border border-line bg-surface p-1 shadow-panel',
            width,
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  onClick: () => void;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
}

export function MenuItem({ onClick, icon, active, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-surface2',
        active ? 'text-accent-text' : 'text-fg',
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}
