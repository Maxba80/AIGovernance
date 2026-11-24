import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type RoleView = 'executive' | 'compliance' | 'auditor';

export const ROLE_VIEWS: Array<{ id: RoleView; label: string; landing: string }> = [
  { id: 'executive', label: 'Executive', landing: '/' },
  { id: 'compliance', label: 'Compliance', landing: '/evidence' },
  { id: 'auditor', label: 'Auditor', landing: '/activity' },
];

const THEME_KEY = 'aigrc.theme';
const ROLE_KEY = 'aigrc.roleView';
const SIDEBAR_KEY = 'aigrc.sidebarCollapsed';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getRoleView(): RoleView {
  const v = read(ROLE_KEY);
  return v === 'compliance' || v === 'auditor' || v === 'executive' ? v : 'executive';
}

export function landingFor(role: RoleView): string {
  return ROLE_VIEWS.find((r) => r.id === role)?.landing ?? '/';
}

interface PrefsValue {
  theme: Theme;
  toggleTheme: () => void;
  role: RoleView;
  setRole: (r: RoleView) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Theme | null>(() => {
    const v = read(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  });
  const [system, setSystem] = useState<Theme>(() => systemTheme());
  const [role, setRoleState] = useState<RoleView>(() => getRoleView());
  const [sidebarCollapsed, setCollapsed] = useState<boolean>(() => {
    // Until the user chooses, start collapsed on narrow screens so tables keep their width.
    const v = read(SIDEBAR_KEY);
    return v === null ? window.innerWidth < 1280 : v === '1';
  });

  // Follow the system preference until the user makes an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme = stored ?? system;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    write(THEME_KEY, next);
    setStored(next);
  }, [theme]);

  const setRole = useCallback((r: RoleView) => {
    write(ROLE_KEY, r);
    setRoleState(r);
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      write(SIDEBAR_KEY, c ? '0' : '1');
      return !c;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, role, setRole, sidebarCollapsed, toggleSidebar }),
    [theme, toggleTheme, role, setRole, sidebarCollapsed, toggleSidebar],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
