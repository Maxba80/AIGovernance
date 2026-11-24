import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, LogOut, Moon, Plus, Sun, UserRound } from 'lucide-react';
import { cn } from '../../lib/format';
import { useAuth } from '../../lib/auth';
import { landingFor, ROLE_VIEWS, usePrefs, type RoleView } from '../../lib/prefs';
import { useWorkspace } from '../../lib/workspace';
import { Button } from '../ui/Button';
import { Menu, MenuItem } from '../ui/Menu';

function WorkspaceSwitcher() {
  const { workspaces, current, isLoading, error, select, openCreate } = useWorkspace();
  const label = isLoading ? 'Loading…' : error ? 'Workspaces unavailable' : (current?.name ?? 'No workspace');

  return (
    <Menu
      width="w-72"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex h-9 max-w-[260px] items-center gap-2 rounded-md border border-line-strong bg-surface px-2.5 text-sm shadow-sm hover:bg-surface2"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/15 text-[11px] font-semibold uppercase text-accent-text">
            {current?.name.charAt(0) ?? '–'}
          </span>
          <span className="min-w-0 truncate font-medium text-fg">{label}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Workspaces</div>
          <div className="max-h-64 overflow-y-auto">
            {workspaces.length === 0 && <div className="px-2.5 py-2 text-xs text-muted">No workspaces yet.</div>}
            {workspaces.map((w) => (
              <MenuItem
                key={w.id}
                active={w.id === current?.id}
                icon={<Check className={cn('h-3.5 w-3.5', w.id === current?.id ? 'opacity-100' : 'opacity-0')} />}
                onClick={() => {
                  select(w.id);
                  close();
                }}
              >
                {w.name}
              </MenuItem>
            ))}
          </div>
          <div className="my-1 border-t border-line" />
          <MenuItem
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              openCreate();
              close();
            }}
          >
            New workspace
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

function RoleSwitch() {
  const { role, setRole } = usePrefs();
  const navigate = useNavigate();
  const choose = (r: RoleView) => {
    setRole(r);
    navigate(landingFor(r));
  };
  return (
    <div role="radiogroup" aria-label="Role view" className="flex h-9 items-center rounded-md border border-line bg-surface2 p-0.5">
      {ROLE_VIEWS.map((r) => (
        <button
          key={r.id}
          type="button"
          role="radio"
          aria-checked={role === r.id}
          onClick={() => choose(r.id)}
          className={cn(
            'h-full rounded px-2.5 text-xs font-medium transition-colors',
            role === r.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function TopBar() {
  const { theme, toggleTheme } = usePrefs();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/90 px-5 backdrop-blur">
      <WorkspaceSwitcher />
      <div className="flex-1" />
      <RoleSwitch />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Menu
        align="right"
        width="w-60"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            onClick={toggle}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="User menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface2 text-xs font-semibold uppercase text-fg hover:ring-2 hover:ring-accent/30"
          >
            {user?.name?.charAt(0) || user?.email?.charAt(0) || <UserRound className="h-4 w-4" />}
          </button>
        )}
      >
        {(close) => (
          <>
            <div className="px-2.5 py-2">
              <div className="truncate text-sm font-medium text-fg">{user?.name ?? 'Signed in'}</div>
              {user?.email && <div className="truncate text-xs text-muted">{user.email}</div>}
              {user?.role && <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">{user.role}</div>}
            </div>
            <div className="my-1 border-t border-line" />
            <MenuItem
              icon={<LogOut className="h-3.5 w-3.5" />}
              onClick={() => {
                close();
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Sign out
            </MenuItem>
          </>
        )}
      </Menu>
    </header>
  );
}
