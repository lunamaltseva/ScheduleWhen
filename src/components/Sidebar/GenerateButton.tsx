import { useApp } from '../../context/AppContext';
import { runAlgorithm, buildExplanation } from '../../algorithm/score';
import { ChatbotIcon } from '../Icons';

export default function GenerateButton({ mobileMode = false }: { mobileMode?: boolean }) {
  const { state, dispatch } = useApp();
  const { isDirty, algorithmResult, duration, selectedDays, timePeriods, filters, students, targetParticipants } = state;

  const showGenerate = isDirty || !algorithmResult;

  function handleGenerate() {
    const result = runAlgorithm(students, filters, duration, selectedDays, timePeriods, targetParticipants);
    dispatch({ type: 'SET_ALGORITHM_RESULT', result });
  }

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

  if (showGenerate) {
    return (
      <button
        onClick={handleGenerate}
        className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors"
      >
        Generate
      </button>
    );
  }

  return (
    <button
      onClick={handleExplainWhy}
      className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
    >
      <ChatbotIcon />
      Explain why
    </button>
  );
}
