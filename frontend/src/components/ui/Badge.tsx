import type { ReactNode } from 'react';
import { cn } from '../../lib/format';

export type Tone = 'green' | 'amber' | 'red' | 'grey' | 'indigo' | 'blue' | 'violet' | 'teal' | 'orange';

const solid: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30',
  grey: 'bg-surface2 text-muted border-line',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30',
  blue: 'bg-transparent text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-500/50',
  violet: 'bg-transparent text-violet-700 border-violet-300 dark:text-violet-300 dark:border-violet-500/50',
  teal: 'bg-transparent text-teal-700 border-teal-300 dark:text-teal-300 dark:border-teal-500/50',
  orange: 'bg-transparent text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-500/50',
};

const outline: Record<Tone, string> = {
  green: 'bg-transparent text-emerald-700 border-emerald-400 dark:text-emerald-300 dark:border-emerald-500/60',
  amber: 'bg-transparent text-amber-700 border-amber-400 dark:text-amber-300 dark:border-amber-500/60',
  red: 'bg-transparent text-red-700 border-red-400 dark:text-red-300 dark:border-red-500/60',
  grey: 'bg-transparent text-muted border-line-strong',
  indigo: 'bg-transparent text-indigo-700 border-indigo-300 dark:text-indigo-300 dark:border-indigo-500/60',
  blue: solid.blue,
  violet: solid.violet,
  teal: solid.teal,
  orange: solid.orange,
};

const dot: Record<Tone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  grey: 'bg-slate-400',
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
};

interface BadgeProps {
  tone?: Tone;
  variant?: 'solid' | 'outline';
  withDot?: boolean;
  mono?: boolean;
  strike?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'grey', variant = 'solid', withDot, mono, strike, title, className, children }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-medium leading-4',
        variant === 'outline' ? outline[tone] : solid[tone],
        mono && 'font-mono text-[11px]',
        strike && 'line-through opacity-60',
        className,
      )}
    >
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', dot[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: Tone }) {
  return <span className={cn('inline-block h-2 w-2 rounded-full', dot[tone])} aria-hidden />;
}
