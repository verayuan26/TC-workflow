import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Captions,
  Check,
  CheckCheck,
  ChevronRight,
  ClipboardList,
  Code2,
  Download,
  FileCheck2,
  FileAudio,
  FileVideo,
  FileText,
  Film,
  FolderOpen,
  Info,
  ListChecks,
  LockKeyhole,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import {
  ACTOR_LABEL,
  Actor,
  CHANNELS,
  KIND_LABEL,
  PHASE_LABEL,
  PUB_LABEL,
  Phase,
  Publication,
  STATUS_LABEL,
  Snapshot,
  Task,
  handback,
  safeUrl,
  shanghaiTime,
  taskChecklist,
  validateSnapshot,
} from "./domain";
import { CODEX_PROMPT, PHASES, demoSnapshot, emptySnapshot } from "./data";
import {
  claimTask,
  classifyFile,
  fetchMembers,
  fetchSnapshot,
  submitIssue,
  uploadHandback,
  type UploadFile,
  type WorkbenchMember,
} from "./api";
import "./workbench.css";
import HANDOFF from "./handoff.md?raw";

type View = "work" | "calendar" | "guide";
type LocalResponse = {
  key: string;
  note: string;
  kind: "handoff" | "issue";
  at: string;
};
const LOCAL_KEY = "tiger-workbench-demo-actions-v1";
const WEEK_KEY = "tiger-workbench-week-v1";
function readLocal(): LocalResponse[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(v)
      ? v.filter(
          (x) =>
            typeof x.key === "string" &&
            typeof x.note === "string" &&
            ["handoff", "issue"].includes(x.kind),
        )
      : [];
  } catch {
    return [];
  }
}
function taskKey(t: Task) {
  return `${t.id}/r${t.revision}/g${t.edit_generation}`;
}
function download(name: string, value: unknown, type = "application/json") {
  const blob = new Blob(
    [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
    { type },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function formatBytes(value?: number) {
  if (!value) return "";
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(value / 1024)} KB`;
}
function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`tw-badge ${tone}`}>{children}</span>;
}
function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note: string;
}) {
  return (
    <div className="tw-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function List({ items }: { items: string[] }) {
  return (
    <ol className="tw-instructions">
      {items.map((s, i) => (
        <li key={s}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <p>{s}</p>
        </li>
      ))}
    </ol>
  );
}

export function Workbench() {
  const [role, setRole] = useState<Actor>("EDITOR");
  const [view, setView] = useState<View>("work");
  const [demo, setDemo] = useState(false);
  const [actual, setActual] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState("CYCLE01-W1-Q1-RU");
  const [guide, setGuide] = useState("S4");
  const [week, setWeekState] = useState(() => {
    const saved = Number(localStorage.getItem(WEEK_KEY));
    return [1, 2, 3, 4].includes(saved) ? saved : 1;
  });
  const [filter, setFilter] = useState("all");
  const [local, setLocal] = useState<LocalResponse[]>(readLocal);
  const [liveResponses, setLiveResponses] = useState<LocalResponse[]>([]);
  const [notice, setNotice] = useState("");
  const [syncError, setSyncError] = useState("");
  const [members, setMembers] = useState<WorkbenchMember[]>([]);
  const [memberId, setMemberIdState] = useState("");
  const actualRef = useRef<Snapshot | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const snapshot = demo ? demoSnapshot() : actual || emptySnapshot();
  const responses = demo ? local : liveResponses;
  const ready = snapshot.tasks.filter(
    (t) => t.kind === "short_video" && t.week === week && t.status === "READY",
  ).length;
  const published = snapshot.publications.filter(
    (p) => p.week === week && p.status === "PUBLISHED",
  ).length;
  const pending = snapshot.tasks.filter(
    (t) =>
      t.week === week &&
      t.owner === "EDITOR" &&
      ["NEEDS_EDIT", "REVIEW_REQUIRED"].includes(t.status) &&
      !responses.some((r) => r.key === taskKey(t) && r.kind === "handoff"),
  );
  const weekTasks = snapshot.tasks.filter((t) => t.week === week);
  const chosen = weekTasks.find((t) => t.id === selected) || weekTasks[0];
  const currentPhase =
    PHASES.find((p) => p.id === snapshot.current_stage) || PHASES[0];
  const toast = (s: string) => setNotice(s);
  function setWeek(value: number) {
    setWeekState(value);
    try {
      localStorage.setItem(WEEK_KEY, String(value));
    } catch {
      /* UI preference only. */
    }
  }
  function applySnapshot(parsed: Snapshot) {
    actualRef.current = parsed;
    setActual(parsed);
  }
  async function refresh(silent = false) {
    try {
      const previous = actualRef.current;
      const raw = await fetchSnapshot(previous || undefined);
      const parsed = validateSnapshot(
        raw,
        previous && raw.source_revision > previous.source_revision
          ? previous
          : undefined,
      );
      applySnapshot(parsed);
      setSyncError("");
      setDemo(false);
      if (!selected && parsed.tasks.length) setSelected(parsed.tasks[0].id);
    } catch (e) {
      const message = e instanceof Error ? e.message : "生产状态读取失败";
      setSyncError(message);
      if (!silent) toast(`实际任务未同步：${message}`);
    }
  }
  useEffect(() => {
    void refresh();
    void fetchMembers()
      .then((rows) => {
        setMembers(rows);
        setMemberIdState(rows[0]?.id || "");
      })
      .catch(() => setMembers([]));
    const timer = window.setInterval(() => void refresh(true), 15000);
    return () => window.clearInterval(timer);
    // The poll deliberately retains the current snapshot ref instead of restarting on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function record(t: Task, note: string, kind: LocalResponse["kind"]) {
    const n = { key: taskKey(t), note, kind, at: new Date().toISOString() };
    const next = [...responses.filter((r) => r.key !== n.key), n];
    if (demo) {
      setLocal(next);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {
        toast("本机保存不可用；本次演练保留到页面关闭。");
      }
    } else setLiveResponses(next);
  }
  async function importSnapshot(file?: File) {
    if (!file) return;
    try {
      if (file.size > 3 * 1024 * 1024)
        throw new Error("快照应小于 3MB；视频文件请通过交接包传输。");
      const parsed = validateSnapshot(
        JSON.parse(await file.text()),
        actual || undefined,
      );
      setActual(parsed);
      setDemo(false);
      setSelected(parsed.tasks[0]?.id || "");
      setLiveResponses([]);
      toast("已载入离线快照。更新时间来自生产端，尚未建立实时同步。");
    } catch (e) {
      toast(`未导入：${e instanceof Error ? e.message : "文件格式无效"}`);
    }
  }
  function switchMode() {
    setDemo(!demo);
    setSelected(
      demo
        ? actual?.tasks.find((t) => t.week === week)?.id || ""
        : "CYCLE01-W1-Q1-RU",
    );
    setNotice("");
  }
  return (
    <div className="tw-workbench">
      <aside className="tw-sidebar">
        <a
          className="tw-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("work");
          }}
        >
          <span className="tw-brand-mark">T</span>
          <div>
            TIGER<small>内容工作台</small>
          </div>
        </a>
        <div className="tw-sidebar-label">WORKSPACE / 工作区</div>
        <nav aria-label="主导航">
          {(
            [
              { id: "work", icon: ClipboardList, label: "我的工作" },
              { id: "calendar", icon: CalendarDays, label: "发布日历" },
              { id: "guide", icon: ListChecks, label: "阶段指南" },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => setView(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "work" && pending.length > 0 && (
                <span className="tw-nav-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="tw-cycle">
          <small>当前周期</small>
          <strong>{snapshot.cycle_id.replace("CYCLE", "CYCLE ")}</strong>
          <span>{snapshot.launch_date} 起 · 4 周</span>
          <p>
            2 个母题 / 周<br />
            俄语 + 英文
          </p>
          <div>
            <LockKeyhole size={14} /> 频率与范围已固定
          </div>
        </div>
        <div className="tw-sidebar-bottom">
          <ShieldCheck size={21} />
          <span>
            每一步有依据
            <br />
            <small>总规范 V2.0</small>
          </span>
        </div>
      </aside>
      <div className="tw-main-shell">
        <header className="tw-topbar">
          <div className="tw-breadcrumb">
            精密零件获客 <ChevronRight size={14} />{" "}
            <b>
              {view === "work"
                ? "我的工作"
                : view === "calendar"
                  ? "发布日历"
                  : "阶段指南"}
            </b>
          </div>
          <div className="tw-topbar-actions">
            {role === "EDITOR" && !demo && (
              <label className="tw-identity">
                <span>Access 当前身份</span>
                <select aria-label="当前剪辑师" value={memberId} disabled>
                  {members.length?<>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</>:<option value="">未取得剪辑权限</option>}
                </select>
              </label>
            )}
            <div className="tw-role-switch" aria-label="查看工作视角">
              {(["EDITOR", "BOSS", "CODEX"] as Actor[]).map((r) => (
                <button
                  aria-pressed={role === r}
                  className={role === r ? "active" : ""}
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setView("work");
                  }}
                >
                  {r === "CODEX" ? (
                    <Code2 size={15} />
                  ) : (
                    <UserRound size={15} />
                  )}{" "}
                  {ACTOR_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
        </header>
        <div
          className={`tw-mode-strip ${demo ? "demo" : actual ? "live" : "offline"}`}
        >
          <div>
            <Info size={16} />
            <span>
              {demo
                ? "演练预览 · 示例任务，操作仅保存在这台设备"
                : actual
                  ? `生产实时状态 · ${new Date(actual.generated_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })} 北京时间${syncError ? " · 最近刷新失败" : ""}`
                  : `实际任务 · ${syncError || "正在连接生产服务"}`}
            </span>
          </div>
          <div>
            {demo && (
              <button
                onClick={() => {
                  setLocal([]);
                  try {
                    localStorage.removeItem(LOCAL_KEY);
                  } catch {
                    /* Device storage unavailable. */
                  }
                  toast("演练记录已重置，实际快照保持不变。");
                }}
              >
                <RotateCcw size={13} />
                重置演练
              </button>
            )}
            {!demo && (
              <button onClick={() => void refresh()}>
                <RotateCcw size={13} />
                刷新
              </button>
            )}
            <button onClick={switchMode}>
              {demo ? "查看实际任务" : "返回演练"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <main className="tw-main">
          <div className="tw-page-heading">
            <div>
              <p className="tw-eyebrow">
                {view === "work"
                  ? "TODAY’S WORK"
                  : view === "calendar"
                    ? "PUBLISHING PLAN"
                    : "HOW TO DELIVER"}
              </p>
              <h1>
                {view === "work"
                  ? role === "EDITOR"
                    ? "先做好眼前这一条"
                    : role === "BOSS"
                      ? "只看结果，处理关键决定"
                      : "执行有依据，交接有回执"
                  : view === "calendar"
                    ? "内容做好之后，发到哪里"
                    : "到这一步，具体怎么做"}
              </h1>
              <p>
                {view === "work"
                  ? role === "EDITOR"
                    ? "看清修改点 → 完成剪辑 → 交付文件。其余进度由 Codex 维护。"
                    : role === "BOSS"
                      ? "日常制作自动推进；只集中处理样式确认与业务边界变化。"
                      : "接续真实进度，检验通过后继续；缺项只挂起受影响的任务。"
                  : view === "calendar"
                    ? "每周 10 次渠道发布，复用 4 条视频母版；每四周另加 1 条长视频。"
                    : "每阶段都写清输入、操作、交付物、检验和下一步。"}
              </p>
            </div>
            <div className="tw-heading-actions">
              {view !== "guide" && (
                <button
                  className="tw-button"
                  onClick={() => {
                    setGuide(snapshot.current_stage);
                    setView("guide");
                  }}
                >
                  <FileText size={16} />
                  本阶段做法
                </button>
              )}
            </div>
          </div>
          {view === "work" && (
            <>
              <div className="tw-progress-banner">
                <div className="tw-progress-icon">
                  <Film size={23} />
                </div>
                <div>
                  <small>
                    {demo
                      ? "示例当前阶段"
                      : actual
                        ? "生产当前阶段"
                        : "等待生产数据"}
                  </small>
                  <h2>
                    {actual || demo
                      ? `${currentPhase.id} · ${currentPhase.title}`
                      : "先由 Codex 完成基线核对"}
                  </h2>
                </div>
                <div className="tw-progress-right">
                  <span>
                    {demo
                      ? "尚缺一次真实人工回传；其余内容可继续准备。"
                      : actual
                        ? "阶段状态由生产库返回；领取、回传和检验均写入同一记录。"
                        : "当前页面尚未连上生产服务。"}
                  </span>
                  <button
                    onClick={() => {
                      setGuide(demo ? "S4" : snapshot.current_stage);
                      setView("guide");
                    }}
                  >
                    查看下一步 <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="tw-stats">
                <Stat
                  label="待剪辑师处理"
                  value={actual || demo ? pending.length : "—"}
                  note="只列需要人工的具体任务"
                />
                <Stat
                  label={`第 ${week} 周短视频可交付`}
                  value={
                    <>
                      {actual || demo ? ready : "—"}
                      <em> / 4</em>
                    </>
                  }
                  note="另有 4 份配套图文 / 短内容"
                />
                <Stat
                  label={`第 ${week} 周已发布`}
                  value={
                    <>
                      {actual || demo ? published : "—"}
                      <em> / {week === 4 ? 11 : 10}</em>
                    </>
                  }
                  note="计划槽位不计入已发布"
                />
              </div>
              {role === "EDITOR" &&
                (weekTasks.length > 0 && chosen ? (
                  <div className="tw-editor-grid">
                    <section className="tw-panel tw-queue">
                      <div className="tw-section-heading">
                        <h2>第 {week} 周任务</h2>
                        <Badge>{weekTasks.length} 份内容</Badge>
                      </div>
                      <div className="tw-tabs">
                        <button
                          className={filter === "all" ? "active" : ""}
                          onClick={() => setFilter("all")}
                        >
                          全部
                        </button>
                        <button
                          className={filter === "mine" ? "active" : ""}
                          onClick={() => setFilter("mine")}
                        >
                          待我处理 {pending.length}
                        </button>
                        <button
                          className={filter === "codex" ? "active" : ""}
                          onClick={() => setFilter("codex")}
                        >
                          Codex 处理
                        </button>
                      </div>
                      <div className="tw-task-list">
                        {weekTasks
                          .filter(
                            (t) =>
                              filter === "all" ||
                              (filter === "mine"
                                ? pending.some((p) => p.id === t.id)
                                : t.owner === "CODEX"),
                          )
                          .map((t) => {
                            const sent = responses.find(
                              (r) => r.key === taskKey(t),
                            );
                            return (
                              <button
                                key={t.id}
                                className={`tw-task-row ${chosen?.id === t.id ? "selected" : ""}`}
                                onClick={() => setSelected(t.id)}
                              >
                                <div className="tw-task-row-top">
                                  <Badge
                                    tone={
                                      t.owner === "EDITOR" && !sent
                                        ? "amber"
                                        : t.status === "READY"
                                          ? "green"
                                          : "muted"
                                    }
                                  >
                                    {sent
                                      ? sent.kind === "handoff"
                                        ? "待生产端回执"
                                        : "问题已记录"
                                      : STATUS_LABEL[t.status]}
                                  </Badge>
                                  <span>
                                    {t.language.toUpperCase()} ·{" "}
                                    {KIND_LABEL[t.kind]}
                                  </span>
                                </div>
                                <h3>{t.title}</h3>
                                <p>{t.channels.join(" / ")}</p>
                                <div className="tw-task-row-bottom">
                                  <span>
                                    {ACTOR_LABEL[t.owner]} · r{t.revision}
                                  </span>
                                  <ChevronRight size={16} />
                                </div>
                              </button>
                            );
                          })}
                        {filter === "mine" && pending.length === 0 && (
                          <div className="tw-small-empty">
                            <CheckCheck />
                            没有新的人工待办。
                            <p>已经交付的任务，等待 Codex 回执。</p>
                          </div>
                        )}
                      </div>
                    </section>
                    <TaskDetail
                      key={`${demo}/${chosen.id}/${chosen.revision}/${chosen.edit_generation}`}
                      task={chosen}
                      demo={demo}
                      memberId={memberId}
                      response={responses.find(
                        (r) => r.key === taskKey(chosen),
                      )}
                      onRecord={record}
                      onSnapshot={applySnapshot}
                      toast={toast}
                    />
                  </div>
                ) : (
                  <EmptyState
                    onImport={() => importRef.current?.click()}
                    onGuide={() => {
                      setGuide("S0");
                      setView("guide");
                    }}
                  />
                ))}
              {role === "BOSS" && (
                <Boss
                  snapshot={snapshot}
                  demo={demo}
                  onCalendar={() => setView("calendar")}
                  toast={toast}
                />
              )}
              {role === "CODEX" && (
                <Codex
                  snapshot={snapshot}
                  hasActual={!!actual}
                  demo={demo}
                  onImport={() => importRef.current?.click()}
                  toast={toast}
                />
              )}
            </>
          )}
          {view === "calendar" && (
            <Calendar
              snapshot={snapshot}
              week={week}
              setWeek={setWeek}
              onTask={(id) => {
                if (snapshot.tasks.some((t) => t.id === id)) {
                  setSelected(id);
                  setRole("EDITOR");
                  setView("work");
                } else
                  toast(
                    "该槽位的内容尚未生成任务。由 Codex 按对应周的母题准备。",
                  );
              }}
            />
          )}
          {view === "guide" && (
            <Guide
              phase={PHASES.find((p) => p.id === guide) || PHASES[0]}
              setGuide={setGuide}
              snapshot={snapshot}
              role={role}
            />
          )}
          <footer className="tw-footer">
            <span>老板定边界 · Codex 执行与检验 · 剪辑师处理观感与修订</span>
            <button
              onClick={() =>
                download(
                  "Tiger_三方剪辑工作台_落地与验收说明_V1.0.md",
                  HANDOFF,
                  "text/markdown;charset=utf-8",
                )
              }
            >
              <Download size={14} /> 落地与验收说明
            </button>
          </footer>
        </main>
      </div>
      <input
        type="file"
        accept=".json,application/json"
        hidden
        ref={importRef}
        onChange={(e) => {
          void importSnapshot(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      {notice && (
        <div className="tw-toast" role="status">
          <Info size={18} />
          <span>{notice}</span>
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  onImport,
  onGuide,
}: {
  onImport: () => void;
  onGuide: () => void;
}) {
  return (
    <section className="tw-panel tw-empty">
      <FolderOpen size={36} />
      <h2>还没有实际任务</h2>
      <p>
        Codex 导出生产快照后，这里才会显示真实进度。剪辑师无需手工维护阶段。
      </p>
      <div>
        <button className="tw-button primary" onClick={onImport}>
          <Upload size={16} />
          导入 Codex 快照
        </button>
        <button className="tw-button" onClick={onGuide}>
          查看准备阶段
        </button>
      </div>
    </section>
  );
}

function TaskDetail({
  task: initialTask,
  demo,
  memberId,
  response,
  onRecord,
  onSnapshot,
  toast,
}: {
  task: Task;
  demo: boolean;
  memberId: string;
  response?: LocalResponse;
  onRecord: (t: Task, note: string, k: LocalResponse["kind"]) => void;
  onSnapshot: (snapshot: Snapshot) => void;
  toast: (s: string) => void;
}) {
  const [t, setTask] = useState(initialTask);
  const [claimed, setClaimed] = useState(
    initialTask.claim?.claimant_member_id === memberId,
  );
  const [checks, setChecks] = useState<boolean[]>(
    taskChecklist(t.kind).map(() => false),
  );
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [hashing, setHashing] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState("action");
  const work = t.work_package;
  const allowed =
    t.owner === "EDITOR" &&
    ["NEEDS_EDIT", "REVIEW_REQUIRED"].includes(t.status);
  async function selectFiles(list: FileList | null) {
    if (!list) return;
    setHashing(true);
    setFiles([]);
    try {
      const result: UploadFile[] = [];
      for (const f of Array.from(list)) {
        if (result.some((r) => r.name === f.name))
          throw new Error("交付文件不能重名。");
        const sha256 =
          f.size <= 128 * 1024 * 1024
            ? Array.from(
                new Uint8Array(
                  await crypto.subtle.digest("SHA-256", await f.arrayBuffer()),
                ),
              )
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
            : "0".repeat(64);
        result.push({
          file: f,
          name: f.name,
          size: f.size,
          sha256,
          kind: classifyFile(f),
        });
      }
      setFiles(result);
    } catch (e) {
      toast(e instanceof Error ? e.message : "文件读取失败");
    } finally {
      setHashing(false);
    }
  }
  async function submit() {
    try {
      const manifest = handback(
        t,
        checks,
        files.map(({ name, size, sha256 }) => ({ name, size, sha256 })),
        note,
      );
      if (demo) {
        download(`${t.id}-handback.json`, { ...manifest, mode: "demo" });
        onRecord(t, note, "handoff");
        toast("已生成演练回传清单；没有上传文件或改变真实进度。");
        return;
      }
      if (!memberId) throw new Error("请先在页面右上角选择当前剪辑师。");
      if (!claimed || t.claim?.claimant_member_id !== memberId)
        throw new Error("请先领取当前版本，再提交文件。");
      setSending(true);
      const result = await uploadHandback({
        task: t,
        memberId,
        note,
        checks: manifest.checks,
        requestId: manifest.request_id,
        files,
        onProgress: toast,
      });
      onRecord(t, note, "handoff");
      const next = validateSnapshot(await fetchSnapshot());
      onSnapshot(next);
      toast(
        result.handback.status === "RECEIVED"
          ? "生产端已收齐成片与工程，等待 Codex 检验。"
          : `回传未完整：${result.handback.reason || "请检查文件"}`,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "请检查交付内容");
    } finally {
      setSending(false);
    }
  }
  function simulate() {
    if (!checks.every(Boolean) || !note.trim()) {
      toast("请先勾选观感检查，并写一条具体修改说明。");
      return;
    }
    onRecord(t, note, "handoff");
    toast(
      "已演练交付：当前停在“待 Codex 检验”。没有上传文件，也没有改变真实进度。",
    );
  }
  const checklist = taskChecklist(t.kind);
  return (
    <section className="tw-panel tw-detail">
      <div className="tw-detail-heading">
        <div>
          <p className="tw-eyebrow">
            {t.id} · r{t.revision}
          </p>
          <h2>{t.title}</h2>
          <div className="tw-inline">
            <Badge>{t.language === "ru" ? "俄语" : "英文"}</Badge>
            <Badge>{KIND_LABEL[t.kind]}</Badge>
            <span>
              {t.kind === "short_video"
                ? "18 秒 · 9:16"
                : t.kind === "long_video"
                  ? "3–5 分钟 · 16:9"
                  : "按对应图文标准检验"}
            </span>
          </div>
        </div>
      </div>
      <div className="tw-tabs tw-detail-tabs">
        <button
          className={tab === "action" ? "active" : ""}
          onClick={() => setTab("action")}
        >
          操作与交付
        </button>
        <button
          className={tab === "materials" ? "active" : ""}
          onClick={() => setTab("materials")}
        >
          素材与预览
        </button>
        <button
          className={tab === "trace" ? "active" : ""}
          onClick={() => setTab("trace")}
        >
          交接记录
        </button>
      </div>
      {tab === "action" && (
        <div className="tw-detail-body">
          <div className="tw-next-action">
            <div>
              <Badge tone="amber">
                {allowed ? "本次只需处理" : "下一步由 Codex 处理"}
              </Badge>
              <h3>{t.next_action}</h3>
              <p>{t.reason}</p>
            </div>
            <Film size={28} />
          </div>
          {allowed && !response && (
            <div className="tw-claim">
              <span>
                {claimed
                  ? "当前版本已由你领取；重复点击不会生成新版本。"
                  : t.claim
                    ? "当前版本已被其他成员领取，不能重复领取。"
                    : "先核对素材和当前版本，再开始修改。"}
              </span>
              <button
                className="tw-button"
                disabled={!!t.claim && !claimed}
                onClick={async () => {
                  if (demo) {
                    setClaimed(true);
                    setTab("materials");
                    return;
                  }
                  if (!memberId) {
                    toast("请先在页面右上角选择当前剪辑师。");
                    return;
                  }
                  try {
                    const next = validateSnapshot(await claimTask(t, memberId));
                    const current = next.tasks.find((item) => item.id === t.id);
                    if (!current) throw new Error("领取后未找到当前任务。");
                    setTask(current);
                    setClaimed(true);
                    onSnapshot(next);
                    setTab("materials");
                    toast("已领取当前版本；生产库已登记领取人和编辑代次。");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "领取失败");
                  }
                }}
              >
                <Play size={14} />
                {claimed ? "查看素材" : "开始处理"}
              </button>
            </div>
          )}
          <div className="tw-delivery-strip">
            <div>
              <FolderOpen size={18} />
              <span>
                01 · 打开素材<small>预览 / 分轨 / 字幕</small>
              </span>
            </div>
            <ChevronRight size={16} />
            <div>
              <Film size={18} />
              <span>
                02 · 按说明修改<small>原有剪辑工具</small>
              </span>
            </div>
            <ChevronRight size={16} />
            <div>
              <FileCheck2 size={18} />
              <span>
                03 · 交成片与工程<small>Codex 重新检验</small>
              </span>
            </div>
          </div>
          <div className="tw-section-heading">
            <h3>交付前，我只检查这些</h3>
            <span>
              {checks.filter(Boolean).length} / {checklist.length}
            </span>
          </div>
          <div className="tw-checklist">
            {checklist.map((c, i) => (
              <label key={c}>
                <input
                  type="checkbox"
                  disabled={!allowed || !!response}
                  checked={checks[i]}
                  onChange={(e) =>
                    setChecks(
                      checks.map((v, j) => (j === i ? e.target.checked : v)),
                    )
                  }
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
          {response ? (
            <div className="tw-receipt">
              <CheckCheck size={22} />
              <div>
                <h3>
                  {response.kind === "handoff"
                    ? "待 Codex 接收与检验"
                    : "问题已记录，等待处理"}
                </h3>
                <p>{response.note}</p>
                <small>
                  {demo ? "演练记录" : "生产端已接收"} ·{" "}
                  {new Date(response.at).toLocaleString("zh-CN")}
                </small>
                <p>
                  只有生产端核对文件、版本并完成检查后，任务才会进入可交付。
                </p>
              </div>
            </div>
          ) : allowed ? (
            <>
              <label className="tw-field-label" htmlFor="edit-note">
                修改说明 / 遇到的问题
              </label>
              <textarea
                id="edit-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：4–7 秒字幕上移，已保留工件边缘；没有改旁白和主题。"
                rows={3}
              />
              <label className="tw-file-picker">
                <Upload size={20} />
                <span>
                  <b>
                    {hashing ? "正在读取文件指纹…" : "选择成片与实际工程文件"}
                  </b>
                  <small>
                    {demo
                      ? "演练只生成清单，不上传文件。"
                      : "文件将流式写入现有生产存储，并由服务端校验指纹。"}
                  </small>
                </span>
                <input
                  type="file"
                  multiple
                  disabled={hashing}
                  onChange={(e) => void selectFiles(e.target.files)}
                />
              </label>
              {files.length > 0 && (
                <ul className="tw-file-list">
                  {files.map((f) => (
                    <li key={f.name}>
                      <FileText size={14} />
                      {f.name}
                      <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="tw-form-actions">
                <button
                  className="tw-button primary"
                  disabled={hashing || sending}
                  onClick={
                    demo && files.length === 0 ? simulate : () => void submit()
                  }
                >
                  <CheckCheck size={17} />
                  {demo && files.length === 0
                    ? "演练交给 Codex"
                    : sending
                      ? "正在回传…"
                      : "交给 Codex"}
                </button>
                <button
                  className="tw-button"
                  onClick={async () => {
                    if (!note.trim()) {
                      toast("请写明缺哪个镜头、文件或需要解决的问题。");
                      return;
                    }
                    if (demo) {
                      download(`${t.id}-issue.json`, {
                        content_id: t.id,
                        base_revision: t.revision,
                        edit_generation: t.edit_generation,
                        kind: "NEEDS_HELP",
                        note,
                        mode: "demo",
                      });
                      onRecord(t, note, "issue");
                      toast("已生成演练问题单；真实状态未改变。");
                      return;
                    }
                    if (!memberId) {
                      toast("请先在页面右上角选择当前剪辑师。");
                      return;
                    }
                    try {
                      const next = validateSnapshot(
                        await submitIssue(t, memberId, note),
                      );
                      onSnapshot(next);
                      onRecord(t, note, "issue");
                      toast(
                        "问题已写入生产库，本条转回 Codex，其他任务不受影响。",
                      );
                    } catch (e) {
                      toast(e instanceof Error ? e.message : "问题提交失败");
                    }
                  }}
                >
                  缺素材 / 提问题
                </button>
              </div>
              <p className="tw-hint">
                交付后下一位：Codex。技术检查失败会指出具体原因，人工修订不会被自动版覆盖。
              </p>
            </>
          ) : (
            <div className="tw-hint-box">
              <Code2 size={19} />
              <p>这条任务当前由 Codex 处理。无需剪辑师重复领取或再次审核。</p>
            </div>
          )}
        </div>
      )}
      {tab === "materials" && (
        <div className="tw-detail-body">
          <div className={`tw-package-alert ${work?.status === "READY_FOR_EDITOR" ? "ready" : "missing"}`}>
            <div>
              <strong>{work?.status === "READY_FOR_EDITOR" ? "开工资料已齐" : "工作包未齐，不能开工"}</strong>
              <p>
                {work?.status === "READY_FOR_EDITOR"
                  ? "素材、脚本、Vera 音轨、SRT、分镜与工程包均绑定当前任务版本。"
                  : "请先点“缺素材 / 提问题”，不要只凭标题猜测制作。"}
              </p>
            </div>
            {work?.status === "READY_FOR_EDITOR" && <Badge tone="green">6 / 6</Badge>}
          </div>
          <div className="tw-preview">
            {safeUrl(t.preview_url) ? (
              <video
                controls
                preload="metadata"
                src={safeUrl(t.preview_url)}
                aria-label="任务成片预览"
              />
            ) : (
              <>
                <Play size={32} />
                <h3>{demo ? "演练未附真实成片" : "当前快照未提供预览"}</h3>
                <p>接入后，这里直接播放当前版本。</p>
              </>
            )}
          </div>
          <div className="tw-section-heading">
            <h3>完整剪辑工作包</h3>
            {safeUrl(t.package_url) && (
              <a
                className="tw-button"
                href={safeUrl(t.package_url)}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={16} />
                下载完整交接包
              </a>
            )}
          </div>
          {work && (
            <>
              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <ListChecks size={18} />
                  <h3>任务目标与交付规格</h3>
                </div>
                <p className="tw-work-objective">{work.objective}</p>
                <ul className="tw-spec-list">
                  {work.output_spec.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>

              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <FileVideo size={18} />
                  <h3>原始素材与素材库位置</h3>
                </div>
                {work.assets.map((asset) => (
                  <div className="tw-asset-card" key={asset.asset_id}>
                    <div>
                      <b>{asset.filename}</b>
                      <small>{asset.asset_id} · {asset.in_out}</small>
                      <code>{asset.nas_path}</code>
                      <p>{asset.usage}</p>
                    </div>
                    {safeUrl(asset.download_url) && (
                      <a className="tw-button" href={safeUrl(asset.download_url)} download>
                        <Download size={15} />下载原片
                      </a>
                    )}
                  </div>
                ))}
              </section>

              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <FileText size={18} />
                  <h3>锁定脚本文案</h3>
                </div>
                <div className="tw-script-grid">
                  <div><small>{t.language === "ru" ? "俄语配音正文" : "英文配音正文"}</small><p>{work.script.voiceover}</p></div>
                  <div><small>中文核对稿</small><p>{work.script.zh_translation}</p></div>
                </div>
                <div className="tw-copy-parts">
                  <span><b>HOOK</b>{work.script.hook}</span>
                  <span><b>BODY</b>{work.script.body}</span>
                  <span><b>CTA</b>{work.script.cta}</span>
                </div>
              </section>

              {work.voice && (
                <section className="tw-work-section">
                  <div className="tw-work-section-title">
                    <FileAudio size={18} />
                    <h3>Voice Box 固定音轨</h3>
                    <Badge tone={work.voice.provider === "voicebox" ? "green" : "amber"}>{work.voice.provider}</Badge>
                  </div>
                  <div className="tw-voice-meta">
                    <b>{work.voice.profile_name}</b>
                    <span>{work.voice.profile_id}</span>
                    <span>{(work.voice.duration_ms / 1000).toFixed(2)} 秒</span>
                    <span>job {work.voice.job_id}</span>
                  </div>
                  {safeUrl(work.voice.audio_url) && (
                    <div className="tw-audio-row">
                      <audio controls preload="metadata" src={safeUrl(work.voice.audio_url)} />
                      <a className="tw-button" href={safeUrl(work.voice.audio_url)} download><Download size={15} />下载 WAV</a>
                    </div>
                  )}
                </section>
              )}

              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <Captions size={18} />
                  <h3>SRT 字幕</h3>
                  <Badge tone="amber">{work.subtitles?.timing_status || "待核对"}</Badge>
                </div>
                <div className="tw-artifact-actions">
                  {safeUrl(work.subtitles?.srt_url) && <a className="tw-button" href={safeUrl(work.subtitles?.srt_url)} download><Download size={15} />目标语言 SRT</a>}
                  {safeUrl(work.subtitles?.zh_srt_url) && <a className="tw-button" href={safeUrl(work.subtitles?.zh_srt_url)} download><Download size={15} />中文对照 SRT</a>}
                </div>
              </section>

              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <Workflow size={18} />
                  <h3>分镜执行表</h3>
                </div>
                <div className="tw-storyboard-scroll">
                  <table className="tw-storyboard">
                    <thead><tr><th>时间</th><th>画面</th><th>旁白</th><th>屏幕文字</th><th>剪辑说明</th></tr></thead>
                    <tbody>{work.storyboard.map((shot) => <tr key={`${shot.time}-${shot.visual}`}><td><b>{shot.time}</b></td><td>{shot.visual}</td><td>{shot.voiceover}</td><td>{shot.on_screen_text}</td><td>{shot.edit_note}</td></tr>)}</tbody>
                  </table>
                </div>
              </section>

              <section className="tw-work-section">
                <div className="tw-work-section-title">
                  <FolderOpen size={18} />
                  <h3>逐项文件</h3>
                </div>
                <div className="tw-artifact-grid">
                  {work.artifacts.map((artifact) => (
                    <a key={artifact.key} className="tw-artifact-card" href={safeUrl(artifact.download_url)} download>
                      <FileText size={17} />
                      <span><b>{artifact.label}</b><small>{artifact.filename}{artifact.size_bytes ? ` · ${formatBytes(artifact.size_bytes)}` : ""}</small></span>
                      <Download size={15} />
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}
          <div className="tw-section-heading tw-supplement-heading">
            <h3>补充引用与事实边界</h3>
          </div>
          {t.input_refs.map((r, i) => (
            <div key={i} className="tw-material">
              <b>{r.label}</b>
              <p>
                {safeUrl(r.value) ? (
                  <a href={safeUrl(r.value)} target="_blank" rel="noreferrer">
                    打开资料 <ArrowUpRight size={14} />
                  </a>
                ) : (
                  r.value
                )}
              </p>
            </div>
          ))}
          <div className="tw-material">
            <b>最终行动 / CTA</b>
            <p>{work?.evidence_boundary || t.cta}</p>
          </div>
          <button
            className="tw-button primary"
            onClick={() => setTab("action")}
          >
            回到修改与交付 <ArrowRight size={16} />
          </button>
        </div>
      )}
      {tab === "trace" && (
        <div className="tw-detail-body">
          <div className="tw-material">
            <b>当前任务版本</b>
            <p>
              r{t.revision} · 第 {t.edit_generation} 次编辑领取
            </p>
          </div>
          <div className="tw-material">
            <b>生产端状态</b>
            <p>
              {STATUS_LABEL[t.status]} · {ACTOR_LABEL[t.owner]}
            </p>
          </div>
          <div className="tw-material">
            <b>本页交接</b>
            <p>
              {response
                ? `${response.note}（尚未收到生产端回执）`
                : "没有回传记录"}
            </p>
          </div>
          <div className="tw-hint-box">
            <ShieldCheck size={22} />
            <p>
              {t.claim
                ? `领取人：${t.claim.claimant_member_id} · ${new Date(t.claim.claimed_at).toLocaleString("zh-CN")}`
                : "当前版本没有有效领取记录。"}{" "}
              生产端保留时间、产物和检验报告。
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function Calendar({
  snapshot,
  week,
  setWeek,
  onTask,
}: {
  snapshot: Snapshot;
  week: number;
  setWeek: (n: number) => void;
  onTask: (s: string) => void;
}) {
  const [channel, setChannel] = useState("all");
  const rows = snapshot.publications.filter(
    (p) => p.week === week && (channel === "all" || p.channel === channel),
  );
  function exportCalendar() {
    const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const data = [
      [
        "ID",
        "周",
        "日期",
        "渠道",
        "内容",
        "语言",
        "时间",
        "时区",
        "北京时间",
        "状态",
        "content_id",
      ],
      ...snapshot.publications.map((p) => [
        p.id,
        String(p.week),
        p.date,
        p.channel,
        p.label,
        p.language,
        p.time,
        p.timezone,
        shanghaiTime(p),
        PUB_LABEL[p.status],
        p.content_id,
      ]),
    ]
      .map((r) => r.map(quote).join(","))
      .join("\r\n");
    download(
      "Tiger_4周发布日历.csv",
      "\uFEFF" + data,
      "text/csv;charset=utf-8",
    );
  }
  return (
    <>
      <div className="tw-channel-grid">
        {CHANNELS.map((c) => (
          <button
            key={c.name}
            className={`tw-channel ${channel === c.name ? "selected" : ""}`}
            onClick={() => setChannel(channel === c.name ? "all" : c.name)}
          >
            <div>
              <b>{c.name}</b>
              <Badge>{c.language}</Badge>
            </div>
            <strong>
              {c.count}
              <small> 次 / 周</small>
            </strong>
            <p>{c.format}</p>
            <small>{c.role}</small>
          </button>
        ))}
      </div>
      <section className="tw-panel tw-calendar">
        <div className="tw-calendar-toolbar">
          <div className="tw-week-tabs">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                className={n === week ? "active" : ""}
                onClick={() => setWeek(n)}
              >
                第 {n} 周{n === 4 && <small> + 长片</small>}
              </button>
            ))}
          </div>
          <button className="tw-button" onClick={exportCalendar}>
            <Download size={16} />
            下载 4 周日历
          </button>
        </div>
        <div className="tw-calendar-note">
          <span>
            {week === 4
              ? "本周 10 次常规 + 1 条 YouTube 长片"
              : "本周 10 次常规发布"}{" "}
            · 启动日 {snapshot.launch_date} 为
            {snapshot.source_revision > 1 ? "快照记录" : "候选排程"}
          </span>
          {channel !== "all" && (
            <button onClick={() => setChannel("all")}>
              显示全部渠道 <X size={14} />
            </button>
          )}
        </div>
        <div className="tw-table-scroll">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>平台 / 语言</th>
                <th>发布内容</th>
                <th>平台排程时间</th>
                <th>北京时间</th>
                <th>进度</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <CalendarRow key={p.id} row={p} onTask={onTask} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="tw-calendar-bottom">
        <div>
          <Film size={23} />
          <p>
            <b>英文成片只做一次</b>
            <span>
              YouTube Shorts 与 Instagram Reels 复用母版，发布记录各自独立。
            </span>
          </p>
        </div>
        <div>
          <CalendarDays size={23} />
          <p>
            <b>第 4 周加一条长片</b>
            <span>
              同一产品，3–5 分钟；YouTube、官网、销售复用，不重复算产量。
            </span>
          </p>
        </div>
      </div>
      <p className="tw-hint">
        时间为首轮执行基线，不代表最佳发布时间；实际平台定时需在账号与内容就绪后完成。未开始发布时可整体顺延，已发布历史必须保留。
      </p>
    </>
  );
}
function CalendarRow({
  row: p,
  onTask,
}: {
  row: Publication;
  onTask: (s: string) => void;
}) {
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(p.date + "T00:00:00Z"));
  return (
    <tr>
      <td>
        <b>{p.date.slice(5).replace("-", " / ")}</b>
        <small>{weekday}</small>
      </td>
      <td>
        <b>{p.channel}</b>
        <small>{p.language === "ru" ? "俄语" : "英文"}</small>
      </td>
      <td>
        <button className="tw-text-link" onClick={() => onTask(p.content_id)}>
          {p.label}
          <ArrowUpRight size={13} />
        </button>
        <small>{p.content_id}</small>
      </td>
      <td>
        <b>{p.time}</b>
        <small>{p.timezone}</small>
      </td>
      <td>{shanghaiTime(p)}</td>
      <td>
        <Badge tone={p.status === "PUBLISHED" ? "green" : "muted"}>
          {PUB_LABEL[p.status]}
        </Badge>
        {safeUrl(p.published_url) && (
          <a href={safeUrl(p.published_url)} target="_blank" rel="noreferrer">
            查看发布
          </a>
        )}
      </td>
    </tr>
  );
}

function Guide({
  phase,
  setGuide,
  snapshot,
  role,
}: {
  phase: Phase;
  setGuide: (s: string) => void;
  snapshot: Snapshot;
  role: Actor;
}) {
  const record = snapshot.phases.find((p) => p.id === phase.id);
  return (
    <div className="tw-guide-grid">
      <nav className="tw-panel tw-phase-nav" aria-label="阶段">
        {PHASES.map((p) => {
          const r = snapshot.phases.find((x) => x.id === p.id);
          return (
            <button
              key={p.id}
              className={phase.id === p.id ? "active" : ""}
              onClick={() => setGuide(p.id)}
            >
              <span
                className={`tw-phase-number ${r?.status === "PASSED" ? "passed" : ""}`}
              >
                {r?.status === "PASSED" ? <Check size={16} /> : p.id}
              </span>
              <div>
                <b>{p.title}</b>
                <small>{PHASE_LABEL[r?.status || "WAITING"]}</small>
              </div>
              <ChevronRight size={16} />
            </button>
          );
        })}
      </nav>
      <section className="tw-panel tw-guide-detail">
        <div className="tw-section-heading">
          <span className="tw-eyebrow">{phase.id} / 阶段操作卡</span>
          <Badge
            tone={
              record?.status === "PASSED"
                ? "green"
                : record?.status === "BLOCKED"
                  ? "amber"
                  : "muted"
            }
          >
            {PHASE_LABEL[record?.status || "WAITING"]}
          </Badge>
        </div>
        <h2>{phase.title}</h2>
        <p className="tw-guide-goal">{phase.goal}</p>
        <div className="tw-guide-columns">
          <div>
            <h3>
              <Code2 size={18} />
              Codex 自动完成
            </h3>
            <List items={phase.codex} />
          </div>
          <div className={role === "EDITOR" ? "tw-human-focus" : ""}>
            <h3>
              <UserRound size={18} />
              剪辑师具体怎么做
            </h3>
            <List items={phase.human} />
          </div>
        </div>
        <div className="tw-guide-columns tw-guide-io">
          <div>
            <h3>开始前要拿到</h3>
            <ul>
              {phase.inputs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>这一阶段交什么</h3>
            <ul>
              {phase.outputs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="tw-stage-test">
          <h3>
            <ShieldCheck size={18} />
            怎样才算通过
          </h3>
          {phase.checks.map((s) => (
            <p key={s}>
              <Check size={16} />
              {s}
            </p>
          ))}
          <div>
            <b>当前依据</b>
            <span>
              {record?.evidence.length
                ? record.evidence.join("；")
                : "尚无检验报告，不标记已通过。"}
            </span>
          </div>
        </div>
        <div className="tw-next-step">
          <ArrowRight size={20} />
          <div>
            <b>接下来</b>
            <p>{phase.next}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Boss({
  snapshot: s,
  demo,
  onCalendar,
  toast,
}: {
  snapshot: Snapshot;
  demo: boolean;
  onCalendar: () => void;
  toast: (s: string) => void;
}) {
  const needs = s.tasks.filter((t) => t.owner === "BOSS");
  return (
    <div className="tw-boss-grid">
      <section className="tw-panel tw-boss-report">
        <div className="tw-section-heading">
          <h2>本周期，只看这四件事</h2>
          <Badge>{demo ? "演练口径" : "快照口径"}</Badge>
        </div>
        <div className="tw-report-row">
          <b>完成</b>
          <p>
            {s.tasks.length
              ? `${s.tasks.filter((t) => t.status === "READY").length} 份内容可交付；${s.publications.filter((p) => p.status === "PUBLISHED").length} 次有记录的发布。`
              : "尚未接入实际生产记录。"}
          </p>
        </div>
        <div className="tw-report-row">
          <b>异常</b>
          <p>
            {demo
              ? "1 条字幕位置待修；人工回传闭环待验证。Codex 继续准备其余内容。"
              : s.tasks
                  .filter((t) => ["FAILED", "NEEDS_ASSET"].includes(t.status))
                  .map((t) => t.reason)
                  .join("；") || "当前快照没有异常记录；未接入不代表无异常。"}
          </p>
        </div>
        <div className="tw-report-row">
          <b>询盘</b>
          <p>
            询盘 {s.metrics.inquiries ?? "未知"} · 合格询盘{" "}
            {s.metrics.qualified ?? "未知"}
            <small>不把没有回收的数据计作 0。</small>
          </p>
        </div>
        <div className="tw-report-row">
          <b>下一步</b>
          <p>
            {demo
              ? "收齐首周内容后，一次确认俄英代表片、声音和图文样式。"
              : "由 Codex 按真实状态继续下一可执行任务。"}
          </p>
        </div>
        <button className="tw-button" onClick={onCalendar}>
          查看发布日历 <ArrowRight size={16} />
        </button>
      </section>
      <section className="tw-panel tw-decision">
        <div className="tw-section-heading">
          <h2>需要老板决定</h2>
          <Badge tone="amber">{needs.length}</Badge>
        </div>
        {needs.length ? (
          needs.map((t) => (
            <div className="tw-material" key={t.id}>
              <b>{t.title}</b>
              <p>{t.reason}</p>
              <p>{t.next_action}</p>
              <button
                className="tw-button"
                onClick={() => {
                  download(`${t.id}-decision-request.json`, {
                    content_id: t.id,
                    revision: t.revision,
                    request: t.next_action,
                  });
                  toast("已导出待决定事项；尚未作出批准，也不会触发发布。");
                }}
              >
                下载待决定事项
              </button>
            </div>
          ))
        ) : (
          <div className="tw-decision-empty">
            <CheckCheck size={32} />
            <h3>现在不用逐条审核</h3>
            <p>
              {demo
                ? "首批材料尚未收齐。Codex 会把代表片、声音和样式合并后再提交。"
                : "只有真实需要拍板的事项才进入这里。"}
            </p>
          </div>
        )}
        <div className="tw-decision-rule">
          <LockKeyhole size={18} />
          <p>
            新增产品 /
            市场、频率或预算变化、未确认的业务承诺，集中交老板决定。普通修改和机器检查持续进行。
          </p>
        </div>
      </section>
    </div>
  );
}

function Codex({
  snapshot: s,
  hasActual,
  demo,
  onImport,
  toast,
}: {
  snapshot: Snapshot;
  hasActual: boolean;
  demo: boolean;
  onImport: () => void;
  toast: (s: string) => void;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(CODEX_PROMPT);
      toast("续跑指令已复制，可交给负责生产的 Codex。");
    } catch {
      download("Codex_续跑指令.txt", CODEX_PROMPT, "text/plain");
      toast("已下载续跑指令。");
    }
  }
  return (
    <div className="tw-codex-grid">
      <section className="tw-panel tw-codex-main">
        <div className="tw-section-heading">
          <h2>继续执行之前</h2>
          <Badge>{demo ? "演练" : hasActual ? "离线快照" : "未接入"}</Badge>
        </div>
        <List
          items={[
            "读取总规范、CONTINUE.md 和真实状态，核对当前版本。",
            "完成最早未通过且依赖满足的步骤，产物与报告一起登记。",
            "仅把需要观感判断或实际修订的任务交给剪辑师。",
            "更新工作台快照和恢复入口；外部动作沿用已有授权。",
          ]}
        />
        <div className="tw-inline tw-codex-buttons">
          <button className="tw-button primary" onClick={copy}>
            <ClipboardList size={16} />
            复制续跑指令
          </button>
          <button className="tw-button" onClick={onImport}>
            <Upload size={16} />
            导入生产快照
          </button>
          <button
            className="tw-button"
            onClick={() => {
              download("workbench-snapshot.template.json", {
                ...emptySnapshot(),
                source_revision: 1,
                generated_at: new Date().toISOString(),
              });
              toast("模板保持所有生产阶段未开始，不能把模板当作完成记录。");
            }}
          >
            <Download size={16} />
            下载空白协议
          </button>
        </div>
        <details className="tw-code-details">
          <summary>查看续跑约束</summary>
          <pre>{CODEX_PROMPT}</pre>
        </details>
        <div className="tw-connection-list">
          {["生产任务状态", "素材与 NAS", "自动制作与检验", "账号定时发布"].map(
            (x) => (
              <div key={x}>
                <span>{x}</span>
                <Badge>
                  {x === "生产任务状态" && hasActual
                    ? "已载入快照"
                    : "尚未实时接入"}
                </Badge>
              </div>
            ),
          )}
        </div>
      </section>
      <section className="tw-panel tw-contract">
        <h2>
          <ShieldCheck size={21} />
          本轮不漂移
        </h2>
        <ul>
          <li>三方：老板、Codex、剪辑师</li>
          <li>每周 2 个母题，俄英 4 条母版</li>
          <li>五渠道，每周 10 次发布</li>
          <li>4 周 40 常规 + 1 长片</li>
          <li>短片 18 秒；长片 3–5 分钟</li>
          <li>人工修订保留，已发历史保留</li>
          <li>演练、待交付、已发布分别记录</li>
        </ul>
        <div className="tw-hint-box">
          <LockKeyhole size={18} />
          <p>前台不能直接把阶段改为通过。生产端负责检验，并返回证据。</p>
        </div>
        <p className="tw-hint">
          当前规范：{s.spec_version} · 本页面不启动生产命令或对外发布。
        </p>
      </section>
    </div>
  );
}
