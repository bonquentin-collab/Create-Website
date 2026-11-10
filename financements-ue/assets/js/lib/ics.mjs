// Minimal iCalendar (RFC 5545) export of deadlines as all-day events.

const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Fold lines longer than 75 octets (approximated in characters). */
const foldLine = (line) => {
  const parts = [];
  for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73));
  return parts.join('\r\n');
};

export function toIcs(items, { name = 'Clôtures des financements UE', now = new Date() } = {}) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EU Funding Gateway//FR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(name)}`];
  for (const o of items) {
    if (!o.deadline) continue;
    const day = o.deadline.replace(/-/g, '');
    const next = new Date(`${o.deadline}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${esc(o.id)}@eu-funding-gateway`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, '')}`,
      `SUMMARY:${esc(`Clôture : ${o.title}`)}`,
      `DESCRIPTION:${esc(`${o.programme || ''}${o.ref ? ` · ${o.ref}` : ''}\nVérifiez l’heure exacte sur la page officielle.\n${o.url}`)}`,
      `URL:${esc(o.url)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export function downloadIcs(items, filename = 'clotures-financements-ue.ics', opts) {
  const blob = new Blob([toIcs(items, opts)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
