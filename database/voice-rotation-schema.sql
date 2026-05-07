-- T3-x — Voice rotation for weekly content agent.
--
-- Adds:
--   blog_topic_queue.voice_id   text — 'columnist' | 'storyteller' | 'auto'
--   agent_runs.voice_id         text — actual voice used per run (nullable)
--
-- 'auto' on a topic = the orchestrator picks the opposite of the most
-- recent agent_runs.voice_id, so the blog naturally alternates writers.
-- A specific value pins the topic to one voice (e.g. analytical posts
-- to 'storyteller', sensory/texture posts to 'columnist').
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, CHECK constraints guarded.

ALTER TABLE blog_topic_queue
  ADD COLUMN IF NOT EXISTS voice_id TEXT NOT NULL DEFAULT 'auto';

ALTER TABLE agent_runs
  ADD COLUMN IF NOT EXISTS voice_id TEXT;

-- CHECK constraints — applied after the columns exist. Drop+re-create so
-- re-running the script doesn't fail on the duplicate constraint name.
ALTER TABLE blog_topic_queue DROP CONSTRAINT IF EXISTS blog_topic_queue_voice_id_check;
ALTER TABLE blog_topic_queue
  ADD CONSTRAINT blog_topic_queue_voice_id_check
  CHECK (voice_id IN ('columnist', 'storyteller', 'auto'));

ALTER TABLE agent_runs DROP CONSTRAINT IF EXISTS agent_runs_voice_id_check;
ALTER TABLE agent_runs
  ADD CONSTRAINT agent_runs_voice_id_check
  CHECK (voice_id IS NULL OR voice_id IN ('columnist', 'storyteller'));

-- Index for the rotation lookup ("most recent agent_runs.voice_id where
-- status = 'success'"). Partial since we never query NULL voice_ids and
-- we only care about successful runs.
CREATE INDEX IF NOT EXISTS idx_agent_runs_voice_completed
  ON agent_runs (completed_at DESC)
  WHERE status = 'success' AND voice_id IS NOT NULL;
