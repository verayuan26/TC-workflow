import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Task, Workstream } from '../types';
import { MOCK_PM_BRIEFS, MOCK_TASK_DRAFTS } from '../services/mockData';

interface PanghuPMProps { tasks: Task[] }

const WORKSTREAM_LABELS: { key: Workstream | 'Vera'; label: string }[] = [
  { key: 'S', label: '小 S / SEO & Content' },
  { key: 'M', label: '小 M / Video & Social' },
  { key: 'C', label: '小 C / Tech & Codex' },
  { key: 'Ads', label: '广告小 A / Ads' },
  { key: 'Vera', label: 'Vera / Review' },
];

function Card({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-3 border border-surface-700">
      <p className="text-[9px] uppercase tracking-widest text-surface-500">{title}</p>
      <p className="text-xl font-bold text-surface-100 mt-1">{value}</p>
      {sub && <p className="text-[10px] text-surface-500 mt-1">{sub}</p>}
    </div>
  );
}

export function PanghuPM({ tasks }: PanghuPMProps) {
  const weeklyGoals = useMemo(() => tasks.filter((t) => !!t.weeklyGoal), [tasks]);

  const workstreamStats = useMemo(() => {
    return WORKSTREAM_LABELS.map((w) => {
      const count = w.key === 'Vera'
        ? tasks.filter((t) => t.assignedTo === 'Vera' || t.needsVeraReview).length
        : tasks.filter((t) => t.workstream === w.key).length;
      return { ...w, count };
    });
  }, [tasks]);

  const riskTasks = useMemo(() => tasks.filter((t) =>
    t.needsVeraReview ||
    !!t.sensitiveReviewFlags?.length ||
    t.buildStatus === 'failed' ||
    t.status === '99_暂停/返工' ||
    t.contentReviewStatus === 'pending'
  ), [tasks]);

  const aiStats = useMemo(() => ({
    codex: tasks.filter((t) => t.needsCodex).length,
    bolt: tasks.filter((t) => t.needsBolt).length,
    chatgpt: tasks.filter((t) => t.needsExternalAI).length,
  }), [tasks]);

  const adFeedback = useMemo(() => tasks.filter((t) => t.isAdTask || t.workstream === 'Ads' || !!t.adPlatform), [tasks]);

  const crmStories = useMemo(() => tasks.filter((t) =>
    !!t.crmFeedbackSummary || !!t.realCustomerStorySnippet || !!t.suggestedContentUse
  ), [tasks]);

  const groupedRepurpose = useMemo(() => {
    const map: Record<string, Task[]> = {
      wechat_article: [], seo_article: [], landing_page: [], video_script: [], vk_post: [], internal_only: [],
    };
    crmStories.forEach((t) => {
      const key = t.suggestedContentUse || 'internal_only';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [crmStories]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-surface-100">胖虎总控台 / Tiger Growth PM</h2>
        <p className="text-xs text-surface-500 mt-1">轻量运营监管系统：任务分发、执行监管、Vera审核与反馈追踪。</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card title="本周 Brief 数量" value={MOCK_PM_BRIEFS.length} />
        <Card title="已拆解任务数" value={MOCK_TASK_DRAFTS.length} />
        <Card title="已分发任务数" value={tasks.filter((t)=>t.distributionStatus==='distributed').length} />
        <Card title="Vera待审核" value={tasks.filter((t)=>t.needsVeraReview || t.externalAIReviewStatus==='pending').length} />
        <Card title="外部工具协作" value={tasks.filter((t)=>t.needsCodex||t.needsBolt||t.needsExternalAI).length} />
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">本周目标区</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Card title="本周目标任务数" value={weeklyGoals.length} sub="weeklyGoal 非空" />
        </div>
        <div className="card p-3 border border-surface-700">
          <p className="text-xs text-surface-300 mb-2">前 3 条 weeklyGoal</p>
          <ul className="space-y-1.5">
            {weeklyGoals.slice(0, 3).map((t) => <li key={t.id} className="text-xs text-surface-400">• {t.weeklyGoal}</li>)}
            {weeklyGoals.length === 0 && <li className="text-xs text-surface-600">暂无</li>}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">五条运营执行线概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {workstreamStats.map((w) => <Card key={w.key} title={w.label} value={w.count} />)}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">任务阻塞与风险区</h3>
        <div className="card p-3 border border-red-800/40 bg-red-950/10">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={14} className="text-red-400" /><p className="text-xs text-red-300">风险任务 {riskTasks.length} 条</p></div>
          <div className="space-y-1.5">
            {riskTasks.slice(0, 8).map((t) => <p key={t.id} className="text-xs text-surface-300">{t.id} · {t.title}</p>)}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">AI 工具介入概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card title="需要 Codex" value={aiStats.codex} sub="needsCodex = true" />
          <Card title="需要 Bolt" value={aiStats.bolt} sub="needsBolt = true" />
          <Card title="需要 External AI" value={aiStats.chatgpt} sub="needsExternalAI = true" />
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">广告反馈概览</h3>
        <div className="space-y-2">
          {adFeedback.slice(0, 8).map((t) => (
            <div key={t.id} className="card p-3 border border-surface-700">
              <p className="text-xs text-surface-200">{t.title}</p>
              <p className="text-[10px] text-surface-500 mt-1">{t.adPlatform || '-'} · spend: {t.spent ?? '-'} · clicks: {t.clicks ?? '-'} · cpl: {t.cpl ?? '-'}</p>
              <p className="text-[10px] text-surface-500 mt-1">lead: {t.leadCount ?? '-'} · qualified: {t.qualifiedLeadCount ?? '-'} · highIntent: {t.highIntentLeadCount ?? '-'} · invalid: {t.invalidLeadCount ?? '-'}</p>
              <p className="text-[10px] text-surface-500 mt-1">nextOptimizationAction: {t.nextOptimizationAction || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">CRM Feedback & Real Stories</h3>
        <div className="space-y-2">
          {crmStories.map((t) => (
            <div key={t.id} className="card p-3 border border-surface-700">
              <p className="text-xs text-surface-200">{t.crmFeedbackSummary || t.title}</p>
              <p className="text-[10px] text-surface-500 mt-1">story: {t.realCustomerStorySnippet || '-'}</p>
              <p className="text-[10px] text-surface-500 mt-1">question: {t.customerQuestion || '-'} · objection: {t.customerObjection || '-'}</p>
              <p className="text-[10px] text-surface-500 mt-1">source: {t.storySource || t.crmSource || '-'} · privacy: {t.storyPrivacyLevel || '-'} · permission: {t.storyUsagePermission || '-'}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-surface-500 uppercase tracking-widest mb-3">Content Repurposing Queue for 小 S</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(groupedRepurpose).map(([key, items]) => (
            <div key={key} className="card p-3 border border-surface-700">
              <p className="text-xs text-surface-300 mb-2">{key} ({items.length})</p>
              <div className="space-y-2">
                {items.slice(0, 3).map((t) => {
                  const requiresReview =
                    t.storyPrivacyLevel === 'internal_only' ||
                    t.storyUsagePermission !== 'approved' ||
                    !!t.sensitiveReviewFlags?.length;
                  return (
                    <div key={t.id} className="text-[10px] text-surface-400 border border-surface-800 rounded p-2">
                      <p>story: {t.realCustomerStorySnippet || '-'}</p>
                      <p>Q: {t.customerQuestion || '-'} | Objection: {t.customerObjection || '-'}</p>
                      <p>use: {t.suggestedContentUse || '-'} | privacy: {t.storyPrivacyLevel || '-'} | permission: {t.storyUsagePermission || '-'}</p>
                      <p className={requiresReview ? 'text-gold-300' : 'text-emerald-300'}>{requiresReview ? '需要 Vera/人工审核' : '可进入内容生产'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
