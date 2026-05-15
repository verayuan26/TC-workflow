import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, DollarSign, MousePointer, MessageSquare, Pause, Eye, Play, Video, Phone, FileText, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';
import type { Task, FilterState, AdStatus } from '../types';
import { AD_STATUS_COLORS, PLATFORM_COLORS } from '../types';
import { PriorityBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { TaskModal } from '../components/TaskModal';
import { filterTasks } from '../services/taskApi';

const DEFAULT_FILTERS: FilterState = {
  assignedTo: '小A', website: 'all', contentType: 'all',
  status: 'all', priority: 'all', isOverdue: null, needsVeraReview: null,
};

const STATUS_GROUPS: { label: string; statuses: AdStatus[]; accent: string; dotClass: string }[] = [
  { label: '投放中',   statuses: ['投放中'],                             accent: 'text-orange-400',  dotClass: 'bg-orange-400 overdue-pulse' },
  { label: '观察中',   statuses: ['观察中'],                             accent: 'text-cyan-400',    dotClass: 'bg-cyan-400' },
  { label: '放大候选', statuses: ['放大候选'],                           accent: 'text-emerald-400', dotClass: 'bg-emerald-400' },
  { label: '需优化',   statuses: ['需优化'],                             accent: 'text-[#e88989]',   dotClass: 'bg-red-400' },
  { label: '待上线',   statuses: ['Vera已确认预算', '待上线', '待确认落地页'], accent: 'text-blue-400', dotClass: 'bg-blue-400' },
  { label: '等待审批', statuses: ['等待Vera确认预算', 'AI建议预算'],     accent: 'text-gold-400',    dotClass: 'bg-gold-400' },
  { label: '暂停',     statuses: ['暂停', 'Vera拒绝预算'],               accent: 'text-surface-400', dotClass: 'bg-surface-600' },
  { label: '筹备中',   statuses: ['待建广告', '待审核素材'],             accent: 'text-surface-300', dotClass: 'bg-surface-500' },
  { label: '已结束',   statuses: ['已结束'],                             accent: 'text-surface-500', dotClass: 'bg-surface-700' },
];

const ACCENT_CARD: Record<string, string> = {
  orange:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  gold:    'bg-gold-400/10 text-gold-400 border-gold-500/20',
  red:     'bg-red-500/10 text-[#e88989] border-red-500/20',
  cyan:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

function AdStatCard({ label, value, icon, accent, sub }: { label: string; value: string; icon: React.ReactNode; accent: string; sub?: string }) {
  const s = ACCENT_CARD[accent] || ACCENT_CARD.gold;
  return (
    <div className={`card p-3 border ${s}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-surface-500">{label}</span>
        <span className={s.split(' ')[1]}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${s.split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-[9px] text-surface-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function AdStatusBadge({ status }: { status?: AdStatus }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${AD_STATUS_COLORS[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
      {status}
    </span>
  );
}

function MetricPill({ label, value, suffix = '', warn, good, icon }: { label: string; value?: number | string; suffix?: string; warn?: boolean; good?: boolean; icon?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  const color = warn ? 'text-[#e88989]' : good ? 'text-emerald-300' : 'text-surface-200';
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-surface-600">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </div>
      <p className={`text-sm font-semibold leading-none ${color}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
}

function ResultTag({ show, label, color }: { show?: boolean; label: string; color: string }) {
  if (!show) return null;
  return <span className={`text-[10px] border rounded px-1.5 py-0.5 font-medium ${color}`}>{label}</span>;
}

function BudgetRequestBanner({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <div onClick={onClick} className="card border border-gold-500/30 p-3 cursor-pointer hover:border-gold-400/50 transition-colors">
      <div className="flex items-center gap-3">
        <DollarSign size={14} className="text-gold-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gold-300 truncate">{task.title}</p>
          <p className="text-[10px] text-surface-500">
            {task.adPlatform} · {task.budgetChangeType} · 申请金额 ${(task.proposedBudget || 0).toLocaleString()}
          </p>
        </div>
        <span className="flex-shrink-0 text-[10px] bg-gold-900/30 text-gold-300 border border-gold-700/40 px-2 py-0.5 rounded-full">等待Vera</span>
      </div>
    </div>
  );
}

function ReviewBlock({ label, text, color, sub }: { label: string; text: string; color: string; sub?: string }) {
  return (
    <div className="pt-3">
      <p className="text-[9px] uppercase tracking-widest text-surface-600 mb-1">{label}</p>
      <p className={`text-[11px] leading-relaxed ${color}`}>{text}</p>
      {sub && <p className="text-[10px] text-surface-600 mt-1">{sub}</p>}
    </div>
  );
}

function AdTaskRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    task.adStatus === '投放中'              ? 'border-l-orange-500' :
    task.adStatus === '观察中'              ? 'border-l-cyan-500' :
    task.adStatus === '放大候选'            ? 'border-l-emerald-500' :
    task.adStatus === '需优化'              ? 'border-l-red-500' :
    task.adStatus === '暂停'                ? 'border-l-surface-600' :
    task.adStatus === '等待Vera确认预算'    ? 'border-l-gold-400' :
    'border-l-blue-600';

  const hasMetrics = task.spent !== undefined || task.impressions !== undefined || task.clicks !== undefined;
  const hasReview  = task.adPerformanceSummary || task.adIssues || task.adRecommendations;

  return (
    <div className={`card border-l-2 ${borderColor} overflow-hidden`}>
      <div className="p-4 cursor-pointer hover:bg-surface-800/30 transition-colors" onClick={() => onClick(task)}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
              <PriorityBadge priority={task.priority} />
              <AdStatusBadge status={task.adStatus} />
              {task.adPlatform && (
                <span className={`text-[10px] font-bold ${PLATFORM_COLORS[task.adPlatform] || 'text-surface-300'}`}>
                  {task.adPlatform}
                </span>
              )}
              {task.isOverdue && (
                <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                  <AlertTriangle size={9} />逾期
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-surface-100 mb-0.5 leading-snug">{task.title}</h3>
            <p className="text-xs text-surface-500">{task.website} · {task.adRegion}</p>

            {hasMetrics && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-2.5 p-3 bg-surface-800/50 rounded-lg border border-surface-700/40">
                <MetricPill label="展示" value={task.impressions} icon={<Eye size={9} />} />
                <MetricPill label="点击" value={task.clicks} icon={<MousePointer size={9} />} />
                <MetricPill label="CTR" value={task.ctr} suffix="%" warn={(task.ctr ?? 99) < 1} good={(task.ctr ?? 0) >= 2} />
                <MetricPill label="CPC" value={task.cpc !== undefined ? `$${task.cpc}` : undefined} />
                {task.views !== undefined && <MetricPill label="观看量" value={task.views} icon={<Video size={9} />} />}
                {task.cpv !== undefined && <MetricPill label="CPV" value={`$${task.cpv}`} />}
                {task.whatsappClicks !== undefined && <MetricPill label="WA点击" value={task.whatsappClicks} icon={<Phone size={9} />} />}
                {task.formSubmits !== undefined && <MetricPill label="表单提交" value={task.formSubmits} icon={<FileText size={9} />} />}
                <MetricPill label="有效询盘" value={task.validInquiries ?? task.inquiries} icon={<MessageSquare size={9} />} good={(task.validInquiries ?? task.inquiries ?? 0) > 5} />
                <MetricPill label="CPL" value={task.cpl !== undefined ? `$${task.cpl}` : undefined} warn={(task.cpl ?? 0) > 200} good={(task.cpl ?? 999) < 150} />
                <MetricPill label="转化率" value={task.conversionRate} suffix="%" warn={(task.conversionRate ?? 99) < 0.5} />
                <MetricPill label="花费/预算" value={task.spent !== undefined ? `$${task.spent}/$${task.budget}` : undefined} />
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-2">
              <ResultTag show={task.shouldScale}      label="值得加预算" color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
              <ResultTag show={task.needsCopyChange}  label="需改文案"   color="bg-amber-500/10 text-amber-300 border-amber-500/30" />
              <ResultTag show={task.needsVideoChange} label="需改视频"   color="bg-orange-500/10 text-orange-300 border-orange-500/30" />
              <ResultTag show={task.needsLpChange}    label="需优化LP"   color="bg-red-500/10 text-red-300 border-red-500/30" />
              <ResultTag show={task.shouldPauseAd}    label="建议暂停"   color="bg-surface-700 text-surface-400 border-surface-600" />
            </div>

            {(task.adNextAction || task.nextAction) && (
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-surface-400">
                <ArrowUpRight size={11} className="flex-shrink-0 mt-0.5 text-surface-600" />
                <span>{task.adNextAction || task.nextAction}</span>
              </div>
            )}
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
            {task.aDeadline && <span className="text-[10px] text-surface-500">{task.aDeadline}</span>}
            {task.adMaterialLink && (
              <a href={task.adMaterialLink} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} className="btn-ghost flex items-center gap-1 text-[10px]">
                素材 <ExternalLink size={9} />
              </a>
            )}
            <div className="flex flex-wrap gap-1.5">
              {task.adStatus === '投放中' && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                    <TrendingUp size={11} />提交数据
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-danger flex items-center gap-1">
                    <Pause size={11} />暂停
                  </button>
                </>
              )}
              {task.adStatus === '观察中' && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                  <TrendingUp size={11} />更新数据
                </button>
              )}
              {task.adStatus === '放大候选' && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                  <ArrowUpRight size={11} />申请加预算
                </button>
              )}
              {task.adStatus === '需优化' && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">提交复盘</button>
              )}
              {task.adStatus === '待建广告' && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">开始建广告</button>
              )}
              {(task.adStatus === '待上线' || task.adStatus === 'Vera已确认预算') && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                  <Play size={11} />标记投放中
                </button>
              )}
              {task.adStatus === '暂停' && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost flex items-center gap-1">
                  <Play size={11} />恢复投放
                </button>
              )}
              {!['投放中','观察中','放大候选','需优化','待建广告','待上线','Vera已确认预算','暂停'].includes(task.adStatus || '') && (
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">查看详情</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasReview && (
        <>
          <div
            className="px-4 py-2 border-t border-surface-700/50 flex items-center gap-1.5 cursor-pointer hover:bg-surface-800/20 transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={12} className="text-surface-500" /> : <ChevronDown size={12} className="text-surface-500" />}
            <span className="text-[10px] text-surface-500">广告复盘分析</span>
            {task.veraAdDecision && (
              <span className="ml-auto text-[10px] bg-gold-900/30 text-gold-300 border border-gold-700/30 px-2 py-0.5 rounded-full">Vera已决定</span>
            )}
          </div>
          {expanded && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-surface-700/30">
              {task.adPerformanceSummary && <ReviewBlock label="数据表现" text={task.adPerformanceSummary} color="text-surface-300" />}
              {task.adIssues && <ReviewBlock label="问题判断" text={task.adIssues} color="text-[#e88989]" />}
              {task.adRecommendations && <ReviewBlock label="推荐动作" text={task.adRecommendations} color="text-emerald-300" />}
              {task.veraAdDecision && <ReviewBlock label="Vera最终决定" text={task.veraAdDecision} color="text-gold-300" sub={task.veraAdDecisionAt} />}
            </div>
          )}
        </>
      )}

      {task.blockReason && (
        <div className="px-4 py-2 border-t border-red-800/30 bg-red-950/20 text-xs text-[#e88989]">
          <span className="font-medium">阻塞：</span>{task.blockReason}
        </div>
      )}
    </div>
  );
}

interface AWorkstationProps { tasks: Task[] }

export function AWorkstation({ tasks }: AWorkstationProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const adTasks = useMemo(() => {
    const relevant = tasks.filter((t) => t.isAdTask || t.assignedTo === '小A');
    return filterTasks(relevant, { ...filters, assignedTo: 'all' });
  }, [tasks, filters]);

  const totalSpent       = adTasks.reduce((s, t) => s + (t.spent || 0), 0);
  const totalClicks      = adTasks.reduce((s, t) => s + (t.clicks || 0), 0);
  const totalImpressions = adTasks.reduce((s, t) => s + (t.impressions || 0), 0);
  const totalViews       = adTasks.reduce((s, t) => s + (t.views || 0), 0);
  const totalWA          = adTasks.reduce((s, t) => s + (t.whatsappClicks || 0), 0);
  const totalForms       = adTasks.reduce((s, t) => s + (t.formSubmits || 0), 0);
  const totalInquiries   = adTasks.reduce((s, t) => s + (t.validInquiries ?? t.inquiries ?? 0), 0);
  const avgCpl  = totalInquiries > 0 ? (totalSpent / totalInquiries).toFixed(0) : '--';
  const avgCtr  = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '--';

  const needOptimize    = adTasks.filter((t) => t.adStatus === '需优化');
  const pausedAds       = adTasks.filter((t) => t.adStatus === '暂停');
  const budgetPending   = adTasks.filter((t) => t.adStatus === '等待Vera确认预算' || (t.isBudgetTask && t.budgetStatus === '等待Vera确认预算'));
  const scaleCandidates = adTasks.filter((t) => t.adStatus === '放大候选' || t.shouldScale);
  const activeTasks     = adTasks.filter((t) => ['投放中','观察中','放大候选'].includes(t.adStatus || ''));

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{
          overdue: adTasks.filter((t) => t.isOverdue).length,
          vera: adTasks.filter((t) => t.needsVeraReview).length,
        }}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          <AdStatCard label="总花费" value={`$${totalSpent.toLocaleString()}`} icon={<DollarSign size={13} />} accent="orange" sub={`${activeTasks.length}个投放中`} />
          <AdStatCard label="展示量" value={totalImpressions > 0 ? `${(totalImpressions/1000).toFixed(1)}k` : '--'} icon={<Eye size={13} />} accent="blue" />
          <AdStatCard label="总点击" value={totalClicks.toLocaleString()} icon={<MousePointer size={13} />} accent="blue" sub={avgCtr !== '--' ? `CTR ${avgCtr}%` : undefined} />
          <AdStatCard label="视频观看" value={totalViews > 0 ? `${(totalViews/1000).toFixed(1)}k` : '--'} icon={<Video size={13} />} accent="cyan" />
          <AdStatCard label="WA点击" value={String(totalWA)} icon={<Phone size={13} />} accent="emerald" />
          <AdStatCard label="表单提交" value={String(totalForms)} icon={<FileText size={13} />} accent="emerald" />
          <AdStatCard label="有效询盘" value={String(totalInquiries)} icon={<MessageSquare size={13} />} accent="emerald" />
          <AdStatCard label="平均CPL" value={avgCpl !== '--' ? `$${avgCpl}` : '--'} icon={<TrendingDown size={13} />} accent="gold" />
        </div>

        {/* Alerts */}
        <div className="space-y-2">
          {budgetPending.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-gold-400/70 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                等待Vera确认预算 ({budgetPending.length})
              </p>
              {budgetPending.map((t) => (
                <BudgetRequestBanner key={t.id} task={t} onClick={() => setSelectedTask(t)} />
              ))}
            </div>
          )}
          {needOptimize.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">
                <strong>{needOptimize.length}</strong> 个广告需要优化：{needOptimize.map((t) => `${t.adPlatform}(${t.website.replace('.com','').replace('.ru','')})`).join('、')}
              </p>
            </div>
          )}
          {scaleCandidates.length > 0 && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
              <TrendingUp size={13} className="text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-300">
                <strong>{scaleCandidates.length}</strong> 个广告可放大 — 建议提交预算申请至Vera
              </p>
            </div>
          )}
          {pausedAds.length > 0 && (
            <div className="p-3 bg-surface-800 border border-surface-700 rounded-lg flex items-center gap-2">
              <Pause size={13} className="text-surface-400 flex-shrink-0" />
              <p className="text-xs text-surface-400">
                <strong>{pausedAds.length}</strong> 个广告已暂停，等待条件就绪
              </p>
            </div>
          )}
        </div>

        {/* Task groups */}
        {STATUS_GROUPS.map((group) => {
          const groupTasks = adTasks.filter((t) => group.statuses.includes(t.adStatus || '' as AdStatus));
          if (!groupTasks.length) return null;
          return (
            <div key={group.label}>
              <h3 className={`text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5 ${group.accent}`}>
                <span className={`w-2 h-2 rounded-full ${group.dotClass}`} />
                {group.label} ({groupTasks.length})
              </h3>
              <div className="space-y-3">
                {groupTasks.map((t) => <AdTaskRow key={t.id} task={t} onClick={setSelectedTask} />)}
              </div>
            </div>
          );
        })}

        {adTasks.length === 0 && (
          <div className="text-center py-16 text-surface-600 text-sm">暂无广告任务</div>
        )}
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
