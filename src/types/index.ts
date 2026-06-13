// ─────────────────────────────────────────────────────────────────────────────
// Tiger Content Workflow — Type Definitions  (Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | '01_AI_PENDING'
  | '02_STRATEGY_REVIEW'
  | '03_CONVERSION_URL'
  | '04_MEDIA_EDIT'
  | '05_STRATEGY_FINAL'
  | '06_VERA_REVIEW'
  | '07_PUBLISH_READY'
  | '08_PUBLISHED'
  | '09_DATA_REVIEW'
  | '10_COMPLETED'
  | '11_BLOCKED'
  | '12_AUTO_APPROVED'
  | '99_REWORK';

export type AdStatus =
  | '待建广告'
  | '待审核素材'
  | '待确认落地页'
  | '待上线'
  | 'AI建议预算'
  | '等待Vera确认预算'
  | 'Vera已确认预算'
  | 'Vera拒绝预算'
  | '投放中'
  | '观察中'
  | '放大候选'
  | '暂停'
  | '需优化'
  | '已结束';

export type AdPlatform =
  | 'Google Ads'
  | 'Yandex Direct'
  | 'VK Ads'
  | 'TikTok Ads'
  | 'YouTube Ads'
  | 'Meta Ads';

export type ContentType =
  | '短视频'
  | '长视频'
  | 'SEO文章'
  | 'Landing Page'
  | 'URL检查'
  | '素材整理'
  | '发布文案'
  | '数据复盘'
  | '广告素材'
  | '客户案例'   // Phase 4
  | '广告预算';  // Phase 4

export type VideoType = '短视频' | '长视频';
export type EditLevel = 'A精剪' | 'B标准' | 'C快剪';
export type Priority = 'A' | 'B' | 'C';
export type Role = 'STRATEGY' | 'MEDIA' | 'CONVERSION' | 'ADS' | 'VERA' | 'AI';
export type RiskLevel = '低' | '中' | '高';
export type BudgetStatus = 'AI建议预算' | '等待Vera确认预算' | 'Vera已确认预算' | 'Vera拒绝预算';

export const WEBSITES = [
  'tigersourcingchina.com',
  'tigerlogisticschina.com',
  'tiger-logistics.ru',
  'tiger-poisk.ru',
  'oz-logistics.ru',
] as const;

export type Website = (typeof WEBSITES)[number];

// ─── Operation log entry ───────────────────────────────────────────────────

export interface OpLogEntry {
  time: string;
  action: string;
  operator: string;
}

// ─── Main Task interface ───────────────────────────────────────────────────

export interface Task {
  id: string;
  website: Website;
  contentType: ContentType;
  title: string;
  status: TaskStatus;
  priority: Priority;
  isOverdue: boolean;
  needsVeraReview: boolean;
  assignedTo: Role;

  // 小S fields
  keywords?: string;
  keywordSource?: string;
  skill?: string;
  aiOutputLink?: string;
  scriptLink?: string;
  seoArticleLink?: string;
  cta?: string;
  crmTags?: string;
  sDeadline?: string;
  reviewStatus?: string;

  // 小M fields
  videoType?: VideoType;
  editLevel?: EditLevel;
  materialId?: string;
  materialLink?: string;
  coverRequirements?: string;
  subtitleLanguage?: string;
  mDeadline?: string;
  finalVideoLink?: string;
  returnNotes?: string;

  // 小C fields
  targetUrl?: string;
  urlStatus?: string;
  needsNewPage?: boolean;
  lpBrief?: string;
  utmLink?: string;
  formStatus?: string;
  sitemapStatus?: string;
  gscStatus?: string;
  cDeadline?: string;
  techStatus?: string;
  blockReason?: string;

  // 小A — 广告投放 fields
  isAdTask?: boolean;
  adPlatform?: AdPlatform;
  adRegion?: string;
  adObjective?: string;
  adMaterialLink?: string;
  adCopyLink?: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  views?: number;           // 视频观看量
  cpv?: number;             // 每次观看成本
  whatsappClicks?: number;  // WhatsApp点击数
  formSubmits?: number;     // 表单提交数
  validInquiries?: number;  // 有效询盘（剔除无效）
  inquiries?: number;
  cpl?: number;
  conversionRate?: number;
  adStatus?: AdStatus;
  aDeadline?: string;
  dataFeedback?: string;
  adNextAction?: string;    // 小A下一步动作

  // Ad review / 广告复盘
  adPerformanceSummary?: string;  // 数据表现概述
  adIssues?: string;              // 问题判断
  adRecommendations?: string;     // 推荐动作
  veraAdDecision?: string;        // Vera最终决定
  veraAdDecisionAt?: string;

  // Result judgment
  hasInquiry?: boolean;
  inquiryCount?: number;
  relatedAdTaskId?: string;
  relatedLandingPage?: string;
  shouldScale?: boolean;
  needsCopyChange?: boolean;
  needsVideoChange?: boolean;
  needsLpChange?: boolean;
  shouldPauseAd?: boolean;

  // Vera fields
  riskType?: string;
  reviewLink?: string;
  veraComments?: string;

  // ── Phase 4: AI Risk Assessment ───────────────────────────────────────
  riskLevel?: RiskLevel;
  aiRiskScore?: number;          // 0–100
  riskLabels?: string[];         // e.g. ['价格风险', '时效风险']
  autoApproved?: boolean;        // AI auto-approved for queue
  isIntercepted?: boolean;       // AI system intercepted
  interceptReasons?: string[];   // reasons for interception
  autoApprovalTime?: string;
  approvalRulesHit?: string[];   // which rules triggered auto-approval
  aiDecision?: string;           // 'auto_approve' | 'vera_required' | 'intercept'
  aiDecisionReason?: string;
  humanDecision?: string;
  decisionTime?: string;
  decisionBy?: string;

  // ── Phase 4: Budget Control ───────────────────────────────────────────
  isBudgetTask?: boolean;
  budgetChangeType?: string;     // '加预算' | '新建预算' | '暂停预算' | '扩大投放' etc.
  budgetStatus?: BudgetStatus;
  proposedBudget?: number;
  currentBudget?: number;
  budgetNote?: string;

  // Common
  nextAssignee?: string;
  nextAction?: string;
  completionCriteria?: string;
  notes?: string[];
  opLog?: OpLogEntry[];
  createdAt: string;
  updatedAt: string;
}

// ─── Filter state ──────────────────────────────────────────────────────────

export interface FilterState {
  assignedTo: string;
  website: string;
  contentType: string;
  status: string;
  priority: string;
  isOverdue: boolean | null;
  needsVeraReview: boolean | null;
}

// ─── Label maps ────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  '01_AI_PENDING': 'AI待生成',
  '02_STRATEGY_REVIEW': '策略师待审',
  '03_CONVERSION_URL': '追踪师待确认',
  '04_MEDIA_EDIT': '制作师待剪辑',
  '05_STRATEGY_FINAL': '策略师待终审',
  '06_VERA_REVIEW': '负责人待审核',
  '07_PUBLISH_READY': '待发布',
  '08_PUBLISHED': '已发布',
  '09_DATA_REVIEW': '数据复盘',
  '10_COMPLETED': '已完成',
  '11_BLOCKED': '系统拦截',
  '12_AUTO_APPROVED': '自动放行',
  '99_REWORK': '暂停/返工',
};

export const RISK_LEVEL_STYLES: Record<RiskLevel, string> = {
  '低': 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
  '中': 'bg-amber-950/60 text-amber-300 border-amber-700/40',
  '高': 'bg-red-950/60 text-[#e88989] border-red-800/40',
};

export const RISK_LEVEL_DOT: Record<RiskLevel, string> = {
  '低': 'bg-emerald-400',
  '中': 'bg-amber-400',
  '高': 'bg-red-400',
};

export const AD_STATUS_COLORS: Record<AdStatus, string> = {
  '待建广告':          'bg-surface-700 text-surface-300 border-surface-600',
  '待审核素材':        'bg-amber-950 text-amber-300 border-amber-800',
  '待确认落地页':      'bg-cyan-950 text-cyan-300 border-cyan-800',
  '待上线':            'bg-blue-950 text-blue-300 border-blue-800',
  'AI建议预算':        'bg-blue-950/60 text-blue-300 border-blue-800/50',
  '等待Vera确认预算':  'bg-gold-900/30 text-gold-300 border-gold-700/50',
  'Vera已确认预算':    'bg-emerald-950 text-emerald-300 border-emerald-800',
  'Vera拒绝预算':      'bg-red-950 text-[#e88989] border-red-800/50',
  '投放中':            'bg-orange-950 text-orange-300 border-orange-800',
  '观察中':            'bg-cyan-950/60 text-cyan-300 border-cyan-800/50',
  '放大候选':          'bg-emerald-950/60 text-emerald-300 border-emerald-700/50',
  '暂停':              'bg-surface-800 text-surface-400 border-surface-600',
  '需优化':            'bg-red-950/60 text-[#e88989] border-red-800/50',
  '已结束':            'bg-surface-800 text-surface-500 border-surface-700',
};

export const PLATFORM_COLORS: Record<AdPlatform, string> = {
  'Google Ads':    'text-blue-400',
  'Yandex Direct': 'text-red-400',
  'VK Ads':        'text-blue-300',
  'TikTok Ads':    'text-surface-200',
  'YouTube Ads':   'text-red-300',
  'Meta Ads':      'text-blue-400',
};
