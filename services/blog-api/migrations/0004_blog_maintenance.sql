-- Additive guard shared by current and older audited publishing Workers.
CREATE TABLE blog_control (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  maintenance INTEGER NOT NULL DEFAULT 0 CHECK(maintenance IN (0, 1))
);
INSERT INTO blog_control VALUES(1, 0);
-- Setting maintenance=1 is a write barrier: preceding transactions finish first,
-- and subsequently committing mutation batches abort, including in-flight requests.
CREATE TRIGGER blog_maintenance_guard BEFORE INSERT ON audit_events
WHEN (SELECT maintenance FROM blog_control WHERE id = 1) = 1
BEGIN SELECT RAISE(ABORT, 'blog_maintenance'); END;
-- A rolled-back legacy Worker updates selections without updating version.
-- Preserve optimistic concurrency for new Workers sharing the same database.
CREATE TRIGGER homepage_legacy_version AFTER UPDATE OF selections ON homepage
WHEN NEW.version = OLD.version AND NEW.selections != OLD.selections
BEGIN UPDATE homepage SET version = version + 1 WHERE id = NEW.id; END;
