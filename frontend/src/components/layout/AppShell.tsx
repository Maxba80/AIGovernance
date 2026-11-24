import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/format';
import { landingFor, usePrefs } from '../../lib/prefs';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

// The role view only decides where the app opens; after that every page is reachable.
let landingApplied = false;

export function AppShell() {
  const { sidebarCollapsed, role } = usePrefs();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (landingApplied) return;
    landingApplied = true;
    const landing = landingFor(role);
    if (location.pathname === '/' && landing !== '/') navigate(landing, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full">
      <Sidebar />
      <div className={cn('flex min-h-screen min-w-0 flex-col transition-[padding] duration-150', sidebarCollapsed ? 'pl-14' : 'pl-60')}>
        <TopBar />
        <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
      <CreateWorkspaceDialog />
    </div>
  );
}
