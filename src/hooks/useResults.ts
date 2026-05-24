import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CLASS_SLOTS, DAYS_FULL } from '../constants';
import { toMinutes } from '../algorithm/score';
import type { Filter, Student } from '../types';

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
  freePercent: number;   // % of on-campus students who are free at this slot
  onCampusDay: number;   // students with any class on this day (among eligible)
  presentNow: number;    // students whose first→last class span includes this slot start
  freeCount: number;     // absolute count of free on-campus students
  totalOnCampus: number; // on-campus students at this slot (= onCampusDay, stored per-cell for convenience)
}

export function useResults(): {
  heatmap: Record<string, number>;
  cellData: Record<string, HeatmapCellData>;
} {
  const { state } = useApp();
  const { selectedDays, filters, students } = state;

  return useMemo(() => {
    const activeDayIndices = selectedDays
      .map((on, i) => (on ? i : -1))
      .filter(i => i >= 0);

    // Use the same union logic as the algorithm — no double-counting across filters
    const eligible = getEligible(students, filters);

    const heatmap: Record<string, number> = {};
    const cellData: Record<string, HeatmapCellData> = {};

    // On-campus count for the whole day — computed once per day, not per slot.
    // This is the denominator used by both the heatmap and the algorithm.
    const onCampusDayMap: Record<string, number> = {};
    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      onCampusDayMap[day] = eligible.filter(s => s.periods.some(p => p.day === day)).length;
    }

    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      const onCampusDay = onCampusDayMap[day];

      for (const slot of CLASS_SLOTS) {
        const key       = `${day}-${slot}`;
        const slotStart = toMinutes(slot);
        const slotEnd   = slotStart + 75;

        let freeCount    = 0;
        let totalPresent = 0;

        for (const student of eligible) {
          const dayPeriods = student.periods.filter(p => p.day === day);
          if (dayPeriods.length === 0) continue;

          const busy = dayPeriods.some(
            p => p.startMin < slotEnd && p.endMin > slotStart,
          );
          if (!busy) freeCount++;

          // Present: student's campus span (first arrival → last departure) covers slotStart
          const arrival   = dayPeriods.reduce((m, p) => Math.min(m, p.startMin), Infinity);
          const departure = dayPeriods.reduce((m, p) => Math.max(m, p.endMin), -Infinity);
          if (arrival <= slotStart && departure > slotStart) totalPresent++;
        }

        // Denominator = on-campus students (matching algorithm's scoreWindow)
        const freePercent = onCampusDay > 0
          ? Math.round((freeCount / onCampusDay) * 100)
          : 0;

        heatmap[key] = freePercent;

        cellData[key] = {
          freePercent,
          onCampusDay,
          presentNow:    totalPresent,
          freeCount,
          totalOnCampus: onCampusDay,
        };
      }
    }

    return { heatmap, cellData };
  }, [selectedDays, filters, students]);
}
