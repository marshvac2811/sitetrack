// Builds the daily report content shared by both email and WhatsApp share.

export type ReportSite = {
  name: string;
  client: string | null;
  status: string;
  materials_pending: number;
  latest_cash_in_hand: number | null;
  latest_cash_required: number | null;
  tentative_completion_date: string | null;
};

function daysLeft(target: string | null): number | null {
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(target).getTime() - today.getTime()) / 86400000);
}

export function buildReportText(sites: ReportSite[]): string {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const lines = [`Mysticape Concepts — Daily Site Report — ${today}`, ''];

  sites.forEach((s) => {
    const inHand = s.latest_cash_in_hand ?? 0;
    const required = s.latest_cash_required ?? 0;
    const delta = inHand - required;
    const dLeft = daysLeft(s.tentative_completion_date);
    lines.push(`• ${s.name}${s.client ? ` (${s.client})` : ''} — ${s.status.replace('_', ' ')}`);
    lines.push(`  Materials pending: ${s.materials_pending}`);
    lines.push(`  Cash: ₹${inHand.toLocaleString('en-IN')} in hand vs ₹${required.toLocaleString('en-IN')} required (${delta >= 0 ? 'surplus' : 'SHORTFALL'} ₹${Math.abs(delta).toLocaleString('en-IN')})`);
    lines.push(`  Days left: ${dLeft === null ? '—' : dLeft < 0 ? `${Math.abs(dLeft)} OVERDUE` : dLeft}`);
    lines.push('');
  });

  const totalPending = sites.reduce((s, x) => s + x.materials_pending, 0);
  const totalDelta = sites.reduce((s, x) => s + (x.latest_cash_in_hand ?? 0) - (x.latest_cash_required ?? 0), 0);
  lines.push(`Summary: ${sites.length} sites | ${totalPending} materials pending | ${totalDelta >= 0 ? 'net surplus' : 'net SHORTFALL'} ₹${Math.abs(totalDelta).toLocaleString('en-IN')}`);

  return lines.join('\n');
}

export function buildReportHtml(sites: ReportSite[]): string {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const rows = sites.map((s) => {
    const inHand = s.latest_cash_in_hand ?? 0;
    const required = s.latest_cash_required ?? 0;
    const delta = inHand - required;
    const dLeft = daysLeft(s.tentative_completion_date);
    const dLeftText = dLeft === null ? '—' : dLeft < 0 ? `<b style="color:#b91c1c">${Math.abs(dLeft)}d overdue</b>` : `${dLeft}d left`;
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e6dfd0"><b>${s.name}</b><br><span style="color:#5c5346;font-size:12px">${s.client ?? ''}</span></td>
        <td style="padding:8px;border-bottom:1px solid #e6dfd0;text-transform:capitalize">${s.status.replace('_', ' ')}</td>
        <td style="padding:8px;border-bottom:1px solid #e6dfd0;text-align:right">${s.materials_pending}</td>
        <td style="padding:8px;border-bottom:1px solid #e6dfd0;text-align:right;color:${delta >= 0 ? '#047857' : '#b91c1c'}">₹${Math.abs(delta).toLocaleString('en-IN')} ${delta >= 0 ? 'surplus' : 'short'}</td>
        <td style="padding:8px;border-bottom:1px solid #e6dfd0;text-align:right">${dLeftText}</td>
      </tr>`;
  }).join('');

  return `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
    <div style="background:#2b2622;color:#f0ead9;padding:20px">
      <p style="margin:0;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#c9a15a">Mysticape Concepts</p>
      <h2 style="margin:4px 0 0">Daily Site Report — ${today}</h2>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f7f4ef;color:#5c5346;font-size:11px;text-transform:uppercase">
          <th style="padding:8px;text-align:left">Site</th>
          <th style="padding:8px;text-align:left">Status</th>
          <th style="padding:8px;text-align:right">Materials pending</th>
          <th style="padding:8px;text-align:right">Cash position</th>
          <th style="padding:8px;text-align:right">Days left</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#5c5346;font-size:12px;padding:12px 8px">Sent automatically from SiteTrack.</p>
  </div>`;
}
