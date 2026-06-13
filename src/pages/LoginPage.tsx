import { FileText, Scissors, Link2, BarChart2, ShieldCheck, LayoutDashboard, LogIn, Settings } from 'lucide-react';
import type { LoginRole } from '../types/session';
import { useSession } from '../context/SessionContext';
import { useRoleDisplay } from '../context/RoleDisplayContext';

const ICONS: Record<LoginRole, React.ReactNode> = {
  STRATEGY: <FileText size={22} />,
  MEDIA: <Scissors size={22} />,
  CONVERSION: <Link2 size={22} />,
  ADS: <BarChart2 size={22} />,
  VERA: <ShieldCheck size={22} />,
  PM: <LayoutDashboard size={22} />,
  ADMIN: <Settings size={22} />,
};

const ACCENT: Record<string, string> = {
  blue: 'border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-950/20',
  amber: 'border-amber-500/30 hover:border-amber-400/50 hover:bg-amber-950/20',
  cyan: 'border-cyan-500/30 hover:border-cyan-400/50 hover:bg-cyan-950/20',
  orange: 'border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-950/20',
  gold: 'border-gold-500/30 hover:border-gold-400/50 hover:bg-gold-900/20',
  emerald: 'border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-950/20',
  violet: 'border-violet-500/30 hover:border-violet-400/50 hover:bg-violet-950/20',
};

const ICON_COLOR: Record<string, string> = {
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  gold: 'text-gold-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
};

export function LoginPage() {
  const { login } = useSession();
  const { profiles } = useRoleDisplay();

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gold-400 rounded-lg mb-4">
            <span className="text-surface-950 font-black text-lg">T</span>
          </div>
          <h1 className="text-xl font-bold text-surface-100 mb-2">Tiger Content Workflow</h1>
          <p className="text-sm text-surface-500 max-w-md mx-auto">
            选择你的角色进入工作台。每个角色只看到与自己相关的任务，从领取到完成闭环。
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {profiles.map((profile) => (
            <button
              key={profile.role}
              type="button"
              onClick={() => login(profile.role)}
              className={`card card-hover p-5 text-left border transition-all ${ACCENT[profile.accent]}`}
            >
              <div className={`mb-3 ${ICON_COLOR[profile.accent]}`}>{ICONS[profile.role]}</div>
              <p className="text-sm font-semibold text-surface-100 mb-0.5">{profile.formalName}</p>
              <p className="text-[10px] text-surface-500 mb-0.5">代码 {profile.role} · 别称 {profile.alias}</p>
              <p className="text-[10px] uppercase tracking-wider text-surface-600 mb-2">{profile.tagline}</p>
              <p className="text-xs text-surface-400 leading-relaxed">{profile.description}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-[10px] text-gold-400/80 font-medium">
                <LogIn size={11} /> 进入工作台
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-[10px] text-surface-600 mt-8">
          原型演示 · 无需密码 · 数据保存在当前浏览器会话
        </p>
      </div>
    </div>
  );
}
