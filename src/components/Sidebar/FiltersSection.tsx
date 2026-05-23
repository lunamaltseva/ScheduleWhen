import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VerticalDots } from '../Icons';
import type { Filter } from '../../types';

function summarize(arr: string[]): string {
  if (arr.length === 0) return 'All';
  if (arr.length <= 2) return arr.join(', ');
  return `${arr[0]} +${arr.length - 1}`;
}

function FilterRow({ filter }: { filter: Filter }) {
  const { state, dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLTableDataCellElement>(null);
  const isDeleting = state.deletingFilterId === filter.id;

  // Pulse once when deletion is triggered, then stop
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (!isDeleting) { setPulsing(false); return; }
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 700);
    return () => clearTimeout(t);
  }, [isDeleting]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const deptLabel = summarize(filter.depts);
  const yearLabel = summarize(filter.years);
  const statusLabel = filter.status === 'any' ? 'Any' : filter.status === 'domestic' ? 'Dom.' : 'Intl.';

  if (isDeleting) {
    return (
      <tr className="border-l-4 border-red-700 bg-red-50 transition-all">
        <td
          colSpan={3}
          className={`px-3 py-2 text-sm text-red-800 font-medium ${pulsing ? 'animate-pulse' : ''}`}
        >
          Delete this filter?
        </td>
        <td className="px-2 py-2">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => dispatch({ type: 'SET_DELETING_FILTER', id: null })}
              className="text-sm text-gray-600 hover:text-gray-900 px-1"
            >
              Cancel
            </button>
            <button
              onClick={() => dispatch({ type: 'DELETE_FILTER', id: filter.id })}
              className="text-sm px-2 py-1 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800"
            >
              Confirm
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-brand-gray/40 last:border-0">
      <td className="px-3 py-2 text-sm text-gray-700 max-w-[60px] truncate">{deptLabel}</td>
      <td className="px-2 py-2 text-sm text-gray-700 max-w-[60px] truncate">{yearLabel}</td>
      <td className="px-2 py-2 text-sm text-gray-700">{statusLabel}</td>
      <td className="px-2 py-2 relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="text-gray-400 hover:text-gray-700 p-0.5 rounded-lg"
        >
          <VerticalDots />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-0.5 w-32 bg-white border border-brand-gray rounded-xl shadow-lg z-20 overflow-hidden">
            <button
              onClick={() => {
                dispatch({ type: 'SET_MODAL', modal: { type: 'edit', filterId: filter.id } });
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'SET_DELETING_FILTER', id: filter.id });
                setMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function FiltersSection() {
  const { state, dispatch } = useApp();

  return (
    <div className="px-5 py-3">
      <table className="w-full mb-2">
        <thead>
          <tr className="text-sm text-gray-400 border-b border-brand-gray">
            <th className="px-3 py-1 text-left font-normal">Depts</th>
            <th className="px-2 py-1 text-left font-normal">Years</th>
            <th className="px-2 py-1 text-left font-normal">Status</th>
            <th className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {state.filters.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-2 text-sm text-gray-400 italic">
                No filters — showing all students
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
