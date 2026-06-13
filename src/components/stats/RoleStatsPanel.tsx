import {
  AlertTriangle, ShieldCheck, TrendingUp, CheckCircle2, Send, XCircle, Zap, Bot,
  FileText, Scissors, Link2, BarChart2,
} from 'lucide-react';
import { roleFormalName as R } from '../../config/roleDisplay';
import type { Task } from '../../types';
import type { LoginRole } from '../../types/session';
import { RISK_LEVEL_DOT } from '../../types';
import { useRoleDisplay } from '../../context/RoleDisplayContext';
import {
  computeExecutorStats, computeGlobalStats,
  computeDetailedRoleProgress, computeWebsiteProgress,
  computeContentTypeProgress, computePipelineDistribution,
  computeRiskProgress, findWorstWebsite,
} from '../../utils/taskStats';
import {
  StatCard, ProgressBarRow, CompletionRing, StackedProgressBar, DistributionBarRow,
} from './StatCard';

interface RoleStatsPanelProps {
  role: LoginRole;
  tasks: Task[];
  /** Vera / PM 使用全量任务 */
  allTasks?: Task[];
}

export function RoleStatsPanel({ role, tasks, allTasks }: RoleStatsPanelProps) {
  useRoleDisplay();
  const globalTasks = allTasks ?? tasks;

  if (role === 'VERA') {
    return <VeraBossPanel tasks={globalTasks} />;
  }

  if (role === 'PM') {
    const stats = computeExecutorStats(globalTasks, 'PM');
    const g = computeGlobalStats(globalTasks);
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} accent={s.accent} />
          ))}
        </div>
        <div className="card p-3 border border-surface-700 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-surface-500 mb-1">各执行线进度</p>
          {g.byRole.map((r) => (
            <ProgressBarRow key={r.label} {...r} wideLabel />
          ))}
        </div>
      </div>
    );
  }

  const stats = computeExecutorStats(tasks, role);
  const icons: Partial<Record<string, React.ReactNode>> = {
    待处理: <FileText size={12} />,
    待剪辑: <Scissors size={12} />,
    待确认链接: <Link2 size={12} />,
    筹备中: <BarChart2 size={12} />,
    逾期: <AlertTriangle size={12} />,
    阻塞: <XCircle size={12} />,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4">
      <div className={`grid gap-2 ${stats.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'}`}>
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            sub={s.sub}
            accent={s.accent}
            icon={icons[s.label]}
          />
        ))}
      </div>
    </div>
  );
}

function VeraBossPanel({ tasks }: { tasks: Task[] }) {
  const g = computeGlobalStats(tasks);
  const roleProgress = computeDetailedRoleProgress(tasks);
  const websiteProgress = computeWebsiteProgress(tasks);
  const contentProgress = computeContentTypeProgress(tasks);
  const pipeline = computePipelineDistribution(tasks);
  const riskProgress = computeRiskProgress(tasks);
  const worstSite = findWorstWebsite(tasks);
  const autoApproveRate = g.total > 0 ? Math.round((g.autoApproved / g.total) * 100) : 0;
  const interceptRate = g.total > 0 ? Math.round((g.intercepted / g.total) * 100) : 0;

  return (
    <div className="px-4 md:px-6 pt-4 pb-2 space-y-5">
      {/* ── 完成度总览（对齐 Dashboard Hero） ── */}
      <section>
        <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">完成度总览</h2>
        <div className="card border border-surface-700 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <div className="relative flex-shrink-0">
              <CompletionRing completed={g.completed} total={g.total} />
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <StatCard label="总任务" value={g.total} icon={<CheckCircle2 size={14} />} accent="surface" />
              <StatCard
                label="已完成"
                value={g.completed}
                sub={`${g.completionPct}%`}
                icon={<Send size={14} />}
                accent="emerald"
              />
              <StatCard
                label="逾期任务"
                value={g.overdue}
                sub={g.overdue > 0 ? '需立即处理' : '暂无'}
                icon={<AlertTriangle size={14} />}
                accent={g.overdue > 0 ? 'red' : 'surface'}
              />
              <StatCard
                label="阻塞任务"
                value={g.blocked}
                sub={g.blocked > 0 ? '需协调处理' : '流程顺畅'}
                icon={<XCircle size={14} />}
                accent={g.blocked > 0 ? 'red' : 'surface'}
              />
            </div>
          </div>
          <div className="mt-4">
            <StackedProgressBar
              completed={g.completed}
              inProgress={g.inProgress}
              blocked={g.blocked}
              total={g.total}
            />
          </div>
        </div>
      </section>

      {/* ── 角色 + 网站完成度 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">按角色完成度</h3>
          <div className="space-y-2.5">
            {roleProgress.map((r) => (
              <ProgressBarRow key={r.label} {...r} wideLabel />
            ))}
          </div>
        </div>
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">
            按网站完成度
            {worstSite && (
              <span className="ml-2 text-red-400 normal-case font-normal">落后：{worstSite}</span>
            )}
          </h3>
          <div className="space-y-2.5">
            {websiteProgress.map((w) => (
              <ProgressBarRow key={w.label} {...w} wideLabel />
            ))}
          </div>
        </div>
      </div>

      {/* ── 内容类型 + 流程阶段分布 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentProgress.length > 0 && (
          <div className="card border border-surface-700 p-4">
            <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">按内容类型完成度</h3>
            <div className="space-y-2.5">
              {contentProgress.map((c) => (
                <ProgressBarRow key={c.label} {...c} wideLabel />
              ))}
            </div>
          </div>
        )}
        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">全流程阶段分布</h3>
          <div className="space-y-2.5">
            {pipeline.filter((p) => p.count > 0).map((p) => (
              <DistributionBarRow
                key={p.label}
                label={p.label}
                count={p.count}
                total={g.total}
                accent={p.accent}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Vera 决策 + 风险 + 自动化 ── */}
      <section>
        <h2 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">审核与风险</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatCard
            label={`待${R('VERA')}审核`}
            value={g.veraPending}
            sub={g.budgetPending > 0 ? `含 ${g.budgetPending} 条预算` : '暂无预算申请'}
            icon={<ShieldCheck size={12} />}
            accent="gold"
          />
          <StatCard
            label="自动放行率"
            value={`${autoApproveRate}%`}
            sub={`${g.autoApproved} 条任务`}
            icon={<Zap size={12} />}
            accent="emerald"
          />
          <StatCard
            label="高风险拦截"
            value={`${interceptRate}%`}
            sub={`${g.intercepted} 条拦截`}
            icon={<XCircle size={12} />}
            accent="red"
          />
          <StatCard
            label="高风险任务"
            value={g.highRisk}
            sub={`中 ${g.riskDist['中']} · 低 ${g.riskDist['低']}`}
            icon={<TrendingUp size={12} />}
            accent="orange"
          />
        </div>

        <div className="card border border-surface-700 p-4">
          <h3 className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mb-3">风险等级分布</h3>
          <div className="space-y-2.5">
            {riskProgress.map(({ level, count, accent }) => {
              const pct = g.total > 0 ? Math.round((count / g.total) * 100) : 0;
              const textColor = level === '低' ? 'text-emerald-300' : level === '中' ? 'text-amber-300' : 'text-red-300';
              return (
                <div key={level} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[level]}`} />
                    <span className={`text-xs font-medium ${textColor}`}>{level}风险</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${accent === 'emerald' ? 'bg-emerald-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-8 text-right ${textColor}`}>{pct}%</span>
                  <span className="text-[10px] text-surface-600 w-10 text-right tabular-nums">{count}/{g.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 决策提示 ── */}
      {(g.veraPending > 0 || g.budgetPending > 0 || g.blocked > 0 || g.overdue > 0) && (
        <div className="card p-3 border border-gold-500/15 bg-gold-400/5">
          <p className="text-[10px] uppercase tracking-widest text-gold-500/70 mb-2 flex items-center gap-1.5">
            <Bot size={11} /> 决策提示
          </p>
          <ul className="text-[11px] text-surface-400 space-y-1">
            {g.veraPending > 0 && (
              <li>· 有 <strong className="text-gold-300">{g.veraPending}</strong> 条任务等待您的审核决策</li>
            )}
            {g.budgetPending > 0 && (
              <li>· 有 <strong className="text-gold-300">{g.budgetPending}</strong> 条广告预算变更待批准</li>
            )}
            {g.blocked > 0 && (
              <li>· <strong className="text-red-300">{g.blocked}</strong> 条任务阻塞或拦截，建议与 {R('PM')} 协调</li>
            )}
            {g.overdue > 0 && (
              <li>· <strong className="text-red-300">{g.overdue}</strong> 条任务已逾期，需关注瓶颈环节</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
