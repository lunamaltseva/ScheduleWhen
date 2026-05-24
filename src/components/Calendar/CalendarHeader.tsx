import { useApp } from '../../context/AppContext';
import { ArrowLeft, ChevronLeft, ChevronRight } from '../Icons';
import { SEMESTER_START, SEMESTER_END } from '../../constants';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function getCurrentMonday(): Date {
  const now = new Date();
  const dow = now.getDay();
  const d = new Date(now);
  d.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getOffsetBounds(): { min: number; max: number } {
  const currentMonday = getCurrentMonday();
  const semesterStartOffset = Math.round((SEMESTER_START.getTime() - currentMonday.getTime()) / MS_PER_WEEK);
  const semesterEndOffset = Math.round((SEMESTER_END.getTime() - currentMonday.getTime()) / MS_PER_WEEK);
  return {
    // Can't go before today's week OR semester start — whichever is later
    min: Math.max(0, semesterStartOffset),
    max: semesterEndOffset,
  };
}

function getWeekMonday(offset: number): Date {
  const currentMonday = getCurrentMonday();
  const d = new Date(currentMonday);
  d.setDate(currentMonday.getDate() + offset * 7);
  return d;
}

function getMonthLabel(offset: number): string {
  const monday = getWeekMonday(offset);
  return `${MONTHS[monday.getMonth()]} ${monday.getFullYear()}`;
}

function getWeeksAheadLabel(offset: number): string {
  if (offset === 0) return 'This week';
  return `${offset} week${offset === 1 ? '' : 's'} ahead`;
}

const FIRST_WEEK_MONDAY = new Date(2026, 8, 14); // Monday Sept 14 = Week 1 of Fall 2026

function getSemesterWeek(offset: number): number | null {
  const monday = getWeekMonday(offset);
  if (monday > SEMESTER_END) return null;
  const diffMs = monday.getTime() - FIRST_WEEK_MONDAY.getTime();
  if (diffMs < 0) return null;
  return Math.floor(diffMs / MS_PER_WEEK) + 1;
}

interface CalendarHeaderProps {
  showBackButton?: boolean;
}

export default function CalendarHeader({ showBackButton = false }: CalendarHeaderProps) {
  const { state, dispatch } = useApp();
  const { min: minOffset, max: maxOffset } = getOffsetBounds();

  const canGoBack = state.weekOffset > minOffset;
  const canGoForward = state.weekOffset < maxOffset;
  const semesterWeek = getSemesterWeek(state.weekOffset);

  function setOffset(v: number) {
    dispatch({ type: 'SET_WEEK_OFFSET', value: Math.min(Math.max(v, minOffset), maxOffset) });
  }

  return (
    <div className="bg-brand-blue px-5 h-[72px] flex items-center justify-between flex-none">
      {showBackButton ? (
        <>
          <button
            onClick={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'sidebar' })}
            className="flex items-center gap-1.5 text-white text-sm font-medium hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <p className="text-white text-base font-semibold">{getMonthLabel(state.weekOffset)}</p>
          <div className="flex rounded-full overflow-hidden shadow-sm border border-white/30">
            <button
              onClick={() => setOffset(state.weekOffset - 1)}
              disabled={!canGoBack}
              className="flex items-center justify-center bg-white text-brand-blue px-3 py-2 border-r border-brand-gray/40 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOffset(state.weekOffset + 1)}
              disabled={!canGoForward}
              className="flex items-center justify-center bg-white text-brand-blue px-3 py-2 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Left: navigation + month */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOffset(minOffset)}
              className="h-9 flex items-center bg-white text-brand-blue text-sm font-bold px-4 rounded-full hover:bg-blue-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Today
            </button>
            <div className="h-9 flex rounded-full overflow-hidden shadow-sm border border-white/30">
              <button
                onClick={() => setOffset(state.weekOffset - 1)}
                disabled={!canGoBack}
                className="h-full flex items-center justify-center bg-white text-brand-blue px-3 border-r border-brand-gray/40 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue/50"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOffset(state.weekOffset + 1)}
                disabled={!canGoForward}
                className="h-full flex items-center justify-center bg-white text-brand-blue px-3 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue/50"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white text-base font-bold">{getMonthLabel(state.weekOffset)}</p>
            {semesterWeek !== null && (
              <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full leading-none">
                Week {semesterWeek}
              </span>
            )}
          </div>

          {/* Right: weeks ahead */}
          <p className="text-blue-200 text-sm font-medium">{getWeeksAheadLabel(state.weekOffset)}</p>
        </>
      )}
    </div>
  );
}
