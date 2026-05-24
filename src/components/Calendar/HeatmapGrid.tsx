import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import type { HeatmapCellData } from '../../hooks/useResults';
import { DAYS_FULL, GRID_ROWS, CLASS_SLOTS, TERMINAL_LABEL } from '../../constants';
import { toMinutes, addMinutes } from '../../algorithm/score';
import type { Suggestion } from '../../types';
import { StarIcon } from '../Icons';

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

// Gradient from dark-blue (#2d457c) at 0% free → white (#ffffff) at 100% free,
// normalized over the actual min–max range so local contrast is maximised.
function heatStyle(pct: number, min: number, max: number): React.CSSProperties {
  if (max <= min) return { backgroundColor: '#ffffff' };
  const t = Math.max(0, Math.min(1, (pct - min) / (max - min)));
  const r = Math.round(0x2d + (0xff - 0x2d) * t);
  const g = Math.round(0x45 + (0xff - 0x45) * t);
  const b = Math.round(0x7c + (0xff - 0x7c) * t);
  return { backgroundColor: `rgb(${r},${g},${b})` };
}

// White background with a single red diagonal — used when nobody is on campus that day.
const NO_CAMPUS_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(to bottom right, transparent calc(50% - 0.75px), #fca5a5 calc(50% - 0.75px), #fca5a5 calc(50% + 0.75px), transparent calc(50% + 0.75px))',
};

// ── Heatmap tooltip ────────────────────────────────────────────────────────────

interface TooltipState {
  day: string;
  slot: string;
  data: HeatmapCellData;
  x: number;
  y: number;
}

const TOOLTIP_H = 118; // estimated tooltip height in px
const HEADER_H  = 80;  // CalendarHeader (72px) + a little buffer

function HeatmapTooltip({ tt }: { tt: TooltipState }) {
  const endTime = addMinutes(tt.slot, 75);
  const left    = Math.min(Math.max(tt.x - 110, 8), window.innerWidth - 228);
  const topAbove = tt.y - TOOLTIP_H - 10;
  const top     = topAbove >= HEADER_H ? topAbove : tt.y + 16; // flip below if too close to header

  return createPortal(
    <div
      style={{ position: 'fixed', left, top, zIndex: 9999, pointerEvents: 'none', width: 220 }}
      className="bg-white border border-brand-gray rounded-xl shadow-xl px-3 py-2.5 text-xs"
    >
      <p className="font-bold text-gray-800 mb-1.5">{tt.day} · {tt.slot}–{endTime}</p>
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between gap-2">
          <span>On campus today</span>
          <span className="font-semibold text-gray-800">{tt.data.onCampusDay.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Present at {tt.slot}</span>
          <span className="font-semibold text-gray-800">~{tt.data.presentNow.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Available (filtered)</span>
          <span className="font-semibold text-brand-blue">{tt.data.freePercent}%</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const TOTAL_FR     = GRID_ROWS.reduce((sum, r) => sum + r.fr, 0); // 840 min = 8:00–22:00
const DAY_START_MIN = 480; // 8:00

const GRID_ROW_TEMPLATE = GRID_ROWS.map(r => `${r.fr}fr`).join(' ') + ' auto';
const TIME_COL_W = 52;

// Width thresholds for chip layout switching (hysteresis to prevent flicker).
// narrow→wide only above 130px; wide→narrow only below 110px.
const TO_WIDE_PX   = 130;
const TO_NARROW_PX = 110;

function HeatmapChip({ suggestion, isBest }: { suggestion: Suggestion; isBest: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setNarrow(prev => {
        if ( prev && w >= TO_WIDE_PX)   return false; // narrow → wide
        if (!prev && w <  TO_NARROW_PX) return true;  // wide → narrow
        return prev;                                   // dead zone: keep state
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const preferred = suggestion.rank === 'primary-mw' || suggestion.rank === 'primary-tth';
  const bg  = preferred
    ? 'bg-brand-blue text-white'
    : 'bg-white text-brand-blue border-2 border-brand-blue';
  const sub = preferred ? 'text-white/70' : 'text-blue-400';

  const dayLabel = suggestion.pairedDay
    ? `${suggestion.day}/${suggestion.pairedDay}`
    : suggestion.day;

  const goldRing: React.CSSProperties = isBest
    ? { outline: '2px solid #dba620', outlineOffset: '2px' }
    : {};

  if (narrow) {
    return (
      <div ref={ref} className={`h-full rounded-xl shadow-md overflow-hidden flex flex-col justify-center px-2.5 py-1 gap-0.5 relative ${bg}`} style={goldRing}>
        {isBest && <span className="absolute top-1 right-1.5 text-brand-gold opacity-90"><StarIcon className="w-2.5 h-2.5" /></span>}
        <div className="flex items-center justify-between gap-1 pr-3">
          <span className="text-[11px] font-bold leading-none truncate">{dayLabel}</span>
          <span className="text-xs font-black leading-none shrink-0">{Math.round(suggestion.rawFreePercent)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium leading-none truncate">{suggestion.startTime}–{suggestion.endTime}</span>
          <span className={`text-[10px] leading-none shrink-0 ${sub}`}>· ~{suggestion.onCampusCount.toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`h-full rounded-xl shadow-md overflow-hidden flex flex-col gap-1 px-2.5 py-2 relative ${bg}`} style={goldRing}>
      {isBest && <span className="absolute top-1.5 right-2 text-brand-gold opacity-90"><StarIcon className="w-3 h-3" /></span>}
      <div className="flex items-center justify-between pr-5">
        <span className="text-xs font-bold leading-none">{dayLabel}</span>
        <span className="text-sm font-black leading-none">{Math.round(suggestion.rawFreePercent)}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold leading-none">{suggestion.startTime}</span>
        <span className={`text-[10px] leading-none ${sub}`}>to</span>
        <span className="text-xs font-semibold leading-none">{suggestion.endTime}</span>
      </div>
      <span className={`text-[10px] leading-none mt-auto ${sub}`}>
        ~{suggestion.onCampusCount.toLocaleString()} on campus
      </span>
    </div>
  );
}

export default function HeatmapGrid() {
  const { state } = useApp();
  const { heatmap, cellData } = useResults();
  const prevOffsetRef = useRef(state.weekOffset);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback((day: string, slot: string, data: HeatmapCellData, e: React.MouseEvent) => {
    setTooltip({ day, slot, data, x: e.clientX, y: e.clientY });
  }, []);
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }, []);
  const hideTooltip = useCallback(() => setTooltip(null), []);

  // Loading / error gates — show overlay instead of grid
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

  // Only show heatmap colors when results are fresh (not dirty, not first load)
  const hasActiveResults = !state.isDirty && state.algorithmResult !== null;

  const activeDayIndices = state.selectedDays
    .map((on, i) => (on ? i : -1))
    .filter(i => i >= 0);

  // Compute min/max free% across active class-slot cells for the gradient
  let heatMin = 100;
  let heatMax = 0;
  if (hasActiveResults) {
    for (const dayIdx of activeDayIndices) {
      const day = DAYS_FULL[dayIdx];
      for (const slot of CLASS_SLOTS) {
        const v = heatmap[`${day}-${slot}`] ?? 0;
        if (v < heatMin) heatMin = v;
        if (v > heatMax) heatMax = v;
      }
    }
  }

  const monday = getWeekMonday(state.weekOffset);
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  const numActiveDays = activeDayIndices.length;
  const gridColTemplate = `${TIME_COL_W}px repeat(${numActiveDays}, 1fr)`;

  // Chips only shown after an up-to-date Generate run (isDirty hides them)
  const suggestions = !state.isDirty ? (state.algorithmResult?.suggestions ?? []) : [];
  const bestScore = suggestions.length > 0
    ? Math.max(...suggestions.map(s => s.weightedScore))
    : -Infinity;

  return (
    <>
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      <div key={state.weekOffset} className={`flex-1 flex flex-col min-h-0 ${slideClass}`}>

        {/* Day-header row */}
        <div
          className="flex-none bg-white border-b-2 border-brand-gray grid px-4 z-10"
          style={{ gridTemplateColumns: gridColTemplate }}
        >
          <div style={{ width: TIME_COL_W }} />
          {activeDayIndices.map(dayIdx => {
            const date = weekDates[dayIdx];
            const today = isToday(date);
            return (
              <div key={dayIdx} className="text-center py-3 px-1">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider leading-none">
                  {DAYS_FULL[dayIdx]}
                </p>
                <div className="flex items-center justify-center mt-1.5">
                  <span className={`text-base leading-none flex items-center justify-center w-9 h-9 rounded-full font-bold ${
                    today ? 'bg-brand-blue text-white shadow-md' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scrollable grid body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 px-4">
          <div style={{ position: 'relative', height: '100%', minHeight: '600px' }}>

            {/* Background heatmap grid */}
            <div
              role="grid"
              aria-label="Availability heatmap"
              style={{
                display: 'grid',
                gridTemplateColumns: gridColTemplate,
                gridTemplateRows: GRID_ROW_TEMPLATE,
                height: '100%',
              }}
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

                  ...activeDayIndices.map((dayIdx, colOffset) => {
                    const col = colOffset + 2;
                    const day = DAYS_FULL[dayIdx];
                    const key = row.slot ? `${day}-${row.slot}` : null;
                    const pct = key ? (heatmap[key] ?? 0) : 0;

                    if (row.kind === 'break') {
                      return (
                        <div
                          key={`break-${rowIdx}-${dayIdx}`}
                          className="m-0.5 rounded-md bg-white"
                          style={{ gridColumn: col, gridRow }}
                        />
                      );
                    }
                    if (row.kind === 'lunch' || row.kind === 'gap') {
                      // White — part of the continuous gradient, not a gray blocker
                      return (
                        <div
                          key={`gap-${rowIdx}-${dayIdx}`}
                          className="m-0.5 rounded-md bg-white"
                          style={{ gridColumn: col, gridRow }}
                        />
                      );
                    }
                    const cellLabel = key
                      ? hasActiveResults
                        ? `${day} ${row.slot}: ${pct}% free`
                        : `${day} ${row.slot}: press Generate to see availability`
                      : undefined;
                    const cd = key ? cellData[key] : undefined;
                    const noCampus = hasActiveResults && cd !== undefined && cd.totalOnCampus === 0;
                    const cellStyle: React.CSSProperties = {
                      gridColumn: col,
                      gridRow,
                      ...(hasActiveResults
                        ? noCampus
                          ? NO_CAMPUS_STYLE
                          : heatStyle(pct, heatMin, heatMax)
                        : {}),
                    };
                    return (
                      <div
                        key={`cell-${rowIdx}-${dayIdx}`}
                        role="gridcell"
                        aria-label={cellLabel}
                        className="m-0.5 rounded-lg transition-colors cursor-default"
                        style={cellStyle}
                        onMouseEnter={hasActiveResults && cd ? e => showTooltip(day, row.slot!, cd, e) : undefined}
                        onMouseMove={hasActiveResults && cd ? moveTooltip : undefined}
                        onMouseLeave={hasActiveResults && cd ? hideTooltip : undefined}
                      >
                        {hasActiveResults && (
                          <span className="sr-only">{noCampus ? 'no students on campus' : `${pct}%`}</span>
                        )}
                      </div>
                    );
                  }),
                ];
              })}

              {/* Terminal "22:00" label */}
              <div
                className="border-r-2 border-brand-gray/30 relative"
                style={{ gridColumn: 1, gridRow: GRID_ROWS.length + 1, overflow: 'visible' }}
              >
                <span
                  className="text-xs font-medium text-gray-400 leading-none whitespace-nowrap absolute right-2"
                  style={{ top: 0, transform: 'translateY(-50%)' }}
                >
                  {TERMINAL_LABEL}
                </span>
              </div>
              {activeDayIndices.map((_, colOffset) => (
                <div key={`terminal-${colOffset}`} style={{ gridColumn: colOffset + 2, gridRow: GRID_ROWS.length + 1 }} />
              ))}
            </div>

            {/* Chip overlay — positioned by wall-clock minutes */}
            {numActiveDays > 0 && suggestions.map((suggestion, idx) => {
              const dayIdx   = DAYS_FULL.indexOf(suggestion.day as typeof DAYS_FULL[number]);
              const colOffset = activeDayIndices.indexOf(dayIdx);
              if (colOffset === -1) return null;

              const startMin  = toMinutes(suggestion.startTime);
              const topPct    = ((startMin - DAY_START_MIN) / TOTAL_FR) * 100;
              const heightPct = (state.duration / TOTAL_FR) * 100;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left:  `calc(${TIME_COL_W}px + ${colOffset} * (100% - ${TIME_COL_W}px) / ${numActiveDays})`,
                    width: `calc((100% - ${TIME_COL_W}px) / ${numActiveDays})`,
                    top:    `${topPct}%`,
                    height: `${heightPct}%`,
                    padding: '2px 4px',
                    boxSizing: 'border-box',
                    pointerEvents: 'none',
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
    </div>

    {tooltip && <HeatmapTooltip tt={tooltip} />}
    </>
  );
}
