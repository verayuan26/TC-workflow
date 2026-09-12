import type { OutreachLab } from "./model";
export type OutreachSnapshot = { revision: number; lab: OutreachLab };
export async function readOutreach(): Promise<OutreachSnapshot> {
  const response = await fetch("/api/outreach");
  if (!response.ok)
    throw new Error(
      response.status === 503 ? "共享数据库尚未连接" : "无法读取客户开发数据",
    );
  return response.json() as Promise<OutreachSnapshot>;
}
export async function actOutreach(
  action: Record<string, unknown>,
  revision: number,
): Promise<{ message: string; revision: number; lab: OutreachLab }> {
  const response = await fetch("/api/outreach/actions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "if-match": String(revision),
    },
    body: JSON.stringify(action),
  });
  const body = (await response.json().catch(() => ({ error: "操作失败" }))) as {
    error?: string;
    message?: string;
    revision?: number;
    lab?: OutreachLab;
  };
  if (!response.ok) throw new Error(body.error || "操作失败");
  return body as { message: string; revision: number; lab: OutreachLab };
}
