// src/Components/SearchableMultiSelect.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableMultiSelect({
  label,
  items = [],
  values = [],
  onChange,
  placeholder = 'Seleccionar uno o más…',
  disabled = false,
  className = '',
  getOptionLabel = (o) => o?.nombre ?? '',
  getOptionValue = (o) => o?.id,
  helperText
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef(null);

  const selectedObjs = useMemo(() => {
    const s = new Set(values.map(String));
    return items.filter((i) => s.has(String(getOptionValue(i))));
  }, [items, values, getOptionValue]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => getOptionLabel(i).toLowerCase().includes(s));
  }, [items, q, getOptionLabel]);

  const toggle = (id) => {
    const strId = String(id);
    const exists = values.map(String).includes(strId);
    const next = exists
      ? values.filter((v) => String(v) !== strId)
      : [...values, id];
    onChange?.(next);
  };

  const selectAllFiltered = () => {
    const ids = filtered.map((i) => getOptionValue(i));
    const merged = Array.from(new Set([...values, ...ids]));
    onChange?.(merged);
  };

  const clearAll = () => onChange?.([]);

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
      >
        <span className="truncate">
          {values?.length ? `Seleccionados: ${values.length}` : placeholder}
        </span>
        <span className="ml-2 opacity-60">▾</span>
      </button>

      {/* chips */}
      {selectedObjs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedObjs.map((o) => {
            const id = getOptionValue(o);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs"
              >
                {getOptionLabel(o)}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="hover:text-cyan-900"
                  title="Quitar"
                >
                  ×
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gray-600 underline"
          >
            Limpiar
          </button>
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-xl shadow-xl p-2">
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
              title="Seleccionar todos (filtrados)"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-1">
            {filtered.map((o) => {
              const id = getOptionValue(o);
              const checked = values.map(String).includes(String(id));
              return (
                <label
                  key={id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => toggle(id)}
                  />
                  <span className="text-sm">{getOptionLabel(o)}</span>
                  {checked && (
                    <span className="ml-auto text-xs text-cyan-700">✓</span>
                  )}
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-sm text-gray-500">
                Sin resultados
              </div>
            )}
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
