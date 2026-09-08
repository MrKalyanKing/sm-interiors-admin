import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setSessionExpiredHandler, tokenStore } from '@/lib/api';
import type { AuthResponse, AuthUser, Role } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the stored token has been checked against the API. */
  initialising: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Role check that mirrors the backend's RolesGuard. */
  can: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Super admin outranks everything, exactly as the API decides it. */
const RANK: Record<Role, number> = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialising, setInitialising] = useState(true);
  const queryClient = useQueryClient();

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // The axios interceptor cannot navigate on its own, so it calls back here
  // once a refresh has definitively failed.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<AuthUser>('/users/me');
    setUser(data);
  }, []);

  // A stored token proves nothing — it may be expired or the account may have
  // been deactivated since. Ask the API who this is before rendering.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!tokenStore.access) {
        setInitialising(false);
        return;
      }
      try {
        const { data } = await api.get<AuthUser>('/users/me');
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) tokenStore.clear();
      } finally {
        if (!cancelled) setInitialising(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    tokenStore.set(data.accessToken, data.refreshToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    if (refreshToken) {
      // Best effort: if the network is down we still drop the local session.
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    clearSession();
  }, [clearSession]);

  const can = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      if (roles.length === 0) return true;
      const required = Math.min(...roles.map((role) => RANK[role]));
      return RANK[user.role] >= required;
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, initialising, login, logout, refreshUser, can }),
    [user, initialising, login, logout, refreshUser, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
