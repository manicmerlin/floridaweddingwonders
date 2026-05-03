# Phase 7A Setup — Weekly Content Agent

This document covers what you need to add in Vercel + GitHub before the
weekly content agent can run end-to-end. The DB schema is already
applied; the code is in place.

## 1. Environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for
the **Production** environment (and Preview if you want to test there too).

### `CRON_SECRET` — required

Gates the cron endpoint. Vercel sends this as `Authorization: Bearer <secret>`
on every cron invocation.

**Generate one:**

```bash
openssl rand -hex 32
```

Paste the output into Vercel as `CRON_SECRET`. Don't commit this anywhere.

### `ANTHROPIC_API_KEY` — required

The agent makes 1-3 Claude API calls per run (topic-gen optional, draft
required, metadata required).

**Get one:**

1. https://console.anthropic.com/settings/keys
2. Create a new key, scoped to a project if you want spend isolation
3. Paste into Vercel as `ANTHROPIC_API_KEY`

**Estimated cost per run (Opus 4.7):**

- Topic generation (rare, only when queue is empty): ~$0.10
- Draft (~6k output tokens, ~3k input): ~$0.50
- Metadata (~1k output, ~3k input): ~$0.10
- **Per-run total: ~$0.60-0.80**
- **Monthly cost (4 runs): ~$2.50-3.00**

The agent records every run's cost in `agent_runs.cost_cents` for
auditing.

### `GITHUB_PUBLISH_TOKEN` — required

Used to commit approved drafts to `src/posts/<slug>.md` on the master
branch.

**Create the PAT:**

1. https://github.com/settings/personal-access-tokens/new
2. **Token type:** Fine-grained personal access token
3. **Resource owner:** your account (manicmerlin)
4. **Repository access:** Only select repositories → `floridaweddingwonders`
5. **Permissions → Repository permissions:**
   - **Contents:** Read and write
   - **Metadata:** Read-only (auto-selected)
   - Everything else: No access
6. **Expiration:** 90 days minimum (you'll need to rotate before expiry)
7. Click "Generate token", copy the value (starts with `github_pat_`),
   paste into Vercel as `GITHUB_PUBLISH_TOKEN`

**Why fine-grained over classic:**

- Scoped to exactly one repo (this one)
- Scoped to exactly two permissions (Contents R/W + Metadata R)
- Expires automatically — forces rotation hygiene

**Note:** GitHub's fine-grained PAT permission model doesn't let you
restrict by file path (`src/posts/` only). Repository-level Contents
write is the least-privilege option. Acceptable risk: the token can
only be used by Vercel's serverless functions for this app, and a leak
would still be limited to repo-level write.

### `GITHUB_PUBLISH_OWNER` — optional, defaults to `manicmerlin`
### `GITHUB_PUBLISH_REPO` — optional, defaults to `floridaweddingwonders`
### `GITHUB_PUBLISH_BRANCH` — optional, defaults to `master`

Override only if you fork the repo or use a different branch.

### `RESEND_API_KEY` — already configured (verify it's healthy)

The cron endpoint emails super-admins when a draft is ready. Uses the
existing `RESEND_API_KEY` from earlier phases. You flagged this as
"Needs Attention" in Vercel — worth checking it's still working before
the first cron fires Monday. If it's expired/rotated, draft creation
still succeeds but you won't get the notification email.

### `SUPER_ADMIN_EMAILS` — already configured

Comma-separated list. The agent emails every address in this list when
a draft is ready. Already set to `bennettbonta@gmail.com` per Phase 1.

## 2. Manual test before the first cron fires

Before Monday's automatic run, kick the endpoint manually to verify
everything works.

### Step 1: Local test (no cost, mocked)

```bash
# In the project root
npm run dev
# In another terminal
curl -X POST http://localhost:3000/api/cron/weekly-blog-draft \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

If `ANTHROPIC_API_KEY` is set in `.env.local`, this triggers a real run
locally and writes to your live Supabase. Cost: ~$0.60.

If you want a no-cost dry-run, comment out the `executeRun(agentRunId)`
call in `src/lib/agents/content/weekly.ts` and add a stub that returns
without touching Anthropic. Restore before deploying.

### Step 2: Production test (real cost, real draft)

```bash
curl -X POST https://floridaweddingwonders.com/api/cron/weekly-blog-draft \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

This is exactly what Vercel Cron will send Monday. The endpoint is
idempotent — calling it twice in the same UTC day returns
`{"status":"already-ran"}` on the second call.

**Expected result:**

```json
{
  "status": "success",
  "agentRunId": "uuid",
  "pendingPostId": "uuid",
  "topic": "florida-wedding-color-palettes-by-season",
  "title": "Florida Wedding Color Palettes: What Works in Each Season",
  "costCents": 65
}
```

Then visit `/admin/content-pipeline` to review the draft.

### Step 3: Approve a test draft

In `/admin/content-pipeline`:

1. Click into the pending draft
2. Click "Edit" if you want to tweak before publishing
3. Click "Approve & publish to GitHub"
4. The MDX commits to `src/posts/<slug>.md` on master via the
   GitHub Contents API
5. Vercel auto-deploys the new master commit
6. Post goes live at `/blog/<slug>` after the deploy lands (~1-2 min)

## 3. Cron schedule details

`vercel.json`:

```json
"crons": [
  { "path": "/api/cron/weekly-blog-draft", "schedule": "0 14 * * 1" }
]
```

- `0 14 * * 1` = every Monday at 14:00 UTC
- Florida (Eastern): **09:00 EST** (winter, Nov-Mar) / **10:00 EDT** (summer, Mar-Nov)
- Vercel Cron only supports UTC. To shift the local time, change the hour
  in `vercel.json` (e.g., `0 13 * * 1` = 09:00 EDT / 08:00 EST).

## 4. Operational notes

### Idempotency

The DB has a unique partial index:

```sql
create unique index agent_runs_agent_date_uidx
  on agent_runs (agent_name, run_date)
  where status in ('started', 'success', 'partial');
```

If Vercel retries the cron (it occasionally does on transient infrastructure
failures), the second `INSERT INTO agent_runs ...` fails with a unique
violation. The endpoint catches this and returns 200 with
`status: 'already-ran'`. Safe to retry without worrying about double-charging
or double-drafting.

### Failed runs

The unique index excludes `status='failed'`, so if the first attempt
errors out (Claude rate limit, GitHub API hiccup), the next cron run can
succeed cleanly.

### Cost ceiling

Set a Claude billing alert at $10/month as a backstop. At $0.60-0.80
per run, weekly cadence stays well under $5/month. If you ever see
runaway cost, check `agent_runs` for unusually high `tokens_out` —
usually means a topic was framed too broadly.

### Skipping a week

To skip a Monday, either:

- **Easy:** delete the `crons` entry from `vercel.json` and redeploy. Restore later.
- **Easier:** mark the next pending topic as `skipped` in the admin UI before Monday.
   With no topics in `pending` status, the agent's topic-gen path kicks in but you can
   delete the generated topics before approval.

### Rotating the GitHub PAT

When `GITHUB_PUBLISH_TOKEN` expires:

1. Generate a new fine-grained PAT (same scopes as in section 1)
2. Update the env var in Vercel
3. Redeploy (or wait for the next deploy — env vars apply immediately to
   new function invocations, but you may need to nudge a deploy if
   nothing's happening organically)

### Auditing what got published

Every approved post creates a row in `pending_posts` with:

- `status='published'`
- `github_commit_sha` (clickable in the admin UI)
- `published_at`
- `reviewed_by` (the admin who approved)

Plus the underlying `agent_runs` row tracks which run produced the draft,
how many tokens, what it cost.

## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Cron doesn't fire | `vercel.json` change not deployed | Push a deploy; check Vercel dashboard → Cron Jobs |
| 401 from cron endpoint | `CRON_SECRET` mismatch | Verify Vercel env var matches what Vercel Cron sends |
| 500 from cron endpoint | Claude/GitHub API failure | Check `agent_runs.error` field; usually transient |
| Draft has wrong slug | Topic name vs. slug mismatch | Edit the slug in the drawer before approving |
| GitHub commit fails (409) | Slug already exists in `src/posts/` | Edit the slug or change the topic name |
| Email never arrives | RESEND_API_KEY expired/limited | Check Resend dashboard; the draft is still in `/admin/content-pipeline` regardless |

## 6. Phase 7B candidates

- **Image generation** — replace the CSS-gradient placeholder with a
  Claude/Imagen/SDXL-generated featured image
- **A/B testing on titles** — track which titles convert blog → multi-quote
- **Auto-pinning to Pinterest** — once domain verification lands, push
  approved posts as pins automatically
- **Other agents reusing `agent_runs`** — review-moderation agent,
  cold-outreach personalization agent, etc.
