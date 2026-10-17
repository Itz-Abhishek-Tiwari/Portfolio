'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({
  label,
  value,
  options,
  onChange,
  disabled
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0),
    root = useRef<HTMLDivElement>(null),
    id = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function toggle() {
    if (disabled) return;
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(o => !o);
  }
  function pick(option: string) {
    onChange(option);
    setOpen(false);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return toggle();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive(i => (i + step + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) pick(options[active]);
      else toggle();
    } else if (e.key === 'Tab') setOpen(false);
  }

  return (
    <div className="contact-full custom-select" ref={root}>
      <span id={`${id}-label`}>{label}</span>
      <button
        type="button"
        className="custom-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span id={`${id}-value`}>{value}</span>
        <ChevronDown size={18} className={open ? 'open' : ''} />
      </button>
      {open && (
        <ul className="custom-select-menu" role="listbox" aria-labelledby={`${id}-label`}>
          {options.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={o === value}
              className={i === active ? 'active' : ''}
              style={{ ['--i' as string]: i }}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(o)}
            >
              <span className="custom-select-index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="custom-select-label">{o}</span>
              <span className="custom-select-dot" aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
