import { useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { runAlgorithm, buildExplanation } from '../../algorithm/score';
import { ChatbotIcon } from '../Icons';

export default function GenerateButton({ mobileMode = false, onAfterGenerate }: { mobileMode?: boolean; onAfterGenerate?: () => void }) {
  const { state, dispatch } = useApp();
  const { isDirty, algorithmResult, autoRegen, duration, selectedDays, timePeriods, filters, students, targetParticipants, dataState } = state;

  const handleGenerate = useCallback(() => {
    const result = runAlgorithm(students, filters, duration, selectedDays, timePeriods, targetParticipants);
    dispatch({ type: 'SET_ALGORITHM_RESULT', result });
    onAfterGenerate?.();
  }, [students, filters, duration, selectedDays, timePeriods, targetParticipants, dispatch, onAfterGenerate]);

  // Auto-regenerate whenever params change (isDirty) while the toggle is on
  useEffect(() => {
    if (autoRegen && isDirty && dataState === 'loaded') {
      handleGenerate();
    }
  }, [autoRegen, isDirty, dataState, handleGenerate]);

  function handleExplainWhy() {
    if (!algorithmResult) return;
    const text = buildExplanation(algorithmResult, duration);
    dispatch({ type: 'OPEN_CHAT' });
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      message: { id: Math.random().toString(36).slice(2), role: 'bot', text },
    });
    if (mobileMode) dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' });
  }

  const showGenerate = isDirty || !algorithmResult;

  return (
    <div className="flex flex-col gap-2">
      {showGenerate ? (
        <button
          onClick={handleGenerate}
          disabled={dataState !== 'loaded'}
          className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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

      {/* Auto-update toggle — only visible after at least one generation */}
      {algorithmResult !== null && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_AUTO_REGEN' })}
          className={`w-full py-2 rounded-xl text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:ring-offset-1 ${
            autoRegen
              ? 'bg-brand-blue/10 border-brand-blue text-brand-blue'
              : 'bg-white border-brand-gray text-gray-500 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          {autoRegen ? '⟳ Auto-update: On' : '⟳ Auto-update: Off'}
        </button>
      )}
    </div>
  );
}
