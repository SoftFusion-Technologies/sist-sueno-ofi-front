// ===============================
// FILE: src/Components/Compras/Pagos/PagoAplicacionesModal.jsx
// DESC: Modal para aplicar (imputar) un pago existente a CxP del proveedor.
// Props:
//   - open: boolean
//   - onClose: () => void
//   - pagoId: number (ID del pago)
//   - proveedorId: number
//   - totalDisponible: number (saldo disponible del pago)
//   - onApplied: () => void (callback tras aplicar correctamente)
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import {
  X,
  Building2,
  Filter,
  Wand2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react';

import http from '../../../api/http';
import { moneyAR, round2 } from '../../../utils/money';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../../ui/animHelpers';

const glass = 'bg-white/10 backdrop-blur-xl';
const ring = 'ring-1 ring-white/10';

export default function PagoAplicacionesModal({
  open,
  onClose,
  pagoId,
  proveedorId,
  totalDisponible = 0,
  totalMedios,
  onApplied
}) {
  const [loading, setLoading] = useState(false); // carga de CxP
  const [saving, setSaving] = useState(false); // submit
  const [rows, setRows] = useState([]); // CxP pendientes/parciales del proveedor
  const [err, setErr] = useState('');
  const disponibleNum = Number(totalDisponible || 0);

  // Monto a aplicar por CxP (map id -> number)
  const [montos, setMontos] = useState({});
  const [showSoloVencidas, setShowSoloVencidas] = useState(false);
  const [q, setQ] = useState('');

  // ------- Fetch CxP elegibles
  useEffect(() => {
    if (!open || !proveedorId) return;

    (async () => {
      setLoading(true);
      setErr('');
      try {
        // Traer PENDIENTE y PARCIAL
        const [pend, parc] = await Promise.all([
          http.get('/compras/cxp', {
            params: {
              proveedor_id: proveedorId,
              estado: 'pendiente',
              pageSize: 500,
              orderBy: 'fecha_vencimiento',
              orderDir: 'ASC'
            }
          }),
          http.get('/compras/cxp', {
            params: {
              proveedor_id: proveedorId,
              estado: 'parcial',
              pageSize: 500,
              orderBy: 'fecha_vencimiento',
              orderDir: 'ASC'
            }
          })
        ]);

        const getArr = (r) =>
          Array.isArray(r?.data?.data)
            ? r.data.data
            : r?.data?.rows || r?.data || [];

        const all = [...getArr(pend), ...getArr(parc)];

        // Normalizar mínimos
        const norm = all.map((r) => ({
          id: r.id, // id de la CxP
          compra_id: r.compra_id, // necesario para el backend
          proveedor_id: r.proveedor_id,
          fecha_emision: r.fecha_emision,
          fecha_vencimiento: r.fecha_vencimiento,
          monto_total: Number(r.monto_total || 0),
          saldo: Number(r.saldo || 0),
          estado: r.estado
        }));

        // Ordenar por vencimiento asc (nulos al final)
        norm.sort((a, b) => {
          const ta = a.fecha_vencimiento
            ? new Date(a.fecha_vencimiento).getTime()
            : Infinity;
          const tb = b.fecha_vencimiento
            ? new Date(b.fecha_vencimiento).getTime()
            : Infinity;
          return ta - tb;
        });

        setRows(norm);
        setMontos({}); // reset montos al abrir
      } catch (e) {
        setErr(
          e?.mensajeError || e?.error || 'No se pudieron cargar CxP elegibles.'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [open, proveedorId]);

  // ------- Helpers
  const hoyISO = new Date().toISOString().slice(0, 10);
  const isOverdue = (f) => !!f && f < hoyISO;
  const fmtDate = (f) => (f ? new Date(f).toLocaleDateString('es-AR') : '—');

  const filtered = useMemo(() => {
    let arr = rows;
    if (showSoloVencidas)
      arr = arr.filter((r) => isOverdue(r.fecha_vencimiento));
    if (q?.trim()) {
      const t = q.trim().toLowerCase();
      arr = arr.filter((r) => `${r.id}`.includes(t));
    }
    return arr;
  }, [rows, showSoloVencidas, q]);

  const totalSeleccionado = useMemo(() => {
    return filtered.reduce((acc, r) => acc + (Number(montos[r.id]) || 0), 0);
  }, [filtered, montos]);

  const restante = useMemo(() => {
    const d = round2(
      (Number(totalDisponible) || 0) - (Number(totalSeleccionado) || 0)
    );
    return d < 0 ? 0 : d;
  }, [totalDisponible, totalSeleccionado]);

  const canSubmit = useMemo(() => {
    const selPositivos = filtered.some((r) => (Number(montos[r.id]) || 0) > 0);

    return (
      selPositivos &&
      totalSeleccionado > 0 &&
      round2(totalSeleccionado) === round2(disponibleNum) // 👈 IGUAL, no <=
    );
  }, [filtered, montos, totalSeleccionado, disponibleNum]);

  const setMonto = (id, v, saldoMax) => {
    if (v === '') {
      setMontos((m) => ({ ...m, [id]: '' }));
      return;
    }
    const num = Number(v);
    if (isNaN(num)) return;

    const bounded = Math.max(0, Math.min(num, Number(saldoMax)));
    setMontos((m) => ({ ...m, [id]: round2(bounded) }));
  };

  const aplicarFullUno = (row) => {
    if (!row) return;
    // Permitimos que “reemplace” el valor actual, pero sin pasarse del saldo ni del disponible
    const yaTenia = Number(montos[row.id]) || 0;
    const maxDisponible =
      Number(totalDisponible) - (totalSeleccionado - yaTenia);
    const max = Math.min(Number(row.saldo || 0), maxDisponible);
    setMontos((m) => ({ ...m, [row.id]: round2(max) }));
  };

  const limpiar = () => setMontos({});

  const autoDistribuir = () => {
    let rem = Number(totalDisponible) || 0;
    const next = {};
    // ordenar por vencimiento asc, luego por saldo desc
    const base = [...filtered].sort((a, b) => {
      const ta = a.fecha_vencimiento
        ? new Date(a.fecha_vencimiento).getTime()
        : Infinity;
      const tb = b.fecha_vencimiento
        ? new Date(b.fecha_vencimiento).getTime()
        : Infinity;
      if (ta !== tb) return ta - tb;
      return (b.saldo || 0) - (a.saldo || 0);
    });
    for (const r of base) {
      if (rem <= 0) break;
      const use = Math.min(rem, Number(r.saldo || 0));
      next[r.id] = round2(use);
      rem = round2(rem - use);
    }
    setMontos(next);
  };

  // ------- Submit
  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;

    // Construir payload con montos > 0
    const aplicaciones = filtered
      .map((r) => ({
        compra_id: r.compra_id, // viene del norm
        monto_aplicado: Number(montos[r.id]) || 0
      }))
      .filter((a) => a.monto_aplicado > 0);

    const suma = aplicaciones.reduce((a, b) => a + b.monto_aplicado, 0);

    if (suma > Number(totalDisponible || 0)) {
      return Swal.fire(
        'Saldo insuficiente',
        'La suma supera el disponible del pago.',
        'warning'
      );
    }

    try {
      setLoading(true);
      await http.post(`/pagos-proveedor/${pagoId}/aplicar`, {
        proveedor_id: proveedorId, // opcional, el backend confía en el pago
        aplicaciones
      });

      await Swal.fire(
        'Pago aplicado',
        'Las imputaciones se registraron correctamente.',
        'success'
      );

      onApplied?.(); // cierra modal + refresh en el padre
    } catch (e) {
      Swal.fire(
        'No se pudo aplicar',
        e?.mensajeError || e?.error || 'Revisá los datos.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ------- Render
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aplicar-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* FX de fondo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-20 size-[22rem] sm:size-[28rem] rounded-full blur-3xl opacity-45 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.14),rgba(6,182,212,0.12),rgba(99,102,241,0.12),transparent,rgba(6,182,212,0.12))]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-16 size-[24rem] sm:size-[30rem] rounded-full blur-3xl opacity-35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_60%)]"
          />

          {/* Panel */}
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[92vw] sm:max-w-2xl max-h-[88vh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-200" />
            </button>

            <div className="relative z-10 p-5 sm:p-6 md:p-7 space-y-4">
              {/* Header */}
              <motion.div
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                <motion.div
                  variants={fieldV}
                  className="flex flex-wrap items-center gap-3"
                >
                  <Building2 className="h-6 w-6 text-gray-300" />
                  <div>
                    <h3
                      id="aplicar-title"
                      className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                    >
                      Aplicar pago #{pagoId}
                    </h3>
                    <p className="text-xs text-gray-200/80">
                      Distribuí el pago sobre las CxP pendientes/parciales del
                      proveedor.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  variants={fieldV}
                  className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-200/85"
                >
                  <div className="rounded-xl px-3 py-2 border border-white/10 bg-white/5">
                    Disponible: <strong>{moneyAR(totalDisponible)}</strong>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-white/10 bg-white/5">
                    Seleccionado: <strong>{moneyAR(totalSeleccionado)}</strong>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-white/10 bg-white/5">
                    Restante: <strong>{moneyAR(restante)}</strong>
                  </div>
                </motion.div>

                {/* 👇 NUEVO MENSAJE */}
                <motion.div
                  variants={fieldV}
                  className="mt-1 text-xs text-amber-200/90 text-right"
                >
                  En este flujo, el total a aplicar debe coincidir con el total
                  de medios ({moneyAR(totalMedios ?? totalDisponible)}).
                </motion.div>
                {/* KPIs disponibles / seleccionado / restante */}
                <motion.div
                  variants={fieldV}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <div className="rounded-xl px-3 py-2 border border-emerald-300/40 bg-emerald-500/10 text-xs text-emerald-50">
                    <div className="opacity-80 mb-0.5">Disponible</div>
                    <div className="text-sm font-semibold">
                      {moneyAR(totalDisponible)}
                    </div>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-cyan-300/40 bg-cyan-500/10 text-xs text-cyan-50">
                    <div className="opacity-80 mb-0.5">Seleccionado</div>
                    <div className="text-sm font-semibold">
                      {moneyAR(totalSeleccionado)}
                    </div>
                  </div>
                  <div className="rounded-xl px-3 py-2 border border-white/20 bg-white/5 text-xs text-gray-100">
                    <div className="opacity-80 mb-0.5">Restante</div>
                    <div className="text-sm font-semibold">
                      {moneyAR(restante)}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Toolbar */}
              <motion.div
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 sm:px-4 sm:py-3.5 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  <div className="md:col-span-5 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 h-4 w-4" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar por #CxP…"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl ${glass} ${ring} text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40`}
                    />
                  </div>

                  <label className="md:col-span-3 inline-flex items-center gap-2 text-xs sm:text-sm text-gray-200 select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/30 bg-transparent"
                      checked={showSoloVencidas}
                      onChange={(e) => setShowSoloVencidas(e.target.checked)}
                    />
                    Solo vencidas
                  </label>

                  <div className="md:col-span-4 flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={autoDistribuir}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${glass} ${ring} text-white hover:bg-white/20 text-xs sm:text-sm`}
                    >
                      <Wand2 className="h-4 w-4" /> Auto distribuir
                    </button>
                    <button
                      type="button"
                      onClick={limpiar}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 text-xs sm:text-sm"
                    >
                      <RotateCcw className="h-4 w-4" /> Limpiar
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Tabla */}
              <div className="overflow-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="min-w-full text-[13px] text-white/90">
                  <thead className="bg-white/10 backdrop-blur-xl">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        #CxP
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Vencimiento
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Saldo
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Aplicar
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-gray-300/80 text-center"
                        >
                          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />{' '}
                          Cargando…
                        </td>
                      </tr>
                    ) : err ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-rose-300 text-center"
                        >
                          <AlertTriangle className="inline h-4 w-4 mr-2" />{' '}
                          {err}
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-gray-300/80 text-center"
                        >
                          No hay CxP elegibles para aplicar.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((r) => {
                        const val = montos[r.id] ?? '';
                        const vencida = isOverdue(r.fecha_vencimiento);
                        return (
                          <tr
                            key={r.id}
                            className={vencida ? 'bg-rose-300/5' : ''}
                          >
                            <td className="px-3 py-2 font-medium whitespace-nowrap">
                              #{r.id}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <span>{fmtDate(r.fecha_vencimiento)}</span>
                                {vencida && (
                                  <span className="text-[11px] text-rose-300">
                                    (Vencida)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-right whitespace-nowrap">
                              {moneyAR(r.saldo)}
                            </td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              <input
                                inputMode="decimal"
                                type="number"
                                step="0.01"
                                min={0}
                                max={r.saldo}
                                value={val}
                                onChange={(e) =>
                                  setMonto(r.id, e.target.value, r.saldo)
                                }
                                className={`w-28 px-2 py-1 rounded-lg ${glass} ${ring} text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40`}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => aplicarFullUno(r)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${glass} ${ring} text-white hover:bg-white/20 text-xs`}
                              >
                                <Plus className="h-4 w-4" /> Full
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {filtered.length > 0 && !loading && !err && (
                    <tfoot className="bg-white/10">
                      <tr>
                        <td className="px-3 py-2" colSpan={2}>
                          <span className="text-xs text-white/70">
                            Total seleccionado
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold">
                          {moneyAR(totalSeleccionado)}
                        </td>
                        <td className="px-3 py-2 font-bold" colSpan={2}>
                          Restante: {moneyAR(restante)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Footer acciones */}
              <div className="pt-1 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || loading}
                  onClick={submit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                      Aplicando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="inline h-4 w-4 mr-1" /> Aplicar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Línea base metálica */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gray-400/70 via-gray-200/70 to-gray-400/70 opacity-40 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
