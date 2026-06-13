import { useState } from 'react';
import { X, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import type { Task } from '../types';
import { getTaskStatusLabel } from '../config/roleDisplay';
import { useRoleDisplay } from '../context/RoleDisplayContext';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { TaskPipelineTimeline } from './TaskPipelineTimeline';
import { getActionsForTask, type TaskActionDef } from '../config/roleFlows';
import type { LoginRole } from '../types/session';
import type { TaskActionId } from '../config/roleFlows';
import { performAction } from '../services/taskApi';

interface RoleTaskDetailProps {
  task: Task;
  role: LoginRole;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

function roleFields(task: Task, role: LoginRole): { label: string; value?: string }[] {
  const common = [
    { label: '任务目标', value: task.nextAction },
    { label: '验收标准', value: task.completionCriteria },
  ];

  if (role === 'STRATEGY') {
    return [
      { label: '关键词', value: task.keywords },
      { label: '脚本链接', value: task.scriptLink },
      { label: 'AI 输出', value: task.aiOutputLink },
      { label: 'CTA', value: task.cta },
      ...common,
    ];
  }
  if (role === 'MEDIA') {
    return [
      { label: '素材链接', value: task.materialLink },
      { label: '脚本链接', value: task.scriptLink },
      { label: '剪辑等级', value: task.editLevel },
      { label: '字幕语言', value: task.subtitleLanguage },
      { label: '返工说明', value: task.returnNotes },
      ...common,
    ];
  }
  if (role === 'CONVERSION') {
    return [
      { label: '目标 URL', value: task.targetUrl },
      { label: 'URL 状态', value: task.urlStatus },
      { label: '表单状态', value: task.formStatus },
      { label: 'UTM 链接', value: task.utmLink },
      { label: 'CRM 标签', value: task.crmTags },
      ...common,
    ];
  }
  if (role === 'ADS') {
    return [
      { label: '广告平台', value: task.adPlatform },
      { label: '投放地区', value: task.adRegion },
      { label: '当前预算', value: task.currentBudget != null ? `$${task.currentBudget}` : undefined },
      { label: '申请预算', value: task.proposedBudget != null ? `$${task.proposedBudget}` : undefined },
      { label: '预算说明', value: task.budgetNote },
      ...common,
    ];
  }
  if (role === 'VERA') {
    return [
      { label: '风险等级', value: task.riskLevel ? `${task.riskLevel} · ${task.aiRiskScore ?? '-'}分` : undefined },
      { label: '风险标签', value: task.riskLabels?.join('、') },
      { label: 'AI 决策', value: task.aiDecisionReason },
      { label: '审核链接', value: task.reviewLink ?? task.finalVideoLink ?? task.scriptLink },
      ...common,
    ];
  }
  return [
    { label: '阻塞原因', value: task.blockReason },
    { label: '当前负责人', value: task.assignedTo },
    { label: '下一步', value: task.nextAction },
    ...common,
  ];
}

export function RoleTaskDetail({ task, role, onClose, onUpdated }: RoleTaskDetailProps) {
  useRoleDisplay();
  const actions = getActionsForTask(task, role);
  const fields = roleFields(task, role).filter((f) => f.value);
  const [fieldValue, setFieldValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (action: TaskActionDef) => {
    setError(null);
    setLoading(true);
    try {
      const payload: { fieldValue?: string; note?: string } = {};
      if (action.requiresField) {
        const val = fieldValue.trim();
        if (!val) {
          setError(`请填写${action.fieldLabel ?? '必填项'}`);
          setLoading(false);
          return;
        }
        payload.fieldValue = val;
      }
      if (action.id === 'reject_to_rework' || action.id === 'vera_reject' || action.id === 'vera_intercept') {
        payload.note = note.trim() || '需修改';
      }
      const updated = await performAction(task.id, action.id as TaskActionId, role, payload);
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = actions.find((a) => a.variant === 'primary');
  const needsField = actions.some((a) => a.requiresField);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-surface-900 border border-surface-700 rounded-t-xl sm:rounded-xl shadow-xl overflow-hidden">
        <div className="flex-shrink-0 flex items-start justify-between gap-3 p-4 border-b border-surface-800 bg-surface-900">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono text-surface-500">{task.id}</span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <h2 className="text-sm font-semibold text-surface-100 leading-snug">{task.title}</h2>
            <p className="text-xs text-surface-500 mt-0.5">{task.website} · {task.contentType}</p>
          </div>
          <button type="button" onClick={onClose} className="text-surface-500 hover:text-surface-300 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col sm:flex-row">
          <div className="flex-1 min-w-0 overflow-y-auto p-4 space-y-4">
          <div className="p-3 rounded-lg bg-surface-800/50 border border-surface-700">
            <p className="text-[10px] uppercase tracking-widest text-surface-500 mb-1">当前环节</p>
            <p className="text-sm text-surface-200">{getTaskStatusLabel(task.status)}</p>
            {task.nextAction && (
              <p className="text-xs text-surface-400 mt-1">{task.nextAction}</p>
            )}
          </div>

          {task.isOverdue && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              <AlertTriangle size={14} /> 此任务已逾期，请优先处理
            </div>
          )}

          {fields.length > 0 && (
            <dl className="space-y-2">
              {fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-[10px] text-surface-500 uppercase tracking-wide">{f.label}</dt>
                  <dd className="text-xs text-surface-200 break-all mt-0.5">
                    {f.value?.startsWith('http') ? (
                      <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-gold-400 inline-flex items-center gap-1">
                        打开 <ExternalLink size={10} />
                      </a>
                    ) : (
                      f.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {task.opLog && task.opLog.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-surface-500 mb-2">操作记录</p>
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {[...task.opLog].reverse().slice(0, 5).map((entry, i) => (
                  <li key={i} className="text-[10px] text-surface-500 flex gap-2">
                    <Clock size={10} className="flex-shrink-0 mt-0.5" />
                    <span>
                      <span className="text-surface-600">{entry.time}</span> · {entry.action}
                      <span className="text-surface-600"> ({entry.operator})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {needsField && primaryAction?.requiresField && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-surface-500 block mb-1">
                {primaryAction.fieldLabel} *
              </label>
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder={`输入${primaryAction.fieldLabel}`}
                className="w-full bg-surface-800 border border-surface-600 rounded px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          )}

          {(actions.some((a) => a.id.includes('reject') || a.id.includes('intercept'))) && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-surface-500 block mb-1">
                备注（退回/拦截时必填）
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full bg-surface-800 border border-surface-600 rounded px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50 resize-none"
                placeholder="说明原因..."
              />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {actions.length === 0 ? (
            <p className="text-xs text-surface-500 text-center py-2">当前环节无需您操作，或等待其他角色处理</p>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={loading}
                  onClick={() => runAction(action)}
                  className={
                    action.variant === 'primary'
                      ? 'btn-gold w-full py-2.5'
                      : action.variant === 'danger'
                        ? 'btn-danger w-full py-2.5'
                        : 'btn-ghost w-full py-2.5'
                  }
                >
                  {loading ? '处理中...' : action.label}
                </button>
              ))}
            </div>
          )}
          </div>

          <aside className="flex-shrink-0 sm:w-52 md:w-56 border-t sm:border-t-0 sm:border-l border-surface-800 bg-surface-950/40 overflow-y-auto max-h-[36vh] sm:max-h-none">
            <TaskPipelineTimeline task={task} variant="sidebar" />
          </aside>
        </div>
      </div>
    </div>
  );
}
