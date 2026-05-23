import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import { DAYS_FULL, GRID_ROWS, TERMINAL_LABEL } from '../../constants';
import type { Recommendation } from '../../types';

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

// Busy = dark blue, available = white
function heatColor(pct: number): string {
  if (pct >= 75) return 'bg-white';
  if (pct >= 50) return 'bg-brand-light-blue';
  if (pct >= 25) return 'bg-brand-mid-blue';
  return 'bg-brand-blue';
}

const TOTAL_FR = GRID_ROWS.reduce((sum, r) => sum + r.fr, 0);

const SLOT_FR_OFFSETS: Record<string, number> = (() => {
  const offsets: Record<string, number> = {};
  let cum = 0;
  for (const row of GRID_ROWS) {
    if (row.slot) offsets[row.slot] = cum;
    cum += row.fr;
  }
  return offsets;
})();

const GRID_ROW_TEMPLATE = GRID_ROWS.map(r => `${r.fr}fr`).join(' ') + ' auto';
const TIME_COL_W = 52;

// Threshold in px below which we show the compact (slot + %) view instead of the full sidebar style
const COMPACT_THRESHOLD_PX = 70;

function HeatmapChip({ rec, rank }: { rec: Recommendation; rank: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.height < COMPACT_THRESHOLD_PX);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const preferred = rank < 2;
  const bg = preferred
    ? 'bg-brand-gold text-white'
    : 'bg-brand-blue text-white border border-white/20';

  if (compact) {
    return (
      <div ref={ref} className={`h-full rounded-xl shadow-md overflow-hidden flex items-center justify-between px-2.5 gap-1 ${bg}`}>
        <span className="text-xs font-semibold leading-none truncate">{rec.slot}</span>
        <span className="text-xs font-black leading-none shrink-0">{Math.round(rec.freePercent)}%</span>
      </div>
    );
  }

  return (
    <div ref={ref} className={`h-full rounded-xl shadow-md overflow-hidden flex flex-col gap-1 px-2.5 py-2 ${bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold leading-none">{rec.day}</span>
        <span className="text-sm font-black leading-none">{Math.round(rec.freePercent)}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold leading-none">{rec.slot}</span>
        <span className="text-[10px] text-white/70 leading-none">to</span>
        <span className="text-xs font-semibold leading-none">{rec.endTime}</span>
      </div>
      <span className="text-[10px] text-white/70 leading-none mt-auto">
        {rec.eligibleCount.toLocaleString()} eligible
      </span>
    </div>
  );
}

export default function HeatmapGrid() {
  const { state } = useApp();
  const { heatmap, recommendations } = useResults();
  const prevOffsetRef = useRef(state.weekOffset);

  // Compute slide direction during render (ref mutation is safe here)
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

  const monday = getWeekMonday(state.weekOffset);
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  const numActiveDays = activeDayIndices.length;
  const gridColTemplate = `${TIME_COL_W}px repeat(${numActiveDays}, 1fr)`;

  return (
    // Outer clip container — overflow:hidden provides the clip for the slide animation
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {/* key forces remount on week change, triggering the slide animation */}
      <div key={state.weekOffset} className={`flex-1 flex flex-col min-h-0 ${slideClass}`}>

        {/* ── Day-header row ───────────────────────────────────────────────── */}
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

        {/* ── Scrollable grid body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 px-4">
          <div style={{ position: 'relative', height: '100%', minHeight: '600px' }}>

            {/* Main grid — background cells */}
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
                  // Time-axis label — positioned at the top boundary of its row
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
                      return (
                        <div
                          key={`gap-${rowIdx}-${dayIdx}`}
                          className="m-0.5 rounded-md bg-gray-100"
                          style={{ gridColumn: col, gridRow }}
                        />
                      );
                    }

                    return (
                      <div
                        key={`cell-${rowIdx}-${dayIdx}`}
                        className={`m-0.5 rounded-lg transition-colors ${heatColor(pct)}`}
                        style={{ gridColumn: col, gridRow }}
                        title={key ? `${day} ${row.slot}: ${pct}% available` : undefined}
                      />
                    );
                  }),
                ];
              })}

              {/* Terminal label row — "22:00" tick */}
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
                <div
                  key={`terminal-${colOffset}`}
                  style={{ gridColumn: colOffset + 2, gridRow: GRID_ROWS.length + 1 }}
                />
              ))}
            </div>

            {/* ── Chip overlay — percentage-based absolute positioning ───────── */}
            {numActiveDays > 0 && recommendations.map((rec, rank) => {
              const dayIdx = DAYS_FULL.indexOf(rec.day as typeof DAYS_FULL[number]);
              const colOffset = activeDayIndices.indexOf(dayIdx);
              if (colOffset === -1) return null;

              const slotFrOffset = SLOT_FR_OFFSETS[rec.slot] ?? 0;
              const topPct    = (slotFrOffset / TOTAL_FR) * 100;
              const heightPct = (state.duration / TOTAL_FR) * 100;

              return (
                <div
                  key={rank}
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
                  <HeatmapChip rec={rec} rank={rank} />
                </div>
              );
            })}

          </div>
        </div>

      </div>
    </div>
  );
}
