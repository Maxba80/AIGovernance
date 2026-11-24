import type { ReactNode } from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '../../lib/format';
import { errorMessage } from '../../lib/api';
import { Button } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface2', className)} />;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-6' : 'py-12')}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-muted">
        {icon ?? <Inbox className="h-4 w-4" />}
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-md text-xs text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({ error, title = 'Could not load this data', onRetry, compact }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-6' : 'py-10')} role="alert">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="mt-1 max-w-md break-words text-xs text-muted">{errorMessage(error)}</p>
      {onRetry && (
        <Button size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

type NoticeTone = 'info' | 'warning' | 'error' | 'success';

const noticeTones: Record<NoticeTone, string> = {
  info: 'border-line bg-surface2 text-fg',
  warning: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
};

export function Notice({ tone = 'info', className, children }: { tone?: NoticeTone; className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-md border px-3 py-2 text-xs', noticeTones[tone], className)} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number | null | undefined;
  tone?: 'accent' | 'amber' | 'green' | 'red';
  className?: string;
}

const barTones = { accent: 'bg-accent', amber: 'bg-amber-500', green: 'bg-emerald-500', red: 'bg-red-500' };

export function ProgressBar({ value, tone = 'amber', className }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface2', className)}
      style={{ height: 6 }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <div className={cn('h-full rounded-full transition-all duration-500', barTones[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}
