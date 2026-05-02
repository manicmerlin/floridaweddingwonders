# Phase 0 Recon — floridaweddingwonders.com

Read-only audit of the source tree. No code changes. All claims are grounded in
file paths and line numbers from the worktree. Live-site behavior may diverge
from `master` if a deploy is stale.

---

## 1. Stack

**One-liner:** Next.js 14.2.5 (App Router) + TypeScript 5 + Tailwind 3.4 +
Supabase (Postgres) + Resend, deployed to Vercel.

| Layer            | Tech                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| Framework        | `next@14.2.5` App Router                                                              |
| Language         | TypeScript 5, React 18                                                                |
| Styling          | Tailwind 3.4, PostCSS, autoprefixer                                                   |
| DB / Auth        | `@supabase/supabase-js@2.57.4` (Postgres on `aflrmpkolumpjhpaxblz.supabase.co`)       |
| Email            | `resend@6.0.3`                                                                        |
| Hash / Misc      | `bcryptjs@3.0.2` (declared but used through Supabase RPC `crypt`), `zod@4.1.12`       |
| Charts           | `chart.js@4.5.1` + `react-chartjs-2@5.3.0` (admin analytics only)                     |
| Markdown         | `gray-matter@4.0.3`, `remark@15`, `remark-html@16` (blog)                             |
| Hosting          | Vercel ([vercel.json](../vercel.json), region `iad1`, master branch auto-deploys)     |
| CI               | None beyond Vercel git integration. `.github/` only contains `copilot-instructions.md`. No GitHub Actions workflows. |
| Build escape hatches | [next.config.js:48](../next.config.js#L48) sets `eslint.ignoreDuringBuilds: true` AND `typescript.ignoreBuildErrors: true` — masks issues |

Package: [package.json](../package.json)

Deployment script: [deploy.sh](../deploy.sh) — manual `vercel --prod` after
`git checkout staging|master`. Staging vs prod is branch-based.

---

## 2. Data Layer

**One-liner:** Public site reads from a 129-entry JSON file bundled into the
client; Supabase Postgres exists alongside but is only used for auth, photo
uploads, claims, leads, and analytics. The two stores are not synchronized.

### 2a. Primary venue/vendor/dress-shop data — JSON files in repo

| Entity      | File                                           | Count | Schema |
| ----------- | ---------------------------------------------- | ----- | ------ |
| Venues      | [src/data/venues.json](../src/data/venues.json) | **129** (audit said 128 — likely off-by-one or one is filtered out at runtime) | Free-text fields (see below) |
| Vendors     | [src/data/vendors.json](../src/data/vendors.json) | **30** | Has `id`, `name`, `description`, `category`, `address`, `contact`. **No `images` field on any vendor** — confirms the emoji placeholder bug. |
| Dress shops | [src/data/dressShops.json](../src/data/dressShops.json) | **31** (top key `weddingDressShops`) | Structured: `id`, `name`, `address{street,city,state,zip,coords}`, `priceRange{min,max}`, `images:[]` (empty), `contact`, `owner`, `hours`, etc. |

**Loaded synchronously at module import time** in [src/lib/mockData.ts:5-10](../src/lib/mockData.ts#L5):

```ts
const venuesJson = require('../data/venues.json');
const venues = venuesJson.weddingVenues || [];
```

Because `mockData.ts` is imported by client components (e.g. the venue list
page, venue detail page, sitemap), the **entire 120 KB venue dataset ships in
the JS bundle to every visitor**.

### 2b. venues.json shape (load-bearing for migration)

Each entry, e.g. [src/data/venues.json:3-27](../src/data/venues.json#L3):

```json
{
  "name": "Ancient Spanish Monastery",
  "location": "North Miami Beach, Miami-Dade",     // free text "City, County"
  "region": "Miami-Dade & Broward",
  "capacity": "Up to 150 in the chapel/cloisters; …", // FREE TEXT, parsed by regex
  "sizeCategory": "Mid-Size (75-199), Large (200+)",
  "style": "12th-century Spanish stone monastery…",   // becomes description
  "tags": ["historic","garden","chapel","unique","castle"],
  "pricing": "Base rental from $2,000…",              // FREE TEXT, parsed by regex
  "servicesAmenities": ["Main Chapel rental…"],
  "ceremonyAndReception": true,
  "website": "https://…",
  "gallery": "https://www.theknot.com/marketplace/…",
  "lastImageUpdate": "2025-09-30T00:33:27.728Z"
}
```

Fields **missing entirely** vs the live site UI:
- `id` — synthesized at runtime as the array index + 1 in [src/lib/mockData.ts:188](../src/lib/mockData.ts#L188). **This means venue URLs (`/venues/47`) will silently change if the JSON is reordered.**
- Structured address (street, zipCode, lat/lng) — [src/lib/mockData.ts:191-198](../src/lib/mockData.ts#L191) defaults zipCode to `33101` and street to `''`.
- `phone` — looked up from a hardcoded dictionary in [src/lib/mockData.ts:93-149](../src/lib/mockData.ts#L93) for ~50 known venues; for everyone else a **random fake number** is generated at render time ([src/lib/mockData.ts:158-162](../src/lib/mockData.ts#L158)).
- `contact.email` — synthesized as `info@<slugified-name>.com` ([src/lib/mockData.ts:210](../src/lib/mockData.ts#L210)). **None of these emails resolve to a real inbox.**
- `images` — most entries have empty `images: []`. Photo URLs live in `public/images/venues/` and are matched up by name pattern at runtime via [src/lib/venueImages.ts](../src/lib/venueImages.ts) and `localStorage`.

### 2c. Supabase schema (exists, mostly unused for venue data)

| Table                       | Source                                                                           |
| --------------------------- | -------------------------------------------------------------------------------- |
| `venues`                    | [database/schema.sql:2](../database/schema.sql#L2) — UUID id, structured address, capacity_min/max INTEGER. **Schema exists, but the live site does not read from it.** |
| `venue_claims`              | [database/schema.sql:30](../database/schema.sql#L30)                             |
| `email_subscribers`         | [database/schema.sql:43](../database/schema.sql#L43) — used by send-email API   |
| `venue_owners`              | [database/auth-schema.sql:4](../database/auth-schema.sql#L4)                     |
| `venue_ownerships`          | [database/auth-schema.sql:19](../database/auth-schema.sql#L19)                   |
| `admin_users`               | [database/auth-schema.sql:29](../database/auth-schema.sql#L29)                   |
| `password_reset_tokens`     | [database/auth-schema.sql:49](../database/auth-schema.sql#L49)                   |
| `email_verification_tokens` | [database/auth-schema.sql:60](../database/auth-schema.sql#L60)                   |
| `audit_logs`                | [database/auth-schema.sql:71](../database/auth-schema.sql#L71)                   |
| `users` + `user_profiles` + `user_favorites` | Referenced by [src/lib/supabaseAuth.ts](../src/lib/supabaseAuth.ts) — schema in [database/users-schema.sql](../database/users-schema.sql) |
| `venue_photos`              | [database/venue-photos-schema.sql](../database/venue-photos-schema.sql)          |
| `venue_analytics`           | [database/venue-analytics-schema.sql](../database/venue-analytics-schema.sql)    |

There's also `database/deleted-venues-schema.sql` — **0 bytes, empty file**. Soft-deletes happen only in `localStorage` ([src/app/venues/[id]/page.tsx:23-28](../src/app/venues/%5Bid%5D/page.tsx#L23)) which means a deletion on one device is invisible on every other device.

### 2d. localStorage used as primary state store

This is the most fragile part of the data layer. The following user-visible
state lives in `localStorage`, not in Postgres:

| Key                          | Used for                                        |
| ---------------------------- | ----------------------------------------------- |
| `deleted-venues`             | Soft-deletes — **device-local only**            |
| `venue-photos`               | Per-venue uploaded photos                       |
| `venues-data`                | Mutation cache for venue records                |
| `venue-photo-updates`        | Photo-upload audit trail                        |
| `user`                       | Current guest user (incl. lead-qualification)   |
| `isAuthenticated`, `isSuperAdmin`, `userEmail` | Hardcoded-auth session flags |
| `returnUrl`                  | Redirect-after-login                            |

### 2e. Migration risk

The 129 venues in JSON contain **non-recoverable data** if lost: `style`
(descriptions), `tags`, `servicesAmenities`, free-text `pricing` and
`capacity` strings, plus the curated photo dictionary. The Supabase `venues`
table is empty (or at least, the live site doesn't read from it) — there is
**no canonical DB copy**. Any rebuild that drops the JSON without first
parsing/migrating it will lose ~12 months of curation work.

There are 5 backup snapshots in [src/data/](../src/data/) (`venues-backup*.json`,
~180KB each — ~900KB of dead bytes in the bundle directory but safe from a
data-loss standpoint).

---

## 3. Routing

**App Router**, all routes under [src/app/](../src/app). Full inventory:

### Public pages

| Route                           | File                                                              | Notes |
| ------------------------------- | ----------------------------------------------------------------- | ----- |
| `/`                             | [src/app/page.tsx](../src/app/page.tsx)                           | Client component. Inline footer (not the shared `Footer.tsx`). Stats hardcoded `130+/50+/31+/5★` at [src/app/page.tsx:88-105](../src/app/page.tsx#L88). Phone `(555) 123-4567` placeholder at [src/app/page.tsx:194](../src/app/page.tsx#L194). |
| `/venues`                       | [src/app/venues/page.tsx](../src/app/venues/page.tsx)             | List page |
| `/venues/[id]`                  | [src/app/venues/[id]/page.tsx](../src/app/venues/%5Bid%5D/page.tsx) | Detail page; `id` is a stringified array index |
| `/venues/[id]/claim`            | + `/claim/success`                                                |       |
| `/venues/[id]/manage`           | Auth-gated by middleware                                          |       |
| `/vendors`                      | [src/app/vendors/page.tsx](../src/app/vendors/page.tsx)           | Uses raw `<img>`, not `next/image` ([line 230](../src/app/vendors/page.tsx#L230)) |
| `/vendors/[id]`                 |                                                                   |       |
| `/dress-shops`                  | + `/dress-shops/[id]`, `/[id]/claim`, `/[id]/manage`              |       |
| `/blog`                         | + `/blog/[slug]` (markdown via gray-matter)                       |       |
| `/about`                        | RSC (no `'use client'`)                                           |       |
| `/contact`                      |                                                                   |       |
| `/faq`                          |                                                                   |       |
| `/favorites`                    | "View Saved" route                                                |       |
| `/login`, `/register`           |                                                                   |       |
| `/guest`, `/guest/complete-profile`, `/guest/dashboard`, `/guest/saved-venues` | Logged-in guest flow                              |       |
| `/venue-packages`               | Pricing page (Stripe TODO — see §8)                               |       |

### Auth-gated

| Route                       | Notes                                          |
| --------------------------- | ---------------------------------------------- |
| `/admin`                    | [src/app/admin/page.tsx](../src/app/admin/page.tsx) — gated by both middleware cookie AND client-side `isSuperAdmin()` |
| `/admin/claims`             |                                                |
| `/admin/indexnow`           | IndexNow / Bing-ping UI                        |
| `/venue-owner/dashboard`    | **Note: `/venue-owner` itself has no `page.tsx`** — only the `/dashboard` subroute. See §3a. |
| `/vendor-owner`             | Has page.tsx                                   |

### API routes

| Route                                  | Method | Purpose                                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| `/api/venue-leads`                     | POST   | Inquiry capture → Resend dual email ([src/app/api/venue-leads/route.ts](../src/app/api/venue-leads/route.ts)) |
| `/api/send-email`                      | POST   | Email subscriber capture (Supabase + Resend)                                  |
| `/api/venue-package-signup`            | POST   | Pricing-tier signup (currently console.log only — no Stripe)                  |
| `/api/claims`                          |        | Public claim submission                                                       |
| `/api/admin/claims`, `/api/admin/claims/[id]`, `/approve-venue-claim`, `/reject-venue-claim` | Admin claim ops |
| `/api/venues`, `/api/venues/[id]`, `/api/venues/[id]/claim` | Venue CRUD                              |
| `/api/venue-analytics`                 |        | Analytics events                                                              |
| `/api/reviews/refresh`                 |        | Refresh Google review cache                                                   |
| `/api/indexnow`                        |        | Bing IndexNow ping                                                            |

### 3a. The reported broken links

| Audit reported              | Source repo state                                                                | Verdict |
| --------------------------- | -------------------------------------------------------------------------------- | ------- |
| Footer "Wedding Venues" → `/wedding-venues` 404 | `grep` for `wedding-venues` in src/ finds **no internal links**. Both `Footer.tsx` and homepage inline footer point to `/venues`. | **Live deploy is stale relative to `master`** OR the audit hit a different element. Worth re-verifying after rebuild. |
| Hero CTA "List Your Venue" → `/list-your-venue` 404 | Homepage CTA at [src/app/page.tsx:120](../src/app/page.tsx#L120) → `/venue-packages` (exists). Footer.tsx "List Your Venue" → `/venue-owner` ([src/components/Footer.tsx:33](../src/components/Footer.tsx#L33)). | Same — `/list-your-venue` is **not in the source**. But `/venue-owner` itself has **no `page.tsx`**, only `/venue-owner/dashboard`, so the Footer's "List Your Venue" link does 404 in source. Possibly the audit's URL is just imprecise. |
| Phone `(555) 123-4567` in footer | Confirmed: [src/app/page.tsx:194](../src/app/page.tsx#L194) (inline footer on homepage only — the shared `Footer.tsx` has no phone at all). |
| Vendor cards show emoji placeholders | Confirmed: vendors.json has zero entries with images; vendors page uses `<img src={vendor.images[0]}>` with emoji fallback ([src/app/vendors/page.tsx:228-238](../src/app/vendors/page.tsx#L228)). |
| Empty Florals/Music & DJ tabs | Confirmed: tab counts are filtered live from vendors.json category strings ([src/app/vendors/page.tsx:91-92](../src/app/vendors/page.tsx#L91)) — current data has no entries with category containing "flor", "music", or "dj". |
| Hardcoded homepage stats `130+/50+/31+/5★` | Confirmed verbatim at [src/app/page.tsx:88-105](../src/app/page.tsx#L88). Real counts: 129/30/31. |

### 3b. Other broken/stale links found in code

- [src/components/Footer.tsx:49-51](../src/components/Footer.tsx#L49) — "About Us", "Privacy Policy", "Terms of Service" are bare `<div>` elements (not `<Link>`). About has a route (`/about/page.tsx`) but the footer doesn't link to it.
- [src/app/admin/page.tsx:136](../src/app/admin/page.tsx#L136) — "Total Venues 124" hardcoded (real: 129).
- [layout.tsx:32-34](../src/app/layout.tsx#L32) — `<link rel="alternate" hreflang="es" href=".../es">` but `/es` route does not exist (see §9).
- [src/app/admin/page.tsx:11](../src/app/admin/page.tsx#L11) — `'your-google-verification-code'` placeholder.

---

## 4. Asset Pipeline

| Where                            | What                                                                   |
| -------------------------------- | ---------------------------------------------------------------------- |
| `public/images/venues/`          | **349 self-hosted JPG files, ~47 MB total**. Filename pattern `venue-<id>-<slugified-name>-<n>.jpg`. Matched to venues at runtime by [src/lib/venueImages.ts](../src/lib/venueImages.ts). |
| `public/images/`                 | 3 stub JPGs of 121-127 bytes — **broken/empty placeholders that ship to prod** (`ancient-spanish-monastery.jpg`, `boca-lago-country-club.jpg`, `bonnet-house-museum-gardens.jpg`). |
| `public/images/logo.png`         | **1.6 MB PNG** — egregiously oversized for a logo. Used on every page including `priority`-loaded hero ([src/app/page.tsx:36](../src/app/page.tsx#L36)). |
| Supabase storage                 | `aflrmpkolumpjhpaxblz.supabase.co/storage/v1/object/public/**` allow-listed in [next.config.js:78-82](../next.config.js#L78) — used for owner-uploaded photos. |
| Unsplash CDN                     | `images.unsplash.com/photo-*` allow-listed ([next.config.js:65-70](../next.config.js#L65)) — used for some venues' fallbacks. |
| Other domain                     | `images.sofloweddingvenues.com/venues/**` allow-listed ([next.config.js:71-76](../next.config.js#L71)) — looks like a private CDN, no evidence it's actually populated. |

### Optimization config

[next.config.js:56-84](../next.config.js#L56):
- `formats: ['image/avif', 'image/webp']` ✓
- `deviceSizes: [640,750,828,1080,1200,1920,2048,3840]` ✓
- `unoptimized: process.env.NODE_ENV === 'development'` — prod-only optimization
- `dangerouslyAllowSVG: true` — **security risk** with user-uploaded SVG (CSP would help but the CSP allows `data:` and `https:` for `img-src`)
- `minimumCacheTTL: 60` — only 60 seconds; very low

### Performance footguns

- Vendors list uses raw `<img>` not `next/image` ([src/app/vendors/page.tsx:229](../src/app/vendors/page.tsx#L229)) → no responsive sizing, no AVIF/WebP, no lazy loading.
- The 1.6MB logo is fetched on every page (it's `priority` on the homepage hero).
- 47MB of venue JPGs are not currently behind any CDN beyond Vercel's default; image optimization happens but the source bytes are still in the deploy package.

---

## 5. Performance Baseline

**Did not run `npm run build`.** `node_modules/` is absent in the worktree, and
`package-lock.json` is 261 KB / 5300+ packages, so a clean install + build
would exceed the 5-minute budget. Recommendations are inspection-based.

### Bundle-shape concerns visible from source

1. **Whole venue dataset shipped to clients.** `mockData.ts` does
   `require('../data/venues.json')` at module top level
   ([src/lib/mockData.ts:6](../src/lib/mockData.ts#L6)) and is imported by
   client components — Next will inline the full ~120 KB JSON into the client
   bundle. Same issue would apply to vendors.json (~22 KB) and dressShops.json
   (~36 KB) wherever they're imported into client code.

2. **Heavy use of `'use client'` on top-level pages.** 11 of 13 top-level
   `page.tsx` files are client components:

   ```
   /, /venues, /venues/[id], /vendors, /dress-shops, /faq, /favorites,
   /login, /register, /admin, /venue-packages
   ```

   Only `/about` and `/blog` are RSC. This negates most App Router perf
   benefits — every page is hydrated on the client even when nothing
   interactive needs to happen.

3. **`chart.js` + `react-chartjs-2`** declared as deps but only used in
   `src/components/VenueAnalyticsPanel.tsx` (admin). Should be dynamically
   imported, not in the main graph.

4. **Build escape hatches mask issues.** [next.config.js:48-55](../next.config.js#L48):
   ```js
   eslint: { ignoreDuringBuilds: true },
   typescript: { ignoreBuildErrors: true },
   ```
   So broken imports / type errors won't block deploy. Compounds slowly.

5. **Dead-code clutter.** `src/app/page.tsx` siblings: `page-backup.tsx`,
   `page-simple.tsx`, `page_new.tsx`, `page_old.tsx`. Next ignores all but
   `page.tsx` so no runtime cost, but clutters the tree.

6. **Empty placeholder JPGs ship.** See §4.

---

## 6. Auth + Admin

**Two competing auth systems coexist.** This is the largest correctness risk
in the codebase.

### 6a. Hardcoded localStorage auth — [src/lib/auth.ts](../src/lib/auth.ts)

A 3-record `VENUE_OWNERS` array ([src/lib/auth.ts:20-51](../src/lib/auth.ts#L20)):

```ts
{ email: 'admin@floridaweddingwonders.com', role: 'super_admin', venueId: 'all' }
{ email: 'manager@curtissmansion.com',     role: 'venue_owner',  venueId: '11' }
{ email: 'owner@hialeahpark.com',           role: 'venue_owner',  venueId: '1'  }
```

**No password is checked.** `loginAsVenueOwner(email)`
([src/lib/auth.ts:138](../src/lib/auth.ts#L138)) just looks up the email in
the array, sets `localStorage.isSuperAdmin = 'true'` and writes a cookie
`venue-owner-auth=authenticated`. **Anyone who can run JS in their browser
can become super admin** by setting those localStorage keys. The middleware
([src/middleware.ts](../src/middleware.ts)) only checks the cookie value
literal-equals `"authenticated"` — easy to forge.

This is the auth used by `Navigation.tsx`, the `/admin` route gate, and the
photo-upload permission check.

### 6b. Supabase RPC auth — [src/lib/supabaseAuth.ts](../src/lib/supabaseAuth.ts)

Calls Postgres functions `register_user` and `authenticate_user` (presumed
defined in [database/users-schema.sql](../database/users-schema.sql)).
Returns user records with `id`, `role`, `emailVerified`. Used by the public
`/login` and `/register` flows for guest accounts (storing
lead-qualification data).

### 6c. Hardcoded credentials in client source

[src/lib/supabaseAuth.ts:4-5](../src/lib/supabaseAuth.ts#L4) and
[src/lib/auth.ts:188](../src/lib/auth.ts#L188) both contain:

```
NEXT_PUBLIC_SUPABASE_URL fallback = 'https://aflrmpkolumpjhpaxblz.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY fallback = 'eyJhbGc…'
```

Anon keys are *intended* to be public, but baking them in as defaults
defeats the purpose of using env vars and makes rotation harder.

### 6d. Claim flow

- Button: [src/components/VenueClaimButton.tsx](../src/components/VenueClaimButton.tsx)
- Form page: [src/app/venues/[id]/claim/page.tsx](../src/app/venues/%5Bid%5D/claim/page.tsx)
- Submit endpoint: `/api/claims/route.ts`, plus admin approve/reject under `/api/admin/`
- Storage: Supabase `venue_claims` table + a fallback to local `data/claims.json`
  (currently `[]`, see [data/claims.json](../data/claims.json)) and
  `src/lib/claimsStorage.ts`.

The schema includes a sophisticated approval workflow
([database/auth-schema.sql:43-46, 142-183](../database/auth-schema.sql#L43))
with a stored proc `create_venue_owner_account` that creates an owner account
and links it to the venue on approval. **It's well-modeled in SQL but the
runtime auth that gates the dashboard is the hardcoded-array system.** The
two are not connected.

---

## 7. Inquiry Flow Today

The venue page has **two separate inquiry paths** depending on which button
the user clicks:

### Path A — desktop sidebar "Send Inquiry" button (`mailto:`, no capture)

[src/app/venues/[id]/page.tsx:586-592](../src/app/venues/%5Bid%5D/page.tsx#L586):

```tsx
<a href={`mailto:${venue.contact.email}?subject=Wedding Inquiry for ${venue.name}`}>
  Send Inquiry
</a>
```

Plus the same link at line 333. **Confirms the audit finding.** No lead
capture, no analytics, no record. **And the email it sends to is fake** —
synthesized as `info@<slug>.com` in
[src/lib/mockData.ts:210](../src/lib/mockData.ts#L210), so for the vast
majority of venues the inquiry bounces or vanishes.

### Path B — "Request Information" / mobile "Contact" buttons (lead capture)

These buttons (lines 297, 326) open the `<VenueContactForm>` modal
([src/components/VenueContactForm.tsx](../src/components/VenueContactForm.tsx))
which:

1. Requires sign-in (gates behind the localStorage `user` key — line 76).
2. Pulls the user's stored `leadQualification` (guest count, budget, date).
3. POSTs to `/api/venue-leads`
   ([src/app/api/venue-leads/route.ts](../src/app/api/venue-leads/route.ts)).
4. Server uses **Resend** to send two emails: the venue gets the
   pre-qualified lead, the user gets a confirmation.
5. **The "to" address is `venue.contact.email`** — same fake auto-generated
   email. So this path also dead-ends in practice unless real venue emails
   are loaded into the JSON.

### Path C — desktop tab "Send Inquiry" form

[src/app/venues/[id]/page.tsx:725-778](../src/app/venues/%5Bid%5D/page.tsx#L725) —
HTML form with fields, but **no `onSubmit` handler**. Submitting does
nothing.

### Implication for Phase 2 (lead capture)

The infrastructure for lead-capture exists (Path B + Resend + a thoughtful
email template). Two real fixes needed:
1. Replace the fake auto-generated `info@…` emails with real ones (or route
   *all* leads through a central inbox rather than to the venue).
2. Make Path A and Path C also flow through `/api/venue-leads`.

---

## 8. Stripe / Payments

**No Stripe SDK installed.** Greenfield from a payments standpoint.

References found:
- [src/app/venue-packages/page.tsx:106](../src/app/venue-packages/page.tsx#L106) — comment "Here we'll integrate with Stripe and email system"
- [src/app/venue-packages/page.tsx:439](../src/app/venue-packages/page.tsx#L439) — copy mentions "$25/month" Growth tier; the page renders pricing tiers visually
- [src/app/api/venue-package-signup/route.ts:30](../src/app/api/venue-package-signup/route.ts#L30) — comment "Create a Stripe customer/subscription for paid packages". Endpoint currently just `console.log`s and returns success.

**There is a pricing UI today, but no payment processing.** Anyone clicking
"sign up for Growth tier" gets a fake success response.

---

## 9. i18n

**Bilingual only inside the FAQ component.** No site-wide i18n framework.

- Implementation: per-component React state in
  [src/components/FAQ.tsx:19](../src/components/FAQ.tsx#L19) — a
  `useState<'en' | 'es'>` and rendering `faq.question[language]` /
  `faq.answer[language]`.
- Data: dual-language strings in
  [src/data/faq.ts](../src/data/faq.ts) where each FAQ has
  `{ question: { en, es }, answer: { en, es } }`.
- Categories also have bilingual labels via `getCategoryLabel(cat, language)`.
- Counts: based on file size (~17 KB faq.ts) and structure, ~12-15 FAQs total.

**Not internationalized:**
- Venue/vendor/dress-shop names, descriptions, amenities (all English in JSON)
- Page copy on /about, /contact, /vendors, /venues list, /venue-packages, etc.
- Navigation, footer, buttons
- `layout.tsx` advertises `hreflang="es"` pointing to `/es` — **but `/es` is
  not a route in the App Router**, so this is broken SEO. Search engines
  attempting to crawl the Spanish version will 404.

No `next-intl`, `next-i18next`, or `react-i18next` installed.

---

## 10. Migration Assessment

### TL;DR recommendation

**(b) Refactor in place. Do NOT full-rewrite.**

The Next.js + TypeScript + Tailwind + Supabase + Resend + Vercel stack is
*already what we'd pick* if we were starting fresh. The schema in
`database/*.sql` is thoughtfully modeled. The bones are good. The pain is
concentrated in five places, all of which are smaller than a rewrite:

1. **Move venue/vendor/dress-shop data from JSON-bundled-in-client to
   Supabase + RSC fetching.** This is the highest-value single change. It
   unlocks: server-rendered listings (perf), real CRUD via the admin (no
   localStorage), a single source of truth for migration safety. The schema
   already exists ([database/schema.sql](../database/schema.sql)); we need a
   one-time migration script to parse the free-text `capacity` and `pricing`
   strings into structured columns. Estimated ~3-5 days including the data
   audit, parser, and admin CRUD wiring.

2. **Replace the hardcoded localStorage auth with the Supabase auth that
   already exists.** Roughly: delete `src/lib/auth.ts`, route all auth
   through `src/lib/supabaseAuth.ts`, fix the middleware to verify a real
   JWT cookie. ~2 days.

3. **Unify the inquiry flow.** Make all three paths go through
   `/api/venue-leads`. Capture every lead in a `venue_leads` table for the
   admin. ~1 day. Replace fake `info@…` emails with a central
   `leads@floridaweddingwonders.com` inbox forwarder + the real venue email
   when known. Same day.

4. **Convert top-level pages from client to RSC.** Most of them don't need
   client interactivity — they only need it because of how the data layer
   was set up. After fix #1, this becomes mechanical. ~2 days for the perf
   pass (also: dynamic-import chart.js, replace raw `<img>` on /vendors with
   `next/image`, optimize logo.png). Bundle target: cut TTI by ~50%.

5. **Real i18n.** If Spanish matters for SEO, install `next-intl`, set up
   `[locale]` segment routing, translate top-of-funnel pages. ~3-5 days
   depending on translation scope. If Spanish is *just* the FAQ — keep what
   exists and remove the misleading hreflang.

**Plus the surface bugs** (homepage stats, footer phone, broken Footer.tsx
links, vendor images, empty Florals/Music tabs, hardcoded admin "124", build
escape hatches): ~1-2 days bundled.

**Total estimate: 12-18 working days** for a full Phase 0→1 rebuild without
losing data.

### Why not a full rewrite

- The data layer is the only deeply-broken thing, and it's a refactor not a
  rewrite.
- The Supabase schema is already well-designed — throwing it away wastes
  meaningful work.
- The component tree (PhotoGallery, VenueCard, FAQ, etc.) is reasonable;
  individual files are large but coherent.
- Email (Resend) and SEO (sitemap, hreflang, structured data) infrastructure
  is in place and works.
- A rewrite would burn 4-6 weeks and re-introduce a fresh set of bugs in
  exchange for a cleaner mental model. The user's time-to-revenue is better
  spent on the lead-capture and Stripe-onboarding work in Phases 2-3.

### Blockers / things to confirm before Phase 1

1. **Live site vs `master` divergence.** The audit-reported `/wedding-venues`
   and `/list-your-venue` URLs do not appear in the source. Either prod is
   running an older deploy, or the audit's URLs were paraphrases. Confirm
   what's actually live before touching the routing.
2. **Real venue contact emails.** All current `info@<slug>.com` addresses
   are fake. Decide: route every lead to a central inbox (recommended), or
   harvest real emails from venue websites and fill in `venues.json`.
3. **Photo licensing.** 47 MB / 349 venue JPGs are committed to the repo.
   Confirm these are licensed for commercial use before building distribution
   features around them.
4. **localStorage state migration.** When migrating to Supabase, decide how
   to handle existing user state (saved venues, lead-qualification profiles).
   For SUPER ADMIN's deleted-venues list this is tricky — a one-time export
   from the production browser may be needed.
5. **Vercel team / project ownership.** Confirm we have admin access to the
   Vercel project before deploying changes. `vercel.json` exists but no
   `.vercel/` folder is in the worktree.

### Surprises worth flagging (also see chat reply)

1. **Public site reads from a JSON file, not the database.** Despite a fully
   modeled Supabase schema, the live venues come from `src/data/venues.json`.
   The DB exists for ancillary stuff (photos, claims, leads) but isn't the
   source of truth for the catalog.
2. **Venue IDs are array indices.** `/venues/47` becomes `/venues/<other
   venue>` if the JSON gets reordered. Every existing inbound link is
   fragile.
3. **Most venue contact emails are auto-generated and fake**
   ([src/lib/mockData.ts:210](../src/lib/mockData.ts#L210)). The inquiry
   form sends to nowhere.
4. **Auth is fundamentally insecure.** Setting
   `localStorage.isSuperAdmin = 'true'` in DevTools grants admin access. The
   middleware only checks for a cookie value of literally `"authenticated"`.
5. **Soft-deletes are device-local.** A super admin deleting a venue only
   removes it from their own browser. Other users still see it.
6. **`/es` hreflang is advertised but the route doesn't exist.** Spanish SEO
   is broken, not just incomplete.
7. **Build ignores TypeScript and ESLint errors.** `next.config.js` sets
   both flags to `true`.

---

## Recommended Plan

**Phase 1 — Data + Auth + Inquiry foundation (8-10 days):**
1. Migrate venues/vendors/dress-shops from JSON to Supabase, with a parser
   for free-text capacity/pricing → structured columns. Stable IDs. Backup
   the JSON files.
2. Convert venue/vendor list and detail pages to RSC, fetching from Supabase.
3. Delete `src/lib/auth.ts`. Wire all auth through `src/lib/supabaseAuth.ts`.
   Fix middleware to verify Supabase JWT.
4. Make all "Send Inquiry" / "Request Information" buttons flow through
   `/api/venue-leads`. Persist leads to a `venue_leads` table. Replace fake
   `info@<slug>.com` with central forwarder.
5. Fix all surface bugs in §3a/§3b (homepage stats, footer phone, Footer.tsx
   broken links, vendor placeholders, empty category tabs, hardcoded admin
   counts).

**Phase 2 — Performance + i18n + assets (3-5 days):**
6. Optimize logo.png (target <100 KB). Replace raw `<img>` on /vendors with
   `next/image`. Dynamic-import chart.js. Remove duplicate `page-X.tsx`
   files. Remove empty stub JPGs.
7. Either real `next-intl` setup with translated top-of-funnel pages OR
   remove the `/es` hreflang and the bilingual FAQ stays as the only Spanish
   surface.
8. Re-enable TS + ESLint in builds. Fix the errors that surface.

**Phase 3 — Stripe + paid vendor dashboards (separate, follows Phase 1):**
9. Stripe Checkout for the Growth tier. Wire `/api/venue-package-signup` to
   create a real Stripe customer and link to a `venue_owners` record.
10. Build the venue-owner dashboard (claim → manage photos → see leads).

**Total: ~14-20 days end-to-end, with the live data preserved throughout.**
