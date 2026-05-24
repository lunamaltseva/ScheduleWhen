import Anthropic from '@anthropic-ai/sdk';
import type { AppState } from '../context/AppContext';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a scheduling assistant for ScheduleWhen, a tool used at AUCA (American University of Central Asia) to help students, faculty, and staff find the best time to hold events based on student schedule data.

Your role is to help users:
- Understand why a particular time slot was recommended
- Explore alternatives and trade-offs between different time slots
- Adjust event parameters (duration, time preference, target size) conversationally
- Find appropriate rooms based on group size
- Navigate the filters and settings in the tool

## Accessibility and language

You serve a multilingual community. Many users communicate in English as a second or third language, or mix languages (Russian, Kyrgyz, English). If a user writes to you in a non-English language or mixes languages, reply primarily in that language — do not switch them to English. Match their register: if they write casually, be casual; if formally, be formal.

Do not penalise imperfect spelling, grammar, or phrasing. Interpret what was meant, not just what was written. If you genuinely cannot tell what a user is asking, ask one focused clarifying question — not multiple questions at once.

## Plain language

When you use scheduling or statistical terms (e.g. "availability", "conflict overlap", "weighted score"), briefly explain what they mean in parentheses the first time you use them in a conversation. Do not assume familiarity with university scheduling jargon.

## Honesty and accuracy

- Never invent data, dates, room numbers, or policies that are not in the context provided to you.
- If you are uncertain about something, say so explicitly ("I'm not sure, but…").
- If a question is outside your knowledge (e.g. specific room booking procedures), say "I don't have that information — for room bookings, contact the Registrar's Office in Room 110."
- Do not make up student counts, percentages, or recommendations that contradict the data in the context block.

## Time-sensitivity

When relevant, flag that recommendations are based on the week currently displayed in the calendar. If the user is planning far ahead, remind them that attendance patterns might differ.

## Encouraging tone

Use a warm, helpful tone. Do not assume the user has prior experience with the tool. If they seem confused, offer a brief orientation ("It looks like you might be new to this — here's how it works…").

## Feedback

If a user expresses frustration or has a suggestion about the tool itself, acknowledge it kindly and direct them to: Room 110 (Registrar's Office), or the GitHub Issues page at https://github.com/lunamaltseva/ScheduleWhen/issues

## Current tool context

The following block describes the user's current settings and the latest recommendation computed by the algorithm. Use it to answer questions precisely.

{{CONTEXT}}`;

// ── Context builder ───────────────────────────────────────────────────────────

export function buildContextBlock(state: AppState): string {
  const {
    duration, selectedDays, timePeriods, targetParticipants,
    filters, isDirty, algorithmResult, dataState,
  } = state;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDays = DAYS.filter((_, i) => selectedDays[i]).join(', ');

  const lines: string[] = [
    `Data status: ${dataState}`,
    `Event duration: ${duration} minutes`,
    `Active days: ${activeDays || 'none'}`,
    `Time preference: ${timePeriods.join(', ')}`,
    `Target participants: ${targetParticipants}`,
    `Filters: ${filters.length === 1 && filters[0].id === 'default' && filters[0].depts.length === 0
      ? 'none (all students)'
      : filters.map(f => {
          const parts: string[] = [];
          if (f.depts.length) parts.push(`depts: ${f.depts.join('/')}`);
          if (f.years.length) parts.push(`years: ${f.years.join('/')}`);
          if (f.status !== 'any') parts.push(f.status);
          return `[${parts.join(', ') || 'all students'}]`;
        }).join(' + ')
    }`,
    `Results up to date: ${!isDirty && algorithmResult !== null}`,
  ];

  if (!isDirty && algorithmResult) {
    const r = algorithmResult;
    lines.push(`Target met: ${r.targetMet}`);
    if (r.prefOverridden) lines.push(`Note: time preference was overridden — ${r.overrideReason ?? 'no good slots in preferred window'}`);

    r.suggestions.forEach((s, i) => {
      const dayLabel = s.pairedDay ? `${s.day}/${s.pairedDay}` : s.day;
      lines.push(
        `Suggestion ${i + 1} (${s.rank}): ${dayLabel} ${s.startTime}–${s.endTime} | ` +
        `${Math.round(s.rawFreePercent)}% free | ~${s.onCampusCount} on-campus free students | ` +
        `score=${s.weightedScore.toFixed(2)} (timeWeight=${s.factors.timeWeight.toFixed(2)}, ` +
        `departureMidEvent=${Math.round(s.factors.midEventDeparturePct * 100)}%, ` +
        `lunchAdjust=${s.factors.lunchAdjust.toFixed(2)})`
      );
      if (s.factors.lunchPartialCount > 0) {
        lines.push(`  ↳ ${s.factors.lunchPartialCount} students can only attend the first part (must leave at 12:45 for class)`);
      }
    });
  } else {
    lines.push('Recommendation: not yet generated (user needs to press Generate)');
  }

  return lines.join('\n');
}

// ── Streaming call ────────────────────────────────────────────────────────────

export async function* streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  contextBlock: string,
): AsyncGenerator<string> {
  if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
    yield '⚠️ No API key configured. Set VITE_ANTHROPIC_API_KEY in your .env.local file to enable the AI assistant.';
    return;
  }

  const systemWithContext = SYSTEM_PROMPT.replace('{{CONTEXT}}', contextBlock);

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 512,
    system: systemWithContext,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}
