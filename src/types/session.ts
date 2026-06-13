import type { Role } from './index';
import {
  ROLE_CODE,
  LOGIN_ROLE_CODES,
  type AssignableRoleCode,
} from '../config/roleCodes';

/** 原型登录可选角色（固定英文代码） */
export type LoginRole = AssignableRoleCode | typeof ROLE_CODE.ADMIN;

/** 参与任务流转的业务角色（不含 ADMIN） */
export type WorkflowRole = AssignableRoleCode;

/** 任务负责人等业务角色 */
export type TaskRole = Role;

export interface RoleProfile {
  role: LoginRole;
  /** 顶栏标题：正式名 · 职责 */
  label: string;
  formalName: string;
  alias: string;
  tagline: string;
  description: string;
  accent: string;
}

export { roleLabel, roleFormalName, roleAlias, roleLoginTitle, getTaskStatusLabel } from '../config/roleDisplay';

import { LOGIN_ROLES, roleProfileFromKey } from '../config/roleDisplay';

/** @deprecated 请使用 useRoleDisplay().profiles */
export const ROLE_PROFILES: RoleProfile[] = LOGIN_ROLES.map((role) => roleProfileFromKey(role));

export { LOGIN_ROLE_CODES };
