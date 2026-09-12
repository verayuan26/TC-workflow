ALTER TABLE members ADD COLUMN staff_pronoun_grammar TEXT;

CREATE TABLE IF NOT EXISTS social_accounts (
  account_id TEXT PRIMARY KEY,
  owner_person_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  channel_persona_name TEXT NOT NULL,
  login_email TEXT,
  channel_id TEXT,
  browser_locator TEXT,
  short_code TEXT,
  authorization_status TEXT NOT NULL DEFAULT 'unknown',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(owner_person_id) REFERENCES members(person_id)
);
CREATE INDEX IF NOT EXISTS idx_social_owner ON social_accounts(owner_person_id, platform);
