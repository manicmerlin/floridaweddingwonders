-- Phase 4: venue reviews. Anyone can submit (anonymous or signed-in).
-- Submissions start as 'pending' and are moderated from /admin/reviews —
-- only 'approved' rows are read publicly. The admin moderation queue is
-- gated by the super_admin role on profiles.

create table if not exists venue_reviews (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references venues(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete set null,
  reviewer_name text not null,
  reviewer_email text,
  rating        int  not null check (rating between 1 and 5),
  title         text,
  body          text not null check (length(body) between 10 and 4000),
  wedding_date  date,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references profiles(id)
);

create index if not exists venue_reviews_venue_status_idx
  on venue_reviews (venue_id, status);

create index if not exists venue_reviews_pending_idx
  on venue_reviews (status, submitted_at desc)
  where status = 'pending';

alter table venue_reviews enable row level security;

-- Public can read approved reviews
drop policy if exists "public read approved reviews" on venue_reviews;
create policy "public read approved reviews"
  on venue_reviews for select
  using (status = 'approved');

-- Anyone (anon + auth) can submit; the row must start in 'pending'
drop policy if exists "anyone can submit a review" on venue_reviews;
create policy "anyone can submit a review"
  on venue_reviews for insert
  with check (status = 'pending');

-- Reviewers can read their own pending/rejected entries
drop policy if exists "reviewers see their own" on venue_reviews;
create policy "reviewers see their own"
  on venue_reviews for select
  using (profile_id is not null and profile_id = auth.uid());

-- Super admin: full access for moderation
drop policy if exists "super admin full" on venue_reviews;
create policy "super admin full"
  on venue_reviews for all
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
