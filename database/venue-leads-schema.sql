-- Lead capture for venue inquiries.
--
-- Until Phase 3 introduces the full owner dashboard, every inquiry submitted
-- via /api/venue-leads is also written here so a lead is never lost — even if
-- Resend is misconfigured, even if the venue's contact email is auto-generated
-- and bounces, even if the venue hasn't claimed their listing yet.
--
-- Apply with the Supabase SQL editor or psql using the service role.

CREATE TABLE IF NOT EXISTS venue_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  venue_id          TEXT NOT NULL,
  venue_name        TEXT NOT NULL,
  venue_email       TEXT,
  venue_email_real  BOOLEAN NOT NULL DEFAULT TRUE,

  user_name         TEXT NOT NULL,
  user_email        TEXT NOT NULL,
  user_phone        TEXT,
  message           TEXT NOT NULL,

  -- Pre-qualification snapshot taken at submit time. Stored as JSONB so the
  -- shape can evolve without migrations.
  qualification     JSONB,

  -- 'sent'                 — venue email was real, Resend was attempted
  -- 'pending-real-email'   — venue email auto-generated; lead held for manual handling
  -- 'failed'               — Resend reported an error (best-effort flag)
  status            TEXT NOT NULL DEFAULT 'sent'
                       CHECK (status IN ('sent', 'pending-real-email', 'failed')),

  -- Audit trail for the email sends. Optional.
  resend_venue_id   TEXT,
  resend_user_id    TEXT,
  resend_error      TEXT,

  -- Set when the lead has been manually delivered to the venue.
  resolved_at       TIMESTAMP WITH TIME ZONE,
  resolved_by       TEXT,
  resolution_notes  TEXT,

  submitted_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venue_leads_venue_id  ON venue_leads(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_leads_status    ON venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_leads_created   ON venue_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_leads_user_email ON venue_leads(user_email);

ALTER TABLE venue_leads ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (the inquiry form is anonymous). Reads are gated until
-- the admin auth migration in Phase 1 step 9 lands.
CREATE POLICY "Allow public insert to venue_leads" ON venue_leads
  FOR INSERT WITH CHECK (true);

-- Reuses update_updated_at_column() from database/schema.sql.
CREATE TRIGGER update_venue_leads_updated_at
  BEFORE UPDATE ON venue_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
