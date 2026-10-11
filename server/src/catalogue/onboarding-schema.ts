import type { DatabaseSync } from 'node:sqlite';

// Additive version-1 -> version-2 migration. Existing records/sessions are retained.
export function migrateOnboarding(db: DatabaseSync) {
  const version = String(
    db.prepare("SELECT value FROM local_meta WHERE key='schema_version'").get()
      ?.value,
  );
  if (version === '2' || version === '3') return;
  if (version !== '1')
    throw new Error('Unsupported local catalogue schema version.');
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      CREATE TABLE local_admin_memberships (user_id INTEGER PRIMARY KEY REFERENCES local_users(id), active INTEGER NOT NULL CHECK(active IN (0,1)), provisioned_at TEXT NOT NULL) STRICT;
      CREATE TABLE local_manager_links (token_hash TEXT PRIMARY KEY CHECK(length(token_hash)=64), user_id INTEGER NOT NULL REFERENCES local_users(id), expires_at TEXT NOT NULL, used_at TEXT) STRICT;
      CREATE TABLE local_shop_controls (shop_id INTEGER PRIMARY KEY REFERENCES local_shops(id), state TEXT NOT NULL CHECK(state IN ('pending','active','suspended')), revision INTEGER NOT NULL CHECK(revision>0), reason TEXT, updated_at TEXT NOT NULL) STRICT;
      CREATE TABLE local_applications (id INTEGER PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE COLLATE NOCASE, shop_name TEXT NOT NULL CHECK(length(shop_name) BETWEEN 2 AND 100), owner_name TEXT NOT NULL CHECK(length(owner_name) BETWEEN 2 AND 100), city_id INTEGER NOT NULL, community_id INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','approved','rejected','accepted')), revision INTEGER NOT NULL CHECK(revision>0), created_at TEXT NOT NULL, decision_at TEXT, decided_by INTEGER REFERENCES local_users(id), reason TEXT, shop_id INTEGER REFERENCES local_shops(id)) STRICT;
      CREATE INDEX local_application_state ON local_applications(state,id);
      CREATE TABLE local_invitations (id INTEGER PRIMARY KEY, application_id INTEGER NOT NULL REFERENCES local_applications(id), token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash)=64), expires_at TEXT NOT NULL, used_at TEXT, revoked_at TEXT, created_at TEXT NOT NULL, created_by INTEGER NOT NULL REFERENCES local_users(id)) STRICT;
      CREATE INDEX local_invitation_application ON local_invitations(application_id,id);
      CREATE TABLE local_listing_blocks (listing_id INTEGER PRIMARY KEY REFERENCES local_listings(id), active INTEGER NOT NULL CHECK(active IN (0,1)), revision INTEGER NOT NULL CHECK(revision>0), reason TEXT NOT NULL CHECK(length(reason) BETWEEN 5 AND 500), changed_by INTEGER NOT NULL REFERENCES local_users(id), changed_at TEXT NOT NULL) STRICT;
      CREATE TABLE local_operation_events (id INTEGER PRIMARY KEY, entity_type TEXT NOT NULL CHECK(entity_type IN ('application','shop','listing','access')), entity_id INTEGER NOT NULL, kind TEXT NOT NULL, actor_id INTEGER REFERENCES local_users(id), reason TEXT, at TEXT NOT NULL) STRICT;
      CREATE INDEX local_operation_entity ON local_operation_events(entity_type,entity_id,id);
      INSERT INTO local_shop_controls SELECT id,CASE WHEN approved=1 THEN 'active' ELSE 'pending' END,1,NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM local_shops;
      UPDATE local_meta SET value='2' WHERE key='schema_version';
    `);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
