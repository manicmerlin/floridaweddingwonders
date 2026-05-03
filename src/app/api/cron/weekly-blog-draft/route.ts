import { NextRequest, NextResponse } from 'next/server';
import { runWeeklyContentAgent } from '@/lib/agents/content/weekly';

// Phase 7A — Weekly content agent cron endpoint.
//
// Triggered by Vercel Cron (vercel.json: "0 14 * * 1" = Monday 14:00 UTC =
// 09:00 EST winter / 10:00 EDT summer). The endpoint is also callable
// manually via curl + CRON_SECRET for testing — see docs/PHASE_7A_SETUP.md.
//
// Auth model: Vercel Cron sends Authorization: Bearer <CRON_SECRET>. We
// reject anything without the matching token. The runner itself is
// idempotent at the DB level (unique partial index on agent_runs) so
// double-fires return 200 with status='already-ran' rather than running twice.
//
// We accept GET (Vercel default) AND POST (manual testing) so curl is easy.

export const dynamic = 'force-dynamic';

// 5 minutes — generous since Claude calls can take 60-120s for the draft + metadata.
export const maxDuration = 300;

async function handle(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured on the server' },
      { status: 500 }
    );
  }

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>. Manual callers
  // can use the same header.
  const authHeader = request.headers.get('authorization') ?? '';
  const provided = authHeader.replace(/^Bearer\s+/i, '');
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runWeeklyContentAgent();

  // Status code mapping:
  //   success / already-ran → 200 (Vercel Cron treats 2xx as success, won't retry)
  //   partial / failed     → 500 (Vercel may retry; idempotency index handles double-fire)
  const ok = result.status === 'success' || result.status === 'already-ran';
  return NextResponse.json(result, { status: ok ? 200 : 500 });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
