import {
  initialLab,
  stages,
  type Lead,
  type OutreachLab,
  type OutreachRole,
} from "./model";
export class ActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export type OutreachActor = {
  id: string;
  email: string;
  name: string;
  role: OutreachRole;
};
function fail(message: string, status = 400): never {
  throw new ActionError(message, status);
}
const text = (value: unknown, max = 4000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const required = (value: unknown, label: string) =>
  text(value) || fail(`请填写${label}`);
const validDate = (value: unknown) => {
  const v = text(value);
  if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v))))
    fail("日期格式不正确");
  return v;
};
const nonNegative = (value: unknown, label: string) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) fail(`${label}必须是非负数`);
  return n;
};
function boss(actor: OutreachActor) {
  if (actor.role !== "boss") fail("此操作由老板处理", 403);
}
function editable(lead: Lead, actor: OutreachActor) {
  if (actor.role === "codex") fail("Codex 不能代填客户回复", 403);
  if (actor.role === "sales" && lead.assigneeId && lead.assigneeId !== actor.id)
    fail("请由该线索负责人更新", 403);
}
function fields(value: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const key of [
    "company",
    "market",
    "region",
    "channel",
    "product",
    "website",
    "contact",
    "contactRole",
    "fitReason",
    "need",
    "quantity",
    "deadline",
    "material",
    "evidence",
    "assigneeId",
    "assignee",
    "nextAction",
    "due",
    "note",
  ])
    if (key in value) result[key] = text(value[key]);
  if (result.market && !["RU", "EN"].includes(result.market))
    fail("市场只能是 RU 或 EN");
  if (result.website) {
    try {
      const u = new URL(result.website);
      if (!["http:", "https:"].includes(u.protocol))
        fail("官网仅支持 HTTP/HTTPS");
    } catch {
      fail("官网链接格式不正确");
    }
  }
  if (result.due) validDate(result.due);
  return result;
}
export function applyOutreachAction(
  source: OutreachLab | undefined,
  actor: OutreachActor,
  payload: Record<string, unknown>,
  now = new Date().toISOString(),
): { message: string; lab: OutreachLab } {
  const lab = structuredClone(source || initialLab(now));
  const id = () => crypto.randomUUID();
  const action = text(payload.action, 100);
  let message = "已保存";
  if (
    actor.role === "codex" &&
    action !== "agent.heartbeat" &&
    lab.config.status !== "active"
  )
    fail("仅在老板已启动的试验范围内执行", 403);
  if (action === "config") {
    boss(actor);
    const config = (payload.config || {}) as Record<string, unknown>;
    if (
      payload.baseConfig &&
      JSON.stringify(payload.baseConfig) !== JSON.stringify(lab.config)
    )
      fail("试验范围已有更新，请核对后再保存", 409);
    const target = nonNegative(config.target, "名单目标");
    if (!Number.isInteger(target) || target < 1 || target > 2000)
      fail("名单目标应为 1—2000");
    const was = lab.config.status;
    lab.config = {
      ...lab.config,
      ruRegion: required(config.ruRegion, "俄语区域"),
      enRegion: required(config.enRegion, "英语区域"),
      products: required(config.products, "产品范围"),
      target,
      budget: nonNegative(config.budget, "预算"),
    };
    if (payload.start) {
      if (was !== "draft") fail("试验已经启动");
      lab.config.startDate = validDate(config.startDate) || now.slice(0, 10);
      if (
        lab.config.startDate >
        new Date(now).toLocaleDateString("en-CA", {
          timeZone: lab.config.timezone,
        })
      )
        fail("启动日期不能晚于今天");
      lab.config.status = "active";
      const setup = lab.tasks.find((t) => t.id === "setup-scope");
      if (setup) {
        setup.status = "accepted";
        setup.result = "老板已确认试验边界";
        setup.updatedAt = now;
      }
      for (const task of lab.tasks)
        if (!task.due) task.due = lab.config.startDate;
    }
    message = payload.start ? "已启动 30 天试验" : "已更新试验范围";
  } else if (action === "lead.create" || action === "lead.import") {
    const rows = (
      action === "lead.import" ? payload.leads : [payload.lead]
    ) as Record<string, unknown>[];
    if (!Array.isArray(rows) || !rows.length || rows.length > 100)
      fail("每次提交 1—100 家企业");
    if (lab.leads.length + rows.length > 2000) fail("本轮最多 2000 家企业");
    for (const row of rows) {
      const f = fields(row || {});
      f.company = required(f.company, "公司名称");
      f.region = required(f.region, "所在区域");
      f.product = required(f.product, "产品方向");
      f.fitReason = required(f.fitReason, "匹配理由");
      f.market = f.market || "RU";
      const normalize = (s: string) =>
        s.toLocaleLowerCase().replace(/[\s.,，。]/g, "");
      if (
        lab.leads.some(
          (x) =>
            normalize(x.company) === normalize(f.company) &&
            x.market === f.market,
        )
      )
        fail(`已有同名企业：${f.company}`);
      if (actor.role === "sales") {
        f.assigneeId = actor.id;
        f.assignee = actor.name;
      }
      if (actor.role === "codex") {
        const region =
          f.market === "RU" ? lab.config.ruRegion : lab.config.enRegion;
        if (f.region !== region) fail("区域必须使用本轮设置的完整区域名称");
        if (!lab.config.products.includes(f.product))
          fail("产品不在已确认范围内");
      }
      lab.leads.push({
        id: id(),
        company: "",
        market: "RU",
        region: "",
        channel: "官网开发",
        product: "",
        website: "",
        contact: "",
        contactRole: "",
        fitReason: "",
        need: "",
        quantity: "",
        deadline: "",
        material: "",
        evidence: "",
        assigneeId: "",
        assignee: "",
        nextAction: "核实企业与公开联系人",
        due: now.slice(0, 10),
        note: "",
        ...f,
        stage: "new",
        createdAt: now,
        updatedAt: now,
        milestones: { new: now },
        lostReason: "",
      } as Lead);
    }
    message = `已接收 ${rows.length} 条候选线索，等待核实`;
  } else if (
    action === "lead.update" ||
    action === "lead.advance" ||
    action === "lead.close"
  ) {
    const lead = lab.leads.find((x) => x.id === payload.id);
    if (!lead) fail("线索不存在", 404);
    editable(lead, actor);
    if (payload.baseLead) {
      const base = payload.baseLead as Record<string, unknown>;
      for (const key of Object.keys((payload.fields || {}) as object))
        if ((lead as unknown as Record<string, unknown>)[key] !== base[key])
          fail("资料已被其他人更新，请核对最新版", 409);
      if (action !== "lead.update" && lead.stage !== base.stage)
        fail("客户阶段已更新，请重新打开", 409);
    }
    Object.assign(
      lead,
      fields((payload.fields || {}) as Record<string, unknown>),
    );
    if (actor.role === "sales" && !lead.assigneeId) {
      lead.assigneeId = actor.id;
      lead.assignee = actor.name;
    }
    if (action === "lead.advance") {
      const index = stages.findIndex((x) => x.id === lead.stage);
      if (index < 0 || index === stages.length - 1) fail("此线索不能继续推进");
      const next = stages[index + 1].id;
      if (next === "verified" && (!lead.contact || !lead.fitReason))
        fail("先补齐联系人和匹配理由");
      if (["contacted", "replied", "sample"].includes(next))
        required(
          payload.note,
          next === "contacted"
            ? "实际联系渠道与日期"
            : next === "replied"
              ? "客户回复摘要"
              : "试单凭据或确认记录",
        );
      if (
        next === "qualified" &&
        (!lead.need || !lead.quantity || !lead.deadline || !lead.evidence)
      )
        fail("有效需求需要具体需求、数量、交期及图纸/样品/客户记录");
      if (next === "quoted") required(payload.note, "已发送报价编号或资料链接");
      if (!lead.assigneeId) fail("请先指定负责人");
      lead.stage = next;
      lead.milestones[next] = now;
      message = `${lead.company}：${stages[index + 1].name}`;
    } else if (action === "lead.close") {
      lead.lostReason = required(payload.reason, "关闭或暂缓原因");
      if (!["lost", "nurture"].includes(text(payload.stage))) fail("状态无效");
      lead.stage = text(payload.stage);
      message = `${lead.company}：已记录结束状态`;
    } else message = `更新了 ${lead.company}`;
    if (payload.note) lead.note = text(payload.note);
    lead.updatedAt = now;
  } else if (action === "task.status") {
    const task = lab.tasks.find((x) => x.id === payload.id);
    if (!task) fail("任务不存在", 404);
    if (
      payload.baseTaskUpdatedAt &&
      payload.baseTaskUpdatedAt !== task.updatedAt
    )
      fail("任务已更新，请核对最新任务", 409);
    if (actor.role === "codex" && task.owner !== "codex")
      fail("只能处理 Codex 任务", 403);
    if (
      actor.role === "sales" &&
      task.owner !== "sales" &&
      !(
        task.owner === "codex" &&
        ["accepted", "queued"].includes(text(payload.status)) &&
        ["submitted", "failed"].includes(task.status)
      )
    )
      fail("只能处理本人任务或验收 Codex 结果", 403);
    const transitions: Record<string, string[]> = {
      queued: ["running"],
      running: ["submitted", "failed"],
      failed: ["queued"],
      submitted: ["accepted", "queued"],
      accepted: [],
    };
    const next = text(payload.status);
    if (!transitions[task.status]?.includes(next))
      fail("任务状态已变化，请刷新后处理", 409);
    if (next === "accepted" && actor.role === "codex")
      fail("执行端不能自行验收", 403);
    if (["submitted", "failed"].includes(next))
      task.result = required(payload.result, "执行结果或失败原因");
    if (next === "queued" && task.status === "submitted")
      task.feedback = required(payload.feedback, "退回原因");
    task.status = next as typeof task.status;
    if (next === "running") {
      task.claimedById = actor.id;
      task.claimedBy = actor.name;
    }
    task.updatedAt = now;
    message = `任务：${task.title} · ${next}`;
  } else if (action === "issue.create") {
    const issue = (payload.issue || {}) as Record<string, unknown>;
    const owner =
      text(issue.category) === "产品 / 市场 / 预算变更"
        ? "boss"
        : text(issue.owner);
    if (!["boss", "sales", "codex"].includes(owner)) fail("请选择处理人");
    lab.issues.push({
      id: id(),
      title: required(issue.title, "具体卡点"),
      category: required(issue.category, "问题类别"),
      leadId: text(issue.leadId),
      owner: owner as OutreachRole,
      assigneeId: text(issue.assigneeId),
      status: "open",
      hypothesis: text(issue.hypothesis),
      change: text(issue.change),
      metric: text(issue.metric),
      reviewDate: validDate(issue.reviewDate),
      conclusion: "",
      beforeValue: "",
      afterValue: "",
      createdAt: now,
    });
    message = "已记录卡点并指定处理方";
  } else if (action === "expense") {
    if (actor.role === "codex") fail("由人工记录实际支出", 403);
    const amount = nonNegative(payload.amount, "金额");
    if (!amount) fail("金额应大于 0");
    lab.expenses.push({
      id: id(),
      channel: required(payload.channel, "渠道"),
      amount,
      date: validDate(payload.date) || now.slice(0, 10),
      note: required(payload.note, "支出说明"),
    });
    message = "已记录实际费用";
  } else if (action === "review") {
    boss(actor);
    if (!lab.config.startDate) fail("试验尚未启动");
    const day = Number(payload.day);
    if (![7, 14, 21, 30].includes(day)) fail("复盘节点无效");
    if (!["继续", "调整", "停止"].includes(text(payload.decision)))
      fail("请选择结论");
    lab.reviews.push({
      id: id(),
      day,
      decision: text(payload.decision),
      summary: required(payload.summary, "复盘结论与下一步"),
      at: now,
    });
    if (payload.decision === "停止") lab.config.status = "stopped";
    message = `已记录第 ${day} 天复盘`;
  } else if (action === "agent.heartbeat") {
    if (actor.role !== "codex") fail("仅执行端可回报连接", 403);
    lab.agent.lastSeen = now;
    message = "已更新连接时间";
  } else fail("未知操作");
  if (actor.role === "codex") lab.agent.lastSeen = now;
  lab.logs.unshift({ id: id(), at: now, actor: actor.name, text: message });
  lab.logs = lab.logs.slice(0, 1000);
  return { message, lab };
}
