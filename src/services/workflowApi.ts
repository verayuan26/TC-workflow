import type { Task } from '../types';
import { MOCK_TASKS } from './taskApi';

export type WorkflowTaskStatus =
  | 'AI_DRAFT'
  | 'SYSTEM_BLOCK'
  | 'VERA_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type WorkflowPriority = 'P0' | 'P1' | 'P2';

export interface WorkflowTask {
  task_id: string;
  role: '小S' | '小M' | '小C' | '小A';
  title: string;
  description: string;
  priority: WorkflowPriority;
  status: WorkflowTaskStatus;
  due_at: string;
  deliverables: string[];
  acceptance_criteria: string[];
  requires_vera_review: boolean;
  review_reason: string[];
  risk_level: '低' | '中' | '高';
  channels: string[];
  crm_tags: string[];
  requires_utm: boolean;
  business_vertical: string[];
  target_customer: string;
  related_page: string;
  cta_type: 'dm_consultation' | 'whatsapp_inquiry' | 'form_submit' | 'not_applicable';
  system_block_check_required: boolean;
}

export interface ImportAiDraftRequest {
  plan_name: string;
  plan_period: { start_date: string; end_date: string; timezone: 'Asia/Shanghai' };
  stage_focus: string[];
  target_proposal: {
    valid_leads_target_proposal: number;
    sql_target_proposal: number;
    attribution_rate_target_proposal: number;
  };
  orchestrator_note: string;
  system_block_rules: {
    blocked_phrases: string[];
    block_action: 'SYSTEM_BLOCK_AND_STOP_PUBLISH_QUEUE';
  };
  tasks: WorkflowTask[];
}

export interface ApiError {
  error_code:
    | 'VALIDATION_ERROR'
    | 'SYSTEM_BLOCK'
    | 'REVIEW_RULE_VIOLATION'
    | 'NOT_FOUND'
    | 'FORBIDDEN'
    | 'CONFLICT'
    | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // placeholder only

function nowIso() {
  return new Date().toISOString();
}

function mapTaskToWorkflow(t: Task): WorkflowTask {
  const status: WorkflowTaskStatus = t.status === '11_已拦截'
    ? 'SYSTEM_BLOCK'
    : t.status === '06_Vera待审核'
      ? 'VERA_REVIEW'
      : 'AI_DRAFT';

  return {
    task_id: t.id,
    role: t.assignedTo === '小S' || t.assignedTo === '小M' || t.assignedTo === '小C' || t.assignedTo === '小A' ? t.assignedTo : '小S',
    title: t.title,
    description: t.nextAction || t.title,
    priority: t.priority === 'A' ? 'P0' : t.priority === 'B' ? 'P1' : 'P2',
    status,
    due_at: t.sDeadline || t.mDeadline || t.cDeadline || t.aDeadline || nowIso(),
    deliverables: t.notes?.slice(0, 2) || ['待补充交付物'],
    acceptance_criteria: t.completionCriteria ? [t.completionCriteria] : ['待补充验收标准'],
    requires_vera_review: !!t.needsVeraReview,
    review_reason: t.needsVeraReview ? (t.riskLabels || ['需Vera审核']) : [],
    risk_level: t.riskLevel || '中',
    channels: t.isAdTask ? [t.adPlatform || 'Ads'] : ['Content'],
    crm_tags: t.crmTags ? t.crmTags.split(',').map((x) => x.trim()) : [],
    requires_utm: !!t.utmLink,
    business_vertical: ['white_customs_logistics'],
    target_customer: '待补充目标客户',
    related_page: t.targetUrl || '/ops/task',
    cta_type: t.targetUrl?.startsWith('/ops/') || t.targetUrl?.startsWith('/ads/') ? 'not_applicable' : 'form_submit',
    system_block_check_required: true,
  };
}

// Mock storage
let WORKFLOW_TASKS: WorkflowTask[] = MOCK_TASKS.slice(0, 20).map(mapTaskToWorkflow);
let REVIEWS: Array<{ review_id: string; task_id: string; decision: 'APPROVED' | 'REJECTED'; comment: string; created_at: string }> = [];
let BRIEFS: Array<{ brief_id: string; brief_type: 'content' | 'ads' | 'tracking'; title: string; content: string; created_at: string }> = [];
let CRM_FEEDBACK: Array<{ feedback_id: string; source: string; feedback_text: string; is_desensitized: boolean; created_at: string }> = [];
let AI_RUNS: Array<{ run_id: string; run_type: string; status: 'CREATED' | 'SUCCEEDED' | 'FAILED'; created_at: string }> = [];

export async function importAiDraft(payload: ImportAiDraftRequest) {
  // no real HTTP call in V1 mock mode
  const blocked = payload.tasks.filter((t) => payload.system_block_rules.blocked_phrases.some((p) => t.title.includes(p) || t.description.includes(p)));
  const accepted = payload.tasks.filter((t) => !blocked.includes(t));
  WORKFLOW_TASKS = [...accepted, ...blocked.map((x) => ({ ...x, status: 'SYSTEM_BLOCK' as const }))];
  return {
    import_id: `imp_${Date.now()}`,
    imported_count: accepted.length,
    blocked_count: blocked.length,
    blocked_tasks: blocked.map((t) => ({ task_id: t.task_id, matched_phrases: payload.system_block_rules.blocked_phrases.filter((p) => t.title.includes(p) || t.description.includes(p)), status: 'SYSTEM_BLOCK' as const })),
    tasks: WORKFLOW_TASKS,
    api_base_url: API_BASE_URL,
  };
}

export async function getTasks(params?: { status?: WorkflowTaskStatus; role?: WorkflowTask['role']; requires_vera_review?: boolean; business_vertical?: string }) {
  let items = [...WORKFLOW_TASKS];
  if (params?.status) items = items.filter((t) => t.status === params.status);
  if (params?.role) items = items.filter((t) => t.role === params.role);
  if (typeof params?.requires_vera_review === 'boolean') items = items.filter((t) => t.requires_vera_review === params.requires_vera_review);
  if (params?.business_vertical) items = items.filter((t) => t.business_vertical.includes(params.business_vertical!));
  return { items, page: 1, page_size: items.length, total: items.length };
}

export async function updateTask(task_id: string, patch: Partial<WorkflowTask>) {
  WORKFLOW_TASKS = WORKFLOW_TASKS.map((t) => (t.task_id === task_id ? { ...t, ...patch } : t));
  const task = WORKFLOW_TASKS.find((t) => t.task_id === task_id);
  if (!task) throw <ApiError>{ error_code: 'NOT_FOUND', message: 'Task not found' };
  return { task };
}

export async function submitTask(task_id: string, submit_note?: string) {
  const task = WORKFLOW_TASKS.find((t) => t.task_id === task_id);
  if (!task) throw <ApiError>{ error_code: 'NOT_FOUND', message: 'Task not found' };
  if (task.status === 'SYSTEM_BLOCK') throw <ApiError>{ error_code: 'SYSTEM_BLOCK', message: 'Task is blocked' };
  task.status = task.requires_vera_review ? 'VERA_REVIEW' : 'AI_DRAFT';
  return { task_id, status: task.status, queue: task.requires_vera_review ? 'VERA_REVIEW_QUEUE' : 'NORMAL_REVIEW_QUEUE', submit_note };
}

export async function reviewTask(task_id: string, body: { decision: 'APPROVED' | 'REJECTED'; comment: string }) {
  const task = WORKFLOW_TASKS.find((t) => t.task_id === task_id);
  if (!task) throw <ApiError>{ error_code: 'NOT_FOUND', message: 'Task not found' };
  task.status = body.decision;
  const rec = { review_id: `rev_${Date.now()}`, task_id, decision: body.decision, comment: body.comment, created_at: nowIso() };
  REVIEWS.push(rec);
  return { task_id, decision: body.decision, status: task.status };
}

export async function getReviews(params?: { task_id?: string; decision?: 'APPROVED' | 'REJECTED' }) {
  let items = [...REVIEWS];
  if (params?.task_id) items = items.filter((r) => r.task_id === params.task_id);
  if (params?.decision) items = items.filter((r) => r.decision === params.decision);
  return { items };
}

export async function generateUtm(body: { source: string; medium: string; campaign: string; content: string; term?: string; base_url: string }) {
  const u = new URL(body.base_url, 'https://placeholder.local');
  u.searchParams.set('utm_source', body.source);
  u.searchParams.set('utm_medium', body.medium);
  u.searchParams.set('utm_campaign', body.campaign);
  u.searchParams.set('utm_content', body.content);
  if (body.term) u.searchParams.set('utm_term', body.term);
  return { utm_url: u.toString(), content_id: `cid_${Date.now()}` };
}

export async function getBriefs() { return { items: BRIEFS }; }
export async function createBrief(body: { brief_type: 'content' | 'ads' | 'tracking'; title: string; content: string }) {
  const brief = { brief_id: `brief_${Date.now()}`, ...body, created_at: nowIso() };
  BRIEFS.push(brief);
  return brief;
}

export async function getCrmFeedback() { return { items: CRM_FEEDBACK }; }
export async function createCrmFeedback(body: { source: 'crm_lead' | 'sales_log' | 'customer_question'; feedback_text: string; is_desensitized: boolean }) {
  const row = { feedback_id: `cf_${Date.now()}`, ...body, created_at: nowIso() };
  CRM_FEEDBACK.push(row);
  return row;
}

export async function createAiRun(body: { run_type: 'longxia_generate' | 'copy_edit' | 'risk_check'; input_summary: string }) {
  const row = { run_id: `air_${Date.now()}`, run_type: body.run_type, status: 'CREATED' as const, created_at: nowIso() };
  AI_RUNS.push(row);
  return row;
}

export async function getAiRuns() { return { items: AI_RUNS }; }
