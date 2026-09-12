import { Phase, Snapshot, Task, publicationCalendar } from './domain';
export const PHASES:Phase[] = [
 {id:'S0',title:'准备与接入',goal:'先固定本轮做什么，找出现有工具和资料。',inputs:['总规范 V2.0','现有素材目录、账号与工具配置'],codex:['读取真实状态与 CONTINUE.md；不重复创建批次。','冻结五渠道、俄英语言、每周 4 母版 / 10 次发布、声音和验收标准。','检查生产电脑、素材、配音和发布入口；缺项只影响依赖任务。'],human:['提供已有素材所在位置；不需要重新整理整个素材库。','遇到不清楚的文件，说明哪个是当前可用版本。'],outputs:['本批配置快照','接入清单与缺项负责人','恢复入口'],checks:['重复启动不重复建任务','源素材只读，人工版本受保护','待确认事项有明确影响范围'],next:'Codex 进入 S1 选题；缺账号不挡研究。'},
 {id:'S1',title:'选题与验证',goal:'从客户采购问题确定本周两个母题。',inputs:['真实客户问题','已确认可承接业务','可取得的关键词证据'],codex:['先核实采购意图，再核实已有供货与服务能力。','区分真实数据、推断和未知搜索量；英文不擅自指定美国。','同时输出视频方向与对应 SEO 页面草稿。'],human:['只核对这些问题是否有真实画面可拍。','提示不适合公开的客户信息或没有画面的部分。'],outputs:['两个母题与证据','俄英表达方向','SEO 页面映射'],checks:['需求与业务能力一致','缺少搜索量写未知','没有为了流量扩产品、扩国家'],next:'Codex 带着母题去找可用素材。'},
 {id:'S2',title:'素材与任务',goal:'每条任务都有能剪出来的画面和明确交付物。',inputs:['本周两个母题','已有素材元数据','同行表达结构参考'],codex:['先查已有素材，再按实际镜头写脚本。','生成 4 条俄英短视频任务和 4 份配套内容。','每条提供入出点、字幕与中文对照、旁白、CTA、素材来源。'],human:['核对工件是否拍清、动作是否完整、文件能否打开。','只补被标出的镜头；如没有，写明缺什么及可用替代。'],outputs:['统一任务卡','可用镜头与补拍清单','原片、旁白、字幕、预览入口'],checks:['同母题俄英含义一致','任务类型和渠道正确','参数有来源，CTA 与问题一致'],next:'具备条件的任务进入 S3；只挂起缺料的任务。'},
 {id:'S3',title:'首条成片',goal:'先跑通 1 条真实 18 秒短片，计入首周四条。',inputs:['合格任务卡','真实素材与真实配音'],codex:['按 0–3 / 3–10 / 10–15 / 15–18 秒制作。','生成有字幕预览、无字母版、分轨、SRT 和中文对照。','完整解码，检查 1080×1920、30fps、540 帧、声音和字幕。'],human:['打开任务预览；有修订需求时看具体时间点。','按任务要求调整裁切、字幕或节奏，不擅自改主题。'],outputs:['真实成片与分轨剪辑包','带版本与文件指纹的技术报告'],checks:['真实画面和真实旁白','声音完整，CTA 可读','无虚构参数和示例联系方式'],next:'Codex 自动继续 S4 和其余预览；不另加首条老板审批。'},
 {id:'S4',title:'人工回传',goal:'剪辑师能接、能改、能交；改完不会被自动覆盖。',inputs:['一条需调整的预览','实际工程包与交接清单'],codex:['检查断点恢复、防重复、有限重试与迟到结果。','用 base_revision + edit_generation 核对回传版本。','新建人工修订，重新技术检查，保留人工当前版本。'],human:['领取当前任务，记录一个具体修改，如“4 秒处工件右移”。','在原有剪辑工具完成修改，导出 MP4 与实际工程 / 工程 ZIP。','交付后看回执：未收齐、待检查、需修订或已验收。'],outputs:['人工修订成片 + 实际工程','修改说明','回执与故障测试记录'],checks:['半文件不消费，旧版本不覆盖','重试不重复配音或发布','一次真实人工回传闭环完成'],next:'Codex 检查回传后更新当前版；其他任务继续生产。'},
 {id:'S5',title:'首周内容包',goal:'完成 4 条母版与 4 份配套内容，集中确认样式。',inputs:['S3 首条与其余任务','S4 必需测试记录'],codex:['只补齐余下 3 条短片；首条不重复计数。','逐件按内容类型检查，图文不套音频检查。','收拢俄英代表片、声音和图文样式，安排一次集中看样。'],human:['按任务卡完成观感抽查，不重复测编码等机器项目。','同一类问题一次写清；通过模板后仅抽检和处理异常。'],outputs:['4 条短视频母版','VK 参数图文、TG 两篇、LinkedIn 图文','集中看样记录'],checks:['俄英两种声音与字幕确认','每项文件完整、任务和版本一致','只对合格内容标可交付'],next:'Codex 生成 S6 发布包；需要老板时合并为一项决定。'},
 {id:'S6',title:'发布与承接',goal:'按五渠道日程发布，让询盘能被接住。',inputs:['可交付的明确成片版本','账号、授权与真实询盘入口','41 个计划槽位'],codex:['按 VK 3、TG 2、YT Shorts 2、IG 2、LinkedIn 1 展开每周计划。','核对文案、字幕、版本、链接和已有授权；生成可直接交付的发布包。','记录平台链接和结果；超时先核实，不盲目再发。'],human:['有人工发布任务时，按发布包上传并回填真实链接。','只在本地备好不算已发布；遇到账号缺项写明具体平台。'],outputs:['渠道专用文案和封面','日程与发布记录','询盘承接入口'],checks:['READY、导出、平台已发布分别记录','未授权或未接入只挂起对应动作','英文母版共用，YT / IG 发布记录独立'],next:'Codex 进入周反馈；缺一个平台不挡其他已就绪任务。'},
 {id:'S7',title:'每周复盘',goal:'看询盘质量，以固定频率进入下一周。',inputs:['真实发布链接与可得数据','询盘、报价和跟进反馈'],codex:['分别统计完成、异常、曝光与合格询盘。','没有数据写未知，不把缺数据说成 0 效果。','在已有主题范围内选下周两个问题；保留频率。'],human:['回填真实制作耗时、常见返工和难取得的镜头。','有客户提出具体问题时保留原始反馈。'],outputs:['一屏老板周报','下一周两个母题','模板和素材改进建议'],checks:['去重和归因口径一致','低曝光与低转化分开','不擅自日更或增加平台'],next:'日常复用 S2 / S3 / S5 / S6，不每周重建 S0 / S4。'},
 {id:'S8',title:'四周长视频',goal:'同一产品积累为一条可搜索、可销售转发的长片。',inputs:['同产品短片、原片、图纸画面','有依据的工程解说'],codex:['整合 3–5 分钟英文长片，目标 4 分钟。','复用现有流水线，按长片单独校验，不套 540 帧上限。','准备 YouTube、官网和销售转发复用包。'],human:['按采购问题、原件、处理过程、检验依据、下一步组织画面。','优先用原始横片；竖片留边，不拉伸或切掉工件。'],outputs:['1920×1080 长片','字幕、封面、章节与销售说明','第 4 周周日的发布记录'],checks:['同产品一致、无跨产品拼接冒充案例','时长 180–300 秒，完整播放','3 处复用不计 3 条独立长片'],next:'进入下一四周周期，保留已发布历史。'},
];
function task(id:string,title:string,language:'ru'|'en',kind:Task['kind'],status:Task['status'],owner:Task['owner'],channels:string[],reason:string):Task {
 return {id:`CYCLE01-W1-${id}`,title,language,kind,status,owner,channels,week:1,stage:kind==='short_video'?'S5':'S2',revision:2,edit_generation:1,reason,next_action:owner==='EDITOR'?'调整 4–7 秒的字幕位置，保留工件细节':'按本条类型完成检查与发布包',cta:id.includes('Q1')?'发来零件照片，说明使用需求':'发来图纸与数量，确认定制需求',input_refs:[{label:'交接包',value:'演练未附真实素材；接入后显示可下载的交接包'},{label:'字幕与中文对照',value:'演练示例：字幕不遮挡工件，含义与中文对照一致'},{label:'本次修改范围',value:reason}]};
}
export function demoSnapshot():Snapshot { return {
 schema_version:'tiger-workbench/1',source:'demo',cycle_id:'CYCLE01',plan_period:{timezone:'Asia/Shanghai'},generated_at:'2026-09-10T09:00:00Z',source_revision:1,spec_version:'V2.0',launch_date:'2026-09-14',current_stage:'S5',
 phases:PHASES.map((p,i)=>({id:p.id,status:i<4?'PASSED':i===4?'BLOCKED':i===5?'RUNNING':'WAITING',evidence:i<4?['演练示例：生产报告将在接入后显示']:[]})),
 tasks:[
 task('Q1-RU','有样品，没有图纸，怎样开始？','ru','short_video','NEEDS_EDIT','EDITOR',['VK'],'4–7 秒的字幕压住工件细节，需要上移；旁白与主题保持不变。'),
 task('Q1-EN','有样品，没有图纸，怎样开始？','en','short_video','TECH_PASSED','CODEX',['YouTube Shorts','Instagram Reels'],'技术检查完成，随俄语代表片集中看样。'),
 task('Q2-RU','按图小批量询价，需要准备什么？','ru','short_video','READY','CODEX',['VK'],'当前演练版本已就绪，等待发布条件。'),
 task('Q2-EN','按图小批量询价，需要准备什么？','en','short_video','READY','CODEX',['YouTube Shorts','Instagram Reels'],'英文母版用于两个平台，分别记录发布结果。'),
 task('VK-PARAMETER_POST','参数图文：照片与尺寸如何提供','ru','parameter_post','QUEUED','CODEX',['VK'],'参数必须来自真实资料。'),
 task('TELEGRAM-TECHNICAL_NOTE','技术短内容：给样品拍照的三个位置','ru','short_content','READY','CODEX',['Telegram'],'附件与询盘入口在发布前核对。'),
 task('TELEGRAM-CASE_OR_FAQ','采购答疑：小批量先提供哪些信息','ru','short_content','QUEUED','CODEX',['Telegram'],'案例若未获确认，保留为通用答疑。'),
 task('LINKEDIN-CAROUSEL_OR_POST','采购轮播：从图纸到需求确认','en','carousel_or_post','QUEUED','CODEX',['LinkedIn'],'清楚介绍 Tiger 协调与交付角色，不宣称自有工厂。'),
 ],publications:publicationCalendar(),metrics:{inquiries:null,qualified:null},
};}
export function emptySnapshot():Snapshot {return {...demoSnapshot(),source:'production',generated_at:'',source_revision:0,current_stage:'S0',tasks:[],phases:PHASES.map(p=>({id:p.id,status:'WAITING',evidence:[]}))};}
export const CODEX_PROMPT = `请在现有工业视频生产项目继续实施，使用 Tiger 总规范 V2.0 和本工作台交接说明。前台只有老板、Codex、剪辑师；不要恢复小S/小M/小C/小A/PM多角色流转。
先读 AGENTS.md、总规范、CONTINUE.md，再核对真实任务数据库与产物。从最早未完成且依赖已满足的步骤继续，不按看板列位置猜测阶段通过。
本轮固定：2母题/周 × 俄英 = 4短视频母版；VK3、Telegram2、YouTube Shorts2、Instagram Reels2、LinkedIn1，共10次/周；4周40常规+1条同产品3–5分钟长片。短片18秒，TikTok为0。不扩大产品、语言、渠道和频率。
Codex负责研究、素材匹配、制作、技术检验、状态更新、发布包和复盘。剪辑师只接具体任务、预览、改片、交文件。老板只确认首批合并样式与业务边界变化。
工作台读取同一生产状态的快照；不要另建可与SQLite互相覆盖的任务真源。导出workbench-snapshot.json采用src/workbench/domain.ts的协议。导入页面只检验结构，真实文件、技术QA和授权必须由生产端核实。
回传核对content_id、base_revision、edit_generation、文件大小和SHA256；原子收齐后回执。人工版受保护，旧回传不覆盖。未收到生产端ACK不得显示已验收。
本阶段通过后更新真实状态与CONTINUE.md，继续下一可执行项；普通修复无需反复请示，重试和修复上限沿用总规范。`;
