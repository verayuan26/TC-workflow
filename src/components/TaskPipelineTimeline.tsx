import { Check, Circle, CircleDot, Minus, AlertOctagon } from 'lucide-react';
import type { Task } from '../types';
import { roleLabel } from '../config/roleDisplay';
import { useRoleDisplay } from '../context/RoleDisplayContext';
import { getPipelineNodeViews, getPipelineSummary, type PipelineNodeState } from '../config/taskPipeline';

const OWNER_STYLE: Record<string, string> = {
  STRATEGY: 'bg-blue-950/60 text-blue-300 border-blue-800/50',
  MEDIA: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  CONVERSION: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  ADS: 'bg-orange-950/60 text-orange-300 border-orange-800/50',
  VERA: 'bg-gold-900/40 text-gold-300 border-gold-700/40',
  AI: 'bg-surface-700/60 text-surface-300 border-surface-600',
};

function NodeIcon({ state }: { state: PipelineNodeState }) {
  if (state === 'completed') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
        <Check size={11} className="text-emerald-400" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 border-2 border-gold-400 animate-pulse">
        <CircleDot size={10} className="text-gold-400" />
      </span>
    );
  }
  if (state === 'blocked') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/15 border border-red-500/40">
        <AlertOctagon size={10} className="text-red-400" />
      </span>
    );
  }
  if (state === 'skipped') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-surface-600">
        <Minus size={10} className="text-surface-600" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-surface-600 bg-surface-800">
      <Circle size={8} className="text-surface-600" fill="currentColor" />
    </span>
  );
}

function lineColor(state: PipelineNodeState, nextState?: PipelineNodeState): string {
  if (state === 'completed') return 'bg-emerald-500/40';
  if (state === 'current' || state === 'blocked') return 'bg-gradient-to-b from-gold-500/50 to-surface-700';
  if (nextState === 'upcoming') return 'bg-surface-700';
  return 'bg-surface-700';
}

interface TaskPipelineTimelineProps {
  task: Task;
  /** 侧栏紧凑模式，用于详情弹窗右侧 */
  variant?: 'default' | 'sidebar';
}

export function TaskPipelineTimeline({ task, variant = 'default' }: TaskPipelineTimelineProps) {
  useRoleDisplay();
  const nodes = getPipelineNodeViews(task);
  const summary = getPipelineSummary(task);
  const pipelineType =
    task.isAdTask || task.contentType === '广告素材' || task.contentType === '广告预算'
      ? '广告投放'
      : '内容生产';
  const isSidebar = variant === 'sidebar';

  return (
    <div className={isSidebar ? 'p-3 h-full' : 'rounded-lg border border-surface-700 bg-surface-800/30 p-3'}>
      <div className={`mb-3 ${isSidebar ? 'space-y-1' : 'flex items-start justify-between gap-2'}`}>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-surface-500">流程进度</p>
          <p className={`text-surface-500 mt-0.5 ${isSidebar ? 'text-[9px]' : 'text-xs text-surface-300'}`}>{pipelineType}</p>
        </div>
        <span className={`text-[10px] text-gold-400/90 font-medium leading-snug ${isSidebar ? 'block' : 'text-right max-w-[140px]'}`}>
          {summary}
        </span>
      </div>

      <ol className="relative space-y-0">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const ownerKey = node.owner === 'AI' ? 'AI' : node.owner;
          const ownerClass = OWNER_STYLE[ownerKey] ?? OWNER_STYLE.AI;

          const labelClass =
            node.state === 'current'
              ? 'text-gold-300 font-semibold'
              : node.state === 'completed'
                ? 'text-surface-300'
                : node.state === 'blocked'
                  ? 'text-red-300 font-semibold'
                  : 'text-surface-500';

          return (
            <li key={node.id} className={`relative flex gap-2 ${isSidebar ? 'pb-3' : 'pb-4'} last:pb-0`}>
              {!isLast && (
                <span
                  className={`absolute left-[9px] top-5 bottom-0 w-0.5 ${lineColor(node.state, nodes[index + 1]?.state)}`}
                  aria-hidden
                />
              )}

              <div className="relative z-10 flex-shrink-0 pt-0.5">
                <NodeIcon state={node.state} />
              </div>

              <div className="flex-1 min-w-0 pt-0">
                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                  <span className={`${isSidebar ? 'text-[11px]' : 'text-xs'} leading-snug ${labelClass}`}>
                    {node.label}
                  </span>
                  {node.state === 'current' && (
                    <span className="text-[8px] px-1 py-0 rounded bg-gold-400/15 text-gold-400 border border-gold-500/25 font-medium">
                      当前
                    </span>
                  )}
                  {node.state === 'blocked' && (
                    <span className="text-[8px] px-1 py-0 rounded bg-red-500/10 text-red-400 border border-red-500/25 font-medium">
                      阻塞
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`text-[8px] px-1 py-0 rounded border ${ownerClass}`}>
                    {roleLabel(node.owner === 'AI' ? 'AI' : node.owner, false)}
                  </span>
                  {node.completedAt && !isSidebar && (
                    <span className="text-[9px] text-surface-600">{node.completedAt}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
