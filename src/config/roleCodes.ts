/**
 * 固定角色代码（纯英文，不可修改）
 * 用于权限绑定、任务流转、数据存储；展示名称见 roleDisplay / roleConfigStore
 */
export const ROLE_CODE = {
  STRATEGY: 'STRATEGY',
  MEDIA: 'MEDIA',
  CONVERSION: 'CONVERSION',
  ADS: 'ADS',
  VERA: 'VERA',
  PM: 'PM',
  ADMIN: 'ADMIN',
  AI: 'AI',
} as const;

export type RoleCodeValue = (typeof ROLE_CODE)[keyof typeof ROLE_CODE];

/** 参与任务分配的业务角色（不含 ADMIN） */
export type AssignableRoleCode =
  | typeof ROLE_CODE.STRATEGY
  | typeof ROLE_CODE.MEDIA
  | typeof ROLE_CODE.CONVERSION
  | typeof ROLE_CODE.ADS
  | typeof ROLE_CODE.VERA
  | typeof ROLE_CODE.PM;

export const WORKFLOW_ROLE_CODES: AssignableRoleCode[] = [
  ROLE_CODE.STRATEGY,
  ROLE_CODE.MEDIA,
  ROLE_CODE.CONVERSION,
  ROLE_CODE.ADS,
  ROLE_CODE.VERA,
  ROLE_CODE.PM,
];

export const LOGIN_ROLE_CODES: (AssignableRoleCode | typeof ROLE_CODE.ADMIN)[] = [
  ...WORKFLOW_ROLE_CODES,
  ROLE_CODE.ADMIN,
];

export const ALL_ROLE_CODES: RoleCodeValue[] = [
  ...LOGIN_ROLE_CODES,
  ROLE_CODE.AI,
];

/** localStorage 中旧版中英文混合代码 → 新代码 */
export const LEGACY_ROLE_CODE_MAP: Record<string, RoleCodeValue> = {
  小S: ROLE_CODE.STRATEGY,
  小M: ROLE_CODE.MEDIA,
  小C: ROLE_CODE.CONVERSION,
  小A: ROLE_CODE.ADS,
  Vera: ROLE_CODE.VERA,
  胖虎: ROLE_CODE.PM,
  管理员: ROLE_CODE.ADMIN,
  龙虾: ROLE_CODE.AI,
  AI: ROLE_CODE.AI,
};

export function normalizeRoleCode(raw: string): RoleCodeValue | null {
  if (ALL_ROLE_CODES.includes(raw as RoleCodeValue)) return raw as RoleCodeValue;
  return LEGACY_ROLE_CODE_MAP[raw] ?? null;
}
