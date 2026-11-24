import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, qk, type Workspace } from './api';

const KEY = 'aigrc.workspaceId';

interface WorkspaceValue {
  workspaces: Workspace[];
  current: Workspace | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  select: (id: string) => void;
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({ queryKey: qk.workspaces, queryFn: api.listWorkspaces });

  const select = useCallback((id: string) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* storage unavailable */
    }
    setSelectedId(id);
  }, []);

  const value = useMemo<WorkspaceValue>(() => {
    const workspaces = query.data ?? [];
    const current = workspaces.find((w) => w.id === selectedId) ?? workspaces[0] ?? null;
    return {
      workspaces,
      current,
      isLoading: query.isLoading,
      error: query.error,
      refetch: () => void query.refetch(),
      select,
      createOpen,
      openCreate: () => setCreateOpen(true),
      closeCreate: () => setCreateOpen(false),
    };
  }, [query, selectedId, select, createOpen]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
