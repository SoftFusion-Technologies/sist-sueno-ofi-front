import React, { useMemo, useRef, useState } from 'react';
import SearchableSelect from './SearchableSelect';

export default function LocalesCantidadPicker({
  locales = [],
  lugares = [],
  estados = [],
  value = [],
  onChange = () => {},
  label = 'Locales, cantidades, lugar y estado',
  min = 0,
  step = 1,
  listClassName = '',
  defaults = {}
}) {
  const safeLocales = Array.isArray(locales) ? locales : [];
  const safeLugares = Array.isArray(lugares) ? lugares : [];
  const safeEstados = Array.isArray(estados) ? estados : [];
  const safeValue = Array.isArray(value) ? value : [];

  const inputRefs = useRef(new Map());

  const nombreLocal = (id) =>
    safeLocales.find((l) => Number(l.id) === Number(id))?.nombre ||
    `Local ${id}`;

  const addLocal = (id) => {
    const nId = Number(id);
    if (!nId) return;
    if (safeValue.some((v) => Number(v.local_id) === nId)) return;
    const next = [
      ...safeValue,
      {
        local_id: nId,
        cantidad: 0,
        lugar_id: Number(defaults.lugar_id) || '',
        estado_id: Number(defaults.estado_id) || ''
      }
    ];
    onChange(next);
    requestAnimationFrame(() => {
      const el = inputRefs.current.get(nId);
      if (el) el.focus();
    });
  };

  const patchRow = (local_id, patch) => {
    const id = Number(local_id);
    onChange(
      safeValue.map((r) => (Number(r.local_id) === id ? { ...r, ...patch } : r))
    );
  };

  const setCantidad = (local_id, cantidad) => {
    const qty = Math.max(
      min,
      Number.isFinite(Number(cantidad)) ? Number(cantidad) : 0
    );
    patchRow(local_id, { cantidad: qty });
  };

  const stepCantidad = (local_id, delta) => {
    const row = safeValue.find((v) => Number(v.local_id) === Number(local_id));
    const curr = Number(row?.cantidad || 0);
    setCantidad(local_id, Math.max(min, curr + delta));
  };

  const removeLocal = (local_id) => {
    const id = Number(local_id);
    onChange(safeValue.filter((v) => Number(v.local_id) !== id));
  };

  const clearAll = () => onChange([]);

  const total = useMemo(
    () => safeValue.reduce((acc, v) => acc + (Number(v.cantidad) || 0), 0),
    [safeValue]
  );

  const [applyAllOpen, setApplyAllOpen] = useState(false);
  const [applyAllQty, setApplyAllQty] = useState(0);
  const applyAll = () => {
    const next = safeValue.map((v) => ({
      ...v,
      cantidad: Math.max(min, Number(applyAllQty) || 0)
    }));
    onChange(next);
    setApplyAllOpen(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block font-semibold mb-2 text-gray-800">
          {label}
        </label>
      )}

      {/* Header: selector + acciones rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="lg:flex-1">
          <SearchableSelect
            // label="Agregar local"
            items={safeLocales}
            value=""
            onChange={(id) => addLocal(id)}
            placeholder="Buscar y agregar…"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setApplyAllOpen((o) => !o)}
              className="px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm shadow-sm disabled:opacity-50"
              disabled={safeValue.length === 0}
            >
              Aplicar a todos
            </button>
            {applyAllOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-10">
                <div className="text-sm font-medium mb-2">
                  Cantidad para todos
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={min}
                    step={step}
                    value={applyAllQty}
                    onChange={(e) => setApplyAllQty(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-right"
                  />
                  <button
                    type="button"
                    onClick={applyAll}
                    className="px-3 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-sm shadow-sm disabled:opacity-50"
            disabled={safeValue.length === 0}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4">
        {safeValue.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-600">
            <span className="text-sm">
              Sin locales seleccionados aún. Usá el buscador de arriba para
              agregarlos.
            </span>
          </div>
        ) : (
          <div
            className={`rounded-xl border border-gray-200 ${
              listClassName || 'max-h-64'
            } overflow-auto`}
          >
            {/* Encabezado (solo desktop) */}
            <div
              className="hidden md:grid sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-2
                            [grid-template-columns:minmax(260px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_160px_56px]"
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Local
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Lugar
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Estado
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right pr-6">
                Cantidad
              </div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                Acciones
              </div>
            </div>

            <ul className="divide-y divide-gray-100">
              {safeValue.map((row) => (
                <li
                  key={row.local_id}
                  className="group grid gap-3 px-3 py-3 bg-white transition
                             md:[grid-template-columns:minmax(260px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_160px_56px]"
                >
                  {/* Local */}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {nombreLocal(row.local_id)}
                    </div>
                    <div className="text-xs text-gray-500 md:hidden">
                      ID: {row.local_id}
                    </div>
                  </div>

                  {/* Lugar */}
                  <div className="md:[&>div>label]:hidden">
                    <SearchableSelect
                      label="Lugar"
                      items={lugares}
                      value={row.lugar_id}
                      onChange={(id) =>
                        patchRow(row.local_id, { lugar_id: Number(id) || '' })
                      }
                      placeholder="Lugar…"
                      portal // 👈 importante
                      portalZIndex={2000}
                      dropdownMaxHeight="56vh"
                    />
                  </div>

                  {/* Estado */}
                  <div className="md:[&>div>label]:hidden">
                    <SearchableSelect
                      label="Estado"
                      items={safeEstados}
                      value={row.estado_id || ''}
                      onChange={(id) =>
                        patchRow(row.local_id, { estado_id: Number(id) || '' })
                      }
                      placeholder="Estado…"
                      portal // 👈 importante
                      portalZIndex={2000}
                      required
                      className="md:[&>label]:hidden"
                    />
                  </div>

                  {/* Cantidad (+/−) */}
                  <div className="flex items-stretch justify-end">
                    <div className="flex items-stretch rounded-xl overflow-hidden border border-gray-300">
                      <button
                        type="button"
                        onClick={() => stepCantidad(row.local_id, -step)}
                        className="px-3 text-lg leading-none hover:bg-gray-50"
                        aria-label="Restar"
                      >
                        −
                      </button>
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(row.local_id, el);
                        }}
                        type="number"
                        inputMode="numeric"
                        min={min}
                        step={step}
                        value={row.cantidad ?? 0}
                        onChange={(e) =>
                          setCantidad(row.local_id, e.target.value)
                        }
                        className="w-28 md:w-32 text-right px-3 py-2 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => stepCantidad(row.local_id, +step)}
                        className="px-3 text-lg leading-none hover:bg-gray-50"
                        aria-label="Sumar"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeLocal(row.local_id)}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50"
                      aria-label={`Quitar ${nombreLocal(row.local_id)}`}
                      title="Quitar"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer resumen */}
      <div className="sticky bottom-0 mt-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-gray-600">
            Locales:{' '}
            <span className="font-semibold text-gray-800">
              {safeValue.length}
            </span>
            <span className="mx-2">·</span>
            Total a distribuir:{' '}
            <span className="font-semibold text-gray-900">{total}</span>
          </div>
          {total === 0 && safeValue.length > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Todas las cantidades están en 0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
