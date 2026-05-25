import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import SidebarHeader from './SidebarHeader';
import EventSpec from './EventSpec';
import FiltersSection from './FiltersSection';
import FilterModal from './FilterModal';
import ResultsSection from './ResultsSection';
import GenerateButton from './GenerateButton';
import HelpTip from '../common/HelpTip';
import { DownloadIcon } from '../Icons';
import { getRoomGroups } from '../../lib/rooms';
import { exportResultsCsv } from '../../lib/exportCsv';

function Card({ title, help, headerAction, children }: { title: string; help?: string; headerAction?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-brand-gray bg-white shadow-sm">
      <div className="px-4 pt-3 pb-2 flex items-center gap-1.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
        {help && <HelpTip text={help} />}
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

function ExportButton() {
  const { state } = useApp();
  const suggestions = state.algorithmResult?.suggestions ?? [];
  const fresh = suggestions.length > 0 && !state.isDirty;
  if (!fresh) return null;
  const filterDepts = [...new Set(state.filters.flatMap(f => f.depts))];
  const roomGroups = getRoomGroups(state.targetParticipants, filterDepts);
  return (
    <button
      onClick={() => exportResultsCsv(suggestions, roomGroups)}
      className="flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline normal-case tracking-normal"
      title="Export recommendations, time slots, and rooms as CSV"
    >
      <DownloadIcon className="w-3.5 h-3.5" />
      Export CSV
    </button>
  );
}

interface SidebarProps {
  mobileMode?: boolean;
}

export default function Sidebar({ mobileMode = false }: SidebarProps) {
  const { state, dispatch } = useApp();
  const resultsRef = useRef<HTMLDivElement>(null);

  function scrollToResults() {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  return (
    <aside className={`${mobileMode ? 'w-full' : 'w-1/5 min-w-[260px]'} flex flex-col h-full overflow-hidden border-r border-brand-gray bg-brand-light-blue/40`}>
      <SidebarHeader />

      {mobileMode && (
        <div className="px-4 pt-3">
          <button
            onClick={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'chat' })}
            className="w-full bg-brand-blue text-white rounded-xl py-2.5 text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            Chat w/ Assistant
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-3">
        <Card title="Your Event" help="The core details of the event you want to schedule: how long, which days, preferred time of day, earliest date, and target attendance.">
          <EventSpec />
        </Card>

        <Card title="Filters" help="Narrow the audience by department, year, or status. With no filter, all students are considered. Multiple filters are combined as a union.">
          <FiltersSection />
        </Card>

        <div ref={resultsRef}>
          <Card
            title="Results"
            help="Top recommended time slots and suggested rooms once you generate. Percentages show the share of eligible students free during the window."
            headerAction={<ExportButton />}
          >
            <ResultsSection
              targetParticipants={state.targetParticipants}
              mobileMode={mobileMode}
              onViewHeatmap={() => dispatch({ type: 'SET_MOBILE_VIEW', view: 'calendar' })}
            />
          </Card>
        </div>
        <div className="h-1" />
      </div>

      {/* Generate / Explain why — docked at the bottom */}
      <div className="flex-none border-t border-brand-gray bg-white px-5 py-4">
        <GenerateButton mobileMode={mobileMode} onAfterGenerate={scrollToResults} />
      </div>

      {state.activeModal !== null && <FilterModal />}
    </aside>
  );
}
