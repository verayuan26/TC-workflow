import type { TaskStatus, Priority } from '../types';
import { STATUS_LABELS } from '../types';

const STATUS_STYLES: Record<TaskStatus, string> = {
  '01_AI待生成':    'bg-surface-700 text-surface-300 border-surface-600',
  '02_小S待审核':   'bg-blue-950 text-blue-300 border-blue-800',
  '03_小C待确认URL': 'bg-cyan-950 text-cyan-300 border-cyan-800',
  '04_小M待剪辑':   'bg-amber-950 text-amber-300 border-amber-800',
  '05_小S待终审':   'bg-blue-900 text-blue-200 border-blue-700',
  '06_Vera待审核':  'bg-gold-900/30 text-gold-300 border-gold-700/50',
  '07_待发布':      'bg-lime-950 text-lime-300 border-lime-800',
  '08_已发布':      'bg-emerald-950 text-emerald-300 border-emerald-800',
  '09_数据待复盘':  'bg-teal-950 text-teal-300 border-teal-800',
  '10_已完成':      'bg-surface-800 text-surface-400 border-surface-700',
  '11_已拦截':      'bg-red-950/80 text-[#e88989] border-red-800/60',
  '12_自动放行':    'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
  '99_暂停/返工':   'bg-red-950 text-red-300 border-red-800',
};

const DOT_STYLES: Record<TaskStatus, string> = {
  '01_AI待生成':    'bg-surface-400',
  '02_小S待审核':   'bg-blue-400',
  '03_小C待确认URL': 'bg-cyan-400',
  '04_小M待剪辑':   'bg-amber-400',
  '05_小S待终审':   'bg-blue-300',
  '06_Vera待审核':  'bg-gold-400',
  '07_待发布':      'bg-lime-400',
  '08_已发布':      'bg-emerald-400',
  '09_数据待复盘':  'bg-teal-400',
  '10_已完成':      'bg-surface-500',
  '11_已拦截':      'bg-red-400',
  '12_自动放行':    'bg-emerald-400',
  '99_暂停/返工':   'bg-red-400',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  A: 'bg-gold-400/10 text-gold-400 border-gold-500/30',
  B: 'bg-blue-400/10 text-blue-400 border-blue-500/30',
  C: 'bg-surface-700 text-surface-400 border-surface-600',
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const base = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${base} ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_STYLES[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center border rounded text-[10px] font-bold px-1.5 py-0.5 ${PRIORITY_STYLES[priority]}`}>
      {priority}级
    </span>
  );
}
