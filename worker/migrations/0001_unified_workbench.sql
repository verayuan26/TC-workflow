PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS members (
  person_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  staff_role TEXT NOT NULL CHECK (staff_role IN ('boss','editor','sales','codex','coordinator','procurement')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  permissions_json TEXT NOT NULL DEFAULT '[]',
  source_member_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_source ON members(source_member_id) WHERE source_member_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS service_identities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outreach_workspaces (
  id TEXT PRIMARY KEY,
  owner_person_id TEXT NOT NULL,
  data TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_person_id) REFERENCES members(person_id)
);
CREATE TABLE IF NOT EXISTS content_projections (
  cycle_id TEXT PRIMARY KEY,
  source_revision INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  synced_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS content_commands (
  request_id TEXT PRIMARY KEY,
  request_fingerprint TEXT NOT NULL,
  command_type TEXT NOT NULL,
  actor_person_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  base_revision INTEGER NOT NULL,
  edit_generation INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING_PRODUCER','ACKNOWLEDGED','REJECTED','FAILED')),
  receipt_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(actor_person_id) REFERENCES members(person_id)
);
CREATE INDEX IF NOT EXISTS idx_content_commands_status ON content_commands(status, created_at);
CREATE TABLE IF NOT EXISTS content_uploads (
  upload_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DECLARED','UPLOADED','VERIFIED','REJECTED')),
  created_at TEXT NOT NULL,
  verified_at TEXT,
  FOREIGN KEY(request_id) REFERENCES content_commands(request_id)
);
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_kind TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  result TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}'
);
