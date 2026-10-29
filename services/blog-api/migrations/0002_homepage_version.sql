-- Additive homepage concurrency metadata; older Workers remain compatible.
ALTER TABLE homepage ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0);
DROP TRIGGER audit_version_guard;
CREATE TRIGGER audit_version_guard BEFORE INSERT ON audit_events
WHEN NEW.expected_version IS NOT NULL AND NEW.action != 'curate' AND NOT EXISTS (
  SELECT 1 FROM articles WHERE slug = NEW.slug AND version = NEW.expected_version
) BEGIN SELECT RAISE(ABORT, 'version_conflict'); END;
CREATE TRIGGER homepage_version_guard BEFORE INSERT ON audit_events
WHEN NEW.action = 'curate' AND NEW.expected_version IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM homepage WHERE id = 1 AND version = NEW.expected_version
) BEGIN SELECT RAISE(ABORT, 'version_conflict'); END;
