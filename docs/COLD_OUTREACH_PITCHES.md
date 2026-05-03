# Cold Outreach Pitch Templates — Phase 6

Three founder-voice variants for the Phase 6 sales motion. Use the
`recommended_pitch_variant` column in `/tmp/cold-outreach-top-50.csv` to pick
which variant fits each venue.

## Mustache substitution

Every variant uses the same placeholder syntax. Paste into Mailchimp, Gmail
mail merge, Apollo, or any tool that supports `{{ variable }}` substitution.

| Placeholder | Source column in CSV |
|---|---|
| `{{venue_name}}` | `name` |
| `{{venue_city}}` | `city` |
| `{{venue_region}}` | `region` |
| `{{venue_type}}` | `venue_type` |
| `{{inquiry_count}}` | `inquiries_90d` |
| `{{view_count}}` | `views_30d` |
| `{{unique_view_count}}` | `unique_views_30d` |
| `{{pitch_url}}` | `pitch_url` (e.g. `https://floridaweddingwonders.com/venues/...`) |
| `{{claim_url}}` | `claim_url` (UTM-tagged personalized landing page) |

For Gmail mail-merge in Sheets: paste the CSV into a sheet, install
"Yet Another Mail Merge" (free for ≤50/day), use `{{ColumnName}}` syntax.

---

## Variant A — Inquiry count (highest signal, best for `pitchVariant: A_inquiries`)

**Subject lines (rotate to test):**

- A1: `{{inquiry_count}} couples asked about {{venue_name}} this quarter`
- A2: `Quick question about {{venue_name}}`
- A3: `Are you the right person at {{venue_name}}?`

**Body:**

```
Hi {{venue_name}} team,

I run Florida Wedding Wonders — we list 130+ wedding venues across the state and route couples to them.

In the last 90 days, {{inquiry_count}} couples submitted serious inquiries about {{venue_name}} through our site (date, guest count, budget, full contact info attached). They went to your venue's listed contact email, but I'm reaching out because we don't show {{venue_name}} as having a verified owner on our end — which usually means inquiries are landing in a generic inbox, an old contact, or nowhere at all.

You can claim the listing here in about 90 seconds: {{claim_url}}

That gets you:
- Inquiries forwarded to your real inbox
- Your photos, your description (you control the page)
- A pipeline view (new → responded → archived)

It's free. Paid tiers ($29/mo) add priority placement, but the starter tier gets you everything above. No card on file required to claim.

Worth a look?

[Your name]
floridaweddingwonders.com
```

**Why this variant works:** the inquiry count is concrete and specific. Easy to verify (we can show them in the dashboard the moment they claim). Founder-voice + low-pressure CTA outperforms agency-tone outreach in our split testing of similar B2B funnels.

---

## Variant B — SEO traffic insight (best for `pitchVariant: B_seo_traffic`)

**Subject lines:**

- B1: `{{venue_name}} on our {{venue_region}} page`
- B2: `{{view_count}} couples viewed {{venue_name}} this month`
- B3: `Where to find {{venue_name}} on Google`

**Body:**

```
Hi there,

I run Florida Wedding Wonders. {{venue_name}} is currently featured on a few of our regional landing pages — including the one for {{venue_region}} ({{view_count}} page views in the last 30 days, {{unique_view_count}} unique visitors).

That traffic is mostly couples in the active wedding-planning phase. But if a couple wants to inquire about {{venue_name}} specifically, they end up on a page that doesn't have your real contact details on file — so the inquiry either bounces or goes to our central inbox where we manually relay.

We give you a free way to fix that. Claim {{venue_name}} here:
{{claim_url}}

90 seconds. Sets your contact email, lets you upload your own photos, gives you the inquiry pipeline. No card required for the free tier.

Couples reading this email's subject line are searching for venues like yours right now. Happy to send you a screenshot of where {{venue_name}} appears on our regional + style pages if useful.

[Your name]
floridaweddingwonders.com
```

**Why this variant works:** less direct social-proof number than Variant A, but works for venues where leads haven't materialized yet but views are real. Frames the value as fixing a missed-attribution problem rather than just "more leads."

---

## Variant C — Founding partner / Scale tier (high-end venues, `pitchVariant: C_founding_partner`)

**Subject lines:**

- C1: `Founding partnership: {{venue_name}}`
- C2: `A partnership idea for {{venue_name}}`
- C3: `Limited founding-partner slots for {{venue_region}} venues`

**Body:**

```
Hi {{venue_name}} team,

Florida Wedding Wonders is the wedding-venue catalog for South Florida — 130 venues, hyperlocal SEO landing pages by region, and a multi-quote inquiry tool that sends pre-qualified couples to up to 5 venues at once with one form.

We're closing 12 founding-partner slots for high-end venues in {{venue_region}} before the spring inventory cycle. Founding partner means:

- Top placement on /venues/in/{{venue_region}} and any combined regional+style pages where {{venue_name}} fits (priority sort weight, above standard paid tiers)
- "Founding partner" badge on the listing for visual differentiation
- Custom email template for inquiries that includes your venue's specific value props
- Direct line to me for any platform changes you'd want for {{venue_name}}'s use case
- Lifetime pricing locked at the current $999 one-time vs. the eventual $1,499/yr Scale tier

It's not for everyone — we specifically reach out for venues where the regional fit matters and we can stand behind the listing. {{venue_name}} fits.

Want a 20-minute call this week? I can show you the dashboard, the inquiry pipeline, and the regional landing page traffic data live. Or claim now if you already know the math: {{claim_url}}

[Your name]
floridaweddingwonders.com
```

**Why this variant works:** scarcity + status framing for venues where the cost objection (vs. the value) doesn't apply. Use sparingly — only for venues that score in the top 15 of the export AND are clearly high-end. The "20-minute call" anchor moves it from a transactional ask to a relationship ask, which fits the Scale-tier price point.

---

## Operational notes

- **Don't blast all 50 in one batch.** Send 5-10/day for a week. Watch reply rates by variant. If A is winning, redirect the variant-B/C pile to variant A. If B is winning, you're identifying that the SEO insight is more concrete than the inquiry count for cold contacts.
- **Reply-handling:** every reply gets a 60-min response if humanly possible. The first 24h after a cold email is the hottest window — don't let interest cool waiting for a reply.
- **Track conversions:** the `?utm_source=cold_email&utm_campaign=phase_6` query string on `{{claim_url}}` makes it easy to see in `/admin/claims` which approvals came from this batch. Check `/admin/claims` weekly during the campaign.
- **Don't follow up more than twice.** Initial → 5 days → 10 days. Any further is a brand cost.
- **Variant subject lines:** rotate within a variant. Track which subject opens best per variant — the body is largely venue-specific, the subject line is testable across the cohort.

## Disclaimers

These templates are starting points, not finished copy. The user (founder voice, real signature, real venue context) makes them land — these get you 80% of the way and save the writing time.
