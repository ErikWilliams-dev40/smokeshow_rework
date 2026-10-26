-- Additive, dedicated blog database. Application rollback must preserve these tables.
PRAGMA foreign_keys = ON;
CREATE TABLE articles (
  slug TEXT PRIMARY KEY,
  draft_revision TEXT,
  published_revision TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  published_at TEXT,
  updated_at TEXT,
  category TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX articles_publication ON articles(published_at DESC, slug) WHERE published_revision IS NOT NULL;
CREATE INDEX articles_category ON articles(category, published_at DESC, slug) WHERE published_revision IS NOT NULL;
CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL REFERENCES articles(slug),
  content TEXT NOT NULL CHECK(json_valid(content)),
  digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);
CREATE INDEX revisions_article ON revisions(slug, created_at, id);
CREATE TRIGGER revisions_immutable BEFORE UPDATE ON revisions BEGIN SELECT RAISE(ABORT, 'immutable_revision'); END;
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES revisions(id),
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  checklist_acknowledged INTEGER NOT NULL CHECK(checklist_acknowledged = 1)
);
CREATE TABLE publication (
  slug TEXT PRIMARY KEY REFERENCES articles(slug),
  approval_id TEXT NOT NULL REFERENCES approvals(id)
);
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  width INTEGER NOT NULL CHECK(width > 0),
  height INTEGER NOT NULL CHECK(height > 0),
  bytes INTEGER NOT NULL CHECK(bytes > 0 AND bytes <= 5000000),
  digest TEXT NOT NULL UNIQUE,
  uploaded_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE revision_media (
  revision_id TEXT NOT NULL REFERENCES revisions(id),
  media_id TEXT NOT NULL REFERENCES media(id),
  PRIMARY KEY(revision_id, media_id)
);
CREATE INDEX media_publications ON revision_media(media_id, revision_id);
CREATE TABLE homepage (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  selections TEXT NOT NULL CHECK(json_valid(selections))
);
INSERT INTO homepage VALUES(1, '{}');
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  slug TEXT,
  revision_id TEXT,
  expected_version INTEGER,
  created_at TEXT NOT NULL
);
-- The first statement in each mutation batch obtains a write lock and checks
-- the version INSIDE the transaction. A conflict aborts the whole D1 batch.
CREATE TRIGGER audit_version_guard BEFORE INSERT ON audit_events
WHEN NEW.expected_version IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM articles WHERE slug = NEW.slug AND version = NEW.expected_version
) BEGIN SELECT RAISE(ABORT, 'version_conflict'); END;
