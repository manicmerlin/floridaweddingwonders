-- Phase 7A: Weekly content agent infrastructure.
--
-- Three tables:
--   1. agent_runs — generic audit log for ALL future agents (idempotent
--      by (agent_name, started_at::date) via unique partial index)
--   2. blog_topic_queue — curated/AI-generated topic ideas
--   3. pending_posts — drafted MDX awaiting human review
--
-- All three are super-admin-only via RLS. Applied to live Supabase
-- before this PR was built. Saved here for audit and reproducibility.

-- =====================================================================
-- 1. agent_runs — generic audit log
-- =====================================================================

create table if not exists agent_runs (
  id           uuid primary key default gen_random_uuid(),
  agent_name   text not null,
  run_date     date not null default (now() at time zone 'utc')::date,
  status       text not null default 'started'
                  check (status in ('started', 'success', 'partial', 'failed')),
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms  int generated always as (
                  case when completed_at is null then null
                  else extract(epoch from (completed_at - started_at)) * 1000 end
                ) stored,

  -- AI-specific fields (nullable so non-AI agents can write rows too)
  model        text,
  tokens_in    int,
  tokens_out   int,
  cost_cents   int,

  -- Generic agent output (post_id, topic_id, recipient_count, etc.)
  output       jsonb,
  error        text,
  metadata     jsonb,

  created_at   timestamptz not null default now()
);

-- Idempotency guard: one successful run per agent per day. If Vercel
-- retries the cron, the second insert fails clean and the endpoint
-- returns 200 with status='already-ran'. Failed runs excluded so retries
-- after a failure can succeed.
create unique index if not exists agent_runs_agent_date_uidx
  on agent_runs (agent_name, run_date)
  where status in ('started', 'success', 'partial');

create index if not exists agent_runs_agent_started_idx
  on agent_runs (agent_name, started_at desc);

alter table agent_runs enable row level security;
drop policy if exists "super admin full agent_runs" on agent_runs;
create policy "super admin full agent_runs"
  on agent_runs for all
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.role = 'super_admin')
  );

-- =====================================================================
-- 2. blog_topic_queue
-- =====================================================================

create table if not exists blog_topic_queue (
  id            uuid primary key default gen_random_uuid(),
  topic         text not null,
  working_title text,
  description   text,
  priority      int not null default 5
                check (priority between 1 and 10),
  season        text,                              -- 'any', 'spring', 'summer', 'fall', 'winter'
  tags          text[],
  source        text not null default 'human'
                check (source in ('human', 'agent', 'imported')),
  status        text not null default 'pending'
                check (status in ('pending', 'in_use', 'used', 'skipped')),
  used_at       timestamptz,
  used_by_run   uuid references agent_runs(id),
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists blog_topic_queue_pickable_idx
  on blog_topic_queue (priority desc, created_at asc)
  where status = 'pending';

alter table blog_topic_queue enable row level security;
drop policy if exists "super admin full blog_topic_queue" on blog_topic_queue;
create policy "super admin full blog_topic_queue"
  on blog_topic_queue for all
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.role = 'super_admin')
  );

-- 8 hand-curated seed topics — none overlap the existing 10 published
-- posts. Lets the first cron run be just (draft + metadata) = 2 Claude
-- calls instead of (topic-gen + draft + metadata) = 3.
insert into blog_topic_queue (topic, working_title, description, priority, season, tags, source)
values
  ('Florida wedding color palettes by season',
   'Florida Wedding Color Palettes: What Works in Each Season',
   'Real Florida-light-aware color guidance — not generic Pinterest boards. Season-by-season with photo examples.',
   8, 'any', array['design', 'aesthetic'], 'human'),
  ('Wedding favors that survive Florida heat',
   'Wedding Favors That Survive Florida Heat (and Don''t End Up in the Trash)',
   'Practical guide — what to give guests, what to avoid (chocolate, candles, fresh flowers), what feels personal.',
   7, 'summer', array['favors', 'guests'], 'human'),
  ('How to plan a Florida destination wedding weekend',
   'How to Plan a 3-Day Florida Destination Wedding Weekend',
   'Welcome dinner Thursday, ceremony Saturday, brunch Sunday. Logistics, vendor coordination, guest experience.',
   8, 'any', array['destination', 'logistics'], 'human'),
  ('Outdoor Florida wedding lighting guide',
   'Outdoor Florida Wedding Lighting: Bistro Strings to Full Chandeliers',
   'Florida humidity + outdoor power realities. Cost ranges, vendor recommendations, dance-floor lighting math.',
   6, 'any', array['design', 'vendors'], 'human'),
  ('Florida wedding welcome bags for out-of-state guests',
   'Florida Wedding Welcome Bags: What to Include for Out-of-State Guests',
   'Specific to Florida — sunscreen, water, local snack picks by region, printed map with restaurant recs.',
   7, 'any', array['guests', 'travel'], 'human'),
  ('Mother of the bride style guide for Florida heat',
   'Mother of the Bride Style for a Florida Wedding: What Actually Works',
   'Honest dress + accessory guidance for the heat. Fabric, color, sleeve length, comfort vs. tradition tradeoffs.',
   5, 'any', array['attire', 'guests'], 'human'),
  ('Florida wedding music: bands vs DJs by region',
   'Florida Wedding Music: Bands vs DJs by Region (and What Each Costs)',
   'Live-band scene varies dramatically — Miami vs Naples vs Keys. Pricing bands, when each makes sense.',
   6, 'any', array['music', 'vendors'], 'human'),
  ('Wedding invitation etiquette for Florida couples',
   'Wedding Invitation Etiquette: Florida-Specific Considerations',
   'Snowbird addresses, destination weddings, RSVP cards by region, when to send for in-state vs out-of-state.',
   5, 'any', array['guests', 'invitations'], 'human');

-- =====================================================================
-- 3. pending_posts
-- =====================================================================

create table if not exists pending_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  description     text,
  category        text,
  body_mdx        text not null,
  frontmatter     jsonb,
  status          text not null default 'pending'
                  check (status in ('pending', 'edited', 'approved', 'rejected', 'published')),

  topic_id        uuid references blog_topic_queue(id) on delete set null,
  agent_run_id    uuid references agent_runs(id) on delete set null,

  generated_at    timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references profiles(id),
  published_at    timestamptz,
  github_commit_sha text,

  rejection_reason text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pending_posts_status_idx
  on pending_posts (status, generated_at desc);

create index if not exists pending_posts_agent_run_idx
  on pending_posts (agent_run_id);

alter table pending_posts enable row level security;
drop policy if exists "super admin full pending_posts" on pending_posts;
create policy "super admin full pending_posts"
  on pending_posts for all
  using (
    exists (select 1 from profiles p
            where p.id = auth.uid() and p.role = 'super_admin')
  );

-- updated_at triggers for the two tables that get edits
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_blog_topic_queue_updated_at on blog_topic_queue;
create trigger set_blog_topic_queue_updated_at
  before update on blog_topic_queue
  for each row execute function set_updated_at();

drop trigger if exists set_pending_posts_updated_at on pending_posts;
create trigger set_pending_posts_updated_at
  before update on pending_posts
  for each row execute function set_updated_at();

-- Verification (run after applying):
--   select count(*) from blog_topic_queue where status = 'pending';
--     -> should return 8 (seed topics)
--   select count(*) from pending_posts;     -> 0
--   select count(*) from agent_runs;        -> 0
--   select relname, relrowsecurity from pg_class
--     where relname in ('agent_runs', 'blog_topic_queue', 'pending_posts');
--     -> all three should show relrowsecurity = true
