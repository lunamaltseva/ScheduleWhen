import { useApp } from '../../context/AppContext';
import { StarIcon } from '../Icons';
import type { Suggestion } from '../../types';

// ── Room data ───────────────────────────────────────────────────────────────

interface RoomGroup {
  label: string;
  note: string;
  rooms: string[];
}

const COMP_LABS: { depts: string[]; rooms: string[]; note: string }[] = [
  { depts: ['SFW', 'AMI'], rooms: ['G30', 'G31', '432', '433'], note: 'SFW · AMI' },
  { depts: ['JMC', 'TCMA'], rooms: ['C07'], note: 'JMC · TCMA' },
  { depts: ['JMC', 'TCMA'], rooms: ['223', '233'], note: 'Graphic Design' },
];

function getRoomGroups(target: number, filterDepts: string[]): RoomGroup[] {
  const groups: RoomGroup[] = [];

  if (target >= 60) {
    groups.push({ label: 'Large Rooms', note: '60+ seats', rooms: ['410', '434', '440', 'Forum'] });
  } else if (target >= 30) {
    groups.push({ label: 'Medium Rooms', note: '30–60 seats', rooms: ['G34', '220', '435'] });
    groups.push({ label: 'Large Rooms', note: '60+ seats (if needed)', rooms: ['410', '434', '440', 'Forum'] });
  } else if (target >= 10) {
    groups.push({ label: 'Small Rooms', note: '10–30 seats', rooms: ['G35', 'G33', 'G32', '203', '305', '405'] });
    groups.push({ label: 'Medium Rooms', note: '30–60 seats (larger option)', rooms: ['G34', '220', '435'] });
  } else {
    groups.push({ label: 'Very Small Rooms', note: '< 10 seats', rooms: ['211', '212', '213', '340', '411'] });
    groups.push({ label: 'Small Rooms', note: '10–30 seats (larger option)', rooms: ['G35', 'G33', 'G32', '203', '305', '405'] });
  }

  // Append relevant computer labs when specific departments are in the filter
  if (filterDepts.length > 0) {
    for (const lab of COMP_LABS) {
      if (lab.depts.some(d => filterDepts.includes(d))) {
        if (!groups.some(g => g.label === 'Computer Labs' && g.note === lab.note)) {
          groups.push({ label: 'Computer Labs', note: lab.note, rooms: lab.rooms });
        }
      }
    }
  }

  return groups;
}

// ── Chips ───────────────────────────────────────────────────────────────────

function SuggestionChip({ suggestion, preferred, stale, isBest }: {
  suggestion: Suggestion;
  preferred: boolean;
  stale: boolean;
  isBest: boolean;
}) {
  const dayLabel = suggestion.pairedDay
    ? `${suggestion.day} / ${suggestion.pairedDay}`
    : suggestion.day;
  const sub = preferred ? 'text-blue-200' : 'text-blue-400';
  const goldRing: React.CSSProperties = isBest
    ? { outline: '2px solid #dba620', outlineOffset: '2px' }
    : {};

  return (
    <div
      className={`rounded-2xl p-3 flex flex-col gap-1 transition-opacity relative ${stale ? 'opacity-50' : ''} ${
        preferred ? 'bg-brand-blue text-white' : 'bg-white border-2 border-brand-blue text-brand-blue'
      }`}
      style={goldRing}
    >
      {isBest && (
        <span className="absolute top-2 right-2.5 text-brand-gold opacity-90">
          <StarIcon className="w-3 h-3" />
        </span>
      )}
      <div className="flex items-center justify-between pr-4">
        <span className="text-sm font-bold leading-none">{dayLabel}</span>
        <span className={`text-base font-black leading-none ${preferred ? 'text-white' : 'text-brand-blue'}`}>
          {Math.round(suggestion.rawFreePercent)}%
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-sm font-semibold leading-none">{suggestion.startTime}</span>
        <span className={`text-xs leading-none ${sub}`}>to</span>
        <span className="text-sm font-semibold leading-none">{suggestion.endTime}</span>
      </div>
      <span className={`text-xs leading-none ${sub}`}>
        ~{suggestion.onCampusCount.toLocaleString()} on campus
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

// ── Main component ──────────────────────────────────────────────────────────

interface ResultsSectionProps {
  targetParticipants: number;
  mobileMode?: boolean;
  onViewHeatmap?: () => void;
}

export default function ResultsSection({ targetParticipants, mobileMode = false, onViewHeatmap }: ResultsSectionProps) {
  const { state } = useApp();
  const { algorithmResult, isDirty, filters } = state;

  const suggestions  = algorithmResult?.suggestions ?? [];
  const preferred    = suggestions.filter(s => s.rank === 'primary-mw' || s.rank === 'primary-tth');
  const alternatives = suggestions.filter(s => s.rank === 'alt-1' || s.rank === 'alt-2');
  const bestScore    = suggestions.length > 0 ? Math.max(...suggestions.map(s => s.weightedScore)) : -Infinity;
  const hasResults   = suggestions.length > 0;
  const hasAlts      = alternatives.length > 0;

  // Only show results when they exist and are fresh (not dirty)
  const showResults  = hasResults && !isDirty;

  const targetMet      = algorithmResult?.targetMet ?? true;
  const prefOverridden = algorithmResult?.prefOverridden ?? false;
  const overrideReason = algorithmResult?.overrideReason;

  const filterDepts = [...new Set(filters.flatMap(f => f.depts))];
  const roomGroups  = getRoomGroups(targetParticipants, filterDepts);

  return (
    <div className="px-5 py-3 space-y-4">
      {mobileMode && onViewHeatmap && (
        <button
          onClick={onViewHeatmap}
          className="w-full border border-brand-blue text-brand-blue rounded-xl py-2.5 text-sm font-semibold hover:bg-brand-light-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
        >
          View Heatmap →
        </button>
      )}

      {/* No results or outdated — identical prompt either way */}
      {!showResults && (
        <p className="text-sm text-gray-400 italic text-center py-2">
          Press Generate to find the best time.
        </p>
      )}

      {showResults && (
        <>
          {/* Target feasibility / preference override notice */}
          {prefOverridden && (
            <p className="text-xs text-blue-700 font-medium bg-blue-50 rounded-lg px-3 py-1.5 leading-snug">
              ⚠ Time preference overridden to meet your participant target.
              {overrideReason && ` ${overrideReason}`}
            </p>
          )}
          {!targetMet && !prefOverridden && overrideReason && (
            <p className="text-xs text-red-600 font-medium bg-red-50 rounded-lg px-3 py-1.5 leading-snug">
              ✕ Target unreachable: {overrideReason}
            </p>
          )}

          {/* Preferred suggestions */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Preferred</p>
            <div className="grid grid-cols-2 gap-2">
              {preferred.length > 0
                ? preferred.map((s, i) => (
                    <SuggestionChip key={i} suggestion={s} preferred stale={false} isBest={s.weightedScore === bestScore} />
                  ))
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
                {alternatives.map((s, i) => (
                  <SuggestionChip key={i} suggestion={s} preferred={false} stale={false} isBest={s.weightedScore === bestScore} />
                ))}
                {alternatives.length === 1 && <EmptyChip />}
              </div>
            </div>
          )}

          {/* Recommended rooms */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-600">Recommended Rooms</p>
            {roomGroups.map((group, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.label}</span>
                  <span className="text-xs text-gray-400">{group.note}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.rooms.map(r => (
                    <span key={r} className="text-xs font-semibold bg-brand-light-blue text-brand-blue rounded-lg px-2.5 py-1 leading-none">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="text-xs leading-relaxed rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-1 text-amber-900">
            <p className="font-semibold">Rooms may not be available. Please confirm with the Registrar (Room 110).</p>
            <p>Data is dated May 2026 and is synthetic.</p>
          </div>
        </>
      )}
    </div>
  );
}
