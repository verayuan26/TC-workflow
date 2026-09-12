import { useEffect, useState } from "react";
import { LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import type { Viewer } from "./AppShell";
type Member = {
  person_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
  source_member_id?: string;
};
export function SettingsPage({ viewer }: { viewer: Viewer | null }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [message, setMessage] = useState("");
  const load = () =>
    fetch("/api/admin/members")
      .then(async (response) => {
        if (!response.ok) throw new Error("仅老板可查看成员设置");
        setMembers((await response.json()) as Member[]);
      })
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : "读取失败"),
      );
  useEffect(() => {
    void load();
  }, []);
  if (viewer?.role !== "boss")
    return (
      <section className="tc-page">
        <h1>没有设置权限</h1>
      </section>
    );
  return (
    <section className="tc-page">
      <p className="tc-kicker">IDENTITY / 权限</p>
      <h1>人员、服务身份与数据边界</h1>
      <p>
        角色来自 Cloudflare Access 身份和 D1
        成员表；工作邮箱、社媒登录和旧系统成员 ID 分开保存。
      </p>
      <div className="tc-settings-note">
        <ShieldCheck />
        <p>
          <b>未知账号默认拒绝</b>
          <br />
          不会把第一个访问者设为老板，也不接受前端自报角色。
        </p>
        <button onClick={load}>
          <RefreshCw size={15} />
          刷新
        </button>
      </div>
      <section className="tc-members">
        <h2>已导入成员</h2>
        {members.length ? (
          <table>
            <thead>
              <tr>
                <th>人员</th>
                <th>稳定 ID</th>
                <th>角色</th>
                <th>状态</th>
                <th>权限</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.person_id}>
                  <td>
                    <b>{m.name}</b>
                    <small>{m.email}</small>
                  </td>
                  <td>{m.person_id}</td>
                  <td>{m.role}</td>
                  <td>{m.status}</td>
                  <td>{m.permissions.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="tc-none">
            <LockKeyhole />
            <p>
              {message ||
                "生产成员尚未导入。使用服务端私有导入，不要提交花名册。"}
            </p>
          </div>
        )}
      </section>
      <p>
        公共示例：<code>docs/integration/staff-import.example.json</code>
        。真实映射只进入部署密钥或受控导入。
      </p>
    </section>
  );
}
