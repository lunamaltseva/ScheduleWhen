import { useResults } from '../../hooks/useResults';
import type { Recommendation } from '../../types';

function getRoomCategory(target: number): { label: string; range: string } {
  if (target >= 60) return { label: 'Large rooms (& specialty rooms)', range: '60+ people' };
  if (target >= 30) return { label: 'Medium rooms (& specialty rooms)', range: '30–60 people' };
  if (target >= 10) return { label: 'Small rooms', range: '10–30 people' };
  return { label: 'Meeting rooms', range: '< 10 people' };
}

function RecommendationChip({ rec, preferred }: { rec: Recommendation; preferred: boolean }) {
  return (
    <div className={`rounded-2xl p-3 flex flex-col gap-1 ${
      preferred
        ? 'bg-brand-blue text-white'
        : 'bg-white border-2 border-brand-blue text-brand-blue'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold leading-none">{rec.day}</span>
        <span className={`text-base font-black leading-none ${preferred ? 'text-white' : 'text-brand-blue'}`}>
          {Math.round(rec.freePercent)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-sm font-semibold leading-none">{rec.slot}</span>
        <span className={`text-xs leading-none ${preferred ? 'text-blue-200' : 'text-blue-400'}`}>to</span>
        <span className="text-sm font-semibold leading-none">{rec.endTime}</span>
      </div>
      <span className={`text-xs leading-none ${preferred ? 'text-blue-200' : 'text-blue-400'}`}>
        {rec.eligibleCount.toLocaleString()} eligible
      </span>
    </div>
  );
}

function EmptyChip() {
  return (
    <div className="rounded-2xl p-3 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center min-h-[72px]">
      <span className="text-sm text-gray-400">—</span>
    </div>
  );
}

interface ResultsSectionProps {
  targetParticipants: number;
  mobileMode?: boolean;
  onViewHeatmap?: () => void;
}

export default function ResultsSection({ targetParticipants, mobileMode = false, onViewHeatmap }: ResultsSectionProps) {
  const { recommendations } = useResults();
  const room = getRoomCategory(targetParticipants);

  const preferred = recommendations.slice(0, 2);
  const alternatives = recommendations.slice(2, 4);
  const hasAlts = alternatives.length > 0;

  return (
    <div className="px-5 py-3 space-y-4">
      {mobileMode && onViewHeatmap && (
        <button
          onClick={onViewHeatmap}
          className="w-full border border-brand-blue text-brand-blue rounded-xl py-2.5 text-sm font-semibold hover:bg-brand-light-blue transition-colors"
        >
          View Heatmap →
        </button>
      )}

      {/* Preferred suggestions */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preferred</p>
        <div className="grid grid-cols-2 gap-2">
          {preferred.length > 0
            ? preferred.map((rec, i) => <RecommendationChip key={i} rec={rec} preferred />)
            : [<EmptyChip key={0} />, <EmptyChip key={1} />]
          }
          {preferred.length === 1 && <EmptyChip />}
        </div>
      </div>

      {/* Alternative suggestions */}
      {hasAlts && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Alternatives</p>
          <div className="grid grid-cols-2 gap-2">
            {alternatives.map((rec, i) => <RecommendationChip key={i} rec={rec} preferred={false} />)}
            {alternatives.length === 1 && <EmptyChip />}
          </div>
        </div>
      )}

      {recommendations.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-2">
          No recommendations — adjust filters or selected days.
        </p>
      )}

      {/* Recommended room category */}
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-1.5">Recommended Rooms</p>
        <div className="flex justify-between items-center text-sm text-gray-700 bg-brand-light-blue rounded-xl px-3 py-2.5">
          <span className="font-medium">{room.label}</span>
          <span className="text-gray-400 text-xs">{room.range}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Rooms may not be available. Please confirm with the Registrar (Room 110).
      </p>
    </div>
  );
}
