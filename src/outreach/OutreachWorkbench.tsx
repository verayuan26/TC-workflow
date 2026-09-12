import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Send,
  Target,
  Users,
} from "lucide-react";
import type { Viewer } from "../app/AppShell";
import { actOutreach, readOutreach } from "./api";
import { initialLab, outreachRoles, stages, type OutreachLab } from "./model";
import "./outreach.css";

export function OutreachWorkbench({ viewer }: { viewer: Viewer | null }) {
  const [lab, setLab] = useState<OutreachLab>(initialLab());
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<
    "loading" | "ready" | "offline" | "error"
  >("loading");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"overview" | "leads" | "tasks" | "issues">(
    "overview",
  );
  const load = () => {
    setStatus("loading");
    readOutreach()
      .then((x) => {
        setLab(x.lab);
        setRevision(x.revision);
        setStatus("ready");
      })
      .catch((e) => {
        setStatus("offline");
        setNotice(e instanceof Error ? e.message : "共享数据不可用");
      });
  };
  useEffect(load, []);
  async function act(payload: Record<string, unknown>) {
    try {
      const next = await actOutreach(payload, revision);
      setLab(next.lab);
      setRevision(next.revision);
      setNotice(next.message);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "操作失败");
      await readOutreach()
        .then((x) => {
          setLab(x.lab);
          setRevision(x.revision);
        })
        .catch(() => undefined);
    }
  }
  const funnel = useMemo(
    () =>
      stages.map((s) => ({
        ...s,
        count: lab.leads.filter((l) => l.milestones[s.id]).length,
      })),
    [lab],
  );
  return (
    <div className="ow">
      <header className="ow-head">
        <div>
          <p>OUTREACH / 主动开发</p>
          <h1>{lab.config.title}</h1>
          <span>
            {lab.config.status === "draft"
              ? "尚未启动，不执行外联"
              : lab.config.status === "active"
                ? `30 天试验进行中 · ${lab.config.startDate}`
                : "试验已停止"}
          </span>
        </div>
        <button onClick={load}>
          <RefreshCw size={16} />
          刷新
        </button>
      </header>
      <nav className="ow-tabs">
        {(["overview", "leads", "tasks", "issues"] as const).map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x === "overview"
              ? "总览"
              : x === "leads"
                ? "线索"
                : x === "tasks"
                  ? "任务"
                  : "卡点"}
            {x === "tasks" && (
              <b>{lab.tasks.filter((t) => t.status !== "accepted").length}</b>
            )}
          </button>
        ))}
      </nav>
      {status !== "ready" && (
        <div className="ow-warning">
          <AlertTriangle size={18} />
          <div>
            <b>
              {status === "loading" ? "正在连接共享状态" : "当前为只读来源预览"}
            </b>
            <p>
              {notice ||
                "D1 连接后才允许写入；此处不使用浏览器本地状态冒充真实进度。"}
            </p>
          </div>
        </div>
      )}
      {tab === "overview" && (
        <>
          <section className="ow-stats">
            <article>
              <Target />
              <span>候选企业</span>
              <b>{lab.leads.length}</b>
              <small>目标 {lab.config.target}</small>
            </article>
            <article>
              <Users />
              <span>已核实</span>
              <b>{lab.leads.filter((l) => l.stage !== "new").length}</b>
              <small>必须有联系人与依据</small>
            </article>
            <article>
              <Send />
              <span>已联系</span>
              <b>{lab.leads.filter((l) => l.milestones.contacted).length}</b>
              <small>只计真实联系记录</small>
            </article>
            <article>
              <CheckCircle2 />
              <span>有效需求</span>
              <b>{lab.leads.filter((l) => l.milestones.qualified).length}</b>
              <small>图纸/样品与数量齐全</small>
            </article>
          </section>
          <section className="ow-panel">
            <h2>真实漏斗</h2>
            <div className="ow-funnel">
              {funnel.map((x, i) => (
                <div key={x.id}>
                  <span>{i + 1}</span>
                  <p>
                    <b>{x.name}</b>
                    <small>{x.next}</small>
                  </p>
                  <strong>{x.count}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === "leads" && (
        <section className="ow-panel">
          <div className="ow-panel-head">
            <h2>企业线索</h2>
            <span>
              <Search size={15} />
              {lab.leads.length} 条
            </span>
          </div>
          {lab.leads.length ? (
            <div className="ow-table">
              <table>
                <thead>
                  <tr>
                    <th>企业 / 市场</th>
                    <th>产品与依据</th>
                    <th>负责人</th>
                    <th>阶段</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {lab.leads.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <b>{l.company}</b>
                        <small>
                          {l.market} · {l.region}
                        </small>
                      </td>
                      <td>
                        {l.product}
                        <small>{l.fitReason}</small>
                      </td>
                      <td>{l.assignee || "未分配"}</td>
                      <td>
                        {stages.find((s) => s.id === l.stage)?.name || l.stage}
                      </td>
                      <td>
                        {l.nextAction}
                        <small>{l.due}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="还没有候选企业"
              text="Codex 只能在老板启动并确认范围后提交真实候选名单。"
            />
          )}
        </section>
      )}
      {tab === "tasks" && (
        <section className="ow-panel">
          <h2>任务与人工验收</h2>
          <div className="ow-cards">
            {lab.tasks.map((t) => (
              <article key={t.id}>
                <div>
                  <span>{outreachRoles[t.owner]}</span>
                  <b>{t.status}</b>
                </div>
                <h3>{t.title}</h3>
                <p>{t.instructions}</p>
                {t.feedback && (
                  <p className="ow-feedback">退回：{t.feedback}</p>
                )}
                <small>{t.result || "尚无真实结果"}</small>
                {status === "ready" &&
                  t.owner === viewer?.role &&
                  t.status === "queued" && (
                    <button
                      onClick={() =>
                        void act({
                          action: "task.status",
                          id: t.id,
                          status: "running",
                          baseTaskUpdatedAt: t.updatedAt,
                        })
                      }
                    >
                      领取
                    </button>
                  )}
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "issues" && (
        <section className="ow-panel">
          <h2>卡点与试改</h2>
          {lab.issues.length ? (
            lab.issues.map((i) => (
              <article className="ow-issue" key={i.id}>
                <b>{i.title}</b>
                <span>
                  {i.category} · {outreachRoles[i.owner]} · {i.status}
                </span>
                <p>{i.change || "尚未填写试改方法"}</p>
              </article>
            ))
          ) : (
            <Empty
              title="没有已登记卡点"
              text="失败不删除；记录原因、假设、一次试改和复查结果。"
            />
          )}
        </section>
      )}
      {status === "ready" &&
        lab.config.status === "draft" &&
        viewer?.role === "boss" && <ScopeForm lab={lab} onSave={act} />}{" "}
      {notice && (
        <button className="ow-toast" onClick={() => setNotice("")}>
          {notice}
        </button>
      )}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="ow-empty">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function ScopeForm({
  lab,
  onSave,
}: {
  lab: OutreachLab;
  onSave: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({ ...lab.config });
  function submit(e: FormEvent) {
    e.preventDefault();
    void onSave({
      action: "config",
      config: fields,
      baseConfig: lab.config,
      start: true,
    });
    setOpen(false);
  }
  return (
    <div className="ow-start">
      {open ? (
        <form onSubmit={submit}>
          <h2>启动前确认范围</h2>
          <label>
            俄语区域
            <input
              value={fields.ruRegion}
              onChange={(e) =>
                setFields({ ...fields, ruRegion: e.target.value })
              }
            />
          </label>
          <label>
            英语区域
            <input
              value={fields.enRegion}
              onChange={(e) =>
                setFields({ ...fields, enRegion: e.target.value })
              }
            />
          </label>
          <label>
            产品范围
            <textarea
              value={fields.products}
              onChange={(e) =>
                setFields({ ...fields, products: e.target.value })
              }
            />
          </label>
          <label>
            名单目标
            <input
              type="number"
              value={fields.target}
              onChange={(e) =>
                setFields({ ...fields, target: Number(e.target.value) })
              }
            />
          </label>
          <div>
            <button type="button" onClick={() => setOpen(false)}>
              取消
            </button>
            <button type="submit">确认并启动</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setOpen(true)}>
          老板确认范围并启动 30 天试验
        </button>
      )}
    </div>
  );
}
