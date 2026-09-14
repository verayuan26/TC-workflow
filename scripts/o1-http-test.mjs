import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
const base="http://127.0.0.1:8790";
const headers=email=>({"content-type":"application/json","x-tiger-dev-email":email});
async function call(path,{email="boss@example.invalid",method="GET",body,service=false}={}){
  const response=await fetch(base+path,{method,headers:service?{"content-type":"application/json",authorization:"Bearer local-codex-token"}:headers(email),body:body?JSON.stringify(body):undefined});
  const value=await response.json().catch(()=>({}));return {status:response.status,value};
}
const boss=await call("/api/outreach");if(boss.status!==200||boss.value.tasks.length!==8)throw new Error("boss snapshot failed");
const [taskA,taskB]=boss.value.tasks;
for(const [task,person] of [[taskA,"person_sales_a"],[taskB,"person_sales_b"]]){const r=await call(`/api/outreach/tasks/${task.id}/assign`,{method:"POST",body:{person_id:person}});if(r.status!==200)throw new Error(`assign failed ${r.status}`)}
const a=await call("/api/outreach",{email:"sales-a@example.invalid"});const b=await call("/api/outreach",{email:"sales-b@example.invalid"});
if(a.value.leads.length!==1||a.value.tasks.length!==1||b.value.leads.length!==1||b.value.tasks.length!==1)throw new Error("owner isolation failed");
const forbidden=await call(`/api/outreach/tasks/${taskB.id}/start`,{email:"sales-a@example.invalid",method:"POST",body:{revision:2}});if(forbidden.status!==403)throw new Error("cross-owner write was not rejected");
const started=await call(`/api/outreach/tasks/${taskA.id}/start`,{email:"sales-a@example.invalid",method:"POST",body:{revision:2}});if(started.status!==200)throw new Error(`start failed ${started.status}`);
const bytes=await readFile("package.json");const digest=createHash("sha256").update(bytes).digest("hex");
const declared=await call(`/api/outreach/tasks/${taskA.id}/attachments`,{email:"sales-a@example.invalid",method:"POST",body:{file_name:"o1-evidence.json",size_bytes:bytes.length,sha256:digest,content_type:"application/json"}});if(declared.status!==201)throw new Error(`declare failed ${declared.status}`);
const uploadUrl=new URL(declared.value.upload_url,"http://127.0.0.1:8788");const storedResponse=await fetch(uploadUrl,{method:"PUT",headers:{"content-type":"application/json"},body:bytes});const stored=await storedResponse.json();if(storedResponse.status!==201)throw new Error("store failed");
const completed=await call(`/api/outreach/attachments/${declared.value.attachment_id}/complete`,{email:"sales-a@example.invalid",method:"POST",body:{receipt:stored.receipt}});if(completed.status!==200)throw new Error("attachment receipt failed");
const eventBody={revision:3,idempotency_key:"o1-event-001",happened_at:"2026-09-14T03:00:00.000Z",channel:"email",address_used:"synthetic@example.invalid",result:"message_sent",operator_summary:"O1 合成测试：未联系真实客户。",next_action:"确认合成收件人是否收到测试资料",next_date:"2026-09-15",waiting_for:"合成收件人",verification_level:"independent"};
const submitted=await call(`/api/outreach/tasks/${taskA.id}/submit`,{email:"sales-a@example.invalid",method:"POST",body:eventBody});if(submitted.status!==201)throw new Error(`submit failed ${submitted.status}: ${JSON.stringify(submitted.value)}`);
const duplicate=await call(`/api/outreach/tasks/${taskA.id}/submit`,{email:"sales-a@example.invalid",method:"POST",body:eventBody});if(duplicate.status!==200||!duplicate.value.idempotent||duplicate.value.receipt.event_id!==submitted.value.receipt.event_id)throw new Error("submit idempotency failed");
const queue=await call("/api/outreach/review-queue",{service:true});if(queue.status!==200||queue.value.items.length!==1)throw new Error("review queue failed");
const reviewed=await call("/api/outreach/reviews",{service:true,method:"POST",body:{event_id:submitted.value.receipt.event_id,decision:"pass",summary:"O1 合成证据、归属与字段检查通过"}});if(reviewed.status!==200||reviewed.value.review.decision!=="pass")throw new Error("review failed");
const after=await call("/api/outreach",{email:"sales-a@example.invalid"});if(after.value.events.length!==1||after.value.events[0].review_status!=="reviewed"||after.value.tasks.length!==1||after.value.tasks[0].task_type!=="follow_up")throw new Error("review follow-up failed");
console.log(JSON.stringify({owner_isolation:"PASS",cross_owner_status:forbidden.status,attachment:{id:declared.value.attachment_id,status:completed.value.status,sha256:digest},submission:{event_id:submitted.value.receipt.event_id,idempotent_event_id:duplicate.value.receipt.event_id},review:reviewed.value.review.decision,next_task:after.value.tasks[0].id},null,2));
