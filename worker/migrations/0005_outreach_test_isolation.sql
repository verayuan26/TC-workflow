ALTER TABLE outreach_leads ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0,1));
ALTER TABLE outreach_batches ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0,1));
CREATE INDEX IF NOT EXISTS idx_outreach_leads_test_owner ON outreach_leads(is_test,owner_person_id,progress_status);
