import { useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { runAlgorithm } from '../../algorithm/score';
import { SEMESTER_START_ISO, SEMESTER_END_ISO, DAYS_FULL } from '../../constants';
import { ChatbotIcon } from '../Icons';
import type { AcademicEvent } from '../../data/parseCalendar';

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function GenerateButton({ mobileMode = false, onAfterGenerate }: { mobileMode?: boolean; onAfterGenerate?: () => void }) {
  const { state, dispatch } = useApp();
  const {
    isDirty, algorithmResult, autoRegen,
    duration, selectedDays, timePeriods, filters, students, targetParticipants,
    dataState, weekOffset, academicEvents,
  } = state;

  const handleGenerate = useCallback(() => {
    const { filtered, allBlocked, reason } = filterBlockedDays(selectedDays, weekOffset, academicEvents);

    if (allBlocked) {
      dispatch({ type: 'SET_NO_TIMESLOT_BANNER', message: reason });
      return;
    }

    const fiftyMinDays = getFiftyMinDays(weekOffset, academicEvents);
    const result = runAlgorithm(students, filters, duration, filtered, timePeriods, targetParticipants, fiftyMinDays);
    dispatch({ type: 'SET_ALGORITHM_RESULT', result });
    onAfterGenerate?.();
  }, [students, filters, duration, selectedDays, timePeriods, targetParticipants, weekOffset, academicEvents, dispatch, onAfterGenerate]);

  useEffect(() => {
    if (autoRegen && isDirty && dataState === 'loaded') {
      handleGenerate();
    }
  }, [autoRegen, isDirty, dataState, handleGenerate]);

  function handleExplainWhy() {
    if (!algorithmResult) return;
    dispatch({ type: 'OPEN_CHAT' });
    dispatch({ type: 'SET_PENDING_PROMPT', prompt: 'Please explain why this time slot was recommended.' });
    if (mobileMode) dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' });
  }

  const showGenerate = isDirty || !algorithmResult;

  return (
    <div className="flex flex-col gap-2">
      {showGenerate ? (
        <button
          onClick={handleGenerate}
          disabled={dataState !== 'loaded'}
          className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {dataState === 'loading' ? 'Loading data…' : 'Generate'}
        </button>
      ) : (
        <button
          onClick={handleExplainWhy}
          className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <ChatbotIcon />
          Explain why
        </button>
      )}

      {algorithmResult !== null && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_REGEN' })}
          className={`w-full py-2 rounded-xl text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:ring-offset-1 ${
            autoRegen
              ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
              : 'bg-white border-brand-gray text-gray-500 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          {autoRegen ? '⟳ Auto-update: On' : '⟳ Auto-update: Off'}
        </button>
      )}
    </div>
  );
}
