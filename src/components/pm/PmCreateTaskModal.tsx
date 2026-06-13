import { useState, useEffect } from 'react';
import { X, PlusCircle } from 'lucide-react';
import type { ContentType, Priority, Role, Task, Website } from '../../types';
import { WEBSITES } from '../../types';
import type { ManualTaskCreateInput, TaskEntryMode } from '../../services/taskStore';
import { createTask } from '../../services/taskApi';
import { roleFormalName as R } from '../../config/roleDisplay';

const CONTENT_TYPES: ContentType[] = [
  '短视频', '长视频', 'SEO文章', 'Landing Page', 'URL检查',
  '素材整理', '发布文案', '数据复盘', '广告素材', '客户案例', '广告预算',
];

const AD_PLATFORMS = [
  'Google Ads', 'Yandex Direct', 'VK Ads', 'TikTok Ads', 'YouTube Ads', 'Meta Ads',
] as const;

const ASSIGN_ROLES: Role[] = ['STRATEGY', 'MEDIA', 'CONVERSION', 'ADS'];

interface PmCreateTaskModalProps {
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const inputClass =
  'w-full bg-surface-800 border border-surface-600 rounded px-3 py-2 text-sm text-surface-100 focus:outline-none focus:border-gold-500/50';

const labelClass = 'text-[10px] uppercase tracking-widest text-surface-500 block mb-1';

export function PmCreateTaskModal({ onClose, onCreated }: PmCreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [website, setWebsite] = useState<Website>(WEBSITES[0]);
  const [contentType, setContentType] = useState<ContentType>('短视频');
  const [priority, setPriority] = useState<Priority>('B');
  const [entryMode, setEntryMode] = useState<TaskEntryMode>('dispatch_strategy');
  const [assignTo, setAssignTo] = useState<Role>('STRATEGY');
  const [needsVeraReview, setNeedsVeraReview] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'低' | '中' | '高'>('低');
  const [keywords, setKeywords] = useState('');
  const [scriptLink, setScriptLink] = useState('');
  const [materialLink, setMaterialLink] = useState('');
  const [aiOutputLink, setAiOutputLink] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [lpBrief, setLpBrief] = useState('');
  const [completionCriteria, setCompletionCriteria] = useState('');
  const [note, setNote] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isAdTask, setIsAdTask] = useState(false);
  const [adPlatform, setAdPlatform] = useState<(typeof AD_PLATFORMS)[number]>('Google Ads');
  const [proposedBudget, setProposedBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVideo = contentType === '短视频' || contentType === '长视频';
  const isPage = contentType === 'Landing Page' || contentType === 'URL检查';
  const isAdContent = isAdTask || contentType === '广告素材' || contentType === '广告预算';

  useEffect(() => {
    if (contentType === '客户案例') setNeedsVeraReview(true);
    if (contentType === '广告素材' || contentType === '广告预算') setIsAdTask(true);
  }, [contentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const input: ManualTaskCreateInput = {
        title,
        website,
        contentType,
        priority,
        entryMode,
        assignTo: entryMode === 'assign_direct' ? assignTo : undefined,
        needsVeraReview,
        riskLevel,
        keywords: keywords || undefined,
        scriptLink: scriptLink || undefined,
        materialLink: materialLink || undefined,
        aiOutputLink: aiOutputLink || undefined,
        targetUrl: targetUrl || undefined,
        lpBrief: lpBrief || undefined,
        completionCriteria: completionCriteria || undefined,
        note: note || undefined,
        deadline: deadline || undefined,
        isAdTask: isAdContent,
        adPlatform: isAdContent ? adPlatform : undefined,
        proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
      };
      const task = await createTask(input, 'PM');
      onCreated(task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="关闭" />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-surface-900 border border-surface-700 rounded-t-xl sm:rounded-xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-700 bg-surface-900/95 backdrop-blur">
          <div className="flex items-center gap-2">
            <PlusCircle size={18} className="text-gold-400" />
            <div>
              <p className="text-sm font-semibold text-surface-100">人工发布任务</p>
              <p className="text-[10px] text-surface-500">录入后将进入对应流程环节，执行人可在工作台处理</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-surface-500 hover:text-surface-300 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 录入方式 */}
          <fieldset>
            <legend className={labelClass}>录入方式</legend>
            <div className="grid sm:grid-cols-3 gap-2">
              {([
                ['ai_draft', 'AI 草稿池', '先进入草稿，稍后派发'],
                ['dispatch_strategy', '派发策略师', '直接进入策略师待审'],
                ['assign_direct', '指定负责人', '跳过前置，直达执行环节'],
              ] as const).map(([mode, label, hint]) => (
                <label
                  key={mode}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    entryMode === mode
                      ? 'border-gold-500/40 bg-gold-400/5'
                      : 'border-surface-700 hover:border-surface-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="entryMode"
                    value={mode}
                    checked={entryMode === mode}
                    onChange={() => setEntryMode(mode)}
                    className="sr-only"
                  />
                  <p className="text-xs font-medium text-surface-200">{label}</p>
                  <p className="text-[10px] text-surface-500 mt-0.5">{hint}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {entryMode === 'assign_direct' && (
            <div>
              <label className={labelClass}>指定负责人</label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value as Role)}
                className={inputClass}
              >
                {ASSIGN_ROLES.map((r) => (
                  <option key={r} value={r}>{R(r)}</option>
                ))}
              </select>
            </div>
          )}

          {/* 基本信息 */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>任务标题 *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：义乌采购代理服务短视频"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>目标网站</label>
              <select value={website} onChange={(e) => setWebsite(e.target.value as Website)} className={inputClass}>
                {WEBSITES.map((w: Website) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>内容类型</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className={inputClass}
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>优先级</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
                <option value="A">A 级 · 紧急</option>
                <option value="B">B 级 · 常规</option>
                <option value="C">C 级 · 低优</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>截止日期</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* 风险与审核 */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>风险等级</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as '低' | '中' | '高')}
                className={inputClass}
              >
                <option value="低">低风险</option>
                <option value="中">中风险</option>
                <option value="高">高风险</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs text-surface-400 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={needsVeraReview}
                onChange={(e) => setNeedsVeraReview(e.target.checked)}
                className="rounded border-surface-600"
              />
              需 {R('VERA')} 审核（客户案例默认勾选）
            </label>
          </div>

          {/* 内容 brief */}
          <div className="space-y-3 border-t border-surface-800 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-surface-500">内容 Brief（选填）</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={labelClass}>关键词 / 选题方向</label>
                <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>脚本 / 文案链接</label>
                <input type="url" value={scriptLink} onChange={(e) => setScriptLink(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>AI 输出 / 初稿链接</label>
                <input type="url" value={aiOutputLink} onChange={(e) => setAiOutputLink(e.target.value)} className={inputClass} />
              </div>
              {isVideo && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>素材链接</label>
                  <input type="url" value={materialLink} onChange={(e) => setMaterialLink(e.target.value)} className={inputClass} />
                </div>
              )}
              {isPage && (
                <>
                  <div>
                    <label className={labelClass}>目标 URL 路径</label>
                    <input type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="/landing-page" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>页面 Brief</label>
                    <input type="text" value={lpBrief} onChange={(e) => setLpBrief(e.target.value)} className={inputClass} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 广告 */}
          {isAdContent && (
            <div className="space-y-3 border-t border-surface-800 pt-3">
              <label className="flex items-center gap-2 text-xs text-surface-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdTask}
                  onChange={(e) => setIsAdTask(e.target.checked)}
                  className="rounded border-surface-600"
                />
                标记为广告任务
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>广告平台</label>
                  <select
                    value={adPlatform}
                    onChange={(e) => setAdPlatform(e.target.value as (typeof AD_PLATFORMS)[number])}
                    className={inputClass}
                  >
                    {AD_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>申请预算 (USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={proposedBudget}
                    onChange={(e) => setProposedBudget(e.target.value)}
                    placeholder="填写后需 Vera 审批"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>验收标准</label>
            <textarea
              value={completionCriteria}
              onChange={(e) => setCompletionCriteria(e.target.value)}
              rows={2}
              placeholder="如：成片含中俄字幕，前3秒有钩子，CTA 指向询价表单"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1 sticky bottom-0 bg-surface-900 pb-1">
            <button type="submit" disabled={loading} className="btn-gold px-5 py-2.5 flex-1 sm:flex-none">
              {loading ? '发布中...' : '确认发布任务'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost px-5 py-2.5">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
