export type WorkflowStatus = 'AI_DRAFT' | 'SYSTEM_BLOCK' | 'VERA_REVIEW' | 'APPROVED' | 'REJECTED';
export type WorkflowPriority = 'P0' | 'P1' | 'P2';
export type CtaType = 'form_submit' | 'whatsapp_inquiry' | 'dm_consultation' | 'not_applicable';
export type PublishQueueStatus = 'DRAFT' | 'WAIT_VERA' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'FAILED' | 'NEED_EDIT';
export type WeeklyDecision = 'CONTINUE' | 'FIX' | 'PAUSE';

export interface WorkflowTask {
  task_id: string;
  title: string;
  platform: string;
  caption: string;
  hashtags: string[];
  cta: string;
  cta_type: CtaType;
  utm: string;
  asset_url: string;
  scheduled_time?: string;
  owner: string;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  requires_vera_review: boolean;
  review_reason: string[];
  business_vertical: string[];
  crm_tags: string[];
  system_block_check_required: boolean;
}

export interface PublishQueueItem {
  id: string;
  task_id: string;
  platform: string;
  caption: string;
  hashtags: string[];
  cta: string;
  utm: string;
  asset_url: string;
  scheduled_time?: string;
  owner: string;
  status: PublishQueueStatus;
  blocked_reason?: string;
  publish_url?: string;
  published_at?: string;
  publisher?: string;
}

export interface MetricsInput {
  task_id: string;
  content_id: string;
  platform: string;
  campaign: string;
  crm_tags: string[];
  business_vertical: string[];
  impressions: number;
  clicks: number;
  comments: number;
  dm: number;
  form: number;
  valid_leads: number;
  sql: number;
  cost: number;
}

export interface WeeklyReportRow {
  platform: string;
  content_id: string;
  crm_tag: string;
  business_vertical: string;
  campaign: string;
  impressions: number;
  clicks: number;
  leads: number;
  valid_leads: number;
  sql: number;
  cost: number;
  decision: WeeklyDecision;
}
