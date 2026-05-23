import { useApp } from '../../context/AppContext';
import { ArrowLeft } from '../Icons';
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

interface CalendarHeaderProps {
  showBackButton?: boolean;
}

export default function CalendarHeader({ showBackButton = false }: CalendarHeaderProps) {
  const { state, dispatch } = useApp();
  const { min: minOffset, max: maxOffset } = getOffsetBounds();

  const canGoBack = state.weekOffset > minOffset;
  const canGoForward = state.weekOffset < maxOffset;

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
          <div className="w-16" />
        </>
      ) : (
        <>
          {/* Left: navigation + month */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOffset(minOffset)}
              className="h-9 flex items-center bg-white text-brand-blue text-sm font-bold px-4 rounded-full hover:bg-blue-50 transition-colors shadow-sm"
            >
              Today
            </button>
            <div className="h-9 flex rounded-full overflow-hidden shadow-sm border border-white/30">
              <button
                onClick={() => setOffset(state.weekOffset - 1)}
                disabled={!canGoBack}
                className="h-full flex items-center bg-white text-brand-blue px-3.5 text-base font-bold border-r border-brand-gray/40 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous week"
              >
                ‹
              </button>
              <button
                onClick={() => setOffset(state.weekOffset + 1)}
                disabled={!canGoForward}
                className="h-full flex items-center bg-white text-brand-blue px-3.5 text-base font-bold hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next week"
              >
                ›
              </button>
            </div>
            <p className="text-white text-base font-bold">{getMonthLabel(state.weekOffset)}</p>
          </div>

          {/* Right: weeks ahead */}
          <p className="text-blue-200 text-sm font-medium">{getWeeksAheadLabel(state.weekOffset)}</p>
        </>
      )}
    </div>
  );
}
