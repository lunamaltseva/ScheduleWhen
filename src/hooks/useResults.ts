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

// Heatmap background: shows free% among on-campus students at each class slot.
// Students with no classes on a given day are excluded (not on campus).
export function useResults(): { heatmap: Record<string, number> } {
  const { state } = useApp();
  const { selectedDays, filters, students } = state;

  return useMemo(() => {
    const activeDayIndices = selectedDays
      .map((on, i) => (on ? i : -1))
      .filter(i => i >= 0);

    const isDefaultOnly =
      filters.length === 1 && filters[0].id === 'default' && filters[0].depts.length === 0;
    const filterGroups = isDefaultOnly
      ? [students]
      : filters.map(f => students.filter(s => matchesFilter(s, f)));

    const heatmap: Record<string, number> = {};

    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];

      for (const slot of CLASS_SLOTS) {
        const key      = `${day}-${slot}`;
        const slotStart = toMinutes(slot);
        const slotEnd   = slotStart + 75;

        let totalOnCampus = 0;
        let totalFree     = 0;

        for (const group of filterGroups) {
          for (const student of group) {
            const onCampus = student.periods.some(p => p.day === day);
            if (!onCampus) continue;
            totalOnCampus++;
            const busy = student.periods.some(
              p => p.day === day && p.startMin < slotEnd && p.endMin > slotStart,
            );
            if (!busy) totalFree++;
          }
        }

        heatmap[key] = totalOnCampus > 0
          ? Math.round((totalFree / totalOnCampus) * 100)
          : 0;
      }
    }

    return { heatmap };
  }, [selectedDays, filters, students]);
}
