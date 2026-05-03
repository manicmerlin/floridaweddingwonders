import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';
import { MILESTONES, CATEGORY_LABELS, attachDueDates } from '@/lib/timelineMilestones';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/tools/timeline-summary
//
// Sends the user's personalized timeline to their email. Includes every
// milestone with its computed due date, grouped by category, with checked
// items struck through. Adds the email to email_subscribers (idempotent).

const Body = z.object({
  email: z.string().email(),
  weddingDate: z.string().date(),
  done: z.record(z.string(), z.boolean()),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => i.message).join('; ')
        : 'Invalid body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Newsletter signup (idempotent).
  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from('email_subscribers')
      .upsert({ email: parsed.email }, { onConflict: 'email' });
  } catch (e) {
    console.warn('email_subscribers upsert skipped:', e);
  }

  // Send the timeline email.
  try {
    await resend.emails.send({
      from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
      to: [parsed.email],
      subject: `Your Florida wedding timeline — ${formatDate(parsed.weddingDate)}`,
      html: renderTimelineEmail(parsed),
    });
  } catch (e) {
    console.error('timeline summary email failed:', e);
    return NextResponse.json(
      { error: 'Could not send the email. Try again in a minute.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

function renderTimelineEmail(args: z.infer<typeof Body>): string {
  const wedding = new Date(args.weddingDate);
  const items = attachDueDates(wedding);

  // Group by category
  const groups = new Map<string, typeof items>();
  for (const m of items) {
    const arr = groups.get(m.category) ?? [];
    arr.push(m);
    groups.set(m.category, arr);
  }

  const sections = Array.from(groups.entries())
    .map(([cat, list]) => {
      const rows = list
        .map((m) => {
          const isDone = !!args.done[m.id];
          const titleStyle = isDone
            ? 'color:#9ca3af;text-decoration:line-through;'
            : 'color:#111827;font-weight:600;';
          return `
          <li style="margin-bottom:16px;">
            <div style="${titleStyle}">${escapeHtml(m.title)}</div>
            <div style="color:#6b7280;font-size:13px;">Due ${m.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div style="color:#374151;font-size:14px;margin-top:4px;">${escapeHtml(m.description)}</div>
          </li>`;
        })
        .join('');
      const label = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat;
      return `
        <h2 style="color:#be185d;font-size:18px;margin-top:32px;margin-bottom:12px;border-bottom:2px solid #fdf2f8;padding-bottom:6px;">${escapeHtml(label)}</h2>
        <ul style="list-style:none;padding-left:0;">${rows}</ul>`;
    })
    .join('');

  return `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#f9fafb;">
    <div style="background:white;border-radius:14px;padding:32px;">
      <h1 style="color:#ec4899;margin:0 0 6px 0;font-size:26px;">Your Florida wedding timeline</h1>
      <p style="color:#6b7280;margin:0 0 6px 0;">Wedding date: <strong style="color:#111827;">${formatDate(args.weddingDate)}</strong></p>
      <p style="color:#6b7280;margin:0 0 6px 0;">${MILESTONES.length} milestones across ${groups.size} categories.</p>

      ${sections}

      <div style="margin-top:32px;padding:16px;background:#f0f9ff;border-radius:10px;font-size:14px;color:#075985;">
        <strong>Tip:</strong> save this email as a PDF (File → Print → Save as PDF) for a printable timeline. Your check-off state stays saved at floridaweddingwonders.com/tools/timeline.
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://floridaweddingwonders.com/quotes/request" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
          Get matching quotes from up to 5 venues
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:30px;">
        You're now on the Florida Wedding Wonders newsletter.<br/>
        One planning email a month. Easy unsubscribe.
      </p>
    </div>
  </div>`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function escapeHtml(value: string): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
