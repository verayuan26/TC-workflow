PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS outreach_programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','stopped')),
  revision INTEGER NOT NULL DEFAULT 1,
  timezone TEXT NOT NULL DEFAULT 'Asia/Shanghai',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outreach_leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'RU',
  country TEXT NOT NULL DEFAULT '俄罗斯',
  city TEXT NOT NULL,
  region_group TEXT,
  website TEXT,
  normalized_website TEXT,
  primary_email TEXT,
  normalized_email TEXT,
  primary_phone TEXT,
  normalized_phone TEXT,
  contact_name TEXT,
  contact_role TEXT,
  contact_role_status TEXT NOT NULL DEFAULT 'suggested' CHECK (contact_role_status IN ('verified','suggested','unknown')),
  fit_reason TEXT NOT NULL,
  suggested_entry TEXT NOT NULL,
  demand_status TEXT NOT NULL DEFAULT 'unknown' CHECK (demand_status IN ('unknown','needs_details','evaluable')),
  china_supply_status TEXT NOT NULL DEFAULT 'unknown' CHECK (china_supply_status IN ('unknown','accepted','conditional','rejected')),
  progress_status TEXT NOT NULL DEFAULT 'uncontacted' CHECK (progress_status IN ('uncontacted','attempted','connected','needs_details','evaluable','paused','not_fit','do_not_contact')),
  owner_person_id TEXT,
  stopped_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_person_id) REFERENCES members(person_id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_owner ON outreach_leads(owner_person_id, progress_status);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_domain ON outreach_leads(normalized_website);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_email ON outreach_leads(normalized_email);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_phone ON outreach_leads(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_name_city ON outreach_leads(canonical_name, city);

CREATE TABLE IF NOT EXISTS outreach_batches (
  batch_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  source_system TEXT NOT NULL,
  source_task_id TEXT,
  source_run_id TEXT,
  artifact_version TEXT NOT NULL,
  artifact_url TEXT,
  artifact_sha256 TEXT NOT NULL,
  program_id TEXT NOT NULL,
  program_revision INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','partial','failed')),
  summary_json TEXT NOT NULL DEFAULT '{}',
  received_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(program_id) REFERENCES outreach_programs(id)
);

CREATE TABLE IF NOT EXISTS outreach_sources (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  item_ref TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  evidence_limit TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  checksum TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(batch_id,item_ref),
  FOREIGN KEY(lead_id) REFERENCES outreach_leads(id),
  FOREIGN KEY(batch_id) REFERENCES outreach_batches(batch_id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_sources_lead ON outreach_sources(lead_id, created_at);

CREATE TABLE IF NOT EXISTS outreach_tasks (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  handoff_status TEXT NOT NULL CHECK (handoff_status IN ('unassigned','pending','in_progress','submitted','needs_more','reviewed')),
  owner_person_id TEXT,
  action_text TEXT NOT NULL,
  contact_target TEXT NOT NULL,
  russian_draft TEXT NOT NULL,
  chinese_translation TEXT NOT NULL,
  delivery_requirements TEXT NOT NULL,
  material_refs_json TEXT NOT NULL DEFAULT '[]',
  due_at TEXT,
  next_step TEXT NOT NULL,
  review_note TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(lead_id) REFERENCES outreach_leads(id),
  FOREIGN KEY(owner_person_id) REFERENCES members(person_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_outreach_one_active_task ON outreach_tasks(lead_id,task_type) WHERE active=1;
CREATE INDEX IF NOT EXISTS idx_outreach_tasks_owner ON outreach_tasks(owner_person_id,handoff_status);

CREATE TABLE IF NOT EXISTS outreach_contact_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  actor_person_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  happened_at TEXT NOT NULL,
  channel TEXT NOT NULL,
  address_used TEXT NOT NULL,
  contact_name TEXT,
  contact_role TEXT,
  result TEXT NOT NULL CHECK (result IN ('unreachable','bounced','message_sent','contact_found','willing_to_share','no_current_need','not_fit','do_not_contact')),
  customer_quote TEXT,
  operator_summary TEXT NOT NULL,
  next_action TEXT,
  next_date TEXT,
  waiting_for TEXT,
  verification_level TEXT NOT NULL CHECK (verification_level IN ('independent','operator_statement')),
  payload_checksum TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  review_status TEXT NOT NULL DEFAULT 'submitted' CHECK (review_status IN ('submitted','needs_more','reviewed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(lead_id) REFERENCES outreach_leads(id),
  FOREIGN KEY(task_id) REFERENCES outreach_tasks(id),
  FOREIGN KEY(actor_person_id) REFERENCES members(person_id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_events_task ON outreach_contact_events(task_id,created_at);
CREATE INDEX IF NOT EXISTS idx_outreach_events_review ON outreach_contact_events(review_status,created_at);

CREATE TABLE IF NOT EXISTS outreach_attachments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  event_id TEXT,
  owner_person_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('declared','verified','rejected')),
  created_at TEXT NOT NULL,
  verified_at TEXT,
  FOREIGN KEY(lead_id) REFERENCES outreach_leads(id),
  FOREIGN KEY(task_id) REFERENCES outreach_tasks(id),
  FOREIGN KEY(event_id) REFERENCES outreach_contact_events(id),
  FOREIGN KEY(owner_person_id) REFERENCES members(person_id)
);
CREATE INDEX IF NOT EXISTS idx_outreach_attachments_task ON outreach_attachments(task_id,status);

CREATE TABLE IF NOT EXISTS outreach_reviews (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  task_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('pass','needs_more')),
  summary TEXT NOT NULL,
  missing_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES outreach_contact_events(id),
  FOREIGN KEY(task_id) REFERENCES outreach_tasks(id)
);

CREATE TABLE IF NOT EXISTS outreach_batch_items (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  item_ref TEXT NOT NULL,
  lead_id TEXT,
  task_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('created','matched','needs_more','conflict','not_fit','failed')),
  reason TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(batch_id,item_ref),
  FOREIGN KEY(batch_id) REFERENCES outreach_batches(batch_id),
  FOREIGN KEY(lead_id) REFERENCES outreach_leads(id),
  FOREIGN KEY(task_id) REFERENCES outreach_tasks(id)
);

INSERT OR IGNORE INTO outreach_programs(id,title,status,revision,timezone,config_json,created_at,updated_at)
VALUES('precision-russia-30d','精密铁件主动开发 · 30 天试验','draft',1,'Asia/Shanghai','{"scope":"Russia precision metal parts","assignment_rule":"unassigned_until_authorized"}',datetime('now'),datetime('now'));
