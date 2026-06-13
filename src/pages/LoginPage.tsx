import { useState } from 'react';
import { Eye, EyeOff, LogIn, ChevronDown, ChevronUp } from 'lucide-react';
import type { LoginRole } from '../types/session';
import { useSession } from '../context/SessionContext';

// ── Demo credential map ────────────────────────────────────────────────────

interface DemoAccount {
  role: LoginRole;
  username: string;
  password: string;
  label: string;
  tagline: string;
  accent: string;
  dot: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'VERA',
    username: 'vera',
    password: 'tiger2024',
    label: 'Vera · 业务负责人',
    tagline: '风险审核 · 预算拍板 · 全局视野',
    accent: 'border-gold-500/30 bg-gold-900/10',
    dot: 'bg-gold-400',
  },
  {
    role: 'PM',
    username: 'pm',
    password: 'tiger2024',
    label: '胖虎 · 项目经理',
    tagline: '任务派发 · 阻塞处理 · 周期闭环',
    accent: 'border-emerald-500/30 bg-emerald-900/10',
    dot: 'bg-emerald-400',
  },
  {
    role: 'STRATEGY',
    username: 'strategy',
    password: 'tiger2024',
    label: '小S · 内容策略师',
    tagline: '脚本审核 · SEO · 内容终审',
    accent: 'border-blue-500/30 bg-blue-900/10',
    dot: 'bg-blue-400',
  },
  {
    role: 'MEDIA',
    username: 'media',
    password: 'tiger2024',
    label: '小M · 视频制作师',
    tagline: '剪辑 · 封面 · 成片提交',
    accent: 'border-amber-500/30 bg-amber-900/10',
    dot: 'bg-amber-400',
  },
  {
    role: 'CONVERSION',
    username: 'conversion',
    password: 'tiger2024',
    label: '小C · 转化追踪师',
    tagline: '落地页 · UTM · 表单验证',
    accent: 'border-cyan-500/30 bg-cyan-900/10',
    dot: 'bg-cyan-400',
  },
  {
    role: 'ADS',
    username: 'ads',
    password: 'tiger2024',
    label: '小A · 广告投放师',
    tagline: '投放 · 预算申请 · 数据复盘',
    accent: 'border-orange-500/30 bg-orange-900/10',
    dot: 'bg-orange-400',
  },
  {
    role: 'ADMIN',
    username: 'admin',
    password: 'tiger2024',
    label: '管理员',
    tagline: '角色配置 · 权限管理',
    accent: 'border-violet-500/30 bg-violet-900/10',
    dot: 'bg-violet-400',
  },
];

const CREDENTIAL_MAP = new Map(
  DEMO_ACCOUNTS.map((a) => [a.username.toLowerCase(), a]),
);

// ── LoginPage ──────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    const account = CREDENTIAL_MAP.get(username.trim().toLowerCase());
    if (!account || account.password !== password) {
      setError('账号或密码错误');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(account.role);
    }, 350);
  };

  const quickLogin = (account: DemoAccount) => {
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
    setLoading(true);
    setTimeout(() => login(account.role), 280);
  };

  const inputBase =
    'w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-gold-500/60 transition-colors';

  return (
    <div className="min-h-screen bg-surface-950 flex">

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 border-r border-surface-800 bg-surface-900 p-10">
        <div>
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gold-400 rounded-lg mb-8">
            <span className="text-surface-950 font-black text-base">T</span>
          </div>
          <h2 className="text-lg font-bold text-surface-100 mb-2">Tiger Content Workflow</h2>
          <p className="text-sm text-surface-400 leading-relaxed">
            Tiger 跨境物流内容工作流平台，连接内容策略、视频制作、转化追踪与广告投放的完整闭环。
          </p>
        </div>

        {/* Role badges */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-surface-600 mb-3">团队角色</p>
          {DEMO_ACCOUNTS.filter((a) => a.role !== 'ADMIN').map((a) => (
            <button
              key={a.role}
              type="button"
              onClick={() => quickLogin(a)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left hover:opacity-90 ${a.accent}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-surface-200 truncate">{a.label}</p>
                <p className="text-[10px] text-surface-500 truncate">{a.tagline}</p>
              </div>
              <LogIn size={11} className="text-surface-600 flex-shrink-0 ml-auto" />
            </button>
          ))}
        </div>

        <p className="text-[10px] text-surface-600">原型演示 · 数据存于当前会话</p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Logo (mobile only) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gold-400 rounded-lg mb-3">
              <span className="text-surface-950 font-black text-base">T</span>
            </div>
            <h1 className="text-base font-bold text-surface-100">Tiger Content Workflow</h1>
          </div>

          <h1 className="text-xl font-bold text-surface-100 mb-1">登录工作台</h1>
          <p className="text-sm text-surface-500 mb-8">使用团队账号登录，进入你的角色工作台</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-surface-500 mb-1.5">
                账号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="如：vera、pm、strategy"
                autoComplete="username"
                className={inputBase}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] uppercase tracking-widest text-surface-500 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  className={`${inputBase} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-2.5 flex items-center justify-center gap-2 rounded-lg font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-surface-950/40 border-t-surface-950 rounded-full animate-spin" />
              ) : (
                <LogIn size={14} />
              )}
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          {/* Demo accounts (mobile / fallback) */}
          <div className="mt-8 border-t border-surface-800 pt-6">
            <button
              type="button"
              onClick={() => setShowAccounts((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] text-surface-500 hover:text-surface-300 transition-colors"
            >
              <span className="uppercase tracking-widest">演示账号列表</span>
              {showAccounts ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAccounts && (
              <div className="mt-3 space-y-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.role}
                    type="button"
                    onClick={() => quickLogin(a)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 border border-surface-700/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.dot}`} />
                      <span className="text-[11px] text-surface-300">{a.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-surface-500">{a.username}</span>
                      <span className="text-[10px] font-mono text-surface-600">tiger2024</span>
                      <LogIn size={10} className="text-surface-600" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
