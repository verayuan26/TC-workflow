export type OutreachLead = {
  id:string; company_name:string; city:string; country:string; website?:string; primary_email?:string; primary_phone?:string;
  contact_name?:string; contact_role?:string; contact_role_status:string; fit_reason:string; suggested_entry:string;
  demand_status:string; china_supply_status:string; progress_status:string; owner_person_id?:string; version:number;
};
export type OutreachTask = {
  id:string; lead_id:string; task_type:string; title:string; handoff_status:string; owner_person_id?:string; action_text:string;
  contact_target:string; russian_draft:string; chinese_translation:string; delivery_requirements:string; material_refs_json:unknown[];
  due_at?:string; next_step:string; review_note?:string; revision:number;
};
export type OutreachSource = {id:string;lead_id:string;batch_id:string;item_ref:string;source_url:string;source_type:string;observed_at:string;evidence_limit:string};
export type OutreachEvent = {id:string;lead_id:string;task_id:string;happened_at:string;channel:string;address_used:string;result:string;operator_summary:string;customer_quote?:string;review_status:string;created_at:string};
export type OutreachAttachment = {id:string;lead_id:string;task_id:string;event_id?:string;file_name:string;size_bytes:number;sha256:string;content_type:string;status:string};
export type OutreachReview = {id:string;event_id:string;task_id:string;decision:string;summary:string;missing_json:string;created_at:string};
export type OutreachSnapshot = {
  program:{id:string;title:string;status:string;revision:number;timezone:string;config_json:Record<string,unknown>};
  viewer:{person_id:string;name:string;role:string;can_manage:boolean;can_read_team:boolean;can_assign:boolean};
  stats?:{total:number;unassigned:number;attempted:number;connected:number;needs_details:number;evaluable:number};
  assignees:Array<{person_id:string;name:string}>;
  leads:OutreachLead[];tasks:OutreachTask[];sources:OutreachSource[];events:OutreachEvent[];attachments:OutreachAttachment[];reviews:OutreachReview[];
};
export type OutreachAssignmentItem = {
  task_id:string;success:boolean;status:string|number;lead_id?:string;previous_owner_person_id?:string;owner_person_id?:string;
  previous_status?:string;revision?:number;forced?:boolean;reason?:string;server_time?:string;error?:string;
};
export type OutreachAssignmentReceipt = {
  summary:{total:number;succeeded:number;failed:number};
  items:OutreachAssignmentItem[];
};
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(path,{credentials:"same-origin",...init});
  const value=await response.json().catch(()=>({error:"服务器未返回 JSON"})) as {error?:string};
  if(!response.ok)throw new Error(value.error||`请求失败 (${response.status})`);
  return value as T;
}
export const readOutreach=()=>request<OutreachSnapshot>("/api/outreach");
export const startOutreachTask=(taskId:string,revision:number)=>request<{task_id:string;status:string;revision:number}>(`/api/outreach/tasks/${encodeURIComponent(taskId)}/start`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({revision})});
export const assignOutreachTasks=(assignments:Array<{task_id:string;person_id:string;revision:number;reason:string}>)=>request<OutreachAssignmentReceipt>("/api/outreach/tasks/assign-batch",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({assignments})});
export const submitOutreachEvent=(taskId:string,value:Record<string,unknown>)=>request<{receipt:{event_id:string;server_time:string;review_status:string}}>(`/api/outreach/tasks/${encodeURIComponent(taskId)}/submit`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(value)});
export async function uploadOutreachAttachment(taskId:string,file:File){
  const bytes=await file.arrayBuffer();
  const digest=[...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const declared=await request<{attachment_id:string;upload_url:string}>(`/api/outreach/tasks/${encodeURIComponent(taskId)}/attachments`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({file_name:file.name,size_bytes:file.size,sha256:digest,content_type:file.type||"application/octet-stream"})});
  const stored=await fetch(declared.upload_url,{method:"PUT",headers:{"content-type":file.type||"application/octet-stream"},body:bytes,credentials:"same-origin"});
  const receipt=await stored.json().catch(()=>({error:"附件存储失败"})) as {receipt?:string;error?:string};
  if(!stored.ok||!receipt.receipt)throw new Error(receipt.error||"附件存储失败");
  return request<{attachment_id:string;status:string}>(`/api/outreach/attachments/${encodeURIComponent(declared.attachment_id)}/complete`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({receipt:receipt.receipt})});
}
