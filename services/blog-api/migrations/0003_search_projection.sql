-- Backfill with scripts/backfill-blog-search.mjs before enabling writes.
-- Older Workers ignore this column; rebuild before upgrading again after rollback.
ALTER TABLE articles ADD COLUMN search_text TEXT NOT NULL DEFAULT '';
CREATE INDEX approvals_revision_history ON approvals(revision_id, approved_at DESC, id DESC);
