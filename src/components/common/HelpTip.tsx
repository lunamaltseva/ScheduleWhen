import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { QuestionIcon } from '../Icons';

interface HelpTipProps {
  text: string;
  className?: string;
  // When children are provided, they become the hover trigger (no "?" icon).
  // Used to dock field tooltips onto their label text.
  children?: React.ReactNode;
}

// Reveals a small tooltip on hover/focus, portal-rendered to document.body so it
// escapes overflow clipping. With no children it renders an encircled "?" icon
// (for card titles); with children it wraps the text as the trigger.
export default function HelpTip({ text, className = '', children }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const ref = useRef<HTMLElement>(null);

  const show = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top });
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  const left = Math.min(Math.max(pos.x - 110, 8), window.innerWidth - 228);

  const triggerProps = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  };

  return (
    <>
      {children != null ? (
        <span
          ref={ref as React.RefObject<HTMLSpanElement>}
          tabIndex={0}
          {...triggerProps}
          className={`cursor-help ${className}`}
        >
          {children}
        </span>
      ) : (
        <button
          ref={ref as React.RefObject<HTMLButtonElement>}
          type="button"
          aria-label="Help"
          {...triggerProps}
          onClick={e => { e.stopPropagation(); open ? hide() : show(); }}
          className={`text-gray-300 hover:text-brand-blue transition-colors focus:outline-none focus-visible:text-brand-blue ${className}`}
        >
          <QuestionIcon className="w-3.5 h-3.5" />
        </button>
      )}
      {open && createPortal(
        <div
          style={{ position: 'fixed', left, top: pos.y - 8, transform: 'translateY(-100%)', zIndex: 9999, width: 220, pointerEvents: 'none' }}
          className="bg-gray-800 text-white rounded-lg shadow-xl px-3 py-2 text-xs leading-snug"
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  );
}
