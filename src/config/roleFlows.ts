import type { LoginRole, WorkflowRole } from '../types/session';
import type { Task, TaskStatus } from '../types';
import { roleFormalName as R } from './roleDisplay';

export interface FlowStep {
  id: string;
  label: string;
  hint: string;
  statuses: TaskStatus[];
}

export interface RoleFlowConfig {
  role: LoginRole;
  steps: FlowStep[];
  doneStatuses: TaskStatus[];
}

export type TaskActionId =
  | 'claim'
  | 'approve_script'
  | 'reject_to_rework'
  | 'approve_final'
  | 'submit_edit'
  | 'confirm_url'
  | 'mark_publish_ready'
  | 'mark_published'
  | 'submit_ad_budget'
  | 'confirm_ad_live'
  | 'submit_ad_review'
  | 'vera_approve'
  | 'vera_reject'
  | 'vera_intercept'
  | 'vera_approve_budget'
  | 'vera_reject_budget'
  | 'complete_data_review'
  | 'pm_dispatch'
  | 'pm_unblock';

export interface TaskActionDef {
  id: TaskActionId;
  label: string;
  variant: 'primary' | 'ghost' | 'danger';
  requiresField?: keyof Task;
  fieldLabel?: string;
}

const CONTENT_TYPES_VIDEO = ['短视频', '长视频'];
const CONTENT_TYPES_PAGE = ['Landing Page', 'URL检查', 'SEO文章'];

const ROLE_FLOWS_BASE: Record<WorkflowRole, RoleFlowConfig> = {
  STRATEGY: {
    role: 'STRATEGY',
    steps: [
      { id: 'inbox', label: '待处理', hint: 'AI 草稿与脚本待审', statuses: ['01_AI_PENDING', '02_STRATEGY_REVIEW'] },
      { id: 'final', label: '待终审', hint: '成片回来待确认', statuses: ['05_STRATEGY_FINAL'] },
      { id: 'publish', label: '待发布', hint: '确认后进入发布', statuses: ['07_PUBLISH_READY'] },
      { id: 'review', label: '待复盘', hint: '发布后数据复盘', statuses: ['09_DATA_REVIEW'] },
      { id: 'done', label: '已完成', hint: '本周期闭环', statuses: ['08_PUBLISHED', '10_COMPLETED'] },
    ],
    doneStatuses: ['08_PUBLISHED', '10_COMPLETED'],
  },
  MEDIA: {
    role: 'MEDIA',
    steps: [
      { id: 'queue', label: '待剪辑', hint: '脚本已通过，等待成片', statuses: ['04_MEDIA_EDIT'] },
      { id: 'rework', label: '返工', hint: '被退回需重剪', statuses: ['99_REWORK'] },
      { id: 'done', label: '已提交', hint: '__S_FINAL__', statuses: ['05_STRATEGY_FINAL', '06_VERA_REVIEW', '07_PUBLISH_READY', '08_PUBLISHED', '10_COMPLETED'] },
    ],
    doneStatuses: ['05_STRATEGY_FINAL', '06_VERA_REVIEW', '07_PUBLISH_READY', '08_PUBLISHED', '10_COMPLETED'],
  },
  CONVERSION: {
    role: 'CONVERSION',
    steps: [
      { id: 'url', label: '待确认链接', hint: '落地页与表单检查', statuses: ['03_CONVERSION_URL'] },
      { id: 'utm', label: '待配 UTM', hint: '生成追踪链接', statuses: ['07_PUBLISH_READY'] },
      { id: 'done', label: '追踪就绪', hint: '可发布或已发布', statuses: ['08_PUBLISHED', '10_COMPLETED'] },
    ],
    doneStatuses: ['08_PUBLISHED', '10_COMPLETED'],
  },
  ADS: {
    role: 'ADS',
    steps: [
      { id: 'prep', label: '筹备中', hint: '素材与落地页确认', statuses: ['01_AI_PENDING', '02_STRATEGY_REVIEW', '03_CONVERSION_URL'] },
      { id: 'budget', label: '预算审批', hint: '__VERA_BUDGET__', statuses: ['06_VERA_REVIEW'] },
      { id: 'live', label: '投放中', hint: '广告已上线观察', statuses: ['07_PUBLISH_READY', '08_PUBLISHED'] },
      { id: 'review', label: '待复盘', hint: '录入投放数据', statuses: ['09_DATA_REVIEW'] },
      { id: 'done', label: '已闭环', hint: '投放周期结束', statuses: ['10_COMPLETED'] },
    ],
    doneStatuses: ['10_COMPLETED'],
  },
  VERA: {
    role: 'VERA',
    steps: [
      { id: 'overview', label: '全局概览', hint: '全部任务进展一览', statuses: [
        '01_AI_PENDING', '02_STRATEGY_REVIEW', '03_CONVERSION_URL', '04_MEDIA_EDIT', '05_STRATEGY_FINAL',
        '06_VERA_REVIEW', '07_PUBLISH_READY', '08_PUBLISHED', '09_DATA_REVIEW', '10_COMPLETED', '11_BLOCKED', '99_REWORK',
      ] },
      { id: 'content', label: '待我审核', hint: '高风险内容待拍板', statuses: ['06_VERA_REVIEW'] },
      { id: 'blocked', label: '已拦截', hint: '系统拦截待处理', statuses: ['11_BLOCKED'] },
      { id: 'done', label: '已决策', hint: '审核通过或退回', statuses: ['07_PUBLISH_READY', '12_AUTO_APPROVED', '99_REWORK', '10_COMPLETED'] },
    ],
    doneStatuses: ['07_PUBLISH_READY', '12_AUTO_APPROVED', '10_COMPLETED'],
  },
  PM: {
    role: 'PM',
    steps: [
      { id: 'draft', label: 'AI 草稿', hint: '待派发给执行人', statuses: ['01_AI_PENDING'] },
      { id: 'blocked', label: '阻塞中', hint: '需 PM 介入', statuses: ['99_REWORK', '11_BLOCKED'] },
      { id: 'progress', label: '进行中', hint: '各角色执行中', statuses: ['02_STRATEGY_REVIEW', '03_CONVERSION_URL', '04_MEDIA_EDIT', '05_STRATEGY_FINAL', '06_VERA_REVIEW', '07_PUBLISH_READY'] },
      { id: 'done', label: '本周闭环', hint: '已发布或已完成', statuses: ['08_PUBLISHED', '09_DATA_REVIEW', '10_COMPLETED'] },
    ],
    doneStatuses: ['10_COMPLETED'],
  },
};

function resolveStepHint(hint: string): string {
  if (hint === '__S_FINAL__') return `已交${R('STRATEGY')}终审`;
  if (hint === '__VERA_BUDGET__') return `等待${R('VERA')}确认预算`;
  return hint;
}

/** 带当前角色名称的流程配置（展示层） */
export function getRoleFlow(role: WorkflowRole): RoleFlowConfig {
  const base = ROLE_FLOWS_BASE[role];
  return {
    ...base,
    steps: base.steps.map((step) => ({
      ...step,
      hint: resolveStepHint(step.hint),
    })),
  };
}

/** @deprecated 请使用 getRoleFlow(role) 以获取最新角色名称 */
export const ROLE_FLOWS: Record<WorkflowRole, RoleFlowConfig> = ROLE_FLOWS_BASE;

export function taskVisibleForRole(task: Task, role: LoginRole): boolean {
  if (role === 'ADMIN') return false;
  if (role === 'PM' || role === 'VERA') return true;
  if (role === 'ADS') {
    return !!task.isAdTask || task.contentType === '广告素材' || task.contentType === '广告预算' || task.assignedTo === 'ADS';
  }
  if (task.assignedTo === role) return true;

  const flow = getRoleFlow(role as WorkflowRole);
  const activeStatuses = flow.steps.flatMap((s) => s.statuses);
  return activeStatuses.includes(task.status);
}

export function getActionsForTask(task: Task, role: LoginRole): TaskActionDef[] {
  if (role === 'STRATEGY') {
    if (task.status === '01_AI_PENDING') {
      return [{ id: 'claim', label: '领取并开始审核', variant: 'primary' }];
    }
    if (task.status === '02_STRATEGY_REVIEW') {
      return [
        { id: 'approve_script', label: '脚本通过 · 推进下一环节', variant: 'primary' },
        { id: 'reject_to_rework', label: '退回修改', variant: 'danger' },
      ];
    }
    if (task.status === '05_STRATEGY_FINAL') {
      return [
        { id: 'approve_final', label: '成片通过 · 提交发布/审核', variant: 'primary' },
        { id: 'reject_to_rework', label: '退回小 M 重剪', variant: 'danger' },
      ];
    }
    if (task.status === '07_PUBLISH_READY') {
      return [
        { id: 'mark_published', label: '确认已发布', variant: 'primary', requiresField: 'finalVideoLink', fieldLabel: '发布链接（选填）' },
      ];
    }
    if (task.status === '09_DATA_REVIEW') {
      return [{ id: 'complete_data_review', label: '完成复盘 · 关闭任务', variant: 'primary' }];
    }
  }

  if (role === 'MEDIA' && task.status === '04_MEDIA_EDIT') {
    return [
      {
        id: 'submit_edit',
        label: '提交成片 · 交策略师终审',
        variant: 'primary',
        requiresField: 'finalVideoLink',
        fieldLabel: '成片链接',
      },
    ];
  }

  if (role === 'CONVERSION') {
    if (task.status === '03_CONVERSION_URL') {
      return [
        {
          id: 'confirm_url',
          label: '链接确认 · 推进流程',
          variant: 'primary',
          requiresField: 'targetUrl',
          fieldLabel: '目标 URL',
        },
      ];
    }
    if (task.status === '07_PUBLISH_READY') {
      return [
        {
          id: 'mark_publish_ready',
          label: 'UTM 已配置 · 标记可发布',
          variant: 'primary',
          requiresField: 'utmLink',
          fieldLabel: 'UTM 链接',
        },
      ];
    }
  }

  if (role === 'ADS') {
    if (task.isBudgetTask && task.status === '06_VERA_REVIEW') {
      return [];
    }
    if (task.isAdTask && ['01_AI_PENDING', '02_STRATEGY_REVIEW', '03_CONVERSION_URL'].includes(task.status)) {
      return [
        {
          id: 'submit_ad_budget',
          label: `提交预算 · 送${R('VERA')}审批`,
          variant: 'primary',
          requiresField: 'proposedBudget',
          fieldLabel: '申请预算 (USD)',
        },
      ];
    }
    if (task.status === '07_PUBLISH_READY' || (task.status === '08_PUBLISHED' && task.adStatus !== '投放中')) {
      return [{ id: 'confirm_ad_live', label: '确认广告已上线', variant: 'primary' }];
    }
    if (task.status === '09_DATA_REVIEW') {
      return [
        {
          id: 'submit_ad_review',
          label: '提交投放复盘',
          variant: 'primary',
          requiresField: 'adPerformanceSummary',
          fieldLabel: '数据表现概述',
        },
      ];
    }
  }

  if (role === 'VERA' && task.status === '06_VERA_REVIEW') {
    if (task.isBudgetTask) {
      return [
        { id: 'vera_approve_budget', label: '批准预算', variant: 'primary' },
        { id: 'vera_reject_budget', label: '拒绝预算', variant: 'danger' },
      ];
    }
    return [
      { id: 'vera_approve', label: '审核通过', variant: 'primary' },
      { id: 'vera_reject', label: '退回修改', variant: 'ghost' },
      { id: 'vera_intercept', label: '拦截 · 不可发布', variant: 'danger' },
    ];
  }

  if (role === 'PM') {
    if (task.status === '01_AI_PENDING') {
      return [{ id: 'pm_dispatch', label: `派发给${R('STRATEGY')}`, variant: 'primary' }];
    }
    if (task.status === '99_REWORK' || task.status === '11_BLOCKED') {
      return [{ id: 'pm_unblock', label: '解除阻塞 · 重新派发', variant: 'primary' }];
    }
  }

  return [];
}

export function isVideoContent(task: Task): boolean {
  return CONTENT_TYPES_VIDEO.includes(task.contentType);
}

export function needsPageCheck(task: Task): boolean {
  return CONTENT_TYPES_PAGE.includes(task.contentType) || !!task.needsNewPage;
}

export function stepForTask(task: Task, role: LoginRole): string {
  if (role === 'ADMIN') return 'other';
  const flow = getRoleFlow(role as WorkflowRole);
  for (const step of flow.steps) {
    if (step.statuses.includes(task.status)) return step.id;
  }
  return 'other';
}
