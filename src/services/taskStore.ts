import type {
  Task, TaskStatus, Role, Website, ContentType, Priority, RiskLevel, AdPlatform,
} from '../types';
import type { LoginRole } from '../types/session';
import type { TaskActionId } from '../config/roleFlows';
import { isVideoContent, needsPageCheck } from '../config/roleFlows';
import { roleFormalName as R } from '../config/roleDisplay';

let tasks: Task[] = [];

export type TaskEntryMode = 'ai_draft' | 'dispatch_strategy' | 'assign_direct';

export interface ManualTaskCreateInput {
  title: string;
  website: Website;
  contentType: ContentType;
  priority: Priority;
  entryMode: TaskEntryMode;
  /** entryMode = assign_direct 时指定 */
  assignTo?: Role;
  needsVeraReview?: boolean;
  riskLevel?: RiskLevel;
  keywords?: string;
  scriptLink?: string;
  materialLink?: string;
  aiOutputLink?: string;
  targetUrl?: string;
  lpBrief?: string;
  completionCriteria?: string;
  note?: string;
  isAdTask?: boolean;
  adPlatform?: AdPlatform;
  proposedBudget?: number;
  deadline?: string;
}

const SITE_PREFIX: Record<Website, string> = {
  'tigersourcingchina.com': 'TSC',
  'tigerlogisticschina.com': 'TLC',
  'tiger-logistics.ru': 'TLR',
  'tiger-poisk.ru': 'TPR',
  'oz-logistics.ru': 'OZL',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function now(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function generateTaskId(website: Website): string {
  const prefix = SITE_PREFIX[website];
  let max = 0;
  for (const t of tasks) {
    const m = t.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

function resolveEntry(input: ManualTaskCreateInput): {
  status: TaskStatus;
  assignedTo: Role;
  nextAction: string;
} {
  const isAd = input.isAdTask || input.contentType === '广告素材' || input.contentType === '广告预算';

  if (input.entryMode === 'ai_draft') {
    return {
      status: '01_AI_PENDING',
      assignedTo: 'AI',
      nextAction: `${R('PM')}已录入，待确认需求后派发给执行人`,
    };
  }

  if (input.entryMode === 'dispatch_strategy') {
    return {
      status: '02_STRATEGY_REVIEW',
      assignedTo: 'STRATEGY',
      nextAction: '审核人工录入任务并推进下一环节',
    };
  }

  const role = input.assignTo ?? (isAd ? 'ADS' : 'STRATEGY');
  switch (role) {
    case 'MEDIA':
      return {
        status: '04_MEDIA_EDIT',
        assignedTo: 'MEDIA',
        nextAction: '按 PM 录入的 brief 完成剪辑并提交成片',
      };
    case 'CONVERSION':
      return {
        status: '03_CONVERSION_URL',
        assignedTo: 'CONVERSION',
        nextAction: '确认落地页、表单与 UTM 追踪',
      };
    case 'ADS':
      return {
        status: isAd && input.proposedBudget ? '06_VERA_REVIEW' : '01_AI_PENDING',
        assignedTo: 'ADS',
        nextAction: isAd && input.proposedBudget
          ? '等待 Vera 确认广告预算'
          : '筹备广告素材与落地页',
      };
    case 'STRATEGY':
    default:
      return {
        status: '02_STRATEGY_REVIEW',
        assignedTo: 'STRATEGY',
        nextAction: '审核人工录入任务并推进下一环节',
      };
  }
}

export function seedTasks(data: Task[]): void {
  if (tasks.length === 0) {
    tasks = data.map((t) => ({ ...t }));
  }
}

export function getAllTasks(): Task[] {
  return tasks.map((t) => ({ ...t }));
}

export function getTaskById(id: string): Task | undefined {
  const t = tasks.find((x) => x.id === id);
  return t ? { ...t } : undefined;
}

function appendLog(task: Task, action: string, operator: string): void {
  task.opLog = [...(task.opLog ?? []), { time: now(), action, operator }];
  task.updatedAt = today();
}

function setStatus(task: Task, status: TaskStatus, assignee: Role, nextAction: string): void {
  task.status = status;
  task.assignedTo = assignee;
  task.nextAction = nextAction;
  task.isOverdue = false;
}

export interface PerformActionPayload {
  fieldValue?: string;
  note?: string;
}

export function createManualTask(input: ManualTaskCreateInput, operator: LoginRole): Task {
  const title = input.title.trim();
  if (!title) throw new Error('请填写任务标题');

  const isAd = input.isAdTask || input.contentType === '广告素材' || input.contentType === '广告预算';
  const needsVera =
    input.needsVeraReview
    || input.contentType === '客户案例'
    || input.riskLevel === '高'
    || (isAd && !!input.proposedBudget);

  const { status, assignedTo, nextAction } = resolveEntry(input);
  const id = generateTaskId(input.website);
  const date = today();

  const task: Task = {
    id,
    website: input.website,
    contentType: input.contentType,
    title,
    status,
    priority: input.priority,
    isOverdue: false,
    needsVeraReview: needsVera,
    assignedTo,
    riskLevel: input.riskLevel ?? (needsVera ? '中' : '低'),
    aiRiskScore: needsVera ? 55 : 20,
    aiDecision: needsVera ? 'vera_required' : 'auto_approve',
    aiDecisionReason: needsVera ? '人工录入任务，需 Vera 审核高风险内容' : '人工录入常规任务',
    nextAssignee: assignedTo,
    nextAction,
    completionCriteria: input.completionCriteria?.trim() || undefined,
    keywords: input.keywords?.trim() || undefined,
    scriptLink: input.scriptLink?.trim() || undefined,
    materialLink: input.materialLink?.trim() || undefined,
    aiOutputLink: input.aiOutputLink?.trim() || undefined,
    targetUrl: input.targetUrl?.trim() || undefined,
    lpBrief: input.lpBrief?.trim() || undefined,
    needsNewPage: needsPageCheck({ contentType: input.contentType, needsNewPage: !!input.lpBrief } as Task),
    isAdTask: isAd,
    notes: input.note?.trim() ? [input.note.trim()] : undefined,
    opLog: [{
      time: now(),
      action: `人工发布任务（${input.entryMode === 'ai_draft' ? 'AI草稿池' : input.entryMode === 'dispatch_strategy' ? '派发策略师' : '指定负责人'}）`,
      operator: operator === 'PM' ? 'PM' : operator,
    }],
    createdAt: date,
    updatedAt: date,
  };

  if (isVideoContent(task)) {
    task.videoType = input.contentType === '长视频' ? '长视频' : '短视频';
    task.editLevel = 'B标准';
    if (input.deadline) task.mDeadline = input.deadline;
  } else if (input.deadline) {
    task.sDeadline = input.deadline;
  }

  if (isAd) {
    task.adPlatform = input.adPlatform;
    task.adStatus = '待建广告';
    if (input.proposedBudget) {
      task.proposedBudget = input.proposedBudget;
      task.isBudgetTask = true;
      task.budgetStatus = '等待Vera确认预算';
      if (needsVera) {
        task.status = '06_VERA_REVIEW';
        task.assignedTo = 'VERA';
        task.nextAction = '等待 Vera 确认广告预算';
      }
    }
  }

  if (input.targetUrl) {
    task.urlStatus = '待确认';
  }

  tasks.push(task);
  return { ...task };
}

export function updateTaskFields(id: string, patch: Partial<Task>): Task {
  const task = tasks.find((t) => t.id === id);
  if (!task) throw new Error('任务不存在');
  Object.assign(task, patch);
  task.updatedAt = today();
  return { ...task };
}

export function performTaskAction(
  id: string,
  action: TaskActionId,
  operator: LoginRole,
  payload: PerformActionPayload = {},
): Task {
  const task = tasks.find((t) => t.id === id);
  if (!task) throw new Error('任务不存在');

  const op = operator === 'PM' ? 'PM' : operator;

  switch (action) {
    case 'claim':
      setStatus(task, '02_STRATEGY_REVIEW', 'STRATEGY', '审核 AI 脚本并推进');
      appendLog(task, '领取任务并开始审核', op);
      break;

    case 'approve_script': {
      if (isVideoContent(task)) {
        setStatus(task, '04_MEDIA_EDIT', 'MEDIA', '按脚本完成剪辑并提交成片链接');
      } else if (needsPageCheck(task)) {
        setStatus(task, '03_CONVERSION_URL', 'CONVERSION', '确认落地页、表单与 UTM');
      } else if (task.needsVeraReview) {
        setStatus(task, '06_VERA_REVIEW', 'VERA', '等待 Vera 审核');
      } else {
        setStatus(task, '07_PUBLISH_READY', 'STRATEGY', '确认发布渠道并标记已发布');
      }
      appendLog(task, '脚本审核通过', op);
      break;
    }

    case 'reject_to_rework':
      task.blockReason = payload.note ?? '需修改后重新提交';
      setStatus(task, '99_REWORK', task.assignedTo === 'MEDIA' ? 'MEDIA' : 'STRATEGY', task.blockReason);
      appendLog(task, `退回：${task.blockReason}`, op);
      break;

    case 'approve_final':
      if (task.needsVeraReview) {
        setStatus(task, '06_VERA_REVIEW', 'VERA', '等待 Vera 审核成片');
      } else {
        setStatus(task, '07_PUBLISH_READY', 'CONVERSION', '配置 UTM 后交小 S 发布');
        if (needsPageCheck(task) && !task.utmLink) {
          task.assignedTo = 'CONVERSION';
        } else {
          task.assignedTo = 'STRATEGY';
        }
      }
      appendLog(task, '成片终审通过', op);
      break;

    case 'submit_edit':
      if (payload.fieldValue) task.finalVideoLink = payload.fieldValue;
      setStatus(task, '05_STRATEGY_FINAL', 'STRATEGY', '审核成片质量与字幕');
      appendLog(task, '提交成片，等待小 S 终审', op);
      break;

    case 'confirm_url':
      if (payload.fieldValue) task.targetUrl = payload.fieldValue;
      task.urlStatus = '已确认';
      if (isVideoContent(task)) {
        setStatus(task, '04_MEDIA_EDIT', 'MEDIA', '页面就绪，开始剪辑');
      } else if (task.needsVeraReview) {
        setStatus(task, '06_VERA_REVIEW', 'VERA', '等待 Vera 审核');
      } else {
        setStatus(task, '07_PUBLISH_READY', 'STRATEGY', '确认发布');
      }
      appendLog(task, '链接与页面确认完成', op);
      break;

    case 'mark_publish_ready':
      if (payload.fieldValue) task.utmLink = payload.fieldValue;
      task.assignedTo = 'STRATEGY';
      task.nextAction = '确认各渠道发布并标记已发布';
      appendLog(task, 'UTM 配置完成，追踪就绪', op);
      break;

    case 'mark_published':
      setStatus(task, '09_DATA_REVIEW', 'STRATEGY', '完成内容数据复盘');
      if (payload.fieldValue) task.reviewLink = payload.fieldValue;
      appendLog(task, '内容已发布，进入数据复盘', op);
      break;

    case 'submit_ad_budget':
      if (payload.fieldValue) task.proposedBudget = Number(payload.fieldValue);
      task.needsVeraReview = true;
      task.isBudgetTask = true;
      task.budgetStatus = '等待Vera确认预算';
      setStatus(task, '06_VERA_REVIEW', 'VERA', '等待 Vera 确认广告预算');
      appendLog(task, `提交预算申请 $${task.proposedBudget ?? 0}`, op);
      break;

    case 'confirm_ad_live':
      task.adStatus = '投放中';
      setStatus(task, '09_DATA_REVIEW', 'ADS', '观察投放数据并提交复盘');
      appendLog(task, '广告已上线，进入观察期', op);
      break;

    case 'submit_ad_review':
      if (payload.fieldValue) task.adPerformanceSummary = payload.fieldValue;
      setStatus(task, '10_COMPLETED', 'ADS', '本周期投放已闭环');
      appendLog(task, '投放复盘完成，任务关闭', op);
      break;

    case 'vera_approve':
      task.humanDecision = 'approved';
      task.decisionBy = 'VERA';
      task.decisionTime = now();
      if (task.autoApproved) {
        setStatus(task, '12_AUTO_APPROVED', 'STRATEGY', '进入发布队列');
      } else {
        setStatus(task, '07_PUBLISH_READY', 'STRATEGY', '按批准版本发布');
      }
      appendLog(task, 'Vera 审核通过', op);
      break;

    case 'vera_reject':
      task.humanDecision = 'rejected';
      task.decisionBy = 'VERA';
      task.veraComments = payload.note ?? '需修改';
      setStatus(task, '99_REWORK', 'STRATEGY', '按 Vera 意见修改');
      appendLog(task, `Vera 退回：${task.veraComments}`, op);
      break;

    case 'vera_intercept':
      task.humanDecision = 'intercepted';
      task.isIntercepted = true;
      task.interceptReasons = [payload.note ?? '高风险内容'];
      setStatus(task, '11_BLOCKED', 'VERA', '不可发布，需重写');
      appendLog(task, 'Vera 拦截', op);
      break;

    case 'vera_approve_budget':
      task.budgetStatus = 'Vera已确认预算';
      task.budget = task.proposedBudget;
      task.humanDecision = 'budget_approved';
      setStatus(task, '07_PUBLISH_READY', 'ADS', '按批准预算上线广告');
      appendLog(task, 'Vera 批准预算', op);
      break;

    case 'vera_reject_budget':
      task.budgetStatus = 'Vera拒绝预算';
      setStatus(task, '99_REWORK', 'ADS', '调整预算方案后重新申请');
      appendLog(task, 'Vera 拒绝预算', op);
      break;

    case 'complete_data_review':
      setStatus(task, '10_COMPLETED', 'STRATEGY', '任务已闭环');
      appendLog(task, '数据复盘完成', op);
      break;

    case 'pm_dispatch':
      setStatus(task, '02_STRATEGY_REVIEW', 'STRATEGY', '审核 AI 草稿并推进');
      appendLog(task, `${R('PM')}派发给${R('STRATEGY')}`, op);
      break;

    case 'pm_unblock':
      task.blockReason = undefined;
      task.isIntercepted = false;
      setStatus(task, '02_STRATEGY_REVIEW', 'STRATEGY', '重新审核并推进');
      appendLog(task, `${R('PM')}解除阻塞并重新派发`, op);
      break;

    default:
      throw new Error(`未知操作: ${action}`);
  }

  return { ...task };
}
