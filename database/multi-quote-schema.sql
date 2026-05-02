-- Phase 4: link the 5 venue_leads rows produced by a single multi-quote
-- submission via a shared multi_quote_id. Owners can flag higher-priority
-- leads ("you're 1 of 5 — respond fast"), and analytics can distinguish
-- single-venue inquiries from multi-quote requests.

alter table venue_leads
  add column if not exists multi_quote_id uuid;

create index if not exists venue_leads_multi_quote_id_idx
  on venue_leads (multi_quote_id)
  where multi_quote_id is not null;
