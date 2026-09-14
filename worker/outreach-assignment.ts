import type { AuthActor } from "./types";

export type AssignmentStateDecision = {
  allowed: boolean;
  status: number;
  forced: boolean;
  error?: string;
};

export const canReadOutreachTeam = (actor: AuthActor) =>
  actor.role === "boss" ||
  actor.role === "codex" ||
  actor.kind === "service" ||
  (actor.kind === "member" &&
    actor.role === "sales" &&
    actor.permissions.includes("outreach:read:team"));

export const canAssignOutreachTasks = (actor: AuthActor) =>
  actor.role === "boss" ||
  (actor.kind === "member" &&
    actor.role === "sales" &&
    actor.permissions.includes("outreach:assign"));

export const isEligibleOutreachAssignee = (member: Record<string, unknown>) => {
  let permissions: unknown = [];
  try {
    permissions = JSON.parse(String(member.permissions_json || "[]"));
  } catch {
    return false;
  }
  return (
    member.staff_role === "sales" &&
    (member.status === undefined || member.status === "active") &&
    Array.isArray(permissions) &&
    permissions.includes("outreach:write")
  );
};

export function assignmentStateDecision(
  actor: AuthActor,
  handoffStatus: unknown,
  force: boolean,
  reason: string,
): AssignmentStateDecision {
  const status = String(handoffStatus || "");
  if (["submitted", "reviewed"].includes(status))
    return {
      allowed: false,
      status: 409,
      forced: false,
      error: "已提交或已检查任务不能直接转派",
    };
  if (["unassigned", "pending"].includes(status))
    return { allowed: true, status: 200, forced: false };
  if (["in_progress", "needs_more"].includes(status)) {
    if (actor.role !== "boss")
      return {
        allowed: false,
        status: 403,
        forced: false,
        error: "处理中或待补充任务仅老板可强制转派",
      };
    if (!force || !reason.trim())
      return {
        allowed: false,
        status: 400,
        forced: false,
        error: "强制转派需要确认并填写原因",
      };
    return { allowed: true, status: 200, forced: true };
  }
  return {
    allowed: false,
    status: 409,
    forced: false,
    error: "任务当前不能分配",
  };
}
