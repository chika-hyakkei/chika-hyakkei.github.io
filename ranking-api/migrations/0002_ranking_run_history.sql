CREATE TABLE ranking_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  job TEXT NOT NULL,
  floor INTEGER NOT NULL,
  score INTEGER NOT NULL,
  kills INTEGER NOT NULL,
  bosses INTEGER NOT NULL,
  result TEXT NOT NULL,
  played_at TEXT NOT NULL,
  week_key TEXT NOT NULL
);

CREATE INDEX ranking_runs_week_score ON ranking_runs (week_key, score DESC, floor DESC, played_at ASC);
CREATE INDEX ranking_runs_all_score ON ranking_runs (score DESC, floor DESC, played_at ASC);

INSERT INTO ranking_runs (player_id, display_name, job, floor, score, kills, bosses, result, played_at, week_key)
SELECT player_id, display_name, 'warrior', week_floor, week_score, week_kills, week_bosses, week_result, week_played_at, week_key
FROM ranking_records;
