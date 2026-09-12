import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Film,
  Target,
} from "lucide-react";
import type { Viewer } from "./AppShell";
import type { Snapshot } from "../workbench/domain";
import type { OutreachSnapshot } from "../outreach/api";

type OverviewData = {
  content: { available: boolean; snapshot?: Snapshot };
  outreach: {
    available: boolean;
    revision?: number;
    lab?: OutreachSnapshot["lab"];
  };
  decisions: { id: string; module: string; title: string; reason: string }[];
};
export function Overview({ viewer }: { viewer: Viewer | null }) {
  const [data, setData] = useState<OverviewData | null>(null);
  useEffect(() => {
    fetch("/api/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x) => setData(x as OverviewData))
      .catch(() =>
        setData({
          content: { available: false },
          outreach: { available: false },
          decisions: [],
        }),
      );
  }, []);
  const c = data?.content.snapshot;
  const lab = data?.outreach.lab;
  return (
    <section className="tc-page">
      <p className="tc-kicker">RESULTS / 结果总览</p>
      <h1>
        {viewer?.role === "boss" ? "老板只看结果与必要决定" : "今天要处理什么"}
      </h1>
      <p>
        内容生产和客户开发仍保留各自的真实状态；这里只做可追溯汇总，不把未知计作
        0。
      </p>
      <div className="tc-overview-grid">
        <article>
          <Film />
          <span>本周内容</span>
          <b>
            {c
              ? c.tasks.filter((t) => t.week === 1 && t.status === "READY")
                  .length
              : "—"}
          </b>
          <small>{c ? "份已通过技术检查" : "生产投影未同步"}</small>
        </article>
        <article>
          <CheckCircle2 />
          <span>有凭据发布</span>
          <b>
            {c
              ? c.publications.filter((p) => p.status === "PUBLISHED").length
              : "—"}
          </b>
          <small>{c ? "仅计真实链接与版本" : "未知，不显示为 0"}</small>
        </article>
        <article>
          <Target />
          <span>有效客户需求</span>
          <b>
            {lab ? lab.leads.filter((l) => l.milestones.qualified).length : "—"}
          </b>
          <small>{lab ? "资料门槛已满足" : "外联 D1 未连接"}</small>
        </article>
        <article>
          <AlertTriangle />
          <span>需要决定</span>
          <b>{data?.decisions.length ?? "—"}</b>
          <small>产品、市场、预算或承诺变化</small>
        </article>
      </div>
      <div className="tc-overview-columns">
        <article className="tc-summary">
          <h2>内容生产</h2>
          {c ? (
            <>
              <p>
                <b>{c.tasks.filter((t) => t.owner === "EDITOR").length}</b>{" "}
                条由剪辑师处理，
                <b>{c.tasks.filter((t) => t.owner === "CODEX").length}</b> 条由
                Codex 处理。
              </p>
              <p>
                周期 {c.cycle_id} · 源版本 {c.source_revision} · 阶段{" "}
                {c.current_stage}
              </p>
            </>
          ) : (
            <p>尚无生产快照。现有 8787 生产端需通过适配器写入投影。</p>
          )}
          <a href="/content">
            进入内容工作台 <ArrowRight size={15} />
          </a>
        </article>
        <article className="tc-summary">
          <h2>客户开发</h2>
          {lab ? (
            <>
              <p>
                <b>{lab.leads.length}</b> 家候选企业，
                <b>{lab.tasks.filter((t) => t.status !== "accepted").length}</b>{" "}
                条未验收任务。
              </p>
              <p>
                {lab.config.status === "active"
                  ? `试验从 ${lab.config.startDate} 开始`
                  : "试验尚未由老板确认启动"}
              </p>
            </>
          ) : (
            <p>共享外联状态未连接。不会用浏览器示例数据替代。</p>
          )}
          <a href="/outreach">
            进入客户开发 <ArrowRight size={15} />
          </a>
        </article>
      </div>
      {viewer?.role === "boss" && (
        <section className="tc-decisions">
          <h2>确实需要老板决定</h2>
          {data?.decisions.length ? (
            data.decisions.map((d) => (
              <article key={d.id}>
                <b>{d.title}</b>
                <span>{d.module}</span>
                <p>{d.reason}</p>
              </article>
            ))
          ) : (
            <p>当前没有已登记的待决定事项。普通修复与执行继续进行。</p>
          )}
        </section>
      )}
    </section>
  );
}
