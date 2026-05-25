import type { Suggestion } from '../types';

interface RoomGroup {
  label: string;
  note: string;
  rooms: string[];
}

const RANK_LABEL: Record<Suggestion['rank'], string> = {
  'primary-mw': 'Recommended (Mon/Wed)',
  'primary-tth': 'Recommended (Tue/Thu)',
  'alt-1': 'Alternative',
  'alt-2': 'Alternative',
};

function escapeCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toRow(cells: (string | number)[]): string {
  return cells.map(escapeCell).join(',');
}

// Serializes the algorithm suggestions and recommended rooms into a CSV file
// and triggers a browser download.
export function exportResultsCsv(suggestions: Suggestion[], roomGroups: RoomGroup[]): void {
  const lines: string[] = [];

  lines.push('Recommendations');
  lines.push(toRow(['Type', 'Days', 'Start', 'End', 'Free % of eligible', 'On-campus (approx)']));
  for (const s of suggestions) {
    const days = s.pairedDay ? `${s.day}/${s.pairedDay}` : s.day;
    lines.push(toRow([
      RANK_LABEL[s.rank],
      days,
      s.startTime,
      s.endTime,
      `${Math.round(s.rawFreePercent)}%`,
      s.onCampusCount,
    ]));
  }

  lines.push('');
  lines.push('Recommended Rooms');
  lines.push(toRow(['Category', 'Capacity', 'Rooms']));
  for (const g of roomGroups) {
    lines.push(toRow([g.label, g.note, g.rooms.join(' / ')]));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schedulewhen-recommendations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
