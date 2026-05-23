import { useApp } from '../../context/AppContext';
import { useResults } from '../../hooks/useResults';
import { ChatbotIcon } from '../Icons';
import SidebarHeader from './SidebarHeader';
import EventSpec from './EventSpec';
import FiltersSection from './FiltersSection';
import FilterModal from './FilterModal';
import ResultsSection from './ResultsSection';

function Separator() {
  return <hr className="border-brand-gray mx-5" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pt-4 pb-1 text-xs font-bold uppercase tracking-widest text-gray-400">
      {children}
    </p>
  );
}

interface SidebarProps {
  mobileMode?: boolean;
}

export default function Sidebar({ mobileMode = false }: SidebarProps) {
  const { state, dispatch } = useApp();
  const { recommendations } = useResults();
  const recommendation = recommendations[0] ?? null;

  function handleExplainWhy() {
    const text = recommendation
      ? `The best slot is ${recommendation.day} at ${recommendation.slot}–${recommendation.endTime}. ${Math.round(recommendation.freePercent)}% of the filtered group is free — ${recommendation.eligibleCount.toLocaleString()} eligible students.`
      : 'No recommendation yet — try adding filters or selecting more days.';

    dispatch({ type: 'OPEN_CHAT' });
    dispatch({
      type: 'ADD_CHAT_MESSAGE',
      message: { id: Math.random().toString(36).slice(2), role: 'bot', text },
    });

    if (mobileMode) {
      dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' });
    }
  }

  return (
    <aside className={`${mobileMode ? 'w-full' : 'w-1/5'} flex flex-col h-full overflow-hidden border-r border-brand-gray bg-white`}>
      <SidebarHeader />

      {mobileMode && (
        <div className="px-5 pt-3">
          <button
            onClick={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' })}
            className="w-full bg-brand-blue text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            Chat w/ Assistant
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        <SectionLabel>Your Event</SectionLabel>
        <EventSpec />
        <Separator />
        <SectionLabel>Filters</SectionLabel>
        <FiltersSection />
        <Separator />
        <SectionLabel>Results</SectionLabel>
        <ResultsSection
          targetParticipants={state.targetParticipants}
          mobileMode={mobileMode}
          onViewHeatmap={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'calendar' })}
        />
        <div className="h-4" />
      </div>

      {/* Explain why — docked at bottom */}
      <div className="flex-none border-t border-brand-gray px-5 py-4">
        <button
          onClick={handleExplainWhy}
          className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
        >
          <ChatbotIcon />
          Explain why
        </button>
      </div>

      {state.activeModal !== null && <FilterModal />}
    </aside>
  );
}
