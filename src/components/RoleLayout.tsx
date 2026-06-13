import { LogOut } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useRoleProfile } from '../context/RoleDisplayContext';

interface RoleLayoutProps {
  children: React.ReactNode;
  /** 当前流程步骤标题（可选） */
  stepHint?: string;
}

export function RoleLayout({ children, stepHint }: RoleLayoutProps) {
  const { role, logout } = useSession();
  const profile = useRoleProfile(role);

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      <header className="flex-shrink-0 border-b border-surface-800 bg-surface-900 px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gold-400 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-surface-950 font-black text-xs">T</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-surface-100 truncate">
                {profile?.formalName}
                {profile && profile.alias !== profile.formalName && (
                  <span className="text-surface-500 font-normal ml-1.5 text-xs">({profile.alias})</span>
                )}
              </p>
              <p className="text-[10px] text-surface-500 truncate">
                {stepHint ?? profile?.tagline}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-ghost flex items-center gap-1.5 flex-shrink-0"
          >
            <LogOut size={13} />
            切换角色
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
