export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ASSETS: Fetcher;
  CF_ACCESS_TEAM_DOMAIN: string;
  CF_ACCESS_AUD: string;
  ALLOW_DEV_AUTH?: string;
  DEV_PERSON_EMAIL?: string;
  OUTREACH_FILE_SIGNING_SECRET?: string;
}
export type Member = {
  person_id: string;
  email: string;
  name: string;
  staff_role: "boss" | "editor" | "sales" | "codex" | "coordinator" | "procurement";
  status: string;
  permissions_json: string;
  source_member_id: string | null;
};
export type AuthActor = {
  id: string;
  email: string;
  name: string;
  role: Member["staff_role"];
  permissions: string[];
  kind: "member" | "service";
};
