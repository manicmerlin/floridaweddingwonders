# Phase 1 Auth — Deployment Runbook

This is the exact sequence to roll out the new auth system without locking
yourself out. Do the steps in order. Do **not** skip the "verify" steps.

**Total time budget:** ~30 minutes once you have the credentials in front of
you.

---

## Pre-flight — what you need open

- Supabase dashboard for the project (`aflrmpkolumpjhpaxblz`).
- Vercel dashboard for the project.
- Your inbox for `bennettbonta@gmail.com` (you'll receive verification + reset
  emails here during testing).
- This branch on GitHub: [phase-1-fixes](https://github.com/manicmerlin/floridaweddingwonders/tree/phase-1-fixes).

**Do not merge the PR until step 5.** Apply the database migration and the
env vars first; the code on master without the migration would still work
(server gracefully falls back to "guest" when profiles is missing) but
cleaner if DB is ready before code goes live.

---

## Step 1 — Apply the database migration

The migration is **idempotent**. Re-running is safe and produces no error.

1. Open Supabase dashboard → SQL Editor → "New query".
2. Open [database/auth-bootstrap.sql](../database/auth-bootstrap.sql) in the
   repo and paste the entire file into the editor.
3. Click **Run**.
4. Expected result: `Success. No rows returned.`

### Verify the migration

Paste these queries one at a time and confirm:

```sql
-- (a) profiles table exists and is empty (or has rows from a re-run)
SELECT count(*) FROM profiles;
-- expect: 0 (or, if you re-ran after sign-ups: matches auth.users count)

-- (b) the trigger on auth.users is wired
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;
-- expect: a row with tgname = 'on_auth_user_created'

-- (c) RLS is on, policies are present
SELECT polname FROM pg_policy WHERE polrelid = 'profiles'::regclass;
-- expect: profiles_select_own, profiles_select_admin, profiles_update_own,
--         profiles_update_admin, profiles_insert_own
```

If any check fails, STOP. Re-run the migration. Don't proceed.

---

## Step 2 — Set environment variables in Vercel

Vercel dashboard → Project → Settings → Environment Variables. Add to
**Production, Preview, AND Development** scopes for each variable below.

| Name | Value | Notes |
| --- | --- | --- |
| `SUPER_ADMIN_EMAILS` | `bennettbonta@gmail.com` | Server-side role rescue safelist. |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | `bennettbonta@gmail.com` | Client mirror so the nav badge resolves without a DB round-trip. **Same value.** |
| `LEAD_FALLBACK_EMAIL` | `hello@floridaweddingwonders.com` | (already documented in Phase 1 step 3) |

**Do NOT set `LEGACY_AUTH_BYPASS` or `NEXT_PUBLIC_LEGACY_AUTH_BYPASS`.**
Those are emergency-only flags. Default behavior is correct.

`SUPABASE_SERVICE_ROLE_KEY` is referenced by `createSupabaseAdminClient()`
but no production code calls it yet. Adding it is safe but optional in
Phase 1.

### Verify the env vars

After saving:
- Vercel will offer to "Redeploy" — **don't yet**, you haven't merged the
  code.
- Sanity-check the values are spelled right. Typos here are the #1 way to
  lock yourself out.

---

## Step 3 — Configure Supabase Auth settings

Supabase dashboard → Authentication → URL Configuration.

| Setting | Value |
| --- | --- |
| Site URL | `https://floridaweddingwonders.com` |
| Redirect URLs | `https://floridaweddingwonders.com/login`<br>`https://floridaweddingwonders.com/reset-password`<br>`http://localhost:3000/login`<br>`http://localhost:3000/reset-password` |

Authentication → Providers → Email:
- **Enable Email** ✓
- **Confirm email** ✓ (verification required — matches the design)
- **Secure email change** ✓ (recommended)

Authentication → Email Templates: leave defaults for Phase 1. Phase 2 will
swap the SMTP provider to Resend with branded templates.

---

## Step 4 — Pre-merge sanity check

Local machine:

```bash
git fetch origin
git checkout phase-1-fixes
git pull origin phase-1-fixes
npm install      # installs the new @supabase/ssr dep
npm run build    # smoke test
```

If `npm run build` succeeds, you're good. If it fails on a TypeScript or
import error, surface to me — I should fix before you merge.

**Note:** `next.config.js` has `typescript.ignoreBuildErrors: true` and
`eslint.ignoreDuringBuilds: true`. The build will pass even with type
errors. Re-enabling those checks is queued for Phase 2.

---

## Step 5 — Merge phase-1-fixes → master

Open the PR on GitHub:
https://github.com/manicmerlin/floridaweddingwonders/pull/new/phase-1-fixes

Review the diff, then **Squash and merge** (or merge — your call). Vercel
auto-deploys master within 2-3 minutes.

### Verify the deploy

- Vercel dashboard → Deployments → confirm the latest one says "Ready".
- Check the deployment URL works (`https://floridaweddingwonders.com`).
- Open DevTools → Network. Visit `/admin` while signed out. Confirm:
  - You're redirected to `/login?next=/admin`. ✓
  - The redirect happens via 307/308 from middleware, not a JS redirect.

If `/admin` renders without redirecting, **STOP**. Likely the env vars
didn't reach the runtime. Check Vercel env var scopes (Production checked?)
and trigger a redeploy.

---

## Step 6 — First sign-up (the moment of truth)

This is the path that promotes you to super_admin via the env-var safelist
without any manual SQL.

1. Visit `https://floridaweddingwonders.com/register`.
2. Enter:
   - Full Name: your name
   - Email: `bennettbonta@gmail.com`
   - Password: any 8+ char password you'll remember
3. Submit. You should see "Check your email" screen.
4. Open `bennettbonta@gmail.com` inbox. Click the verification link from
   `noreply@mail.app.supabase.io` (sender address; will swap to a branded
   one in Phase 2).
5. Visit `/login`. Sign in with the same email + password.
6. Look at the navigation bar. You should see **🔑 SUPER ADMIN** badge next
   to the logo.
7. Click `Admin` in the nav (or visit `/admin` directly). You should see
   the admin dashboard with no "Access Denied" state.

If steps 6.6 / 6.7 work — **the auth migration is successful**. The role
came from the `SUPER_ADMIN_EMAILS` safelist; no DB write was required.

### Verify the profile row was auto-created

Supabase SQL editor:

```sql
SELECT id, email, role, created_at FROM profiles
WHERE email = 'bennettbonta@gmail.com';
-- expect: 1 row, role = 'guest' (the safelist overrides this client-side
--         and server-side; the DB row stays at default until/unless you
--         explicitly UPDATE it)
```

The row's `role` will be `guest`. **That's correct.** The SUPER_ADMIN_EMAILS
env var promotes you regardless. If you want belt-and-braces, run:

```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'bennettbonta@gmail.com';
```

This makes you super_admin even if you ever remove yourself from
`SUPER_ADMIN_EMAILS`.

---

## Step 7 — Verify the admin pages still work end-to-end

While signed in as `bennettbonta@gmail.com`:

- [ ] `/admin` → loads the dashboard
- [ ] `/admin/claims` → loads (empty, no claims today)
- [ ] `/admin/indexnow` → loads
- [ ] `/venue-owner/dashboard` → loads (you're super_admin so you can see
      every venue)
- [ ] Sign out from the nav → nav switches to "Login / Sign Up", `/admin`
      now redirects to `/login`.
- [ ] Sign back in → admin access restored.

---

## Step 8 — Verify the legacy bypass is OFF

In a fresh browser (or incognito window), open DevTools console and run:

```js
document.cookie = 'venue-owner-auth=authenticated; path=/';
localStorage.setItem('isSuperAdmin', 'true');
localStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('userEmail', 'attacker@example.com');
location.href = '/admin';
```

Expected: redirected to `/login`. The old DevTools-bypass is dead.

---

## Step 9 — Test password reset

1. Sign out.
2. `/login` → "Forgot your password?" → enter
   `bennettbonta@gmail.com` → submit.
3. Check inbox. Click the reset link.
4. Enter new password (8+ chars).
5. Submit. Should redirect to `/login`.
6. Sign in with the new password. Should work.

---

## Step 10 — Drop the demo accounts (data hygiene)

The hardcoded `manager@curtissmansion.com` and `owner@hialeahpark.com`
records lived in the deleted `src/lib/auth.ts` array — they're already gone
from code. The `email_subscribers` table still has the test rows you
flagged. Clean up with:

```sql
DELETE FROM email_subscribers
WHERE email IN (
  'bbonta@hialeahpark.com',
  'test.user@example.com',
  'venue.owner@example.com',
  'test@example.com',
  'venue@example.com'
);

-- spot-check what's left
SELECT email, venue_name, is_venue_owner, created_at
FROM email_subscribers ORDER BY created_at;
```

The remaining rows (`jovi@carlosjovi.com`, `victor.jacobi0@wls1.com`,
`brandonfarmer75@outlook.com`) look like they could be real venue-owner
listing leads — keep them.

---

## Rollback plan

If anything in steps 5-10 goes wrong:

### Soft rollback (keep DB, revert code)

```bash
git revert <merge-commit-sha>
git push origin master
```

Vercel auto-redeploys the previous version in ~2 minutes. The profiles
table stays — it's harmless when unused. Re-merging later picks up where
you left off.

### Hard rollback / lockout rescue

If you can't sign in AND the safelist isn't working:

1. **Check the env var spelling** in Vercel. `SUPER_ADMIN_EMAILS=bennettbonta@gmail.com`
   (no spaces, no quotes, exact case-insensitive match on the email).
2. **Set both copies**: `SUPER_ADMIN_EMAILS` AND `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`.
   The middleware uses the first; the client UI uses the second. Without
   the public mirror you can sign in but the nav won't show the admin
   badge.
3. **Force-promote yourself in SQL**, using the Supabase SQL editor (which
   runs as service role and bypasses RLS):
   ```sql
   UPDATE profiles SET role = 'super_admin'
   WHERE email = 'bennettbonta@gmail.com';
   ```
4. **Last resort: legacy bypass**. In Vercel, set:
   ```
   LEGACY_AUTH_BYPASS=true
   NEXT_PUBLIC_LEGACY_AUTH_BYPASS=true
   ```
   Redeploy. Then in your browser DevTools console run:
   ```js
   document.cookie = 'venue-owner-auth=authenticated; path=/; max-age=86400';
   localStorage.setItem('isSuperAdmin', 'true');
   localStorage.setItem('isAuthenticated', 'true');
   localStorage.setItem('userEmail', 'admin@floridaweddingwonders.com');
   ```
   `/admin` should now load. Once you've fixed the underlying issue, UNSET
   the bypass env vars and redeploy.

---

## Step 11 — When you're confident, lock the bypass out

This step should happen **at least 24 hours after step 6 succeeds**, after
you've slept on it and tested across devices.

1. Confirm `LEGACY_AUTH_BYPASS` is unset in all Vercel env scopes
   (Production / Preview / Development). It is by default — just verify.
2. (Future PR — not in Phase 1) The legacy bypass code in `middleware.ts`,
   `admin/layout.tsx`, and `auth.ts` will be removed entirely. We'll do
   that after the auth flow has been live and stable for ~1 week.

---

## Known follow-ups (NOT blockers for Phase 1)

These are intentional gaps, queued for later phases:

1. **Email templates are Supabase defaults** (`noreply@mail.app.supabase.io`).
   Phase 2: wire Supabase Auth to send via Resend with branded templates.
2. **Lead qualification still in localStorage**. Phase 2: migrate
   `wedding_date / guest_count / budget_*` into the `profiles` columns we
   already added in the migration.
3. **Saved venues / favorites still in localStorage**. Phase 3 along with
   the venue-owner dashboard.
4. **No OAuth providers** (Google sign-in etc.). Easy to add to Supabase
   Auth in 30 minutes once Phase 1 is stable.
5. **Demo `bbonta@hialeahpark.com` row removal** — manual SQL in step 10.
6. **`database/users-schema.sql`, `users-schema.sql`, `auth-schema.sql`,
   `venue-analytics-schema.sql`, `audit-schema.sql`** in the repo describe
   a parallel system we abandoned. Safe to delete in a follow-up; left in
   place for this PR to keep the diff focused.

---

## Verification matrix (post-deploy QA)

Tick these off after step 7:

- [ ] Sign up new account at `/register` → verification email arrives
- [ ] Click link → land on `/login`
- [ ] Sign in with new account → `/admin` blocked (not super_admin)
- [ ] Sign in with `bennettbonta@gmail.com` → `/admin` accessible
- [ ] Forgot password → email arrives → reset → log in with new password
- [ ] Direct cookie/localStorage manipulation does NOT grant admin
- [ ] Sign out → admin no longer accessible
- [ ] JWT expires (`Settings → JWT expiry`, default 1h) → refresh seamless
- [ ] Verify `profiles` table has 1+ rows after signups
- [ ] `LEGACY_AUTH_BYPASS` is unset

When all 9 are checked, Phase 1 is done. Ping me to start Phase 2 (slug
URLs, JSON-LD, image optimization, RSC migration of catalog reads, mobile
audit).
