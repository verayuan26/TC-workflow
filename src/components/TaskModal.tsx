import { X, ExternalLink, AlertTriangle, CheckCircle, RotateCcw, PauseCircle, Clock, TrendingUp, TrendingDown, DollarSign, MousePointer, MessageSquare, Bot, CheckCircle2, XCircle, Zap, BarChart2, Activity } from 'lucide-react';
import type { Task, AdStatus } from '../types';
import { AD_STATUS_COLORS, PLATFORM_COLORS, RISK_LEVEL_STYLES, RISK_LEVEL_DOT } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

function Field({ label, value, link }: { label: string; value?: string | boolean | null; link?: boolean }) {
  if (!value && value !== false) return null;
  const strVal = String(value);
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-surface-500 mb-0.5">{label}</dt>
      <dd className="text-sm text-surface-200 break-all">
        {link && strVal.startsWith('http') ? (
          <a href={strVal} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 flex items-center gap-1">
            打开链接 <ExternalLink size={11} />
          </a>
        ) : (
          strVal
        )}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
        <span className="flex-1 h-px bg-gold-500/10" />
        {title}
        <span className="flex-1 h-px bg-gold-500/10" />
      </h4>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
    </div>
  );
}

function AdStatusBadge({ status }: { status?: AdStatus }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded-full px-2 py-0.5 ${AD_STATUS_COLORS[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

function ResultFlag({ show, label, color }: { show?: boolean; label: string; color: string }) {
  if (!show) return null;
  return <span className={`inline-flex text-[10px] border rounded px-1.5 py-0.5 font-medium ${color}`}>{label}</span>;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-surface-900 border border-surface-700 sm:rounded-xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-surface-700 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-surface-400">{task.id}</span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} size="md" />
              {task.adStatus && <AdStatusBadge status={task.adStatus} />}
              {task.isOverdue && (
                <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                  <AlertTriangle size={12} />逾期
                </span>
              )}
              {task.needsVeraReview && (
                <span className="text-[10px] text-gold-400 border border-gold-500/30 rounded-full px-2 py-0.5">需Vera审核</span>
              )}
            </div>
            <h2 className="text-base font-semibold text-surface-100 leading-snug max-w-lg">{task.title}</h2>
            <p className="text-xs text-surface-400 mt-0.5">{task.website} · {task.contentType}</p>
          </div>
          <button onClick={onClose} className="text-surface-500 hover:text-surface-200 transition-colors ml-3 mt-0.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* 基本信息 */}
          <Section title="基本信息">
            <Field label="主推网站" value={task.website} />
            <Field label="内容类型" value={task.contentType} />
            <Field label="负责人" value={task.assignedTo} />
            <Field label="内容等级" value={task.priority ? `${task.priority}级` : undefined} />
          </Section>

          {/* 广告投放信息 */}
          {task.isAdTask && (
            <Section title="广告投放">
              {task.adPlatform && (
                <div>
                  <dt className="text-[10px] uppercase tracking-widest text-surface-500 mb-0.5">广告平台</dt>
                  <dd className={`text-sm font-semibold ${PLATFORM_COLORS[task.adPlatform] || 'text-surface-200'}`}>{task.adPlatform}</dd>
                </div>
              )}
              <Field label="投放地区" value={task.adRegion} />
              <Field label="广告目标" value={task.adObjective} />
              <Field label="月预算" value={task.budget !== undefined ? `$${task.budget.toLocaleString()} USD` : undefined} />
              <Field label="广告素材链接" value={task.adMaterialLink} link />
              <Field label="广告文案链接" value={task.adCopyLink} link />
              <Field label="落地页URL" value={task.targetUrl} />
              <Field label="UTM链接" value={task.utmLink} link />
            </Section>
          )}

          {/* 广告数据 */}
          {task.isAdTask && (task.spent !== undefined || task.impressions !== undefined) && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />广告数据<span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700/50">
                {[
                  { label: '花费', value: task.spent !== undefined ? `$${task.spent}` : undefined, icon: <DollarSign size={12} /> },
                  { label: '展示量', value: task.impressions?.toLocaleString(), icon: <TrendingUp size={12} /> },
                  { label: '点击量', value: task.clicks?.toLocaleString(), icon: <MousePointer size={12} /> },
                  { label: '询盘数', value: task.inquiries, icon: <MessageSquare size={12} /> },
                  { label: 'CTR', value: task.ctr !== undefined ? `${task.ctr}%` : undefined, icon: <TrendingUp size={12} /> },
                  { label: 'CPC', value: task.cpc !== undefined ? `$${task.cpc}` : undefined, icon: <DollarSign size={12} /> },
                  { label: 'CPL', value: task.cpl !== undefined ? `$${task.cpl}` : undefined, icon: <TrendingDown size={12} /> },
                  { label: '转化率', value: task.conversionRate !== undefined ? `${task.conversionRate}%` : undefined, icon: <TrendingUp size={12} /> },
                ].filter((m) => m.value !== undefined && m.value !== null).map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center gap-1 text-surface-500 mb-0.5">{m.icon}<span className="text-[9px] uppercase tracking-widest">{m.label}</span></div>
                    <p className="text-sm font-bold text-surface-200">{String(m.value)}</p>
                  </div>
                ))}
              </div>
              {task.dataFeedback && (
                <div className="mt-2 px-3 py-2 bg-surface-800 border border-surface-700 rounded text-xs text-surface-400">
                  <span className="text-surface-300 font-medium">数据反馈：</span>{task.dataFeedback}
                </div>
              )}
            </div>
          )}

          {/* 结果判断 */}
          {task.isAdTask && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />结果判断<span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="flex flex-wrap gap-2">
                <ResultFlag show={task.shouldScale} label="值得继续放大" color="bg-emerald-500/10 text-emerald-300 border-emerald-500/30" />
                <ResultFlag show={task.needsCopyChange} label="需要改文案" color="bg-amber-500/10 text-amber-300 border-amber-500/30" />
                <ResultFlag show={task.needsVideoChange} label="需要改视频" color="bg-orange-500/10 text-orange-300 border-orange-500/30" />
                <ResultFlag show={task.needsLpChange} label="需要改Landing Page" color="bg-red-500/10 text-red-300 border-red-500/30" />
                <ResultFlag show={task.shouldPauseAd} label="建议暂停投放" color="bg-surface-700 text-surface-400 border-surface-600" />
                {!task.shouldScale && !task.needsCopyChange && !task.needsVideoChange && !task.needsLpChange && !task.shouldPauseAd && (
                  <span className="text-xs text-surface-500">暂无结果判断</span>
                )}
              </div>
            </div>
          )}

          {/* 广告数据扩展指标 */}
          {task.isAdTask && (task.views !== undefined || task.whatsappClicks !== undefined || task.formSubmits !== undefined || task.validInquiries !== undefined) && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />
                <Activity size={11} className="text-gold-500/70" />
                深度效果指标
                <span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700/50">
                {[
                  { label: '视频观看量', value: task.views?.toLocaleString() },
                  { label: 'CPV', value: task.cpv !== undefined ? `$${task.cpv}` : undefined },
                  { label: 'WhatsApp点击', value: task.whatsappClicks },
                  { label: '表单提交', value: task.formSubmits },
                  { label: '有效询盘', value: task.validInquiries },
                  { label: '下一步动作', value: task.adNextAction },
                ].filter((m) => m.value !== undefined && m.value !== null).map((m) => (
                  <div key={m.label}>
                    <p className="text-[9px] uppercase tracking-widest text-surface-500 mb-0.5">{m.label}</p>
                    <p className="text-sm font-bold text-surface-200">{String(m.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 广告复盘区 */}
          {task.isAdTask && (task.adPerformanceSummary || task.adIssues || task.adRecommendations || task.veraAdDecision) && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />
                <BarChart2 size={11} className="text-gold-500/70" />
                广告复盘分析
                <span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="space-y-3 p-3 bg-surface-800/50 border border-surface-700/50 rounded-lg">
                {task.adPerformanceSummary && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-surface-500 mb-1">数据表现</p>
                    <p className="text-xs text-surface-300 leading-relaxed">{task.adPerformanceSummary}</p>
                  </div>
                )}
                {task.adIssues && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-amber-500/70 mb-1">问题判断</p>
                    <p className="text-xs text-amber-300/80 leading-relaxed">{task.adIssues}</p>
                  </div>
                )}
                {task.adRecommendations && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-blue-500/70 mb-1">推荐动作</p>
                    <p className="text-xs text-blue-300/80 leading-relaxed">{task.adRecommendations}</p>
                  </div>
                )}
                {task.veraAdDecision && (
                  <div className="pt-2 border-t border-surface-700/40">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[9px] uppercase tracking-widest text-gold-500/70">Vera最终决定</p>
                      {task.veraAdDecisionAt && <span className="text-[9px] text-surface-600 ml-auto">{task.veraAdDecisionAt}</span>}
                    </div>
                    <p className="text-xs text-gold-300 font-medium leading-relaxed">{task.veraAdDecision}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 非广告任务的询盘信息 */}
          {!task.isAdTask && task.hasInquiry && (
            <Section title="询盘结果">
              <Field label="是否产生询盘" value={task.hasInquiry ? '是' : '否'} />
              <Field label="询盘数量" value={task.inquiryCount !== undefined ? String(task.inquiryCount) : undefined} />
              <Field label="关联广告任务" value={task.relatedAdTaskId} />
              <Field label="关联落地页" value={task.relatedLandingPage} />
            </Section>
          )}

          {/* 内容/关键词 */}
          {(task.keywords || task.keywordSource || task.skill || task.cta || task.crmTags) && (
            <Section title="内容与关键词">
              <Field label="关键词" value={task.keywords} />
              <Field label="关键词来源" value={task.keywordSource} />
              <Field label="使用Skill" value={task.skill} />
              <Field label="CTA" value={task.cta} />
              <Field label="CRM标签" value={task.crmTags} />
              <Field label="审核状态" value={task.reviewStatus} />
            </Section>
          )}

          {/* 链接资源 */}
          {(task.aiOutputLink || task.scriptLink || task.seoArticleLink || task.materialLink || task.finalVideoLink || task.reviewLink) && (
            <Section title="链接资源">
              <Field label="AI输出链接" value={task.aiOutputLink} link />
              <Field label="脚本链接" value={task.scriptLink} link />
              <Field label="SEO文章链接" value={task.seoArticleLink} link />
              <Field label="素材链接" value={task.materialLink} link />
              <Field label="成片链接" value={task.finalVideoLink} link />
              <Field label="审核链接" value={task.reviewLink} link />
            </Section>
          )}

          {/* 视频剪辑 */}
          {(task.videoType || task.editLevel || task.materialId) && (
            <Section title="视频与剪辑">
              <Field label="视频类型" value={task.videoType} />
              <Field label="剪辑等级" value={task.editLevel} />
              <Field label="素材编号" value={task.materialId} />
              <Field label="封面要求" value={task.coverRequirements} />
              <Field label="字幕语言" value={task.subtitleLanguage} />
              {task.returnNotes && <Field label="返工意见" value={task.returnNotes} />}
            </Section>
          )}

          {/* 技术/URL */}
          {!task.isAdTask && (task.targetUrl || task.urlStatus) && (
            <Section title="技术与链接">
              <Field label="目标页面URL" value={task.targetUrl} />
              <Field label="URL状态" value={task.urlStatus} />
              <Field label="需要新页面" value={task.needsNewPage !== undefined ? (task.needsNewPage ? '是' : '否') : undefined} />
              <Field label="UTM链接" value={task.utmLink || '待生成'} />
              <Field label="表单/WhatsApp状态" value={task.formStatus} />
              <Field label="Sitemap状态" value={task.sitemapStatus} />
              <Field label="GSC/Yandex状态" value={task.gscStatus} />
              <Field label="技术完成状态" value={task.techStatus} />
              {task.lpBrief && <Field label="LP Brief" value={task.lpBrief} />}
            </Section>
          )}

          {/* 风险与审核 */}
          {task.riskType && (
            <Section title="风险与Vera审核">
              <Field label="风险类型" value={task.riskType} />
              {task.veraComments && <Field label="Vera审核意见" value={task.veraComments} />}
            </Section>
          )}

          {/* 阻塞 */}
          {task.blockReason && (
            <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[10px] uppercase tracking-widest text-red-400 mb-1">阻塞原因</p>
              <p className="text-sm text-red-200">{task.blockReason}</p>
            </div>
          )}

          {/* 截止时间 */}
          {(task.mDeadline || task.sDeadline || task.cDeadline || task.aDeadline) && (
            <Section title="截止时间">
              {task.mDeadline && <DeadlineField label="小M截止" date={task.mDeadline} overdue={task.isOverdue && task.assignedTo === 'MEDIA'} />}
              {task.sDeadline && <DeadlineField label="小S截止" date={task.sDeadline} overdue={task.isOverdue && task.assignedTo === 'STRATEGY'} />}
              {task.cDeadline && <DeadlineField label="小C截止" date={task.cDeadline} overdue={task.isOverdue && task.assignedTo === 'CONVERSION'} />}
              {task.aDeadline && <DeadlineField label="小A截止" date={task.aDeadline} overdue={task.isOverdue && task.assignedTo === 'ADS'} />}
            </Section>
          )}

          {/* 下一步 */}
          {(task.nextAssignee || task.nextAction || task.completionCriteria) && (
            <Section title="下一步">
              <Field label="下一步负责人" value={task.nextAssignee} />
              <Field label="下一步动作" value={task.nextAction} />
              {task.completionCriteria && (
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-widest text-surface-500 mb-0.5">完成标准</dt>
                  <dd className="text-sm text-surface-200">{task.completionCriteria}</dd>
                </div>
              )}
            </Section>
          )}

          {/* 历史备注 */}
          {task.notes && task.notes.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />历史备注<span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="space-y-2">
                {task.notes.map((note, i) => (
                  <div key={i} className="flex gap-2 text-xs text-surface-400">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-surface-600 flex-shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI决策记录 */}
          {(task.aiDecision || task.riskLevel || task.isIntercepted || task.autoApproved) && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />
                <Bot size={11} className="text-gold-500/70" />
                AI决策记录
                <span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="p-3 bg-surface-800/50 border border-surface-700/50 rounded-lg space-y-3">
                {/* Decision result */}
                <div className="flex items-center gap-3">
                  {task.autoApproved && (
                    <span className="inline-flex items-center gap-1.5 border rounded-full text-[10px] font-semibold px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border-emerald-700/40">
                      <Zap size={10} />自动放行
                    </span>
                  )}
                  {task.isIntercepted && (
                    <span className="inline-flex items-center gap-1.5 border rounded-full text-[10px] font-semibold px-2.5 py-1 bg-red-950/60 text-[#e88989] border-red-800/40">
                      <XCircle size={10} />系统拦截
                    </span>
                  )}
                  {!task.autoApproved && !task.isIntercepted && task.aiDecision === 'vera_required' && (
                    <span className="inline-flex items-center gap-1.5 border rounded-full text-[10px] font-semibold px-2.5 py-1 bg-gold-900/30 text-gold-300 border-gold-700/40">
                      <AlertTriangle size={10} />需Vera审核
                    </span>
                  )}
                  {task.riskLevel && (
                    <span className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-medium px-2.5 py-1 ${RISK_LEVEL_STYLES[task.riskLevel]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${RISK_LEVEL_DOT[task.riskLevel]}`} />
                      {task.riskLevel}风险
                      {task.aiRiskScore != null && <span className="opacity-70">· {task.aiRiskScore}分</span>}
                    </span>
                  )}
                </div>

                {task.aiDecisionReason && (
                  <p className="text-[10px] text-surface-400">{task.aiDecisionReason}</p>
                )}

                {/* Risk labels */}
                {task.riskLabels && task.riskLabels.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-surface-600 mb-1">风险标签</p>
                    <div className="flex flex-wrap gap-1">
                      {task.riskLabels.map((label) => (
                        <span key={label} className="text-[10px] bg-surface-700 text-surface-400 border border-surface-600 rounded px-1.5 py-0.5">{label}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules hit */}
                {task.approvalRulesHit && task.approvalRulesHit.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-surface-600 mb-1">命中规则</p>
                    <div className="flex flex-wrap gap-1">
                      {task.approvalRulesHit.map((rule) => (
                        <span key={rule} className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 rounded px-1.5 py-0.5">
                          <CheckCircle2 size={8} className="inline mr-0.5" />{rule}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Intercept reasons */}
                {task.interceptReasons && task.interceptReasons.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-surface-600 mb-1">拦截原因</p>
                    <div className="space-y-1">
                      {task.interceptReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#e88989]">
                          <XCircle size={10} className="flex-shrink-0 mt-0.5" />
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Human decision */}
                {task.humanDecision && (
                  <div className="flex items-center gap-2 pt-1 border-t border-surface-700/40">
                    <span className="text-[9px] uppercase tracking-widest text-surface-600">人工决定</span>
                    <span className="text-[10px] text-surface-300 font-medium">{task.humanDecision}</span>
                    {task.decisionBy && <span className="text-[10px] text-surface-500">· {task.decisionBy}</span>}
                    {task.decisionTime && <span className="text-[10px] text-surface-600 ml-auto">{task.decisionTime}</span>}
                  </div>
                )}

                {/* Auto-approval time */}
                {task.autoApprovalTime && (
                  <div className="flex items-center gap-2 text-[10px] text-surface-500">
                    <Clock size={10} />
                    自动放行时间：{task.autoApprovalTime}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 操作日志 */}
          {task.opLog && task.opLog.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-gold-500/70 font-semibold mb-3 flex items-center gap-2">
                <span className="flex-1 h-px bg-gold-500/10" />操作日志<span className="flex-1 h-px bg-gold-500/10" />
              </h4>
              <div className="relative pl-4 space-y-0">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-surface-700/60" />
                {task.opLog.map((entry, i) => (
                  <div key={i} className="relative pb-3 last:pb-0">
                    <div className="absolute -left-3 top-1 w-2 h-2 rounded-full bg-surface-700 border border-surface-600" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-[9px] text-surface-600 flex-shrink-0 font-mono">{entry.time}</span>
                      <span className="text-[10px] text-surface-300">{entry.action}</span>
                      <span className="text-[9px] text-surface-500 ml-auto flex-shrink-0">{entry.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-surface-700 px-5 py-3 flex gap-2 flex-wrap flex-shrink-0 bg-surface-900">
          {task.status === '06_VERA_REVIEW' && (
            <>
              <button className="btn-gold flex items-center gap-1"><CheckCircle size={12} />通过</button>
              <button className="btn-danger flex items-center gap-1"><RotateCcw size={12} />退回</button>
              <button className="btn-ghost flex items-center gap-1"><PauseCircle size={12} />暂停发布</button>
            </>
          )}
          {task.status === '04_MEDIA_EDIT' && (
            <>
              <button className="btn-gold">提交成片</button>
              <button className="btn-ghost">需要补充素材</button>
              <button className="btn-ghost">标记完成</button>
            </>
          )}
          {(task.status === '02_STRATEGY_REVIEW' || task.status === '05_STRATEGY_FINAL') && (
            <>
              <button className="btn-gold flex items-center gap-1"><CheckCircle size={12} />审核通过</button>
              <button className="btn-danger flex items-center gap-1"><RotateCcw size={12} />退回修改</button>
            </>
          )}
          {task.status === '03_CONVERSION_URL' && (
            <>
              <button className="btn-gold">填写页面URL</button>
              <button className="btn-ghost">提交UTM</button>
              <button className="btn-ghost">标记技术完成</button>
              <button className="btn-danger">标记阻塞</button>
            </>
          )}
          {task.isAdTask && task.adStatus === '投放中' && (
            <>
              <button className="btn-gold flex items-center gap-1"><TrendingUp size={12} />提交广告数据</button>
              <button className="btn-ghost flex items-center gap-1"><PauseCircle size={12} />暂停广告</button>
              <button className="btn-ghost">提交复盘</button>
            </>
          )}
          {task.isAdTask && task.adStatus === '需优化' && (
            <>
              <button className="btn-gold">标记投放中</button>
              <button className="btn-ghost">提交复盘</button>
            </>
          )}
          <button onClick={onClose} className="btn-ghost ml-auto">关闭</button>
        </div>
      </div>
    </div>
  );
}

function DeadlineField({ label, date, overdue }: { label: string; date: string; overdue?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-surface-500 mb-0.5">{label}</dt>
      <dd className={`text-sm flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-surface-200'}`}>
        <Clock size={11} />{date}
      </dd>
    </div>
  );
}
