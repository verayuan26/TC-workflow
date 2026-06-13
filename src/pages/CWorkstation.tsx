import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Task, FilterState } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { TaskModal } from '../components/TaskModal';
import { filterTasks } from '../services/taskApi';

const DEFAULT_FILTERS: FilterState = {
  assignedTo: 'CONVERSION', website: 'all', contentType: 'all',
  status: 'all', priority: 'all', isOverdue: null, needsVeraReview: null,
};

interface CWorkstationProps { tasks: Task[] }

export function CWorkstation({ tasks }: CWorkstationProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const cTasks = useMemo(() => {
    const relevant = tasks.filter((t) =>
      t.assignedTo === 'CONVERSION' ||
      t.status === '03_CONVERSION_URL' ||
      t.contentType === 'URL检查' ||
      t.contentType === 'Landing Page'
    );
    const applied = { ...filters, assignedTo: filters.assignedTo === 'all' ? 'CONVERSION' : filters.assignedTo };
    return filterTasks(relevant, applied);
  }, [tasks, filters]);

  const overdueTasks = cTasks.filter((t) => t.isOverdue);

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ overdue: overdueTasks.length, vera: cTasks.filter((t) => t.needsVeraReview).length }}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {overdueTasks.length > 0 && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">有 <strong>{overdueTasks.length}</strong> 条逾期任务需要立即处理</p>
          </div>
        )}

        <div className="space-y-3">
          {cTasks.length === 0 && (
            <div className="text-center py-16 text-surface-600 text-sm">暂无任务</div>
          )}
          {cTasks.map((task) => (
            <CTaskRow key={task.id} task={task} onClick={setSelectedTask} />
          ))}
        </div>
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function StatusDot({ label, status }: { label: string; status?: string }) {
  if (!status) return null;
  const isDone = status.includes('已') || status.includes('完成') || status.includes('索引');
  const isBlocked = status.includes('待') || status.includes('未') || status.includes('阻塞');
  return (
    <div className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDone ? 'bg-emerald-400' : isBlocked ? 'bg-amber-400' : 'bg-surface-500'}`} />
      <span className="text-[9px] uppercase tracking-widest text-surface-600">{label}</span>
      <span className="text-xs text-surface-300 ml-0.5">{status}</span>
    </div>
  );
}

function CTaskRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const isPending = task.status === '03_CONVERSION_URL';
  const isBlocked = !!task.blockReason;

  return (
    <div
      onClick={() => onClick(task)}
      className={`card card-hover p-4 border-l-2 ${isBlocked ? 'border-l-red-500' : isPending ? 'border-l-cyan-500' : 'border-l-surface-600'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {task.isOverdue && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                <AlertTriangle size={10} />逾期
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-surface-100 mb-1 leading-snug">{task.title}</h3>
          <p className="text-xs text-surface-500 mb-3">{task.website} · {task.contentType}</p>

          {/* URL & tech status */}
          <div className="space-y-1.5">
            {task.targetUrl && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase tracking-widest text-surface-600 w-16 flex-shrink-0">目标URL</span>
                <code className="text-xs text-cyan-400 bg-surface-800 px-1.5 rounded">{task.targetUrl}</code>
                {task.urlStatus && <span className="text-[10px] text-surface-400">({task.urlStatus})</span>}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <StatusDot label="表单" status={task.formStatus} />
              <StatusDot label="Sitemap" status={task.sitemapStatus} />
              <StatusDot label="GSC" status={task.gscStatus} />
              <StatusDot label="技术" status={task.techStatus} />
            </div>
            {task.needsNewPage !== undefined && (
              <div className="flex items-center gap-1 text-xs text-surface-400">
                <span className="text-[9px] uppercase tracking-widest text-surface-600">新页面</span>
                <span>{task.needsNewPage ? '是' : '否'}</span>
              </div>
            )}
          </div>

          {isBlocked && (
            <div className="mt-2 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
              <span className="font-medium">阻塞：</span>{task.blockReason}
            </div>
          )}

          {task.lpBrief && (
            <div className="mt-2 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-400">
              <span className="font-medium text-surface-300">LP Brief：</span>{task.lpBrief}
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {task.cDeadline && (
            <span className={`flex items-center gap-1 text-xs font-medium ${task.isOverdue ? 'text-red-400' : 'text-surface-400'}`}>
              <Clock size={11} />{task.cDeadline}
            </span>
          )}
          {task.reviewLink && (
            <a href={task.reviewLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="btn-ghost flex items-center gap-1 text-[10px]">
              预览页面 <ExternalLink size={9} />
            </a>
          )}
          {isPending && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }}
                className="btn-gold flex items-center gap-1">
                <CheckCircle size={11} />技术完成
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }}
                className="btn-ghost">提交UTM</button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }}
                className="btn-danger flex items-center gap-1">
                <XCircle size={11} />标记阻塞
              </button>
            </div>
          )}
          {!isPending && (
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">
              查看详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
