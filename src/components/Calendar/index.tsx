import CalendarHeader from './CalendarHeader';
import HeatmapGrid from './HeatmapGrid';

interface CalendarViewProps {
  showBackButton?: boolean;
}

export default function CalendarView({ showBackButton = false }: CalendarViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CalendarHeader showBackButton={showBackButton} />
      <HeatmapGrid />
    </div>
  );
}
