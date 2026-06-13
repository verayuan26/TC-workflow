import { useState, useEffect, useCallback } from 'react';
import { Users, Shield, UserCheck, UserX, RotateCcw, UserPlus, X, Tag, Save } from 'lucide-react';
import { RoleLayout } from '../../components/RoleLayout';
import { StatCard } from '../../components/stats/StatCard';
import {
  getUsers, toggleUserEnabled, toggleUserRole, createUser, ALL_ASSIGNABLE_ROLES, resetUsers,
  type SystemUser, type AssignableRole,
} from '../../services/userStore';
import { roleLabel } from '../../config/roleDisplay';
import { useRoleDisplay } from '../../context/RoleDisplayContext';
import { DEFAULT_ROLE_NAMES, ROLE_CODE, type RoleCode } from '../../services/roleConfigStore';
import { getTasks } from '../../services/taskApi';
import { computeGlobalStats } from '../../utils/taskStats';

const ROLE_CHIP: Record<AssignableRole, string> = {
  STRATEGY: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  MEDIA: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  CONVERSION: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  ADS: 'bg-orange-950/60 text-orange-300 border-orange-800/50',
  VERA: 'bg-gold-900/40 text-gold-300 border-gold-700/40',
  PM: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
};

export function AdminWorkspace() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [taskStats, setTaskStats] = useState({ total: 0, veraPending: 0, blocked: 0 });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const reload = useCallback(() => {
    setUsers(getUsers());
    getTasks().then((tasks) => {
      const g = computeGlobalStats(tasks);
      setTaskStats({ total: g.total, veraPending: g.veraPending, blocked: g.blocked });
    });
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const enabledCount = users.filter((u) => u.enabled).length;
  const roleCoverage = ALL_ASSIGNABLE_ROLES.filter((r) =>
    users.some((u) => u.enabled && u.roles.includes(r)),
  ).length;

  return (
    <RoleLayout stepHint="用户权限 · 系统配置">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="系统用户" value={users.length} sub={`${enabledCount} 已启用`} accent="surface" icon={<Users size={12} />} />
          <StatCard label="角色覆盖" value={`${roleCoverage}/6`} sub="执行角色均有负责人" accent="emerald" icon={<UserCheck size={12} />} />
          <StatCard label="系统任务" value={taskStats.total} accent="surface" icon={<Shield size={12} />} />
          <StatCard label={`待${roleLabel('VERA', false)}审核`} value={taskStats.veraPending} accent="gold" icon={<Shield size={12} />} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-surface-100">用户与角色权限</h2>
            <p className="text-xs text-surface-500 mt-0.5">为用户分配可登录的业务角色，禁用后无法进入对应工作台</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="btn-gold flex items-center gap-1.5"
            >
              <UserPlus size={12} /> 新建用户
            </button>
            <button
              type="button"
              onClick={() => { resetUsers(); reload(); setShowCreateForm(false); }}
              className="btn-ghost flex items-center gap-1.5"
            >
              <RotateCcw size={12} /> 重置
            </button>
          </div>
        </div>

        {showCreateForm && (
          <CreateUserForm
            onCancel={() => setShowCreateForm(false)}
            onCreated={() => { reload(); setShowCreateForm(false); }}
          />
        )}

        <RoleNameConfigPanel />

        <div className="card border border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-700 bg-surface-800/50 text-surface-500">
                  <th className="text-left px-4 py-2.5 font-medium">用户</th>
                  <th className="text-left px-4 py-2.5 font-medium">角色权限</th>
                  <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">最近登录</th>
                  <th className="text-center px-4 py-2.5 font-medium w-20">状态</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onToggleRole={(role) => { toggleUserRole(user.id, role); reload(); }}
                    onToggleEnabled={() => { toggleUserEnabled(user.id); reload(); }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-surface-600">
          原型说明：用户与角色名称保存在 localStorage。角色代码固定用于权限与任务流转，不可修改。
        </p>
      </div>
    </RoleLayout>
  );
}

function CreateUserForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: AssignableRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      createUser({ name, email, roles, enabled });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card border border-violet-500/20 bg-violet-950/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-surface-100">新建用户</p>
        <button type="button" onClick={onCancel} className="text-surface-500 hover:text-surface-300 p-1">
          <X size={16} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 block mb-1">姓名 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="如：王五"
            className="w-full bg-surface-800 border border-surface-600 rounded px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-surface-500 block mb-1">邮箱 *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@tiger.local"
            className="w-full bg-surface-800 border border-surface-600 rounded px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-surface-500 block mb-1.5">初始角色（可多选）</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ASSIGNABLE_ROLES.map((role) => {
            const active = roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`text-[10px] px-2 py-1 rounded border transition-all ${
                  active ? ROLE_CHIP[role] : 'bg-surface-800 text-surface-500 border-surface-700 hover:border-surface-500'
                }`}
              >
                {roleLabel(role)}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-surface-400 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="rounded border-surface-600"
        />
        创建后立即启用
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="btn-gold px-4 py-2">
          {loading ? '创建中...' : '确认创建'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2">
          取消
        </button>
      </div>
    </form>
  );
}

function UserRow({
  user,
  onToggleRole,
  onToggleEnabled,
}: {
  user: SystemUser;
  onToggleRole: (role: AssignableRole) => void;
  onToggleEnabled: () => void;
}) {
  return (
    <tr className={`border-b border-surface-800 last:border-0 ${!user.enabled ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <p className="font-medium text-surface-200">{user.name}</p>
        <p className="text-[10px] text-surface-600 mt-0.5">{user.email}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {ALL_ASSIGNABLE_ROLES.map((role) => {
            const active = user.roles.includes(role);
            return (
              <button
                key={role}
                type="button"
                disabled={!user.enabled}
                onClick={() => onToggleRole(role)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                  active ? ROLE_CHIP[role] : 'bg-surface-800 text-surface-600 border-surface-700 hover:border-surface-500'
                } ${!user.enabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {roleLabel(role)}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-4 py-3 text-surface-500 hidden sm:table-cell">{user.lastLogin ?? '-'}</td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={onToggleEnabled}
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${
            user.enabled
              ? 'text-emerald-400 border-emerald-700/40 bg-emerald-950/30'
              : 'text-surface-500 border-surface-700 bg-surface-800'
          }`}
        >
          {user.enabled ? <UserCheck size={11} /> : <UserX size={11} />}
          {user.enabled ? '启用' : '禁用'}
        </button>
      </td>
    </tr>
  );
}

const ADMIN_EDITABLE_CODES: RoleCode[] = [
  ROLE_CODE.STRATEGY,
  ROLE_CODE.MEDIA,
  ROLE_CODE.CONVERSION,
  ROLE_CODE.ADS,
  ROLE_CODE.VERA,
  ROLE_CODE.PM,
  ROLE_CODE.ADMIN,
  ROLE_CODE.AI,
];

function RoleNameConfigPanel() {
  const { roleConfigs, updateRoleNames, resetRoleNames } = useRoleDisplay();
  const [drafts, setDrafts] = useState<Record<string, { formalName: string; alias: string }>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, { formalName: string; alias: string }> = {};
    for (const cfg of roleConfigs) {
      next[cfg.code] = { formalName: cfg.formalName, alias: cfg.alias };
    }
    setDrafts(next);
  }, [roleConfigs]);

  const setDraft = (code: RoleCode, field: 'formalName' | 'alias', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const saveOne = (code: RoleCode) => {
    setMessage(null);
    setError(null);
    try {
      const draft = drafts[code];
      updateRoleNames(code, { formalName: draft.formalName, alias: draft.alias });
      setMessage(`已保存 ${code} 的角色名称`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const resetOne = (code: RoleCode) => {
    resetRoleNames(code);
    setMessage(`已恢复 ${code} 的默认名称`);
  };

  const resetAll = () => {
    resetRoleNames();
    setMessage('已恢复全部角色默认名称');
  };

  const isDirty = (code: RoleCode) => {
    const draft = drafts[code];
    const current = roleConfigs.find((c) => c.code === code);
    if (!draft || !current) return false;
    return draft.formalName !== current.formalName || draft.alias !== current.alias;
  };

  const isDefault = (code: RoleCode) => {
    const def = DEFAULT_ROLE_NAMES[code];
    const draft = drafts[code];
    return draft?.formalName === def.formalName && draft?.alias === def.alias;
  };

  return (
    <div className="card border border-surface-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-700 bg-surface-800/40 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
            <Tag size={14} className="text-violet-400" />
            角色名称配置
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">
            角色代码固定不变，用于权限绑定与任务流转；正式名称与别称可在全系统展示层调整
          </p>
        </div>
        <button type="button" onClick={resetAll} className="btn-ghost text-[10px] flex items-center gap-1 flex-shrink-0">
          <RotateCcw size={11} /> 全部恢复默认
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-700 text-surface-500">
              <th className="text-left px-4 py-2 font-medium w-24">角色代码</th>
              <th className="text-left px-4 py-2 font-medium">正式名称</th>
              <th className="text-left px-4 py-2 font-medium">别称</th>
              <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">预览</th>
              <th className="text-right px-4 py-2 font-medium w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_EDITABLE_CODES.map((code) => (
              <tr key={code} className="border-b border-surface-800 last:border-0">
                <td className="px-4 py-2.5">
                  <code className="text-[11px] text-gold-400/90 bg-surface-800 px-1.5 py-0.5 rounded border border-surface-700">
                    {code}
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="text"
                    value={drafts[code]?.formalName ?? ''}
                    onChange={(e) => setDraft(code, 'formalName', e.target.value)}
                    className="w-full min-w-[120px] bg-surface-800 border border-surface-600 rounded px-2 py-1.5 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="text"
                    value={drafts[code]?.alias ?? ''}
                    onChange={(e) => setDraft(code, 'alias', e.target.value)}
                    className="w-full min-w-[80px] bg-surface-800 border border-surface-600 rounded px-2 py-1.5 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50"
                  />
                </td>
                <td className="px-4 py-2.5 text-surface-400 hidden sm:table-cell">
                  {(() => {
                    const d = drafts[code];
                    if (!d) return '-';
                    if (!d.alias || d.formalName === d.alias) return d.formalName;
                    return `${d.formalName}（${d.alias}）`;
                  })()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={!isDirty(code)}
                      onClick={() => saveOne(code)}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-gold-700/40 text-gold-300 bg-gold-950/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Save size={10} /> 保存
                    </button>
                    {!isDefault(code) && (
                      <button
                        type="button"
                        onClick={() => resetOne(code)}
                        className="text-[10px] px-2 py-1 rounded border border-surface-600 text-surface-500 hover:text-surface-300"
                      >
                        默认
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className="px-4 py-2 text-[11px] text-emerald-400 border-t border-surface-800">{message}</p>}
      {error && <p className="px-4 py-2 text-[11px] text-red-400 border-t border-surface-800">{error}</p>}
    </div>
  );
}
