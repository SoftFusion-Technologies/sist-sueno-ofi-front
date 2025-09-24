// src/Components/Chequeras/ChequeraChequesModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listChequesByChequera } from '../../api/chequeras';
import { FaMoneyCheckAlt, FaSearch, FaFilter } from 'react-icons/fa';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

const Chip = ({ text, cls }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}
  >
    {text}
  </span>
);

const chipEstado = (e = 'registrado') =>
  ({
    registrado: 'bg-gray-100 text-gray-700',
    en_cartera: 'bg-indigo-100 text-indigo-700',
    aplicado_a_compra: 'bg-amber-100 text-amber-700',
    endosado: 'bg-cyan-100 text-cyan-700',
    depositado: 'bg-blue-100 text-blue-700',
    acreditado: 'bg-emerald-100 text-emerald-700',
    rechazado: 'bg-rose-100 text-rose-700',
    anulado: 'bg-zinc-200 text-zinc-700',
    entregado: 'bg-fuchsia-100 text-fuchsia-700',
    compensado: 'bg-teal-100 text-teal-700'
  }[e] || 'bg-gray-100 text-gray-700');

export default function ChequeraChequesModal({ open, onClose, chequeraId }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [chequera, setChequera] = useState(null);

  // Filtros UI
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState(''); // en práctica será "emitido", pero lo dejamos abierto
  const [fechaCampo, setFechaCampo] = useState('fecha_emision');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const estados = [
    'registrado',
    'en_cartera',
    'aplicado_a_compra',
    'endosado',
    'depositado',
    'acreditado',
    'rechazado',
    'anulado',
    'entregado',
    'compensado'
  ];

  const fetchData = async () => {
    if (!chequeraId) return;
    setLoading(true);
    try {
      const data = await listChequesByChequera(chequeraId, {
        page,
        limit,
        q,
        estado,
        tipo,
        fechaCampo,
        desde,
        hasta,
        orderBy: 'numero',
        orderDir: 'ASC'
      });
      setRows(Array.isArray(data?.data) ? data.data : []);
      setMeta(data?.meta || null);
      setResumen(data?.resumen || null);
      setChequera(data?.chequera || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cuando cambien filtros/paginación
  useEffect(() => {
    if (!open) return;
    fetchData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, q, estado, tipo, fechaCampo, desde, hasta]);

  const kpis = useMemo(() => {
    const tot = resumen?.totales || { cantidad: 0, monto: 0 };
    const pe = resumen?.porEstado || {};
    return [
      { label: 'Total cheques', value: tot.cantidad, sub: fmt(tot.monto) },
      { label: 'En cartera', value: pe.en_cartera?.cantidad || 0 },
      { label: 'Entregados', value: pe.entregado?.cantidad || 0 },
      { label: 'Aplicados', value: pe.aplicado_a_compra?.cantidad || 0 },
      { label: 'Depositados', value: pe.depositado?.cantidad || 0 },
      { label: 'Acreditados', value: pe.acreditado?.cantidad || 0 },
      { label: 'Rechazados', value: pe.rechazado?.cantidad || 0 },
      { label: 'Compensados', value: pe.compensado?.cantidad || 0 }
    ];
  }, [resumen]);

  const usoPct = chequera?.uso?.porcentaje || 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 210, damping: 22 }}
            className="relative w-full md:max-w-6xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[100svh] md:max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 md:px-6 py-5 border-b bg-gradient-to-r from-[#0ea5e9] via-[#06b6d4] to-[#14b8a6] text-white">
              <div className="flex items-center gap-3">
                <FaMoneyCheckAlt className="text-2xl" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg truncate">
                    Cheques de Chequera{' '}
                    {chequera
                      ? `#${chequera.id} — ${chequera.descripcion}`
                      : ''}
                  </div>
                  {!!chequera && (
                    <div className="text-white/90 text-sm truncate">
                      {chequera?.cuenta?.banco?.nombre || '—'} •{' '}
                      {chequera?.cuenta?.nombre_cuenta || '—'} • Rango{' '}
                      {chequera.nro_desde}-{chequera.nro_hasta} • Próx:{' '}
                      {chequera.proximo_nro}
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25"
                >
                  Cerrar
                </button>
              </div>

              {/* Barra de uso del rango */}
              {chequera && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Uso del rango</span>
                    <span>
                      {chequera.uso.usados}/{chequera.uso.rango} ({usoPct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/90"
                      style={{
                        width: `${Math.min(100, Math.max(0, usoPct))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filtros + KPIs */}
            <div className="px-4 md:px-6 py-4 border-b bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <FaSearch className="text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setPage(1);
                      setQ(e.target.value);
                    }}
                    placeholder="Buscar por número / beneficiario / nota…"
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={estado}
                    onChange={(e) => {
                      setPage(1);
                      setEstado(e.target.value);
                    }}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value="">— Estado —</option>
                    {estados.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={fechaCampo}
                    onChange={(e) => {
                      setPage(1);
                      setFechaCampo(e.target.value);
                    }}
                    className="rounded-xl border px-3 py-2"
                  >
                    <option value="fecha_emision">Emisión</option>
                    <option value="fecha_vencimiento">Vencimiento</option>
                    <option value="fecha_cobro_prevista">Cobro previsto</option>
                    <option value="created_at">Creación</option>
                  </select>
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) => {
                      setPage(1);
                      setDesde(e.target.value);
                    }}
                    className="rounded-xl border px-3 py-2"
                  />
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) => {
                      setPage(1);
                      setHasta(e.target.value);
                    }}
                    className="rounded-xl border px-3 py-2"
                  />
                </div>
              </div>

              {/* KPIs */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {kpis.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl border bg-white px-3 py-2 text-center shadow-sm"
                  >
                    <div className="text-xs text-gray-500">{k.label}</div>
                    <div className="text-lg font-bold text-gray-800">
                      {k.value}
                    </div>
                    {k.sub && (
                      <div className="text-[11px] text-gray-500">{k.sub}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla con scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="min-w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
                    <tr className="text-left">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Beneficiario</th>
                      <th className="px-4 py-3">Emisión</th>
                      <th className="px-4 py-3">Vencimiento</th>
                      <th className="px-4 py-3">Cobro prev.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-gray-500"
                        >
                          Cargando…
                        </td>
                      </tr>
                    )}
                    {!loading && rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-10 text-center text-gray-500"
                        >
                          Sin cheques para esta chequera.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      rows.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 font-semibold">
                            #{r.numero}
                          </td>
                          <td className="px-4 py-3">
                            <Chip
                              text={r.tipo}
                              cls={
                                r.tipo === 'emitido'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-sky-100 text-sky-700'
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Chip text={r.estado} cls={chipEstado(r.estado)} />
                          </td>
                          <td className="px-4 py-3">{fmt(r.monto)}</td>
                          <td className="px-4 py-3">
                            {r.beneficiario_nombre || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.fecha_emision
                              ? new Date(r.fecha_emision).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.fecha_vencimiento
                              ? new Date(
                                  r.fecha_vencimiento
                                ).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {r.fecha_cobro_prevista
                              ? new Date(
                                  r.fecha_cobro_prevista
                                ).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer paginación */}
            <div className="px-4 md:px-6 py-4 border-t bg-white flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {meta
                  ? `Total: ${meta.total} • Página ${meta.page}/${meta.totalPages}`
                  : '—'}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!meta?.hasPrev || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl border text-gray-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  disabled={!meta?.hasNext || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-2 rounded-xl border text-gray-700 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
