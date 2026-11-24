import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/format';
import { usePrefs } from '../../lib/prefs';
import { NAV_ITEMS } from './nav';

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = usePrefs();

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
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? (item.milestone ? `${item.label} (${item.milestone})` : item.label) : undefined}
            className={({ isActive }) =>
              cn(
                'group flex h-8 items-center gap-2.5 rounded-md text-sm transition-colors',
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
          </NavLink>
        ))}
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
