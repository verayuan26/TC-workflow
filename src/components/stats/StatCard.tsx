import type { ReactNode } from 'react';

type Accent = 'red' | 'gold' | 'orange' | 'emerald' | 'blue' | 'cyan' | 'amber' | 'surface';

const STYLES: Record<Accent, string> = {
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  gold: 'text-gold-400 bg-gold-400/10 border-gold-500/20',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  surface: 'text-surface-300 bg-surface-800 border-surface-700',
};

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: Accent;
  icon?: ReactNode;
  onClick?: () => void;
}

export function StatCard({ label, value, sub, accent = 'surface', icon, onClick }: StatCardProps) {
  const s = STYLES[accent];
  const textColor = s.split(' ')[0];
  const borderBg = s.split(' ').slice(1).join(' ');
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card p-3 border text-left transition-all ${borderBg} ${onClick ? 'card-hover cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className={textColor}>{icon}</span>}
        <span className="text-[9px] uppercase tracking-widest text-surface-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-[10px] text-surface-600 mt-0.5 leading-snug">{sub}</p>}
    </Tag>
  );
}

const BAR_BG: Record<string, string> = {
  gold: 'bg-gold-400', blue: 'bg-blue-400', cyan: 'bg-cyan-400',
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', orange: 'bg-orange-400', red: 'bg-red-400',
};
const BAR_TEXT: Record<string, string> = {
  gold: 'text-gold-400', blue: 'text-blue-400', cyan: 'text-cyan-400',
  emerald: 'text-emerald-400', amber: 'text-amber-400', orange: 'text-orange-400', red: 'text-red-400',
};

export function ProgressBarRow({ label, done, total, accent, extra, wideLabel }: {
  label: string; done: number; total: number; accent: string; extra?: string; wideLabel?: boolean;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs text-surface-300 flex-shrink-0 truncate ${wideLabel ? 'w-28' : 'w-16'}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_BG[accent] ?? 'bg-gold-400'}`}
          style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
        />
      </div>
      <span className={`text-xs font-semibold w-8 text-right flex-shrink-0 ${BAR_TEXT[accent] ?? 'text-gold-400'}`}>{pct}%</span>
      <span className="text-[10px] text-surface-600 w-10 text-right flex-shrink-0 tabular-nums">{done}/{total}</span>
      {extra && <span className="text-[10px] text-red-400 w-14 text-right flex-shrink-0">{extra}</span>}
    </div>
  );
}

export function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#302e27" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#D4AF37" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-gold-400">{pct}%</span>
        <span className="text-[10px] text-surface-500 -mt-0.5">完成率</span>
      </div>
    </div>
  );
}

export function StackedProgressBar({
  completed,
  inProgress,
  blocked,
  total,
}: {
  completed: number;
  inProgress: number;
  blocked: number;
  total: number;
}) {
  const safeTotal = total || 1;
  const completedPct = (completed / safeTotal) * 100;
  const inProgressPct = (inProgress / safeTotal) * 100;
  const blockedPct = (blocked / safeTotal) * 100;

  return (
    <div>
      <div className="flex justify-between text-[10px] text-surface-500 mb-1">
        <span>进度</span>
        <span>{completed} / {total} 已完成 · {inProgress} 进行中 · {blocked} 阻塞</span>
      </div>
      <div className="h-2 bg-surface-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-400 rounded-l-full"
          style={{ width: `${completedPct}%`, transition: 'width 0.4s ease' }}
        />
        <div className="h-full bg-blue-500/60" style={{ width: `${inProgressPct}%` }} />
        <div className="h-full bg-red-500/60" style={{ width: `${blockedPct}%` }} />
      </div>
      <div className="flex gap-4 mt-1.5">
        <span className="flex items-center gap-1 text-[9px] text-surface-500">
          <span className="w-2 h-1.5 rounded-full bg-emerald-400 inline-block" />已完成
        </span>
        <span className="flex items-center gap-1 text-[9px] text-surface-500">
          <span className="w-2 h-1.5 rounded-full bg-blue-500/60 inline-block" />进行中
        </span>
        <span className="flex items-center gap-1 text-[9px] text-surface-500">
          <span className="w-2 h-1.5 rounded-full bg-red-500/60 inline-block" />阻塞
        </span>
      </div>
    </div>
  );
}

/** 流程阶段分布（相对任务总量的占比条） */
export function DistributionBarRow({ label, count, total, accent }: {
  label: string; count: number; total: number; accent: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-24 flex-shrink-0 truncate ${BAR_TEXT[accent] ?? 'text-surface-300'}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_BG[accent] ?? 'bg-surface-500'}`}
          style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
        />
      </div>
      <span className="text-xs font-semibold text-surface-300 w-6 text-right tabular-nums">{count}</span>
      <span className="text-[10px] text-surface-600 w-8 text-right tabular-nums">{pct}%</span>
    </div>
  );
}
