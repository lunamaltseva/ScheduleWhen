import { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import { DAYS_FULL, GRID_ROWS, CLASS_SLOTS, TERMINAL_LABEL, SEMESTER_START_ISO, SEMESTER_END_ISO } from '../../constants';
import { toMinutes, fromMinutes, STD_TO_50MIN } from '../../algorithm/score';
import type { Suggestion } from '../../types';
import { StarIcon } from '../Icons';
import AllDayRow from './AllDayRow';

function getWeekMonday(offset: number): Date {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Brand-blue (#2d457c) at min availability (few free) → white (#ffffff) at max
// availability (more free), normalized over the actual range for local contrast.
function heatStyle(pct: number, min: number, max: number): React.CSSProperties {
  if (max <= min) return { backgroundColor: '#ffffff' };
  const t = Math.max(0, Math.min(1, (pct - min) / (max - min)));
  const r = Math.round(0x2d + (0xff - 0x2d) * t);
  const g = Math.round(0x45 + (0xff - 0x45) * t);
  const b = Math.round(0x7c + (0xff - 0x7c) * t);
  return { backgroundColor: `rgb(${r},${g},${b})` };
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface LiveMetrics {
  onCampus: number;
  onCampusAllDay: number;
  free: number;
  total: number;
}

type TooltipState =
  | { kind: 'cell'; timeMin: number; day: string; liveMetrics: LiveMetrics; x: number; y: number }
  | { kind: 'chip'; suggestion: Suggestion; x: number; y: number };

const TOOLTIP_H = 130;
const HEADER_H  = 80;

function positionTooltip(x: number, y: number): React.CSSProperties {
  const left     = Math.min(Math.max(x - 110, 8), window.innerWidth - 228);
  const topAbove = y - TOOLTIP_H - 10;
  const top      = topAbove >= HEADER_H ? topAbove : y + 16;
  return { position: 'fixed', left, top, zIndex: 9999, pointerEvents: 'none', width: 220 };
}

function CellTooltip({ tt, noClassesDays }: { tt: Extract<TooltipState, { kind: 'cell' }>; noClassesDays: Set<string> }) {
  const { timeMin, day, liveMetrics } = tt;
  const timeStr     = fromMinutes(Math.floor(timeMin));
  const isNoClasses = noClassesDays.has(day);
  const freePercent = liveMetrics.total > 0 ? Math.round(liveMetrics.free / liveMetrics.total * 100) : 0;

  let periodLabel: string | null = null;
  if (!isNoClasses) {
    const inSlot = CLASS_SLOTS.some(s => { const sm = toMinutes(s); return timeMin >= sm && timeMin < sm + 75; });
    if (!inSlot) {
      if (timeMin >= 725 && timeMin < 765)  periodLabel = 'Lunch break';
      else if (timeMin >= 1265)              periodLabel = 'Evening — no scheduled classes';
      else                                   periodLabel = 'Break between classes';
    }
  }

  return createPortal(
    <div style={positionTooltip(tt.x, tt.y)} className="bg-white border border-brand-gray rounded-xl shadow-xl px-3 py-2.5 text-xs">
      <p className="font-bold text-gray-800 mb-1">{day} · {timeStr}</p>
      {isNoClasses ? (
        <p className="text-gray-400 italic">No classes scheduled</p>
      ) : (
        <>
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between gap-2">
              <span>On campus today</span>
              <span className="font-semibold text-gray-800">{liveMetrics.onCampusAllDay.toLocaleString()} / {liveMetrics.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Present now</span>
              <span className="font-semibold text-gray-800">{liveMetrics.onCampus.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Present &amp; free</span>
              <span className="font-semibold text-brand-blue">{freePercent}% ({liveMetrics.free.toLocaleString()})</span>
            </div>
          </div>
          {periodLabel && (
            <p className="text-[10px] text-gray-400 italic mt-1.5 leading-tight">{periodLabel}</p>
          )}
        </>
      )}
    </div>,
    document.body,
  );
}

function ChipTooltip({ tt }: { tt: Extract<TooltipState, { kind: 'chip' }> }) {
  const s = tt.suggestion;
  const dayLabel = s.pairedDay ? `${s.day} / ${s.pairedDay}` : s.day;
  const departures = Math.round(s.factors.midEventDeparturePct * 100);
  return createPortal(
    <div style={positionTooltip(tt.x, tt.y)} className="bg-white border border-brand-gray rounded-xl shadow-xl px-3 py-2.5 text-xs">
      <p className="font-bold text-gray-800 mb-1">{dayLabel} · {s.startTime}–{s.endTime}</p>
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between gap-2">
          <span>Eligible free</span>
          <span className="font-semibold text-brand-blue">{Math.round(s.rawFreePercent)}%</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>On campus (approx)</span>
          <span className="font-semibold text-gray-800">~{s.onCampusCount.toLocaleString()}</span>
        </div>
        {departures > 0 && (
          <div className="flex justify-between gap-2">
            <span>Leave mid-event</span>
            <span className="font-semibold text-gray-800">~{departures}%</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 italic mt-1.5 leading-tight">% = share of eligible students free during the window.</p>
    </div>,
    document.body,
  );
}

const TOTAL_FR      = GRID_ROWS.reduce((sum, r) => sum + r.fr, 0); // 840 min = 8:00–22:00
const DAY_START_MIN = 480;
const NUM_DAYS      = 6;
const CHIP_MIN_PX   = 34;
const DISABLED_TINT = 'rgba(51, 60, 78, 0.42)'; // discoloration over deactivated day columns

const GRID_ROW_TEMPLATE = GRID_ROWS.map(r => `${r.fr}fr`).join(' ') + ' auto';
const TIME_COL_W = 52;

// Width thresholds for chip layout switching (hysteresis to prevent flicker).
const TO_WIDE_PX   = 104;
const TO_NARROW_PX = 88;

// Matches the sidebar SuggestionChip fill bar.
function FillBar({ pct, preferred }: { pct: number; preferred: boolean }) {
  return (
    <div className={`mt-1 h-1 rounded-full overflow-hidden ${preferred ? 'bg-white/25' : 'bg-gray-200'}`}>
      <div
        className={`h-full rounded-full ${preferred ? 'bg-white' : 'bg-brand-mid-blue'}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

// Same visual design as the sidebar SuggestionChip, with a compact fallback for
// short/narrow placements in the grid. Any row clipped by ≥10% of its own height
// is hidden rather than shown cut off (measured against the chip's inner height).
function HeatmapChip({ suggestion, isBest }: { suggestion: Suggestion; isBest: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const [narrow, setNarrow] = useState(true);
  const [cutFrom, setCutFrom] = useState<number>(Infinity);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setNarrow(prev => {
        if ( prev && w >= TO_WIDE_PX)   return false;
        if (!prev && w <  TO_NARROW_PX) return true;
        return prev;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Determine the first row that would be cut off by ≥10% of its height, and
  // hide it plus everything below it. Rows keep their layout box (visibility,
  // not display) so the measurement stays stable across renders.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const innerH = el.clientHeight;
      let cut = Infinity;
      const rows = rowRefs.current;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;
        const overflow = (r.offsetTop + r.offsetHeight) - innerH;
        if (overflow > r.offsetHeight * 0.1) { cut = i; break; }
      }
      setCutFrom(cut);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [narrow, suggestion]);

  const preferred = suggestion.rank === 'primary-mw' || suggestion.rank === 'primary-tth';
  const shell = preferred
    ? 'bg-brand-blue text-white'
    : 'bg-gray-50 border border-brand-gray text-gray-600';
  const sub = preferred ? 'text-blue-200' : 'text-gray-400';
  const pctColor = preferred ? 'text-white' : 'text-gray-700';
  const showStar = isBest && preferred;

  const dayLabel = suggestion.pairedDay
    ? `${suggestion.day} / ${suggestion.pairedDay}`
    : suggestion.day;

  // Every chip gets a thick gold outline. The star icon alone marks the best
  // recommendation.
  const chipRing: React.CSSProperties = {
    outline: '5px solid #dba620',
    outlineOffset: '2px',
  };

  const vis = (i: number): React.CSSProperties => ({ visibility: i >= cutFrom ? 'hidden' : 'visible' });
  const setRow = (i: number) => (el: HTMLElement | null) => { rowRefs.current[i] = el; };

  if (narrow) {
    return (
      <div ref={ref} className={`h-full rounded-2xl shadow-md overflow-hidden flex flex-col justify-start px-2 py-1 relative ${shell}`} style={chipRing}>
        {showStar && <span className="absolute top-0.5 right-0.5 text-brand-gold opacity-90 z-10"><StarIcon className="w-2.5 h-2.5" /></span>}
        <div ref={setRow(0)} style={vis(0)} className={`flex items-center justify-between gap-1 ${showStar ? 'pr-2' : ''}`}>
          <span className="text-[10px] font-bold leading-none truncate">{dayLabel}</span>
          <span className={`text-[11px] font-black leading-none shrink-0 ${pctColor}`}>{Math.round(suggestion.rawFreePercent)}%</span>
        </div>
        <span ref={setRow(1)} style={vis(1)} className="text-[9px] font-semibold leading-none truncate mt-0.5">{suggestion.startTime}–{suggestion.endTime}</span>
        <div ref={setRow(2)} style={vis(2)}><FillBar pct={suggestion.rawFreePercent} preferred={preferred} /></div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`h-full rounded-2xl shadow-md overflow-hidden flex flex-col gap-1 px-3 py-2 relative ${shell}`} style={chipRing}>
      {showStar && <span className="absolute top-2 right-2.5 text-brand-gold opacity-90 z-10"><StarIcon className="w-3 h-3" /></span>}
      <div ref={setRow(0)} style={vis(0)} className={`flex items-center justify-between ${showStar ? 'pr-4' : ''}`}>
        <span className="text-sm font-bold leading-none">{dayLabel}</span>
        <span className={`text-base font-black leading-none ${pctColor}`}>{Math.round(suggestion.rawFreePercent)}%</span>
      </div>
      <div ref={setRow(1)} style={vis(1)} className="flex items-center gap-1.5 mt-0.5">
        <span className="text-sm font-semibold leading-none">{suggestion.startTime}</span>
        <span className={`text-xs leading-none ${sub}`}>to</span>
        <span className="text-sm font-semibold leading-none">{suggestion.endTime}</span>
      </div>
      <span ref={setRow(2)} style={vis(2)} className={`text-xs leading-none ${sub}`}>
        ~{suggestion.onCampusCount.toLocaleString()} on campus
      </span>
      <div ref={setRow(3)} style={vis(3)}><FillBar pct={suggestion.rawFreePercent} preferred={preferred} /></div>
    </div>
  );
}

// Floating notch on the right edge of the heatmap, vertically centered.
function HeatmapLegend({ min, max, visible }: { min: number; max: number; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-r-0 border-brand-gray rounded-l-xl shadow-lg px-3 py-4 flex flex-col items-center">
      <span className="text-xs font-bold text-gray-500 mb-2">Free%</span>
      <span className="text-[11px] text-gray-400 mb-1">{Math.round(max)}%</span>
      <div
        className="w-4 rounded-full border border-brand-gray/50"
        style={{ height: 175, background: 'linear-gradient(to top, #2d457c, #ffffff)' }}
      />
      <span className="text-[11px] text-gray-400 mt-1">{Math.round(min)}%</span>
    </div>
  );
}

export default function HeatmapGrid() {
  const { state, dispatch } = useApp();
  const { heatmap, eligibleStudents, fiftyMinDays } = useResults();
  const prevOffsetRef = useRef(state.weekOffset);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Derived layout values needed inside handlers — declared before use via hoisting
  const allDayIndices = [0, 1, 2, 3, 4, 5];

  const monday = getWeekMonday(state.weekOffset);
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  const hasActiveResults = !state.isDirty && state.algorithmResult !== null;

  // Days blank in the heatmap: out-of-semester OR covered by a no-classes event.
  const noClassesDays = new Set<string>();
  for (const dayIdx of allDayIndices) {
    const iso = localDateToISO(weekDates[dayIdx]);
    if (iso < SEMESTER_START_ISO || iso > SEMESTER_END_ISO) {
      noClassesDays.add(DAYS_FULL[dayIdx]);
      continue;
    }
    for (const event of state.academicEvents) {
      if (event.kind === 'no-classes' && iso >= event.start && iso < event.end) {
        noClassesDays.add(DAYS_FULL[dayIdx]);
        break;
      }
    }
  }

  function handleGridMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    // Tooltip only appears once availability has been generated.
    if (!hasActiveResults) { setTooltip(null); return; }

    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();

    const relY = e.clientY - rect.top + el.scrollTop;
    const fracY = Math.max(0, Math.min(1, relY / el.scrollHeight));
    const timeMin = DAY_START_MIN + fracY * TOTAL_FR;

    const LEFT_PAD = 16;
    const relX = e.clientX - rect.left - LEFT_PAD - TIME_COL_W;
    const contentW = rect.width - LEFT_PAD * 2 - TIME_COL_W;

    if (relX < 0) { setTooltip(null); return; }

    const colIdx = Math.max(0, Math.min(Math.floor(relX / (contentW / NUM_DAYS)), NUM_DAYS - 1));
    const day = DAYS_FULL[colIdx];

    // Suppress on no-classes / out-of-semester columns (no data to show).
    if (noClassesDays.has(day)) { setTooltip(null); return; }

    const isFiftyMin = fiftyMinDays.has(day);
    let onCampus = 0;
    let onCampusAllDay = 0;
    let free = 0;
    for (const s of eligibleStudents) {
      const rawPeriods = s.periods.filter(p => p.day === day);
      if (rawPeriods.length === 0) continue;
      onCampusAllDay++;
      const dayPeriods = isFiftyMin
        ? rawPeriods.map(p => { const ns = STD_TO_50MIN[p.startMin] ?? p.startMin; return { startMin: ns, endMin: ns + 50 }; })
        : rawPeriods;
      const arrival   = dayPeriods.reduce((m, p) => Math.min(m, p.startMin), Infinity) - 30;
      const departure = dayPeriods.reduce((m, p) => Math.max(m, p.endMin), -Infinity) + 90;
      if (arrival > timeMin || departure <= timeMin) continue;
      onCampus++;
      if (!dayPeriods.some(p => p.startMin <= timeMin && p.endMin > timeMin)) free++;
    }

    setTooltip({
      kind: 'cell',
      timeMin,
      day,
      liveMetrics: { onCampus, onCampusAllDay, free, total: eligibleStudents.length },
      x: e.clientX,
      y: e.clientY,
    });
  }

  // Loading / error gates
  if (state.dataState === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading student schedule data…</p>
      </div>
    );
  }
  if (state.dataState === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center px-8 text-center">
        <p className="text-gray-500 text-sm">
          Schedule data could not be loaded. Please check your connection and reload the page.
        </p>
      </div>
    );
  }

  let slideClass = '';
  if (prevOffsetRef.current !== state.weekOffset) {
    slideClass = state.weekOffset > prevOffsetRef.current
      ? 'animate-slide-from-right'
      : 'animate-slide-from-left';
    prevOffsetRef.current = state.weekOffset;
  }

  // Gradient range over all in-session class-slot cells (incl. disabled days).
  let heatMin = 100;
  let heatMax = 0;
  if (hasActiveResults) {
    for (const dayIdx of allDayIndices) {
      const day = DAYS_FULL[dayIdx];
      if (noClassesDays.has(day)) continue;
      for (const slot of CLASS_SLOTS) {
        const v = heatmap[`${day}-${slot}`] ?? 0;
        if (v < heatMin) heatMin = v;
        if (v > heatMax) heatMax = v;
      }
    }
  }
  if (heatMin > heatMax) { heatMin = 0; heatMax = 0; }

  const gridColTemplate = `${TIME_COL_W}px repeat(${NUM_DAYS}, 1fr)`;

  const suggestions = !state.isDirty ? (state.algorithmResult?.suggestions ?? []) : [];
  const bestScore = suggestions.length > 0
    ? Math.max(...suggestions.map(s => s.weightedScore))
    : -Infinity;

  return (
    <>
    <div className="flex-1 min-h-0 overflow-hidden relative">
      <div key={state.weekOffset} className={`h-full flex flex-col min-h-0 ${slideClass}`}>

        {/* Day-header row */}
        <div className="flex-none bg-white border-b-2 border-brand-gray grid px-4 z-10" style={{ gridTemplateColumns: gridColTemplate }}>
          <div style={{ width: TIME_COL_W }} />
          {allDayIndices.map(dayIdx => {
            const date = weekDates[dayIdx];
            const today = isToday(date);
            const dayName = DAYS_FULL[dayIdx];
            const isFiftyMinDay = fiftyMinDays.has(dayName);
            const enabled = state.selectedDays[dayIdx];
            // Enabled days get a blue circle; disabled days stay neutral.
            // The current day is marked with a golden outline (independent of state).
            const circleFill = enabled ? 'bg-brand-blue text-white shadow-sm' : 'bg-gray-100 text-gray-500';
            const todayRing: React.CSSProperties = today ? { outline: '2px solid #dba620', outlineOffset: '2px' } : {};
            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_DAY', index: dayIdx })}
                title={enabled ? `Click to exclude ${dayName}` : `Click to include ${dayName}`}
                aria-pressed={enabled}
                className="text-center py-2.5 px-1 rounded-xl transition-colors cursor-pointer hover:bg-brand-light-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <p className={`text-sm font-bold uppercase tracking-wider leading-none ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>{dayName}</p>
                  {isFiftyMinDay && enabled && (
                    <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded leading-none">50 min</span>
                  )}
                </div>
                <div className="flex items-center justify-center mt-1.5">
                  <span
                    className={`text-base leading-none flex items-center justify-center w-9 h-9 rounded-full font-bold transition-colors ${circleFill}`}
                    style={todayRing}
                  >
                    {date.getDate()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* All-day events row — disabled-column tint continues up to the header here */}
        <div className="flex-none px-4">
          <div className="relative">
            {allDayIndices.map((dayIdx, colOffset) => {
              if (state.selectedDays[dayIdx]) return null;
              return (
                <div
                  key={`disabled-allday-${dayIdx}`}
                  style={{
                    position: 'absolute',
                    left:  `calc(${TIME_COL_W}px + ${colOffset} * (100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    width: `calc((100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    top: 0, bottom: 0,
                    backgroundColor: DISABLED_TINT,
                    pointerEvents: 'none', zIndex: 2,
                  }}
                />
              );
            })}
            <AllDayRow
              events={state.academicEvents}
              activeDayIndices={allDayIndices}
              weekDates={weekDates}
              timeColW={TIME_COL_W}
            />
          </div>
        </div>

        {/* Scrollable grid body */}
        <div
          className="flex-1 overflow-y-auto overflow-x-auto min-h-0 px-4"
          onMouseMove={handleGridMouseMove}
          onMouseLeave={hideTooltip}
        >
          <div style={{ position: 'relative', height: '100%', minHeight: '600px' }}>

            {/* Background heatmap grid */}
            <div
              role="grid"
              aria-label="Availability heatmap"
              style={{ display: 'grid', gridTemplateColumns: gridColTemplate, gridTemplateRows: GRID_ROW_TEMPLATE, height: '100%' }}
            >
              {GRID_ROWS.map((row, rowIdx) => {
                const gridRow = rowIdx + 1;
                return [
                  <div
                    key={`lbl-${rowIdx}`}
                    className="border-r-2 border-brand-gray/30 relative"
                    style={{ gridColumn: 1, gridRow, overflow: 'visible' }}
                  >
                    {row.label && (
                      <span
                        className="text-xs font-medium text-gray-400 leading-none whitespace-nowrap absolute right-2"
                        style={{ top: 0, transform: rowIdx === 0 ? 'translateY(0)' : 'translateY(-50%)' }}
                      >
                        {row.label}
                      </span>
                    )}
                  </div>,

                  ...allDayIndices.map((dayIdx, colOffset) => {
                    const col = colOffset + 2;
                    const day = DAYS_FULL[dayIdx];
                    const inactive = !state.selectedDays[dayIdx];
                    const key = row.slot ? `${day}-${row.slot}` : null;
                    const pct = key ? (heatmap[key] ?? 0) : 0;

                    if (row.kind === 'break' || row.kind === 'lunch' || row.kind === 'gap') {
                      return (
                        <div
                          key={`gap-${rowIdx}-${dayIdx}`}
                          className="m-0.5 rounded-md bg-white"
                          style={{ gridColumn: col, gridRow }}
                        />
                      );
                    }

                    const isNoClasses = noClassesDays.has(day);
                    const showHeat = hasActiveResults && !isNoClasses;
                    const cellLabel = key
                      ? isNoClasses
                        ? `${day} ${row.slot}: no classes`
                        : hasActiveResults
                          ? `${day} ${row.slot}: ${pct}% free${inactive ? ' (day not selected)' : ''}`
                          : `${day} ${row.slot}: press Generate to see availability`
                      : undefined;
                    const cellStyle: React.CSSProperties = {
                      gridColumn: col,
                      gridRow,
                      ...(showHeat ? heatStyle(pct, heatMin, heatMax) : {}),
                    };
                    return (
                      <div
                        key={`cell-${rowIdx}-${dayIdx}`}
                        role="gridcell"
                        aria-label={cellLabel}
                        className="m-0.5 rounded-lg transition-colors cursor-default"
                        style={cellStyle}
                      >
                        {showHeat && <span className="sr-only">{pct}%</span>}
                      </div>
                    );
                  }),
                ];
              })}

              {/* Terminal "22:00" label */}
              <div className="border-r-2 border-brand-gray/30 relative" style={{ gridColumn: 1, gridRow: GRID_ROWS.length + 1, overflow: 'visible' }}>
                <span className="text-xs font-medium text-gray-400 leading-none whitespace-nowrap absolute right-2" style={{ top: 0, transform: 'translateY(-50%)' }}>
                  {TERMINAL_LABEL}
                </span>
              </div>
              {allDayIndices.map((_, colOffset) => (
                <div key={`terminal-${colOffset}`} style={{ gridColumn: colOffset + 2, gridRow: GRID_ROWS.length + 1 }} />
              ))}
            </div>

            {/* Disabled-day column discoloration */}
            {allDayIndices.map((dayIdx, colOffset) => {
              if (state.selectedDays[dayIdx]) return null;
              return (
                <div
                  key={`disabled-col-${dayIdx}`}
                  style={{
                    position: 'absolute',
                    left:  `calc(${TIME_COL_W}px + ${colOffset} * (100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    width: `calc((100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    top: 0, height: '100%',
                    backgroundColor: DISABLED_TINT,
                    pointerEvents: 'none', zIndex: 2,
                  }}
                />
              );
            })}

            {/* 50-min day overlays */}
            {allDayIndices.map((dayIdx, colOffset) => {
              if (!fiftyMinDays.has(DAYS_FULL[dayIdx]) || !state.selectedDays[dayIdx]) return null;
              return (
                <div
                  key={`50min-col-${dayIdx}`}
                  style={{
                    position: 'absolute',
                    left:  `calc(${TIME_COL_W}px + ${colOffset} * (100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    width: `calc((100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    top: 0, height: '100%',
                    backgroundColor: 'rgba(251, 191, 36, 0.09)',
                    pointerEvents: 'none', zIndex: 1,
                  }}
                />
              );
            })}

            {/* Chip overlay */}
            {suggestions.map((suggestion, idx) => {
              const dayIdx = DAYS_FULL.indexOf(suggestion.day as typeof DAYS_FULL[number]);
              if (dayIdx === -1 || !state.selectedDays[dayIdx]) return null;

              const startMin  = toMinutes(suggestion.startTime);
              const topPct    = ((startMin - DAY_START_MIN) / TOTAL_FR) * 100;
              const heightPct = (state.duration / TOTAL_FR) * 100;

              return (
                <div
                  key={idx}
                  onMouseMove={(e) => { e.stopPropagation(); setTooltip({ kind: 'chip', suggestion, x: e.clientX, y: e.clientY }); }}
                  onMouseLeave={hideTooltip}
                  onClick={(e) => { e.stopPropagation(); setTooltip({ kind: 'chip', suggestion, x: e.clientX, y: e.clientY }); }}
                  style={{
                    position: 'absolute',
                    left:  `calc(${TIME_COL_W}px + ${dayIdx} * (100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    width: `calc((100% - ${TIME_COL_W}px) / ${NUM_DAYS})`,
                    top:    `${topPct}%`,
                    height: `${heightPct}%`,
                    minHeight: `${CHIP_MIN_PX}px`,
                    padding: '2px 4px',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <HeatmapChip suggestion={suggestion} isBest={suggestion.weightedScore === bestScore} />
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* Availability legend — floating notch on the right edge, vertically centered */}
      <HeatmapLegend min={heatMin} max={heatMax} visible={hasActiveResults && heatMax > heatMin} />
    </div>

    {tooltip?.kind === 'cell' && <CellTooltip tt={tooltip} noClassesDays={noClassesDays} />}
    {tooltip?.kind === 'chip' && <ChipTooltip tt={tooltip} />}
    </>
  );
}
