import type { LoginRole, WorkflowRole } from '../types/session';
import type { Role, TaskStatus } from '../types';
import { ROLE_CODE } from '../config/roleCodes';
import {
  getRoleNameConfig,
  isLoginRoleCode,
  resolveRoleCode,
  type RoleCode,
} from '../services/roleConfigStore';

/** 系统内部角色键（数据层不变） */
export type RoleKey = Role | typeof ROLE_CODE.PM | typeof ROLE_CODE.ADMIN | typeof ROLE_CODE.AI;

export interface RoleDisplayMeta {
  formalName: string;
  alias: string;
  tagline: string;
  description: string;
}

/** 固定职责描述（不可由管理员修改） */
const ROLE_STATIC_META: Record<WorkflowRole | typeof ROLE_CODE.ADMIN, Pick<RoleDisplayMeta, 'tagline' | 'description'>> = {
  [ROLE_CODE.STRATEGY]: {
    tagline: '脚本 · SEO · 终审',
    description: '审核 AI 脚本、推进内容终审、完成数据复盘',
  },
  [ROLE_CODE.MEDIA]: {
    tagline: '剪辑 · 封面 · 成片',
    description: '接收脚本素材、完成剪辑并提交终审',
  },
  [ROLE_CODE.CONVERSION]: {
    tagline: '链接 · UTM · 页面',
    description: '确认落地页与 UTM，确保发布前追踪就绪',
  },
  [ROLE_CODE.ADS]: {
    tagline: '投放 · 预算 · 复盘',
    description: '搭建广告、申请预算、录入投放数据',
  },
  [ROLE_CODE.VERA]: {
    tagline: '风险 · 预算 · 拍板',
    description: '审核高风险内容与广告预算变更，全局调整计划',
  },
  [ROLE_CODE.PM]: {
    tagline: '派发 · 阻塞 · 闭环',
    description: '派发 AI 草稿、处理阻塞、确认本周任务闭环',
  },
  [ROLE_CODE.ADMIN]: {
    tagline: '权限 · 用户 · 配置',
    description: '管理用户角色权限、查看系统运行概况',
  },
};

const AI_STATIC_META = {
  tagline: '草稿生成',
  description: '自动生成脚本与内容草稿',
};

export function getRoleDisplayMeta(role: string): RoleDisplayMeta | null {
  const code = resolveRoleCode(role);
  if (!code) return null;

  if (code === ROLE_CODE.AI) {
    const names = getRoleNameConfig(ROLE_CODE.AI);
    return { ...names, ...AI_STATIC_META };
  }

  const names = getRoleNameConfig(code);
  const staticMeta = ROLE_STATIC_META[code as WorkflowRole | typeof ROLE_CODE.ADMIN];
  return { ...names, ...staticMeta };
}

export function isKnownRoleKey(key: string): key is WorkflowRole | typeof ROLE_CODE.ADMIN {
  return isLoginRoleCode(key);
}

/** 正式名称，如「内容策略师」 */
export function roleFormalName(role: string): string {
  const meta = getRoleDisplayMeta(role);
  return meta?.formalName ?? role;
}

/** 别称，如「小S」 */
export function roleAlias(role: string): string {
  const meta = getRoleDisplayMeta(role);
  return meta?.alias ?? role;
}

/** 正式名 + 别称，如「内容策略师（小S）」 */
export function roleLabel(role: string, showAlias = true): string {
  const meta = getRoleDisplayMeta(role);
  if (!meta) return role;
  if (!showAlias || meta.formalName === meta.alias) return meta.formalName;
  return `${meta.formalName}（${meta.alias}）`;
}

/** 登录页/顶栏用：正式名 · 职责关键词 */
export function roleLoginTitle(role: LoginRole): string {
  const meta = getRoleDisplayMeta(role);
  if (!meta) return role;
  return `${meta.formalName} · ${meta.tagline.split(' · ')[0]}`;
}

export function roleProfileFromKey(role: LoginRole) {
  const meta = getRoleDisplayMeta(role)!;
  return {
    role,
    label: roleLoginTitle(role),
    alias: meta.alias,
    formalName: meta.formalName,
    tagline: meta.tagline,
    description: meta.description,
    accent: roleAccent(role),
  };
}

export function roleAccent(role: LoginRole | WorkflowRole): string {
  const map: Record<string, string> = {
    [ROLE_CODE.STRATEGY]: 'blue',
    [ROLE_CODE.MEDIA]: 'amber',
    [ROLE_CODE.CONVERSION]: 'cyan',
    [ROLE_CODE.ADS]: 'orange',
    [ROLE_CODE.VERA]: 'gold',
    [ROLE_CODE.PM]: 'emerald',
    [ROLE_CODE.ADMIN]: 'violet',
  };
  return map[role] ?? 'surface';
}

export const LOGIN_ROLES: LoginRole[] = [
  ROLE_CODE.STRATEGY,
  ROLE_CODE.MEDIA,
  ROLE_CODE.CONVERSION,
  ROLE_CODE.ADS,
  ROLE_CODE.VERA,
  ROLE_CODE.PM,
  ROLE_CODE.ADMIN,
];

/** 任务状态展示文案（随角色名称动态更新） */
export function getTaskStatusLabel(status: TaskStatus): string {
  const R = roleFormalName;
  const map: Record<TaskStatus, string> = {
    '01_AI_PENDING': `${R(ROLE_CODE.AI)}待生成`,
    '02_STRATEGY_REVIEW': `${R(ROLE_CODE.STRATEGY)}待审`,
    '03_CONVERSION_URL': `${R(ROLE_CODE.CONVERSION)}待确认`,
    '04_MEDIA_EDIT': `${R(ROLE_CODE.MEDIA)}待剪辑`,
    '05_STRATEGY_FINAL': `${R(ROLE_CODE.STRATEGY)}待终审`,
    '06_VERA_REVIEW': `${R(ROLE_CODE.VERA)}待审`,
    '07_PUBLISH_READY': '待发布',
    '08_PUBLISHED': '已发布',
    '09_DATA_REVIEW': '待复盘',
    '10_COMPLETED': '已完成',
    '11_BLOCKED': '已拦截',
    '12_AUTO_APPROVED': '自动放行',
    '99_REWORK': '暂停/返工',
  };
  return map[status] ?? status;
}

export type { RoleCode };
