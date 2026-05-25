import { useApp } from '../../context/AppContext';
import { TrashIcon, PencilIcon } from '../Icons';
import type { Filter } from '../../types';

function summarize(arr: string[]): string {
  if (arr.length === 0) return 'All';
  if (arr.length <= 2) return arr.join(', ');
  return `${arr[0]} +${arr.length - 1}`;
}

function FilterRow({ filter }: { filter: Filter }) {
  const { state, dispatch } = useApp();
  const isDeleting = state.deletingFilterId === filter.id;

  const deptLabel = summarize(filter.depts);
  const yearLabel = summarize(filter.years);
  const statusLabel = filter.status === 'any' ? 'Any' : filter.status === 'domestic' ? 'Dom.' : 'Intl.';

  if (isDeleting) {
    return (
      <tr>
        <td colSpan={4} className="p-0">
          <div className="relative overflow-hidden rounded-lg">
            {/* Pulsing background layer only — text stays steady */}
            <div className="absolute inset-0 bg-red-100 animate-pulse" />
            <div className="relative flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm text-red-800 font-medium">Delete this filter?</span>
              <div className="flex gap-2 items-center shrink-0">
                <button
                  onClick={() => dispatch({ type: 'SET_DELETING_FILTER', id: null })}
                  className="text-xs text-gray-600 hover:text-gray-900 px-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => dispatch({ type: 'DELETE_FILTER', id: filter.id })}
                  className="text-xs px-2 py-1 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className="hover:bg-brand-light-blue/50 transition-colors border-b border-brand-gray/40 last:border-0 cursor-pointer"
      onClick={() => dispatch({ type: 'SET_MODAL', modal: { type: 'edit', filterId: filter.id } })}
      title="Click to edit this filter"
    >
      <td className="px-3 py-2 text-sm text-gray-700 max-w-[60px] truncate">{deptLabel}</td>
      <td className="px-2 py-2 text-sm text-gray-700 max-w-[60px] truncate">{yearLabel}</td>
      <td className="px-2 py-2 text-sm text-gray-700">{statusLabel}</td>
      <td className="px-1 py-2 w-14" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => dispatch({ type: 'SET_MODAL', modal: { type: 'edit', filterId: filter.id } })}
            className="text-gray-400 hover:text-brand-blue p-1 rounded-lg transition-colors"
            aria-label="Edit filter"
            title="Edit filter"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_DELETING_FILTER', id: filter.id })}
            className="text-gray-400 hover:text-red-600 p-1 rounded-lg transition-colors"
            aria-label="Delete filter"
            title="Delete filter"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FiltersSection() {
  const { state, dispatch } = useApp();

  return (
    <div>
      <table className="w-full table-fixed mb-2">
        <thead>
          <tr className="text-sm text-gray-400 border-b border-brand-gray">
            <th className="px-3 py-1 text-left font-normal">Departments</th>
            <th className="px-2 py-1 text-left font-normal">Years</th>
            <th className="px-2 py-1 text-left font-normal">Status</th>
            <th className="px-1 py-1 w-14" />
          </tr>
        </thead>
        <tbody>
          {state.filters.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-2 text-sm text-gray-400 italic">
                No filter applied — all students considered
              </td>
            </tr>
          ) : (
            state.filters.map(f => <FilterRow key={f.id} filter={f} />)
          )}
        </tbody>
      </table>

      <button
        onClick={() => dispatch({ type: 'SET_MODAL', modal: { type: 'add' } })}
        className="w-full text-center text-sm text-brand-blue hover:underline font-semibold py-1"
      >
        + Add Filter
      </button>
    </div>
  );
}
