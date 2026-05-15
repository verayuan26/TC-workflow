import { Filter, X } from 'lucide-react';
import type { FilterState } from '../types';
import { WEBSITES } from '../types';

const STATUSES = [
  '01_AI待生成', '02_小S待审核', '03_小C待确认URL', '04_小M待剪辑',
  '05_小S待终审', '06_Vera待审核', '07_待发布', '08_已发布',
  '09_数据待复盘', '10_已完成', '99_暂停/返工',
];

const STATUS_SHORT: Record<string, string> = {
  '01_AI待生成': 'AI待生成', '02_小S待审核': '小S待审核', '03_小C待确认URL': '小C待确认',
  '04_小M待剪辑': '小M待剪辑', '05_小S待终审': '小S待终审', '06_Vera待审核': 'Vera待审核',
  '07_待发布': '待发布', '08_已发布': '已发布', '09_数据待复盘': '数据复盘',
  '10_已完成': '已完成', '99_暂停/返工': '暂停/返工',
};

const CONTENT_TYPES = ['短视频', '长视频', 'SEO文章', 'Landing Page', 'URL检查', '素材整理', '发布文案', '数据复盘'];
const ROLES = ['小M', '小S', '小C', 'Vera', '龙虾'];

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  counts?: { overdue: number; vera: number };
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px] uppercase tracking-widest text-surface-500 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-800 border border-surface-700 text-surface-200 text-xs rounded px-2 py-1.5 min-w-[110px] focus:outline-none focus:border-gold-500/50 cursor-pointer"
      >
        <option value="all">全部</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FilterBar({ filters, onChange, counts }: FilterBarProps) {
  const hasActive =
    filters.assignedTo !== 'all' ||
    filters.website !== 'all' ||
    filters.contentType !== 'all' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.isOverdue !== null ||
    filters.needsVeraReview !== null;

  const reset = () =>
    onChange({ assignedTo: 'all', website: 'all', contentType: 'all', status: 'all', priority: 'all', isOverdue: null, needsVeraReview: null });

  return (
    <div className="bg-surface-900 border-b border-surface-700 px-4 py-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-surface-400 mt-5 flex-shrink-0">
          <Filter size={12} />
          <span>筛选</span>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <Select
            label="负责人"
            value={filters.assignedTo}
            options={ROLES.map((r) => ({ value: r, label: r }))}
            onChange={(v) => onChange({ ...filters, assignedTo: v })}
          />
          <Select
            label="网站"
            value={filters.website}
            options={WEBSITES.map((w) => ({ value: w, label: w.replace('.com', '').replace('.ru', '') }))}
            onChange={(v) => onChange({ ...filters, website: v })}
          />
          <Select
            label="内容类型"
            value={filters.contentType}
            options={CONTENT_TYPES.map((c) => ({ value: c, label: c }))}
            onChange={(v) => onChange({ ...filters, contentType: v })}
          />
          <Select
            label="状态"
            value={filters.status}
            options={STATUSES.map((s) => ({ value: s, label: STATUS_SHORT[s] }))}
            onChange={(v) => onChange({ ...filters, status: v })}
          />
          <Select
            label="等级"
            value={filters.priority}
            options={[{ value: 'A', label: 'A级' }, { value: 'B', label: 'B级' }, { value: 'C', label: 'C级' }]}
            onChange={(v) => onChange({ ...filters, priority: v })}
          />

          <button
            onClick={() => onChange({ ...filters, isOverdue: filters.isOverdue ? null : true })}
            className={`mt-5 text-xs px-3 py-1.5 rounded border transition-colors ${filters.isOverdue ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'border-surface-600 text-surface-400 hover:border-surface-500'}`}
          >
            仅逾期{counts?.overdue ? ` (${counts.overdue})` : ''}
          </button>

          <button
            onClick={() => onChange({ ...filters, needsVeraReview: filters.needsVeraReview ? null : true })}
            className={`mt-5 text-xs px-3 py-1.5 rounded border transition-colors ${filters.needsVeraReview ? 'bg-gold-400/10 border-gold-500/40 text-gold-300' : 'border-surface-600 text-surface-400 hover:border-surface-500'}`}
          >
            需Vera审核{counts?.vera ? ` (${counts.vera})` : ''}
          </button>

          {hasActive && (
            <button
              onClick={reset}
              className="mt-5 flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
            >
              <X size={12} />
              重置
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
