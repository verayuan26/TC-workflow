import type { Snapshot, Task } from "./domain";

export interface WorkbenchMember {
  id: string;
  name: string;
  role: string;
}

export interface UploadFile {
  file: File;
  name: string;
  size: number;
  sha256: string;
  kind: "video" | "project" | "source" | "export" | "attachment";
}

type HandbackDetail = {
  handback: { id: string; request_id: string; status: string; reason?: string };
  files: Array<{ id: string; file_name: string; status: string }>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof Blob)
        ? { "content-type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : undefined;
  if (!response.ok) {
    const message =
      body?.error?.message ?? body?.error ?? `请求失败（${response.status}）`;
    throw new Error(message);
  }
  return body as T;
}

export async function fetchSnapshot(previous?: Snapshot): Promise<Snapshot> {
  const snapshot = await request<Snapshot>("/api/workbench/snapshot", {
    cache: "no-store",
  });
  if (previous && snapshot.source_revision < previous.source_revision) {
    throw new Error("生产端返回了过期快照，当前页面保留较新的进度。");
  }
  return snapshot;
}

export async function fetchMembers(): Promise<WorkbenchMember[]> {
  const body = await request<{ members: WorkbenchMember[] }>(
    "/api/integrations/multica/members",
    {
      cache: "no-store",
    },
  );
  return body.members;
}

export async function claimTask(
  task: Task,
  memberId: string,
): Promise<Snapshot> {
  await request<{ status: string }>("/api/content/commands", {
    method: "POST",
    body: JSON.stringify({
      request_id: `claim:${task.id}:r${task.revision}:g${task.edit_generation}:${memberId}`,
      command_type: "CLAIM",
      content_id: task.id,
      base_revision: task.revision,
      edit_generation: task.edit_generation,
    }),
  });
  throw new Error("领取命令已提交，等待原生产库回执；收到后页面会自动刷新。");
}

export async function submitIssue(
  task: Task,
  memberId: string,
  note: string,
): Promise<Snapshot> {
  await request<{ status: string }>("/api/content/commands", {
    method: "POST",
    body: JSON.stringify({
      request_id: `issue:${task.id}:r${task.revision}:g${task.edit_generation}:${memberId}:${await shortHash(note)}`,
      command_type: "ISSUE",
      content_id: task.id,
      base_revision: task.revision,
      edit_generation: task.edit_generation,
      note,
    }),
  });
  throw new Error("问题命令已提交，等待原生产库回执；其他任务继续。");
}

export async function uploadHandback(input: {
  task: Task;
  memberId: string;
  note: string;
  checks: string[];
  requestId: string;
  files: UploadFile[];
  onProgress?: (message: string) => void;
}): Promise<HandbackDetail> {
  const command = await request<{
    request_id: string;
    status: string;
    uploads: Array<{
      upload_id: string;
      file_name: string;
      upload_url: string;
    }>;
  }>("/api/content/commands", {
    method: "POST",
    body: JSON.stringify({
      request_id: input.requestId,
      command_type: "HANDBACK",
      content_id: input.task.id,
      base_revision: input.task.revision,
      edit_generation: input.task.edit_generation,
      member_id: input.memberId,
      note: input.note,
      checks: input.checks,
      files: input.files.map(({ name, size, sha256, kind, file }) => ({
        name,
        size,
        sha256,
        kind,
        mimeType: file.type || undefined,
      })),
    }),
  });
  for (const selected of input.files) {
    const remote = command.uploads.find(
      (file) => file.file_name === selected.name,
    );
    if (!remote) throw new Error(`生产端没有登记文件：${selected.name}`);
    input.onProgress?.(`正在接收 ${selected.name}`);
    await request<{ status: string }>(remote.upload_url, {
      method: "PUT",
      headers: {
        "content-type": selected.file.type || "application/octet-stream",
        "content-length": String(selected.size),
      },
      body: selected.file,
    });
  }
  input.onProgress?.("文件已校验入库，等待原生产端接收");
  return {
    handback: {
      id: command.request_id,
      request_id: command.request_id,
      status: "PENDING_PRODUCER",
      reason: "云端已收齐；等待生产端回执",
    },
    files: command.uploads.map((file) => ({
      id: file.upload_id,
      file_name: file.file_name,
      status: "VERIFIED",
    })),
  };
}

async function shortHash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .slice(0, 8)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export function classifyFile(file: File): UploadFile["kind"] {
  if (/\.mp4$/i.test(file.name)) return "video";
  if (/\.(zip|prproj|drp|veg|aep)$/i.test(file.name)) return "project";
  if (/\.(psd|ai|indd|fig|pptx)$/i.test(file.name)) return "source";
  return "attachment";
}
