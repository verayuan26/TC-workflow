import { useState, useMemo, useEffect, useCallback } from 'react';
import { CheckCircle2, PlusCircle, Inbox } from 'lucide-react';
import type { Task } from '../../types';
import type { LoginRole } from '../../types/session';
import { RoleLayout } from '../../components/RoleLayout';
import { RoleTaskDetail } from '../../components/RoleTaskDetail';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { useSession } from '../../context/SessionContext';
import { useRoleDisplay } from '../../context/RoleDisplayContext';
import { getRoleFlow, taskVisibleForRole, getActionsForTask } from '../../config/roleFlows';
import type { FlowStep } from '../../config/roleFlows';
import { RoleGuide } from '../../components/RoleGuide';
import { RoleStatsPanel } from '../../components/stats/RoleStatsPanel';
import { PmCreateTaskModal } from '../../components/pm/PmCreateTaskModal';
import { getTasks } from '../../services/taskApi';

// ── Column accent colors ────────────────────────────────────────────────────

const COL_ACCENT: Record<string, string> = {
  draft:    '#3b82f6',
  inbox:    '#3b82f6',
  queue:    '#3b82f6',
  url:      '#3b82f6',
  prep:     '#3b82f6',
  overview: '#3b82f6',

  final:    '#f59e0b',
  budget:   '#f59e0b',
  content:  '#f59e0b',
  utm:      '#a78bfa',

  blocked:  '#ef4444',
  rework:   '#ef4444',

  progress: '#a78bfa',
  live:     '#a78bfa',
  publish:  '#a78bfa',

  review:   '#6366f1',

  done:     '#10b981',
};

// ── CSS animations (injected via <style> tag) ───────────────────────────────

const KANBAN_CSS = `
@keyframes kanbanSlideIn {
  0%   { opacity: 0; transform: translateY(-14px) scale(0.97); }
  60%  { opacity: 1; transform: translateY(2px)   scale(1.01); }
  100% { opacity: 1; transform: translateY(0)     scale(1);    }
}
@keyframes kanbanGlow {
  0%   { box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.55); }
  100% { box-shadow: 0 0 0 0px rgba(234, 179, 8, 0);    }
}
.kanban-entering {
  animation:
    kanbanSlideIn 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both,
    kanbanGlow    0.9s ease-out both;
}
`;

// ── KanbanCard ──────────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  role: LoginRole;
  isEntering: boolean;
  onClick: () => void;
}

function KanbanCard({ task, role, isEntering, onClick }: KanbanCardProps) {
  const hasAction = getActionsForTask(task, role).length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left p-3 mb-2 rounded-lg card card-hover border-l-2',
        hasAction ? 'border-l-gold-400' : 'border-l-surface-700',
        isEntering ? 'kanban-entering' : '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {task.isOverdue && (
          <span className="text-[9px] text-red-400 font-medium">逾期</span>
        )}
        {task.riskLevel === '高' && (
          <span className="text-[9px] text-amber-400">高风险</span>
        )}
      </div>

      <p className="text-[13px] font-medium text-surface-100 leading-snug mb-1"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {task.title}
      </p>

      <p className="text-[10px] text-surface-500">
        {task.website.split('.')[0]} · {task.contentType}
      </p>

      {task.nextAction && (
        <p className="text-[9px] text-surface-600 mt-0.5 truncate">{task.nextAction}</p>
      )}

      {hasAction && (
        <p className="text-[9px] text-gold-400/80 mt-1.5 font-semibold tracking-wide">
          点击处理 →
        </p>
      )}
    </button>
  );
}

// ── KanbanColumn ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  step: FlowStep;
  tasks: Task[];
  role: LoginRole;
  enteringId: string | null;
  onSelect: (t: Task) => void;
}

function KanbanColumn({ step, tasks, role, enteringId, onSelect }: KanbanColumnProps) {
  const accent = COL_ACCENT[step.id] ?? '#6b7280';
  const colTasks = tasks.filter((t) => step.statuses.includes(t.status));
  const actionableCount = colTasks.filter((t) => getActionsForTask(t, role).length > 0).length;

  return (
    <div className="flex flex-col rounded-xl border border-surface-700/50 bg-surface-900/70 flex-1 min-w-[210px]">
      {/* Column header */}
      <div className="px-3.5 py-3 border-b border-surface-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: accent }}
            />
            <span className="text-[13px] font-semibold text-surface-100 truncate">
              {step.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actionableCount > 0 && (
              <span className="text-[9px] bg-gold-400/10 text-gold-300 border border-gold-500/20 rounded-full px-1.5 py-0.5 font-medium whitespace-nowrap">
                {actionableCount} 待操作
              </span>
            )}
            <span className="text-[11px] text-surface-500 bg-surface-700/40 rounded-full px-2 py-0.5 min-w-[22px] text-center">
              {colTasks.length}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-surface-500 mt-0.5 pl-4 truncate">{step.hint}</p>
      </div>

      {/* Scrollable task list */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ maxHeight: 'calc(100vh - 400px)', minHeight: 180 }}
      >
        {colTasks.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 size={18} className="text-surface-700 mb-2" />
            <p className="text-[10px] text-surface-600">暂无任务</p>
          </div>
        ) : (
          colTasks.map((t) => (
            <KanbanCard
              key={t.id}
              task={t}
              role={role}
              isEntering={t.id === enteringId}
              onClick={() => onSelect(t)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── RoleFlowPage ────────────────────────────────────────────────────────────

export function RoleFlowPage() {
  const { role } = useSession();
  useRoleDisplay();
  if (!role || role === 'ADMIN') return null;

  const flow = getRoleFlow(role);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);

  const reload = useCallback(() => {
    getTasks().then(setTasks);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const myTasks = useMemo(
    () => tasks.filter((t) => taskVisibleForRole(t, role)),
    [tasks, role],
  );

  const totalActionable = useMemo(
    () => myTasks.filter((t) => getActionsForTask(t, role).length > 0).length,
    [myTasks, role],
  );

  const triggerEnter = (id: string) => {
    setEnteringId(id);
    setTimeout(() => setEnteringId(null), 950);
  };

  const handleUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    triggerEnter(updated.id);
    reload();
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    triggerEnter(task.id);
    setSelected(task);
    reload();
  };

  return (
    <RoleLayout>
      <style>{KANBAN_CSS}</style>

      <RoleStatsPanel
        role={role}
        tasks={myTasks}
        allTasks={role === 'VERA' || role === 'PM' ? tasks : undefined}
      />
      {role !== 'VERA' && <RoleGuide role={role} />}

      {/* Action bar */}
      <div className="px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap">
        {totalActionable > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gold-200 bg-gold-400/5 border border-gold-500/20 rounded-lg px-3 py-1.5">
            <Inbox size={12} className="text-gold-400 flex-shrink-0" />
            <span>
              有 <strong>{totalActionable}</strong> 条任务等待操作，点击卡片处理
            </span>
          </div>
        )}
        <div className="flex-1" />
        {role === 'PM' && (
          <>
            <p className="text-[11px] text-surface-500 hidden md:block">
              人工录入后可在「AI 草稿」列派发
            </p>
            <button
              type="button"
              onClick={() => setShowCreateTask(true)}
              className="btn-gold flex items-center gap-1.5 flex-shrink-0"
            >
              <PlusCircle size={14} />
              发布任务
            </button>
          </>
        )}
      </div>

      {/* ── Kanban board ── */}
      <div className="px-4 md:px-6 pb-8 overflow-x-auto">
        <div
          className="flex gap-3 pb-2"
          style={{ minWidth: `${flow.steps.length * 215}px` }}
        >
          {flow.steps.map((step) => (
            <KanbanColumn
              key={step.id}
              step={step}
              tasks={myTasks}
              role={role}
              enteringId={enteringId}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {selected && (
        <RoleTaskDetail
          task={selected}
          role={role}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {showCreateTask && (
        <PmCreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreated={handleTaskCreated}
        />
      )}
    </RoleLayout>
  );
}
