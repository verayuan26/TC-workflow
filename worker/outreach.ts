import { HttpError, requirePermission, sha256 } from "./auth";
import type { AuthActor, Env } from "./types";
import {
  clean,
  progressForResult,
  reviewSubmission,
  validateLeadInput,
} from "./outreach-domain";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json;charset=utf-8", "cache-control": "no-store" },
  });
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const parse = async (request: Request) => {
  try { return await request.json() as Record<string, unknown>; }
  catch { throw new HttpError("请求正文必须是 JSON"); }
};
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value as object).sort().map(k => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(value);
};
const privileged = (actor: AuthActor) => actor.role === "boss" || actor.role === "codex" || actor.kind === "service";
const canWriteTask = (actor: AuthActor, owner: unknown) => actor.role === "sales" && owner === actor.id;

async function audit(env: Env, actor: AuthActor, action: string, target: string, result: string, details: unknown = {}) {
  await env.DB.prepare("INSERT INTO audit_log(id,at,actor_id,actor_kind,action,target,result,details_json) VALUES(?,?,?,?,?,?,?,?)")
    .bind(uuid(), now(), actor.id, actor.kind, action, target, result, JSON.stringify(details)).run();
}

async function program(env: Env) {
  const row = await env.DB.prepare("SELECT * FROM outreach_programs WHERE id=?").bind("precision-russia-30d").first<Record<string, unknown>>();
  if (!row) throw new HttpError("客户开发试验配置不存在", 503);
  return row;
}

async function taskForActor(env: Env, actor: AuthActor, taskId: string) {
  const task = await env.DB.prepare("SELECT * FROM outreach_tasks WHERE id=?").bind(taskId).first<Record<string, unknown>>();
  if (!task) throw new HttpError("任务不存在", 404);
  if (!privileged(actor) && task.owner_person_id !== actor.id) throw new HttpError("只能访问本人任务", 403);
  return task;
}

async function readSnapshot(env: Env, actor: AuthActor) {
  requirePermission(actor, "outreach:read");
  const scope = privileged(actor) ? "is_test=0" : "is_test=0 AND owner_person_id=?";
  const bind = privileged(actor) ? [] : [actor.id];
  const [p, leadsResult, tasksResult] = await Promise.all([
    program(env),
    env.DB.prepare(`SELECT * FROM outreach_leads WHERE ${scope} ORDER BY created_at,company_name`).bind(...bind).all(),
    env.DB.prepare(`SELECT t.* FROM outreach_tasks t JOIN outreach_leads l ON l.id=t.lead_id WHERE l.is_test=0 AND ${privileged(actor)?"1=1":"t.owner_person_id=?"} AND t.active=1 ORDER BY CASE t.handoff_status WHEN 'needs_more' THEN 0 WHEN 'submitted' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END,t.created_at`).bind(...bind).all(),
  ]);
  const leadIds = leadsResult.results.map(x => String(x.id));
  let sources: unknown[] = [], events: unknown[] = [], attachments: unknown[] = [], reviews: unknown[] = [];
  if (leadIds.length) {
    const marks = leadIds.map(() => "?").join(",");
    [sources, events, attachments, reviews] = await Promise.all([
      env.DB.prepare(`SELECT id,lead_id,batch_id,item_ref,source_url,source_type,observed_at,evidence_limit,created_at FROM outreach_sources WHERE lead_id IN (${marks}) ORDER BY created_at`).bind(...leadIds).all().then(x => x.results),
      env.DB.prepare(`SELECT * FROM outreach_contact_events WHERE lead_id IN (${marks}) ORDER BY created_at DESC`).bind(...leadIds).all().then(x => x.results),
      env.DB.prepare(`SELECT id,lead_id,task_id,event_id,file_name,size_bytes,sha256,content_type,status,created_at,verified_at FROM outreach_attachments WHERE lead_id IN (${marks}) ORDER BY created_at`).bind(...leadIds).all().then(x => x.results),
      env.DB.prepare(`SELECT r.* FROM outreach_reviews r JOIN outreach_tasks t ON t.id=r.task_id WHERE t.lead_id IN (${marks}) ORDER BY r.created_at DESC`).bind(...leadIds).all().then(x => x.results),
    ]);
  }
  const allStats = privileged(actor) ? await env.DB.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN owner_person_id IS NULL THEN 1 ELSE 0 END) AS unassigned,
    SUM(CASE WHEN progress_status!='uncontacted' THEN 1 ELSE 0 END) AS attempted,
    SUM(CASE WHEN progress_status IN ('connected','needs_details','evaluable') THEN 1 ELSE 0 END) AS connected,
    SUM(CASE WHEN progress_status='needs_details' THEN 1 ELSE 0 END) AS needs_details,
    SUM(CASE WHEN progress_status='evaluable' THEN 1 ELSE 0 END) AS evaluable
    FROM outreach_leads WHERE is_test=0`).first() : null;
  return {
    program: { ...p, config_json: JSON.parse(String(p.config_json || "{}")) },
    viewer: { person_id: actor.id, name: actor.name, role: actor.role, can_manage: privileged(actor) },
    stats: allStats,
    leads: leadsResult.results,
    tasks: tasksResult.results.map(x => ({ ...x, material_refs_json: JSON.parse(String(x.material_refs_json || "[]")) })),
    sources, events, attachments, reviews,
  };
}

async function matchLead(env: Env, lead: ReturnType<typeof validateLeadInput>, isTest:boolean) {
  const found = await env.DB.prepare(`SELECT * FROM outreach_leads WHERE
    is_test=? AND ((normalized_website!='' AND normalized_website=?) OR
    (normalized_email!='' AND normalized_email=?) OR
    (normalized_phone!='' AND normalized_phone=?) OR
    (canonical_name=? AND city=?))`).bind(
      isTest?1:0,lead.normalizedWebsite || "__none__", lead.normalizedEmail || "__none__",
      lead.normalizedPhone || "__none__", lead.canonicalName, lead.city,
    ).all();
  const unique = new Map(found.results.map(row => [String(row.id), row]));
  return [...unique.values()];
}

async function importBatch(request: Request, env: Env, actor: AuthActor, dryRun: boolean) {
  requirePermission(actor, "outreach:import", "outreach:write");
  if (!privileged(actor)) throw new HttpError("仅老板或受控服务身份可导入", 403);
  const payload = await parse(request);
  const batchId = clean(payload.batch_id, 100);
  const idempotencyKey = clean(payload.idempotency_key, 200);
  const sourceSystem = clean(payload.source_system, 100);
  const artifactVersion = clean(payload.artifact_version, 100);
  const artifactSha256 = clean(payload.artifact_sha256, 100);
  const leads = payload.leads;
  if (!/^[A-Z0-9_-]{5,100}$/.test(batchId) || !idempotencyKey || !sourceSystem || !artifactVersion || !/^[a-f0-9]{64}$/.test(artifactSha256))
    throw new HttpError("批次身份、来源、产物版本或 SHA-256 无效");
  if (!Array.isArray(leads) || !leads.length || leads.length > 100) throw new HttpError("每批应包含 1—100 条线索");
  const seenItemRefs = new Set<string>();
  const parsed = leads.map((raw, index) => {
    const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const suppliedRef = clean(value.item_ref, 100);
    const fallbackRef = `ROW-${String(index + 1).padStart(3, "0")}`;
    if (suppliedRef && seenItemRefs.has(suppliedRef)) {
      return { itemRef: fallbackRef, lead: null, error: `批次内 item_ref 重复：${suppliedRef}` };
    }
    if (suppliedRef) seenItemRefs.add(suppliedRef);
    try {
      const lead = validateLeadInput(value);
      return { itemRef: lead.itemRef, lead, error: null };
    } catch (error) {
      return {
        itemRef: /^[A-Z0-9_-]{3,100}$/.test(suppliedRef) ? suppliedRef : fallbackRef,
        lead: null,
        error: error instanceof Error ? error.message : "线索字段无效",
      };
    }
  });
  const p = await program(env);
  const isTest=payload.is_test===true;
  if (payload.program_revision !== p.revision) throw new HttpError("试验 revision 已变化，请重新预检", 409);
  const existingBatch = await env.DB.prepare("SELECT * FROM outreach_batches WHERE batch_id=? OR idempotency_key=?").bind(batchId, idempotencyKey).first<Record<string, unknown>>();
  if (existingBatch) {
    const items = await env.DB.prepare("SELECT * FROM outreach_batch_items WHERE batch_id=? ORDER BY item_ref").bind(existingBatch.batch_id).all();
    return json({ dry_run: dryRun, idempotent: true, batch: existingBatch, items: items.results });
  }
  const preview = [] as Array<Record<string, unknown>>;
  for (const entry of parsed) {
    if (!entry.lead) {
      preview.push({ item_ref: entry.itemRef, outcome: "needs_more", lead_id: null, reason: entry.error });
      continue;
    }
    const matches = await matchLead(env, entry.lead, isTest);
    preview.push({ item_ref: entry.itemRef, outcome: matches.length > 1 ? "conflict" : matches.length === 1 ? "matched" : "created", lead_id: matches.length === 1 ? matches[0].id : null, reason: matches.length > 1 ? "多个客户记录命中，需人工确认" : null });
  }
  if (dryRun) return json({ dry_run: true, idempotent: false, batch_id: batchId, program_revision: p.revision, items: preview });
  const receivedAt = now();
  await env.DB.prepare("INSERT INTO outreach_batches(batch_id,idempotency_key,source_system,source_task_id,source_run_id,artifact_version,artifact_url,artifact_sha256,program_id,program_revision,status,summary_json,received_at,is_test) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(batchId,idempotencyKey,sourceSystem,clean(payload.source_task_id,200)||null,clean(payload.source_run_id,200)||null,artifactVersion,clean(payload.artifact_url,1000)||null,artifactSha256,String(p.id),Number(p.revision),"processing","{}",receivedAt,isTest?1:0).run();
  const results = [] as Array<Record<string, unknown>>;
  for (let index = 0; index < parsed.length; index++) {
    const lead = parsed[index].lead;
    const previewRow = preview[index];
    if (!lead || previewRow.outcome === "conflict" || previewRow.outcome === "needs_more") {
      const itemId = uuid();
      await env.DB.prepare("INSERT INTO outreach_batch_items(id,batch_id,item_ref,outcome,reason,created_at) VALUES(?,?,?,?,?,?)")
        .bind(itemId,batchId,previewRow.item_ref,previewRow.outcome,previewRow.reason,receivedAt).run();
      results.push({ id:itemId,batch_id:batchId,...previewRow });
      continue;
    }
    let leadId = clean(previewRow.lead_id,100);
    const outcome = String(previewRow.outcome);
    if (!leadId) {
      leadId = uuid();
      await env.DB.prepare(`INSERT INTO outreach_leads(id,company_name,canonical_name,market,country,city,region_group,website,normalized_website,primary_email,normalized_email,primary_phone,normalized_phone,contact_name,contact_role,contact_role_status,fit_reason,suggested_entry,demand_status,china_supply_status,progress_status,owner_person_id,created_at,updated_at,is_test)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        leadId,lead.companyName,lead.canonicalName,"RU","俄罗斯",lead.city,null,lead.website||null,lead.normalizedWebsite,lead.email||null,lead.normalizedEmail,lead.phone||null,lead.normalizedPhone,lead.contactName||null,lead.contactRole||null,lead.contactRoleStatus,lead.fitReason,lead.suggestedEntry,"unknown","unknown","uncontacted",null,receivedAt,receivedAt,isTest?1:0,
      ).run();
    }
    const sourceId = uuid();
    const raw = leads[index];
    await env.DB.prepare("INSERT INTO outreach_sources(id,lead_id,batch_id,item_ref,source_url,source_type,observed_at,evidence_limit,raw_json,checksum,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
      .bind(sourceId,leadId,batchId,lead.itemRef,lead.sourceUrl,lead.sourceType,lead.observedAt,lead.evidenceLimit,JSON.stringify(raw),await sha256(canonical(raw)),receivedAt).run();
    let task = await env.DB.prepare("SELECT id FROM outreach_tasks WHERE lead_id=? AND task_type='first_contact' AND active=1").bind(leadId).first<{id:string}>();
    if (!task) {
      const taskId = uuid();
      await env.DB.prepare(`INSERT INTO outreach_tasks(id,lead_id,task_type,title,handoff_status,owner_person_id,action_text,contact_target,russian_draft,chinese_translation,delivery_requirements,material_refs_json,due_at,next_step,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        taskId,leadId,"first_contact",`${lead.companyName}｜找到合适负责人并询问一个可评估的零件需求`,"unassigned",null,
        lead.suggestedEntry,[lead.contactName,lead.contactRole,lead.phone,lead.email].filter(Boolean).join("；"),lead.russianDraft,lead.chineseTranslation,lead.deliveryRequirements,"[]",null,"分配获授权业务员后执行；未分配前仅老板/Codex 可见",receivedAt,receivedAt,
      ).run();
      task = {id:taskId};
    }
    const itemId = uuid();
    await env.DB.prepare("INSERT INTO outreach_batch_items(id,batch_id,item_ref,lead_id,task_id,outcome,reason,created_at) VALUES(?,?,?,?,?,?,?,?)")
      .bind(itemId,batchId,lead.itemRef,leadId,task.id,outcome,outcome === "matched" ? "关联现有客户并追加来源；未覆盖历史" : null,receivedAt).run();
    results.push({id:itemId,batch_id:batchId,item_ref:lead.itemRef,lead_id:leadId,task_id:task.id,outcome,reason:outcome === "matched" ? "关联现有客户并追加来源；未覆盖历史" : null});
  }
  const counts = Object.fromEntries(["created","matched","needs_more","conflict","not_fit","failed"].map(key => [key,results.filter(x => x.outcome === key).length]));
  const status = results.some(x => ["needs_more","conflict","failed"].includes(String(x.outcome))) ? "partial" : "completed";
  await env.DB.prepare("UPDATE outreach_batches SET status=?,summary_json=?,completed_at=? WHERE batch_id=?")
    .bind(status,JSON.stringify({total:results.length,...counts}),now(),batchId).run();
  await audit(env,actor,"outreach.batch.import",batchId,status,{total:results.length,...counts});
  return json({dry_run:false,idempotent:false,batch:{batch_id:batchId,status,summary:{total:results.length,...counts}},items:results},201);
}

async function startTask(env: Env, actor: AuthActor, taskId: string, payload: Record<string, unknown>) {
  const task = await taskForActor(env,actor,taskId);
  if (!canWriteTask(actor,task.owner_person_id)) throw new HttpError("任务尚未分配给当前业务员",403);
  if (task.handoff_status !== "pending") throw new HttpError("任务状态已变化",409);
  if (Number(payload.revision) !== Number(task.revision)) throw new HttpError("任务 revision 已变化",409);
  const t = now();
  const changed = await env.DB.prepare("UPDATE outreach_tasks SET handoff_status='in_progress',revision=revision+1,updated_at=? WHERE id=? AND revision=? AND handoff_status='pending'")
    .bind(t,taskId,task.revision).run();
  if (!changed.meta.changes) throw new HttpError("任务状态已变化",409);
  await audit(env,actor,"outreach.task.start",taskId,"accepted");
  return json({task_id:taskId,status:"in_progress",revision:Number(task.revision)+1,server_time:t});
}

async function assignTask(env: Env, actor: AuthActor, taskId: string, payload: Record<string, unknown>) {
  if (actor.role !== "boss") throw new HttpError("仅老板可分配客户",403);
  const task=await taskForActor(env,actor,taskId);
  const personId=clean(payload.person_id,100);
  const member=await env.DB.prepare("SELECT person_id,name,staff_role,permissions_json FROM members WHERE person_id=? AND status='active'").bind(personId).first<Record<string,unknown>>();
  if(!member||member.staff_role!=="sales"||!JSON.parse(String(member.permissions_json||"[]")).includes("outreach:write"))throw new HttpError("负责人必须是已授权业务员",400);
  const t=now();
  await env.DB.batch([
    env.DB.prepare("UPDATE outreach_tasks SET owner_person_id=?,handoff_status=CASE WHEN handoff_status='unassigned' THEN 'pending' ELSE handoff_status END,revision=revision+1,updated_at=? WHERE id=?").bind(personId,t,taskId),
    env.DB.prepare("UPDATE outreach_leads SET owner_person_id=?,version=version+1,updated_at=? WHERE id=?").bind(personId,t,task.lead_id),
  ]);
  await audit(env,actor,"outreach.task.assign",taskId,"accepted",{person_id:personId});
  return json({task_id:taskId,owner_person_id:personId,status:task.handoff_status==="unassigned"?"pending":task.handoff_status,revision:Number(task.revision)+1,server_time:t});
}

async function submitEvent(env: Env, actor: AuthActor, taskId: string, payload: Record<string, unknown>) {
  const task = await taskForActor(env,actor,taskId);
  if (!canWriteTask(actor,task.owner_person_id)) throw new HttpError("只能提交本人任务",403);
  const idem = clean(payload.idempotency_key,200);
  if (!idem) throw new HttpError("缺少提交去重标识");
  const existing = await env.DB.prepare("SELECT * FROM outreach_contact_events WHERE idempotency_key=?").bind(idem).first<Record<string,unknown>>();
  if (existing) return json({idempotent:true,receipt:{event_id:existing.id,task_id:existing.task_id,server_time:existing.created_at,review_status:existing.review_status}});
  if (!["in_progress","needs_more"].includes(String(task.handoff_status))) throw new HttpError("任务当前不能提交",409);
  if (Number(payload.revision) !== Number(task.revision)) throw new HttpError("旧表单不能覆盖新反馈",409);
  const attachmentCount = await env.DB.prepare("SELECT COUNT(*) AS n FROM outreach_attachments WHERE task_id=? AND owner_person_id=? AND status='verified' AND event_id IS NULL")
    .bind(taskId,actor.id).first<{n:number}>();
  const check = reviewSubmission(payload,Number(attachmentCount?.n||0));
  if (check.missing.some(x => x !== "独立证据附件")) throw new HttpError(`提交缺少：${check.missing.join("、")}`);
  const eventId = uuid();
  const t = now();
  const checksum = await sha256(canonical(payload));
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO outreach_contact_events(id,lead_id,task_id,actor_person_id,idempotency_key,happened_at,channel,address_used,contact_name,contact_role,result,customer_quote,operator_summary,next_action,next_date,waiting_for,verification_level,payload_checksum,review_status,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      eventId,task.lead_id,taskId,actor.id,idem,clean(payload.happened_at,40),clean(payload.channel,100),clean(payload.address_used,500),clean(payload.contact_name,300)||null,clean(payload.contact_role,300)||null,clean(payload.result,50),clean(payload.customer_quote)||null,clean(payload.operator_summary),clean(payload.next_action)||null,clean(payload.next_date,40)||null,clean(payload.waiting_for,300)||null,clean(payload.verification_level,50)||"operator_statement",checksum,"submitted",t,t,
    ),
    env.DB.prepare("UPDATE outreach_attachments SET event_id=? WHERE task_id=? AND owner_person_id=? AND status='verified' AND event_id IS NULL").bind(eventId,taskId,actor.id),
    env.DB.prepare("UPDATE outreach_tasks SET handoff_status='submitted',revision=revision+1,updated_at=? WHERE id=? AND revision=?").bind(t,taskId,task.revision),
  ]);
  await audit(env,actor,"outreach.event.submit",eventId,"accepted",{task_id:taskId});
  return json({idempotent:false,receipt:{event_id:eventId,task_id:taskId,server_time:t,review_status:"submitted",payload_checksum:checksum}},201);
}

async function reviewEvent(env: Env, actor: AuthActor, payload: Record<string, unknown>) {
  requirePermission(actor,"outreach:review");
  if (!privileged(actor)) throw new HttpError("仅 Codex 服务或老板可检查",403);
  const eventId = clean(payload.event_id,100);
  const event = await env.DB.prepare("SELECT * FROM outreach_contact_events WHERE id=?").bind(eventId).first<Record<string,unknown>>();
  if (!event) throw new HttpError("回传事件不存在",404);
  const previous = await env.DB.prepare("SELECT * FROM outreach_reviews WHERE event_id=?").bind(eventId).first<Record<string,unknown>>();
  if (previous) return json({idempotent:true,review:previous});
  const attachments = await env.DB.prepare("SELECT COUNT(*) AS n FROM outreach_attachments WHERE event_id=? AND status='verified'").bind(eventId).first<{n:number}>();
  const check = reviewSubmission(event,Number(attachments?.n||0));
  const requested = clean(payload.decision,30);
  const decision = requested === "needs_more" || check.decision === "needs_more" ? "needs_more" : "pass";
  const missing = Array.isArray(payload.missing) ? payload.missing.map(x=>clean(x,300)).filter(Boolean) : check.missing;
  if (decision === "needs_more" && !missing.length) throw new HttpError("退回时需要具体补交项");
  const reviewId = uuid(); const t = now(); const summary = clean(payload.summary) || (decision === "pass" ? "系统字段、归属与证据检查通过" : `请补交：${missing.join("、")}`);
  const progress = progressForResult(String(event.result));
  await env.DB.batch([
    env.DB.prepare("INSERT INTO outreach_reviews(id,event_id,task_id,reviewer_id,decision,summary,missing_json,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(reviewId,eventId,event.task_id,actor.id,decision,summary,JSON.stringify(missing),t),
    env.DB.prepare("UPDATE outreach_contact_events SET review_status=?,updated_at=? WHERE id=?").bind(decision === "pass" ? "reviewed" : "needs_more",t,eventId),
    env.DB.prepare("UPDATE outreach_tasks SET handoff_status=?,review_note=?,revision=revision+1,updated_at=? WHERE id=?").bind(decision === "pass" ? "reviewed" : "needs_more",summary,t,event.task_id),
    env.DB.prepare("UPDATE outreach_leads SET progress_status=?,version=version+1,updated_at=? WHERE id=?").bind(progress,t,event.lead_id),
  ]);
  if (decision === "pass" && ["message_sent","contact_found","willing_to_share"].includes(String(event.result))) {
    await env.DB.prepare("UPDATE outreach_tasks SET active=0 WHERE id=?").bind(event.task_id).run();
    const nextId=uuid(); const action=clean(event.next_action)||"确认客户是否收到资料并记录实际回复";
    await env.DB.prepare(`INSERT INTO outreach_tasks(id,lead_id,task_type,title,handoff_status,owner_person_id,action_text,contact_target,russian_draft,chinese_translation,delivery_requirements,material_refs_json,due_at,next_step,created_at,updated_at)
      SELECT ?,id,'follow_up',company_name||'｜'||?,'pending',owner_person_id,?,COALESCE(primary_email,primary_phone,''),'','','记录实际回复、客户原话与证据','[]',?,?,?,? FROM outreach_leads WHERE id=?`)
      .bind(nextId,action,action,clean(event.next_date,40)||null,clean(event.waiting_for)||"等待客户回复",t,t,event.lead_id).run();
  }
  await audit(env,actor,"outreach.event.review",eventId,decision,{missing});
  return json({idempotent:false,review:{id:reviewId,event_id:eventId,decision,summary,missing,created_at:t}});
}

function base64url(value: Uint8Array) {
  let binary=""; for(const byte of value) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
async function signFileToken(env: Env, payload: Record<string, unknown>) {
  if (!env.OUTREACH_FILE_SIGNING_SECRET) throw new HttpError("附件签名服务尚未配置",503);
  const encoded=base64url(new TextEncoder().encode(JSON.stringify(payload)));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.OUTREACH_FILE_SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=base64url(new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(encoded))));
  return `${encoded}.${sig}`;
}
function fromBase64url(value:string){
  const raw=atob(value.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(value.length/4)*4,"="));
  return Uint8Array.from(raw,x=>x.charCodeAt(0));
}
async function verifyFileToken(env:Env,token:string){
  if(!env.OUTREACH_FILE_SIGNING_SECRET)throw new HttpError("附件签名服务尚未配置",503);
  const [encoded,signature,...extra]=token.split(".");if(!encoded||!signature||extra.length)throw new HttpError("附件存储回执无效",409);
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.OUTREACH_FILE_SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  const valid=await crypto.subtle.verify("HMAC",key,fromBase64url(signature),new TextEncoder().encode(encoded));if(!valid)throw new HttpError("附件存储回执无效",409);
  const payload=JSON.parse(new TextDecoder().decode(fromBase64url(encoded))) as Record<string,unknown>;
  if(Number(payload.exp)<Math.floor(Date.now()/1000))throw new HttpError("附件存储回执已过期",409);
  return payload;
}

async function declareAttachment(env: Env, actor: AuthActor, taskId: string, payload: Record<string, unknown>) {
  const task=await taskForActor(env,actor,taskId);
  if (!canWriteTask(actor,task.owner_person_id)) throw new HttpError("只能为本人任务上传证据",403);
  const fileName=clean(payload.file_name,180).replace(/[\\/]/g,"");
  const size=Number(payload.size_bytes); const digest=clean(payload.sha256,64); const contentType=clean(payload.content_type,200)||"application/octet-stream";
  if(!fileName||!Number.isInteger(size)||size<1||size>25*1024*1024||!/^[a-f0-9]{64}$/.test(digest))throw new HttpError("附件清单无效；单文件上限 25 MiB");
  const attachmentId=uuid(); const storageKey=`${String(task.lead_id)}/${taskId}/${attachmentId}`; const t=now();
  await env.DB.prepare("INSERT INTO outreach_attachments(id,lead_id,task_id,owner_person_id,file_name,size_bytes,sha256,content_type,storage_key,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,'declared',?)")
    .bind(attachmentId,task.lead_id,taskId,actor.id,fileName,size,digest,contentType,storageKey,t).run();
  const token=await signFileToken(env,{op:"upload",attachment_id:attachmentId,storage_key:storageKey,size_bytes:size,sha256:digest,content_type:contentType,exp:Math.floor(Date.now()/1000)+300});
  return json({attachment_id:attachmentId,status:"declared",upload_url:`/outreach-files/upload/${attachmentId}?token=${encodeURIComponent(token)}`,expires_in:300},201);
}

async function completeAttachment(env: Env, actor: AuthActor, attachmentId: string, payload: Record<string, unknown>) {
  const row=await env.DB.prepare("SELECT * FROM outreach_attachments WHERE id=?").bind(attachmentId).first<Record<string,unknown>>();
  if(!row)throw new HttpError("附件声明不存在",404);
  if(!privileged(actor)&&row.owner_person_id!==actor.id)throw new HttpError("无权完成此附件",403);
  const receipt=clean(payload.receipt,5000); if(!receipt)throw new HttpError("缺少存储回执");
  const verified=await verifyFileToken(env,receipt);
  if(verified.op!=="stored"||verified.attachment_id!==attachmentId||verified.storage_key!==row.storage_key||Number(verified.size_bytes)!==Number(row.size_bytes)||verified.sha256!==row.sha256)throw new HttpError("附件存储回执与声明不一致",409);
  const t=now();await env.DB.prepare("UPDATE outreach_attachments SET status='verified',verified_at=? WHERE id=? AND status='declared'").bind(t,attachmentId).run();
  await audit(env,actor,"outreach.attachment.verify",attachmentId,"accepted");
  return json({attachment_id:attachmentId,status:"verified",verified_at:t});
}

async function downloadAttachment(env: Env, actor: AuthActor, attachmentId: string) {
  const row=await env.DB.prepare("SELECT a.*,t.owner_person_id AS current_owner FROM outreach_attachments a JOIN outreach_tasks t ON t.id=a.task_id WHERE a.id=? AND a.status='verified'").bind(attachmentId).first<Record<string,unknown>>();
  if(!row)throw new HttpError("附件不存在",404);
  if(!privileged(actor)&&row.current_owner!==actor.id)throw new HttpError("附件不属于当前客户范围",403);
  const token=await signFileToken(env,{op:"download",attachment_id:attachmentId,storage_key:row.storage_key,exp:Math.floor(Date.now()/1000)+300});
  return Response.redirect(`https://workbench.tigersourcingchina.com/outreach-files/download/${attachmentId}?token=${encodeURIComponent(token)}`,302);
}

export async function handleOutreach(request: Request, env: Env, actor: AuthActor, path: string) {
  if(path==="/api/outreach"&&request.method==="GET")return json(await readSnapshot(env,actor));
  if(path==="/api/outreach/import/dry-run"&&request.method==="POST")return importBatch(request,env,actor,true);
  if(path==="/api/outreach/import"&&request.method==="POST")return importBatch(request,env,actor,false);
  if(path==="/api/outreach/review-queue"&&request.method==="GET"){
    requirePermission(actor,"outreach:review");if(!privileged(actor))throw new HttpError("仅 Codex 服务或老板可检查",403);
    const rows=await env.DB.prepare("SELECT e.*,t.revision AS task_revision FROM outreach_contact_events e JOIN outreach_tasks t ON t.id=e.task_id WHERE e.review_status='submitted' ORDER BY e.created_at").all();return json({items:rows.results});
  }
  if(path==="/api/outreach/reviews"&&request.method==="POST")return reviewEvent(env,actor,await parse(request));
  let match=path.match(/^\/api\/outreach\/tasks\/([^/]+)\/start$/);if(match&&request.method==="POST")return startTask(env,actor,match[1],await parse(request));
  match=path.match(/^\/api\/outreach\/tasks\/([^/]+)\/assign$/);if(match&&request.method==="POST")return assignTask(env,actor,match[1],await parse(request));
  match=path.match(/^\/api\/outreach\/tasks\/([^/]+)\/submit$/);if(match&&request.method==="POST")return submitEvent(env,actor,match[1],await parse(request));
  match=path.match(/^\/api\/outreach\/tasks\/([^/]+)\/attachments$/);if(match&&request.method==="POST")return declareAttachment(env,actor,match[1],await parse(request));
  match=path.match(/^\/api\/outreach\/attachments\/([^/]+)\/complete$/);if(match&&request.method==="POST")return completeAttachment(env,actor,match[1],await parse(request));
  match=path.match(/^\/api\/outreach\/attachments\/([^/]+)\/download$/);if(match&&request.method==="GET")return downloadAttachment(env,actor,match[1]);
  throw new HttpError("Outreach API 路径不存在",404);
}
