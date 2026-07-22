ALTER TABLE ranking_runs ADD COLUMN submission_id TEXT;
CREATE UNIQUE INDEX ranking_runs_submission_id ON ranking_runs (submission_id) WHERE submission_id IS NOT NULL;
