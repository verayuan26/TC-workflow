import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { LoginRole } from '../types/session';
import { LEGACY_ROLE_CODE_MAP, LOGIN_ROLE_CODES } from '../config/roleCodes';

const STORAGE_KEY = 'tiger-workflow-role';

function normalizeSessionRole(raw: string | null): LoginRole | null {
  if (!raw) return null;
  const mapped = LEGACY_ROLE_CODE_MAP[raw] ?? raw;
  return LOGIN_ROLE_CODES.includes(mapped as LoginRole) ? (mapped as LoginRole) : null;
}

interface SessionContextValue {
  role: LoginRole | null;
  login: (role: LoginRole) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<LoginRole | null>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return normalizeSessionRole(saved);
  });

  useEffect(() => {
    if (role) sessionStorage.setItem(STORAGE_KEY, role);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [role]);

  const login = useCallback((r: LoginRole) => setRole(r), []);
  const logout = useCallback(() => setRole(null), []);

  return (
    <SessionContext.Provider value={{ role, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
