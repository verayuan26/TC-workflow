CREATE TABLE IF NOT EXISTS content_artifacts (
  cycle_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  artifact_key TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT,
  synced_at TEXT NOT NULL,
  PRIMARY KEY(content_id, revision, artifact_key)
);
CREATE INDEX IF NOT EXISTS idx_content_artifacts_cycle ON content_artifacts(cycle_id, content_id, revision);
