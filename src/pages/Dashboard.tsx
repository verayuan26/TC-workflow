import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Eye, Scissors, FileText, Link2, Send, CheckCircle2, DollarSign, MousePointer, MessageSquare, BarChart2, TrendingDown, TrendingUp, XCircle, Bot, ShieldCheck, Zap, PauseCircle, Activity, Users, CreditCard } from 'lucide-react';
import type { Task, TaskStatus, Role, Website, RiskLevel } from '../types';
import { WEBSITES, RISK_LEVEL_DOT } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DONE_STATUSES: TaskStatus[] = ['08_PUBLISHED', '10_COMPLETED'];
const isDone = (t: Task) => DONE_STATUSES.includes(t.status);
const isBlocked = (t: Task) => t.status === '99_REWORK' || !!t.blockReason;

// ── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center">
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

// ── Progress bar row ─────────────────────────────────────────────────────────

type BarAccent = 'gold' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'orange' | 'red';
const BAR_BG: Record<BarAccent, string> = {
  gold:    'bg-gold-400',
  blue:    'bg-blue-400',
  cyan:    'bg-cyan-400',
  emerald: 'bg-emerald-400',
  amber:   'bg-amber-400',
  orange:  'bg-orange-400',
  red:     'bg-red-400',
};
const BAR_TEXT: Record<BarAccent, string> = {
  gold:    'text-gold-400',
  blue:    'text-blue-400',
  cyan:    'text-cyan-400',
  emerald: 'text-emerald-400',
  amber:   'text-amber-400',
  orange:  'text-orange-400',
  red:     'text-red-400',
};

function ProgressRow({ label, done, total, accent, extra }: { label: string; done: number; total: number; accent: BarAccent; extra?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-surface-300 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${BAR_BG[accent]}`} style={{ width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${BAR_TEXT[accent]}`}>{pct}%</span>
      <span className="text-[10px] text-surface-600 w-10 text-right flex-shrink-0">{done}/{total}</span>
      {extra && <span className="text-[10px] text-red-400 w-12 text-right flex-shrink-0">{extra}</span>}
    </div>
  );
}

// ── Quick stat box ────────────────────────────────────────────────────────────

function QuickStat({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: 'red' | 'gold' | 'orange' | 'emerald' | 'surface' }) {
  const styles = {
    red:     'text-red-400 bg-red-500/10 border-red-500/20',
    gold:    'text-gold-400 bg-gold-400/10 border-gold-500/20',
    orange:  'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    surface: 'text-surface-300 bg-surface-800 border-surface-700',
  };
  const s = styles[accent];
  return (
    <div className={`card p-3 border ${s.split(' ').slice(1).join(' ')}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={s.split(' ')[0]}>{icon}</span>
        <span className="text-[9px] uppercase tracking-widest text-surface-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${s.split(' ')[0]}`}>{value}</p>
      {sub && <p className="text-[10px] text-surface-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────────

interface KanbanColumn { label: string; statuses: TaskStatus[]; accent: string; headerBorder: string }
const KANBAN_COLUMNS: KanbanColumn[] = [
  { label: 'AI待生成',   statuses: ['01_AI_PENDING'],                  accent: 'text-surface-400',  headerBorder: 'border-surface-600'    },
  { label: '小S待审核',  statuses: ['02_STRATEGY_REVIEW', '05_STRATEGY_FINAL'],  accent: 'text-blue-400',     headerBorder: 'border-blue-600/50'    },
  { label: '小C待确认',  statuses: ['03_CONVERSION_URL'],               accent: 'text-cyan-400',     headerBorder: 'border-cyan-600/50'    },
  { label: '小M待剪辑',  statuses: ['04_MEDIA_EDIT'],                  accent: 'text-amber-400',    headerBorder: 'border-amber-600/50'   },
  { label: 'Vera待审核', statuses: ['06_VERA_REVIEW'],                 accent: 'text-gold-400',     headerBorder: 'border-gold-500/50'    },
  { label: '待发布',     statuses: ['07_PUBLISH_READY'],                     accent: 'text-lime-400',     headerBorder: 'border-lime-600/50'    },
  { label: '已完成',     statuses: ['08_PUBLISHED', '09_DATA_REVIEW', '10_COMPLETED'], accent: 'text-emerald-400', headerBorder: 'border-emerald-600/50' },
];

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { role: Role; label: string; accent: BarAccent; icon: React.ReactNode }[] = [
  { role: 'STRATEGY', label: '小S  内容', accent: 'blue',    icon: <FileText size={11} /> },
  { role: 'MEDIA', label: '小M  视频', accent: 'amber',   icon: <Scissors size={11} /> },
  { role: 'CONVERSION', label: '小C  技术', accent: 'cyan',    icon: <Link2 size={11} /> },
  { role: 'ADS', label: '小A  广告', accent: 'orange',  icon: <BarChart2 size={11} /> },
  { role: 'VERA',label: 'Vera 审核', accent: 'gold',    icon: <Eye size={11} /> },
];

const CONTENT_TYPES: { type: string; accent: BarAccent }[] = [
  { type: '短视频',      accent: 'amber'   },
  { type: '长视频',      accent: 'amber'   },
  { type: 'SEO文章',     accent: 'blue'    },
  { type: 'Landing Page',accent: 'cyan'    },
  { type: '发布文案',    accent: 'blue'    },
  { type: '广告素材',    accent: 'orange'  },
  { type: 'URL检查',     accent: 'cyan'    },
  { type: '数据复盘',    accent: 'emerald' },
];

// ── Main Dashboard ─────────────────────────────────────────────────────────────

interface DashboardProps { tasks: Task[] }

export function Dashboard({ tasks }: DashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const stats = useMemo(() => {
    const total     = tasks.length;
    const completed = tasks.filter(isDone).length;
    const overdue   = tasks.filter((t) => t.isOverdue).length;
    const blocked   = tasks.filter(isBlocked).length;
    const inProgress = tasks.filter((t) => !isDone(t) && !isBlocked(t)).length;
    const adTasks   = tasks.filter((t) => t.isAdTask);
    const totalSpent    = adTasks.reduce((s, t) => s + (t.spent || 0), 0);
    const totalClicks   = adTasks.reduce((s, t) => s + (t.clicks || 0), 0);
    const totalInquiries = adTasks.reduce((s, t) => s + (t.inquiries || 0), 0);
    const avgCpl = totalInquiries > 0 ? Math.round(totalSpent / totalInquiries) : 0;
    const needOptimize = adTasks.filter((t) => t.adStatus === '需优化');
    const pausedAds = adTasks.filter((t) => t.adStatus === '暂停');
    const scaleAds = adTasks.filter((t) => t.adStatus === '放大候选');
    const bestPageAd = adTasks.filter((t) => (t.validInquiries || t.inquiries || 0) > 0).reduce((best, t) => {
      const a = t.validInquiries || t.inquiries || 0;
      const b = best ? (best.validInquiries || best.inquiries || 0) : 0;
      return a > b ? t : best;
    }, null as Task | null);
    const worstAd = adTasks.filter((t) => t.cpl && t.cpl > 0 && t.adStatus === '投放中').reduce((worst, t) => {
      return (!worst || (t.cpl || 0) > (worst.cpl || 0)) ? t : worst;
    }, null as Task | null);
    const totalViews = adTasks.reduce((s, t) => s + (t.views || 0), 0);
    const totalWA = adTasks.reduce((s, t) => s + (t.whatsappClicks || 0), 0);
    const totalForms = adTasks.reduce((s, t) => s + (t.formSubmits || 0), 0);
    const totalValidInquiries = adTasks.reduce((s, t) => s + (t.validInquiries || 0), 0);

    // Phase 4 automation metrics
    const autoApproved = tasks.filter((t) => t.autoApproved || t.status === '12_AUTO_APPROVED').length;
    const intercepted  = tasks.filter((t) => t.isIntercepted || t.status === '11_BLOCKED').length;
    const veraPending  = tasks.filter((t) => t.status === '06_VERA_REVIEW').length;
    const budgetPending = tasks.filter((t) => t.isBudgetTask && t.budgetStatus === '等待Vera确认预算').length;
    const autoApproveRate = total > 0 ? Math.round((autoApproved / total) * 100) : 0;
    const interceptRate   = total > 0 ? Math.round((intercepted  / total) * 100) : 0;
    const riskDist: Record<RiskLevel, number> = { '低': 0, '中': 0, '高': 0 };
    tasks.forEach((t) => { if (t.riskLevel) riskDist[t.riskLevel]++; });

    return { total, completed, overdue, blocked, inProgress, totalSpent, totalClicks, totalInquiries, avgCpl, needOptimize, pausedAds, scaleAds, bestPageAd, worstAd, totalViews, totalWA, totalForms, totalValidInquiries, autoApproved, intercepted, veraPending, budgetPending, autoApproveRate, interceptRate, riskDist };
  }, [tasks]);

  const roleStats = useMemo(() => ROLES.map(({ role }) => {
    const roleTasks = tasks.filter((t) => t.assignedTo === role);
    return {
      total: roleTasks.length,
      done:  roleTasks.filter(isDone).length,
      overdue: roleTasks.filter((t) => t.isOverdue).length,
      blocked: roleTasks.filter(isBlocked).length,
    };
  }), [tasks]);

  const websiteStats = useMemo(() => WEBSITES.map((site) => {
    const siteTasks = tasks.filter((t) => t.website === site);
    return {
      site: site as Website,
      total: siteTasks.length,
      done:  siteTasks.filter(isDone).length,
      overdue: siteTasks.filter((t) => t.isOverdue).length,
    };
  }), [tasks]);

  const contentTypeStats = useMemo(() => CONTENT_TYPES.map(({ type }) => {
    const ct = tasks.filter((t) => t.contentType === type);
    return { type, total: ct.length, done: ct.filter(isDone).length };
  }), [tasks]);

  const kanbanMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      map[col.label] = tasks.filter((t) => (col.statuses as string[]).includes(t.status));
    });
    return map;
  }, [tasks]);

  // Which role has most blocked tasks
  const mostBlockedRole = useMemo(() => {
    let max = 0; let name = '--';
    ROLES.forEach(({ role: _role, label }, i) => {
      if (roleStats[i].blocked > max) { max = roleStats[i].blocked; name = label.split('  ')[0]; }
    });
    return max > 0 ? `${name} (${max}条阻塞)` : '无';
  }, [roleStats]);

  // Worst website (lowest completion %)
  const worstSite = useMemo(() => {
    let minPct = 101; let name = '--';
    websiteStats.forEach(({ site, total, done }) => {
      const pct = total > 0 ? done / total : 1;
      if (pct < minPct && total > 0) { minPct = pct; name = site.replace('.com', '').replace('.ru', ''); }
    });
    return name;
  }, [websiteStats]);

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* ── HERO: Completion + Critical Stats ───────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">完成度总览</h2>
        <div className="card border border-surface-700 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <CompletionRing completed={stats.completed} total={stats.total} />
            </div>

            {/* Stats breakdown */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <QuickStat label="总任务" value={stats.total} icon={<CheckCircle2 size={14} />} accent="surface" />
              <QuickStat label="已完成" value={stats.completed} sub={`${stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%`} icon={<Send size={14} />} accent="emerald" />
              <QuickStat label="逾期任务" value={stats.overdue} sub={stats.overdue > 0 ? '需立即处理' : '暂无'} icon={<AlertTriangle size={14} />} accent={stats.overdue > 0 ? 'red' : 'surface'} />
              <QuickStat label="阻塞任务" value={stats.blocked} sub={stats.blocked > 0 ? mostBlockedRole : '流程顺畅'} icon={<XCircle size={14} />} accent={stats.blocked > 0 ? 'red' : 'surface'} />
            </div>
          </div>

          {/* Progress total bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-surface-500 mb-1">
              <span>进度</span>
              <span>{stats.completed} / {stats.total} 已完成 · {stats.inProgress} 进行中 · {stats.blocked} 阻塞</span>
            </div>
            <div className="h-2 bg-surface-700 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 rounded-l-full" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`, transition: 'width 0.4s ease' }} />
              <div className="h-full bg-blue-500/60" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }} />
              <div className="h-full bg-red-500/60" style={{ width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%` }} />
            </div>
            <div className="flex gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-surface-500"><span className="w-2 h-1.5 rounded-full bg-emerald-400 inline-block" />已完成</span>
              <span className="flex items-center gap-1 text-[9px] text-surface-500"><span className="w-2 h-1.5 rounded-full bg-blue-500/60 inline-block" />进行中</span>
              <span className="flex items-center gap-1 text-[9px] text-surface-500"><span className="w-2 h-1.5 rounded-full bg-red-500/60 inline-block" />阻塞</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Role + Website Completion ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role completion */}
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">按角色完成度</h3>
          <div className="space-y-2.5">
            {ROLES.map(({ label, accent }, i) => {
              const rs = roleStats[i];
              return (
                <ProgressRow
                  key={label}
                  label={label}
                  done={rs.done}
                  total={rs.total}
                  accent={accent}
                  extra={rs.overdue > 0 ? `逾期${rs.overdue}` : rs.blocked > 0 ? `阻塞${rs.blocked}` : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Website completion */}
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">
            按网站完成度
            {worstSite !== '--' && <span className="ml-2 text-red-400 normal-case font-normal">落后：{worstSite}</span>}
          </h3>
          <div className="space-y-2.5">
            {websiteStats.map(({ site, total, done, overdue }) => (
              <ProgressRow
                key={site}
                label={site.replace('tigersourcingchina', 'TSC').replace('tigerlogisticschina', 'TLC').replace('tiger-logistics', 'TLR').replace('tiger-poisk', 'TPR').replace('oz-logistics', 'OZL').replace('.com', '').replace('.ru', '')}
                done={done}
                total={total}
                accent="gold"
                extra={overdue > 0 ? `逾期${overdue}` : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Type Completion ──────────────────────────────────────── */}
      <div className="card border border-surface-700 p-4">
        <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">按内容类型完成度</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {contentTypeStats.filter((c) => c.total > 0).map(({ type, done, total }) => {
            const ct = CONTENT_TYPES.find((c) => c.type === type);
            return <ProgressRow key={type} label={type} done={done} total={total} accent={ct?.accent || 'gold'} />;
          })}
        </div>
      </div>

      {/* ── Ad Efficiency Module ─────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">广告效率概览</h2>

        {/* Primary metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3 border border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={12} className="text-orange-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">本周花费</span>
            </div>
            <p className="text-xl font-bold text-orange-400">${stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="card p-3 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <MousePointer size={12} className="text-blue-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">本周点击</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div className="card p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} className="text-emerald-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">有效询盘</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{stats.totalValidInquiries || stats.totalInquiries}</p>
          </div>
          <div className="card p-3 border border-gold-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={12} className="text-gold-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">平均CPL</span>
            </div>
            <p className="text-xl font-bold text-gold-400">{stats.avgCpl > 0 ? `$${stats.avgCpl}` : '--'}</p>
          </div>
        </div>

        {/* Secondary metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3 border border-cyan-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye size={12} className="text-cyan-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">视频观看量</span>
            </div>
            <p className="text-xl font-bold text-cyan-400">{stats.totalViews > 0 ? stats.totalViews.toLocaleString() : '--'}</p>
          </div>
          <div className="card p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} className="text-emerald-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">WhatsApp点击</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{stats.totalWA > 0 ? stats.totalWA : '--'}</p>
          </div>
          <div className="card p-3 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={12} className="text-blue-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">表单提交</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{stats.totalForms > 0 ? stats.totalForms : '--'}</p>
          </div>
          <div className="card p-3 border border-gold-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard size={12} className="text-gold-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">待Vera确认预算</span>
            </div>
            <p className="text-xl font-bold text-gold-400">{stats.budgetPending}</p>
            <p className="text-[10px] text-surface-600">{stats.budgetPending > 0 ? '需要审批' : '暂无申请'}</p>
          </div>
        </div>

        {/* Best / Worst / Needs Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Best Ad */}
          <div className="card p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} className="text-emerald-400" />
              <p className="text-[9px] uppercase tracking-widest text-surface-500">最佳广告</p>
            </div>
            {stats.bestPageAd ? (
              <>
                <p className="text-xs text-emerald-300 font-medium leading-snug">{stats.bestPageAd.adPlatform}</p>
                <p className="text-[10px] text-surface-400 mt-0.5">{stats.bestPageAd.website.replace('.com','').replace('.ru','')}</p>
                <p className="text-[10px] text-emerald-400/80 mt-1">{stats.bestPageAd.validInquiries || stats.bestPageAd.inquiries || 0} 有效询盘 · CPL ${stats.bestPageAd.cpl || '--'}</p>
              </>
            ) : <p className="text-xs text-surface-600">暂无数据</p>}
          </div>

          {/* Worst Ad */}
          <div className="card p-3 border border-red-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={11} className="text-[#e88989]" />
              <p className="text-[9px] uppercase tracking-widest text-surface-500">最差广告</p>
            </div>
            {stats.worstAd ? (
              <>
                <p className="text-xs text-[#e88989] font-medium leading-snug">{stats.worstAd.adPlatform}</p>
                <p className="text-[10px] text-surface-400 mt-0.5">{stats.worstAd.website.replace('.com','').replace('.ru','')}</p>
                <p className="text-[10px] text-red-400/80 mt-1">CPL ${stats.worstAd.cpl} · 需优化</p>
              </>
            ) : <p className="text-xs text-surface-600">暂无数据</p>}
          </div>

          {/* Needs pause / optimize */}
          <div className="card p-3 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <PauseCircle size={11} className="text-amber-400" />
              <p className="text-[9px] uppercase tracking-widest text-surface-500">需关注</p>
            </div>
            {stats.needOptimize.length > 0 ? (
              <div className="space-y-1">
                {stats.needOptimize.slice(0, 2).map((t) => (
                  <p key={t.id} className="text-[10px] text-amber-300">{t.adPlatform} · 需优化</p>
                ))}
              </div>
            ) : null}
            {stats.pausedAds.length > 0 ? (
              <div className="space-y-1 mt-1">
                {stats.pausedAds.slice(0, 1).map((t) => (
                  <p key={t.id} className="text-[10px] text-surface-400">{t.adPlatform} · 已暂停</p>
                ))}
              </div>
            ) : null}
            {stats.needOptimize.length === 0 && stats.pausedAds.length === 0 && (
              <p className="text-xs text-surface-600">广告运行正常</p>
            )}
          </div>

          {/* Scale candidates */}
          <div className="card p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={11} className="text-emerald-400" />
              <p className="text-[9px] uppercase tracking-widest text-surface-500">放大候选</p>
            </div>
            {stats.scaleAds.length > 0 ? (
              <div className="space-y-1">
                {stats.scaleAds.slice(0, 2).map((t) => (
                  <p key={t.id} className="text-[10px] text-emerald-300">{t.adPlatform} · {t.website.replace('.com','').replace('.ru','')}</p>
                ))}
                {stats.scaleAds.length > 2 && <p className="text-[10px] text-surface-500">+{stats.scaleAds.length - 2} 更多</p>}
              </div>
            ) : <p className="text-xs text-surface-600">暂无候选</p>}
          </div>
        </div>
      </div>

      {/* ── AI Automation Metrics ──────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">AI自动化指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={12} className="text-emerald-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">自动放行率</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{stats.autoApproveRate}%</p>
            <p className="text-[10px] text-surface-600">{stats.autoApproved} 条任务</p>
          </div>
          <div className="card p-3 border border-red-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle size={12} className="text-[#e88989]" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">高风险拦截率</span>
            </div>
            <p className="text-xl font-bold text-[#e88989]">{stats.interceptRate}%</p>
            <p className="text-[10px] text-surface-600">{stats.intercepted} 条拦截</p>
          </div>
          <div className="card p-3 border border-gold-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={12} className="text-gold-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">Vera待处理</span>
            </div>
            <p className="text-xl font-bold text-gold-400">{stats.veraPending}</p>
            <p className="text-[10px] text-surface-600">含 {stats.budgetPending} 条预算</p>
          </div>
          <div className="card p-3 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Bot size={12} className="text-blue-400" />
              <span className="text-[9px] uppercase tracking-widest text-surface-500">AI生成任务</span>
            </div>
            <p className="text-xl font-bold text-blue-400">{tasks.filter((t) => t.status === '01_AI_PENDING' || t.opLog?.some((l) => l.operator === 'AI')).length}</p>
            <p className="text-[10px] text-surface-600">龙虾AI助理</p>
          </div>
        </div>

        {/* Risk distribution */}
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">风险等级分布</h3>
          <div className="space-y-2">
            {(['低', '中', '高'] as RiskLevel[]).map((level) => {
              const count = stats.riskDist[level];
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const barColor = level === '低' ? 'bg-emerald-500' : level === '中' ? 'bg-amber-500' : 'bg-red-500';
              const textColor = level === '低' ? 'text-emerald-300' : level === '中' ? 'text-amber-300' : 'text-[#e88989]';
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[level]}`} />
                    <span className={`text-xs font-medium ${textColor}`}>{level}风险</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%`, transition: 'width 0.4s ease' }} />
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{pct}%</span>
                  <span className="text-[10px] text-surface-600 w-10 text-right flex-shrink-0">{count}/{stats.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Kanban ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest">任务看板</h2>
          <span className="text-[10px] text-surface-600">共 {tasks.length} 条</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = kanbanMap[col.label] || [];
            return (
              <div key={col.label} className="flex-shrink-0 w-52 md:w-auto flex flex-col">
                <div className={`flex items-center justify-between px-2 py-1.5 mb-2 border-b ${col.headerBorder}`}>
                  <span className={`text-xs font-semibold ${col.accent}`}>{col.label}</span>
                  <span className={`text-[10px] font-bold ${col.accent} bg-surface-800 rounded-full w-5 h-5 flex items-center justify-center`}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {colTasks.slice(0, 4).map((task) => (
                    <TaskCard key={task.id} task={task} onClick={setSelectedTask} compact />
                  ))}
                  {colTasks.length > 4 && (
                    <div className="text-[10px] text-surface-500 text-center py-1">+{colTasks.length - 4} 更多</div>
                  )}
                  {colTasks.length === 0 && (
                    <div className="text-[10px] text-surface-700 text-center py-4 border border-dashed border-surface-800 rounded">暂无</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paused/blocked */}
      {(() => {
        const paused = tasks.filter((t) => t.status === '99_REWORK');
        if (!paused.length) return null;
        return (
          <div>
            <h2 className="text-[10px] font-semibold text-red-400/70 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Clock size={11} />暂停 / 返工 ({paused.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paused.map((t) => <TaskCard key={t.id} task={t} onClick={setSelectedTask} />)}
            </div>
          </div>
        );
      })()}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
