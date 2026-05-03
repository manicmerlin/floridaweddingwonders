import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createSupabaseAdminClient } from '@/lib/supabaseServer';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/tools/budget-summary
//
// Sends the user's customized budget breakdown to their email and adds them
// to the email_subscribers table (with idempotent upsert). The email itself
// is print-friendly so users who want a PDF can save it from their email
// client — we ship without a server-side PDF dependency for v1.

const Body = z.object({
  email: z.string().email(),
  total: z.number().int().nonnegative().max(2_000_000),
  allocations: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        amount: z.number().int().nonnegative(),
      })
    )
    .min(1)
    .max(50),
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

  // Insert into email_subscribers (idempotent on unique email).
  try {
    const admin = createSupabaseAdminClient();
    await admin
      .from('email_subscribers')
      .upsert({ email: parsed.email }, { onConflict: 'email' });
  } catch (e) {
    console.warn('email_subscribers upsert skipped:', e);
  }

  // Send the breakdown email — print-friendly layout, save-as-PDF-able.
  try {
    await resend.emails.send({
      from: 'Florida Wedding Wonders <noreply@floridaweddingwonders.com>',
      to: [parsed.email],
      subject: `Your $${parsed.total.toLocaleString()} Florida wedding budget`,
      html: renderBudgetEmail(parsed),
    });
  } catch (e) {
    console.error('budget summary email failed:', e);
    return NextResponse.json(
      { error: 'Could not send the email. Try again in a minute.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

function renderBudgetEmail(args: z.infer<typeof Body>): string {
  const rows = args.allocations
    .map((a) => {
      const pct = args.total > 0 ? ((a.amount / args.total) * 100).toFixed(1) : '0';
      return `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#1f2937;">${escapeHtml(a.label)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;color:#1f2937;font-weight:600;">$${a.amount.toLocaleString()}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;color:#6b7280;font-size:13px;">${pct}%</td>
      </tr>`;
    })
    .join('');

  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;background:#f9fafb;">
    <div style="background:white;border-radius:14px;padding:32px;">
      <h1 style="color:#ec4899;margin:0 0 6px 0;font-size:26px;">Your Florida wedding budget</h1>
      <p style="color:#6b7280;margin:0 0 24px 0;">Total: <strong style="color:#111827;">$${args.total.toLocaleString()}</strong></p>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#fdf2f8;">
            <th style="padding:10px 16px;text-align:left;color:#be185d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Category</th>
            <th style="padding:10px 16px;text-align:right;color:#be185d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
            <th style="padding:10px 16px;text-align:right;color:#be185d;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">%</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:24px;padding:16px;background:#f0f9ff;border-radius:10px;font-size:14px;color:#075985;">
        <strong>Tip:</strong> save this email as a PDF from your email client (File → Print → Save as PDF) for a printable budget reference.
      </div>

      <div style="margin-top:24px;text-align:center;">
        <a href="https://floridaweddingwonders.com/quotes/request" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">
          Find venues in your venue+catering budget
        </a>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:30px;">
        You're now on the Florida Wedding Wonders newsletter.<br/>
        One planning email a month. Easy unsubscribe in every send.
      </p>
    </div>
  </div>`;
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
