import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, qk } from '../../lib/api';
import { useWorkspace } from '../../lib/workspace';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/format';
import { usePrefs } from '../../lib/prefs';
import { NAV_ITEMS } from './nav';

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = usePrefs();
  const { current } = useWorkspace();
  const wid = current?.id ?? '';
  // Pending approvals of every kind, shown as a badge on "Evidence" (where the approval queue lives).
  const approvals = useQuery({
    queryKey: qk.approvals(wid),
    queryFn: () => api.listApprovals(wid, 'pending'),
    enabled: !!wid,
    refetchInterval: 15_000,
  });
  const pending = approvals.data?.length ?? 0;

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex flex-col border-r border-line bg-surface transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5 border-b border-line', collapsed ? 'justify-center' : 'px-4')}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-white">
          <ShieldCheck className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-fg">AI Governance</div>
            <div className="truncate text-[11px] text-muted">Risk &amp; Compliance</div>
          </div>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const badge = item.to === '/evidence' && pending > 0 ? pending : 0;
          const badgeTitle = `${badge} pending approval${badge === 1 ? '' : 's'}`;
          return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={
              collapsed
                ? item.milestone
                  ? `${item.label} (${item.milestone})`
                  : badge
                    ? `${item.label} — ${badgeTitle}`
                    : item.label
                : undefined
            }
            className={({ isActive }) =>
              cn(
                'group relative flex h-8 items-center gap-2.5 rounded-md text-sm transition-colors',
                collapsed ? 'justify-center' : 'px-2.5',
                isActive ? 'bg-accent/10 font-medium text-accent-text' : 'text-muted hover:bg-surface2 hover:text-fg',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {!collapsed && item.milestone && (
              <span className="rounded border border-line px-1 text-[10px] font-medium leading-4 text-muted">{item.milestone}</span>
            )}
            {badge > 0 &&
              (collapsed ? (
                <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-amber-500" aria-label={badgeTitle} />
              ) : (
                <span
                  title={badgeTitle}
                  aria-label={badgeTitle}
                  className="rounded-full bg-amber-100 px-1.5 text-xs font-medium leading-5 tabular-nums text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              ))}
          </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line p-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : undefined}
          className={cn(
            'flex h-8 w-full items-center gap-2.5 rounded-md text-sm text-muted hover:bg-surface2 hover:text-fg',
            collapsed ? 'justify-center' : 'px-2.5',
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
