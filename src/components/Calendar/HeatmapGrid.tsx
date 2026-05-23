import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import { DAYS_FULL, GRID_ROWS, CLASS_SLOTS, TERMINAL_LABEL } from '../../constants';
import { toMinutes } from '../../algorithm/score';
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
  const { heatmap } = useResults();
  const prevOffsetRef = useRef(state.weekOffset);

  let slideClass = '';
  if (prevOffsetRef.current !== state.weekOffset) {
    slideClass = state.weekOffset > prevOffsetRef.current
      ? 'animate-slide-from-right'
      : 'animate-slide-from-left';
    prevOffsetRef.current = state.weekOffset;
  }

  const activeDayIndices = state.selectedDays
    .map((on, i) => (on ? i : -1))
    .filter(i => i >= 0);

  // Compute min/max free% across active class-slot cells for the gradient
  let heatMin = 100;
  let heatMax = 0;
  for (const dayIdx of activeDayIndices) {
    const day = DAYS_FULL[dayIdx];
    for (const slot of CLASS_SLOTS) {
      const v = heatmap[`${day}-${slot}`] ?? 0;
      if (v < heatMin) heatMin = v;
      if (v > heatMax) heatMax = v;
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
                        style={{ top: 0, transform: 'translateY(-50%)' }}
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
                          className="m-0.5 rounded-md bg-gray-100/60"
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
                    return (
                      <div
                        key={`cell-${rowIdx}-${dayIdx}`}
                        className="m-0.5 rounded-lg transition-colors"
                        style={{
                          gridColumn: col,
                          gridRow,
                          ...heatStyle(pct, heatMin, heatMax),
                        }}
                        title={key ? `${day} ${row.slot}: ${pct}% free (on-campus students)` : undefined}
                      />
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
  );
}
