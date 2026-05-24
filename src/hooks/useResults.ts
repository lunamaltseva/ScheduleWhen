import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CLASS_SLOTS, DAYS_FULL } from '../constants';
import { toMinutes, STD_TO_50MIN } from '../algorithm/score';
import type { Filter, Student } from '../types';
import type { AcademicEvent } from '../data/parseCalendar';

function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDates(weekOffset: number): Date[] {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getFiftyMinDays(weekOffset: number, academicEvents: AcademicEvent[]): Set<string> {
  const weekDates = getWeekDates(weekOffset);
  const result = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const iso = localDateToISO(weekDates[i]);
    if (academicEvents.some(e => e.kind === '50min-classes' && iso >= e.start && iso < e.end)) {
      result.add(DAYS_FULL[i]);
    }
  }
  return result;
}

function remapPeriods(
  student: Student,
  day: string,
): Array<{ day: string; startMin: number; endMin: number }> {
  return student.periods
    .filter(p => p.day === day)
    .map(p => {
      const newStart = STD_TO_50MIN[p.startMin] ?? p.startMin;
      return { day, startMin: newStart, endMin: newStart + 50 };
    });
}

function matchesFilter(student: Student, filter: Filter): boolean {
  if (filter.depts.length > 0 && !filter.depts.includes(student.dept)) return false;
  if (filter.years.length > 0 && !filter.years.includes(student.year)) return false;
  if (filter.status === 'domestic'      && student.international)  return false;
  if (filter.status === 'international' && !student.international) return false;
  return true;
}

// Mirror getEligibleStudents from score.ts: union across filters, no double-counting.
function getEligible(students: Student[], filters: Filter[]): Student[] {
  const isDefaultOnly =
    filters.length === 1 && filters[0].id === 'default' && filters[0].depts.length === 0;
  if (isDefaultOnly) return students;
  return students.filter(s => filters.some(f => matchesFilter(s, f)));
}

export interface HeatmapCellData {
  freePercent: number;        // % of eligible students who are present AND free at this slot
  presentAndFreeCount: number;// absolute count: on campus at slot start AND no class conflict
  presentNow: number;         // students whose first→last class span includes this slot start
  onCampusDay: number;        // students with any class on this day (among eligible)
  eligibleTotal: number;      // total eligible students (denominator)
}

export function useResults(): {
  heatmap: Record<string, number>;
  cellData: Record<string, HeatmapCellData>;
  eligibleStudents: Student[];
  fiftyMinDays: Set<string>;
} {
  const { state } = useApp();
  const { selectedDays, filters, students, weekOffset, academicEvents } = state;

  return useMemo(() => {
    const activeDayIndices = selectedDays
      .map((on, i) => (on ? i : -1))
      .filter(i => i >= 0);

    // Use the same union logic as the algorithm — no double-counting across filters
    const eligible = getEligible(students, filters);

    // 50-min class days use compressed schedules — remap periods accordingly
    const fiftyMinDays = getFiftyMinDays(weekOffset, academicEvents);

    const heatmap: Record<string, number> = {};
    const cellData: Record<string, HeatmapCellData> = {};

    // On-campus count for the whole day — for tooltip context only.
    const onCampusDayMap: Record<string, number> = {};
    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      onCampusDayMap[day] = eligible.filter(s => s.periods.some(p => p.day === day)).length;
    }

    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      const onCampusDay = onCampusDayMap[day];
      const isFiftyMin = fiftyMinDays.has(day);

      for (const slot of CLASS_SLOTS) {
        const key       = `${day}-${slot}`;
        const slotStart = toMinutes(slot);
        const slotEnd   = slotStart + 75;

        let totalPresent       = 0;
        let presentAndFreeCount = 0;

        for (const student of eligible) {
          // On 50-min days use remapped (compressed) periods for accurate conflict detection
          const dayPeriods = isFiftyMin
            ? remapPeriods(student, day)
            : student.periods.filter(p => p.day === day);

          if (dayPeriods.length === 0) continue;

          // Present = student's campus span with realistic buffers:
          // arrive 30 min before first class, stay 90 min after last class ends.
          const rawArrival   = dayPeriods.reduce((m, p) => Math.min(m, p.startMin), Infinity);
          const rawDeparture = dayPeriods.reduce((m, p) => Math.max(m, p.endMin), -Infinity);
          const arrival   = rawArrival   - 30;
          const departure = rawDeparture + 90;
          if (arrival > slotStart || departure <= slotStart) continue;

          totalPresent++;

          const busy = dayPeriods.some(p => p.startMin < slotEnd && p.endMin > slotStart);
          if (!busy) presentAndFreeCount++;
        }

        // Primary metric: students who are physically present AND have no class conflict,
        // expressed as a % of all eligible students.
        const freePercent = eligible.length > 0
          ? Math.round((presentAndFreeCount / eligible.length) * 100)
          : 0;

        heatmap[key] = freePercent;

        cellData[key] = {
          freePercent,
          presentAndFreeCount,
          presentNow:   totalPresent,
          onCampusDay,
          eligibleTotal: eligible.length,
        };
      }
    }

    return { heatmap, cellData, eligibleStudents: eligible, fiftyMinDays };
  }, [selectedDays, filters, students, weekOffset, academicEvents]);
}
