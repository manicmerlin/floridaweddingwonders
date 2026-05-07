-- T3-x refinement — target_audience on blog_topic_queue.
--
-- Drives potential personalization (e.g. "More for grooms" related-posts
-- strip) and gives admins a quick visual on the topic queue without
-- having to read the voice_id column. Auto-derived from voice_id at
-- insert/update via a trigger so existing rows + future inserts stay
-- in sync without app-level coordination.

ALTER TABLE blog_topic_queue
  ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'either';

ALTER TABLE blog_topic_queue DROP CONSTRAINT IF EXISTS blog_topic_queue_target_audience_check;
ALTER TABLE blog_topic_queue
  ADD CONSTRAINT blog_topic_queue_target_audience_check
  CHECK (target_audience IN ('bride', 'groom', 'either'));

-- Backfill: voice_id='columnist' → 'bride', voice_id='storyteller' →
-- 'groom', voice_id='auto' → 'either'. Idempotent; matches the values
-- the trigger below will set going forward.
UPDATE blog_topic_queue SET target_audience =
  CASE voice_id
    WHEN 'columnist'   THEN 'bride'
    WHEN 'storyteller' THEN 'groom'
    ELSE 'either'
  END
WHERE TRUE;

-- Keep target_audience in lockstep with voice_id on every insert/update.
-- Function + trigger pattern (vs. a generated column) so the value is
-- writeable too — admins can override the default if a topic is, say,
-- written by Alma but explicitly groom-leaning.
CREATE OR REPLACE FUNCTION blog_topic_queue_sync_audience()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-set when the row is being created with the default OR
  -- the audience is being explicitly synced (NULL means "follow voice").
  IF NEW.target_audience IS NULL OR NEW.target_audience = 'either' THEN
    NEW.target_audience := CASE NEW.voice_id
      WHEN 'columnist'   THEN 'bride'
      WHEN 'storyteller' THEN 'groom'
      ELSE 'either'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_topic_queue_sync_audience_trg ON blog_topic_queue;
CREATE TRIGGER blog_topic_queue_sync_audience_trg
  BEFORE INSERT OR UPDATE OF voice_id ON blog_topic_queue
  FOR EACH ROW EXECUTE FUNCTION blog_topic_queue_sync_audience();
