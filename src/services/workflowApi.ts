import type { MetricsInput, PublishQueueItem, WeeklyReportRow, WorkflowTask, WorkflowStatus } from '../types/workflowV1';

const tasks: WorkflowTask[] = [
  { task_id:'S-001',title:'VK short caption',platform:'VK',caption:'俄线发货流程',hashtags:['#logistics'],cta:'私信咨询',cta_type:'dm_consultation',utm:'https://x?a=1',asset_url:'https://asset/1',owner:'小S',status:'APPROVED',priority:'P1',risk_level:'LOW',requires_vera_review:false,review_reason:[],business_vertical:['logistics'],crm_tags:['vk'],system_block_check_required:true },
  { task_id:'M-002',title:'YouTube case clip',platform:'YouTube',caption:'客户案例',hashtags:['#case'],cta:'提交表单',cta_type:'form_submit',utm:'https://x?a=2',asset_url:'https://asset/2',owner:'小M',status:'VERA_REVIEW',priority:'P0',risk_level:'HIGH',requires_vera_review:true,review_reason:['客户案例'],business_vertical:['sourcing'],crm_tags:['yt'],system_block_check_required:true },
  { task_id:'C-003',title:'Blocked promise copy',platform:'Telegram',caption:'100%清关',hashtags:['#bad'],cta:'WhatsApp咨询',cta_type:'whatsapp_inquiry',utm:'https://x?a=3',asset_url:'https://asset/3',owner:'小C',status:'SYSTEM_BLOCK',priority:'P0',risk_level:'HIGH',requires_vera_review:true,review_reason:['承诺性表述'],business_vertical:['logistics'],crm_tags:['tg'],system_block_check_required:true },
];

let queue: PublishQueueItem[] = [];
const metrics: MetricsInput[] = [];
const reviews: {task_id:string; decision: 'APPROVED'|'REJECTED'; comment?:string}[] = [];
const briefs: {id:string; title:string; content:string}[] = [];
const crmFeedback: {id:string; text:string}[] = [];
const aiRuns: {id:string; run_type:string; status:string}[] = [];

const delay = async <T,>(v:T)=> new Promise<T>(r=>setTimeout(()=>r(v),50));

export async function importAiDraft(input: WorkflowTask[]) { input.forEach((t)=>tasks.push({...t,status:'AI_DRAFT'})); return delay({ok:true,count:input.length}); }
export async function getTasks() { return delay([...tasks]); }
export async function updateTask(task_id:string, patch: Partial<WorkflowTask>) { const t=tasks.find(x=>x.task_id===task_id); if(!t) throw new Error('NOT_FOUND'); Object.assign(t,patch); return delay(t); }
export async function submitTask(task_id:string){ const t=tasks.find(x=>x.task_id===task_id); if(!t) throw new Error('NOT_FOUND'); if(t.status==='SYSTEM_BLOCK') throw new Error('SYSTEM_BLOCK'); t.status=t.requires_vera_review?'VERA_REVIEW':'APPROVED'; return delay(t); }
export async function reviewTask(task_id:string, decision:'APPROVED'|'REJECTED', comment?:string){ const t=tasks.find(x=>x.task_id===task_id); if(!t) throw new Error('NOT_FOUND'); t.status = decision==='APPROVED'?'APPROVED':'REJECTED'; reviews.push({task_id,decision,comment}); return delay(t); }
export async function getReviews(){ return delay([...reviews]); }
export async function generateUtm(task_id:string){ return delay({task_id,utm:`https://mock.local/content/${task_id}?utm_source=mock&utm_medium=social`}); }
export async function getBriefs(){ return delay([...briefs]); }
export async function createBrief(title:string, content:string){ const b={id:`B-${briefs.length+1}`,title,content}; briefs.push(b); return delay(b); }
export async function getCrmFeedback(){ return delay([...crmFeedback]); }
export async function createCrmFeedback(text:string){ const i={id:`CF-${crmFeedback.length+1}`,text}; crmFeedback.push(i); return delay(i); }
export async function createAiRun(run_type:string){ const i={id:`AR-${aiRuns.length+1}`,run_type,status:'MOCK_DONE'}; aiRuns.push(i); return delay(i); }
export async function getAiRuns(){ return delay([...aiRuns]); }
export async function getPublishQueue(){ return delay([...queue]); }

function canEnterQueue(task: WorkflowTask){
  if(task.status==='SYSTEM_BLOCK') return 'SYSTEM_BLOCK blocked';
  if(task.risk_level==='HIGH' && task.status!=='APPROVED') return 'High risk requires Vera approved';
  return null;
}

export async function createPublishQueueItem(task_id:string){
  const task = tasks.find(t=>t.task_id===task_id); if(!task) throw new Error('NOT_FOUND');
  const block = canEnterQueue(task); if(block) throw new Error(block);
  const item: PublishQueueItem={id:`PQ-${queue.length+1}`,task_id,platform:task.platform,caption:task.caption,hashtags:task.hashtags,cta:task.cta,utm:task.utm,asset_url:task.asset_url,scheduled_time:task.scheduled_time,owner:task.owner,status:'READY_TO_PUBLISH'};
  queue.push(item); return delay(item);
}
export async function updatePublishQueueItem(id:string, patch:Partial<PublishQueueItem>){ const q=queue.find(x=>x.id===id); if(!q) throw new Error('NOT_FOUND'); Object.assign(q,patch); return delay(q); }
export async function markPublished(id:string, payload:{publish_url:string;published_at:string;publisher:string;platform:string}){ const q=queue.find(x=>x.id===id); if(!q) throw new Error('NOT_FOUND'); Object.assign(q,payload,{status:'PUBLISHED'}); return delay(q); }
export async function exportDistribution(){ return delay({format:['csv','table'],items:queue.map(q=>({platform:q.platform,title:q.caption,body:q.caption,hashtag:q.hashtags.join(' '),cta:q.cta,utm:q.utm}))}); }
export async function manualInputMetrics(payload: MetricsInput){ metrics.push(payload); return delay({ok:true}); }
export async function getWeeklyReport(): Promise<WeeklyReportRow[]>{ return delay(metrics.map(m=>({platform:m.platform,content_id:m.content_id,crm_tag:m.crm_tags[0]||'',business_vertical:m.business_vertical[0]||'',campaign:m.campaign,impressions:m.impressions,clicks:m.clicks,leads:m.form+m.dm,valid_leads:m.valid_leads,sql:m.sql,cost:m.cost,decision:'FIX'}))); }

export async function setTaskStatus(task_id:string,status:WorkflowStatus){ return updateTask(task_id,{status}); }
