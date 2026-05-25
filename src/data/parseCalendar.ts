export type AcademicEventKind = 'no-classes' | '50min-classes' | 'other';

export interface AcademicEvent {
  start: string; // YYYY-MM-DD, inclusive
  end: string;   // YYYY-MM-DD, exclusive (ICS DTEND for all-day events)
  title: string;
  kind: AcademicEventKind;
}

function classify(title: string): AcademicEventKind {
  const lower = title.toLowerCase();
  if (/no.?class(es)?/.test(lower)) return 'no-classes';
  if (lower.includes('50 min')) return '50min-classes';
  return 'other';
}

function icsToISO(d: string): string {
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

export function parseCalendar(text: string): AcademicEvent[] {
  // Unfold ICS line continuations (CRLF or LF followed by space/tab)
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const events: AcademicEvent[] = [];

  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const props: Record<string, string> = {};
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(':');
      if (colon < 1) continue;
      const key = line.slice(0, colon).split(';')[0]; // drop ;VALUE=DATE etc.
      props[key] = line.slice(colon + 1);
    }

    const { SUMMARY, DTSTART, DTEND } = props;
    if (!SUMMARY || !DTSTART) continue;

    // Skip timed events (datetime has T component); only process all-day DATE events
    if (!/^\d{8}$/.test(DTSTART)) continue;

    const start = icsToISO(DTSTART);
    const end   = DTEND && /^\d{8}$/.test(DTEND) ? icsToISO(DTEND) : start;

    events.push({ start, end, title: SUMMARY, kind: classify(SUMMARY) });
  }

  return events;
}

export async function loadCalendar(url: string): Promise<AcademicEvent[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseCalendar(await res.text());
}
