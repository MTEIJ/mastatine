-- Plugins on activities. The plugins themselves are code in src/plugins (added through a PR); these tables only record
-- which plugin is switched on for which activity, with its settings, and give plugins a small store of their own.
--
-- public_token: unguessable address for the plugin's public (no login) page, /p/<token>. Committees can regenerate it.
CREATE TABLE IF NOT EXISTS activity_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  public_token TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_plugins_activity_idx ON activity_plugins (activity_id, position);

-- Key/value store per plugin instance. A plugin owns its collections; rows go away with the instance (or the activity).
-- created_by says who or what wrote the row ("link", "self", "committee:<user id>"), as an audit trail.
CREATE TABLE IF NOT EXISTS plugin_data (
  instance_id UUID NOT NULL REFERENCES activity_plugins(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (instance_id, collection, key)
);
CREATE INDEX IF NOT EXISTS plugin_data_created_idx ON plugin_data (instance_id, collection, created_at);
-- The scoreboard counts marks per player (value->>'player'); this keeps that cheap on a busy board.
CREATE INDEX IF NOT EXISTS plugin_data_tick_player_idx ON plugin_data (instance_id, (value->>'player')) WHERE collection = 'tick';
