import { useApp } from '../../context/AppContext';
import { useGenerate } from '../../hooks/useGenerate';
import { ChatbotIcon } from '../Icons';

export default function GenerateButton({ mobileMode = false, onAfterGenerate }: { mobileMode?: boolean; onAfterGenerate?: () => void }) {
  const { state, dispatch } = useApp();
  const { isDirty, algorithmResult, dataState, filters } = state;
  const generate = useGenerate();

  function handleGenerate() {
    generate({ onAfter: onAfterGenerate });
  }

  function handleExplainWhy() {
    if (!algorithmResult) return;
    dispatch({ type: 'OPEN_CHAT' });
    dispatch({ type: 'SET_PENDING_PROMPT', prompt: 'Please explain why this time slot was recommended.' });
    if (mobileMode) dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' });
  }

  const showGenerate = isDirty || !algorithmResult;
  // Draw attention to Generate once the user has added filters but not yet run.
  const pulsing = showGenerate && filters.length > 0 && dataState === 'loaded';

  return (
    <div className="flex flex-col gap-2">
      {showGenerate ? (
        <button
          onClick={handleGenerate}
          disabled={dataState !== 'loaded'}
          className={`w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${pulsing ? 'animate-pulse-blue' : ''}`}
        >
          {dataState === 'loading' ? 'Loading data…' : 'Generate'}
        </button>
      ) : (
        <button
          onClick={handleExplainWhy}
          className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <ChatbotIcon />
          Explain why
        </button>
      )}
    </div>
  );
}
