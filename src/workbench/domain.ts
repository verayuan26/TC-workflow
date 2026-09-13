export type Actor = 'EDITOR' | 'CODEX' | 'BOSS';
export type Kind = 'short_video' | 'parameter_post' | 'carousel_or_post' | 'short_content' | 'long_video';
export type TaskStatus = 'NEEDS_EDIT' | 'NEEDS_ASSET' | 'QUEUED' | 'RUNNING' | 'TECH_PASSED' | 'READY' | 'FAILED' | 'REVIEW_REQUIRED';
export type PhaseStatus = 'WAITING' | 'RUNNING' | 'PASSED' | 'BLOCKED';
export interface Phase { id: string; title: string; goal: string; codex: string[]; human: string[]; inputs: string[]; outputs: string[]; checks: string[]; next: string; }
export interface WorkArtifact { key:string; label:string; kind:string; filename:string; size_bytes?:number; download_url?:string; }
export interface WorkAsset { asset_id:string; filename:string; nas_path:string; usage:string; in_out:string; semantic_match_reason?:string; download_url?:string; }
export interface StoryboardShot { time:string; visual:string; voiceover:string; on_screen_text:string; edit_note:string; }
export interface WorkPackage {
  schema_version:'tiger-editor-work-package/1';
  status:'READY_FOR_EDITOR'|'INCOMPLETE';
  objective:string;
  output_spec:string[];
  script:{voiceover:string;zh_translation:string;hook:string;body:string;cta:string};
  voice?:{provider:string;profile_name:string;profile_id:string;agent_key:string;job_id:string;duration_ms:number;script_sha256:string;audio_url?:string};
  subtitles?:{timing_status:string;srt_url?:string;zh_srt_url?:string};
  assets:WorkAsset[];
  storyboard:StoryboardShot[];
  artifacts:WorkArtifact[];
  evidence_boundary:string;
}
export interface Task { id: string; title: string; language: 'ru' | 'en'; kind: Kind; week: number; status: TaskStatus; stage: string; revision: number; edit_generation: number; owner: Actor; next_action: string; reason: string; channels: string[]; cta: string; input_refs: {label: string; value: string}[]; preview_url?: string; package_url?: string; work_package?:WorkPackage; due_at?: string; claim?: {claimant_member_id:string;base_revision:number;edit_generation:number;claimed_at:string}; qa?: {revision:number;report_ref:string;status:'PASSED'|'FAILED'}; }
export interface PhaseRecord { id: string; status: PhaseStatus; evidence: string[]; }
export interface Publication { id: string; week: number; date: string; time: string; timezone: 'Europe/Moscow' | 'UTC'; channel: string; language: 'ru' | 'en'; label: string; content_id: string; status: 'PLANNED' | 'SCHEDULED' | 'PUBLISHED' | 'BLOCKED' | 'UNKNOWN'; published_url?: string; revision?: number; }
export interface Snapshot { schema_version: 'tiger-workbench/1'; source: 'demo' | 'production'; cycle_id: string; config_version?: number; plan_period: {timezone: 'Asia/Shanghai'}; generated_at: string; source_revision: number; spec_version: 'V2.0'; launch_date: string; current_stage: string; phases: PhaseRecord[]; tasks: Task[]; publications: Publication[]; metrics: {inquiries: number | null; qualified: number | null}; }
export const KIND_LABEL: Record<Kind,string> = {short_video:'短视频',parameter_post:'参数图文',carousel_or_post:'轮播 / 图文',short_content:'短内容',long_video:'长视频'};
export const STATUS_LABEL: Record<TaskStatus,string> = {NEEDS_EDIT:'待你修改',NEEDS_ASSET:'待补素材',QUEUED:'等待制作',RUNNING:'Codex 处理中',TECH_PASSED:'技术已通过',READY:'可交付',FAILED:'处理异常',REVIEW_REQUIRED:'待集中看样'};
export const PHASE_LABEL: Record<PhaseStatus,string> = {WAITING:'未开始',RUNNING:'进行中',PASSED:'已检验',BLOCKED:'待解决'};
export const PUB_LABEL: Record<Publication['status'],string> = {PLANNED:'计划槽位',SCHEDULED:'已设定时',PUBLISHED:'已发布',BLOCKED:'待解决',UNKNOWN:'结果待核实'};
export const ACTOR_LABEL: Record<Actor,string> = {EDITOR:'剪辑师',CODEX:'Codex',BOSS:'老板'};
export function isEditorReadyTask(task:Task):boolean {
  return task.owner==='EDITOR'&&task.kind==='short_video'&&task.revision>=2&&task.work_package?.status==='READY_FOR_EDITOR';
}
export const CHANNELS = [
  {name:'VK',language:'俄语',count:3,role:'冷启动 · 曝光 · 私信获客',format:'2 条短视频 + 1 篇参数图文'},
  {name:'Telegram',language:'俄语',count:2,role:'技术资料 · 老客 · 私信承接',format:'2 条短内容'},
  {name:'YouTube Shorts',language:'英文',count:2,role:'可搜索的视频资产',format:'2 条短视频'},
  {name:'Instagram Reels',language:'英文',count:2,role:'品牌展示与触达',format:'复用 2 条英文母版'},
  {name:'LinkedIn',language:'英文',count:1,role:'B2B 信任 · 采购人群',format:'1 条轮播 / 图文'},
];
const SLOTS = [
  [0,'VK','Q1短片','ru','13:00','Europe/Moscow','Q1-RU'],
  [1,'YouTube Shorts','Q1短片','en','13:00','UTC','Q1-EN'],
  [1,'Telegram','技术短内容','ru','18:30','Europe/Moscow','TELEGRAM-TECHNICAL_NOTE'],
  [2,'VK','参数图文','ru','13:00','Europe/Moscow','VK-PARAMETER_POST'],
  [2,'Instagram Reels','Q1短片','en','14:00','UTC','Q1-EN'],
  [3,'LinkedIn','采购轮播 / 图文','en','12:00','UTC','LINKEDIN-CAROUSEL_OR_POST'],
  [4,'VK','Q2短片','ru','13:00','Europe/Moscow','Q2-RU'],
  [4,'YouTube Shorts','Q2短片','en','13:00','UTC','Q2-EN'],
  [5,'Instagram Reels','Q2短片','en','14:00','UTC','Q2-EN'],
  [5,'Telegram','案例 / 答疑','ru','18:30','Europe/Moscow','TELEGRAM-CASE_OR_FAQ'],
] as const;
export function dayPlus(date:string, offset:number):string { const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10); }
export function publicationCalendar(launch='2026-09-14',cycleId='CYCLE01'):Publication[] {
  const rows:Publication[]=[];
  for(let week=1;week<=4;week++)for(const [day,channel,label,language,time,timezone,suffix] of SLOTS)rows.push({id:`P${String(rows.length+1).padStart(3,'0')}`,week,date:dayPlus(launch,(week-1)*7+day),time,timezone,channel,language,label,content_id:`${cycleId}-W${week}-${suffix}`,status:'PLANNED'});
  rows.push({id:'P041',week:4,date:dayPlus(launch,27),time:'13:00',timezone:'UTC',channel:'YouTube',language:'en',label:'同产品长视频 · 3–5 分钟',content_id:`LONG-${cycleId}-EN`,status:'PLANNED'});
  return rows;
}
export function shanghaiTime(row:Publication):string {
  const d=new Date(`${row.date}T${row.time}:00${row.timezone==='Europe/Moscow'?'+03:00':'Z'}`);
  return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
}
export function taskChecklist(kind:Kind):string[] {
  if(kind==='short_video')return ['工件与动作完整，裁切不丢主体','俄 / 英字幕与中文对照含义一致，最多两行','18 秒完整播放，旁白未截断，CTA 在 15–18 秒可读','已保留实际工程文件和修订说明'];
  if(kind==='long_video')return ['全片围绕同一产品，来源和参数可追溯','横版 3–5 分钟，画面不拉伸','图纸、工程讲解、字幕与实物一致','已保留实际工程文件和修订说明'];
  if(kind==='short_content')return ['语言与渠道一致，文字无乱码','技术事实有依据，未添加价格或交期承诺','附件与询盘入口可用，一个主要行动','已保留最终正文及修改说明'];
  return ['参数有依据，未增加无证据的精度或性能','图文 / 页序完整，手机上文字可读','语言、品牌身份和询盘行动一致','已保留源文件与最终图片 / PDF'];
}
export function safeUrl(value?:string):string|undefined { if(!value)return undefined;if(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\'))return value;try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:undefined;}catch{return undefined;} }
export function validateSnapshot(input:unknown,previous?:Snapshot):Snapshot {
  if(!input||typeof input!=='object')throw new Error('请选择 Codex 导出的工作台快照。');
  const s=input as Snapshot;
  if(s.schema_version!=='tiger-workbench/1'||s.spec_version!=='V2.0'||s.source!=='production'||!/^CYCLE\d+$/.test(s.cycle_id))throw new Error('快照版本或周期不匹配；演练数据不能导入为实际进度。');
  if(s.plan_period?.timezone!=='Asia/Shanghai'||!Number.isInteger(s.source_revision)||s.source_revision<1||!Number.isFinite(Date.parse(s.generated_at))||Date.parse(s.generated_at)>Date.now()+300000)throw new Error('快照的时区、版本或更新时间无效。');
  if(previous&&s.source_revision<=previous.source_revision)throw new Error('这是重复或过期快照，保留当前进度。');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s.launch_date)||!Number.isFinite(Date.parse(s.launch_date))||new Date(s.launch_date+'T00:00:00Z').getUTCDay()!==1||dayPlus(s.launch_date,0)!==s.launch_date)throw new Error('启动日须为有效的星期一；不要零散移动固定周计划。');
  if(!Array.isArray(s.phases)||s.phases.length!==9||new Set(s.phases.map(p=>p.id)).size!==9||!s.phases.some(p=>p.id===s.current_stage))throw new Error('须保留 S0–S8 各自的真实检验记录。');
  for(const p of s.phases)if(!/^S[0-8]$/.test(p.id)||!['WAITING','RUNNING','PASSED','BLOCKED'].includes(p.status)||!Array.isArray(p.evidence)||p.evidence.some(x=>typeof x!=='string')||(p.status==='PASSED'&&p.evidence.filter(x=>x.trim()).length===0))throw new Error('阶段通过必须附检验报告，不能由任务列位置推算。');
  if(!Array.isArray(s.tasks)||s.tasks.length>100||new Set(s.tasks.map(t=>t.id)).size!==s.tasks.length)throw new Error('任务清单无效或包含重复任务。');
  const expected=publicationCalendar(s.launch_date,s.cycle_id);
  for(const t of s.tasks){
    const slots=expected.filter(p=>p.content_id===t.id);
    if(!slots.length||!slots.every(p=>p.language===t.language)||t.week!==slots[0].week||!/^S[0-8]$/.test(t.stage)||!Number.isInteger(t.revision)||t.revision<1||!Number.isInteger(t.edit_generation)||t.edit_generation<0||!Object.keys(STATUS_LABEL).includes(t.status)||!Object.keys(ACTOR_LABEL).includes(t.owner)||!Object.keys(KIND_LABEL).includes(t.kind))throw new Error(`任务 ${t.id} 的语言、状态、类型或版本不符合合同。`);
    if(['TECH_PASSED','READY'].includes(t.status)&&(!t.qa||t.qa.status!=='PASSED'||t.qa.revision!==t.revision||typeof t.qa.report_ref!=='string'||!t.qa.report_ref.trim()))throw new Error('可交付内容必须有对应版本的技术检验报告。');
    const expectedKind=t.id.startsWith('LONG-')?'long_video':t.id.includes('PARAMETER_POST')?'parameter_post':t.id.includes('CAROUSEL_OR_POST')?'carousel_or_post':t.id.includes('TELEGRAM')?'short_content':'short_video';
    if(t.kind!==expectedKind||!Array.isArray(t.channels)||t.channels.slice().sort().join('|')!==slots.map(p=>p.channel).sort().join('|'))throw new Error(`任务 ${t.id} 的类型或渠道已改变。`);
    if([t.title,t.next_action,t.reason,t.cta].some(x=>typeof x!=='string'||x.length>5000)||!Array.isArray(t.input_refs)||t.input_refs.some(x=>typeof x.label!=='string'||typeof x.value!=='string'))throw new Error('任务缺少可读的操作说明或素材入口。');
    if((t.preview_url&&!safeUrl(t.preview_url))||(t.package_url&&!safeUrl(t.package_url)))throw new Error('预览和交接包只接受 http/https 链接。');
    if(t.work_package){
      const w=t.work_package;
      if(w.schema_version!=='tiger-editor-work-package/1'||!['READY_FOR_EDITOR','INCOMPLETE'].includes(w.status)||typeof w.objective!=='string'||!Array.isArray(w.output_spec)||!w.script||typeof w.script.voiceover!=='string'||typeof w.script.zh_translation!=='string'||!Array.isArray(w.assets)||!Array.isArray(w.storyboard)||!Array.isArray(w.artifacts))throw new Error(`任务 ${t.id} 的剪辑工作包无效。`);
      for(const url of [w.voice?.audio_url,w.subtitles?.srt_url,w.subtitles?.zh_srt_url,...w.assets.map(a=>a.download_url),...w.artifacts.map(a=>a.download_url)])if(url&&!safeUrl(url))throw new Error(`任务 ${t.id} 的工作包链接无效。`);
    }
  }
  if(!Array.isArray(s.publications)||s.publications.length!==41||new Set(s.publications.map(p=>p.id)).size!==41)throw new Error('日历必须是 40 个常规槽位 + 1 条长视频。');
  for(const e of expected){const p=s.publications.find(x=>x.id===e.id);if(!p||(['week','date','time','timezone','channel','language','content_id'] as const).some(k=>p[k]!==e[k])||!Object.keys(PUB_LABEL).includes(p.status))throw new Error(`发布槽位 ${e.id} 与已冻结频率、语言或时间不一致。`);
    if((p.status==='PUBLISHED'&&(!safeUrl(p.published_url)||!Number.isInteger(p.revision)||(p.revision??0)<1||!s.tasks.some(t=>t.id===p.content_id&&(p.revision??0)<=t.revision)))||(p.status==='SCHEDULED'&&(!Number.isInteger(p.revision)||!s.tasks.some(t=>t.id===p.content_id&&t.status==='READY'&&p.revision===t.revision))))throw new Error('已排期 / 已发布必须引用通过检查的明确成片版本；发布还需真实链接。');
  }
  if(previous){for(const p of previous.publications.filter(p=>p.status==='PUBLISHED')){const next=s.publications.find(n=>n.id===p.id);if(!next||next.status!==p.status||next.date!==p.date||next.published_url!==p.published_url||next.revision!==p.revision)throw new Error('已发布历史不能被新的计划覆盖。');}}
  if(!s.metrics||[s.metrics.inquiries,s.metrics.qualified].some(x=>x!==null&&(!Number.isInteger(x)||x<0)))throw new Error('询盘缺失请填 null，不能把未知当成 0。');
  return structuredClone(s);
}
export interface FileRecord {name:string;size:number;sha256:string;}
export function handback(task:Task,checks:boolean[],files:FileRecord[],note:string) {
  if(!['NEEDS_EDIT','NEEDS_ASSET','REVIEW_REQUIRED'].includes(task.status)||task.owner!=='EDITOR')throw new Error('该任务当前无需剪辑师回传，请先核对当前版本。');
  if(checks.length!==taskChecklist(task.kind).length||!checks.every(Boolean)||!note.trim()||!files.length)throw new Error('请完成检查、选择交付文件并写明修改位置。');
  const video=task.kind==='short_video'||task.kind==='long_video';
  if(video&&!files.some(f=>/\.mp4$/i.test(f.name)))throw new Error('视频回传至少需要修订成片 MP4。');
  if(video&&!files.some(f=>/\.(zip|prproj|drp|veg|aep)$/i.test(f.name)))throw new Error('请同时选择实际工程文件或工程 ZIP；不要用 JSON 冒充原生工程。');
  if(files.some(f=>f.size<=0||!/^[a-f0-9]{64}$/.test(f.sha256)))throw new Error('文件为空或指纹不完整。');
  return {schema_version:'tiger-editor-handback/1',content_id:task.id,base_revision:task.revision,edit_generation:task.edit_generation,request_id:`${task.id}-r${task.revision}-g${task.edit_generation}-${files.map(f=>f.sha256.slice(0,12)).sort().join('-')}`,note:note.trim(),files,checks:taskChecklist(task.kind),status:'AWAITING_PRODUCER_ACK',created_at:new Date().toISOString()};
}
