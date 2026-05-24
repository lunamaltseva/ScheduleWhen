import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_SHORT } from '../../constants';
import { SunriseIcon, SunIcon, MoonIcon } from '../Icons';
import type { TimePeriod } from '../../types';

// ── Date helpers ───────────────────────────────────────────────────────────────

function isoToDisplay(iso: string): string {
  if (!iso || !iso.includes('-')) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(-2)}`;
}

// ── Layout ─────────────────────────────────────────────────────────────────────

const LABEL_W = 'w-24 shrink-0';
const underline = 'bg-transparent border-0 border-b-2 border-brand-gray rounded-none px-1 py-0.5 focus:outline-none focus:border-brand-blue text-sm text-center flex-1 min-w-0';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-h-[36px]">
      <span className={`text-sm font-semibold text-gray-600 ${LABEL_W}`}>{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Priority options ───────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: TimePeriod; icon: React.ReactNode; label: string; title: string }[] = [
  { value: 'morning',   icon: <SunriseIcon className="w-4 h-4" />, label: 'Morning',   title: '8am–12pm'  },
  { value: 'afternoon', icon: <SunIcon     className="w-4 h-4" />, label: 'Afternoon', title: '12pm–5pm' },
  { value: 'evening',   icon: <MoonIcon    className="w-4 h-4" />, label: 'Evening',   title: '5pm–10pm'  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function EventSpec() {
  const { state, dispatch } = useApp();
  const [dateText, setDateText] = useState(() => isoToDisplay(state.timeframeFrom));
  // Local string state lets the user clear the field while editing.
  // useEffect keeps them in sync when the AI or another source changes context.
  const [durationText, setDurationText] = useState(() => String(state.duration));
  const [targetText, setTargetText]     = useState(() => String(state.targetParticipants));

  useEffect(() => { setDurationText(String(state.duration)); }, [state.duration]);
  useEffect(() => { setTargetText(String(state.targetParticipants)); }, [state.targetParticipants]);
  useEffect(() => { setDateText(isoToDisplay(state.timeframeFrom)); }, [state.timeframeFrom]);

  // ── Date ──────────────────────────────────────────────────────────────────
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + '/' + digits.slice(4, 6);
    setDateText(formatted);
    const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
    if (match) {
      const [, d, m, y] = match;
      const iso = `20${y}-${m}-${d}`;
      const parsed = new Date(iso);
      // Reject invalid calendar dates (e.g. 31/13/26, 30/02/26)
      if (!isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso)) {
        dispatch({ type: 'SET_TIMEFRAME', value: iso });
      }
    }
  }

  // ── Duration ──────────────────────────────────────────────────────────────
  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setDurationText(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n)) {
      dispatch({ type: 'SET_DURATION', value: Math.min(840, Math.max(1, n)) });
    }
  }

  function handleDurationBlur() {
    const n = parseInt(durationText, 10);
    if (isNaN(n) || n < 1) {
      setDurationText(String(state.duration)); // revert to last committed value
    } else {
      const clamped = Math.min(840, Math.max(1, n));
      setDurationText(String(clamped));
      dispatch({ type: 'SET_DURATION', value: clamped });
    }
  }

  // ── Target ────────────────────────────────────────────────────────────────
  function handleTargetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setTargetText(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 5000) {
      dispatch({ type: 'SET_TARGET', value: n });
    }
  }

  function handleTargetBlur() {
    const n = parseInt(targetText, 10);
    if (isNaN(n) || n < 1) {
      setTargetText(String(state.targetParticipants)); // revert
    } else {
      const clamped = Math.min(5000, Math.max(1, n));
      setTargetText(String(clamped));
      dispatch({ type: 'SET_TARGET', value: clamped });
    }
  }

  return (
    <div className="px-5 pt-3 pb-3 space-y-3">
      <Row label="Duration">
        <input
          type="number"
          min={1}
          max={840}
          value={durationText}
          onChange={handleDurationChange}
          onBlur={handleDurationBlur}
          className={underline}
        />
        <span className="text-sm text-gray-500 shrink-0">min</span>
      </Row>

      {/* Consider Days — standalone section, no Row wrapper */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">Select from</p>
        <div className="flex gap-2 justify-center">
          {DAYS_SHORT.map((label, i) => (
            <button
              key={i}
              onClick={() => dispatch({ type: 'TOGGLE_DAY', index: i })}
              className={`w-9 h-9 rounded-full text-sm font-bold transition-colors ${
                state.selectedDays[i]
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-brand-gray text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority — multi-select, standalone section */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">Prioritize</p>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map(opt => {
            const active = state.timePeriods.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => dispatch({ type: 'TOGGLE_TIME_PERIOD', value: opt.value })}
                title={opt.title}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-colors ${
                  active
                    ? 'bg-brand-blue border-brand-blue text-white'
                    : 'bg-white border-brand-gray text-gray-500 hover:bg-gray-50'
                }`}
              >
                {opt.icon}
                <span className="text-[11px] font-semibold leading-none">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Row label="Starting from">
        <input
          type="text"
          value={dateText}
          onChange={handleDateChange}
          placeholder="DD/MM/YY"
          maxLength={8}
          className={underline}
        />
      </Row>

      <Row label="Aim for">
        <input
          type="number"
          min={1}
          max={5000}
          value={targetText}
          onChange={handleTargetChange}
          onBlur={handleTargetBlur}
          className={underline}
        />
        <span className="text-sm text-gray-500 shrink-0">participants</span>
      </Row>
    </div>
  );
}
