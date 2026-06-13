import type { Task, TaskStatus, Role } from '../types';
import { isVideoContent, needsPageCheck } from './roleFlows';
import { roleFormalName } from './roleDisplay';

const R = roleFormalName;

export type PipelineNodeState = 'completed' | 'current' | 'upcoming' | 'skipped' | 'blocked';

export interface PipelineNode {
  id: string;
  label: string;
  owner: Role | 'AI';
  /** 任务处于这些状态时，视为停在该节点 */
  statuses: TaskStatus[];
}

export interface PipelineNodeView extends PipelineNode {
  state: PipelineNodeState;
  /** 从 opLog 匹配到的最近操作时间 */
  completedAt?: string;
}

const BLOCKED_STATUSES: TaskStatus[] = ['99_REWORK', '11_BLOCKED'];

/** 内容类任务主流程节点（按顺序） */
function buildContentPipeline(task: Task): PipelineNode[] {
  const nodes: PipelineNode[] = [
    { id: 'ai', label: 'AI 生成草稿', owner: 'AI', statuses: ['01_AI_PENDING'] },
    { id: 's_script', label: `${R('STRATEGY')} · 脚本审核`, owner: 'STRATEGY', statuses: ['02_STRATEGY_REVIEW'] },
  ];

  if (needsPageCheck(task)) {
    nodes.push({
      id: 'c_url',
      label: `${R('CONVERSION')} · 链接与页面确认`,
      owner: 'CONVERSION',
      statuses: ['03_CONVERSION_URL'],
    });
  }

  if (isVideoContent(task)) {
    nodes.push({
      id: 'm_edit',
      label: `${R('MEDIA')} · 视频剪辑`,
      owner: 'MEDIA',
      statuses: ['04_MEDIA_EDIT'],
    });
  }

  nodes.push({
    id: 's_final',
    label: `${R('STRATEGY')} · 成片终审`,
    owner: 'STRATEGY',
    statuses: ['05_STRATEGY_FINAL'],
  });

  if (task.needsVeraReview) {
    nodes.push({
      id: 'vera',
      label: `${R('VERA')} · 风险审核`,
      owner: 'VERA',
      statuses: ['06_VERA_REVIEW', '11_BLOCKED', '12_AUTO_APPROVED'],
    });
  }

  nodes.push(
    {
      id: 'publish_prep',
      label: '发布准备（UTM · 素材）',
      owner: 'CONVERSION',
      statuses: ['07_PUBLISH_READY'],
    },
    {
      id: 'published',
      label: '内容发布上线',
      owner: 'STRATEGY',
      statuses: ['08_PUBLISHED'],
    },
    {
      id: 'review',
      label: '数据复盘',
      owner: 'STRATEGY',
      statuses: ['09_DATA_REVIEW'],
    },
    {
      id: 'done',
      label: '任务闭环',
      owner: 'STRATEGY',
      statuses: ['10_COMPLETED'],
    },
  );

  return nodes;
}

/** 广告类任务流程 */
function buildAdPipeline(task: Task): PipelineNode[] {
  const nodes: PipelineNode[] = [
    {
      id: 'ad_prep',
      label: '广告筹备（素材 · 落地页）',
      owner: 'ADS',
      statuses: ['01_AI_PENDING', '02_STRATEGY_REVIEW', '03_CONVERSION_URL'],
    },
  ];

  if (task.isBudgetTask || task.needsVeraReview) {
    nodes.push({
      id: 'vera_budget',
      label: `${R('VERA')} · 预算审批`,
      owner: 'VERA',
      statuses: ['06_VERA_REVIEW', '11_BLOCKED'],
    });
  }

  nodes.push(
    {
      id: 'ad_live',
      label: `${R('ADS')} · 广告上线`,
      owner: 'ADS',
      statuses: ['07_PUBLISH_READY', '08_PUBLISHED'],
    },
    {
      id: 'ad_review',
      label: '投放数据复盘',
      owner: 'ADS',
      statuses: ['09_DATA_REVIEW'],
    },
    {
      id: 'done',
      label: '投放周期结束',
      owner: 'ADS',
      statuses: ['10_COMPLETED'],
    },
  );

  return nodes;
}

export function getTaskPipeline(task: Task): PipelineNode[] {
  if (task.isAdTask || task.contentType === '广告素材' || task.contentType === '广告预算') {
    return buildAdPipeline(task);
  }
  return buildContentPipeline(task);
}

const STATUS_RANK: Record<TaskStatus, number> = {
  '01_AI_PENDING': 10,
  '02_STRATEGY_REVIEW': 20,
  '03_CONVERSION_URL': 30,
  '04_MEDIA_EDIT': 40,
  '05_STRATEGY_FINAL': 50,
  '06_VERA_REVIEW': 60,
  '11_BLOCKED': 61,
  '12_AUTO_APPROVED': 62,
  '07_PUBLISH_READY': 70,
  '08_PUBLISHED': 80,
  '09_DATA_REVIEW': 90,
  '10_COMPLETED': 100,
  '99_REWORK': -1,
};

/** 根据 opLog 关键词推断节点完成时间 */
const LOG_HINTS: Record<string, string[]> = {
  ai: ['AI', '草稿', '派发'],
  s_script: ['脚本', '领取', '审核通过'],
  c_url: ['链接', '页面确认', 'URL'],
  m_edit: ['剪辑', '成片', '提交成片'],
  s_final: ['终审', '成片终审'],
  vera: ['VERA', '审核通过', '批准', '拒绝', '拦截'],
  vera_budget: ['预算', 'VERA'],
  publish_prep: ['UTM', '追踪'],
  published: ['发布'],
  ad_prep: ['广告', '筹备'],
  ad_live: ['上线', '投放'],
  ad_review: ['复盘', '投放复盘'],
  review: ['复盘'],
  done: ['闭环', '关闭', '完成'],
};

function findLogTime(task: Task, nodeId: string): string | undefined {
  const hints = LOG_HINTS[nodeId];
  if (!hints || !task.opLog?.length) return undefined;
  for (let i = task.opLog.length - 1; i >= 0; i--) {
    const entry = task.opLog[i];
    if (hints.some((h) => entry.action.includes(h))) return entry.time;
  }
  return undefined;
}

function findCurrentNodeIndex(nodes: PipelineNode[], status: TaskStatus): number {
  const direct = nodes.findIndex((n) => n.statuses.includes(status));
  if (direct >= 0) return direct;

  const rank = STATUS_RANK[status] ?? 0;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const maxStatus = Math.max(...nodes[i].statuses.map((s) => STATUS_RANK[s] ?? 0));
    if (rank >= maxStatus) return Math.min(i + (rank > maxStatus ? 1 : 0), nodes.length - 1);
  }
  return 0;
}

function resolveBlockedNodeIndex(nodes: PipelineNode[], task: Task): number {
  const byOwner = nodes.findIndex((n) => n.owner === task.assignedTo);
  if (byOwner >= 0) return byOwner;

  const rankAtBlock = inferProgressRank(task);
  let best = 0;
  for (let i = 0; i < nodes.length; i++) {
    const max = Math.max(...nodes[i].statuses.map((s) => STATUS_RANK[s] ?? 0));
    if (max <= rankAtBlock) best = i;
  }
  return best;
}

export function getPipelineNodeViews(task: Task): PipelineNodeView[] {
  const nodes = getTaskPipeline(task);
  const isBlocked = BLOCKED_STATUSES.includes(task.status);

  if (task.status === '10_COMPLETED') {
    return nodes.map((node) => ({
      ...node,
      state: 'completed' as PipelineNodeState,
      completedAt: findLogTime(task, node.id),
    }));
  }

  let currentIndex = nodes.findIndex((n) => n.statuses.includes(task.status));

  if (task.status === '99_REWORK') {
    currentIndex = resolveBlockedNodeIndex(nodes, task);
  }

  if (currentIndex < 0) {
    currentIndex = findCurrentNodeIndex(nodes, task.status);
  }

  return nodes.map((node, index) => {
    let state: PipelineNodeState;
    if (index < currentIndex) {
      state = 'completed';
    } else if (index === currentIndex) {
      state = isBlocked ? 'blocked' : 'current';
    } else {
      state = 'upcoming';
    }

    const completedAt = state === 'completed' ? findLogTime(task, node.id) : undefined;

    return { ...node, state, completedAt };
  });
}

function inferProgressRank(task: Task): number {
  if (task.opLog?.length) {
    for (let i = task.opLog.length - 1; i >= 0; i--) {
      const action = task.opLog[i].action;
      if (action.includes('成片') || action.includes('终审')) return 50;
      if (action.includes('剪辑')) return 40;
      if (action.includes('链接')) return 30;
      if (action.includes('脚本')) return 20;
    }
  }
  const assigneeRank: Partial<Record<Role, number>> = {
    MEDIA: 40,
    CONVERSION: 30,
    STRATEGY: 20,
    ADS: 20,
    VERA: 60,
  };
  return assigneeRank[task.assignedTo] ?? 20;
}

export function getPipelineSummary(task: Task): string {
  const views = getPipelineNodeViews(task);
  const current = views.find((v) => v.state === 'current' || v.state === 'blocked');
  const total = views.length;
  const done = views.filter((v) => v.state === 'completed').length;
  if (task.status === '10_COMPLETED') return `已完成全部 ${total} 个流程节点`;
  if (current?.state === 'blocked') return `阻塞于：${current.label}（${done}/${total}）`;
  if (current) return `当前：${current.label}（${done}/${total}）`;
  return `流程进度 ${done}/${total}`;
}
