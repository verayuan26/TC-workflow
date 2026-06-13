import type { LoginRole, WorkflowRole } from '../types/session';
import {
  ALL_ROLE_CODES,
  LEGACY_ROLE_CODE_MAP,
  ROLE_CODE,
  type RoleCodeValue,
} from '../config/roleCodes';

/** 固定角色代码（纯英文） */
export type RoleCode = RoleCodeValue;

export { ALL_ROLE_CODES, ROLE_CODE };

/** 管理员可编辑的展示字段 */
export interface RoleNameOverride {
  formalName?: string;
  alias?: string;
}

export interface RoleNameConfig {
  code: RoleCode;
  formalName: string;
  alias: string;
}

const STORAGE_KEY = 'tiger-workflow-role-names';

/** 系统默认展示名（重置时恢复；别称保留团队习惯叫法） */
export const DEFAULT_ROLE_NAMES: Record<RoleCode, { formalName: string; alias: string }> = {
  [ROLE_CODE.STRATEGY]: { formalName: '内容策略师', alias: '小S' },
  [ROLE_CODE.MEDIA]: { formalName: '视频制作师', alias: '小M' },
  [ROLE_CODE.CONVERSION]: { formalName: '转化追踪师', alias: '小C' },
  [ROLE_CODE.ADS]: { formalName: '广告投放师', alias: '小A' },
  [ROLE_CODE.VERA]: { formalName: '业务负责人', alias: 'Vera' },
  [ROLE_CODE.PM]: { formalName: '项目经理', alias: '胖虎' },
  [ROLE_CODE.ADMIN]: { formalName: '系统管理员', alias: '管理员' },
  [ROLE_CODE.AI]: { formalName: 'AI 内容助手', alias: 'AI' },
};

type OverrideMap = Partial<Record<RoleCode, RoleNameOverride>>;

let overrides: OverrideMap = loadOverrides();
const listeners = new Set<() => void>();

function migrateOverrideKeys(raw: Record<string, RoleNameOverride>): OverrideMap {
  const next: OverrideMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const code = LEGACY_ROLE_CODE_MAP[key] ?? (ALL_ROLE_CODES.includes(key as RoleCode) ? key as RoleCode : null);
    if (code) next[code] = value;
  }
  return next;
}

function loadOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateOverrideKeys(JSON.parse(raw) as Record<string, RoleNameOverride>);
  } catch { /* ignore */ }
  return {};
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeRoleConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRoleNameConfig(code: RoleCode): { formalName: string; alias: string } {
  const def = DEFAULT_ROLE_NAMES[code];
  const ov = overrides[code];
  const formalName = ov?.formalName?.trim() || def.formalName;
  const alias = ov?.alias?.trim() || def.alias;
  return { formalName, alias };
}

export function getAllRoleNameConfigs(): RoleNameConfig[] {
  return ALL_ROLE_CODES.map((code) => ({
    code,
    ...getRoleNameConfig(code),
  }));
}

export function updateRoleNameConfig(
  code: RoleCode,
  patch: RoleNameOverride,
): RoleNameConfig {
  const formalName = patch.formalName?.trim();
  const alias = patch.alias?.trim();

  if (formalName !== undefined && !formalName) {
    throw new Error('角色名称不能为空');
  }
  if (alias !== undefined && !alias) {
    throw new Error('别称不能为空');
  }

  const current = getRoleNameConfig(code);
  const next: RoleNameOverride = {
    formalName: formalName ?? current.formalName,
    alias: alias ?? current.alias,
  };

  const def = DEFAULT_ROLE_NAMES[code];
  if (next.formalName === def.formalName && next.alias === def.alias) {
    delete overrides[code];
  } else {
    overrides[code] = next;
  }

  persist();
  notify();
  return { code, ...getRoleNameConfig(code) };
}

export function resetRoleNameConfig(code?: RoleCode): void {
  if (code) {
    delete overrides[code];
  } else {
    overrides = {};
  }
  persist();
  notify();
}

export function isWorkflowRoleCode(code: string): code is WorkflowRole {
  return [
    ROLE_CODE.STRATEGY,
    ROLE_CODE.MEDIA,
    ROLE_CODE.CONVERSION,
    ROLE_CODE.ADS,
    ROLE_CODE.VERA,
    ROLE_CODE.PM,
  ].includes(code as WorkflowRole);
}

export function isLoginRoleCode(code: string): code is LoginRole {
  return isWorkflowRoleCode(code) || code === ROLE_CODE.ADMIN;
}

export function resolveRoleCode(raw: string): RoleCode | null {
  if (ALL_ROLE_CODES.includes(raw as RoleCode)) return raw as RoleCode;
  return LEGACY_ROLE_CODE_MAP[raw] ?? null;
}
