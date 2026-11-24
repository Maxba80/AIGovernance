import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getToken, qk, setToken, UNAUTHORIZED_EVENT, type User } from './api';

interface AuthValue {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setTok] = useState<string | null>(() => getToken());

  const logout = useCallback(() => {
    setToken(null);
    setTok(null);
    qc.clear();
  }, [qc]);

  // Any 401 clears the token (in the API client) and lands here.
  useEffect(() => {
    const onUnauthorized = () => {
      setTok(null);
      qc.clear();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [qc]);

  // Keep several tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'aigrc.token') setTok(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const meQuery = useQuery({ queryKey: qk.me, queryFn: api.me, enabled: !!token, staleTime: 5 * 60_000 });

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      setToken(res.access_token);
      qc.clear();
      qc.setQueryData(qk.me, res.user);
      setTok(res.access_token);
      return res.user;
    },
    [qc],
  );

  const value = useMemo<AuthValue>(
    () => ({ token, user: token ? (meQuery.data ?? null) : null, login, logout }),
    [token, meQuery.data, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
