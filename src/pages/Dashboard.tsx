import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Eye, Scissors, FileText, Link2, Send, CheckCircle2, DollarSign, MousePointer, MessageSquare, BarChart2, TrendingDown, TrendingUp, XCircle, Bot, ShieldCheck, Zap, PauseCircle, Activity, Users, CreditCard } from 'lucide-react';
import type { Task, TaskStatus, Role, Website, RiskLevel } from '../types';
import { WEBSITES, RISK_LEVEL_DOT } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DONE_STATUSES: TaskStatus[] = ['08_已发布', '10_已完成'];
const isDone = (t: Task) => DONE_STATUSES.includes(t.status);
const isBlocked = (t: Task) => t.status === '99_暂停/返工' || !!t.blockReason;

// ── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#28251F" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#B89A5E" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color: '#D6C08B' }}>{pct}%</span>
        <span className="text-[10px] -mt-0.5" style={{ color: '#7D766C' }}>完成率</span>
      </div>
    </div>
  );
}

// ── Progress bar row ─────────────────────────────────────────────────────────

type BarAccent = 'gold' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'orange' | 'red';

// Soft semantic colors — all de-saturated vs. original palette
const BAR_COLOR: Record<BarAccent, string> = {
  gold:    '#B89A5E',
  blue:    '#6FA8DC',
  cyan:    '#5BAE82',   // use success-green for cyan slots (cyan was too vivid)
  emerald: '#5BAE82',
  amber:   '#D0A85C',
  orange:  '#C4895A',
  red:     '#C96B6B',
};

function ProgressRow({ label, done, total, accent, extra }: { label: string; done: number; total: number; accent: BarAccent; extra?: string }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const color = BAR_COLOR[accent];
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 flex-shrink-0 truncate" style={{ color: '#D8D1C3' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.4s ease' }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{pct}%</span>
      <span className="text-[10px] w-10 text-right flex-shrink-0" style={{ color: '#5F5A52' }}>{done}/{total}</span>
      {extra && <span className="text-[10px] w-12 text-right flex-shrink-0" style={{ color: '#C96B6B' }}>{extra}</span>}
    </div>
  );
}

// ── Quick stat box ────────────────────────────────────────────────────────────

type StatAccent = 'red' | 'gold' | 'orange' | 'emerald' | 'surface';

const STAT_STYLES: Record<StatAccent, { color: string; bg: string; border: string }> = {
  red:     { color: '#C96B6B', bg: 'rgba(201,107,107,0.08)',  border: 'rgba(201,107,107,0.20)' },
  gold:    { color: '#D6C08B', bg: 'rgba(184,154,94,0.10)',   border: 'rgba(184,154,94,0.22)'  },
  orange:  { color: '#C4895A', bg: 'rgba(196,137,90,0.10)',   border: 'rgba(196,137,90,0.22)'  },
  emerald: { color: '#5BAE82', bg: 'rgba(91,174,130,0.10)',   border: 'rgba(91,174,130,0.22)'  },
  surface: { color: '#D8D1C3', bg: '#28251F',                 border: 'rgba(214,192,139,0.10)' },
};

function QuickStat({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: StatAccent }) {
  const s = STAT_STYLES[accent];
  return (
    <div
      className="card p-3"
      style={{ backgroundColor: s.bg, borderColor: s.border }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: s.color }}>{icon}</span>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color: s.color }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>{sub}</p>}
    </div>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────────

interface KanbanColumn { label: string; statuses: TaskStatus[]; color: string }
const KANBAN_COLUMNS: KanbanColumn[] = [
  { label: 'AI待生成',   statuses: ['01_AI待生成'],                           color: '#7D766C' },
  { label: '小S待审核',  statuses: ['02_小S待审核', '05_小S待终审'],          color: '#6FA8DC' },
  { label: '小C待确认',  statuses: ['03_小C待确认URL'],                        color: '#5BAE82' },
  { label: '小M待剪辑',  statuses: ['04_小M待剪辑'],                           color: '#D0A85C' },
  { label: 'Vera待审核', statuses: ['06_Vera待审核'],                          color: '#B89A5E' },
  { label: '待发布',     statuses: ['07_待发布'],                              color: '#7DC4A0' },
  { label: '已完成',     statuses: ['08_已发布', '09_数据待复盘', '10_已完成'], color: '#5BAE82' },
];

// ── Role config ───────────────────────────────────────────────────────────────

const ROLES: { role: Role; label: string; accent: BarAccent; icon: React.ReactNode }[] = [
  { role: '小S', label: '小S  内容', accent: 'blue',    icon: <FileText size={11} /> },
  { role: '小M', label: '小M  视频', accent: 'amber',   icon: <Scissors size={11} /> },
  { role: '小C', label: '小C  技术', accent: 'cyan',    icon: <Link2 size={11} /> },
  { role: '小A', label: '小A  广告', accent: 'orange',  icon: <BarChart2 size={11} /> },
  { role: 'Vera',label: 'Vera 审核', accent: 'gold',    icon: <Eye size={11} /> },
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
    const autoApproved = tasks.filter((t) => t.autoApproved || t.status === '12_自动放行').length;
    const intercepted  = tasks.filter((t) => t.isIntercepted || t.status === '11_已拦截').length;
    const veraPending  = tasks.filter((t) => t.status === '06_Vera待审核').length;
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
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>完成度总览</h2>
        <div className="card p-4 md:p-5">
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
            <div className="flex justify-between text-[10px] mb-1" style={{ color: '#7D766C' }}>
              <span>进度</span>
              <span>{stats.completed} / {stats.total} 已完成 · {stats.inProgress} 进行中 · {stats.blocked} 阻塞</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-l-full" style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`, backgroundColor: '#5BAE82', transition: 'width 0.4s ease' }} />
              <div className="h-full" style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`, backgroundColor: 'rgba(111,168,220,0.55)' }} />
              <div className="h-full" style={{ width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%`, backgroundColor: 'rgba(201,107,107,0.55)' }} />
            </div>
            <div className="flex gap-4 mt-1.5">
              <span className="flex items-center gap-1 text-[9px]" style={{ color: '#7D766C' }}><span className="w-2 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#5BAE82' }} />已完成</span>
              <span className="flex items-center gap-1 text-[9px]" style={{ color: '#7D766C' }}><span className="w-2 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(111,168,220,0.55)' }} />进行中</span>
              <span className="flex items-center gap-1 text-[9px]" style={{ color: '#7D766C' }}><span className="w-2 h-1.5 rounded-full inline-block" style={{ backgroundColor: 'rgba(201,107,107,0.55)' }} />阻塞</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Role + Website Completion ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role completion */}
        <div className="card p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>按角色完成度</h3>
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
        <div className="card p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#7D766C' }}>
            按网站完成度
            {worstSite !== '--' && <span className="normal-case font-normal" style={{ color: '#C96B6B' }}>落后：{worstSite}</span>}
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
      <div className="card p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>按内容类型完成度</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {contentTypeStats.filter((c) => c.total > 0).map(({ type, done, total }) => {
            const ct = CONTENT_TYPES.find((c) => c.type === type);
            return <ProgressRow key={type} label={type} done={done} total={total} accent={ct?.accent || 'gold'} />;
          })}
        </div>
      </div>

      {/* ── Ad Efficiency Module ─────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>广告效率概览</h2>

        {/* Primary metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3" style={{ borderColor: 'rgba(196,137,90,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign size={12} style={{ color: '#C4895A' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>本周花费</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#C4895A' }}>${stats.totalSpent.toLocaleString()}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(111,168,220,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <MousePointer size={12} style={{ color: '#6FA8DC' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>本周点击</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#6FA8DC' }}>{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(91,174,130,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} style={{ color: '#5BAE82' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>有效询盘</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#5BAE82' }}>{stats.totalValidInquiries || stats.totalInquiries}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(184,154,94,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={12} style={{ color: '#D6C08B' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>平均CPL</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#D6C08B' }}>{stats.avgCpl > 0 ? `$${stats.avgCpl}` : '--'}</p>
          </div>
        </div>

        {/* Secondary metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3" style={{ borderColor: 'rgba(111,168,220,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Eye size={12} style={{ color: '#87B8E0' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>视频观看量</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#87B8E0' }}>{stats.totalViews > 0 ? stats.totalViews.toLocaleString() : '--'}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(91,174,130,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} style={{ color: '#5BAE82' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>WhatsApp点击</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#5BAE82' }}>{stats.totalWA > 0 ? stats.totalWA : '--'}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(111,168,220,0.18)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={12} style={{ color: '#6FA8DC' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>表单提交</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#6FA8DC' }}>{stats.totalForms > 0 ? stats.totalForms : '--'}</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(184,154,94,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard size={12} style={{ color: '#B89A5E' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>待Vera确认预算</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#B89A5E' }}>{stats.budgetPending}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>{stats.budgetPending > 0 ? '需要审批' : '暂无申请'}</p>
          </div>
        </div>

        {/* Best / Worst / Needs Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Best Ad */}
          <div className="card p-3" style={{ borderColor: 'rgba(91,174,130,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} style={{ color: '#5BAE82' }} />
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>最佳广告</p>
            </div>
            {stats.bestPageAd ? (
              <>
                <p className="text-xs font-medium leading-snug" style={{ color: '#7DC4A0' }}>{stats.bestPageAd.adPlatform}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#A8A094' }}>{stats.bestPageAd.website.replace('.com','').replace('.ru','')}</p>
                <p className="text-[10px] mt-1" style={{ color: '#5BAE82' }}>{stats.bestPageAd.validInquiries || stats.bestPageAd.inquiries || 0} 有效询盘 · CPL ${stats.bestPageAd.cpl || '--'}</p>
              </>
            ) : <p className="text-xs" style={{ color: '#5F5A52' }}>暂无数据</p>}
          </div>

          {/* Worst Ad */}
          <div className="card p-3" style={{ borderColor: 'rgba(201,107,107,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={11} style={{ color: '#C96B6B' }} />
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>最差广告</p>
            </div>
            {stats.worstAd ? (
              <>
                <p className="text-xs font-medium leading-snug" style={{ color: '#D88888' }}>{stats.worstAd.adPlatform}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#A8A094' }}>{stats.worstAd.website.replace('.com','').replace('.ru','')}</p>
                <p className="text-[10px] mt-1" style={{ color: '#C96B6B' }}>CPL ${stats.worstAd.cpl} · 需优化</p>
              </>
            ) : <p className="text-xs" style={{ color: '#5F5A52' }}>暂无数据</p>}
          </div>

          {/* Needs pause / optimize */}
          <div className="card p-3" style={{ borderColor: 'rgba(208,168,92,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <PauseCircle size={11} style={{ color: '#D0A85C' }} />
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>需关注</p>
            </div>
            {stats.needOptimize.length > 0 ? (
              <div className="space-y-1">
                {stats.needOptimize.slice(0, 2).map((t) => (
                  <p key={t.id} className="text-[10px]" style={{ color: '#D0A85C' }}>{t.adPlatform} · 需优化</p>
                ))}
              </div>
            ) : null}
            {stats.pausedAds.length > 0 ? (
              <div className="space-y-1 mt-1">
                {stats.pausedAds.slice(0, 1).map((t) => (
                  <p key={t.id} className="text-[10px]" style={{ color: '#A8A094' }}>{t.adPlatform} · 已暂停</p>
                ))}
              </div>
            ) : null}
            {stats.needOptimize.length === 0 && stats.pausedAds.length === 0 && (
              <p className="text-xs" style={{ color: '#5F5A52' }}>广告运行正常</p>
            )}
          </div>

          {/* Scale candidates */}
          <div className="card p-3" style={{ borderColor: 'rgba(91,174,130,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity size={11} style={{ color: '#5BAE82' }} />
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>放大候选</p>
            </div>
            {stats.scaleAds.length > 0 ? (
              <div className="space-y-1">
                {stats.scaleAds.slice(0, 2).map((t) => (
                  <p key={t.id} className="text-[10px]" style={{ color: '#7DC4A0' }}>{t.adPlatform} · {t.website.replace('.com','').replace('.ru','')}</p>
                ))}
                {stats.scaleAds.length > 2 && <p className="text-[10px]" style={{ color: '#7D766C' }}>+{stats.scaleAds.length - 2} 更多</p>}
              </div>
            ) : <p className="text-xs" style={{ color: '#5F5A52' }}>暂无候选</p>}
          </div>
        </div>
      </div>

      {/* ── AI Automation Metrics ──────────────────────────────────────── */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>AI自动化指标</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="card p-3" style={{ borderColor: 'rgba(91,174,130,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={12} style={{ color: '#5BAE82' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>自动放行率</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#5BAE82' }}>{stats.autoApproveRate}%</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>{stats.autoApproved} 条任务</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(201,107,107,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <XCircle size={12} style={{ color: '#C96B6B' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>高风险拦截率</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#C96B6B' }}>{stats.interceptRate}%</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>{stats.intercepted} 条拦截</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(184,154,94,0.22)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck size={12} style={{ color: '#D6C08B' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>Vera待处理</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#D6C08B' }}>{stats.veraPending}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>含 {stats.budgetPending} 条预算</p>
          </div>
          <div className="card p-3" style={{ borderColor: 'rgba(111,168,220,0.20)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Bot size={12} style={{ color: '#6FA8DC' }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: '#7D766C' }}>AI生成任务</span>
            </div>
            <p className="text-xl font-bold" style={{ color: '#6FA8DC' }}>{tasks.filter((t) => t.status === '01_AI待生成' || t.opLog?.some((l) => l.operator === '龙虾')).length}</p>
            <p className="text-[10px] mt-0.5" style={{ color: '#5F5A52' }}>龙虾AI助理</p>
          </div>
        </div>

        {/* Risk distribution */}
        <div className="card p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#7D766C' }}>风险等级分布</h3>
          <div className="space-y-2">
            {(['低', '中', '高'] as RiskLevel[]).map((level) => {
              const count = stats.riskDist[level];
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const barColor = level === '低' ? '#5BAE82' : level === '中' ? '#D0A85C' : '#C96B6B';
              const textColor = level === '低' ? '#5BAE82' : level === '中' ? '#D0A85C' : '#C96B6B';
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[level]}`} />
                    <span className="text-xs font-medium" style={{ color: textColor }}>{level}风险</span>
                  </div>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, transition: 'width 0.4s ease' }} />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right" style={{ color: textColor }}>{pct}%</span>
                  <span className="text-[10px] w-10 text-right flex-shrink-0" style={{ color: '#5F5A52' }}>{count}/{stats.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Kanban ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#7D766C' }}>任务看板</h2>
          <span className="text-[10px]" style={{ color: '#5F5A52' }}>共 {tasks.length} 条</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-7">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = kanbanMap[col.label] || [];
            return (
              <div key={col.label} className="flex-shrink-0 w-52 md:w-auto flex flex-col">
                <div
                  className="flex items-center justify-between px-2 py-1.5 mb-2 border-b"
                  style={{ borderColor: `${col.color}30` }}
                >
                  <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                  <span
                    className="text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ color: col.color, backgroundColor: `${col.color}15` }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 flex-1">
                  {colTasks.slice(0, 4).map((task) => (
                    <TaskCard key={task.id} task={task} onClick={setSelectedTask} compact />
                  ))}
                  {colTasks.length > 4 && (
                    <div className="text-[10px] text-center py-1" style={{ color: '#7D766C' }}>+{colTasks.length - 4} 更多</div>
                  )}
                  {colTasks.length === 0 && (
                    <div
                      className="text-[10px] text-center py-4 rounded border border-dashed"
                      style={{ color: '#3A3730', borderColor: '#28251F' }}
                    >暂无</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paused/blocked */}
      {(() => {
        const paused = tasks.filter((t) => t.status === '99_暂停/返工');
        if (!paused.length) return null;
        return (
          <div>
            <h2
              className="text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5"
              style={{ color: 'rgba(201,107,107,0.70)' }}
            >
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
