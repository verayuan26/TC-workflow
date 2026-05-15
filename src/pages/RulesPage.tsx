import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react';

interface Rule {
  id: string;
  condition: string;
  example?: string;
}

interface RuleCategory {
  key: 'auto_approve' | 'vera_required' | 'intercept';
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  headerClass: string;
  badgeClass: string;
  rules: Rule[];
}

const RULE_CATEGORIES: RuleCategory[] = [
  {
    key: 'auto_approve',
    label: '自动放行',
    sublabel: 'Auto-Approve',
    icon: <CheckCircle2 size={18} />,
    headerClass: 'border-emerald-700/40 bg-emerald-950/30',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/40',
    rules: [
      { id: 'A1', condition: 'AI风险评分 ≤ 30，且无价格风险标签', example: '例：常规SEO文章，无敏感词，评分18' },
      { id: 'A2', condition: '内容类型为"数据复盘"，评分 ≤ 40', example: '例：月度广告数据汇总报告' },
      { id: 'A3', condition: '内容类型为"素材整理"，评分 ≤ 35', example: '例：视频封面图素材包整理' },
      { id: 'A4', condition: '同一网站同类型内容已连续通过 ≥ 3 次，且评分 ≤ 40', example: '例：tiger-logistics.ru的常规SEO文章' },
      { id: 'A5', condition: '优先级为C，内容类型为"发布文案"，评分 ≤ 25', example: '例：标准格式的社媒文案，无促销信息' },
    ],
  },
  {
    key: 'vera_required',
    label: 'Vera必须审核',
    sublabel: 'Vera-Required',
    icon: <AlertTriangle size={18} />,
    headerClass: 'border-gold-700/40 bg-gold-900/20',
    badgeClass: 'bg-gold-900/30 text-gold-300 border-gold-700/40',
    rules: [
      { id: 'V1', condition: 'AI风险评分 31–79（中等风险区间）', example: '例：包含竞品比较内容，评分52' },
      { id: 'V2', condition: '内容包含价格信息（任何金额/费率/折扣）', example: '例：报价页面、运费计算器页面' },
      { id: 'V3', condition: '内容类型为"广告预算"（所有预算变更）', example: '例：Google Ads加预算申请' },
      { id: 'V4', condition: '涉及竞品名称或品牌对比', example: '例：提及"比DHL便宜30%"' },
      { id: 'V5', condition: '内容包含时效承诺（交货期/运输时间）', example: '例："3天到达莫斯科"的承诺表述' },
      { id: 'V6', condition: 'riskLabels中含"客户数据风险"或"法律风险"', example: '例：涉及客户案例中含公司名称' },
      { id: 'V7', condition: '优先级为A，内容类型为Landing Page', example: '例：A级落地页，流量入口核心页面' },
    ],
  },
  {
    key: 'intercept',
    label: '系统拦截',
    sublabel: 'Auto-Intercept',
    icon: <XCircle size={18} />,
    headerClass: 'border-red-800/50 bg-red-950/30',
    badgeClass: 'bg-red-950/60 text-[#e88989] border-red-800/50',
    rules: [
      { id: 'I1', condition: 'AI风险评分 ≥ 80（高风险，强制拦截）', example: '例：评分92，含虚假资质声明' },
      { id: 'I2', condition: '内容包含未经授权的第三方品牌LOGO或商标', example: '例：使用UPS/DHL官方徽标' },
      { id: 'I3', condition: '涉及政治敏感内容或违禁词（俄罗斯市场）', example: '例：涉及制裁敏感词汇' },
      { id: 'I4', condition: '检测到虚假认证或夸大资质声明', example: '例："全球最大物流平台"等无依据声明' },
      { id: 'I5', condition: '内容含个人隐私数据（身份证/护照号/银行账户）', example: '例：测试数据中含真实客户证件号' },
    ],
  },
];

const SCORE_ZONES = [
  { range: '0–30', label: '低风险', color: 'bg-emerald-500', textColor: 'text-emerald-300', action: '自动放行（满足A规则时）' },
  { range: '31–79', label: '中等风险', color: 'bg-amber-500', textColor: 'text-amber-300', action: 'Vera人工审核' },
  { range: '80–100', label: '高风险', color: 'bg-red-500', textColor: 'text-[#e88989]', action: '系统强制拦截' },
];

export function RulesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-surface-100">AI自动审批规则</h2>
        <p className="text-xs text-surface-400 mt-1">系统基于以下规则对每条内容任务进行风险评分，并自动执行分流决策。所有规则由Vera配置，每季度复盘一次。</p>
      </div>

      {/* Risk Score Legend */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-surface-400" />
          <p className="text-xs font-semibold text-surface-200">AI风险评分区间说明</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SCORE_ZONES.map((zone) => (
            <div key={zone.range} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${zone.color}`} />
                <span className={`text-xs font-semibold ${zone.textColor}`}>{zone.range}</span>
                <span className="text-[10px] text-surface-400">{zone.label}</span>
              </div>
              <p className="text-[10px] text-surface-500 pl-4">{zone.action}</p>
            </div>
          ))}
        </div>
        {/* Score bar */}
        <div className="mt-3 flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="flex-none w-[30%] bg-emerald-600/70 rounded-l-full" />
          <div className="flex-1 bg-amber-600/70" />
          <div className="flex-none w-[20%] bg-red-600/70 rounded-r-full" />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-surface-600">0</span>
          <span className="text-[9px] text-surface-600">30</span>
          <span className="text-[9px] text-surface-600">79</span>
          <span className="text-[9px] text-surface-600">100</span>
        </div>
      </div>

      {/* Rule categories */}
      <div className="space-y-4">
        {RULE_CATEGORIES.map((cat) => (
          <div key={cat.key} className={`card border ${cat.headerClass} overflow-hidden`}>
            {/* Category header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700/50">
              <span className={`inline-flex items-center gap-1.5 border rounded-full text-xs font-semibold px-3 py-1 ${cat.badgeClass}`}>
                {cat.icon}
                {cat.label}
              </span>
              <span className="text-[10px] text-surface-500">{cat.sublabel}</span>
              <span className="ml-auto text-[10px] text-surface-500">{cat.rules.length} 条规则</span>
            </div>

            {/* Rules list */}
            <div className="divide-y divide-surface-700/30">
              {cat.rules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-800/40 transition-colors">
                  <span className="flex-shrink-0 mt-0.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-surface-700/60 text-[10px] font-bold text-surface-300">
                      {rule.id}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-surface-200 leading-snug">{rule.condition}</p>
                    {rule.example && (
                      <div className="flex items-center gap-1 mt-1">
                        <ChevronRight size={10} className="text-surface-600 flex-shrink-0" />
                        <p className="text-[10px] text-surface-500">{rule.example}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 p-3 bg-surface-800/40 border border-surface-700/40 rounded-lg">
        <p className="text-[10px] text-surface-500 leading-relaxed">
          <span className="text-surface-400 font-medium">注意：</span>
          规则按优先级顺序执行——拦截规则（I类）优先于Vera审核规则（V类）优先于自动放行规则（A类）。
          当多条规则同时命中时，以最高风险等级的结果为准。所有AI决策均记录在任务操作日志中，供审计追溯。
        </p>
      </div>
    </div>
  );
}
