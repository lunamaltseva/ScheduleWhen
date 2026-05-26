import { useApp } from '../../context/AppContext';
import { StarIcon } from '../Icons';
import { getRoomGroups } from '../../lib/rooms';
import type { Suggestion } from '../../types';

// ── Chips ───────────────────────────────────────────────────────────────────

function FillBar({ pct, preferred }: { pct: number; preferred: boolean }) {
  return (
    <div className={`mt-1.5 h-1 rounded-full overflow-hidden ${preferred ? 'bg-white/25' : 'bg-gray-200'}`}>
      <div
        className={`h-full rounded-full ${preferred ? 'bg-white' : 'bg-brand-mid-blue'}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

function SuggestionChip({ suggestion, preferred, isBest }: {
  suggestion: Suggestion;
  preferred: boolean;
  isBest: boolean;
}) {
  const dayLabel = suggestion.pairedDay
    ? `${suggestion.day} / ${suggestion.pairedDay}`
    : suggestion.day;
  const pct = Math.round(suggestion.rawFreePercent);
  const sub = preferred ? 'text-blue-200' : 'text-gray-400';
  // Best slot gets the gold ring; alternatives are intentionally quieter.
  const goldRing: React.CSSProperties = isBest && preferred
    ? { outline: '2px solid #dba620', outlineOffset: '2px' }
    : {};

  const shell = preferred
    ? 'bg-brand-blue text-white'
    : 'bg-gray-50 border border-brand-gray text-gray-600';

  return (
    <div className={`rounded-2xl p-3 flex flex-col gap-1 relative ${shell}`} style={goldRing}>
      {isBest && preferred && (
        <span className="absolute top-2 right-2.5 text-brand-gold opacity-90">
          <StarIcon className="w-3 h-3" />
        </span>
      )}
      <div className={`flex items-center justify-between ${isBest && preferred ? 'pr-4' : ''}`}>
        <span className="text-sm font-bold leading-none">{dayLabel}</span>
        <span className={`text-base font-black leading-none ${preferred ? 'text-white' : 'text-gray-700'}`}>
          {pct}%
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
      <FillBar pct={suggestion.rawFreePercent} preferred={preferred} />
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
    <div className="space-y-4">
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
            <p className="text-xs text-red-700 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 leading-snug">
              ✕ Target unreachable: {overrideReason}
            </p>
          )}

          {/* Preferred suggestions */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommended</p>
            <p className="text-[11px] text-gray-400 mb-2 leading-snug">
              % = share of eligible students free during the window.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {preferred.length > 0
                ? preferred.map((s, i) => (
                    <SuggestionChip key={i} suggestion={s} preferred isBest={s.weightedScore === bestScore} />
                  ))
                : [<EmptyChip key={0} />, <EmptyChip key={1} />]
              }
              {preferred.length === 1 && <EmptyChip />}
            </div>
          </div>

          {/* Alternative suggestions */}
          {hasAlts && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Other options</p>
              <div className="grid grid-cols-2 gap-2">
                {alternatives.map((s, i) => (
                  <SuggestionChip key={i} suggestion={s} preferred={false} isBest={s.weightedScore === bestScore} />
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
          <div className="text-xs leading-relaxed rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 space-y-1 text-red-700">
            <p className="font-semibold">Rooms may not be available. Please confirm with the Registrar (Room 110).</p>
            <p>Data is synthetic and was mined on May 21st, 2026.</p>
          </div>
        </>
      )}
    </div>
  );
}
