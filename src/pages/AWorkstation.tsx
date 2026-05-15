import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, TrendingUp, TrendingDown, DollarSign, MousePointer, MessageSquare, Pause } from 'lucide-react';
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

interface AWorkstationProps { tasks: Task[] }

export function AWorkstation({ tasks }: AWorkstationProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const adTasks = useMemo(() => {
    const relevant = tasks.filter((t) => t.isAdTask || t.assignedTo === '小A');
    return filterTasks(relevant, { ...filters, assignedTo: 'all' });
  }, [tasks, filters]);

  const totalSpent  = adTasks.reduce((s, t) => s + (t.spent || 0), 0);
  const totalClicks = adTasks.reduce((s, t) => s + (t.clicks || 0), 0);
  const totalInquiries = adTasks.reduce((s, t) => s + (t.inquiries || 0), 0);
  const avgCpl = totalInquiries > 0 ? (totalSpent / totalInquiries).toFixed(0) : '--';

  const activeAds  = adTasks.filter((t) => t.adStatus === '投放中');
  const needOptimize = adTasks.filter((t) => t.adStatus === '需优化');
  const pausedAds  = adTasks.filter((t) => t.adStatus === '暂停');

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ overdue: adTasks.filter((t) => t.isOverdue).length, vera: adTasks.filter((t) => t.needsVeraReview).length }}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AdStatCard label="总花费" value={`$${totalSpent.toLocaleString()}`} icon={<DollarSign size={14} />} accent="orange" />
          <AdStatCard label="总点击" value={totalClicks.toLocaleString()} icon={<MousePointer size={14} />} accent="blue" />
          <AdStatCard label="总询盘" value={String(totalInquiries)} icon={<MessageSquare size={14} />} accent="emerald" />
          <AdStatCard label="平均CPL" value={`$${avgCpl}`} icon={<TrendingDown size={14} />} accent="gold" />
        </div>

        {/* Alerts */}
        {needOptimize.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">
              <strong>{needOptimize.length}</strong> 个广告需要优化：{needOptimize.map((t) => t.adPlatform).join('、')}
            </p>
          </div>
        )}
        {pausedAds.length > 0 && (
          <div className="p-3 bg-surface-800 border border-surface-700 rounded-lg flex items-center gap-2">
            <Pause size={14} className="text-surface-400 flex-shrink-0" />
            <p className="text-xs text-surface-400">
              <strong>{pausedAds.length}</strong> 个广告已暂停，等待外部条件就绪
            </p>
          </div>
        )}

        {/* Active ads highlight */}
        {activeAds.length > 0 && (
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-orange-400/70 font-semibold mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 overdue-pulse" />
              投放中 ({activeAds.length})
            </h3>
            <div className="space-y-3">
              {activeAds.map((t) => <AdTaskRow key={t.id} task={t} onClick={setSelectedTask} />)}
            </div>
          </div>
        )}

        {/* All other tasks */}
        {(() => {
          const others = adTasks.filter((t) => t.adStatus !== '投放中');
          if (!others.length) return null;
          return (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-surface-500 font-semibold mb-3">其他广告任务 ({others.length})</h3>
              <div className="space-y-3">
                {others.map((t) => <AdTaskRow key={t.id} task={t} onClick={setSelectedTask} />)}
              </div>
            </div>
          );
        })()}

        {adTasks.length === 0 && (
          <div className="text-center py-16 text-surface-600 text-sm">暂无广告任务</div>
        )}
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  orange:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  gold:    'bg-gold-400/10 text-gold-400 border-gold-500/20',
};

function AdStatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  const s = ACCENT_MAP[accent] || ACCENT_MAP.gold;
  return (
    <div className={`card p-3 border ${s}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest text-surface-500">{label}</span>
        <span className={s.split(' ')[1]}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${s.split(' ')[1]}`}>{value}</p>
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

function MetricCell({ label, value, suffix = '', warn }: { label: string; value?: number | string; suffix?: string; warn?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <span className="text-[9px] uppercase tracking-widest text-surface-600">{label}</span>
      <p className={`text-sm font-semibold ${warn ? 'text-red-400' : 'text-surface-200'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
}

function ResultTag({ show, label, color }: { show?: boolean; label: string; color: string }) {
  if (!show) return null;
  return (
    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${color}`}>{label}</span>
  );
}

function AdTaskRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const isActive   = task.adStatus === '投放中';
  const isOptimize = task.adStatus === '需优化';
  const isPaused   = task.adStatus === '暂停';

  return (
    <div
      onClick={() => onClick(task)}
      className={`card card-hover p-4 border-l-2 ${
        isActive ? 'border-l-orange-500' : isOptimize ? 'border-l-red-500' : isPaused ? 'border-l-surface-600' : 'border-l-blue-500'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
            <PriorityBadge priority={task.priority} />
            <AdStatusBadge status={task.adStatus} />
            {task.adPlatform && (
              <span className={`text-[10px] font-semibold ${PLATFORM_COLORS[task.adPlatform] || 'text-surface-300'}`}>
                {task.adPlatform}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-surface-100 mb-1 leading-snug">{task.title}</h3>
          <p className="text-xs text-surface-500 mb-3">{task.website} · {task.adRegion}</p>

          {/* Metrics grid */}
          {(task.spent !== undefined || task.clicks !== undefined || task.inquiries !== undefined) && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-2 mb-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700/50">
              <MetricCell label="花费" value={task.spent} suffix=" USD" />
              <MetricCell label="展示" value={task.impressions} />
              <MetricCell label="点击" value={task.clicks} />
              <MetricCell label="CTR" value={task.ctr} suffix="%" warn={(task.ctr ?? 0) < 1} />
              <MetricCell label="CPC" value={task.cpc} suffix=" USD" />
              <MetricCell label="询盘" value={task.inquiries} />
              {task.cpl !== undefined && <MetricCell label="CPL" value={`$${task.cpl}`} warn={(task.cpl ?? 0) > 200} />}
              {task.conversionRate !== undefined && <MetricCell label="转化率" value={task.conversionRate} suffix="%" />}
              {task.budget !== undefined && <MetricCell label="月预算" value={task.budget} suffix=" USD" />}
            </div>
          )}

          {/* Result judgment tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <ResultTag show={task.shouldScale} label="值得加预算" color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
            <ResultTag show={task.needsCopyChange} label="需改文案" color="bg-amber-500/10 text-amber-300 border-amber-500/30" />
            <ResultTag show={task.needsVideoChange} label="需改视频" color="bg-orange-500/10 text-orange-300 border-orange-500/30" />
            <ResultTag show={task.needsLpChange} label="需优化LP" color="bg-red-500/10 text-red-300 border-red-500/30" />
            <ResultTag show={task.shouldPauseAd} label="建议暂停" color="bg-surface-700 text-surface-400 border-surface-600" />
          </div>

          {/* Data feedback */}
          {task.dataFeedback && (
            <div className="px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-400">
              <span className="font-medium text-surface-300">数据反馈：</span>{task.dataFeedback}
            </div>
          )}

          {/* Block reason */}
          {task.blockReason && (
            <div className="mt-2 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
              <span className="font-medium">阻塞：</span>{task.blockReason}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {task.aDeadline && (
            <span className="text-xs text-surface-500">{task.aDeadline}</span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {task.adMaterialLink && (
              <a href={task.adMaterialLink} target="_blank" rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} className="btn-ghost flex items-center gap-1">
                查看素材 <ExternalLink size={10} />
              </a>
            )}
            {task.targetUrl && (
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost flex items-center gap-1">
                查看落地页
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isActive && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold flex items-center gap-1">
                  <TrendingUp size={11} />提交数据
                </button>
                <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-danger flex items-center gap-1">
                  <Pause size={11} />暂停
                </button>
              </>
            )}
            {isOptimize && (
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">提交复盘</button>
            )}
            {task.adStatus === '待建广告' && (
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">开始建广告</button>
            )}
            {task.adStatus === '待上线' && (
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">标记投放中</button>
            )}
            {!isActive && task.adStatus !== '待建广告' && task.adStatus !== '待上线' && task.adStatus !== '需优化' && (
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">查看详情</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
