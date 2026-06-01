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

// Left border accent — subtle, single-pixel, matches status hue
const LEFT_BORDER_COLOR: Record<string, string> = {
  '01_AI待生成':     '#5F5A52',
  '02_小S待审核':    '#6FA8DC',
  '03_小C待确认URL': '#5BAE82',
  '04_小M待剪辑':    '#D0A85C',
  '05_小S待终审':    '#8EC4F0',
  '06_Vera待审核':   '#B89A5E',
  '07_待发布':       '#7DC4A0',
  '08_已发布':       '#5BAE82',
  '09_数据待复盘':   '#6FA8DC',
  '10_已完成':       '#3A3730',
  '99_暂停/返工':    '#C96B6B',
  '11_已拦截':       '#C96B6B',
  '12_自动放行':     '#5BAE82',
};

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  const deadline = task.mDeadline || task.sDeadline || task.cDeadline;
  const leftColor = LEFT_BORDER_COLOR[task.status] || '#3A3730';

  return (
    <div
      onClick={() => onClick(task)}
      className="card card-hover p-3 select-none border-l-2"
      style={{ borderLeftColor: leftColor }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono" style={{ color: '#7D766C' }}>{task.id}</span>
          <PriorityBadge priority={task.priority} />
          {task.isOverdue && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium overdue-pulse" style={{ color: '#C96B6B' }}>
              <AlertTriangle size={10} />
              逾期
            </span>
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Title */}
      <p
        className={`font-medium leading-snug mb-2 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`}
        style={{ color: '#F4EFE4' }}
      >
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#7D766C' }}>
          <Globe size={9} />
          <span className="font-mono">{WEBSITE_SHORT[task.website] || task.website}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#7D766C' }}>
          <Tag size={9} />
          {task.contentType}
        </span>
        {deadline && !compact && (
          <span
            className="flex items-center gap-1 text-[10px] font-medium"
            style={{ color: task.isOverdue ? '#C96B6B' : '#7D766C' }}
          >
            <Clock size={9} />
            {deadline}
          </span>
        )}
      </div>

      {/* Return notes */}
      {task.returnNotes && !compact && (
        <div
          className="mt-2 px-2 py-1 rounded text-[10px] line-clamp-1"
          style={{
            backgroundColor: 'rgba(201, 107, 107, 0.08)',
            border: '1px solid rgba(201, 107, 107, 0.18)',
            color: '#D88888',
          }}
        >
          返工意见：{task.returnNotes}
        </div>
      )}

      {/* Block reason */}
      {task.blockReason && !compact && (
        <div
          className="mt-2 px-2 py-1 rounded text-[10px] line-clamp-1"
          style={{
            backgroundColor: '#28251F',
            border: '1px solid rgba(214, 192, 139, 0.10)',
            color: '#A8A094',
          }}
        >
          阻塞：{task.blockReason}
        </div>
      )}

      {/* Vera review flag */}
      {task.needsVeraReview && (
        <div
          className="mt-2 inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5"
          style={{
            color: '#D6C08B',
            border: '1px solid rgba(184, 154, 94, 0.26)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#B89A5E' }} />
          需Vera审核
        </div>
      )}
    </div>
  );
}
