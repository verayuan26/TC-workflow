import { useState, useMemo } from 'react';
import { ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import type { Task, FilterState } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { TaskModal } from '../components/TaskModal';
import { filterTasks } from '../services/taskApi';

const DEFAULT_FILTERS: FilterState = {
  assignedTo: 'MEDIA', website: 'all', contentType: 'all',
  status: 'all', priority: 'all', isOverdue: null, needsVeraReview: null,
};

interface MWorkstationProps { tasks: Task[] }

export function MWorkstation({ tasks }: MWorkstationProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const mTasks = useMemo(() => {
    const relevant = tasks.filter((t) =>
      t.assignedTo === 'MEDIA' ||
      t.status === '04_MEDIA_EDIT' ||
      t.contentType === '素材整理' ||
      t.contentType === '短视频' ||
      t.contentType === '长视频'
    );
    const applied = { ...filters, assignedTo: filters.assignedTo === 'all' ? 'MEDIA' : filters.assignedTo };
    return filterTasks(relevant, applied);
  }, [tasks, filters]);

  const overdueTasks = mTasks.filter((t) => t.isOverdue);

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ overdue: overdueTasks.length, vera: mTasks.filter((t) => t.needsVeraReview).length }}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {overdueTasks.length > 0 && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">有 <strong>{overdueTasks.length}</strong> 条逾期任务需要立即处理</p>
          </div>
        )}

        <div className="space-y-3">
          {mTasks.length === 0 && (
            <div className="text-center py-16 text-surface-600 text-sm">暂无任务</div>
          )}
          {mTasks.map((task) => (
            <MTaskRow key={task.id} task={task} onClick={setSelectedTask} />
          ))}
        </div>
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}

function MTaskRow({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  return (
    <div
      onClick={() => onClick(task)}
      className={`card card-hover p-4 ${task.isOverdue ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-amber-500'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Left: main info */}
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
            {task.needsVeraReview && (
              <span className="text-[10px] text-gold-400 border border-gold-500/30 rounded-full px-1.5 py-0.5">Vera必审</span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-surface-100 mb-1 leading-snug">{task.title}</h3>
          <p className="text-xs text-surface-500 mb-2">{task.website}</p>

          {/* Fields grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
            <FieldItem label="视频类型" value={task.videoType} />
            <FieldItem label="剪辑等级" value={task.editLevel} />
            <FieldItem label="素材编号" value={task.materialId} />
            <FieldItem label="字幕语言" value={task.subtitleLanguage} />
            {task.coverRequirements && (
              <div className="col-span-2 sm:col-span-4">
                <FieldItem label="封面要求" value={task.coverRequirements} />
              </div>
            )}
          </div>

          {task.returnNotes && (
            <div className="mt-2 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
              <span className="font-medium">返工意见：</span>{task.returnNotes}
            </div>
          )}
        </div>

        {/* Right: deadline + links + actions */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
          {task.mDeadline && (
            <span className={`flex items-center gap-1 text-xs font-medium ${task.isOverdue ? 'text-red-400' : 'text-surface-400'}`}>
              <Clock size={11} />{task.mDeadline}
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            {task.scriptLink && (
              <a href={task.scriptLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="btn-ghost flex items-center gap-1">
                查看脚本 <ExternalLink size={10} />
              </a>
            )}
            {task.materialLink && (
              <a href={task.materialLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                className="btn-ghost flex items-center gap-1">
                查看素材 <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-gold">提交成片</button>
            <button onClick={(e) => { e.stopPropagation(); onClick(task); }} className="btn-ghost">补充素材</button>
          </div>
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
      <p className="text-xs text-surface-300">{value}</p>
    </div>
  );
}
