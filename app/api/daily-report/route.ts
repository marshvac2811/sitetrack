import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildReportHtml, buildReportText } from '@/lib/report';

// Uses the service-level Supabase client (server-side only — safe to use the anon key here too
// since our tables have RLS disabled for now).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  // Optional protection for the automatic cron trigger — see CRON_SECRET in README.
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sites, error } = await supabase.from('site_overview').select('*').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sites || sites.length === 0) return NextResponse.json({ message: 'No sites to report' });

  const html = buildReportHtml(sites);
  const text = buildReportText(sites);

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;

  if (!resendKey || !to) {
    return NextResponse.json({ error: 'RESEND_API_KEY or REPORT_EMAIL_TO not configured' }, { status: 500 });
  }

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SiteTrack <onboarding@resend.dev>',
      to: to.split(',').map((e) => e.trim()),
      subject: `Mysticape Daily Site Report — ${new Date().toLocaleDateString('en-IN')}`,
      html,
      text,
    }),
  });

  if (!emailRes.ok) {
    const errText = await emailRes.text();
    return NextResponse.json({ error: `Resend failed: ${errText}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, sitesReported: sites.length });
}
