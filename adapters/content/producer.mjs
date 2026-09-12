#!/usr/bin/env node
import { createHash } from "node:crypto";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (rows, value, index, list) =>
        value.startsWith("--")
          ? rows.concat([
              [
                value.slice(2),
                list[index + 1] && !list[index + 1].startsWith("--")
                  ? list[index + 1]
                  : "true",
              ],
            ])
          : rows,
      [],
    ),
);
const source = (args.source || "http://127.0.0.1:8787").replace(/\/$/, "");
const target = (args.target || process.env.TIGER_WORKBENCH_URL || "").replace(
  /\/$/,
  "",
);
const token = process.env.TIGER_PRODUCER_TOKEN || "";
const editorId = process.env.TIGER_EDITOR_SOURCE_MEMBER_ID || "";
if (!target) throw new Error("Missing --target or TIGER_WORKBENCH_URL");
if (token.length < 32)
  throw new Error("TIGER_PRODUCER_TOKEN is missing or too short");
const headers = { authorization: `Bearer ${token}` };
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
    duplex: options.body ? "half" : undefined,
  });
  const type = response.headers.get("content-type") || "";
  const value = type.includes("json") ? await response.json() : response;
  if (!response.ok)
    throw new Error(
      `${options.method || "GET"} ${url} -> ${response.status}: ${type.includes("json") ? JSON.stringify(value) : await response.text()}`,
    );
  return value;
}
async function sourceJson(path) {
  const response = await fetch(source + path);
  if (!response.ok) throw new Error(`Source ${path} -> ${response.status}`);
  return response.json();
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
async function uploadArtifact(task, artifact) {
  if (!artifact.download_url) return artifact;
  const input = await fetch(new URL(artifact.download_url, source));
  if (!input.ok)
    throw new Error(`Cannot read ${task.id}/${artifact.key}: ${input.status}`);
  const url = `${target}/api/producer/content/artifacts/${encodeURIComponent(task.id)}/${task.revision}/${encodeURIComponent(artifact.key)}`;
  const result = await request(url, {
    method: "PUT",
    headers: {
      "content-type":
        input.headers.get("content-type") || "application/octet-stream",
      "x-file-name": encodeURIComponent(artifact.filename),
    },
    body: input.body,
  });
  return {
    ...artifact,
    download_url: result.download_url,
    size_bytes: result.size_bytes,
  };
}
async function prepareProjection(includeFiles) {
  const snapshot = await sourceJson("/api/workbench/snapshot");
  if (!includeFiles) return snapshot;
  for (const task of snapshot.tasks) {
    const work = task.work_package;
    if (!work) continue;
    const next = [];
    for (const artifact of work.artifacts)
      next.push(await uploadArtifact(task, artifact));
    work.artifacts = next;
    const urlFor = (key) => next.find((x) => x.key === key)?.download_url;
    task.preview_url = urlFor("preview") || task.preview_url;
    task.package_url = urlFor("full_pack") || task.package_url;
    if (work.voice) work.voice.audio_url = urlFor("voice");
    if (work.subtitles) {
      work.subtitles.srt_url = urlFor("srt");
      work.subtitles.zh_srt_url = urlFor("zh_srt");
    }
    for (const asset of work.assets) asset.download_url = urlFor("source");
  }
  return snapshot;
}
async function sync(snapshot) {
  return request(`${target}/api/producer/content/sync`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(snapshot),
  });
}
async function local(path, options = {}) {
  const response = await fetch(source + path, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers },
    duplex:
      options.body && typeof options.body !== "string" ? "half" : undefined,
  });
  const type = response.headers.get("content-type") || "";
  const value = type.includes("json") ? await response.json() : null;
  if (!response.ok)
    throw new Error(
      `Local ${path} -> ${response.status}: ${JSON.stringify(value)}`,
    );
  return value;
}
async function receipt(requestId, status, receiptValue) {
  return request(`${target}/api/producer/content/commands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      request_id: requestId,
      status,
      receipt: receiptValue,
    }),
  });
}
async function handle(command) {
  if (!editorId)
    throw new Error(
      "TIGER_EDITOR_SOURCE_MEMBER_ID is required to consume editor commands",
    );
  const p = command.payload;
  let result;
  if (command.command_type === "CLAIM") {
    result = await local(
      `/api/workbench/tasks/${encodeURIComponent(command.content_id)}/claim`,
      { method: "POST", body: JSON.stringify({ member_id: editorId }) },
    );
  } else if (command.command_type === "ISSUE") {
    result = await local(
      `/api/workbench/tasks/${encodeURIComponent(command.content_id)}/issues`,
      {
        method: "POST",
        body: JSON.stringify({ member_id: editorId, note: p.note }),
      },
    );
  } else if (command.command_type === "HANDBACK") {
    const uploadByName = new Map(command.uploads.map((x) => [x.file_name, x]));
    result = await local("/api/workbench/handbacks", {
      method: "POST",
      body: JSON.stringify({
        request_id: command.request_id,
        content_id: command.content_id,
        base_revision: command.base_revision,
        edit_generation: command.edit_generation,
        member_id: editorId,
        note: p.note,
        checks: p.checks,
        files: p.files.map((x) => ({ ...x, kind: x.kind || "attachment" })),
      }),
    });
    for (const file of result.files) {
      if (file.status === "VERIFIED") continue;
      const cloud = uploadByName.get(file.file_name);
      if (!cloud || cloud.status !== "VERIFIED")
        throw new Error(
          `Cloud handback file is not verified: ${file.file_name}`,
        );
      const stream = await request(new URL(cloud.download_url, target).href);
      await local(
        `/api/workbench/handbacks/${encodeURIComponent(result.handback.id)}/files/${encodeURIComponent(file.id)}`,
        {
          method: "PUT",
          headers: { "content-type": "application/octet-stream" },
          body: stream.body,
        },
      );
    }
    result = await local(
      `/api/workbench/handbacks/${encodeURIComponent(result.handback.id)}/finalize`,
      { method: "POST" },
    );
  } else throw new Error(`Unsupported command type ${command.command_type}`);
  const latest = await sourceJson("/api/workbench/snapshot");
  try {
    await sync(await prepareProjection(false));
  } catch (error) {
    if (!String(error).includes("409")) throw error;
  }
  await receipt(command.request_id, "ACKNOWLEDGED", {
    source_revision: latest.source_revision,
    source_status: result.handback?.status || "APPLIED",
    handled_at: new Date().toISOString(),
  });
  return { request_id: command.request_id, status: "ACKNOWLEDGED" };
}
if (args.once === "commands") {
  const batch = await request(`${target}/api/producer/content/commands`);
  for (const command of batch.commands) {
    try {
      console.log(JSON.stringify(await handle(command)));
    } catch (error) {
      await receipt(command.request_id, "FAILED", {
        error: String(error),
        handled_at: new Date().toISOString(),
      });
      console.error(`FAILED ${command.request_id}: ${error}`);
    }
  }
} else {
  const snapshot = await prepareProjection(args.files === "true");
  try {
    console.log(JSON.stringify(await sync(snapshot)));
  } catch (error) {
    if (!String(error).includes("409")) throw error;
    console.log(JSON.stringify({status:"UNCHANGED",source_revision:snapshot.source_revision,idempotent:true}));
  }
}
