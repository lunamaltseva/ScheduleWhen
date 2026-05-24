import { DAYS_FULL } from '../constants';
import type { Student, Filter, Suggestion, AlgorithmResult, TimePeriod } from '../types';

// ── Time helpers ───────────────────────────────────────────────────────────────

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
}

export function addMinutes(hhmm: string, delta: number): string {
  return fromMinutes(toMinutes(hhmm) + delta);
}

// ── Candidate start times ──────────────────────────────────────────────────────
// Test events at every class boundary (start AND end of any standard slot) so
// windows like the 12:05–12:45 lunch gap are always considered.

const STANDARD_CLASS_STARTS = [480, 565, 650, 765, 850, 935, 1020, 1105, 1190];
const STANDARD_CLASS_ENDS   = STANDARD_CLASS_STARTS.map(m => m + 75);
const NONSTANDARD_STARTS    = [1050, 1080, 1110, 1140, 1170]; // 17:30–19:30

const ALL_BREAKPOINTS = [
  ...new Set([...STANDARD_CLASS_STARTS, ...STANDARD_CLASS_ENDS, ...NONSTANDARD_STARTS]),
].sort((a, b) => a - b);

const DAY_START_MIN = 480;
const DAY_END_MIN   = 1320;
const LUNCH_GAP_MIN = 725; // 12:05 = end of the 10:50 class

function getCandidateStarts(duration: number): number[] {
  return ALL_BREAKPOINTS.filter(m => m >= DAY_START_MIN && m + duration <= DAY_END_MIN);
}

// ── Priority period minute ranges ──────────────────────────────────────────────
// Wider than slot-index ranges so the 12:05 lunch start falls in "afternoon".

const PRIORITY_MINUTES: Record<TimePeriod, [number, number]> = {
  morning:   [480,  725],
  afternoon: [725, 1020],
  evening:  [1020, 1320],
};

// ── Time-of-day weight ─────────────────────────────────────────────────────────

function getTimeWeight(startMin: number): number {
  const h = startMin / 60;
  // Campus is nearly empty in early morning; most students arrive from 9:25 onward.
  // After the 15:35 class, attendance drops sharply as students leave for the day.
  if (h < 8.5)  return 0.35; // campus barely active; almost no one has arrived
  if (h < 9.5)  return 0.68; // people still arriving — momentum builds toward 9:25
  if (h < 12.0) return 0.92; // mid-morning peak: classes in session, campus full
  if (h < 15.0) return 1.00; // prime afternoon: largest on-campus population
  if (h < 16.5) return 0.88; // late afternoon: still good but some have left
  if (h < 17.5) return 0.65; // after 15:35 class ends, departure wave starts
  if (h < 19.0) return 0.45; // evening: campus thinning out noticeably
  if (h < 20.5) return 0.30; // late evening: only committed evening students remain
  return 0.18;                // very late: campus nearly deserted
}

// ── Student-mix adjustment ─────────────────────────────────────────────────────
// UG students are less likely to show for very early-morning or late-evening events.
// PG students also skew away from early mornings (but less severely).

const PG_YEAR_SET = new Set(['Masters 1st Year', 'Masters 2nd Year']);

function getMixAdjust(onCampus: Student[], startMin: number): number {
  if (onCampus.length === 0) return 1.0;

  const pgCount = onCampus.filter(s => PG_YEAR_SET.has(s.year)).length;
  const ugFrac  = (onCampus.length - pgCount) / onCampus.length;
  const pgFrac  = pgCount / onCampus.length;

  // Very early (before 9:25): most UG/PG students haven't arrived yet
  if (startMin < 565) return Math.max(0.22, 1.0 - ugFrac * 0.48 - pgFrac * 0.28);
  // Early (9:25–10:50): still building — lighter morning penalty
  if (startMin < 650) return Math.max(0.52, 1.0 - ugFrac * 0.22 - pgFrac * 0.12);
  // Late evening (18:25+): UG largely gone after afternoon; PG also tapering off
  if (startMin >= 1105) return Math.max(0.28, 1.0 - ugFrac * 0.50 - pgFrac * 0.28);
  // Evening (17:00–18:25): post-afternoon departure wave, UG especially
  if (startMin >= 1020) return Math.max(0.45, 1.0 - ugFrac * 0.32 - pgFrac * 0.18);

  return 1.0; // prime time
}

// ── Lunch gap bonus ────────────────────────────────────────────────────────────
// A 12:05-start event gets a bonus for any duration: even for longer events,
// students arriving from morning classes are guaranteed to show up for the start.
// Students with a 12:45 class will leave mid-event but still count as partial
// attendees (tracked separately in scoreWindow).

function getLunchAdjust(startMin: number, endMin: number): number {
  const NEXT_CLASS = 765; // 12:45
  const NEXT_END   = 840; // 14:00
  const duration   = endMin - startMin;

  if (startMin === LUNCH_GAP_MIN) {
    if (endMin <= NEXT_CLASS) return duration <= 40 ? 1.40 : 1.20; // fits the gap
    return 1.10; // overruns 12:45 — partial attendance still makes this valuable
  }
  if (startMin === NEXT_CLASS && endMin <= NEXT_END) return 1.10; // classic 12:45 slot
  return 1.0;
}

// ── Filter helpers ─────────────────────────────────────────────────────────────

function matchesFilter(student: Student, filter: Filter): boolean {
  if (filter.depts.length > 0 && !filter.depts.includes(student.dept)) return false;
  if (filter.years.length > 0 && !filter.years.includes(student.year)) return false;
  if (filter.status === 'domestic'      && student.international)  return false;
  if (filter.status === 'international' && !student.international) return false;
  return true;
}

function getEligibleStudents(students: Student[], filters: Filter[]): Student[] {
  const isDefaultOnly =
    filters.length === 1 && filters[0].id === 'default' && filters[0].depts.length === 0;
  if (filters.length === 0 || isDefaultOnly) return students;
  return students.filter(s => filters.some(f => matchesFilter(s, f)));
}

// ── Per-student predicates ─────────────────────────────────────────────────────

function isOnCampus(student: Student, day: string): boolean {
  return student.periods.some(p => p.day === day);
}

function isBusy(student: Student, day: string, startMin: number, endMin: number): boolean {
  return student.periods.some(
    p => p.day === day && p.startMin < endMin && p.endMin > startMin,
  );
}

function hasMidEventClass(student: Student, day: string, startMin: number, endMin: number): boolean {
  return student.periods.some(
    p => p.day === day && p.startMin > startMin && p.startMin < endMin,
  );
}

// ── Score a single event window ────────────────────────────────────────────────

interface WindowScore {
  day: string;
  startMin: number;
  score: number;
  rawFreePercent: number;
  onCampusCount: number;
  timeWeight: number;
  lunchAdjust: number;
  midEventDeparturePct: number;
  lunchPartialCount: number;
}

function scoreWindow(
  day: string,
  startMin: number,
  duration: number,
  eligible: Student[],
): WindowScore {
  const endMin    = startMin + duration;
  const onCampus  = eligible.filter(s => isOnCampus(s, day));
  const total     = onCampus.length || 1; // denominator = students on campus that day

  let freeCount         = 0;
  let midEventCount     = 0;
  let lunchPartialCount = 0;

  const isLunchOverrun = startMin === LUNCH_GAP_MIN && endMin > 765;

  for (const student of onCampus) {
    if (!isBusy(student, day, startMin, endMin)) {
      freeCount++;
    } else if (isLunchOverrun && student.periods.some(p => p.day === day && p.startMin === 765)) {
      // Has 12:45 class — can attend the 12:05–12:45 portion
      lunchPartialCount++;
    }
    if (hasMidEventClass(student, day, startMin, endMin)) midEventCount++;
  }

  const effectiveFree  = freeCount + 0.5 * lunchPartialCount;
  const rawFreePercent = (effectiveFree / total) * 100;
  const timeWeight     = getTimeWeight(startMin);
  const lunchAdjust    = getLunchAdjust(startMin, endMin);
  const mixAdjust      = getMixAdjust(onCampus, startMin);

  return {
    day,
    startMin,
    score: rawFreePercent * timeWeight * lunchAdjust * mixAdjust,
    rawFreePercent,
    onCampusCount: Math.round(effectiveFree),
    timeWeight,
    lunchAdjust,
    midEventDeparturePct: onCampus.length > 0 ? midEventCount / onCampus.length : 0,
    lunchPartialCount,
  };
}

// ── Overlap check ──────────────────────────────────────────────────────────────

function overlaps(startA: number, startB: number, duration: number): boolean {
  return startA < startB + duration && startB < startA + duration;
}

// ── Day-pair scoring ───────────────────────────────────────────────────────────

interface PairedScore extends WindowScore {
  pairedDay?: string;
}

function bestForPair(
  day1: string,
  day2: string,
  allScores: WindowScore[],
): PairedScore | null {
  const d1 = allScores.filter(s => s.day === day1);
  const d2 = allScores.filter(s => s.day === day2);
  if (d1.length === 0 && d2.length === 0) return null;

  const startMins = [...new Set([...d1.map(s => s.startMin), ...d2.map(s => s.startMin)])];
  let best: PairedScore | null = null;

  for (const sm of startMins) {
    const s1 = d1.find(s => s.startMin === sm);
    const s2 = d2.find(s => s.startMin === sm);
    const count = (s1 ? 1 : 0) + (s2 ? 1 : 0);
    const avgScore = ((s1?.score ?? 0) + (s2?.score ?? 0)) / count;
    const primary  = !s1 ? s2! : !s2 ? s1 : s1.score >= s2.score ? s1 : s2;
    const pairedDay = (s1 && s2) ? (primary.day === day1 ? day2 : day1) : undefined;
    const candidate: PairedScore = { ...primary, score: avgScore, pairedDay };
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}

// ── Core algorithm ─────────────────────────────────────────────────────────────

function buildSuggestions(
  allScores: WindowScore[],
  duration: number,
  activeDays: string[],
): { suggestions: Suggestion[]; toSuggestion: (r: PairedScore | WindowScore | null, rank: Suggestion['rank']) => Suggestion | null } {
  const bestMW  = activeDays.includes('Mon') || activeDays.includes('Wed')
    ? bestForPair('Mon', 'Wed', allScores)
    : null;
  const bestTTh = activeDays.includes('Tue') || activeDays.includes('Thu')
    ? bestForPair('Tue', 'Thu', allScores)
    : null;

  // Track selected windows (for overlap-aware alternative selection)
  const selectedWindows: { day: string; startMin: number }[] = [];
  for (const b of [bestMW, bestTTh]) {
    if (!b) continue;
    selectedWindows.push({ day: b.day, startMin: b.startMin });
    if (b.pairedDay) selectedWindows.push({ day: b.pairedDay, startMin: b.startMin });
  }

  function overlapsPrimary(s: WindowScore): boolean {
    return selectedWindows.some(
      w => w.day === s.day && overlaps(w.startMin, s.startMin, duration),
    );
  }

  const toSuggestion = (
    result: PairedScore | WindowScore | null,
    rank: Suggestion['rank'],
  ): Suggestion | null => {
    if (!result) return null;
    return {
      rank,
      day: result.day,
      pairedDay: (result as PairedScore).pairedDay,
      startTime: fromMinutes(result.startMin),
      endTime: fromMinutes(result.startMin + duration),
      weightedScore: result.score,
      rawFreePercent: result.rawFreePercent,
      onCampusCount: result.onCampusCount,
      factors: {
        timeWeight:           result.timeWeight,
        lunchAdjust:          result.lunchAdjust,
        midEventDeparturePct: result.midEventDeparturePct,
        lunchPartialCount:    (result as WindowScore).lunchPartialCount ?? 0,
      },
    };
  };

  // Alternatives: must not overlap any primary on the same day
  const remaining = allScores
    .filter(s => !overlapsPrimary(s))
    .sort((a, b) => b.score - a.score);

  const alt1 = remaining[0] ?? null;
  const alt2 = alt1
    ? remaining.find(s => !(s.day === alt1.day && overlaps(s.startMin, alt1.startMin, duration))) ?? null
    : null;

  const suggestions = [
    toSuggestion(bestMW,  'primary-mw'),
    toSuggestion(bestTTh, 'primary-tth'),
    toSuggestion(alt1,    'alt-1'),
    toSuggestion(alt2,    'alt-2'),
  ].filter((s): s is Suggestion => s !== null);

  // Always guarantee a lunch-window suggestion when the gap looks good and no
  // suggestion already occupies 12:05 — even for longer events, partial
  // attendance makes the slot worthwhile.
  {
    const hasLunch = suggestions.some(s => toMinutes(s.startTime) === LUNCH_GAP_MIN);
    if (!hasLunch) {
      const bestLunch = allScores
        .filter(s => s.startMin === LUNCH_GAP_MIN)
        .sort((a, b) => b.rawFreePercent - a.rawFreePercent)[0];
      if (bestLunch && bestLunch.rawFreePercent >= 20) {
        const lunchSugg = toSuggestion(bestLunch, 'alt-2');
        if (lunchSugg) {
          if (suggestions.length >= 4) {
            suggestions[3] = lunchSugg;
          } else {
            suggestions.push(lunchSugg);
          }
        }
      }
    }
  }

  return { suggestions, toSuggestion };
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function runAlgorithm(
  students: Student[],
  filters: Filter[],
  duration: number,
  selectedDays: boolean[],
  timePeriods: TimePeriod[],
  targetParticipants: number,
): AlgorithmResult {
  const eligible   = getEligibleStudents(students, filters);
  const activeDays = DAYS_FULL.filter((_, i) => selectedDays[i]);

  function scoreAllWindows(starts: number[]): WindowScore[] {
    const scores: WindowScore[] = [];
    for (const day of activeDays) {
      for (const sm of starts) {
        scores.push(scoreWindow(day, sm, duration, eligible));
      }
    }
    return scores;
  }

  // Primary run: respect user's time-period preference
  const filteredStarts = getCandidateStarts(duration).filter(m => {
    if (timePeriods.length === 0) return true;
    return timePeriods.some(p => {
      const [lo, hi] = PRIORITY_MINUTES[p];
      return m >= lo && m < hi;
    });
  });

  const allScores = scoreAllWindows(filteredStarts);
  const { suggestions } = buildSuggestions(allScores, duration, activeDays);

  const bestCount = suggestions[0]?.onCampusCount ?? 0;
  const targetMet = bestCount >= targetParticipants;

  // If target not met, try expanding to all time periods
  let prefOverridden = false;
  let overrideReason: string | undefined;
  let finalSuggestions = suggestions;

  if (!targetMet && timePeriods.length > 0) {
    const allStarts    = getCandidateStarts(duration);
    const allScoresExp = scoreAllWindows(allStarts);
    const { suggestions: expandedSugg } = buildSuggestions(allScoresExp, duration, activeDays);
    const expandedBest = expandedSugg[0]?.onCampusCount ?? 0;

    if (expandedBest > bestCount) {
      prefOverridden   = true;
      overrideReason   = `Time preference overridden — the selected period couldn't reach ${targetParticipants} participants. Best available: ~${expandedBest} on campus.`;
      finalSuggestions = expandedSugg;
    }
  }

  if (!targetMet && !prefOverridden && eligible.length < targetParticipants) {
    overrideReason = `Only ${eligible.length} students match your current filters — the target of ${targetParticipants} is not achievable. Consider broadening your filters.`;
  } else if (!targetMet && !prefOverridden) {
    overrideReason = `The best available slot reaches ~${bestCount} on-campus students. The target of ${targetParticipants} may not be achievable with the current schedule.`;
  }

  return {
    suggestions: finalSuggestions,
    timestamp: Date.now(),
    params: {
      duration,
      selectedDays: [...selectedDays],
      timePeriods: [...timePeriods],
      targetParticipants,
      filterCount: filters.length,
    },
    targetMet,
    prefOverridden,
    overrideReason,
  };
}

// ── Explanation builder ────────────────────────────────────────────────────────

export function buildExplanation(result: AlgorithmResult, duration: number): string {
  const top = result.suggestions[0];
  if (!top) return 'No recommendations yet — press Generate to run the analysis.';

  const dayLabel = top.pairedDay ? `${top.day} / ${top.pairedDay}` : top.day;
  const lines: string[] = [];

  lines.push(
    `The top recommendation is ${dayLabel} at ${top.startTime}–${top.endTime}: ` +
    `${Math.round(top.rawFreePercent)}% of on-campus students are free, ` +
    `with approximately ${top.onCampusCount} students on campus at that time.`,
  );

  if (result.prefOverridden && result.overrideReason) {
    lines.push(result.overrideReason);
  } else if (!result.targetMet && result.overrideReason) {
    lines.push(result.overrideReason);
  }

  if (top.factors.timeWeight <= 0.65) {
    const h = parseInt(top.startTime.split(':')[0]);
    lines.push(h < 9
      ? 'Time-of-day score is reduced — early-morning events have lower turnout.'
      : 'Time-of-day score is reduced — late-evening events have lower attendance.',
    );
  }
  if (top.factors.lunchAdjust >= 1.35) {
    lines.push('Strong lunch-gap bonus: event fits perfectly in the 12:05–12:45 break when many students are on campus between classes.');
  } else if (top.factors.lunchAdjust > 1) {
    lines.push('Lunch slot bonus: many students remain on campus between morning and afternoon classes.');
  } else if (top.factors.lunchAdjust < 1) {
    lines.push(`The event (${duration} min) overruns into another class slot — some students will leave early.`);
  }
  if (top.factors.midEventDeparturePct > 0.05) {
    lines.push(
      `~${Math.round(top.factors.midEventDeparturePct * 100)}% of on-campus students ` +
      'have a class starting during the event and would need to leave early.',
    );
  }
  if (top.pairedDay) {
    lines.push(
      `Because most AUCA courses meet on the same weekday pair, this works for both ${top.day} and ${top.pairedDay}.`,
    );
  }

  const alt = result.suggestions.find(s => s.rank === 'alt-1');
  if (alt) {
    const altDay = alt.pairedDay ? `${alt.day}/${alt.pairedDay}` : alt.day;
    lines.push(`Best alternative: ${altDay} at ${alt.startTime} (score ${Math.round(alt.weightedScore)}).`);
  }

  return lines.join(' ');
}
