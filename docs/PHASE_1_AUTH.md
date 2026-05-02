# Phase 1 — Auth Redesign

**Status:** Design proposal. No code changes yet. Awaiting confirmation before
implementation, because a screwup here can lock the user out.

---

## 1. Why we're rebuilding auth

The Phase 0 recon found two coexisting auth systems, both of which are broken
in different ways. The Supabase introspection done at the start of Phase 1
made it worse:

### 1a. The hardcoded localStorage system ([src/lib/auth.ts](../src/lib/auth.ts))

A 3-record `VENUE_OWNERS` array. `loginAsVenueOwner(email)` looks up the email
and sets `localStorage.isSuperAdmin = 'true'` plus a cookie
`venue-owner-auth=authenticated`. **No password is checked anywhere.**

The middleware ([src/middleware.ts](../src/middleware.ts)) gate is:

```ts
if (!venueOwnerAuth || venueOwnerAuth.value !== 'authenticated') {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

Anyone who runs `document.cookie = 'venue-owner-auth=authenticated; path=/'`
in DevTools is instantly logged in as super admin. This is not theoretical —
it's a one-line bypass.

### 1b. The Supabase RPC system ([src/lib/supabaseAuth.ts](../src/lib/supabaseAuth.ts))

Calls custom Postgres functions `register_user` / `authenticate_user`. **The
tables those functions read (`users`, `user_profiles`, `user_favorites`) do
not exist in the live database.** Confirmed via REST introspection:

```
HTTP 404 — Could not find the table 'public.users' in the schema cache
HTTP 404 — Could not find the table 'public.user_profiles' in the schema cache
HTTP 404 — Could not find the table 'public.user_favorites' in the schema cache
```

So the `/login` and `/register` pages call functions that fail silently or
404. The `database/users-schema.sql` file in the repo was never applied to
production. Live signup/login is broken.

### 1c. Why this matters now

- **Security**: anyone can self-promote to super admin and edit/delete any
  venue, claim any listing, see any data behind a `/manage` URL.
- **Onboarding blocked**: vendor signups can't actually create accounts. The
  Phase 3 paid-vendor dashboard depends on a working auth layer.
- **Lead capture half-broken**: `VenueContactForm` requires a sign-in to
  submit (line 76), but sign-in doesn't work, so the modal sends couples
  through a dead-end if they aren't already in `localStorage`.

---

## 2. Proposed architecture

**Use Supabase Auth (the built-in service), not the homegrown RPCs.** Supabase
ships email+password auth, email verification, password reset, magic links,
and JWT session management out of the box. We get to delete a lot of
half-finished code.

### 2a. High level

```
Browser ──(supabase-js: signInWithPassword)──> Supabase Auth ──> JWT cookie
                                                                     │
                                                                     ▼
                              middleware (Next.js Edge) ──validate──┘
                                          │
                                          ▼
                              RSC / Route Handler reads session
                                          │
                                          ▼
                              SELECT role FROM profiles WHERE id = session.user.id
```

### 2b. Database

One new table, queryable from SQL, RLS-protected:

```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'guest'
                  CHECK (role IN ('guest', 'venue_owner', 'vendor_owner', 'super_admin')),
  -- For couples (was the lead_qualification block in localStorage)
  phone         TEXT,
  wedding_date  DATE,
  guest_count   INTEGER,
  budget_min    INTEGER,
  budget_max    INTEGER,
  preferences   JSONB,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profiles row whenever someone signs up via Supabase Auth.
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

RLS:
- Anyone can `SELECT` their own profile (`auth.uid() = id`)
- Admins can `SELECT` any profile (`role = 'super_admin'` on caller's profile)
- Only admins can update `role`. Users can update their own `phone`, `full_name`,
  `wedding_date`, `guest_count`, `budget_*`, `preferences`.

The full migration file goes in `database/profiles-schema.sql`. We apply it
manually via the Supabase SQL editor before any client-side rollout.

The existing `users` / `user_profiles` / `user_favorites` schema files in
`database/` can stay — they describe a parallel system we're abandoning. We
won't apply them. (We can delete them in a follow-up but I won't touch them
in this phase to keep the diff focused.)

### 2c. Library layer

| File | What it becomes |
| ---- | --------------- |
| `src/lib/supabase.ts` | Stays. Exports the singleton browser client. |
| `src/lib/supabaseServer.ts` *(new)* | Server-side Supabase client built per-request from cookies via `@supabase/ssr` (`createServerClient`). |
| `src/lib/auth.ts` *(rewrite)* | Thin wrappers: `signIn`, `signUp`, `signOut`, `getCurrentUser`, `getCurrentRole`. **No more in-memory `VENUE_OWNERS` array. No more localStorage flags.** |
| `src/lib/supabaseAuth.ts` | **Delete.** Was unused in practice (RPCs missing). |
| `src/middleware.ts` | Rewrite to validate Supabase session via `@supabase/ssr` `createMiddlewareClient` and check role on `/admin/**` and `/**/manage`. |

### 2d. New dependency

```
@supabase/ssr@latest
```

Replaces `@supabase/auth-helpers-nextjs` (deprecated). One small package.

### 2e. UI layer

| Page | Change |
| ---- | ------ |
| `/login` | Replace whatever's there with a Supabase email+password form using `supabase.auth.signInWithPassword()`. Shows a "Forgot password" link and a "Sign up" link. |
| `/register` | Same form pattern with `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`. Profile auto-created via trigger. |
| `/forgot-password` *(new)* | Calls `supabase.auth.resetPasswordForEmail(email)`. |
| `/reset-password` *(new)* | The destination of the reset link. Calls `supabase.auth.updateUser({ password })`. |
| `Navigation.tsx` | Read role from a React context populated by a small `<AuthProvider>` that subscribes to `supabase.auth.onAuthStateChange`. Replaces the current `isSuperAdmin()` localStorage poll. |
| `VenueContactForm.tsx` | Read user from the same context. Remove the `localStorage.getItem('user')` path. |

---

## 3. Lockout protection (non-negotiable)

The user explicitly flagged this risk. Three layered safeguards:

### 3a. `SUPER_ADMIN_EMAILS` env var

```
SUPER_ADMIN_EMAILS=admin@floridaweddingwonders.com,bbonta@hialeahpark.com
```

Read by the middleware AND by `getCurrentRole()`. Any signed-in user whose
email matches a value in this comma-separated list is treated as super_admin
**regardless of what's in the profiles table**. Survives a corrupt profiles
row, a bad migration, or an accidental UPDATE that flips the role column.

### 3b. SQL bootstrap script

After the user signs up via the new flow, they run one SQL statement in the
Supabase SQL editor to mark themselves as super_admin in `profiles`:

```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'admin@floridaweddingwonders.com';
```

We ship this in `database/seed-super-admin.sql` with clear comments.

### 3c. Service-role console fallback

Documented in `docs/PHASE_1_AUTH.md` (this file): if both the env var and the
profiles row fail the user out, the rescue path is to run with the
`SUPABASE_SERVICE_ROLE_KEY` to manually update the profiles row or reset a
password. We do not ship an in-app "service role login" UI — that would be
the bypass we just removed.

### 3d. Middleware fail-open vs fail-closed

For `/admin/**` and `/**/manage` we **fail closed** — bad session → redirect
to /login. For everything else (homepage, listings, /faq, /contact, etc.) we
**don't run middleware at all** — public pages stay public if auth services
are degraded.

---

## 4. Migration plan

The live database has:
- 0 users in any users-like table (none of those tables exist)
- 8 rows in `email_subscribers` — listing-form signups, NOT auth users
- 0 venue_claims
- The 3 hardcoded "users" in `src/lib/auth.ts` who are not real Supabase users

So there is **no real user data to migrate**. The migration is a clean cut:

1. Apply `database/profiles-schema.sql` in Supabase SQL editor.
2. Set `SUPER_ADMIN_EMAILS=admin@floridaweddingwonders.com,bbonta@hialeahpark.com`
   in Vercel (and locally in `.env.local`). **(Need user to confirm the
   correct emails — see §6.)**
3. Deploy the new auth code.
4. User goes to `/register`, signs up with an admin email, verifies via the
   email Supabase sends.
5. User runs `seed-super-admin.sql` to set `profiles.role = 'super_admin'`.
6. User logs in. Confirms `/admin` works. Confirms editing/deleting a venue
   works.
7. (Out of scope for this design — happens in Phase 1 step 1) Migrate the
   per-user `localStorage.user` lead-qualification data into `profiles` for
   any couples who had saved-venue state.

The 8 `email_subscribers` rows are kept as-is — they're a separate "wants to
list with us" lead list, not auth users.

---

## 5. File-by-file change set

When the user approves this design, here is exactly what will be touched
in implementation. Each file lists current → after.

| File | Action | Lines (approx) |
| ---- | ------ | -------------- |
| `database/profiles-schema.sql` | **New** — table + trigger + RLS | ~80 |
| `database/seed-super-admin.sql` | **New** — bootstrap UPDATE | ~10 |
| `package.json` | Add `@supabase/ssr` | +1 |
| `src/lib/supabase.ts` | Browser client only (already correct) | unchanged |
| `src/lib/supabaseServer.ts` | **New** — `createServerClient` per-request | ~30 |
| `src/lib/auth.ts` | **Full rewrite** — wraps Supabase Auth, reads role from profiles + env safelist | ~120 |
| `src/lib/supabaseAuth.ts` | **Delete** | -345 |
| `src/middleware.ts` | **Rewrite** — `@supabase/ssr` middleware + role check | ~60 |
| `src/components/AuthProvider.tsx` | **New** — React context with onAuthStateChange | ~80 |
| `src/components/Navigation.tsx` | Read role from AuthProvider, drop localStorage poll | ~30 changed |
| `src/components/VenueContactForm.tsx` | Read user from AuthProvider | ~10 changed |
| `src/app/layout.tsx` | Wrap children in `<AuthProvider>` | +3 |
| `src/app/login/page.tsx` | New form using supabase.auth.signInWithPassword | full rewrite |
| `src/app/register/page.tsx` | New form using supabase.auth.signUp | full rewrite |
| `src/app/forgot-password/page.tsx` | **New** | ~80 |
| `src/app/reset-password/page.tsx` | **New** | ~80 |
| `src/app/admin/page.tsx` | Drop client-side `isSuperAdmin()` check; rely on middleware + server-side role guard | ~10 changed |
| `.env.example` | Add `SUPER_ADMIN_EMAILS` | +3 |

Estimated effort: **2 working days** of careful implementation + manual
verification, including the per-flow QA pass below.

---

## 6. Open questions for the user

These need answers before code changes start. Most are short.

1. **Which emails go in `SUPER_ADMIN_EMAILS`?**
   Today's hardcoded admin is `admin@floridaweddingwonders.com`. The first
   real-looking entry in `email_subscribers` is `bbonta@hialeahpark.com`. The
   git author of every commit is `manicmerlin`. Confirm:
   - Personal admin email for the user (whoever runs the site)?
   - Should we keep `admin@floridaweddingwonders.com` working?
   - Anyone else who needs admin access?

2. **Two existing hardcoded "venue owner" accounts** — `manager@curtissmansion.com`,
   `owner@hialeahpark.com`. These are demo data, not real users. Drop them
   and require those owners to claim properly via the (also being rebuilt)
   claim flow? Confirm.

3. **Email sender for password reset / verification.** Supabase Auth sends
   from a Supabase-managed default `noreply@mail.app.supabase.io` unless we
   wire up a custom SMTP provider (Resend works). Three options:
   a. Use the Supabase default for now (slightly lower deliverability)
   b. Wire Supabase to use the existing Resend account immediately
   c. Phase 1: Supabase default; Phase 2: switch to Resend
   I'd recommend (c) — fastest to ship, and we own the migration step.

4. **Email verification required on signup?** Supabase default = yes. If
   yes, users can't log in until they click the verification link. Most
   sites do this. Confirm.

5. **Role on signup**. Default is `guest`. Vendor/venue owners get upgraded
   when they claim or pay. Confirm this lifecycle is fine.

6. **Should `/admin` move to `/admin` route group with its own layout that
   does the role check on the server?** This is cleaner than a per-page
   `if (role !== super_admin) redirect` but adds a directory rename. I
   recommend yes — it removes a layer of client-side check.

7. **Magic-link login** in addition to password? Supabase supports both.
   Magic-link reduces password complaints but adds an email round-trip every
   login. Recommend password-only for now to keep the QA matrix small.

---

## 7. Rollback plan

If the auth deploy goes sideways:

1. **Revert the merge commit** of phase-1-fixes auth → master in GitHub. Vercel
   auto-redeploys the previous version within ~2 minutes.
2. The DB migrations (`profiles-schema.sql`) are **forward-compatible**: the
   table can sit unused without breaking anything. No DDL revert needed.
3. The env vars stay (no harm).
4. The deleted `supabaseAuth.ts` returns from git.

If the user gets locked out specifically:

1. **Service-role rescue** documented above (§3c) — open Supabase dashboard,
   run an UPDATE on `profiles`.
2. **Env var rescue** — adjust `SUPER_ADMIN_EMAILS` in Vercel, redeploy.
3. **Last resort** — rebase phase-1-fixes auth out of master and redeploy.

---

## 8. QA matrix (before merging to master)

Manual verification before this hits prod. The user runs through this; I
build a `docs/PHASE_1_AUTH_QA.md` checklist if approved.

- [ ] Sign up new account → verification email arrives → click link → logged in
- [ ] Sign in with valid creds → redirected to home, nav shows user state
- [ ] Sign in with invalid password → error shown, no session created
- [ ] Forgot password → email arrives → click link → set new password → log in
- [ ] Sign in with super_admin email → `/admin` accessible, badge visible
- [ ] Sign in with non-admin email → `/admin` redirects to `/login`
- [ ] Direct cookie manipulation (`document.cookie = '...'`) → blocked
- [ ] Sign out → session cleared, `/admin` no longer accessible
- [ ] localStorage flags from old system → ignored, no auth bypass
- [ ] Submit venue inquiry while signed in → works
- [ ] Submit venue inquiry while signed out → modal prompts sign-in
- [ ] Refresh page mid-session → still signed in
- [ ] Close browser, reopen → still signed in (within JWT TTL)
- [ ] JWT expires → refresh token rotates seamlessly
- [ ] DB migration `profiles-schema.sql` applied cleanly
- [ ] `SUPER_ADMIN_EMAILS` env var rescue works (manually unset profile.role,
      confirm middleware still grants admin via env var)

---

## 9. What this proposal explicitly does NOT do

To keep the scope tight:

- Does not migrate venues/vendors/dress-shops out of JSON. That's Phase 1
  step 1 of the recon plan, separate work.
- Does not implement Stripe-backed paid roles. Phase 3.
- Does not build the venue-owner dashboard. Phase 3.
- Does not implement OAuth providers (Google, Apple sign-in). Can add later
  in 30 minutes once the foundation is in place.
- Does not implement MFA. Optional add later — Supabase supports TOTP.
- Does not introduce session-revocation tooling beyond Supabase's built-ins.

---

**Next step:** user reviews §6 questions, confirms or adjusts, and I begin
implementation in a follow-up session.
