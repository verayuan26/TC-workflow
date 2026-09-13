import { applyOutreachAction, ActionError } from "../src/outreach/engine";
import { initialLab, type OutreachLab } from "../src/outreach/model";
import { authenticate, HttpError, requirePermission, sha256 } from "./auth";
import type { AuthActor, Env } from "./types";

const json = (value: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json;charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
const body = async (request: Request) => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new HttpError("请求正文必须是 JSON");
  }
};
const id = () => crypto.randomUUID();
const safeFileName = (value: string) =>
  [...value]
    .filter((char) => char >= " " && char !== "/" && char !== "\\")
    .join("")
    .trim()
    .slice(0, 180);
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value as object)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(value);
}
async function audit(
  env: Env,
  actor: AuthActor,
  action: string,
  target: string,
  result: string,
  details: unknown = {},
) {
  await env.DB.prepare(
    "INSERT INTO audit_log(id,at,actor_id,actor_kind,action,target,result,details_json) VALUES(?,?,?,?,?,?,?,?)",
  )
    .bind(
      id(),
      new Date().toISOString(),
      actor.id,
      actor.kind,
      action,
      target,
      result,
      JSON.stringify(details),
    )
    .run();
}
async function outreachRow(env: Env, actor: AuthActor) {
  let row = await env.DB.prepare(
    "SELECT data,revision FROM outreach_workspaces WHERE id=?",
  )
    .bind("primary")
    .first<{ data: string; revision: number }>();
  if (!row && actor.role === "boss") {
    const now = new Date().toISOString();
    const lab = initialLab(now);
    await env.DB.prepare(
      "INSERT INTO outreach_workspaces(id,owner_person_id,data,revision,created_at,updated_at) VALUES(?,?,?,?,?,?)",
    )
      .bind("primary", actor.id, JSON.stringify(lab), 1, now, now)
      .run();
    row = { data: JSON.stringify(lab), revision: 1 };
  }
  if (!row) throw new HttpError("外联工作区尚未由老板初始化", 404);
  return { lab: JSON.parse(row.data) as OutreachLab, revision: row.revision };
}
function actorForOutreach(actor: AuthActor) {
  if (!["boss", "sales", "codex"].includes(actor.role))
    throw new HttpError("当前角色不能操作客户开发", 403);
  return {
    id: actor.id,
    email: actor.email,
    name: actor.name,
    role: actor.role as "boss" | "sales" | "codex",
  };
}
async function me(request: Request, env: Env) {
  const actor = await authenticate(request, env);
  return json({
    person_id: actor.id,
    email: actor.email,
    name: actor.name,
    role: actor.role,
    permissions: actor.permissions,
  });
}
async function outreach(request: Request, env: Env) {
  const actor = await authenticate(request, env);
  requirePermission(actor, "outreach:read");
  if (request.method === "GET") {
    const state = await outreachRow(env, actor);
    return json(state, 200, { etag: `"${state.revision}"` });
  }
  const expected = Number(request.headers.get("if-match"));
  if (!Number.isInteger(expected))
    throw new HttpError("缺少有效 If-Match 版本", 428);
  const current = await outreachRow(env, actor);
  if (current.revision !== expected)
    throw new HttpError("共享状态已有更新，请刷新后重试", 409);
  const payload = await body(request);
  let result;
  try {
    result = applyOutreachAction(current.lab, actorForOutreach(actor), payload);
  } catch (error) {
    if (error instanceof ActionError)
      throw new HttpError(error.message, error.status);
    throw error;
  }
  const now = new Date().toISOString();
  const update = await env.DB.prepare(
    "UPDATE outreach_workspaces SET data=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?",
  )
    .bind(JSON.stringify(result.lab), now, "primary", expected)
    .run();
  if (!update.meta.changes)
    throw new HttpError("共享状态已有更新，请刷新后重试", 409);
  await audit(
    env,
    actor,
    String(payload.action || "outreach.action"),
    "outreach:primary",
    "accepted",
  );
  return json({
    message: result.message,
    revision: expected + 1,
    lab: result.lab,
  });
}
async function projection(env: Env) {
  const row = await env.DB.prepare(
    "SELECT snapshot_json FROM content_projections WHERE cycle_id=?",
  )
    .bind("CYCLE01")
    .first<{ snapshot_json: string }>();
  return row
    ? (JSON.parse(row.snapshot_json) as Record<string, unknown>)
    : null;
}
function editorReadyTask(task:Record<string,unknown>){
  const workPackage=task.work_package as Record<string,unknown>|undefined;
  return task.owner==="EDITOR"&&task.kind==="short_video"&&Number(task.revision)>=2&&workPackage?.status==="READY_FOR_EDITOR";
}
async function projectionForActor(env:Env,actor:AuthActor){
  requirePermission(actor,"content:read","content:read:assigned");
  const value=await projection(env);if(!value)return null;
  if(actor.role==="editor"){
    const copy=structuredClone(value);copy.tasks=(copy.tasks as Record<string,unknown>[]||[]).filter(editorReadyTask);return copy;
  }
  if(!actor.permissions.includes("content:read:assigned"))return value;
  const copy=structuredClone(value);const tasks=(copy.tasks as Record<string,unknown>[]||[]).filter(task=>task.assignee_person_id===actor.id);copy.tasks=tasks;copy.publications=[];return copy;
}
function validateProjection(value: Record<string, unknown>) {
  if (
    value.schema_version !== "tiger-workbench/1" ||
    value.source !== "production" ||
    value.cycle_id !== "CYCLE01" ||
    value.spec_version !== "V2.0"
  )
    throw new HttpError("内容快照协议不匹配");
  if (
    !Number.isInteger(value.source_revision) ||
    Number(value.source_revision) < 1
  )
    throw new HttpError("source_revision 无效");
  if (
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.publications) ||
    value.publications.length !== 41
  )
    throw new HttpError("内容任务或 41 个发布槽位不完整");
}
async function syncContent(request: Request, env: Env, actor: AuthActor) {
  requirePermission(actor, "content:sync");
  const value = await body(request);
  validateProjection(value);
  const previous = await env.DB.prepare(
    "SELECT source_revision FROM content_projections WHERE cycle_id=?",
  )
    .bind("CYCLE01")
    .first<{ source_revision: number }>();
  const sourceRevision = Number(value.source_revision);
  if (previous && sourceRevision <= previous.source_revision)
    throw new HttpError("拒绝重复或倒退的生产投影", 409);
  const sourceUpdated =
    typeof value.generated_at === "string"
      ? value.generated_at
      : new Date().toISOString();
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO content_projections(cycle_id,source_revision,snapshot_json,source_updated_at,synced_at) VALUES(?,?,?,?,?) ON CONFLICT(cycle_id) DO UPDATE SET source_revision=excluded.source_revision,snapshot_json=excluded.snapshot_json,source_updated_at=excluded.source_updated_at,synced_at=excluded.synced_at",
  )
    .bind("CYCLE01", sourceRevision, JSON.stringify(value), sourceUpdated, now)
    .run();
  await audit(env, actor, "content.sync", "CYCLE01", "accepted", {
    source_revision: sourceRevision,
  });
  return json({ status: "SYNCED", source_revision: sourceRevision });
}
async function createCommand(request: Request, env: Env, actor: AuthActor) {
  requirePermission(
    actor,
    "content:claim",
    "content:handback",
    "content:issue",
    "content:decision",
  );
  const payload = await body(request);
  const requestId = String(payload.request_id || "");
  const type = String(payload.command_type || "");
  const contentId = String(payload.content_id || "");
  const baseRevision = Number(payload.base_revision);
  const editGeneration = Number(payload.edit_generation);
  if (
    !/^[A-Za-z0-9._:-]{12,200}$/.test(requestId) ||
    !["CLAIM", "HANDBACK", "ISSUE", "DECISION"].includes(type) ||
    !contentId ||
    !Number.isInteger(baseRevision) ||
    !Number.isInteger(editGeneration)
  )
    throw new HttpError("命令字段不完整");
  const fingerprint = await sha256(canonical(payload));
  const found = await env.DB.prepare(
    "SELECT request_fingerprint,status,receipt_json FROM content_commands WHERE request_id=?",
  )
    .bind(requestId)
    .first<{
      request_fingerprint: string;
      status: string;
      receipt_json: string | null;
    }>();
  if (found) {
    if (found.request_fingerprint !== fingerprint)
      throw new HttpError("同一 request_id 不能代表不同命令", 409);
    return json({
      request_id: requestId,
      status: found.status,
      receipt: found.receipt_json ? JSON.parse(found.receipt_json) : null,
      idempotent: true,
    });
  }
  const snapshot = await projection(env);
  const tasks =
    (snapshot?.tasks as Record<string, unknown>[] | undefined) || [];
  const task = tasks.find((x) => x.id === contentId);
  if (
    !task ||
    task.revision !== baseRevision ||
    task.edit_generation !== editGeneration
  )
    throw new HttpError("任务版本已更新，请刷新后重新提交", 409);
  if (["CLAIM", "HANDBACK", "ISSUE"].includes(type) && actor.role !== "editor")
    throw new HttpError("该命令只由剪辑师提交", 403);
  if (["CLAIM", "HANDBACK", "ISSUE"].includes(type) && !editorReadyTask(task))
    throw new HttpError("剪辑师只能处理资料齐全的当前 R2 视频任务", 403);
  if (type === "DECISION" && actor.role !== "boss")
    throw new HttpError("该决定只由老板提交", 403);
  if (
    type === "CLAIM" &&
    (task.owner !== "EDITOR" ||
      !["NEEDS_EDIT", "NEEDS_ASSET", "REVIEW_REQUIRED"].includes(
        String(task.status),
      ))
  )
    throw new HttpError("当前任务不能领取", 409);
  if (type === "HANDBACK") {
    const claim = task.claim as Record<string, unknown> | undefined;
    if (
      actor.role !== "editor" ||
      editGeneration < 1 ||
      claim?.claimant_member_id !== actor.id
    )
      throw new HttpError("只有领取当前编辑代次的剪辑师可以回传", 403);
    if (
      !Array.isArray(payload.checks) ||
      !payload.checks.length ||
      typeof payload.note !== "string" ||
      !payload.note.trim()
    )
      throw new HttpError("回传必须包含检查项和修改说明");
  }
  const pendingUploads: Array<{
    uploadId: string;
    objectKey: string;
    fileName: string;
    size: number;
    fileSha: string;
    contentType: string;
  }> = [];
  if (type === "HANDBACK") {
    const files = payload.files;
    if (!Array.isArray(files) || !files.length || files.length > 20)
      throw new HttpError("回传必须包含 1—20 个文件");
    for (const value of files as Record<string, unknown>[]) {
      const fileName = safeFileName(String(value.name || ""));
      const size = Number(value.size);
      const fileSha = String(value.sha256 || "").toLowerCase();
      if (
        !fileName ||
        !Number.isInteger(size) ||
        size < 1 ||
        !/^[a-f0-9]{64}$/.test(fileSha)
      )
        throw new HttpError("回传文件清单无效");
      const uploadId = id();
      pendingUploads.push({
        uploadId,
        objectKey: `handbacks/${requestId}/${uploadId}/${fileName}`,
        fileName,
        size,
        fileSha,
        contentType: String(value.mimeType || "application/octet-stream"),
      });
    }
  }
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO content_commands(request_id,request_fingerprint,command_type,actor_person_id,content_id,base_revision,edit_generation,payload_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
  )
    .bind(
      requestId,
      fingerprint,
      type,
      actor.id,
      contentId,
      baseRevision,
      editGeneration,
      JSON.stringify(payload),
      "PENDING_PRODUCER",
      now,
      now,
    )
    .run();
  const uploads: Array<{
    upload_id: string;
    file_name: string;
    upload_url: string;
  }> = [];
  for (const value of pendingUploads) {
    await env.DB.prepare(
      "INSERT INTO content_uploads(upload_id,request_id,object_key,file_name,size_bytes,sha256,content_type,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
    )
      .bind(
        value.uploadId,
        requestId,
        value.objectKey,
        value.fileName,
        value.size,
        value.fileSha,
        value.contentType,
        "DECLARED",
        now,
      )
      .run();
    uploads.push({
      upload_id: value.uploadId,
      file_name: value.fileName,
      upload_url: `/api/content/uploads/${value.uploadId}`,
    });
  }
  await audit(env, actor, "content.command", contentId, "pending", {
    request_id: requestId,
    type,
  });
  return json(
    { request_id: requestId, status: "PENDING_PRODUCER", uploads },
    202,
  );
}
async function producerCommands(request: Request, env: Env, actor: AuthActor) {
  requirePermission(actor, "content:commands");
  if (request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT request_id,command_type,actor_person_id,content_id,base_revision,edit_generation,payload_json,created_at FROM content_commands WHERE status='PENDING_PRODUCER' ORDER BY created_at LIMIT 20",
    ).all();
    const commands = [];
    for (const row of result.results) {
      const uploads = await env.DB.prepare(
        "SELECT upload_id,file_name,size_bytes,sha256,content_type,status FROM content_uploads WHERE request_id=? ORDER BY created_at",
      )
        .bind(row.request_id)
        .all();
      commands.push({
        ...row,
        payload: JSON.parse(String(row.payload_json)),
        uploads: uploads.results.map((file) => ({
          ...file,
          download_url: `/api/content/uploads/${file.upload_id}`,
        })),
      });
    }
    return json({
      commands,
    });
  }
  const payload = await body(request);
  const requestId = String(payload.request_id || "");
  const status = String(payload.status || "");
  if (!["ACKNOWLEDGED", "REJECTED", "FAILED"].includes(status))
    throw new HttpError("回执状态无效");
  const command = await env.DB.prepare(
    "SELECT status FROM content_commands WHERE request_id=?",
  )
    .bind(requestId)
    .first<{ status: string }>();
  if (!command) throw new HttpError("命令不存在", 404);
  if (command.status !== "PENDING_PRODUCER")
    return json({
      request_id: requestId,
      status: command.status,
      idempotent: true,
    });
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE content_commands SET status=?,receipt_json=?,updated_at=? WHERE request_id=? AND status=?",
  )
    .bind(
      status,
      JSON.stringify(payload.receipt || {}),
      now,
      requestId,
      "PENDING_PRODUCER",
    )
    .run();
  await audit(env, actor, "content.receipt", requestId, status);
  return json({ request_id: requestId, status });
}
async function producerArtifact(
  request: Request,
  env: Env,
  actor: AuthActor,
  segments: string[],
) {
  requirePermission(actor, "content:artifacts");
  const [contentId, revisionText, artifactKey] =
    segments.map(decodeURIComponent);
  const revision = Number(revisionText);
  if (!contentId || !Number.isInteger(revision) || !artifactKey)
    throw new HttpError("文件路径无效");
  const fileName = decodeURIComponent(
    request.headers.get("x-file-name") || artifactKey,
  );
  const safeName = safeFileName(fileName);
  const objectKey = `content/CYCLE01/${contentId}/r${revision}/${artifactKey}/${safeName}`;
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";
  const contentSha256 = request.headers.get("x-content-sha256") || null;
  await env.FILES.put(objectKey, request.body, {
    httpMetadata: { contentType },
  });
  const stored = await env.FILES.head(objectKey);
  if (!stored) throw new HttpError("文件写入失败", 500);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO content_artifacts(cycle_id,content_id,revision,artifact_key,object_key,file_name,content_type,size_bytes,sha256,synced_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(content_id,revision,artifact_key) DO UPDATE SET object_key=excluded.object_key,file_name=excluded.file_name,content_type=excluded.content_type,size_bytes=excluded.size_bytes,sha256=excluded.sha256,synced_at=excluded.synced_at",
  )
    .bind(
      "CYCLE01",
      contentId,
      revision,
      artifactKey,
      objectKey,
      safeName,
      contentType,
      stored.size,
      contentSha256,
      now,
    )
    .run();
  await audit(env, actor, "content.artifact.sync", contentId, "accepted", {
    revision,
    artifact_key: artifactKey,
    size_bytes: stored.size,
  });
  return json({
    content_id: contentId,
    revision,
    artifact_key: artifactKey,
    size_bytes: stored.size,
    download_url: `/api/content/artifacts/${encodeURIComponent(contentId)}/${revision}/${encodeURIComponent(artifactKey)}`,
  });
}
async function contentArtifact(
  request: Request,
  env: Env,
  actor: AuthActor,
  segments: string[],
) {
  requirePermission(actor, "content:read");
  const [contentId, revisionText, artifactKey] =
    segments.map(decodeURIComponent);
  const row = await env.DB.prepare(
    "SELECT object_key,file_name,content_type FROM content_artifacts WHERE content_id=? AND revision=? AND artifact_key=?",
  )
    .bind(contentId, Number(revisionText), artifactKey)
    .first<{ object_key: string; file_name: string; content_type: string }>();
  if (!row) throw new HttpError("文件不存在", 404);
  const object = await env.FILES.get(row.object_key);
  if (!object) throw new HttpError("文件对象不存在", 404);
  return new Response(object.body, {
    headers: {
      "content-type": row.content_type,
      "content-length": String(object.size),
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`,
      etag: object.httpEtag,
    },
  });
}
async function upload(
  request: Request,
  env: Env,
  actor: AuthActor,
  key: string,
) {
  const row = await env.DB.prepare(
    "SELECT object_key,content_type,status,size_bytes,sha256 FROM content_uploads WHERE upload_id=?",
  )
    .bind(key)
    .first<{
      object_key: string;
      content_type: string;
      status: string;
      size_bytes: number;
      sha256: string;
    }>();
  if (!row) throw new HttpError("上传声明不存在", 404);
  if (request.method === "PUT") {
    requirePermission(actor, "content:handback");
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength !== row.size_bytes)
      throw new HttpError("文件大小与清单不一致", 409);
    await env.FILES.put(row.object_key, request.body, {
      httpMetadata: { contentType: row.content_type },
      sha256: row.sha256,
    });
    const stored = await env.FILES.head(row.object_key);
    if (!stored || stored.size !== row.size_bytes)
      throw new HttpError("文件大小校验失败", 409);
    await env.DB.prepare(
      "UPDATE content_uploads SET status=? WHERE upload_id=?",
    )
      .bind("VERIFIED", key)
      .run();
    return json({ upload_id: key, status: "VERIFIED" });
  }
  const object = await env.FILES.get(row.object_key);
  if (!object) throw new HttpError("文件不存在", 404);
  return new Response(object.body, {
    headers: {
      "content-type":
        object.httpMetadata?.contentType || "application/octet-stream",
      etag: object.httpEtag,
    },
  });
}
async function overview(request: Request, env: Env) {
  const actor = await authenticate(request, env);
  let content:null|Record<string,unknown>=null;try{content=await projectionForActor(env,actor)}catch{/* module not granted */}
  let outreachState: null | { lab: OutreachLab; revision: number } = null;
  try {
    outreachState = await outreachRow(env, actor);
  } catch {
    /* intentionally unavailable */
  }
  const decisions: Array<{
    id: unknown;
    module: string;
    title: unknown;
    reason: unknown;
  }> = [];
  if (content) {
    for (const task of (content.tasks as Record<string, unknown>[]) || [])
      if (task.owner === "BOSS")
        decisions.push({
          id: task.id,
          module: "内容",
          title: task.title,
          reason: task.reason,
        });
  }
  if (outreachState)
    for (const issue of outreachState.lab.issues.filter(
      (i) => i.owner === "boss" && i.status !== "resolved",
    ))
      decisions.push({
        id: issue.id,
        module: "客户开发",
        title: issue.title,
        reason: issue.category,
      });
  return json({
    content: { available: !!content, snapshot: content },
    outreach: {
      available: !!outreachState,
      revision: outreachState?.revision,
      lab: outreachState?.lab,
    },
    decisions,
  });
}
async function admin(
  request: Request,
  env: Env,
  actor: AuthActor,
  path: string,
) {
  if (actor.role !== "boss") throw new HttpError("仅老板可管理成员", 403);
  if (path === "/api/admin/members" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT person_id,name,email,staff_role AS role,status,permissions_json,source_member_id FROM members ORDER BY name",
    ).all();
    return json(
      result.results.map((row) => ({
        ...row,
        permissions: JSON.parse(String(row.permissions_json)),
        permissions_json: undefined,
      })),
    );
  }
  if (path === "/api/admin/members/import/dry-run" && request.method === "POST") {
    const payload = await body(request);
    const members = payload.members;
    if (!Array.isArray(members) || !members.length || members.length > 50)
      throw new HttpError("成员导入应为 1—50 人");
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const rows=[];
    for(const item of members as Record<string,unknown>[]){
      const personId=String(item.person_id||"");const email=String(item.work_email||"").toLowerCase();
      if(seenIds.has(personId)||seenEmails.has(email)){rows.push({person_id:personId,status:"conflict",reason:"导入文件内重复"});continue}
      seenIds.add(personId);seenEmails.add(email);
      const matches=await env.DB.prepare("SELECT person_id,email,source_member_id FROM members WHERE person_id=? OR email=? COLLATE NOCASE OR (source_member_id IS NOT NULL AND source_member_id=?)").bind(personId,email,item.source_member_id||null).all();
      if(matches.results.length>1)rows.push({person_id:personId,status:"conflict",reason:"ID、工作邮箱或旧成员映射到不同人员"});
      else if(matches.results.length===1)rows.push({person_id:personId,status:"match"});
      else rows.push({person_id:personId,status:"new"});
    }
    return json({total:members.length,match:rows.filter(x=>x.status==="match").length,new:rows.filter(x=>x.status==="new").length,conflict:rows.filter(x=>x.status==="conflict").length,rows});
  }
  if (path === "/api/admin/members/import" && request.method === "POST") {
    const payload = await body(request);
    const members = payload.members;
    if (!Array.isArray(members) || !members.length || members.length > 50)
      throw new HttpError("成员导入应为 1—50 人");
    const now = new Date().toISOString();
    const statements = [];
    for (const item of members as Record<string, unknown>[]) {
      const personId = String(item.person_id || "");
      const email = String(item.work_email || "").toLowerCase();
      const name = String(item.display_name || "");
      const role = String(item.staff_role || "");
      const permissions = item.permissions;
      if (
        !/^person_[a-z0-9_-]{3,80}$/.test(personId) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !name ||
        !["boss", "editor", "sales", "codex", "coordinator", "procurement"].includes(role) ||
        !Array.isArray(permissions)
      )
        throw new HttpError("成员映射格式无效");
      statements.push(
        env.DB.prepare(
          "INSERT INTO members(person_id,email,name,staff_role,status,permissions_json,source_member_id,staff_pronoun_grammar,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(person_id) DO UPDATE SET email=excluded.email,name=excluded.name,staff_role=excluded.staff_role,status=excluded.status,permissions_json=excluded.permissions_json,source_member_id=excluded.source_member_id,staff_pronoun_grammar=excluded.staff_pronoun_grammar,updated_at=excluded.updated_at",
        ).bind(
          personId,
          email,
          name,
          role,
          "active",
          JSON.stringify(permissions),
          item.source_member_id || null,
          item.staff_pronoun_grammar || null,
          now,
          now,
        ),
      );
    }
    await env.DB.batch(statements);
    const social=payload.social_accounts;
    if(Array.isArray(social)){
      const accountStatements=[];
      for(const value of social as Record<string,unknown>[]){
        const accountId=String(value.account_id||"");const ownerId=String(value.owner_person_id||"");const platform=String(value.platform||"");const persona=String(value.channel_persona_name||"");
        if(!/^social_[a-z0-9_-]{3,100}$/.test(accountId)||!ownerId||!platform||!persona)throw new HttpError("社媒账号映射格式无效");
        accountStatements.push(env.DB.prepare("INSERT INTO social_accounts(account_id,owner_person_id,platform,channel_persona_name,login_email,channel_id,browser_locator,short_code,authorization_status,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(account_id) DO UPDATE SET owner_person_id=excluded.owner_person_id,platform=excluded.platform,channel_persona_name=excluded.channel_persona_name,login_email=excluded.login_email,channel_id=excluded.channel_id,browser_locator=excluded.browser_locator,short_code=excluded.short_code,authorization_status=excluded.authorization_status,notes=excluded.notes,updated_at=excluded.updated_at").bind(accountId,ownerId,platform,persona,value.login_email||null,value.channel_id||null,value.browser_locator||null,value.short_code||null,value.authorization_status||"unknown",value.notes||null,now,now));
      }
      if(accountStatements.length)await env.DB.batch(accountStatements);
    }
    await audit(env, actor, "members.import", "members", "accepted", {
      count: members.length,
    });
    return json({ imported: members.length, social_accounts: Array.isArray(social)?social.length:0 });
  }
  if (path === "/api/admin/service-identities" && request.method === "POST") {
    const payload = await body(request);
    const token = String(payload.token || "");
    const serviceId = String(payload.id || "");
    const scopes = payload.scopes;
    if (
      token.length < 32 ||
      !/^service_[a-z0-9_-]{3,80}$/.test(serviceId) ||
      !Array.isArray(scopes)
    )
      throw new HttpError("服务身份字段无效");
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO service_identities(id,name,token_hash,scopes_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,token_hash=excluded.token_hash,scopes_json=excluded.scopes_json,status=excluded.status,updated_at=excluded.updated_at",
    )
      .bind(
        serviceId,
        String(payload.name || serviceId),
        await sha256(token),
        JSON.stringify(scopes),
        "active",
        now,
        now,
      )
      .run();
    await audit(env, actor, "service.upsert", serviceId, "accepted");
    return json({ id: serviceId, status: "active" });
  }
  throw new HttpError("管理接口不存在", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/api/me" && request.method === "GET")
        return await me(request, env);
      if (
        path === "/api/integrations/multica/members" &&
        request.method === "GET"
      ) {
        const actor = await authenticate(request, env);
        return json({
          members: [{ id: actor.id, name: actor.name, role: actor.role }],
        });
      }
      if (path === "/api/overview" && request.method === "GET")
        return await overview(request, env);
      if (path === "/api/outreach" && request.method === "GET")
        return await outreach(request, env);
      if (path === "/api/outreach/actions" && request.method === "POST")
        return await outreach(request, env);
      if (path === "/api/content/projection" && request.method === "GET") {
        const actor=await authenticate(request, env);
        const value = await projectionForActor(env,actor);
        return value ? json(value) : json({ error: "尚无生产投影" }, 404);
      }
      if (path === "/api/workbench/snapshot" && request.method === "GET") {
        const actor=await authenticate(request, env);
        const value = await projectionForActor(env,actor);
        return value ? json(value) : json({ error: "尚无生产投影" }, 404);
      }
      if (path === "/api/content/commands" && request.method === "POST")
        return await createCommand(
          request,
          env,
          await authenticate(request, env),
        );
      if (path === "/api/producer/content/sync" && request.method === "PUT")
        return await syncContent(
          request,
          env,
          await authenticate(request, env, true),
        );
      if (
        path.startsWith("/api/producer/content/artifacts/") &&
        request.method === "PUT"
      )
        return await producerArtifact(
          request,
          env,
          await authenticate(request, env, true),
          path.split("/").slice(5),
        );
      if (
        path === "/api/producer/content/commands" &&
        ["GET", "POST"].includes(request.method)
      )
        return await producerCommands(
          request,
          env,
          await authenticate(request, env, true),
        );
      if (path.startsWith("/api/content/uploads/"))
        return await upload(
          request,
          env,
          await authenticate(request, env, request.method === "GET"),
          path.split("/").pop() || "",
        );
      if (
        path.startsWith("/api/content/artifacts/") &&
        request.method === "GET"
      )
        return await contentArtifact(
          request,
          env,
          await authenticate(request, env),
          path.split("/").slice(4),
        );
      if (path.startsWith("/api/admin/"))
        return await admin(
          request,
          env,
          await authenticate(request, env),
          path,
        );
      if (path.startsWith("/api/")) throw new HttpError("接口不存在", 404);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      return json(
        { error: error instanceof Error ? error.message : "服务器错误" },
        status,
      );
    }
  },
} satisfies ExportedHandler<Env>;
