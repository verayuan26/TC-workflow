import { createRemoteJWKSet, jwtVerify } from "jose";
import type { AuthActor, Env, Member } from "./types";
export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function sha256(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
async function memberByEmail(env: Env, email: string): Promise<AuthActor> {
  const row = await env.DB.prepare(
    "SELECT * FROM members WHERE email = ? COLLATE NOCASE AND status = ?",
  )
    .bind(email, "active")
    .first<Member>();
  if (!row) throw new HttpError("当前 Access 身份未配置工作台权限", 403);
  return {
    id: row.person_id,
    email: row.email,
    name: row.name,
    role: row.staff_role,
    permissions: JSON.parse(row.permissions_json) as string[],
    kind: "member",
  };
}
async function serviceActor(
  request: Request,
  env: Env,
): Promise<AuthActor | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const hash = await sha256(auth.slice(7));
  const row = await env.DB.prepare(
    "SELECT id,name,scopes_json FROM service_identities WHERE token_hash=? AND status=?",
  )
    .bind(hash, "active")
    .first<{ id: string; name: string; scopes_json: string }>();
  if (!row) throw new HttpError("服务身份无效", 401);
  await env.DB.prepare(
    "UPDATE service_identities SET last_seen_at=?,updated_at=? WHERE id=?",
  )
    .bind(new Date().toISOString(), new Date().toISOString(), row.id)
    .run();
  return {
    id: row.id,
    email: "",
    name: row.name,
    role: "codex",
    permissions: JSON.parse(row.scopes_json) as string[],
    kind: "service",
  };
}
export async function authenticate(
  request: Request,
  env: Env,
  allowService = false,
): Promise<AuthActor> {
  if (allowService) {
    const service = await serviceActor(request, env);
    if (service) return service;
  }
  if (env.ALLOW_DEV_AUTH === "true") {
    const email =
      request.headers.get("x-tiger-dev-email") || env.DEV_PERSON_EMAIL || "";
    if (emailPattern.test(email)) return memberByEmail(env, email);
  }
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD)
    throw new HttpError("Cloudflare Access 尚未配置", 503);
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) throw new HttpError("缺少 Cloudflare Access 身份", 401);
  const issuer = `https://${env.CF_ACCESS_TEAM_DOMAIN}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
  let payload;
  try {
    ({ payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: env.CF_ACCESS_AUD,
    }));
  } catch {
    throw new HttpError("Cloudflare Access 身份验证失败", 401);
  }
  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  if (!emailPattern.test(email))
    throw new HttpError("Access 身份缺少有效邮箱", 401);
  return memberByEmail(env, email);
}
export function requirePermission(actor: AuthActor, ...allowed: string[]) {
  if (
    actor.role === "boss" ||
    allowed.some((x) => actor.permissions.includes(x))
  )
    return;
  throw new HttpError("没有此操作权限", 403);
}
