import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { SEMESTER_START, SEMESTER_END } from '../../constants';
import { CalendarIcon } from '../Icons';

function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoToLocalDate(iso: string): Date | undefined {
  if (!iso || !iso.includes('-')) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayLabel(iso: string): string {
  const d = isoToLocalDate(iso);
  if (!d) return 'Pick a date';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

interface DatePickerProps {
  valueIso: string;
  onChange: (iso: string) => void;
}

export default function DatePicker({ valueIso, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = isoToLocalDate(valueIso);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle() {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  const left = rect ? Math.min(rect.left, window.innerWidth - 300) : 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between border border-brand-gray rounded-xl px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:border-brand-blue"
      >
        <span className={selected ? 'text-gray-800 font-medium' : 'text-gray-400'}>{displayLabel(valueIso)}</span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </button>

      {open && rect && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: rect.bottom + 6, left, zIndex: 9999 }}
          className="bg-white border border-brand-gray rounded-xl shadow-2xl p-2 rdp-brand"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? SEMESTER_START}
            startMonth={SEMESTER_START}
            endMonth={SEMESTER_END}
            disabled={{ before: SEMESTER_START, after: SEMESTER_END }}
            onSelect={(d) => {
              if (d) {
                onChange(localDateToISO(d));
                setOpen(false);
              }
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
