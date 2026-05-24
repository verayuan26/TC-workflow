import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, Clock, CheckCircle, RotateCcw } from 'lucide-react';
import type { Task, FilterState } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { TaskModal } from '../components/TaskModal';
import { filterTasks } from '../services/taskService';

const S_STATUSES = ['01_AI待生成', '02_小S待审核', '05_小S待终审', '07_待发布', '09_数据待复盘', '99_暂停/返工'];

const DEFAULT_FILTERS: FilterState = {
  assignedTo: '小S', website: 'all', contentType: 'all',
  status: 'all', priority: 'all', isOverdue: null, needsVeraReview: null,
};

interface SWorkstationProps { tasks: Task[] }

export function SWorkstation({ tasks }: SWorkstationProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sTasks = useMemo(() => {
    const relevant = tasks.filter((t) =>
      t.assignedTo === '小S' ||
      (S_STATUSES as string[]).includes(t.status) ||
      t.contentType === 'SEO文章' ||
      t.contentType === '发布文案' ||
      t.contentType === '数据复盘'
    );
    const distributedOnly = relevant.filter((t) => t.distributionStatus !== 'not_distributed' && t.draftStatus !== 'draft' && t.draftStatus !== 'needs_vera_check');
    const applied = { ...filters, assignedTo: filters.assignedTo === 'all' ? '小S' : filters.assignedTo };
    return filterTasks(distributedOnly, applied);
  }, [tasks, filters]);

  const overdueTasks = sTasks.filter((t) => t.isOverdue);

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ overdue: overdueTasks.length, vera: sTasks.filter((t) => t.needsVeraReview).length }}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {overdueTasks.length > 0 && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">有 <strong>{overdueTasks.length}</strong> 条逾期任务需要立即处理</p>
          </div>
        )}

        <div className="space-y-3">
          {sTasks.length === 0 && (
            <div className="text-center py-16 text-surface-600 text-sm">暂无任务</div>
          )}
          {sTasks.map((task) => (
            <STaskRow key={task.id} task={task} onClick={setSelectedTask} />
          ))}
        </div>
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function STaskRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const isPending = task.status === '02_小S待审核' || task.status === '05_小S待终审';

  return (
    <div
      onClick={() => onClick(task)}
      className={`card card-hover p-4 border-l-2 ${isPending ? 'border-l-blue-500' : task.isOverdue ? 'border-l-red-500' : 'border-l-surface-600'}`}
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
          <p className="text-xs text-surface-500 mb-2">{task.website} · {task.contentType}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
            <FieldItem label="关键词" value={task.keywords} />
            <FieldItem label="关键词来源" value={task.keywordSource} />
            <FieldItem label="使用Skill" value={task.skill} />
            <FieldItem label="CTA" value={task.cta} />
            <FieldItem label="CRM标签" value={task.crmTags} />
            <FieldItem label="审核状态" value={task.reviewStatus} />
          </div>

          {task.blockReason && (
            <div className="mt-2 px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded text-xs text-surface-400">
              <span className="font-medium text-red-400">阻塞：</span>{task.blockReason}
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {task.sDeadline && (
            <span className={`flex items-center gap-1 text-xs font-medium ${task.isOverdue ? 'text-red-400' : 'text-surface-400'}`}>
              <Clock size={11} />{task.sDeadline}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {task.aiOutputLink && (
              <a href={task.aiOutputLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="btn-ghost flex items-center gap-1">
                查看AI输出 <ExternalLink size={10} />
              </a>
            )}
            {task.scriptLink && (
              <a href={task.scriptLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="btn-ghost flex items-center gap-1">
                查看脚本 <ExternalLink size={10} />
              </a>
            )}
          </div>
          {isPending && (
            <div className="flex flex-wrap gap-1.5">
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }}
                className="btn-gold flex items-center gap-1">
                <CheckCircle size={11} />审核通过
              </button>
              <button onClick={(e) => { e.stopPropagation(); onClick(task); }}
                className="btn-danger flex items-center gap-1">
                <RotateCcw size={11} />退回
              </button>
            </div>
          )}
          {task.status === '01_AI待生成' && (
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">
              提交脚本
            </button>
          )}
          {!isPending && task.status !== '01_AI待生成' && (
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">
              查看详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-[9px] uppercase tracking-widest text-surface-600">{label}</span>
      <p className="text-xs text-surface-300 line-clamp-1">{value}</p>
    </div>
  );
}
