// src/Components/SearchableSelect.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableSelect({
  label,
  items = [],
  value,
  onChange,
  placeholder = 'Seleccionar…',
  disabled = false,
  required = false,
  className = '',
  getOptionLabel = (o) => o?.nombre ?? '',
  getOptionValue = (o) => o?.id
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef(null);

  const selected = useMemo(() => {
    return (
      items.find((i) => String(getOptionValue(i)) === String(value)) || null
    );
  }, [items, value, getOptionValue]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => getOptionLabel(i).toLowerCase().includes(s));
  }, [items, q, getOptionLabel]);

  // cerrar al click afuera
  useEffect(() => {
    const handler = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && <label className="block font-semibold mb-1">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full px-4 py-2 rounded-lg border bg-white text-gray-800 flex items-center justify-between ${
          disabled
            ? 'border-gray-200 opacity-60 cursor-not-allowed'
            : 'border-gray-300'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
      >
        <span className={`truncate ${selected ? '' : 'text-gray-500'}`}>
          {selected ? getOptionLabel(selected) : placeholder}
        </span>
        <span className="ml-2 opacity-60">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="p-2 border-b border-gray-200">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none"
            />
          </div>

          <ul role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 select-none">
                Sin resultados
              </li>
            )}

            {filtered.map((opt) => {
              const id = getOptionValue(opt);
              const label = getOptionLabel(opt);
              const isSel = String(id) === String(value);
              return (
                <li
                  key={id}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => {
                    onChange?.(id, opt);
                    setOpen(false);
                    setQ('');
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    isSel ? 'bg-cyan-50 text-cyan-700 font-semibold' : ''
                  }`}
                >
                  {label}
                </li>
              );
            })}
          </ul>

          <div className="p-2 flex items-center justify-between border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onChange?.('');
                setQ('');
                setOpen(false);
              }}
              className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-2 py-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
