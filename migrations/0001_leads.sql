-- Additive: rolling back application code must leave these records intact.
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  submission_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT,
  created_at INTEGER NOT NULL,
  verified_at INTEGER,
  verification_version INTEGER NOT NULL DEFAULT 1,
  verification_expires_at INTEGER NOT NULL,
  resend_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lead_deliveries (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  kind TEXT NOT NULL CHECK (kind IN ('verification', 'sales', 'acknowledgment')),
  version INTEGER NOT NULL DEFAULT 1,
  attempts INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  delivered_at INTEGER,
  failed_at INTEGER
);
CREATE INDEX IF NOT EXISTS lead_deliveries_pending ON lead_deliveries(due_at, lease_until)
  WHERE delivered_at IS NULL AND failed_at IS NULL;
