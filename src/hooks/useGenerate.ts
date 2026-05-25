import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { runAlgorithm } from '../algorithm/score';
import { SEMESTER_START_ISO, SEMESTER_END_ISO, DAYS_FULL } from '../constants';
import type { AcademicEvent } from '../data/parseCalendar';

// ── Date helpers (local-time safe) ────────────────────────────────────────────

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

function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isNoClassesDate(iso: string, events: AcademicEvent[]): boolean {
  return events.some(e => e.kind === 'no-classes' && iso >= e.start && iso < e.end);
}

// Returns a filtered copy of selectedDays with blocked dates zeroed out,
// plus a human-readable reason if everything is blocked.
function filterBlockedDays(
  selectedDays: boolean[],
  weekOffset: number,
  academicEvents: AcademicEvent[],
): { filtered: boolean[]; allBlocked: boolean; reason: string } {
  const weekDates = getWeekDates(weekOffset);

  const filtered = selectedDays.map((on, i) => {
    if (!on) return false;
    const iso = localDateToISO(weekDates[i]);
    if (iso < SEMESTER_START_ISO || iso > SEMESTER_END_ISO) return false;
    if (isNoClassesDate(iso, academicEvents)) return false;
    return true;
  });

  const allBlocked = filtered.every(d => !d);

  let reason = 'No classes are scheduled on any of the selected days this week.';
  if (allBlocked) {
    const anyInSemester = selectedDays.some((on, i) => {
      if (!on) return false;
      const iso = localDateToISO(weekDates[i]);
      return iso >= SEMESTER_START_ISO && iso <= SEMESTER_END_ISO;
    });
    if (!anyInSemester) {
      reason = 'The selected week falls outside the Fall 2026 semester (September 15 – December 31). Navigate to a week within the semester to generate suggestions.';
    } else {
      reason = 'All selected days this week fall on a holiday or academic break. Try a different week or deselect the affected days.';
    }
  }

  return { filtered, allBlocked, reason };
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

// ── Hook ──────────────────────────────────────────────────────────────────────
// Returns a stable `generate` callback that runs the algorithm with the current
// state. Used by the Generate button (manual) and the AutoRegen component (auto).

export function useGenerate() {
  const { state, dispatch } = useApp();
  const {
    selectedDays, weekOffset, academicEvents, students, filters,
    duration, timePeriods, targetParticipants, fixedStartMin,
  } = state;

  return useCallback((opts?: { onAfter?: () => void }) => {
    const { filtered, allBlocked, reason } = filterBlockedDays(selectedDays, weekOffset, academicEvents);

    if (allBlocked) {
      dispatch({ type: 'SET_NO_TIMESLOT_BANNER', message: reason });
      return;
    }

    const fiftyMinDays = getFiftyMinDays(weekOffset, academicEvents);
    const result = runAlgorithm(
      students, filters, duration, filtered, timePeriods, targetParticipants, fiftyMinDays, fixedStartMin,
    );
    dispatch({ type: 'SET_ALGORITHM_RESULT', result });
    opts?.onAfter?.();
  }, [students, filters, duration, selectedDays, timePeriods, targetParticipants, weekOffset, academicEvents, fixedStartMin, dispatch]);
}
