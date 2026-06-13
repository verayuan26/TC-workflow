import type { TaskStatus, Priority } from '../types';
import { getTaskStatusLabel } from '../config/roleDisplay';
import { useRoleDisplay } from '../context/RoleDisplayContext';

const STATUS_STYLES: Record<TaskStatus, string> = {
  '01_AI_PENDING':    'bg-surface-700 text-surface-300 border-surface-600',
  '02_STRATEGY_REVIEW':   'bg-blue-950 text-blue-300 border-blue-800',
  '03_CONVERSION_URL': 'bg-cyan-950 text-cyan-300 border-cyan-800',
  '04_MEDIA_EDIT':   'bg-amber-950 text-amber-300 border-amber-800',
  '05_STRATEGY_FINAL':   'bg-blue-900 text-blue-200 border-blue-700',
  '06_VERA_REVIEW':  'bg-gold-900/30 text-gold-300 border-gold-700/50',
  '07_PUBLISH_READY':      'bg-lime-950 text-lime-300 border-lime-800',
  '08_PUBLISHED':      'bg-emerald-950 text-emerald-300 border-emerald-800',
  '09_DATA_REVIEW':  'bg-teal-950 text-teal-300 border-teal-800',
  '10_COMPLETED':      'bg-surface-800 text-surface-400 border-surface-700',
  '11_BLOCKED':      'bg-red-950/80 text-[#e88989] border-red-800/60',
  '12_AUTO_APPROVED':    'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
  '99_REWORK':   'bg-red-950 text-red-300 border-red-800',
};

const DOT_STYLES: Record<TaskStatus, string> = {
  '01_AI_PENDING':    'bg-surface-400',
  '02_STRATEGY_REVIEW':   'bg-blue-400',
  '03_CONVERSION_URL': 'bg-cyan-400',
  '04_MEDIA_EDIT':   'bg-amber-400',
  '05_STRATEGY_FINAL':   'bg-blue-300',
  '06_VERA_REVIEW':  'bg-gold-400',
  '07_PUBLISH_READY':      'bg-lime-400',
  '08_PUBLISHED':      'bg-emerald-400',
  '09_DATA_REVIEW':  'bg-teal-400',
  '10_COMPLETED':      'bg-surface-500',
  '11_BLOCKED':      'bg-red-400',
  '12_AUTO_APPROVED':    'bg-emerald-400',
  '99_REWORK':   'bg-red-400',
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
  useRoleDisplay();
  const base = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-medium ${base} ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_STYLES[status]}`} />
      {getTaskStatusLabel(status)}
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
