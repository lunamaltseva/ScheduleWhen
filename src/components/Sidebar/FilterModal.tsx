import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { UG_DEPTS, PG_DEPTS, ALL_DEPTS, UG_YEARS, PG_YEARS } from '../../constants';
import { ChevronDown, XIcon } from '../Icons';
import type { Filter } from '../../types';

const UG_YEAR_LIST: string[] = [...UG_YEARS];
const PG_YEAR_LIST: string[] = [...PG_YEARS];
const ALL_YEAR_LIST: string[] = [...UG_YEARS, ...PG_YEARS];
const UG_DEPT_LIST: string[] = [...UG_DEPTS];
const PG_DEPT_LIST: string[] = [...PG_DEPTS];
const ALL_DEPT_LIST: string[] = [...ALL_DEPTS];

function genId() {
  return crypto.randomUUID();
}

function deptSummary(selected: string[]): string {
  if (selected.length === 0 || selected.length === ALL_DEPT_LIST.length) return 'All';
  if (selected.length <= 2) return selected.join(', ');
  return `${selected[0]} +${selected.length - 1}`;
}

function yearSummary(selected: string[]): string {
  if (selected.length === 0 || selected.length === ALL_YEAR_LIST.length) return 'All';
  if (selected.length <= 2) return selected.join(', ');
  return `${selected[0]} +${selected.length - 1}`;
}

// ── Floating dropdown panel (rendered via portal) ─────────────────────────────

interface FloatingDropdownProps {
  anchor: DOMRect | null;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function FloatingDropdown({ anchor, isOpen, onClose, children }: FloatingDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen || !anchor) return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: anchor.bottom + 4,
        left: anchor.left,
        width: anchor.width,
        zIndex: 9999,
        maxHeight: '320px',
        overflowY: 'auto',
      }}
      className="border border-brand-gray rounded-xl shadow-2xl bg-white"
    >
      {children}
    </div>,
    document.body,
  );
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

interface DropdownOption {
  value: string;
  label: string;
  indent?: boolean;
  isMeta?: boolean;
}

interface MultiSelectDropdownProps {
  label: string;
  summary: string;
  options: DropdownOption[];
  selected: string[];
  onToggle: (value: string) => void;
  isOpen: boolean;
  onOpen: (rect: DOMRect) => void;
  onClose: () => void;
  anchor: DOMRect | null;
}

function MultiSelectDropdown({
  label, summary, options, selected, onToggle, isOpen, onOpen, onClose, anchor,
}: MultiSelectDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    if (triggerRef.current) {
      onOpen(triggerRef.current.getBoundingClientRect());
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-1.5">{label}</p>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={e => { e.stopPropagation(); isOpen ? onClose() : handleOpen(); }}
        className="w-full flex items-center justify-between border border-brand-gray rounded-xl px-3 py-2.5 text-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <span className={summary === 'All' ? 'text-gray-400' : 'text-gray-800 font-medium'}>
          {summary}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown anchor={anchor} isOpen={isOpen} onClose={onClose}>
        {options.map((opt, idx) => {
          const isSelected = selected.includes(opt.value);
          const isFirst = idx === 0;
          const prevIsMeta = idx > 0 && options[idx - 1].isMeta;
          const showSep = !isFirst && (opt.isMeta || prevIsMeta);
          return (
            <div key={opt.value}>
              {showSep && <div className="h-px bg-brand-gray mx-2" />}
              <button
                type="button"
                onClick={() => onToggle(opt.value)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isSelected ? 'bg-brand-light-blue text-brand-blue' : 'text-gray-700 hover:bg-gray-50'
                } ${opt.indent ? 'pl-8' : ''}`}
              >
                <span className={`flex-none w-4 h-4 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-brand-blue border-brand-blue' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className={opt.isMeta ? 'font-semibold' : ''}>{opt.label}</span>
              </button>
            </div>
          );
        })}
      </FloatingDropdown>
    </div>
  );
}

// ── Status dropdown ────────────────────────────────────────────────────────────

interface StatusDropdownProps {
  selected: 'Any' | 'Domestic' | 'International';
  onChange: (v: 'Any' | 'Domestic' | 'International') => void;
  isOpen: boolean;
  onOpen: (rect: DOMRect) => void;
  onClose: () => void;
  anchor: DOMRect | null;
}

function StatusDropdown({ selected, onChange, isOpen, onOpen, onClose, anchor }: StatusDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const opts = ['Any', 'Domestic', 'International'] as const;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-1.5">Status</p>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={e => { e.stopPropagation(); isOpen ? onClose() : triggerRef.current && onOpen(triggerRef.current.getBoundingClientRect()); }}
        className="w-full flex items-center justify-between border border-brand-gray rounded-xl px-3 py-2.5 text-sm bg-white hover:bg-gray-50 transition-colors"
      >
        <span className={selected === 'Any' ? 'text-gray-400' : 'text-gray-800 font-medium'}>{selected}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <FloatingDropdown anchor={anchor} isOpen={isOpen} onClose={onClose}>
        {opts.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => { onChange(opt); onClose(); }}
            className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
              selected === opt ? 'bg-brand-light-blue text-brand-blue' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={`flex-none w-4 h-4 rounded-full border flex items-center justify-center ${
              selected === opt ? 'bg-brand-blue border-brand-blue' : 'border-gray-300'
            }`}>
              {selected === opt && <span className="w-2 h-2 bg-white rounded-full block" />}
            </span>
            {opt}
          </button>
        ))}
      </FloatingDropdown>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

type OpenDropdown = 'depts' | 'years' | 'status' | null;

export default function FilterModal() {
  const { state, dispatch } = useApp();
  const { activeModal } = state;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') dispatch({ type: 'SET_MODAL', modal: null }); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dispatch]);

  const editingFilter = activeModal?.type === 'edit'
    ? state.filters.find(f => f.id === activeModal.filterId)
    : undefined;

  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'Any' | 'Domestic' | 'International'>('Any');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [anchorRects, setAnchorRects] = useState<Partial<Record<NonNullable<OpenDropdown>, DOMRect>>>({});

  useEffect(() => {
    setOpenDropdown(null);
    if (editingFilter) {
      setSelectedDepts(editingFilter.depts);
      setSelectedYears(editingFilter.years);
      setSelectedStatus(
        editingFilter.status === 'domestic' ? 'Domestic'
          : editingFilter.status === 'international' ? 'International'
          : 'Any'
      );
    } else {
      setSelectedDepts([]);
      setSelectedYears([]);
      setSelectedStatus('Any');
    }
  }, [activeModal, editingFilter]);

  function close() { dispatch({ type: 'SET_MODAL', modal: null }); }

  function openWith(key: NonNullable<OpenDropdown>, rect: DOMRect) {
    setOpenDropdown(key);
    setAnchorRects(prev => ({ ...prev, [key]: rect }));
  }

  // ── Dept toggle ──────────────────────────────────────────────────────────

  function toggleDept(value: string) {
    setSelectedDepts(prev => {
      if (value === '__all__') return prev.length === ALL_DEPT_LIST.length ? [] : [...ALL_DEPT_LIST];
      if (value === '__ug__') {
        const allUg = UG_DEPT_LIST.every(d => prev.includes(d));
        return allUg ? prev.filter(d => !UG_DEPT_LIST.includes(d)) : [...new Set([...prev, ...UG_DEPT_LIST])];
      }
      if (value === '__pg__') {
        const allPg = PG_DEPT_LIST.every(d => prev.includes(d));
        return allPg ? prev.filter(d => !PG_DEPT_LIST.includes(d)) : [...new Set([...prev, ...PG_DEPT_LIST])];
      }
      return prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value];
    });
  }

  const deptOptions: DropdownOption[] = [
    { value: '__all__', label: 'All', isMeta: true },
    { value: '__ug__', label: 'Undergrad', isMeta: true },
    ...UG_DEPT_LIST.map(d => ({ value: d, label: d, indent: true })),
    { value: '__pg__', label: 'Masters', isMeta: true },
    ...PG_DEPT_LIST.map(d => ({ value: d, label: d, indent: true })),
  ];
  const isAllDepts  = selectedDepts.length === ALL_DEPT_LIST.length;
  const isAllUgDepts = UG_DEPT_LIST.every(d => selectedDepts.includes(d));
  const isAllPgDepts = PG_DEPT_LIST.every(d => selectedDepts.includes(d));
  const deptSelected = [
    ...(isAllDepts   ? ['__all__'] : []),
    ...(isAllUgDepts ? ['__ug__']  : []),
    ...(isAllPgDepts ? ['__pg__']  : []),
    ...selectedDepts,
  ];

  // ── Year toggle ──────────────────────────────────────────────────────────

  function toggleYear(value: string) {
    setSelectedYears(prev => {
      if (value === '__all__') return prev.length === ALL_YEAR_LIST.length ? [] : [...ALL_YEAR_LIST];
      if (value === '__ug__') {
        const allUg = UG_YEAR_LIST.every(y => prev.includes(y));
        return allUg ? prev.filter(y => !UG_YEAR_LIST.includes(y)) : [...new Set([...prev, ...UG_YEAR_LIST])];
      }
      if (value === '__pg__') {
        const allPg = PG_YEAR_LIST.every(y => prev.includes(y));
        return allPg ? prev.filter(y => !PG_YEAR_LIST.includes(y)) : [...new Set([...prev, ...PG_YEAR_LIST])];
      }
      return prev.includes(value) ? prev.filter(y => y !== value) : [...prev, value];
    });
  }

  const yearOptions: DropdownOption[] = [
    { value: '__all__', label: 'All', isMeta: true },
    { value: '__ug__',  label: 'Undergrad', isMeta: true },
    ...UG_YEAR_LIST.map(y => ({ value: y, label: y, indent: true })),
    { value: '__pg__',  label: 'Masters', isMeta: true },
    ...PG_YEAR_LIST.map(y => ({ value: y, label: y, indent: true })),
  ];

  const isAllYears = selectedYears.length === ALL_YEAR_LIST.length;
  const isAllUg = UG_YEAR_LIST.every(y => selectedYears.includes(y));
  const isAllPg = PG_YEAR_LIST.every(y => selectedYears.includes(y));
  const yearSelected = [
    ...(isAllYears ? ['__all__'] : []),
    ...(isAllUg ? ['__ug__'] : []),
    ...(isAllPg ? ['__pg__'] : []),
    ...selectedYears,
  ];

  // ── Save ─────────────────────────────────────────────────────────────────

  function save() {
    const filter: Filter = {
      id: editingFilter?.id ?? genId(),
      depts: selectedDepts,
      years: selectedYears,
      status:
        selectedStatus === 'Domestic' ? 'domestic'
          : selectedStatus === 'International' ? 'international'
          : 'any',
    };
    dispatch({ type: editingFilter ? 'UPDATE_FILTER' : 'ADD_FILTER', filter });
    close();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal-in" style={{ width: '480px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-gray flex items-center justify-between flex-none">
          <p className="font-bold text-base text-gray-800">
            {editingFilter ? 'Edit Filter' : 'Add Filter'}
          </p>
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-700 transition-colors rounded-lg p-0.5"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <MultiSelectDropdown
            label="Departments"
            summary={deptSummary(selectedDepts)}
            options={deptOptions}
            selected={deptSelected}
            onToggle={toggleDept}
            isOpen={openDropdown === 'depts'}
            onOpen={rect => openWith('depts', rect)}
            onClose={() => setOpenDropdown(null)}
            anchor={anchorRects['depts'] ?? null}
          />

          <MultiSelectDropdown
            label="Years"
            summary={yearSummary(selectedYears)}
            options={yearOptions}
            selected={yearSelected}
            onToggle={toggleYear}
            isOpen={openDropdown === 'years'}
            onOpen={rect => openWith('years', rect)}
            onClose={() => setOpenDropdown(null)}
            anchor={anchorRects['years'] ?? null}
          />

          <StatusDropdown
            selected={selectedStatus}
            onChange={setSelectedStatus}
            isOpen={openDropdown === 'status'}
            onOpen={rect => openWith('status', rect)}
            onClose={() => setOpenDropdown(null)}
            anchor={anchorRects['status'] ?? null}
          />
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-brand-gray flex-none">
          <button
            onClick={save}
            className="w-full bg-brand-blue text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-900 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
