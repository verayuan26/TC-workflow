import {createHash} from "node:crypto";

const base="http://127.0.0.1:8790";
const headers={"content-type":"application/json",authorization:"Bearer local-codex-token"};
const valid={
  item_ref:"PARTIAL-SEED",
  company_name:"O1 Partial Import Synthetic",
  city:"测试城市",
  website:"https://partial-import.example.invalid",
  email:"",
  phone:"",
  contact_role:"测试联系人",
  contact_role_status:"suggested",
  fit_reason:"仅用于 O1 合成导入验证",
  suggested_entry:"不得联系；只验证入库回执",
  source_url:"https://example.invalid/o1-partial-source",
  source_type:"codex_test",
  observed_at:"2026-09-14",
  evidence_limit:"合成测试；不是现实客户",
  russian_draft:"Тест. Не отправлять.",
  chinese_translation:"测试，不得发送。",
  delivery_requirements:"返回合成测试回执",
};
const post=async(path,body)=>{
  const response=await fetch(base+path,{method:"POST",headers,body:JSON.stringify(body)});
  const value=await response.json();
  if(!response.ok)throw new Error(`${path} ${response.status}: ${JSON.stringify(value)}`);
  return {status:response.status,value};
};
const digest=value=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
const common=(batchId,leads)=>({
  batch_id:batchId,
  idempotency_key:`o1:${batchId}:v1`,
  source_system:"codex_o1_test",
  source_task_id:"O1-PARTIAL-TEST",
  source_run_id:"O1-PARTIAL-TEST-RUN",
  artifact_version:`${batchId}/v1`,
  artifact_url:"https://example.invalid/o1-partial-artifact.json",
  artifact_sha256:digest(leads),
  program_revision:1,
  is_test:true,
  leads,
});

const seedBatch=`O1_PARTIAL_SEED_${Date.now()}`;
await post("/api/outreach/import",common(seedBatch,[valid]));
const leads=[
  {...valid,item_ref:"PARTIAL-MATCH",source_url:"https://example.invalid/o1-matched-source"},
  {...valid,item_ref:"PARTIAL-NEEDS-MORE",company_name:"O1 Thin Synthetic",website:"",email:"",phone:""},
];
const batchId=`O1_PARTIAL_MIXED_${Date.now()}`;
const payload=common(batchId,leads);
const preview=await post("/api/outreach/import/dry-run",payload);
const imported=await post("/api/outreach/import",payload);
const repeated=await post("/api/outreach/import",payload);
const outcomes=Object.fromEntries(imported.value.items.map(item=>[item.item_ref,item.outcome]));
if(preview.value.items[0].outcome!=="matched"||preview.value.items[1].outcome!=="needs_more")throw new Error("dry-run did not classify each item independently");
if(imported.status!==201||imported.value.batch.status!=="partial"||outcomes["PARTIAL-MATCH"]!=="matched"||outcomes["PARTIAL-NEEDS-MORE"]!=="needs_more")throw new Error("partial import receipt is incorrect");
if(!repeated.value.idempotent||repeated.value.items.length!==2)throw new Error("partial batch idempotency failed");
console.log(JSON.stringify({dry_run:preview.value.items,batch:imported.value.batch,repeated:{idempotent:repeated.value.idempotent,items:repeated.value.items.length}},null,2));
