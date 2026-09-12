export type OutreachRole = "boss" | "sales" | "codex";
export const outreachRoles: Record<OutreachRole, string> = {
  boss: "老板",
  sales: "业务员",
  codex: "Codex",
};
export const stages = [
  { id: "new", name: "待核实", next: "核实联系人与匹配理由" },
  { id: "verified", name: "待联系", next: "联系采购 / 技术负责人" },
  { id: "contacted", name: "跟进中", next: "确认回复与具体需求" },
  { id: "replied", name: "已回复", next: "收齐图纸、数量和交期" },
  { id: "qualified", name: "有效需求", next: "技术评估并提交报价" },
  { id: "quoted", name: "已报价", next: "跟进样品 / 试单" },
  { id: "sample", name: "样品 / 试单", next: "记录反馈与后续采购" },
] as const;
export type Lead = {
  id: string;
  company: string;
  market: "RU" | "EN";
  region: string;
  channel: string;
  product: string;
  website: string;
  contact: string;
  contactRole: string;
  fitReason: string;
  need: string;
  quantity: string;
  deadline: string;
  material: string;
  evidence: string;
  assigneeId: string;
  assignee: string;
  stage: string;
  nextAction: string;
  due: string;
  createdAt: string;
  updatedAt: string;
  milestones: Record<string, string>;
  note: string;
  lostReason: string;
};
export type OutreachTask = {
  id: string;
  title: string;
  owner: OutreachRole;
  assigneeId: string;
  status: "queued" | "running" | "submitted" | "failed" | "accepted";
  due: string;
  instructions: string;
  result: string;
  createdAt: string;
  updatedAt: string;
  claimedById?: string;
  claimedBy?: string;
  feedback?: string;
};
export type Issue = {
  id: string;
  title: string;
  category: string;
  leadId: string;
  owner: OutreachRole;
  assigneeId: string;
  status: "open" | "testing" | "resolved";
  hypothesis: string;
  change: string;
  metric: string;
  reviewDate: string;
  conclusion: string;
  beforeValue: string;
  afterValue: string;
  createdAt: string;
};
export type OutreachLab = {
  config: {
    title: string;
    duration: number;
    startDate: string;
    status: "draft" | "active" | "stopped";
    ruRegion: string;
    enRegion: string;
    products: string;
    target: number;
    budget: number;
    timezone: string;
  };
  leads: Lead[];
  tasks: OutreachTask[];
  issues: Issue[];
  expenses: {
    id: string;
    channel: string;
    amount: number;
    date: string;
    note: string;
  }[];
  logs: { id: string; at: string; actor: string; text: string }[];
  reviews: {
    id: string;
    day: number;
    decision: string;
    summary: string;
    at: string;
  }[];
  members: { personId: string; email: string; name: string; role: "sales" }[];
  agent: { lastSeen: string };
  operations: string[];
};

export function initialLab(now = new Date().toISOString()): OutreachLab {
  return {
    config: {
      title: "精密铁件主动开发 · 第一轮",
      duration: 30,
      startDate: "",
      status: "draft",
      ruRegion: "俄罗斯 · 乌拉尔工业区",
      enRegion: "英国 · 西米德兰兹",
      products: "轴 / 轴套；按图机加工件",
      target: 100,
      budget: 0,
      timezone: "Asia/Shanghai",
    },
    leads: [],
    tasks: [
      {
        id: "setup-scope",
        title: "确认首轮产品与两个开发区域",
        owner: "boss",
        assigneeId: "",
        status: "queued",
        due: "",
        instructions: "确认可交付产品、区域、名单目标及预算后启动 30 天试验。",
        result: "",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "setup-evidence",
        title: "准备两份真实案例与报价资料清单",
        owner: "sales",
        assigneeId: "",
        status: "queued",
        due: "",
        instructions: "每个产品一份真实照片、材料/工艺和检验或交付说明。",
        result: "",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "setup-list",
        title: "研究首批 20 家目标企业",
        owner: "codex",
        assigneeId: "service_codex",
        status: "queued",
        due: "",
        instructions:
          "启动后按已确认范围提交候选名单；保持待核实，不声称已联系。",
        result: "",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "setup-outreach",
        title: "为已核实企业准备定向开发草稿",
        owner: "codex",
        assigneeId: "service_codex",
        status: "queued",
        due: "",
        instructions: "根据真实企业和已有案例准备草稿，由业务员实际联系。",
        result: "",
        createdAt: now,
        updatedAt: now,
      },
    ],
    issues: [],
    expenses: [],
    logs: [],
    reviews: [],
    members: [],
    agent: { lastSeen: "" },
    operations: [],
  };
}
