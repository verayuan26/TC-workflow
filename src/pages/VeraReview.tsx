import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, Clock, CheckCircle, RotateCcw, PauseCircle, File as FileEdit, TrendingUp, TrendingDown, ChevronDown, ChevronUp, CheckCircle2, Zap, DollarSign, XCircle } from 'lucide-react';
import type { Task } from '../types';
import { WEBSITES, RISK_LEVEL_STYLES, RISK_LEVEL_DOT } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { TaskModal } from '../components/TaskModal';

const isDone = (t: Task) => t.status === '08_已发布' || t.status === '10_已完成';
const isBlocked = (t: Task) => t.status === '99_暂停/返工' || !!t.blockReason;

// ── Decision card ─────────────────────────────────────────────────────────────

type DecisionStatus = 'ok' | 'warn' | 'good' | 'neutral';
const DECISION_STYLES: Record<DecisionStatus, string> = {
  ok:      'bg-emerald-500/5 border-emerald-500/20',
  warn:    'bg-red-500/5 border-red-500/20',
  good:    'bg-gold-400/5 border-gold-500/20',
  neutral: 'bg-surface-800 border-surface-700',
};
const DECISION_VALUE_COLOR: Record<DecisionStatus, string> = {
  ok:      'text-emerald-300',
  warn:    'text-red-300',
  good:    'text-gold-300',
  neutral: 'text-surface-300',
};
const DECISION_ICON: Record<DecisionStatus, React.ReactNode> = {
  ok:      <CheckCircle size={12} className="text-emerald-400" />,
  warn:    <AlertTriangle size={12} className="text-red-400" />,
  good:    <TrendingUp size={12} className="text-gold-400" />,
  neutral: <TrendingDown size={12} className="text-surface-500" />,
};

function DecisionCard({ label, value, status, action }: { label: string; value: string; status: DecisionStatus; action?: string }) {
  return (
    <div className={`p-3 rounded-lg border ${DECISION_STYLES[status]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {DECISION_ICON[status]}
        <span className="text-[9px] uppercase tracking-widest text-surface-500">{label}</span>
      </div>
      <p className={`text-xs font-semibold ${DECISION_VALUE_COLOR[status]}`}>{value}</p>
      {action && <p className="text-[10px] text-surface-600 mt-0.5">{action}</p>}
    </div>
  );
}

// ── Task row ──────────────────────────────────────────────────────────────────

function VeraTaskRow({ task, onClick, showActions = true }: { task: Task; onClick: (t: Task) => void; showActions?: boolean }) {
  return (
    <div onClick={() => onClick(task)} className="card card-hover p-4 border-l-2 border-l-gold-400 cursor-pointer">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {task.isOverdue && <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium"><AlertTriangle size={10} />逾期</span>}
            {task.riskLevel && (
              <span className={`inline-flex items-center gap-1 border rounded-full text-[10px] px-2 py-0.5 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${RISK_LEVEL_DOT[task.riskLevel]}`} />
                {task.riskLevel}风险{task.aiRiskScore != null ? ` · ${task.aiRiskScore}分` : ''}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-surface-100 mb-1 leading-snug">{task.title}</h3>
          <p className="text-xs text-surface-500 mb-2">{task.website} · {task.contentType}</p>
          {task.riskLabels && task.riskLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.riskLabels.map((label) => (
                <span key={label} className="text-[9px] bg-surface-700/60 text-surface-400 border border-surface-600 rounded px-1.5 py-0.5">{label}</span>
              ))}
            </div>
          )}
          {task.veraComments && (
            <div className="mt-1 px-2.5 py-1.5 bg-gold-400/5 border border-gold-500/20 rounded text-xs text-gold-200">
              <span className="font-medium text-gold-400">Vera意见：</span>{task.veraComments}
            </div>
          )}
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {(task.mDeadline || task.cDeadline || task.sDeadline) && (
            <span className={`flex items-center gap-1 text-xs font-medium ${task.isOverdue ? 'text-red-400' : 'text-surface-400'}`}>
              <Clock size={11} />{task.mDeadline || task.cDeadline || task.sDeadline}
            </span>
          )}
          {task.reviewLink && (
            <a href={task.reviewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost flex items-center gap-1">
              查看内容 <ExternalLink size={10} />
            </a>
          )}
          {showActions && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                <CheckCircle size={11} />通过
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-danger flex items-center gap-1">
                <RotateCcw size={11} />退回
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost flex items-center gap-1">
                <PauseCircle size={11} />暂停
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost flex items-center gap-1">
                <FileEdit size={11} />意见
              </button>
            </div>
          )}
          {!showActions && (
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">查看详情</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Budget row ────────────────────────────────────────────────────────────────

function BudgetRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  return (
    <div onClick={() => onClick(task)} className="card card-hover p-4 border-l-2 border-l-amber-400 cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
            <PriorityBadge priority={task.priority} />
            <span className="inline-flex items-center gap-1 bg-amber-950/60 text-amber-300 border border-amber-800/40 rounded-full text-[10px] px-2 py-0.5">
              <DollarSign size={10} />{task.budgetChangeType}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-surface-100 mb-1 leading-snug">{task.title}</h3>
          <p className="text-xs text-surface-500">{task.website} · {task.adPlatform}</p>
          {task.budgetNote && <p className="text-[10px] text-surface-400 mt-1">{task.budgetNote}</p>}
        </div>
        <div className="flex-shrink-0 text-right">
          {task.currentBudget != null && (
            <p className="text-[10px] text-surface-500">当前 <span className="text-surface-300 font-medium">${task.currentBudget.toLocaleString()}</span></p>
          )}
          {task.proposedBudget != null && (
            <p className="text-xs font-bold text-amber-300 mt-0.5">${task.proposedBudget.toLocaleString()}</p>
          )}
          <div className="flex gap-1.5 mt-2">
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold text-[10px] flex items-center gap-1">
              <CheckCircle2 size={10} />确认
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-danger text-[10px] flex items-center gap-1">
              <XCircle size={10} />拒绝
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Auto-approved row ─────────────────────────────────────────────────────────

function AutoRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  return (
    <div onClick={() => onClick(task)} className="card card-hover p-3 border-l-2 border-l-emerald-600 cursor-pointer">
      <div className="flex items-center gap-3">
        <Zap size={12} className="text-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-200 truncate">{task.title}</p>
          <p className="text-[10px] text-surface-500">{task.website} · {task.contentType}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.riskLevel && (
            <span className={`inline-flex items-center gap-1 border rounded-full text-[10px] px-1.5 py-0.5 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
              <span className={`w-1 h-1 rounded-full ${RISK_LEVEL_DOT[task.riskLevel]}`} />
              {task.aiRiskScore}分
            </span>
          )}
          {task.autoApprovalTime && (
            <span className="text-[10px] text-surface-600">{task.autoApprovalTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface VeraReviewProps { tasks: Task[] }

export function VeraReview({ tasks: allTasks }: VeraReviewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(true);

  // Zone 1: 今日必须审核 — non-budget, non-intercepted Vera pending, high/medium risk
  const mustReview = useMemo(() =>
    allTasks.filter((t) =>
      t.status === '06_Vera待审核' && !t.isBudgetTask && !t.isIntercepted
    ).sort((a, b) => {
      const rOrder: Record<string, number> = { '高': 0, '中': 1, '低': 2 };
      return (rOrder[a.riskLevel || '低'] ?? 2) - (rOrder[b.riskLevel || '低'] ?? 2);
    }),
  [allTasks]);

  // Zone 2: 可快速通过 — autoApproved tasks still needing human sign-off
  const quickPass = useMemo(() =>
    allTasks.filter((t) =>
      (t.autoApproved || t.status === '12_自动放行') && t.aiRiskScore != null && t.aiRiskScore <= 30
    ),
  [allTasks]);

  // Zone 3: 预算确认 — budget tasks
  const budgetTasks = useMemo(() =>
    allTasks.filter((t) => t.isBudgetTask && t.budgetStatus === '等待Vera确认预算'),
  [allTasks]);

  // Zone 4: 已自动放行记录 — auto-approved without need for sign-off
  const autoRecords = useMemo(() =>
    allTasks.filter((t) =>
      (t.autoApproved || t.status === '12_自动放行') && !quickPass.find((q) => q.id === t.id)
    ),
  [allTasks, quickPass]);

  // ── Boss decision data ───────────────────────────────────────────────────────
  const decision = useMemo(() => {
    const total     = allTasks.length;
    const completed = allTasks.filter(isDone).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const ROLES = ['小M', '小S', '小C', '小A', 'Vera'] as const;
    const roleBlocked = ROLES.map((r) => ({
      role: r,
      count: allTasks.filter((t) => t.assignedTo === r && isBlocked(t)).length,
    })).sort((a, b) => b.count - a.count);
    const mostBlockedRole = roleBlocked[0]?.count > 0 ? roleBlocked[0] : null;

    const siteStats = WEBSITES.map((site) => {
      const st = allTasks.filter((t) => t.website === site);
      return { site, total: st.length, done: st.filter(isDone).length, pct: st.length > 0 ? st.filter(isDone).length / st.length : 1 };
    }).sort((a, b) => a.pct - b.pct);
    const worstSite = siteStats[0]?.total > 0 ? siteStats[0] : null;

    const adTasks = allTasks.filter((t) => t.isAdTask);
    const highestSpend = [...adTasks].sort((a, b) => (b.spent || 0) - (a.spent || 0))[0];
    const bestInquiry  = [...adTasks].sort((a, b) => (b.inquiries || 0) - (a.inquiries || 0))[0];
    const shouldPause  = adTasks.filter((t) => t.shouldPauseAd || t.adStatus === '暂停' || t.adStatus === '需优化');
    const shouldScale  = adTasks.filter((t) => t.shouldScale);
    const pausedContent = allTasks.filter((t) => !t.isAdTask && (t.status === '99_暂停/返工' || !!t.blockReason));

    return { completionPct, completed, total, mostBlockedRole, worstSite, highestSpend, bestInquiry, shouldPause, shouldScale, pausedContent };
  }, [allTasks]);

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Boss Decision Area ─────────────────────────────────────────── */}
      <div className="card border border-gold-500/20">
        <button
          onClick={() => setDecisionOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-400" />
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-widest">老板决策区</span>
            <span className="text-[10px] text-surface-500">本周快速判断</span>
          </div>
          {decisionOpen ? <ChevronUp size={14} className="text-surface-500" /> : <ChevronDown size={14} className="text-surface-500" />}
        </button>

        {decisionOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-surface-800">
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-surface-500">本周整体完成度</span>
                <span className="text-lg font-black text-gold-400">{decision.completionPct}%</span>
              </div>
              <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-gold-400 rounded-full" style={{ width: `${decision.completionPct}%` }} />
              </div>
              <p className="text-[10px] text-surface-500 mt-1">{decision.completed} / {decision.total} 任务已完成</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DecisionCard
                label="哪个角色卡住最多"
                value={decision.mostBlockedRole ? `${decision.mostBlockedRole.role} — ${decision.mostBlockedRole.count} 条阻塞` : '目前无阻塞'}
                status={decision.mostBlockedRole ? 'warn' : 'ok'}
                action={decision.mostBlockedRole ? '需介入解除阻塞' : undefined}
              />
              <DecisionCard
                label="哪个网站完成度最低"
                value={decision.worstSite ? `${decision.worstSite.site.replace('.com', '').replace('.ru', '')} — ${decision.worstSite.done}/${decision.worstSite.total} (${Math.round(decision.worstSite.pct * 100)}%)` : '--'}
                status="warn"
                action="优先排期补充任务"
              />
              <DecisionCard
                label="哪个广告花费最高"
                value={decision.highestSpend ? `${decision.highestSpend.adPlatform} $${decision.highestSpend.spent}` : '无广告数据'}
                status="neutral"
                action={decision.highestSpend?.adStatus === '需优化' ? '效果不佳，考虑调整预算' : undefined}
              />
              <DecisionCard
                label="哪个页面询盘最好"
                value={decision.bestInquiry?.inquiries ? `${decision.bestInquiry.adPlatform} — ${decision.bestInquiry.inquiries} 询盘` : '暂无询盘数据'}
                status={decision.bestInquiry?.inquiries ? 'good' : 'neutral'}
                action={decision.bestInquiry?.inquiries ? '可考虑加预算放大' : undefined}
              />
              <DecisionCard
                label="哪些内容需要暂停"
                value={decision.pausedContent.length > 0 ? `${decision.pausedContent.length} 条内容已暂停/阻塞` : '无需暂停'}
                status={decision.pausedContent.length > 0 ? 'warn' : 'ok'}
                action={decision.pausedContent.length > 0 ? decision.pausedContent.map((t) => t.id).join(', ') : undefined}
              />
              <DecisionCard
                label="哪些广告值得加预算"
                value={decision.shouldScale.length > 0 ? decision.shouldScale.map((t) => t.adPlatform).join('、') : decision.bestInquiry?.inquiries ? `${decision.bestInquiry.adPlatform} 数据最优` : '暂无明显优势广告'}
                status={decision.shouldScale.length > 0 ? 'good' : 'neutral'}
                action={decision.shouldScale.length > 0 ? '确认预算后通知小A' : undefined}
              />
            </div>

            {decision.shouldPause.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-red-400 mb-1.5">需暂停或优化的广告</p>
                <div className="space-y-1">
                  {decision.shouldPause.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-red-300">{t.adPlatform} · {t.website.replace('.com', '').replace('.ru', '')}</span>
                      <span className="text-surface-500">{t.adStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Zone 1: 今日必须审核 ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-red-400" />
          <h2 className="text-xs font-semibold text-red-300 uppercase tracking-widest">今日必须审核</h2>
          <span className="ml-1 text-[10px] bg-red-950/60 text-[#e88989] border border-red-800/40 px-2 py-0.5 rounded-full font-bold">{mustReview.length}</span>
        </div>
        {mustReview.length > 0 ? (
          <div className="space-y-3">
            {mustReview.map((task) => <VeraTaskRow key={task.id} task={task} onClick={setSelectedTask} showActions />)}
          </div>
        ) : (
          <div className="card p-6 text-center">
            <CheckCircle2 size={24} className="text-emerald-400/40 mx-auto mb-2" />
            <p className="text-xs text-surface-500">暂无必须审核的任务</p>
          </div>
        )}
      </div>

      {/* ── Zone 2: 可快速通过 ────────────────────────────────────────── */}
      {quickPass.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <h2 className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">可快速通过</h2>
            <span className="ml-1 text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded-full font-bold">{quickPass.length}</span>
            <span className="text-[10px] text-surface-500">AI评分≤30，低风险，建议直接放行</span>
          </div>
          <div className="space-y-3">
            {quickPass.map((task) => <VeraTaskRow key={task.id} task={task} onClick={setSelectedTask} showActions />)}
          </div>
        </div>
      )}

      {/* ── Zone 3: 预算确认 ──────────────────────────────────────────── */}
      {budgetTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={13} className="text-amber-400" />
            <h2 className="text-xs font-semibold text-amber-300 uppercase tracking-widest">预算确认</h2>
            <span className="ml-1 text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-full font-bold">{budgetTasks.length}</span>
          </div>
          <div className="space-y-3">
            {budgetTasks.map((task) => <BudgetRow key={task.id} task={task} onClick={setSelectedTask} />)}
          </div>
        </div>
      )}

      {/* ── Zone 4: 已自动放行记录 ────────────────────────────────────── */}
      {autoRecords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-surface-400" />
            <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-widest">已自动放行记录</h2>
            <span className="ml-1 text-[10px] bg-surface-800 text-surface-400 border border-surface-700 px-2 py-0.5 rounded-full font-bold">{autoRecords.length}</span>
            <span className="text-[10px] text-surface-600">AI已自动处理，无需操作</span>
          </div>
          <div className="space-y-2">
            {autoRecords.map((task) => <AutoRow key={task.id} task={task} onClick={setSelectedTask} />)}
          </div>
        </div>
      )}

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
