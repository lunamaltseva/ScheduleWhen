import Anthropic from '@anthropic-ai/sdk';
import type { AppState } from '../context/AppContext';
import type { TimePeriod } from '../types';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const recentRequests: number[] = [];

function checkRateLimit(): { allowed: boolean; waitSec: number } {
  const now = Date.now();
  while (recentRequests.length > 0 && recentRequests[0] < now - RATE_WINDOW_MS) {
    recentRequests.shift();
  }
  if (recentRequests.length >= RATE_MAX) {
    return { allowed: false, waitSec: Math.ceil((RATE_WINDOW_MS - (now - recentRequests[0])) / 1000) };
  }
  recentRequests.push(now);
  return { allowed: true, waitSec: 0 };
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'set_duration',
    description: 'Set the event duration in minutes. Use when the user specifies how long the event should be (e.g. "make it 2 hours", "90-minute meeting").',
    input_schema: {
      type: 'object' as const,
      properties: {
        minutes: { type: 'number', description: 'Duration in minutes (1–840)' },
      },
      required: ['minutes'],
    },
  },
  {
    name: 'set_days',
    description: 'Set which days of the week to consider. Pass the complete desired set. Use when the user mentions specific days or wants to exclude certain days.',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'array',
          items: { type: 'string', enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
          description: 'Complete list of days to enable. E.g. ["Mon","Wed","Fri"].',
        },
      },
      required: ['days'],
    },
  },
  {
    name: 'set_time_periods',
    description: 'Set preferred time periods for the event. Use when the user specifies morning, afternoon, or evening preference. Pass empty array for any time.',
    input_schema: {
      type: 'object' as const,
      properties: {
        periods: {
          type: 'array',
          items: { type: 'string', enum: ['morning', 'afternoon', 'evening'] },
          description: 'Preferred time periods. Empty array means no preference.',
        },
      },
      required: ['periods'],
    },
  },
  {
    name: 'set_target_participants',
    description: 'Set the target number of participants. Use when the user mentions an expected attendance or headcount.',
    input_schema: {
      type: 'object' as const,
      properties: {
        count: { type: 'number', description: 'Number of participants (1–5000)' },
      },
      required: ['count'],
    },
  },
  {
    name: 'set_start_date',
    description: 'Set the earliest date to consider (the "Starting from" date). Use when the user mentions a specific start date.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date in ISO format YYYY-MM-DD (e.g. 2026-09-21)' },
      },
      required: ['date'],
    },
  },
  {
    name: 'set_fixed_time',
    description: 'Pin the event to an EXACT start time (e.g. exactly 1pm). When pinned, the algorithm scores every active day at that precise time and recommends the best day(s) — it will not search other times. Use when the user insists on a specific clock time. To return to flexible scheduling, call with clear=true.',
    input_schema: {
      type: 'object' as const,
      properties: {
        hour:   { type: 'number', description: 'Hour in 24h format (8–21). Omit when clearing.' },
        minute: { type: 'number', description: 'Minute (0–59), default 0. Omit when clearing.' },
        clear:  { type: 'boolean', description: 'Set true to remove the fixed time and resume flexible scheduling.' },
      },
      required: [],
    },
  },
];

// ── Param actions (subset of AppContext Action, safe to dispatch) ──────────────

export type ParamAction =
  | { type: 'SET_DURATION'; value: number; fromAI: true }
  | { type: 'SET_SELECTED_DAYS'; days: boolean[]; fromAI: true }
  | { type: 'SET_TIME_PERIODS_LIST'; periods: TimePeriod[]; fromAI: true }
  | { type: 'SET_TARGET'; value: number; fromAI: true }
  | { type: 'SET_TIMEFRAME'; value: string; fromAI: true }
  | { type: 'SET_FIXED_TIME'; value: number | null; fromAI: true };

// ── Yielded chunks ────────────────────────────────────────────────────────────

export type AIChunk = string | { _actions: ParamAction[] };

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a concise scheduling assistant for ScheduleWhen at AUCA (American University of Central Asia). Help users understand recommendations and configure events.

Rules:
- Answer in 2–3 sentences unless the user explicitly asks for detail.
- Never ask more than one clarifying question per reply.
- Never invent data, room numbers, or policies not in the context block.
- Match the user's language (English/Russian/Kyrgyz). Don't penalise imperfect spelling.
- Use the configuration tools whenever the user wants to change an event parameter — even if phrased casually ("make it 2 hours", "skip weekends", "I need 40 people", "only afternoons", "start from Sept 21", "make it exactly 1pm"). Apply the change immediately, then confirm briefly in your text reply. You can fine-tune any single parameter on request.
- For an EXACT clock time ("at 1pm sharp", "exactly 13:00"), use set_fixed_time — the algorithm then locks that start and picks the best day(s). Use set_fixed_time with clear=true to go back to flexible times.
- When the user wants to configure an event but hasn't given all details, ask one focused question.
- If uncertain, say so briefly. Direct room-booking questions to the Registrar, Room 110.

Current context:
{{CONTEXT}}`;

// ── Context builder ───────────────────────────────────────────────────────────

export function buildContextBlock(state: AppState): string {
  const {
    duration, selectedDays, timePeriods, targetParticipants,
    filters, isDirty, algorithmResult, dataState, timeframeFrom, fixedStartMin,
  } = state;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDays = DAYS.filter((_, i) => selectedDays[i]).join(', ');
  const fixedLabel = fixedStartMin != null
    ? `${Math.floor(fixedStartMin / 60)}:${String(fixedStartMin % 60).padStart(2, '0')}`
    : 'none (flexible)';

  const lines: string[] = [
    `Data: ${dataState}`,
    `Duration: ${duration} min`,
    `Days: ${activeDays || 'none'}`,
    `Time pref: ${timePeriods.join(', ') || 'any'}`,
    `Fixed start time: ${fixedLabel}`,
    `Start date: ${timeframeFrom}`,
    `Target: ${targetParticipants} participants`,
    `Filters: ${filters.length === 0
      ? 'all students'
      : filters.map(f => {
          const parts: string[] = [];
          if (f.depts.length) parts.push(`depts: ${f.depts.join('/')}`);
          if (f.years.length) parts.push(`years: ${f.years.join('/')}`);
          if (f.status !== 'any') parts.push(f.status);
          return `[${parts.join(', ') || 'all'}]`;
        }).join(' + ')
    }`,
    `Fresh results: ${!isDirty && algorithmResult !== null}`,
  ];

  if (!isDirty && algorithmResult) {
    const r = algorithmResult;
    lines.push(`Eligible students: ${r.eligibleCount}`);
    lines.push(`Target met: ${r.targetMet}`);
    if (r.overrideReason) lines.push(`Note: ${r.overrideReason}`);

    r.suggestions.forEach((s, i) => {
      const dayLabel = s.pairedDay ? `${s.day}/${s.pairedDay}` : s.day;
      lines.push(
        `Option ${i + 1} (${s.rank}): ${dayLabel} ${s.startTime}–${s.endTime} | ` +
        `${Math.round(s.rawFreePercent)}% of eligible free | ~${s.onCampusCount} on-campus | ` +
        `score=${s.weightedScore.toFixed(1)}`
      );
    });
  } else {
    lines.push('Recommendation: not generated yet');
  }

  return lines.join('\n');
}

// ── Tool call processor ───────────────────────────────────────────────────────

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const VALID_PERIODS = new Set(['morning', 'afternoon', 'evening']);

function processToolCall(
  name: string,
  input: Record<string, unknown>,
  actions: ParamAction[],
): string {
  switch (name) {
    case 'set_duration': {
      const minutes = Math.min(840, Math.max(1, Math.round(Number(input.minutes))));
      actions.push({ type: 'SET_DURATION', value: minutes, fromAI: true });
      return `Duration set to ${minutes} minutes.`;
    }
    case 'set_days': {
      const wanted = new Set((input.days as string[]) ?? []);
      const days = DAY_NAMES.map(d => wanted.has(d));
      actions.push({ type: 'SET_SELECTED_DAYS', days, fromAI: true });
      const labels = DAY_NAMES.filter(d => wanted.has(d)).join(', ');
      return `Days set to: ${labels || 'none'}.`;
    }
    case 'set_time_periods': {
      const raw = (input.periods as string[]) ?? [];
      const periods = raw.filter(p => VALID_PERIODS.has(p)) as TimePeriod[];
      actions.push({ type: 'SET_TIME_PERIODS_LIST', periods, fromAI: true });
      return `Time preference set to: ${periods.join(', ') || 'any'}.`;
    }
    case 'set_target_participants': {
      const count = Math.min(5000, Math.max(1, Math.round(Number(input.count))));
      actions.push({ type: 'SET_TARGET', value: count, fromAI: true });
      return `Target participants set to ${count}.`;
    }
    case 'set_start_date': {
      const raw = String(input.date ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'Invalid date — expected YYYY-MM-DD. No change made.';
      actions.push({ type: 'SET_TIMEFRAME', value: raw, fromAI: true });
      return `Start date set to ${raw}.`;
    }
    case 'set_fixed_time': {
      if (input.clear === true) {
        actions.push({ type: 'SET_FIXED_TIME', value: null, fromAI: true });
        return 'Fixed start time cleared — scheduling is flexible again.';
      }
      const hour = Math.round(Number(input.hour));
      const minute = input.minute != null ? Math.round(Number(input.minute)) : 0;
      if (isNaN(hour) || hour < 8 || hour > 21 || minute < 0 || minute > 59) {
        return 'Invalid time — hour must be 8–21 and minute 0–59. No change made.';
      }
      const value = hour * 60 + minute;
      actions.push({ type: 'SET_FIXED_TIME', value, fromAI: true });
      return `Event pinned to ${hour}:${String(minute).padStart(2, '0')}. The algorithm will choose the best day(s) at this exact time.`;
    }
    default:
      return 'Unknown tool — no change made.';
  }
}

// ── Streaming call with tool use ──────────────────────────────────────────────
//
// Phase 1 (non-streaming): initial call; model may invoke tools to update params.
// Phase 2 (streaming):     follow-up call (or initial if no tools); yields text.
//
// The generator yields either plain text chunks or { _actions } objects.
// The caller should dispatch actions immediately when it sees { _actions }.

export async function* streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  contextBlock: string,
): AsyncGenerator<AIChunk> {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    yield '⚠️ No API key configured. Add VITE_ANTHROPIC_API_KEY to your .env.local file.';
    return;
  }

  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    yield `⚠️ Too many requests — please wait ${rateCheck.waitSec}s and try again.`;
    return;
  }

  const system = SYSTEM_PROMPT.replace('{{CONTEXT}}', contextBlock);

  // Phase 1: non-streaming call with tools enabled
  const firstResponse = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system,
    messages,
    tools: TOOLS,
  });

  // Yield any text the model produced alongside its tool calls
  for (const block of firstResponse.content) {
    if (block.type === 'text' && block.text) yield block.text;
  }

  // If model didn't call any tools, we're done
  const toolUseBlocks = firstResponse.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );
  if (toolUseBlocks.length === 0) return;

  // Process tool calls → collect actions + build tool_result messages
  const actions: ParamAction[] = [];
  const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(block => ({
    type: 'tool_result' as const,
    tool_use_id: block.id,
    content: processToolCall(block.name, block.input as Record<string, unknown>, actions),
  }));

  // Dispatch all param changes at once
  if (actions.length > 0) yield { _actions: actions };

  // Phase 2: streaming call to get the natural-language confirmation
  const followUpMessages: Anthropic.MessageParam[] = [
    ...messages,
    { role: 'assistant', content: firstResponse.content },
    { role: 'user',      content: toolResults },
  ];

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system,
    messages: followUpMessages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
