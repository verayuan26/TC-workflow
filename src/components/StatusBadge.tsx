import type { TaskStatus, Priority } from '../types';
import { STATUS_LABELS } from '../types';

// ── Status badge styles: low-saturation, office-friendly ─────────────────────
// Colors correspond to CSS vars: --color-success/info/warning/danger/review
const STATUS_STYLES: Record<TaskStatus, string> = {
  '01_AI待生成':     'bg-surface-800 text-surface-400 border-surface-700',
  '02_小S待审核':    'bg-[rgba(111,168,220,0.10)] text-[#6FA8DC] border-[rgba(111,168,220,0.25)]',
  '03_小C待确认URL': 'bg-[rgba(91,174,130,0.10)] text-[#5BAE82] border-[rgba(91,174,130,0.25)]',
  '04_小M待剪辑':    'bg-[rgba(208,168,92,0.10)] text-[#D0A85C] border-[rgba(208,168,92,0.25)]',
  '05_小S待终审':    'bg-[rgba(111,168,220,0.14)] text-[#8EC4F0] border-[rgba(111,168,220,0.30)]',
  '06_Vera待审核':   'bg-[rgba(184,154,94,0.12)] text-[#D6C08B] border-[rgba(184,154,94,0.26)]',
  '07_待发布':       'bg-[rgba(91,174,130,0.12)] text-[#7DC4A0] border-[rgba(91,174,130,0.28)]',
  '08_已发布':       'bg-[rgba(91,174,130,0.14)] text-[#5BAE82] border-[rgba(91,174,130,0.30)]',
  '09_数据待复盘':   'bg-[rgba(111,168,220,0.08)] text-[#87B8E0] border-[rgba(111,168,220,0.20)]',
  '10_已完成':       'bg-surface-900 text-surface-500 border-surface-700',
  '11_已拦截':       'bg-[rgba(201,107,107,0.12)] text-[#E1A0A0] border-[rgba(201,107,107,0.28)]',
  '12_自动放行':     'bg-[rgba(91,174,130,0.10)] text-[#5BAE82] border-[rgba(91,174,130,0.25)]',
  '99_暂停/返工':    'bg-[rgba(201,107,107,0.10)] text-[#D88888] border-[rgba(201,107,107,0.24)]',
};

const DOT_STYLES: Record<TaskStatus, string> = {
  '01_AI待生成':     'bg-surface-500',
  '02_小S待审核':    'bg-[#6FA8DC]',
  '03_小C待确认URL': 'bg-[#5BAE82]',
  '04_小M待剪辑':    'bg-[#D0A85C]',
  '05_小S待终审':    'bg-[#8EC4F0]',
  '06_Vera待审核':   'bg-[#B89A5E]',
  '07_待发布':       'bg-[#7DC4A0]',
  '08_已发布':       'bg-[#5BAE82]',
  '09_数据待复盘':   'bg-[#6FA8DC]',
  '10_已完成':       'bg-surface-600',
  '11_已拦截':       'bg-[#C96B6B]',
  '12_自动放行':     'bg-[#5BAE82]',
  '99_暂停/返工':    'bg-[#C96B6B]',
};

// ── Priority badge: low-saturation small capsules ─────────────────────────────
const PRIORITY_STYLES: Record<Priority, string> = {
  A: 'bg-[rgba(208,168,92,0.14)] text-[#D0A85C] border-[rgba(208,168,92,0.28)]',
  B: 'bg-[rgba(111,168,220,0.12)] text-[#6FA8DC] border-[rgba(111,168,220,0.25)]',
  C: 'bg-surface-800 text-surface-500 border-surface-700',
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
