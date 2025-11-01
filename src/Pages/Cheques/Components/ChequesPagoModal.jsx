import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  Filter,
  Calendar,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

/**
 * ChequesPagoModal — v2.1 (saldo virtual + UX moderna)
 *
 * Props:
 * - open, onClose
 * - BASE_URL
 * - uid
 * - proveedor: { id, razon_social }
 * - compraId?: number|null
 * - cajaId?: number|null
 * - totalCompraARS: number
 * - productoNombre?: string
 * - onPaid?: ({ ok, total, applied }: {ok:boolean,total:number,applied:Array<{cheque_id:number,monto:number}>}) => void
 */


function moneyAR(n) {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(Number(n) || 0);
  } catch {
    const v = Number(n || 0);
    return `\$ ${v.toFixed(2)}`;
  }
}
const toCents = (n) => Math.round((Number(n) || 0) * 100);
const fromCents = (c) => Math.round(Number(c) || 0) / 100;
const clamp2dec = (s) => {
  const v = String(s ?? '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const [a, b = ''] = v.split('.');
  return b.length > 2 ? `${a}.${b.slice(0, 2)}` : v || '0';
};
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ChequesPagoModal({
  open,
  onClose,
  BASE_URL,
  uid,
  proveedor,
  compraId,
  cajaId,
  totalCompraARS,
  productoNombre,
  onPaid
}) {
  // ------------------------ state base ------------------------
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const [bancos, setBancos] = useState([]);
  const [selBanco, setSelBanco] = useState('');
  const [dq, setDq] = useState('');

  const [cheques, setCheques] = useState([]);

  // UX extra
  const [sortBy, setSortBy] = useState('venc_asc'); // 'venc_asc' | 'monto_desc' | 'banco_asc'
  const [excludeVencidos, setExcludeVencidos] = useState(false);
  const [priorizarAcreditados, setPriorizarAcreditados] = useState(true);

  // Montos por cheque (en centavos)
  const [montos, setMontos] = useState({}); // { [chequeId]: cents }

  // ------------------------ totals ------------------------
  const totalObjetivoCents = useMemo(
    () => toCents(totalCompraARS),
    [totalCompraARS]
  );
  const aplicadoCents = useMemo(
    () => Object.values(montos).reduce((acc, v) => acc + (Number(v) || 0), 0),
    [montos]
  );
  const restanteCents = Math.max(0, totalObjetivoCents - aplicadoCents);
  const validExact =
    totalObjetivoCents > 0 && aplicadoCents === totalObjetivoCents;
  const progressPct = totalObjetivoCents
    ? Math.min(100, Math.round((aplicadoCents / totalObjetivoCents) * 100))
    : 0;

  // ------------------------ helpers ------------------------
  // Saldo virtual: si backend lo manda (saldo_disponible_virtual), usarlo. Sino: monto - usado.
  const getSaldoCents = (row) => {
    if (row?.saldo_disponible_virtual != null)
      return toCents(row.saldo_disponible_virtual);

    const monto = toCents(row?.monto ?? 0);
    // varios backends exponen "monto_aplicado_total" o "usado"; probamos ambos
    const usado =
      row?.monto_aplicado_total != null
        ? toCents(row.monto_aplicado_total)
        : toCents(row?.usado ?? 0);

    const calc = Math.max(0, monto - usado);
    return calc;
  };

  const isVencido = (row) => {
    const f = String(row?.fecha_vencimiento || '');
    return f && f < todayISO();
  };

  // ------------------------ fetchers ------------------------
  useEffect(() => {
    if (!open) return;
    let abort = false;
    (async () => {
      try {
        const r = await fetch(`${BASE_URL}/bancos`);
        const js = await r.json().catch(() => null);
        const arr = Array.isArray(js?.data)
          ? js.data
          : Array.isArray(js)
          ? js
          : [];
        if (!abort) setBancos(arr);
      } catch {
        if (!abort) setBancos([]);
      }
    })();
    return () => {
      abort = true;
    };
  }, [open, BASE_URL]);

  const fetchCheques = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      // sólo habilitados para pagar compra
      params.append('estado', 'en_cartera');
      params.append('estado', 'acreditado');
      if (selBanco) params.append('banco_id', String(selBanco));
      if (dq?.trim()) params.append('q', dq.trim());

      const r = await fetch(`${BASE_URL}/cheques?${params.toString()}`);
      const js = await r.json().catch(() => null);
      const arr = Array.isArray(js?.data)
        ? js.data
        : Array.isArray(js)
        ? js
        : [];

      const norm = arr.map((x) => ({
        ...x,
        banco_nombre: x.banco_nombre || x.banco?.nombre || 'Banco'
      }));

      // filtrado opcional
      const filtered = norm.filter((x) => {
        const saldo = getSaldoCents(x);
        if (saldo <= 0) return false;
        if (excludeVencidos && isVencido(x)) return false;
        return true;
      });

      setCheques(filtered);
    } catch (e) {
      setError('No se pudieron cargar cheques disponibles.');
      setCheques([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchCheques(); /* eslint-disable-next-line */
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => fetchCheques(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selBanco, dq, excludeVencidos]);

  // ------------------------ UI sorting & mapping ------------------------
  const rowsUI = useMemo(() => {
    const rows = (cheques || []).map((r) => {
      const saldoCents = getSaldoCents(r);
      const valCents = Number(montos[r.id] || 0);
      return {
        id: r.id,
        numero: r.numero ?? r.id,
        banco: r.banco_nombre || 'Banco',
        venc: r.fecha_vencimiento || '',
        estado: r.estado || 'en_cartera',
        saldoCents,
        valCents,
        formato: r.formato || 'fisico',
        raw: r
      };
    });

    // priorizar acreditados si se tilda
    const bias = (estado) =>
      priorizarAcreditados ? (estado === 'acreditado' ? -1 : 1) : 0;

    const sorted = [...rows].sort((a, b) => {
      if (bias(a.estado) !== bias(b.estado))
        return bias(a.estado) - bias(b.estado);
      if (sortBy === 'monto_desc') return b.saldoCents - a.saldoCents;
      if (sortBy === 'banco_asc')
        return String(a.banco).localeCompare(String(b.banco));
      // default: venc_asc (vacíos al final)
      const av = a.venc || '9999-99-99';
      const bv = b.venc || '9999-99-99';
      return av.localeCompare(bv);
    });

    return sorted;
  }, [cheques, montos, sortBy, priorizarAcreditados]);

  // ------------------------ actions ------------------------
  const setMontoFor = (chequeId, valueStr, saldoCents) => {
    const raw2 = clamp2dec(valueStr);
    let cents = toCents(raw2);
    if (Number.isFinite(saldoCents)) cents = Math.min(cents, saldoCents);
    cents = Math.max(0, cents);
    // no dejar superar el total objetivo
    const otros = Object.entries(montos).reduce(
      (a, [k, v]) => (Number(k) === chequeId ? a : a + Number(v || 0)),
      0
    );
    const maxPermitido = Math.max(0, totalObjetivoCents - otros);
    if (cents > maxPermitido) cents = maxPermitido;
    setMontos((m) => ({ ...m, [chequeId]: cents }));
  };

  const autoDistribuir = () => {
    if (!rowsUI.length) return;
    let restante = restanteCents;
    const next = { ...montos };
    for (const r of rowsUI) {
      if (restante <= 0) break;
      const ya = Number(next[r.id] || 0);
      const puede = Math.max(0, r.saldoCents - ya);
      if (puede <= 0) continue;
      const aplicar = Math.min(puede, restante);
      next[r.id] = ya + aplicar;
      restante -= aplicar;
    }
    setMontos(next);
  };

  const clearMontos = () => setMontos({});

  const fillRestanteFila = (r) => {
    if (restanteCents <= 0) return;
    const ya = Number(montos[r.id] || 0);
    const puede = Math.max(0, r.saldoCents - ya);
    if (puede <= 0) return;
    const aplicar = Math.min(puede, restanteCents);
    setMontos((m) => ({ ...m, [r.id]: ya + aplicar }));
  };

  const maxFila = (r) => {
    // intenta cubrir el restante con todo el saldo
    const otros = Object.entries(montos).reduce(
      (a, [k, v]) => (Number(k) === r.id ? a : a + Number(v || 0)),
      0
    );
    const maxPermitido = Math.max(0, totalObjetivoCents - otros);
    const aplicar = Math.min(r.saldoCents, maxPermitido);
    setMontos((m) => ({ ...m, [r.id]: aplicar }));
  };

  // confirm
  const canConfirm =
    validExact &&
    !posting &&
    aplicadoCents > 0 &&
    Object.values(montos).every((c) => Number(c) >= 0);

  const handleConfirm = async () => {
    setPosting(true);
    setError('');
    try {
      const ops = rowsUI.filter((r) => r.valCents > 0);
      if (!ops.length) throw new Error('No seleccionaste montos a aplicar.');
      if (!validExact)
        throw new Error(
          'El total aplicado debe ser EXACTAMENTE igual al total de la compra.'
        );

      const baseObs = `Pago compra con cheques · Prov. ${
        proveedor?.razon_social || ''
      }${productoNombre ? ` · ${productoNombre}` : ''}`.trim();
      const baseIdem = `cu-${Date.now()}-${uid || 'u'}`;

      const applied = [];

      for (let i = 0; i < ops.length; i++) {
        const r = ops[i];
        const monto = fromCents(r.valCents);
        const resp = await fetch(`${BASE_URL}/cheques-usos/usar/${r.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': String(uid ?? ''),
            'Idempotency-Key': `${baseIdem}-${i}`
          },
          body: JSON.stringify({
            accion: 'aplicar_a_compra',
            monto,
            proveedor_id: proveedor?.id || null,
            compra_id: compraId || null,
            caja_id: cajaId || null,
            observaciones: baseObs,
            usuario_id: uid || null
          })
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          throw new Error(
            `Fallo al aplicar cheque #${r.numero}: ${resp.status} ${txt}`
          );
        }
        applied.push({ cheque_id: r.id, monto });
      }

      onPaid?.({ ok: true, total: fromCents(aplicadoCents), applied });
      onClose?.();
    } catch (e) {
      setError(e.message || 'Error al registrar pago con cheques');
    } finally {
      setPosting(false);
    }
  };

  // atajos
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === 'enter' &&
        canConfirm
      ) {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, canConfirm]); // eslint-disable-line

  // ------------------------ render ------------------------
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="relative w-full max-w-5xl mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-b from-slate-50 to-white">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  Pagar con cheques
                </div>
                <div className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <span>Total: {moneyAR(totalCompraARS)}</span>
                  <span className="text-sm font-medium text-slate-500">
                    Restante: {moneyAR(fromCents(restanteCents))}
                  </span>
                </div>
                {proveedor?.razon_social && (
                  <div className="text-xs text-slate-500">
                    Proveedor: {proveedor.razon_social}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progreso */}
            <div className="px-6 pt-4">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 ${
                    validExact ? 'bg-emerald-500' : 'bg-slate-900'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1 text-[12px] text-slate-600">
                Aplicado {moneyAR(fromCents(aplicadoCents))} · {progressPct}%
              </div>
            </div>

            {/* Filtros */}
            <div className="px-6 pt-3 pb-2">
              {error && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-1">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    value={dq}
                    onChange={(e) => setDq(e.target.value)}
                    placeholder="Buscar por número"
                    className="w-full text-right text-black placeholder-slate-500 pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div className="relative md:col-span-1">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Filter size={16} />
                  </span>
                  <select
                    value={selBanco}
                    onChange={(e) => setSelBanco(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400 bg-white text-slate-800"
                  >
                    <option value="">Todos los bancos</option>
                    {bancos.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="exv"
                      type="checkbox"
                      checked={excludeVencidos}
                      onChange={(e) => setExcludeVencidos(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="exv"
                      className="text-sm text-slate-700 flex items-center gap-1"
                    >
                      <Calendar size={14} /> Excluir vencidos
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="prio"
                      type="checkbox"
                      checked={priorizarAcreditados}
                      onChange={(e) =>
                        setPriorizarAcreditados(e.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="prio" className="text-sm text-slate-700">
                      Priorizar acreditados
                    </label>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-sm text-slate-700">
                      Ordenar por:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="pl-2 pr-6 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400 bg-white text-slate-800"
                    >
                      <option value="venc_asc">Vencimiento ↑</option>
                      <option value="monto_desc">Saldo disponible ↓</option>
                      <option value="banco_asc">Banco A→Z</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="px-6 pb-4">
              <div className="w-full overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-2">Cheque</th>
                      <th className="text-left px-3 py-2">Banco Emisor</th>
                      <th className="text-left px-3 py-2">Vence</th>
                      <th className="text-left px-3 py-2">Estado</th>
                      <th className="text-right px-3 py-2">Saldo disp.</th>
                      <th className="text-right px-3 py-2">Monto a aplicar</th>
                      <th className="text-right px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          <Loader2
                            className="inline mr-2 animate-spin"
                            size={16}
                          />
                          Cargando cheques…
                        </td>
                      </tr>
                    )}
                    {!loading && rowsUI.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          Sin cheques disponibles con los filtros actuales.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      rowsUI.map((r) => (
                        <tr
                          key={r.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-3 py-2 font-medium text-slate-800">
                            #{r.numero}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            {r.banco}
                          </td>
                          <td className="px-3 py-2 text-slate-700">
                            <span
                              className={
                                'inline-flex items-center rounded px-2 py-0.5 text-[11px] ' +
                                (isVencido(r.raw)
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border border-slate-200')
                              }
                            >
                              {r.venc || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] border ${
                                r.estado === 'acreditado'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {r.estado}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                            {moneyAR(fromCents(r.saldoCents))}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fromCents(r.valCents).toFixed(2)}
                              onChange={(e) =>
                                setMontoFor(r.id, e.target.value, r.saldoCents)
                              }
                              className="w-36 text-right text-black placeholder-slate-500 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-400"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => fillRestanteFila(r)}
                                disabled={
                                  restanteCents === 0 ||
                                  r.saldoCents === r.valCents
                                }
                                className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
                                title="Rellenar restante"
                              >
                                Rellenar
                              </button>
                              <button
                                onClick={() => maxFila(r)}
                                className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
                                title="Usar todo"
                              >
                                Max
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Totales + acciones */}
              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <Banknote size={16} />
                  <span>
                    Aplicado:{' '}
                    <b className="text-slate-800">
                      {moneyAR(fromCents(aplicadoCents))}
                    </b>
                  </span>
                  <span className="ml-3">
                    Restante:{' '}
                    <b className="text-slate-800">
                      {moneyAR(fromCents(restanteCents))}
                    </b>
                  </span>
                  {validExact ? (
                    <span className="ml-3 inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 size={16} /> Montos correctos
                    </span>
                  ) : (
                    <span className="ml-3 text-amber-700">
                      El aplicado debe coincidir con el total
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={fetchCheques}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
                    title="Actualizar"
                  >
                    Actualizar
                  </button>
                  <button
                    onClick={autoDistribuir}
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                    disabled={restanteCents === 0 || loading || !rowsUI.length}
                    title="Auto-distribuir el restante"
                  >
                    Auto
                  </button>
                  <button
                    onClick={clearMontos}
                    className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
                    title="Limpiar montos"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-white border hover:bg-slate-50 text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    className={`px-4 py-2 rounded-lg text-white ${
                      canConfirm
                        ? 'bg-slate-900 hover:bg-slate-800'
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                    title="Ctrl + Enter para confirmar"
                  >
                    {posting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />{' '}
                        Registrando…
                      </span>
                    ) : (
                      'Confirmar pago'
                    )}
                  </button>
                </div>
              </div>

              <div className="h-3" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
