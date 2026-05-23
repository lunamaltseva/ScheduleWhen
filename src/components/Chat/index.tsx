import { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import { ChevronUp, ChevronDown, ArrowLeft } from '../Icons';
import type { Recommendation } from '../../types';

function getBotResponse(text: string, rec: Recommendation | null): string {
  const lower = text.toLowerCase();
  if (lower.includes('why') || lower.includes('explain')) {
    return rec
      ? `The best slot is ${rec.day} at ${rec.slot}–${rec.endTime} with ${Math.round(rec.freePercent)}% of your group free — ${rec.eligibleCount.toLocaleString()} eligible students.`
      : 'No clear recommendation yet. Try adding filters or selecting more days.';
  }
  if (lower.includes('room')) {
    return 'Check the Recommended Rooms section in the sidebar. The category shown is based on your target participant count.';
  }
  if (lower.includes('when') || lower.includes('time') || lower.includes('slot')) {
    return rec
      ? `Top recommended slot: ${rec.day} ${rec.slot}–${rec.endTime}.`
      : 'Set your filters and select target participants to get a recommendation.';
  }
  if (lower.includes('filter')) {
    return 'Filters let you scope which students are considered. Use "+ Add Filter" in the sidebar to define departments, years, and status.';
  }
  return "Based on your filters, I've identified the optimal time slot. Click 'Explain why' in the sidebar for a detailed breakdown.";
}

const TEMPLATE_PROMPT = 'What time works best for a 2-hour workshop?';

interface ChatBotProps {
  mobileMode?: boolean;
}

export default function ChatBot({ mobileMode = false }: ChatBotProps) {
  const { state, dispatch } = useApp();
  const { recommendations } = useResults();
  const recommendation = recommendations[0] ?? null;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatMessages, state.chatOpen]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userId = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD_CHAT_MESSAGE', message: { id: userId, role: 'user', text: text.trim() } });
    setInput('');

    setTimeout(() => {
      const botText = getBotResponse(text.trim(), recommendation);
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        message: { id: Math.random().toString(36).slice(2), role: 'bot', text: botText },
      });
    }, 1500);
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
      {/* Header */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
        className="w-full bg-brand-blue text-white px-4 py-3 flex justify-between items-center hover:bg-blue-900 transition-colors flex-none"
      >
        <span className="font-semibold text-sm">Assistant</span>
        {state.chatOpen ? <ChevronDown /> : <ChevronUp />}
      </button>

      {/* Animated body */}
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
                  m.role === 'user'
                    ? 'bg-brand-gray text-black'
                    : 'bg-brand-blue text-white'
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
