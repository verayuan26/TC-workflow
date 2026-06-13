import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginRole } from '../types/session';
import type { RoleProfile } from '../types/session';
import {
  getAllRoleNameConfigs,
  resetRoleNameConfig,
  subscribeRoleConfig,
  updateRoleNameConfig,
  type RoleCode,
  type RoleNameConfig,
  type RoleNameOverride,
} from '../services/roleConfigStore';
import { LOGIN_ROLES, roleProfileFromKey } from '../config/roleDisplay';

interface RoleDisplayContextValue {
  profiles: RoleProfile[];
  roleConfigs: RoleNameConfig[];
  updateRoleNames: (code: RoleCode, patch: RoleNameOverride) => RoleNameConfig;
  resetRoleNames: (code?: RoleCode) => void;
}

const RoleDisplayContext = createContext<RoleDisplayContextValue | null>(null);

export function RoleDisplayProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeRoleConfig(() => setVersion((v) => v + 1)), []);

  const value = useMemo<RoleDisplayContextValue>(() => ({
    profiles: LOGIN_ROLES.map((role) => roleProfileFromKey(role)),
    roleConfigs: getAllRoleNameConfigs(),
    updateRoleNames: (code, patch) => {
      const result = updateRoleNameConfig(code, patch);
      setVersion((v) => v + 1);
      return result;
    },
    resetRoleNames: (code) => {
      resetRoleNameConfig(code);
      setVersion((v) => v + 1);
    },
  }), [version]);

  return (
    <RoleDisplayContext.Provider value={value}>
      {children}
    </RoleDisplayContext.Provider>
  );
}

export function useRoleDisplay(): RoleDisplayContextValue {
  const ctx = useContext(RoleDisplayContext);
  if (!ctx) throw new Error('useRoleDisplay must be used within RoleDisplayProvider');
  return ctx;
}

export function useRoleProfile(role: LoginRole | null | undefined): RoleProfile | undefined {
  const { profiles } = useRoleDisplay();
  if (!role) return undefined;
  return profiles.find((p) => p.role === role);
}
