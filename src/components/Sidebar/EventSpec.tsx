import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DAYS_SHORT } from '../../constants';
import { SunriseIcon, SunIcon, MoonIcon, PlusIcon, MinusIcon, XIcon, ChevronDown } from '../Icons';
import HelpTip from '../common/HelpTip';
import DatePicker from './DatePicker';
import { fromMinutes } from '../../algorithm/score';
import type { TimePeriod } from '../../types';

// ── Layout ─────────────────────────────────────────────────────────────────────

const LABEL_W = 'w-24 shrink-0';

function Row({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 min-h-[36px]">
      <span className={`text-sm font-semibold text-gray-600 ${LABEL_W}`}>
        <HelpTip text={help}>{label}</HelpTip>
      </span>
      <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SectionTitle({ label, help }: { label: string; help: string }) {
  return (
    <p className="text-sm font-semibold text-gray-600 mb-2">
      <HelpTip text={help}>{label}</HelpTip>
    </p>
  );
}

// ── Priority options ───────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: TimePeriod; icon: React.ReactNode; label: string; title: string }[] = [
  { value: 'morning',   icon: <SunriseIcon className="w-4 h-4" />, label: 'Morning',   title: '8am–12pm'  },
  { value: 'afternoon', icon: <SunIcon     className="w-4 h-4" />, label: 'Afternoon', title: '12pm–5pm' },
  { value: 'evening',   icon: <MoonIcon    className="w-4 h-4" />, label: 'Evening',   title: '5pm–10pm'  },
];

const DURATION_PRESETS: { value: number; label: string }[] = [
  { value: 30,  label: '30 minutes' },
  { value: 40,  label: '40 minutes' },
  { value: 60,  label: '60 minutes (1 hour)' },
  { value: 90,  label: '90 minutes (1.5 hours)' },
  { value: 120, label: '120 minutes (2 hours)' },
  { value: 180, label: '180 minutes (3 hours)' },
];

const TARGET_PRESETS: { value: number; label: string }[] = [
  { value: 10, label: '10 participants' },
  { value: 24, label: '24 participants' },
  { value: 40, label: '40 participants' },
  { value: 60, label: '60+ participants' },
];

// ── Week-offset helper ───────────────────────────────────────────────────────
// Selecting a "Starting from" date should jump the calendar to that week.

function weekOffsetForIso(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const targetDow = target.getDay();
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() - (targetDow === 0 ? 6 : targetDow - 1));
  targetMonday.setHours(0, 0, 0, 0);

  const now = new Date();
  const dow = now.getDay();
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  currentMonday.setHours(0, 0, 0, 0);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.round((targetMonday.getTime() - currentMonday.getTime()) / msPerWeek);
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function EventSpec() {
  const { state, dispatch } = useApp();
  const [durationText, setDurationText] = useState(() => String(state.duration));
  const [targetText, setTargetText]     = useState(() => String(state.targetParticipants));
  const [presetOpen, setPresetOpen]     = useState(false);
  const [targetPresetOpen, setTargetPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  const targetPresetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDurationText(String(state.duration)); }, [state.duration]);
  useEffect(() => { setTargetText(String(state.targetParticipants)); }, [state.targetParticipants]);

  useEffect(() => {
    if (!presetOpen) return;
    function onClick(e: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) setPresetOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [presetOpen]);

  useEffect(() => {
    if (!targetPresetOpen) return;
    function onClick(e: MouseEvent) {
      if (targetPresetRef.current && !targetPresetRef.current.contains(e.target as Node)) setTargetPresetOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [targetPresetOpen]);

  function setDuration(n: number) {
    const clamped = Math.min(840, Math.max(1, n));
    setDurationText(String(clamped));
    dispatch({ type: 'SET_DURATION', value: clamped });
  }

  // ── Duration ──────────────────────────────────────────────────────────────
  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setDurationText(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n)) {
      dispatch({ type: 'SET_DURATION', value: Math.min(840, Math.max(1, n)) });
    }
  }

  function handleDurationBlur() {
    const n = parseInt(durationText, 10);
    if (isNaN(n) || n < 1) {
      setDurationText(String(state.duration));
    } else {
      setDuration(n);
    }
  }

  function stepDuration(delta: number) {
    setDuration((parseInt(durationText, 10) || state.duration) + delta);
  }

  // ── Target ────────────────────────────────────────────────────────────────
  function setTarget(n: number) {
    const clamped = Math.min(5000, Math.max(1, n));
    setTargetText(String(clamped));
    dispatch({ type: 'SET_TARGET', value: clamped });
  }

  function handleTargetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setTargetText(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1 && n <= 5000) {
      dispatch({ type: 'SET_TARGET', value: n });
    }
  }

  function handleTargetBlur() {
    const n = parseInt(targetText, 10);
    if (isNaN(n) || n < 1) {
      setTargetText(String(state.targetParticipants));
    } else {
      setTarget(n);
    }
  }

  function stepTarget(delta: number) {
    setTarget((parseInt(targetText, 10) || state.targetParticipants) + delta);
  }

  // ── Date ────────────────────────────────────────────────────────────────
  function handleDateChange(iso: string) {
    dispatch({ type: 'SET_TIMEFRAME', value: iso });
    dispatch({ type: 'SET_WEEK_OFFSET', value: weekOffsetForIso(iso) });
  }

  const stepBtn = 'w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-brand-gray text-gray-600 hover:bg-gray-50 hover:text-brand-blue transition-colors';

  return (
    <div className="space-y-3">
      <Row label="Duration" help="How long your event will last. Use the chevron for common presets. Used to test student availability across the day.">
        <button type="button" onClick={() => stepDuration(-5)} className={stepBtn} aria-label="Decrease duration 5 minutes">
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
        <div ref={presetRef} className="relative flex-1 min-w-0">
          <input
            type="text"
            inputMode="numeric"
            value={durationText}
            onChange={handleDurationChange}
            onBlur={handleDurationBlur}
            className="w-full bg-transparent border-0 border-b-2 border-brand-gray rounded-none pl-1 pr-6 py-0.5 focus:outline-none focus:border-brand-blue text-sm text-center"
          />
          <button
            type="button"
            onClick={() => setPresetOpen(o => !o)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue"
            aria-label="Duration presets"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${presetOpen ? 'rotate-180' : ''}`} />
          </button>
          {presetOpen && (
            <div className="absolute right-0 mt-1 min-w-[200px] bg-white border border-brand-gray rounded-lg shadow-lg overflow-hidden z-30">
              {DURATION_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setDuration(p.value); setPresetOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    state.duration === p.value ? 'bg-brand-light-blue text-brand-blue font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={() => stepDuration(5)} className={stepBtn} aria-label="Increase duration 5 minutes">
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm text-gray-500 shrink-0">min</span>
      </Row>

      {/* Fixed start-time indicator (set by the chatbot) */}
      {state.fixedStartMin != null && (
        <div className="flex items-center gap-2 bg-brand-light-blue text-brand-blue rounded-lg px-3 py-1.5 text-xs font-semibold">
          <HelpTip text="The chatbot pinned this exact start time. The algorithm scores every active day at this time and recommends the best day(s). Clear it to return to flexible scheduling.">
            Fixed start: {fromMinutes(state.fixedStartMin)}
          </HelpTip>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_FIXED_TIME', value: null })}
            className="ml-auto text-brand-blue hover:text-blue-900"
            aria-label="Clear fixed start time"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Consider Days */}
      <div>
        <SectionTitle label="Select from" help="Which days of the week to consider. Unselected days are shown discolored in the heatmap and skipped by the algorithm." />
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

      {/* Priority */}
      <div>
        <SectionTitle label="Prioritize" help="Prefer morning (8am–12pm), afternoon (12pm–5pm), or evening (5pm–10pm). The algorithm favors these times but can override them to reach your target." />
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

      <Row label="Starting from" help="The earliest date to consider. Selecting a date jumps the calendar to that week.">
        <DatePicker valueIso={state.timeframeFrom} onChange={handleDateChange} />
      </Row>

      <Row label="Aim for" help="Target attendance. Use the chevron for common sizes. The algorithm flags slots that can't reach this number and may widen the time preference to hit it.">
        <button type="button" onClick={() => stepTarget(-5)} className={stepBtn} aria-label="Decrease target 5 participants">
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
        <div ref={targetPresetRef} className="relative flex-1 min-w-0">
          <input
            type="text"
            inputMode="numeric"
            value={targetText}
            onChange={handleTargetChange}
            onBlur={handleTargetBlur}
            className="w-full bg-transparent border-0 border-b-2 border-brand-gray rounded-none pl-1 pr-6 py-0.5 focus:outline-none focus:border-brand-blue text-sm text-center"
          />
          <button
            type="button"
            onClick={() => setTargetPresetOpen(o => !o)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue"
            aria-label="Participant presets"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${targetPresetOpen ? 'rotate-180' : ''}`} />
          </button>
          {targetPresetOpen && (
            <div className="absolute right-0 mt-1 min-w-[180px] bg-white border border-brand-gray rounded-lg shadow-lg overflow-hidden z-30">
              {TARGET_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => { setTarget(p.value); setTargetPresetOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    state.targetParticipants === p.value ? 'bg-brand-light-blue text-brand-blue font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={() => stepTarget(5)} className={stepBtn} aria-label="Increase target 5 participants">
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm text-gray-500 shrink-0">people</span>
      </Row>
    </div>
  );
}
