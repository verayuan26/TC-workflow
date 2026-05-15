import { AlertTriangle, Clock, Globe, Tag } from 'lucide-react';
import type { Task } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

const WEBSITE_SHORT: Record<string, string> = {
  'tigersourcingchina.com':  'TSC',
  'tigerlogisticschina.com': 'TLC',
  'tiger-logistics.ru':      'TLR',
  'tiger-poisk.ru':          'TPR',
  'oz-logistics.ru':         'OZL',
};

const LEFT_BORDER: Record<string, string> = {
  '01_AI待生成':    'border-l-surface-500',
  '02_小S待审核':   'border-l-blue-500',
  '03_小C待确认URL': 'border-l-cyan-500',
  '04_小M待剪辑':   'border-l-amber-500',
  '05_小S待终审':   'border-l-blue-400',
  '06_Vera待审核':  'border-l-gold-400',
  '07_待发布':      'border-l-lime-500',
  '08_已发布':      'border-l-emerald-500',
  '09_数据待复盘':  'border-l-teal-500',
  '10_已完成':      'border-l-surface-600',
  '99_暂停/返工':   'border-l-red-500',
};

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const deadline = task.mDeadline || task.sDeadline || task.cDeadline;

  return (
    <div
      onClick={() => onClick(task)}
      className={`card card-hover border-l-2 ${LEFT_BORDER[task.status]} ${task.isOverdue ? 'border-t border-t-red-500/30' : ''} p-3 select-none`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-surface-400">{task.id}</span>
          <PriorityBadge priority={task.priority} />
          {task.isOverdue && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400 font-medium overdue-pulse">
              <AlertTriangle size={10} />
              逾期
            </span>
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Title */}
      <p className={`font-medium text-surface-100 leading-snug mb-2 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`}>
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-surface-400">
          <Globe size={9} />
          <span className="font-mono">{WEBSITE_SHORT[task.website] || task.website}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-surface-400">
          <Tag size={9} />
          {task.contentType}
        </span>
        {deadline && !compact && (
          <span className={`flex items-center gap-1 text-[10px] font-medium ${task.isOverdue ? 'text-red-400' : 'text-surface-400'}`}>
            <Clock size={9} />
            {deadline}
          </span>
        )}
      </div>

      {/* Return notes */}
      {task.returnNotes && !compact && (
        <div className="mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-300 line-clamp-1">
          返工意见：{task.returnNotes}
        </div>
      )}

      {/* Block reason */}
      {task.blockReason && !compact && (
        <div className="mt-2 px-2 py-1 bg-surface-800 border border-surface-700 rounded text-[10px] text-surface-400 line-clamp-1">
          阻塞：{task.blockReason}
        </div>
      )}

      {/* Vera review flag */}
      {task.needsVeraReview && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-gold-400 border border-gold-500/30 rounded px-1.5 py-0.5">
          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
          需Vera审核
        </div>
      )}
    </div>
  );
}
