import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentStateDecision,
  canAssignOutreachTasks,
  canReadOutreachTeam,
  isEligibleOutreachAssignee,
} from "../worker/outreach-assignment";
import type { AuthActor } from "../worker/types";

const actor = (
  id: string,
  role: AuthActor["role"],
  permissions: string[] = [],
  kind: AuthActor["kind"] = "member",
): AuthActor => ({ id, role, permissions, kind, email: "", name: id });

const boss = actor("person_boss", "boss");
const supervisor = actor("person_alan", "sales", [
  "outreach:read",
  "outreach:write",
  "outreach:read:team",
  "outreach:assign",
]);
const salesperson = actor("person_rep", "sales", [
  "outreach:read",
  "outreach:write",
]);
const service = actor(
  "service_codex",
  "codex",
  ["outreach:read", "outreach:assign"],
  "service",
);

test("boss and explicitly authorized active sales supervisor can assign", () => {
  assert.equal(canAssignOutreachTasks(boss), true);
  assert.equal(canAssignOutreachTasks(supervisor), true);
  assert.equal(canAssignOutreachTasks(salesperson), false);
  assert.equal(canAssignOutreachTasks(service), false);
});

test("team read does not grant ordinary sales cross-owner access", () => {
  assert.equal(canReadOutreachTeam(boss), true);
  assert.equal(canReadOutreachTeam(supervisor), true);
  assert.equal(canReadOutreachTeam(salesperson), false);
  assert.equal(canReadOutreachTeam(service), true);
});

test("assignee must be active sales with outreach write", () => {
  assert.equal(
    isEligibleOutreachAssignee({
      staff_role: "sales",
      status: "active",
      permissions_json: '["outreach:write"]',
    }),
    true,
  );
  assert.equal(
    isEligibleOutreachAssignee({
      staff_role: "sales",
      status: "disabled",
      permissions_json: '["outreach:write"]',
    }),
    false,
  );
  assert.equal(
    isEligibleOutreachAssignee({
      staff_role: "sales",
      status: "active",
      permissions_json: '["outreach:read"]',
    }),
    false,
  );
  assert.equal(
    isEligibleOutreachAssignee({
      staff_role: "coordinator",
      status: "active",
      permissions_json: '["outreach:write"]',
    }),
    false,
  );
});

test("unassigned and pending are assignable without force", () => {
  assert.equal(assignmentStateDecision(supervisor, "unassigned", false, "").allowed, true);
  assert.equal(assignmentStateDecision(supervisor, "pending", false, "").allowed, true);
});

test("only boss can force active work and a reason is mandatory", () => {
  assert.deepEqual(assignmentStateDecision(supervisor, "in_progress", true, "主管要求"), {
    allowed: false,
    status: 403,
    forced: false,
    error: "处理中或待补充任务仅老板可强制转派",
  });
  assert.equal(assignmentStateDecision(boss, "needs_more", true, "人员调整").allowed, true);
  assert.equal(assignmentStateDecision(boss, "needs_more", false, "人员调整").status, 400);
  assert.equal(assignmentStateDecision(boss, "needs_more", true, "").status, 400);
});

test("submitted and reviewed tasks can never be directly reassigned", () => {
  assert.equal(assignmentStateDecision(boss, "submitted", true, "强制").status, 409);
  assert.equal(assignmentStateDecision(boss, "reviewed", true, "强制").status, 409);
});
