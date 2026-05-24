import { useRef, useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronUp, ChevronDown, ArrowLeft } from '../Icons';
import { streamAI, buildContextBlock } from '../../lib/ai';

const SUGGESTED_PROMPTS = [
  'Why is this time slot recommended?',
  'Are there good evening options?',
  'What if I need a room for 40 people?',
  'Can you suggest a time that avoids Monday?',
];

interface ChatBotProps {
  mobileMode?: boolean;
}

export default function ChatBot({ mobileMode = false }: ChatBotProps) {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => {
    if (state.chatOpen || mobileMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatMessages, streamingText, state.chatOpen, mobileMode]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streamingText !== null) return;

    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      message: { id: Math.random().toString(36).slice(2), role: 'user', text: trimmed },
    });
    setInput('');

    // Build API-format history (exclude streaming placeholder, map 'bot' → 'assistant')
    const history = state.chatMessages.map(m => ({
      role: (m.role === 'bot' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.text,
    }));
    history.push({ role: 'user', content: trimmed });

    const contextBlock = buildContextBlock(state);

    abortRef.current = false;
    setStreamingText('');

    let accumulated = '';
    try {
      for await (const chunk of streamAI(history, contextBlock)) {
        if (abortRef.current) break;
        accumulated += chunk;
        setStreamingText(accumulated);
      }
    } catch {
      accumulated = 'Sorry, something went wrong. Please try again.';
      setStreamingText(null);
    }

    if (!abortRef.current) {
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        message: { id: Math.random().toString(36).slice(2), role: 'bot', text: accumulated },
      });
    }
    setStreamingText(null);
  }, [state, dispatch, streamingText]);

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
          streamingText={streamingText}
          input={input}
          setInput={setInput}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
          messagesEndRef={messagesEndRef}
          mobileMode
        />
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-20 w-96 z-40 flex flex-col rounded-t-2xl overflow-hidden border border-white/40 shadow-2xl">
      <button
        onClick={() => dispatch({ type: 'TOGGLE_CHAT' })}
        aria-expanded={state.chatOpen}
        aria-controls="chat-panel"
        className="w-full bg-brand-blue text-white px-4 py-3 flex justify-between items-center hover:bg-blue-900 transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset"
      >
        <span className="font-semibold text-sm">Assistant</span>
        {state.chatOpen ? <ChevronDown /> : <ChevronUp />}
      </button>

      <div
        id="chat-panel"
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: state.chatOpen ? '520px' : '0' }}
        {...(!state.chatOpen ? { inert: '' } : {})}
      >
        <ChatBody
          messages={state.chatMessages}
          streamingText={streamingText}
          input={input}
          setInput={setInput}
          onKeyDown={handleKeyDown}
          onSend={sendMessage}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </div>
  );
}

interface ChatBodyProps {
  messages: { id: string; role: 'user' | 'bot'; text: string }[];
  streamingText: string | null;
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  mobileMode?: boolean;
}

function ChatBody({
  messages, streamingText, input, setInput, onKeyDown, onSend, messagesEndRef, mobileMode = false,
}: ChatBodyProps) {
  const isEmpty = messages.length === 0 && streamingText === null;
  const isStreaming = streamingText !== null;

  return (
    <div className="bg-white flex flex-col" style={{ height: mobileMode ? '100%' : '480px' }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {isEmpty ? (
          <EmptyState onSend={onSend} />
        ) : (
          <>
            {messages.map(m => (
              <MessageBubble key={m.id} role={m.role} text={m.text} />
            ))}
            {isStreaming && (
              <MessageBubble role="bot" text={streamingText || '…'} streaming />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isEmpty && (
        <>
          <hr className="border-brand-gray" />
          <p className="text-[10px] text-gray-400 px-3 py-1">
            Responses may contain mistakes. For room bookings, contact the Registrar (Room 110).
          </p>
        </>
      )}

      <div className="px-3 pb-3 pt-1 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isStreaming ? 'Assistant is typing…' : 'Ask something…'}
          disabled={isStreaming}
          className="flex-1 border border-brand-gray rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-brand-blue disabled:opacity-50"
        />
        <button
          onClick={() => onSend(input)}
          disabled={isStreaming || !input.trim()}
          className="px-3 py-1.5 bg-brand-blue text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          aria-label="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-3 py-4">
      <p className="text-sm font-semibold text-gray-700 text-center">What would you want to schedule?</p>
      <div className="grid grid-cols-2 gap-2 w-full">
        {SUGGESTED_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onSend(prompt)}
            className="text-xs text-left text-gray-600 bg-gray-50 hover:bg-brand-light-blue border border-brand-gray rounded-lg px-2.5 py-2 transition-colors leading-snug"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  role, text, streaming = false,
}: {
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug whitespace-pre-wrap ${
          role === 'user' ? 'bg-brand-gray text-black' : 'bg-brand-blue text-white'
        } ${streaming ? 'opacity-80' : ''}`}
      >
        {text}
        {streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-white/70 rounded-sm animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
