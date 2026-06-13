import type { Task, TaskStatus, Role, RiskLevel } from '../types';
import type { LoginRole } from '../types/session';
import { WEBSITES } from '../types';
import { roleFormalName as R } from '../config/roleDisplay';

export const DONE_STATUSES: TaskStatus[] = ['08_PUBLISHED', '10_COMPLETED'];
export const isDone = (t: Task) => DONE_STATUSES.includes(t.status);
export const isBlocked = (t: Task) => t.status === '99_REWORK' || t.status === '11_BLOCKED' || !!t.blockReason;

export const PIPELINE_STAGES: { label: string; statuses: TaskStatus[]; accent: ProgressItem['accent'] }[] = [
  { label: 'AI 草稿', statuses: ['01_AI_PENDING'], accent: 'blue' },
  { label: '内容审核', statuses: ['02_STRATEGY_REVIEW', '05_STRATEGY_FINAL'], accent: 'blue' },
  { label: '技术/剪辑', statuses: ['03_CONVERSION_URL', '04_MEDIA_EDIT'], accent: 'cyan' },
  { label: 'Vera 审核', statuses: ['06_VERA_REVIEW'], accent: 'gold' },
  { label: '待发布', statuses: ['07_PUBLISH_READY'], accent: 'emerald' },
  { label: '已闭环', statuses: ['08_PUBLISHED', '09_DATA_REVIEW', '10_COMPLETED'], accent: 'emerald' },
  { label: '异常', statuses: ['99_REWORK', '11_BLOCKED'], accent: 'red' },
];

const CONTENT_TYPES: { type: string; accent: ProgressItem['accent'] }[] = [
  { type: '短视频', accent: 'amber' },
  { type: '长视频', accent: 'amber' },
  { type: 'SEO文章', accent: 'blue' },
  { type: 'Landing Page', accent: 'cyan' },
  { type: '发布文案', accent: 'blue' },
  { type: '广告素材', accent: 'orange' },
  { type: 'URL检查', accent: 'cyan' },
  { type: '数据复盘', accent: 'emerald' },
];

const ROLE_PROGRESS_CONFIG: { role: Role; accent: ProgressItem['accent']; suffix?: string }[] = [
  { role: 'STRATEGY', accent: 'blue', suffix: '内容' },
  { role: 'MEDIA', accent: 'amber', suffix: '视频' },
  { role: 'CONVERSION', accent: 'cyan', suffix: '技术' },
  { role: 'ADS', accent: 'orange', suffix: '广告' },
  { role: 'VERA', accent: 'gold', suffix: '审核' },
];

function shortSite(site: string): string {
  return site
    .replace('tigersourcingchina', 'TSC')
    .replace('tigerlogisticschina', 'TLC')
    .replace('tiger-logistics', 'TLR')
    .replace('tiger-poisk', 'TPR')
    .replace('oz-logistics', 'OZL')
    .replace('.com', '')
    .replace('.ru', '');
}

export interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  accent: 'red' | 'gold' | 'orange' | 'emerald' | 'blue' | 'cyan' | 'amber' | 'surface';
}

export interface ProgressItem {
  label: string;
  done: number;
  total: number;
  accent: 'gold' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'orange' | 'red';
  extra?: string;
}

export interface GlobalTaskStats {
  total: number;
  completed: number;
  completionPct: number;
  inProgress: number;
  overdue: number;
  blocked: number;
  veraPending: number;
  budgetPending: number;
  highRisk: number;
  autoApproved: number;
  intercepted: number;
  byStatus: { label: string; count: number; accent: string }[];
  byRole: ProgressItem[];
  riskDist: Record<RiskLevel, number>;
}

export function computeGlobalStats(tasks: Task[]): GlobalTaskStats {
  const total = tasks.length;
  const completed = tasks.filter(isDone).length;
  const blocked = tasks.filter(isBlocked).length;
  const overdue = tasks.filter((t) => t.isOverdue).length;
  const inProgress = tasks.filter((t) => !isDone(t) && !isBlocked(t)).length;
  const veraPending = tasks.filter((t) => t.status === '06_VERA_REVIEW').length;
  const budgetPending = tasks.filter((t) => t.isBudgetTask && t.budgetStatus === '等待Vera确认预算').length;
  const highRisk = tasks.filter((t) => t.riskLevel === '高').length;
  const autoApproved = tasks.filter((t) => t.autoApproved || t.status === '12_AUTO_APPROVED').length;
  const intercepted = tasks.filter((t) => t.isIntercepted || t.status === '11_BLOCKED').length;

  const riskDist: Record<RiskLevel, number> = { 低: 0, 中: 0, 高: 0 };
  tasks.forEach((t) => { if (t.riskLevel) riskDist[t.riskLevel]++; });

  const statusGroups: { label: string; statuses: TaskStatus[]; accent: string }[] = [
    { label: 'AI 草稿', statuses: ['01_AI_PENDING'], accent: 'text-surface-400' },
    { label: '内容审核', statuses: ['02_STRATEGY_REVIEW', '05_STRATEGY_FINAL'], accent: 'text-blue-400' },
    { label: '技术/剪辑', statuses: ['03_CONVERSION_URL', '04_MEDIA_EDIT'], accent: 'text-cyan-400' },
    { label: 'Vera 审核', statuses: ['06_VERA_REVIEW'], accent: 'text-gold-400' },
    { label: '待发布', statuses: ['07_PUBLISH_READY'], accent: 'text-lime-400' },
    { label: '已闭环', statuses: ['08_PUBLISHED', '09_DATA_REVIEW', '10_COMPLETED'], accent: 'text-emerald-400' },
    { label: '异常', statuses: ['99_REWORK', '11_BLOCKED'], accent: 'text-red-400' },
  ];

  const byStatus = statusGroups.map((g) => ({
    label: g.label,
    count: tasks.filter((t) => g.statuses.includes(t.status)).length,
    accent: g.accent,
  }));

  const execRoles: Role[] = ['STRATEGY', 'MEDIA', 'CONVERSION', 'ADS'];
  const byRole: ProgressItem[] = execRoles.map((role) => {
    const roleTasks = tasks.filter((t) => t.assignedTo === role);
    return {
      label: R(role),
      done: roleTasks.filter(isDone).length,
      total: roleTasks.length,
      accent: role === 'STRATEGY' ? 'blue' : role === 'MEDIA' ? 'amber' : role === 'CONVERSION' ? 'cyan' : 'orange',
      extra: roleTasks.filter((t) => t.isOverdue).length > 0 ? `${roleTasks.filter((t) => t.isOverdue).length}逾期` : undefined,
    };
  });

  return {
    total,
    completed,
    completionPct: total > 0 ? Math.round((completed / total) * 100) : 0,
    inProgress,
    overdue,
    blocked,
    veraPending,
    budgetPending,
    highRisk,
    autoApproved,
    intercepted,
    byStatus,
    byRole,
    riskDist,
  };
}

export function computeExecutorStats(tasks: Task[], role: LoginRole): StatItem[] {
  const mine = tasks.filter((t) => {
    if (role === 'ADS') return !!t.isAdTask || t.assignedTo === 'ADS';
    return t.assignedTo === role;
  });

  switch (role) {
    case 'STRATEGY':
      return [
        { label: '待处理', value: tasks.filter((t) => ['01_AI_PENDING', '02_STRATEGY_REVIEW'].includes(t.status)).length, accent: 'blue' },
        { label: '待终审', value: tasks.filter((t) => t.status === '05_STRATEGY_FINAL').length, accent: 'blue' },
        { label: '待发布', value: tasks.filter((t) => t.status === '07_PUBLISH_READY' && t.assignedTo === 'STRATEGY').length, accent: 'gold' },
        { label: '待复盘', value: tasks.filter((t) => t.status === '09_DATA_REVIEW' && t.assignedTo === 'STRATEGY').length, accent: 'emerald' },
        { label: '逾期', value: mine.filter((t) => t.isOverdue).length, accent: 'red' },
        { label: '本周完成', value: mine.filter(isDone).length, sub: `共 ${mine.length} 条`, accent: 'emerald' },
      ];
    case 'MEDIA':
      return [
        { label: '待剪辑', value: tasks.filter((t) => t.status === '04_MEDIA_EDIT').length, accent: 'amber' },
        { label: '返工', value: tasks.filter((t) => t.status === '99_REWORK' && t.assignedTo === 'MEDIA').length, accent: 'red' },
        { label: '逾期', value: mine.filter((t) => t.isOverdue).length, accent: 'red' },
        { label: '已提交', value: tasks.filter((t) => ['05_STRATEGY_FINAL', '06_VERA_REVIEW', '07_PUBLISH_READY'].includes(t.status) && t.finalVideoLink).length, accent: 'emerald' },
      ];
    case 'CONVERSION':
      return [
        { label: '待确认链接', value: tasks.filter((t) => t.status === '03_CONVERSION_URL').length, accent: 'cyan' },
        { label: '待配 UTM', value: tasks.filter((t) => t.status === '07_PUBLISH_READY' && !t.utmLink).length, accent: 'cyan' },
        { label: '追踪就绪', value: tasks.filter((t) => !!t.utmLink && t.urlStatus === '已确认').length, accent: 'emerald' },
        { label: '逾期', value: mine.filter((t) => t.isOverdue).length, accent: 'red' },
      ];
    case 'ADS': {
      const adTasks = tasks.filter((t) => t.isAdTask || t.contentType === '广告素材' || t.contentType === '广告预算');
      const spent = adTasks.reduce((s, t) => s + (t.spent || 0), 0);
      const inquiries = adTasks.reduce((s, t) => s + (t.validInquiries || t.inquiries || 0), 0);
      return [
        { label: '筹备中', value: adTasks.filter((t) => ['01_AI_PENDING', '02_STRATEGY_REVIEW', '03_CONVERSION_URL'].includes(t.status)).length, accent: 'orange' },
        { label: '待批预算', value: adTasks.filter((t) => t.status === '06_VERA_REVIEW' && t.isBudgetTask).length, accent: 'gold' },
        { label: '投放中', value: adTasks.filter((t) => t.adStatus === '投放中').length, accent: 'orange' },
        { label: '待复盘', value: adTasks.filter((t) => t.status === '09_DATA_REVIEW').length, accent: 'emerald' },
        { label: '总花费', value: `$${spent.toLocaleString()}`, sub: inquiries > 0 ? `CPL ≈ $${Math.round(spent / inquiries)}` : undefined, accent: 'surface' },
      ];
    }
    case 'PM': {
      const g = computeGlobalStats(tasks);
      return [
        { label: 'AI 草稿', value: tasks.filter((t) => t.status === '01_AI_PENDING').length, accent: 'surface' },
        { label: '阻塞', value: g.blocked, accent: 'red' },
        { label: '进行中', value: g.inProgress, accent: 'gold' },
        { label: `待${R('VERA')}`, value: g.veraPending, accent: 'gold' },
        { label: '本周闭环', value: g.completed, sub: `完成率 ${g.completionPct}%`, accent: 'emerald' },
      ];
    }
    default:
      return [];
  }
}

export function computeVeraStats(tasks: Task[]): StatItem[] {
  const g = computeGlobalStats(tasks);
  return [
    { label: '系统总任务', value: g.total, sub: '全局可见', accent: 'surface' },
    { label: '整体完成率', value: `${g.completionPct}%`, sub: `${g.completed}/${g.total} 已闭环`, accent: 'emerald' },
    { label: '待我审核', value: g.veraPending, sub: g.budgetPending > 0 ? `含 ${g.budgetPending} 条预算` : undefined, accent: 'gold' },
    { label: '阻塞/拦截', value: g.blocked, accent: 'red' },
    { label: '逾期任务', value: g.overdue, accent: 'red' },
    { label: '高风险', value: g.highRisk, sub: `中风险 ${g.riskDist['中']} · 低风险 ${g.riskDist['低']}`, accent: 'orange' },
  ];
}

export function computeDetailedRoleProgress(tasks: Task[]): ProgressItem[] {
  return ROLE_PROGRESS_CONFIG.map(({ role, accent, suffix }) => {
    const roleTasks = tasks.filter((t) => t.assignedTo === role);
    const overdue = roleTasks.filter((t) => t.isOverdue).length;
    const blocked = roleTasks.filter(isBlocked).length;
    return {
      label: suffix ? `${R(role)} · ${suffix}` : R(role),
      done: roleTasks.filter(isDone).length,
      total: roleTasks.length,
      accent,
      extra: overdue > 0 ? `逾期${overdue}` : blocked > 0 ? `阻塞${blocked}` : undefined,
    };
  });
}

export function computeWebsiteProgress(tasks: Task[]): ProgressItem[] {
  return WEBSITES.map((site) => {
    const siteTasks = tasks.filter((t) => t.website === site);
    const overdue = siteTasks.filter((t) => t.isOverdue).length;
    return {
      label: shortSite(site),
      done: siteTasks.filter(isDone).length,
      total: siteTasks.length,
      accent: 'gold',
      extra: overdue > 0 ? `逾期${overdue}` : undefined,
    };
  });
}

export function computeContentTypeProgress(tasks: Task[]): ProgressItem[] {
  return CONTENT_TYPES
    .map(({ type, accent }) => {
      const ct = tasks.filter((t) => t.contentType === type);
      return {
        label: type,
        done: ct.filter(isDone).length,
        total: ct.length,
        accent,
      };
    })
    .filter((item) => item.total > 0);
}

export function computePipelineDistribution(tasks: Task[]): { label: string; count: number; accent: ProgressItem['accent'] }[] {
  return PIPELINE_STAGES.map((stage) => ({
    label: stage.label,
    count: tasks.filter((t) => stage.statuses.includes(t.status)).length,
    accent: stage.accent,
  }));
}

export function computeRiskProgress(tasks: Task[]): { level: RiskLevel; count: number; accent: ProgressItem['accent'] }[] {
  const dist: Record<RiskLevel, number> = { 低: 0, 中: 0, 高: 0 };
  tasks.forEach((t) => { if (t.riskLevel) dist[t.riskLevel]++; });
  return (['低', '中', '高'] as RiskLevel[]).map((level) => ({
    level,
    count: dist[level],
    accent: level === '低' ? 'emerald' : level === '中' ? 'amber' : 'red',
  }));
}

export function findWorstWebsite(tasks: Task[]): string | null {
  let minPct = 101;
  let name: string | null = null;
  for (const site of WEBSITES) {
    const siteTasks = tasks.filter((t) => t.website === site);
    if (siteTasks.length === 0) continue;
    const pct = siteTasks.filter(isDone).length / siteTasks.length;
    if (pct < minPct) {
      minPct = pct;
      name = shortSite(site);
    }
  }
  return name;
}
