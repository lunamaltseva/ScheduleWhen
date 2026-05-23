import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildExplanation } from '../../algorithm/score';
import { ChevronUp, ChevronDown, ArrowLeft } from '../Icons';
import type { AlgorithmResult, TimePeriod } from '../../types';

// TODO: Replace rule-based responses with the Claude API once VITE_ANTHROPIC_API_KEY is set.
// Use @anthropic-ai/sdk with dangerouslyAllowBrowser: true. Pass algorithmResult + current state
// as system context. Detect parameter override intents, dispatch them, then let the LLM narrate
// the change and press Generate.

type DispatchFn = ReturnType<typeof useApp>['dispatch'];

function applyOverride(text: string, timePeriods: TimePeriod[], dispatch: DispatchFn): string | null {
  const lower = text.toLowerCase();

  // Duration: "60 minutes", "2 hours", "90 min"
  const durMatch = lower.match(/(\d+)\s*(hours?|hrs?|minutes?|mins?)/);
  if (durMatch) {
    let minutes = parseInt(durMatch[1]);
    if (/hours?|hrs?/.test(durMatch[2])) minutes *= 60;
    if (minutes >= 15 && minutes <= 300) {
      dispatch({ type: 'SET_DURATION', value: minutes });
      return `I've set the duration to ${minutes} minutes. Press Generate to see updated results.`;
    }
  }

  // Target participants: "30 people", "for 50 students", "50 attendees"
  const targetMatch = lower.match(/(?:for\s+)?(\d+)\s*(?:people|students?|participants?|attendees?|persons?)/);
  if (targetMatch) {
    const target = parseInt(targetMatch[1]);
    if (target >= 1 && target <= 2000) {
      dispatch({ type: 'SET_TARGET', value: target });
      return `I've updated the target to ${target} participants. Press Generate to see updated results.`;
    }
  }

  // Time period: exclusively set one period
  const periods: { keywords: string[]; value: TimePeriod; label: string }[] = [
    { keywords: ['morning', 'early morning'],                value: 'morning',   label: 'morning (8:00–12:05)' },
    { keywords: ['afternoon', 'midday', 'mid-day', 'noon'], value: 'afternoon', label: 'afternoon (12:45–16:50)' },
    { keywords: ['evening', 'night', 'late afternoon'],      value: 'evening',   label: 'evening (17:00–21:05)' },
  ];
  for (const { keywords, value, label } of periods) {
    if (keywords.some(k => lower.includes(k))) {
      for (const active of timePeriods) {
        if (active !== value) dispatch({ type: 'TOGGLE_TIME_PERIOD', value: active });
      }
      if (!timePeriods.includes(value)) dispatch({ type: 'TOGGLE_TIME_PERIOD', value });
      return `I've set the time preference to ${label}. Press Generate to see updated results.`;
    }
  }

  return null;
}

function getBotResponse(
  text: string,
  timePeriods: TimePeriod[],
  algorithmResult: AlgorithmResult | null,
  duration: number,
  dispatch: DispatchFn,
): string {
  const lower = text.toLowerCase();

  if (lower.includes('why') || lower.includes('explain')) {
    return algorithmResult
      ? buildExplanation(algorithmResult, duration)
      : 'No results yet — press Generate first to get a recommendation.';
  }

  const override = applyOverride(text, timePeriods, dispatch);
  if (override) return override;

  if (lower.includes('room')) {
    return 'Check the Recommended Rooms section in the sidebar. The category is based on your target participant count.';
  }

  if (lower.includes('when') || lower.includes('time') || lower.includes('slot') || lower.includes('best')) {
    if (algorithmResult?.suggestions.length) {
      const top = algorithmResult.suggestions[0];
      const dayLabel = top.pairedDay ? `${top.day}/${top.pairedDay}` : top.day;
      return `The top recommended slot is ${dayLabel} at ${top.startTime}–${top.endTime} (${Math.round(top.rawFreePercent)}% of on-campus students free). Press "Explain why" in the sidebar for a full breakdown.`;
    }
    return 'Press Generate to find the best time based on your current settings.';
  }

  if (lower.includes('filter')) {
    return 'Filters let you scope which students are considered. Use "+ Add Filter" in the sidebar to target specific departments, years, or residency status.';
  }

  return "I can help you find the best meeting time. Try asking me to explain the current recommendation, change the duration (e.g. \"set it to 90 minutes\"), or adjust the target (e.g. \"for 40 students\").";
}

const TEMPLATE_PROMPT = 'What time works best for a 2-hour workshop?';

interface ChatBotProps {
  mobileMode?: boolean;
}

export default function ChatBot({ mobileMode = false }: ChatBotProps) {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatMessages, state.chatOpen]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: { id: Math.random().toString(36).slice(2), role: 'user', text: text.trim() } });
    setInput('');

    const { timePeriods, algorithmResult, duration } = state;
    setTimeout(() => {
      const botText = getBotResponse(text.trim(), timePeriods, algorithmResult, duration, dispatch);
      dispatch({ type: 'ADD_CHAT_MESSAGE', message: { id: Math.random().toString(36).slice(2), role: 'bot', text: botText } });
    }, 1000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') sendMessage(input);
  }

  if (mobileMode) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="bg-brand-blue px-4 py-3 flex items-center gap-3 flex-none">
          <button
            onClick={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'sidebar' })}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold">Assistant</span>
        </div>
        <ChatBody
          messages={state.chatMessages}
          input={input}
          setInput={setInput}
          onKeyDown={handleKeyDown}
          messagesEndRef={messagesEndRef}
          onTemplateClick={() => sendMessage(TEMPLATE_PROMPT)}
          mobileMode
        />
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-20 w-96 z-40 flex flex-col rounded-t-2xl overflow-hidden border border-white/40 shadow-2xl">
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
        className="w-full bg-brand-blue text-white px-4 py-3 flex justify-between items-center hover:bg-blue-900 transition-colors flex-none"
      >
        <span className="font-semibold text-sm">Assistant</span>
        {state.chatOpen ? <ChevronDown /> : <ChevronUp />}
      </button>

      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: state.chatOpen ? '520px' : '0' }}
      >
        <ChatBody
          messages={state.chatMessages}
          input={input}
          setInput={setInput}
          onKeyDown={handleKeyDown}
          messagesEndRef={messagesEndRef}
          onTemplateClick={() => sendMessage(TEMPLATE_PROMPT)}
        />
      </div>
    </div>
  );
}

interface ChatBodyProps {
  messages: { id: string; role: 'user' | 'bot'; text: string }[];
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onTemplateClick: () => void;
  mobileMode?: boolean;
}

function ChatBody({ messages, input, setInput, onKeyDown, messagesEndRef, onTemplateClick, mobileMode = false }: ChatBodyProps) {
  return (
    <div className="bg-white flex flex-col" style={{ height: mobileMode ? '100%' : '480px' }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <p className="text-sm font-semibold text-gray-700">What would you want to schedule?</p>
            <button
              onClick={onTemplateClick}
              className="text-xs text-gray-400 italic hover:text-gray-600 transition-colors"
            >
              {TEMPLATE_PROMPT}
            </button>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug ${
                  m.role === 'user' ? 'bg-brand-gray text-black' : 'bg-brand-blue text-white'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      {messages.length > 0 && (
        <>
          <hr className="border-brand-gray" />
          <p className="text-[10px] text-gray-400 px-3 py-1">Responses may contain mistakes. Use your judgment.</p>
        </>
      )}
      <div className="px-3 pb-3 pt-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask something..."
          className="w-full border border-brand-gray rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-brand-blue"
        />
      </div>
    </div>
  );
}
