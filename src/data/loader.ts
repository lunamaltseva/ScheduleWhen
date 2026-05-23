import * as XLSX from 'xlsx';
import type { Student } from '../types';

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

const VALID_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

function parseCourseSchedule(courseStr: string): Array<{ day: string; startMin: number; endMin: number }> {
  if (!courseStr || typeof courseStr !== 'string') return [];

  // Course strings: "Name — Schedule — Credits" (em-dash separated)
  const parts = courseStr.split(/\s[—–]\s/);
  if (parts.length < 3) return [];

  const schedulePart = parts[parts.length - 2].trim();
  if (!schedulePart || schedulePart === 'Individual') return [];

  const result: Array<{ day: string; startMin: number; endMin: number }> = [];

  // Handle "Day1/Day2 HH:MM" and "Day1 HH:MM & Day2 HH:MM" patterns
  for (const entry of schedulePart.split(' & ')) {
    const m = entry.trim().match(/^([\w]+(?:\/[\w]+)*)\s+(\d{1,2}:\d{2})$/);
    if (!m) continue;
    const [, dayPart, timeStr] = m;
    const startMin = toMin(timeStr);
    const endMin = startMin + 75; // AUCA standard class length

    for (const day of dayPart.split('/')) {
      if (VALID_DAYS.has(day)) {
        result.push({ day, startMin, endMin });
      }
    }
  }

  return result;
}

export async function loadStudentsFromExcel(url: string): Promise<Student[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);

  const buffer = await response.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  const ws = wb.Sheets['Fall 2026 Students'];
  if (!ws) throw new Error('Sheet "Fall 2026 Students" not found in workbook');

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  return rows.slice(1)
    .filter(row => row[0])
    .map(row => {
      const periods: Array<{ day: string; startMin: number; endMin: number }> = [];
      for (let c = 6; c <= 15; c++) {
        const course = row[c];
        if (course && typeof course === 'string') {
          periods.push(...parseCourseSchedule(course));
        }
      }
      return {
        id: String(row[0]),
        dept: String(row[1]),
        year: String(row[3]),
        international: row[4] === 'Yes',
        periods,
      };
    });
}
