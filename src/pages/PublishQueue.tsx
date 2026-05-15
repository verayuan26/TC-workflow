import { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { TaskModal } from '../components/TaskModal';
import type { Task } from '../types';
import { RISK_LEVEL_STYLES, RISK_LEVEL_DOT } from '../types';

type QueueTab = 'auto' | 'vera' | 'intercepted';

const TAB_CONFIG: { key: QueueTab; label: string; sublabel: string; icon: React.ReactNode; activeClass: string }[] = [
  {
    key: 'auto',
    label: '自动放行',
    sublabel: 'Auto-Approved',
    icon: <CheckCircle2 size={14} />,
    activeClass: 'border-emerald-600/50 bg-emerald-950/30 text-emerald-300',
  },
  {
    key: 'vera',
    label: 'Vera待审核',
    sublabel: 'Pending Review',
    icon: <AlertTriangle size={14} />,
    activeClass: 'border-gold-600/50 bg-gold-900/20 text-gold-300',
  },
  {
    key: 'intercepted',
    label: '系统拦截',
    sublabel: 'Intercepted',
    icon: <XCircle size={14} />,
    activeClass: 'border-red-700/50 bg-red-950/30 text-[#e88989]',
  },
];

function InterceptCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card card-hover p-4 cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-surface-100 line-clamp-2 leading-snug">{task.title}</p>
          <p className="text-[10px] text-surface-500 mt-0.5">{task.website} · {task.contentType}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      {task.riskLevel && (
        <div className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-medium px-2 py-0.5 mb-2 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[task.riskLevel]}`} />
          {task.riskLevel}风险 · 评分 {task.aiRiskScore}
        </div>
      )}
      {task.interceptReasons && task.interceptReasons.length > 0 && (
        <div className="mt-2">
          <button
            className="flex items-center gap-1 text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            拦截原因 ({task.interceptReasons.length})
          </button>
          {expanded && (
            <ul className="mt-1.5 space-y-1">
              {task.interceptReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <XCircle size={10} className="text-[#e88989] flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] text-surface-400">{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function VeraCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <div className="card card-hover p-4 cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-surface-100 line-clamp-2 leading-snug">{task.title}</p>
          <p className="text-[10px] text-surface-500 mt-0.5">{task.website} · {task.contentType}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
          task.priority === 'A' ? 'bg-gold-400/10 text-gold-400 border-gold-500/30' :
          task.priority === 'B' ? 'bg-blue-400/10 text-blue-400 border-blue-500/30' :
          'bg-surface-700 text-surface-400 border-surface-600'
        }`}>{task.priority}级</span>
      </div>
      {task.riskLevel && (
        <div className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-medium px-2 py-0.5 mb-2 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[task.riskLevel]}`} />
          {task.riskLevel}风险 · 评分 {task.aiRiskScore}
        </div>
      )}
      {task.riskLabels && task.riskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {task.riskLabels.map((label) => (
            <span key={label} className="text-[9px] bg-surface-700/60 text-surface-400 px-1.5 py-0.5 rounded">
              {label}
            </span>
          ))}
        </div>
      )}
      {task.isBudgetTask && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          预算确认 · {task.budgetChangeType}
          {task.proposedBudget != null && (
            <span className="text-surface-400 ml-1">¥{task.proposedBudget.toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  );
}

function AutoCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <div className="card card-hover p-4 cursor-pointer" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-surface-100 line-clamp-2 leading-snug">{task.title}</p>
          <p className="text-[10px] text-surface-500 mt-0.5">{task.website} · {task.contentType}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="flex items-center gap-2">
        {task.riskLevel && (
          <div className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-medium px-2 py-0.5 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${RISK_LEVEL_DOT[task.riskLevel]}`} />
            评分 {task.aiRiskScore}
          </div>
        )}
        {task.autoApprovalTime && (
          <div className="flex items-center gap-1 text-[10px] text-surface-500">
            <Clock size={10} />
            {task.autoApprovalTime}
          </div>
        )}
      </div>
      {task.approvalRulesHit && task.approvalRulesHit.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.approvalRulesHit.map((rule) => (
            <span key={rule} className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded">
              {rule}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PublishQueueProps { tasks: Task[] }

export function PublishQueue({ tasks: allTasks }: PublishQueueProps) {
  const [activeTab, setActiveTab] = useState<QueueTab>('auto');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const autoTasks = allTasks.filter((t) => t.autoApproved || t.status === '12_自动放行');
  const veraTasks = allTasks.filter((t) =>
    t.status === '06_Vera待审核' && !t.isIntercepted
  );
  const interceptedTasks = allTasks.filter((t) => t.isIntercepted || t.status === '11_已拦截');

  const counts: Record<QueueTab, number> = {
    auto: autoTasks.length,
    vera: veraTasks.length,
    intercepted: interceptedTasks.length,
  };

  const activeConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-surface-100">发布队列</h2>
        <p className="text-xs text-surface-400 mt-1">AI系统分流结果 · 实时状态</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 border-emerald-700/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-[10px] text-surface-400">自动放行</span>
          </div>
          <p className="text-xl font-bold text-emerald-300">{autoTasks.length}</p>
        </div>
        <div className="card p-3 border-gold-700/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-gold-400" />
            <span className="text-[10px] text-surface-400">Vera待审核</span>
          </div>
          <p className="text-xl font-bold text-gold-300">{veraTasks.length}</p>
        </div>
        <div className="card p-3 border-red-800/30">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={14} className="text-[#e88989]" />
            <span className="text-[10px] text-surface-400">系统拦截</span>
          </div>
          <p className="text-xl font-bold text-[#e88989]">{interceptedTasks.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
              activeTab === tab.key
                ? tab.activeClass
                : 'border-surface-700 bg-surface-800 text-surface-400 hover:text-surface-200 hover:bg-surface-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.key ? 'bg-surface-800/60' : 'bg-surface-700 text-surface-400'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Active tab sublabel */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs ${activeConfig.activeClass} border rounded-full px-3 py-1`}>
          {activeConfig.icon}
          {activeConfig.sublabel}
        </span>
        <span className="text-[10px] text-surface-500">共 {counts[activeTab]} 项</span>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-surface-500">
          <ExternalLink size={10} />
          点击任务卡片查看详情
        </div>
      </div>

      {/* Task grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeTab === 'auto' && autoTasks.map((task) => (
          <AutoCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />
        ))}
        {activeTab === 'vera' && veraTasks.map((task) => (
          <VeraCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />
        ))}
        {activeTab === 'intercepted' && interceptedTasks.map((task) => (
          <InterceptCard key={task.id} task={task} onOpen={() => setSelectedTask(task)} />
        ))}
        {counts[activeTab] === 0 && (
          <div className="col-span-3 py-16 text-center">
            <p className="text-surface-500 text-sm">暂无任务</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
