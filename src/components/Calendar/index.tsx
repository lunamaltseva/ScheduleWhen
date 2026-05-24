import { useApp } from '../../context/AppContext';
import CalendarHeader from './CalendarHeader';
import HeatmapGrid from './HeatmapGrid';
import { WarningIcon, XIcon } from '../Icons';

interface CalendarViewProps {
  showBackButton?: boolean;
}

function NoTimeslotBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex-none flex items-start gap-3 bg-red-50 border-b border-red-200 px-4 py-2.5">
      <WarningIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      <p className="flex-1 text-xs text-red-800 leading-snug">{message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-red-300 hover:text-red-600 transition-colors leading-none mt-0.5"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CalendarView({ showBackButton = false }: CalendarViewProps) {
  const { state, dispatch } = useApp();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CalendarHeader showBackButton={showBackButton} />
      {state.noTimeslotBanner && (
        <NoTimeslotBanner
          message={state.noTimeslotBanner}
          onDismiss={() => dispatch({ type: 'SET_NO_TIMESLOT_BANNER', message: null })}
        />
      )}
      <HeatmapGrid />
    </div>
  );
}
