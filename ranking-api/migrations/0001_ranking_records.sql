CREATE TABLE IF NOT EXISTS ranking_records (
  player_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  all_floor INTEGER NOT NULL,
  all_score INTEGER NOT NULL,
  all_kills INTEGER NOT NULL,
  all_bosses INTEGER NOT NULL,
  all_result TEXT NOT NULL,
  all_played_at TEXT NOT NULL,
  week_key TEXT NOT NULL,
  week_floor INTEGER NOT NULL,
  week_score INTEGER NOT NULL,
  week_kills INTEGER NOT NULL,
  week_bosses INTEGER NOT NULL,
  week_result TEXT NOT NULL,
  week_played_at TEXT NOT NULL,
  last_submit_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS ranking_all_time ON ranking_records (all_score DESC, all_floor DESC, all_played_at ASC);
CREATE INDEX IF NOT EXISTS ranking_this_week ON ranking_records (week_key, week_score DESC, week_floor DESC, week_played_at ASC);
