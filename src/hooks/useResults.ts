import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { STUDENTS } from '../data/synthetic';
import { CLASS_SLOTS, DAYS_FULL, PRIORITY_RANGES } from '../constants';
import type { Filter, Recommendation } from '../types';
import type { ClassSlot } from '../constants';

const ALL_SLOT_INDICES = CLASS_SLOTS.map((_, i) => i);

function matchesFilter(
  student: { dept: string; year: string; international: boolean },
  filter: Filter,
): boolean {
  if (filter.depts.length > 0 && !filter.depts.includes(student.dept)) return false;
  if (filter.years.length > 0 && !filter.years.includes(student.year)) return false;
  if (filter.status === 'domestic' && student.international) return false;
  if (filter.status === 'international' && !student.international) return false;
  return true;
}

function addMinutes(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export interface ResultsOutput {
  recommendations: Recommendation[];
  heatmap: Record<string, number>;
}

export function useResults(): ResultsOutput {
  const { state } = useApp();
  const { selectedDays, timePeriods, duration, filters } = state;

  return useMemo(() => {
    const activeDayIndices = selectedDays
      .map((on, i) => (on ? i : -1))
      .filter(i => i >= 0);

    // Union of selected period slot indices; empty = all slots
    const prioritySlotIndices: number[] = timePeriods.length === 0
      ? ALL_SLOT_INDICES
      : [...new Set(timePeriods.flatMap(p => [...(PRIORITY_RANGES[p] ?? [])]))];

    const filterGroups = filters.map(f => ({
      filter: f,
      students: STUDENTS.filter(s => matchesFilter(s, f)),
    }));

    const effectiveGroups = filterGroups.length > 0
      ? filterGroups
      : [{ filter: { id: '', depts: [], years: [], status: 'any' as const }, students: STUDENTS }];

    const heatmap: Record<string, number> = {};
    const scores: Array<{ key: string; day: string; slot: ClassSlot; score: number; eligible: number }> = [];

    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      for (let slotIdx = 0; slotIdx < CLASS_SLOTS.length; slotIdx++) {
        const slot = CLASS_SLOTS[slotIdx];
        const key = `${day}-${slot}`;

        let totalFree = 0;
        let totalStudents = 0;

        for (const { students } of effectiveGroups) {
          if (students.length === 0) continue;
          const freeCount = students.filter(s => !s.occupied.has(key)).length;
          totalFree += freeCount;
          totalStudents += students.length;
        }

        const avgFree = totalStudents > 0 ? (totalFree / totalStudents) * 100 : 0;
        heatmap[key] = Math.round(avgFree);

        if (prioritySlotIndices.includes(slotIdx)) {
          scores.push({ key, day, slot, score: avgFree, eligible: totalFree });
        }
      }
    }

    scores.sort((a, b) => b.score - a.score);

    const recommendations: Recommendation[] = scores.slice(0, 4).map(r => ({
      day: r.day,
      slot: r.slot,
      endTime: addMinutes(r.slot, duration),
      freePercent: r.score,
      eligibleCount: r.eligible,
    }));

    return { recommendations, heatmap };
  }, [selectedDays, timePeriods, duration, filters]);
}
