import type { AcademicEvent } from '../../data/parseCalendar';

interface Props {
  events: AcademicEvent[];
  activeDayIndices: number[];  // e.g. [0,1,2,3,4] for Mon–Fri
  weekDates: Date[];           // 6 Date objects, index = day-of-week (Mon=0..Sat=5)
  timeColW: number;
}

interface PlacedEvent {
  event: AcademicEvent;
  startCol: number;  // 0-based column index into activeDayIndices
  endCol: number;    // inclusive
  row: number;
  startsInView: boolean;
  endsInView: boolean;
}

// Use local date parts — toISOString() returns UTC and would give the wrong date
// in timezones ahead of UTC (e.g., UTC+6 midnight = previous day UTC).
function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Add n days to a local-ISO string (avoids creating Date objects from ISO strings,
// which JavaScript parses as UTC and causes timezone skew).
function addDaysToISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return localDateToISO(new Date(y, m - 1, d + n));
}

function packRows(placed: Omit<PlacedEvent, 'row'>[]): PlacedEvent[] {
  const result: PlacedEvent[] = [];
  const rowEnds: number[] = [];

  for (const item of placed) {
    let row = rowEnds.findIndex(end => end < item.startCol);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(item.endCol);
    } else {
      rowEnds[row] = item.endCol;
    }
    result.push({ ...item, row });
  }
  return result;
}

const KIND_STYLE: Record<string, string> = {
  'no-classes':    'bg-red-500 text-white',
  '50min-classes': 'bg-amber-500 text-white',
  'other':         'bg-brand-blue text-white',
};

export default function AllDayRow({ events, activeDayIndices, weekDates, timeColW }: Props) {
  const numCols = activeDayIndices.length;

  // Map each active-day-column index to its ISO date string (local time)
  const colDates = activeDayIndices.map(dayIdx => localDateToISO(weekDates[dayIdx]));

  // For each event, determine which columns it spans
  const unplaced: Omit<PlacedEvent, 'row'>[] = [];
  for (const event of events) {
    // Find first and last column that this event covers
    let startCol = -1;
    let endCol   = -1;
    let startsInView = false;
    let endsInView   = false;

    for (let c = 0; c < numCols; c++) {
      const iso = colDates[c];
      // Event covers this date if start <= iso < end (DTEND is exclusive)
      if (iso >= event.start && iso < event.end) {
        if (startCol === -1) {
          startCol = c;
          startsInView = iso === event.start;
        }
        endCol = c;
      }
    }
    if (startCol === -1) continue; // event not visible this week

    // Event ends within view if the day after the last visible column >= event's exclusive end
    endsInView = addDaysToISO(colDates[endCol], 1) >= event.end;

    unplaced.push({ event, startCol, endCol, startsInView, endsInView });
  }

  // Sort by startCol for greedy packing
  unplaced.sort((a, b) => a.startCol - b.startCol || a.endCol - b.endCol);
  const placed = packRows(unplaced);

  const numRows = placed.length > 0 ? Math.max(...placed.map(p => p.row)) + 1 : 0;
  const rowH = 22;
  const padV = 2;
  const height = numRows > 0 ? numRows * rowH + padV * 2 : padV;

  if (numCols === 0) return null;

  return (
    <div
      className="flex-none border-b border-brand-gray/40 relative overflow-hidden"
      style={{ height }}
    >
      {placed.map((p, i) => {
        // left: timeColW + startCol columns
        // width: (endCol - startCol + 1) columns, each = (100% - timeColW) / numCols
        const colW = `(100% - ${timeColW}px) / ${numCols}`;
        const left = `${timeColW}px + ${p.startCol} * ${colW}`;
        const width = `(${p.endCol - p.startCol + 1}) * ${colW}`;

        const roundedLeft  = p.startsInView ? 'rounded-l-md' : '';
        const roundedRight = p.endsInView   ? 'rounded-r-md' : '';
        const colorClass   = KIND_STYLE[p.event.kind] ?? KIND_STYLE['other'];

        return (
          <div
            key={i}
            title={p.event.title}
            className={`absolute flex items-center px-1.5 text-[11px] font-medium overflow-hidden whitespace-nowrap ${colorClass} ${roundedLeft} ${roundedRight}`}
            style={{
              left:   `calc(${left} + 2px)`,
              width:  `calc(${width} - 4px)`,
              top:    padV + p.row * rowH,
              height: rowH - 2,
              lineHeight: `${rowH - 2}px`,
            }}
          >
            {p.event.title}
          </div>
        );
      })}
    </div>
  );
}
