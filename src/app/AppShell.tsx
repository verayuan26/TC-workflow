import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Film,
  History,
  LogOut,
  Settings,
  Target,
  UserRound,
} from "lucide-react";
import { Workbench } from "../workbench/Workbench";
import { OutreachWorkbench } from "../outreach/OutreachWorkbench";
import { Overview } from "./Overview";
import { SettingsPage } from "./SettingsPage";
import "./shell.css";

export type StaffRole = "boss" | "editor" | "sales" | "codex" | "coordinator" | "procurement";
export type Viewer = {
  person_id: string;
  name: string;
  email: string;
  role: StaffRole;
  permissions: string[];
};
function contentActor(viewer:Viewer|null):"EDITOR"|"CODEX"|"BOSS"|undefined {
  if(!viewer)return undefined;
  if(viewer.role==="boss")return "BOSS";
  if(viewer.role==="editor")return "EDITOR";
  return "CODEX";
}
type Route = "/overview" | "/content" | "/outreach" | "/settings" | "/legacy";
const routes: Route[] = [
  "/overview",
  "/content",
  "/outreach",
  "/settings",
  "/legacy",
];

function routeFromPath(): Route {
  const path = window.location.pathname.replace(/\/$/, "") || "/overview";
  if (path === "/workbench") return "/content";
  return routes.includes(path as Route) ? (path as Route) : "/overview";
}

export function AppShell() {
  const [route, setRoute] = useState<Route>(routeFromPath);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [authState, setAuthState] = useState<
    "loading" | "ready" | "unconfigured" | "denied"
  >("loading");
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    window.addEventListener("popstate", onPop);
    fetch("/api/me", { credentials: "same-origin" })
      .then(async (response) => {
        if (response.ok) {
          setViewer((await response.json()) as Viewer);
          setAuthState("ready");
          return;
        }
        setAuthState(response.status === 503 ? "unconfigured" : "denied");
      })
      .catch(() => setAuthState("unconfigured"));
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = (next: Route) => {
    history.pushState({}, "", next);
    setRoute(next);
    window.scrollTo(0, 0);
  };
  const visible = useMemo(() => {
    if (!viewer) return routes.filter((r) => r !== "/settings");
    const byRole: Record<StaffRole, Route[]> = {
      boss: routes,
      editor: ["/overview", "/content", "/legacy"],
      sales: ["/overview", "/outreach", "/legacy"],
      codex: ["/overview", "/content", "/outreach", "/legacy"],
      coordinator: ["/overview", "/content", "/outreach", "/legacy"],
      procurement: ["/overview", "/content", "/legacy"],
    };
    return byRole[viewer.role];
  }, [viewer]);
  const labels: Record<Route, [string, typeof BarChart3]> = {
    "/overview": ["结果总览", BarChart3],
    "/content": ["内容工作台", Film],
    "/outreach": ["客户开发", Target],
    "/settings": ["人员与设置", Settings],
    "/legacy": ["旧记录", History],
  };
  if (authState === "denied")
    return (
      <main className="tc-auth">
        <h1>无法进入工作台</h1>
        <p>
          当前 Access 身份未出现在成员表中。系统不会把第一个访问者自动设为老板。
        </p>
        <a href="/cdn-cgi/access/logout">
          <LogOut size={16} />
          重新登录
        </a>
      </main>
    );
  const routeAllowed=!viewer||visible.includes(route);
  return (
    <div className="tc-app">
      <header className="tc-global-header">
        <button className="tc-logo" onClick={() => navigate("/overview")}>
          <b>T</b>
          <span>
            TIGER<small>统一工作台</small>
          </span>
        </button>
        <nav>
          {visible.map((item) => {
            const Icon = labels[item][1];
            return (
              <button
                key={item}
                className={route === item ? "active" : ""}
                onClick={() => navigate(item)}
              >
                <Icon size={17} />
                {labels[item][0]}
              </button>
            );
          })}
        </nav>
        <div className="tc-viewer">
          <UserRound size={18} />
          <span>
            {viewer?.name ||
              (authState === "loading" ? "正在验证身份" : "本地未连接")}
            <small>{viewer?.role || "只读构建预览"}</small>
          </span>
        </div>
      </header>
      {authState === "unconfigured" && (
        <div className="tc-env-banner">
          本地构建预览：Access / D1 尚未连接。本页不授予生产写权限。
        </div>
      )}
    <main className="tc-route">
      {!routeAllowed&&<section className="tc-page"><h1>没有此模块权限</h1><p>当前身份只能查看被授权的工作；直接输入网址不会扩大权限。</p></section>}
      {routeAllowed&&<>
      {route === "/overview" && <Overview viewer={viewer} />}
        {route === "/content" && <Workbench actor={contentActor(viewer)} lockRole={!!viewer} />}
        {route === "/outreach" && <OutreachWorkbench viewer={viewer} />}
        {route === "/settings" && <SettingsPage viewer={viewer} />}
      {route === "/legacy" && (
          <section className="tc-page">
            <p className="tc-kicker">历史保护</p>
            <h1>旧工作流保留为只读记录</h1>
            <p>
              旧多角色页面和服务文件仍在仓库历史中，但不再作为当前内容生产入口。迁移前后的任务、验收和发布记录都必须保留，不在此页伪造聚合结果。
            </p>
          </section>
      )}
      </>}
    </main>
    </div>
  );
}
