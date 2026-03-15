import { NextRequest, NextResponse } from 'next/server'

// Uses Resend — free tier: 100 emails/day, 3000/month
// Sign up at resend.com, get API key, add to Vercel env as RESEND_API_KEY
// Also add NEXT_PUBLIC_APP_URL=https://gritclub.live to Vercel env

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL     = 'GritClub <noreply@gritclub.live>'
// If you haven't set up a custom domain on Resend yet, use:
// const FROM_EMAIL = 'GritClub <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, to, data } = body

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let subject = ''
    let html    = ''

    // ── FREE TICKET CONFIRMATION ──────────────────────────────────
    if (type === 'free_ticket') {
      const { eventTitle, eventDate, eventTime, hostName, userName, ticketId, appUrl } = data
      subject = `✅ Seat Confirmed: ${eventTitle}`
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Seat Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:26px;font-weight:800;color:#F0F4FF;letter-spacing:-0.02em;">
        Grit<span style="color:#F59E0B;">Club</span>
      </span>
    </div>

    <!-- Card -->
    <div style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

      <!-- Green top bar -->
      <div style="height:4px;background:linear-gradient(to right,#10B981,#059669);"></div>

      <div style="padding:32px;">
        <!-- Check icon -->
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.12);border:2px solid rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
          <span style="font-size:28px;">✅</span>
        </div>

        <h1 style="color:#F0F4FF;font-size:22px;font-weight:800;text-align:center;margin:0 0 8px;letter-spacing:-0.02em;">
          Your Seat is Confirmed!
        </h1>
        <p style="color:#7B8DB0;font-size:14px;text-align:center;margin:0 0 28px;line-height:1.6;">
          Hi ${userName || 'there'}, you're all set for:
        </p>

        <!-- Event details box -->
        <div style="background:#0D1428;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
          <p style="color:#F0F4FF;font-size:18px;font-weight:700;margin:0 0 12px;">${eventTitle}</p>
          ${eventDate ? `<p style="color:#7B8DB0;font-size:13px;margin:0 0 6px;">📅 ${eventDate}${eventTime ? ' · ' + eventTime : ''}</p>` : ''}
          ${hostName ? `<p style="color:#7B8DB0;font-size:13px;margin:0 0 6px;">🎤 Hosted by ${hostName}</p>` : ''}
          <p style="color:#7B8DB0;font-size:13px;margin:0;">🎟️ Ticket type: <span style="color:#10B981;font-weight:700;">FREE</span></p>
        </div>

        <!-- Ticket ID -->
        ${ticketId ? `
        <div style="background:rgba(16,185,129,0.06);border-radius:10px;padding:12px 16px;margin-bottom:24px;border:1px solid rgba(16,185,129,0.15);text-align:center;">
          <p style="color:#3D4F6E;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Ticket ID</p>
          <p style="color:#10B981;font-size:13px;font-family:monospace;margin:0;font-weight:600;">${ticketId.slice(0,8).toUpperCase()}</p>
        </div>` : ''}

        <!-- CTA -->
        <div style="text-align:center;">
          <a href="${appUrl || 'https://gritclub.live'}/dashboard/tickets"
            style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#10B981,#059669);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
            View My Tickets →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#3D4F6E;font-size:12px;margin:0 0 8px;">
        Questions? <a href="mailto:gritclubhq@gmail.com" style="color:#3B82F6;text-decoration:none;">gritclubhq@gmail.com</a>
      </p>
      <p style="color:#3D4F6E;font-size:11px;margin:0;">
        © 2026 GritClub · <a href="${appUrl || 'https://gritclub.live'}/terms" style="color:#3D4F6E;">Terms</a> · <a href="${appUrl || 'https://gritclub.live'}/privacy" style="color:#3D4F6E;">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>`
    }

    // ── PAID TICKET CONFIRMATION ──────────────────────────────────
    else if (type === 'paid_ticket') {
      const { eventTitle, eventDate, eventTime, hostName, userName, ticketId, amount, appUrl } = data
      subject = `🎟️ Ticket Confirmed: ${eventTitle}`
      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">

    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:26px;font-weight:800;color:#F0F4FF;">Grit<span style="color:#F59E0B;">Club</span></span>
    </div>

    <div style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
      <div style="height:4px;background:linear-gradient(to right,#F59E0B,#F97316);"></div>

      <div style="padding:32px;">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(245,158,11,0.12);border:2px solid rgba(245,158,11,0.3);margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;">🎟️</span>
        </div>

        <h1 style="color:#F0F4FF;font-size:22px;font-weight:800;text-align:center;margin:0 0 8px;">
          Payment Confirmed!
        </h1>
        <p style="color:#7B8DB0;font-size:14px;text-align:center;margin:0 0 28px;">
          Hi ${userName || 'there'}, your ticket is ready:
        </p>

        <div style="background:#0D1428;border-radius:14px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
          <p style="color:#F0F4FF;font-size:18px;font-weight:700;margin:0 0 12px;">${eventTitle}</p>
          ${eventDate ? `<p style="color:#7B8DB0;font-size:13px;margin:0 0 6px;">📅 ${eventDate}${eventTime ? ' · ' + eventTime : ''}</p>` : ''}
          ${hostName ? `<p style="color:#7B8DB0;font-size:13px;margin:0 0 6px;">🎤 Hosted by ${hostName}</p>` : ''}
          <p style="color:#7B8DB0;font-size:13px;margin:0;">💳 Amount paid: <span style="color:#F59E0B;font-weight:700;">$${amount ? (amount/100).toFixed(2) : '0.00'}</span></p>
        </div>

        ${ticketId ? `
        <div style="background:rgba(245,158,11,0.06);border-radius:10px;padding:12px 16px;margin-bottom:24px;border:1px solid rgba(245,158,11,0.15);text-align:center;">
          <p style="color:#3D4F6E;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">Ticket ID</p>
          <p style="color:#F59E0B;font-size:13px;font-family:monospace;margin:0;font-weight:600;">${ticketId.slice(0,8).toUpperCase()}</p>
        </div>` : ''}

        <div style="text-align:center;">
          <a href="${appUrl || 'https://gritclub.live'}/dashboard/tickets"
            style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#F59E0B,#F97316);color:#0A0F1E;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">
            View My Tickets →
          </a>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;">
      <p style="color:#3D4F6E;font-size:12px;margin:0 0 8px;">
        Questions? <a href="mailto:gritclubhq@gmail.com" style="color:#3B82F6;text-decoration:none;">gritclubhq@gmail.com</a>
      </p>
      <p style="color:#3D4F6E;font-size:11px;margin:0;">© 2026 GritClub</p>
    </div>
  </div>
</body>
</html>`
    }

    else {
      return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    // ── Send via Resend ──────────────────────────────────────────
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend error:', result)
      return NextResponse.json({ error: result.message || 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id })

  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
