const base="http://127.0.0.1:8790";
const member=(email)=>({"content-type":"application/json","x-tiger-dev-email":email});
const service={"content-type":"application/json",authorization:"Bearer local-codex-token"};
async function call(path,{headers=member("sales-b@example.invalid"),method="GET",body}={}){const r=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});return {status:r.status,value:await r.json()}}
const state=await call("/api/outreach");const task=state.value.tasks.find(x=>x.task_type==="first_contact");if(!task)throw new Error("sales B task missing");
const started=await call(`/api/outreach/tasks/${task.id}/start`,{method:"POST",body:{revision:task.revision}});if(started.status!==200)throw new Error("start failed");
const body={revision:started.value.revision,idempotency_key:"o1-event-needs-more",happened_at:"2026-09-14T03:30:00.000Z",channel:"phone",address_used:"synthetic-number",result:"unreachable",operator_summary:"O1 合成测试：未联系真实客户。",verification_level:"independent"};
const submitted=await call(`/api/outreach/tasks/${task.id}/submit`,{method:"POST",body});if(submitted.status!==201)throw new Error(`submit failed ${submitted.status}`);
const reviewed=await call("/api/outreach/reviews",{headers:service,method:"POST",body:{event_id:submitted.value.receipt.event_id,decision:"pass"}});if(reviewed.value.review.decision!=="needs_more"||!reviewed.value.review.missing.includes("独立证据附件"))throw new Error("system review did not request attachment");
const after=await call("/api/outreach");const same=after.value.tasks.find(x=>x.id===task.id);if(!same||same.handoff_status!=="needs_more")throw new Error("same task did not return for supplementation");
console.log(JSON.stringify({event_id:submitted.value.receipt.event_id,review:reviewed.value.review.decision,missing:reviewed.value.review.missing,same_task_id:same.id,status:same.handoff_status},null,2));
