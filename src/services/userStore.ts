import type { LoginRole } from '../types/session';
import { LEGACY_ROLE_CODE_MAP } from '../config/roleCodes';

/** 可分配给业务用户的执行角色（不含系统管理员） */
export type AssignableRole = Extract<LoginRole, 'STRATEGY' | 'MEDIA' | 'CONVERSION' | 'ADS' | 'VERA' | 'PM'>;

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roles: AssignableRole[];
  enabled: boolean;
  lastLogin?: string;
}

const STORAGE_KEY = 'tiger-workflow-users';

const DEFAULT_USERS: SystemUser[] = [
  { id: 'u1', name: '王小明', email: 'xs@tiger.local', roles: ['STRATEGY'], enabled: true, lastLogin: '2026-06-10 09:12' },
  { id: 'u2', name: '李剪辑', email: 'xm@tiger.local', roles: ['MEDIA'], enabled: true, lastLogin: '2026-06-10 08:45' },
  { id: 'u3', name: '张追踪', email: 'xc@tiger.local', roles: ['CONVERSION'], enabled: true, lastLogin: '2026-06-09 17:30' },
  { id: 'u4', name: '赵投放', email: 'xa@tiger.local', roles: ['ADS'], enabled: true, lastLogin: '2026-06-10 10:00' },
  { id: 'u5', name: 'Vera', email: 'vera@tiger.local', roles: ['VERA'], enabled: true, lastLogin: '2026-06-10 11:20' },
  { id: 'u6', name: '胖虎', email: 'pm@tiger.local', roles: ['PM'], enabled: true, lastLogin: '2026-06-10 07:55' },
  { id: 'u7', name: '张三（兼岗）', email: 'zhang@tiger.local', roles: ['STRATEGY', 'CONVERSION'], enabled: true, lastLogin: '2026-06-08 14:00' },
  { id: 'u8', name: '李四', email: 'li@tiger.local', roles: ['MEDIA'], enabled: false },
];

let users: SystemUser[] = loadUsers();

function migrateUserRoles(roles: string[]): AssignableRole[] {
  return roles
    .map((r) => LEGACY_ROLE_CODE_MAP[r] ?? r)
    .filter((r): r is AssignableRole =>
      ['STRATEGY', 'MEDIA', 'CONVERSION', 'ADS', 'VERA', 'PM'].includes(r),
    );
}

function loadUsers(): SystemUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SystemUser[];
      return parsed.map((u) => ({ ...u, roles: migrateUserRoles(u.roles) }));
    }
  } catch { /* ignore */ }
  return DEFAULT_USERS.map((u) => ({ ...u }));
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUsers(): SystemUser[] {
  return users.map((u) => ({ ...u, roles: [...u.roles] }));
}

export function toggleUserEnabled(id: string): SystemUser {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error('用户不存在');
  u.enabled = !u.enabled;
  persist();
  return { ...u, roles: [...u.roles] };
}

export function toggleUserRole(id: string, role: AssignableRole): SystemUser {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error('用户不存在');
  if (u.roles.includes(role)) {
    u.roles = u.roles.filter((r) => r !== role);
  } else {
    u.roles = [...u.roles, role];
  }
  persist();
  return { ...u, roles: [...u.roles] };
}

export interface CreateUserInput {
  name: string;
  email: string;
  roles?: AssignableRole[];
  enabled?: boolean;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createUser(input: CreateUserInput): SystemUser {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (!name) throw new Error('请填写用户姓名');
  if (!email) throw new Error('请填写邮箱');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('邮箱格式不正确');

  if (users.some((u) => normalizeEmail(u.email) === email)) {
    throw new Error('该邮箱已存在');
  }

  const user: SystemUser = {
    id: `u${Date.now()}`,
    name,
    email,
    roles: input.roles?.length ? [...input.roles] : [],
    enabled: input.enabled ?? true,
  };

  users.push(user);
  persist();
  return { ...user, roles: [...user.roles] };
}

export const ALL_ASSIGNABLE_ROLES: AssignableRole[] = ['STRATEGY', 'MEDIA', 'CONVERSION', 'ADS', 'VERA', 'PM'];

export function resetUsers(): void {
  users = DEFAULT_USERS.map((u) => ({ ...u }));
  persist();
}
