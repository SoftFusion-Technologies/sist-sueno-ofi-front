import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  BarChart3,
  Filter,
  Calendar,
  RefreshCw,
  TrendingUp,
  FileDown
} from 'lucide-react';
import {
  getChequesResumenByProveedor,
  getChequesByProveedor
} from '../../../api/proveedores';

const cx = (...c) => c.filter(Boolean).join(' ');

// helpers
const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );
const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const hoy = () => new Date().toISOString().slice(0, 10);
const sumarDias = (d, n) => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const presetRanges = [
  { key: '7d', label: '7 días', from: sumarDias(hoy(), -6), to: hoy() },
  { key: '30d', label: '30 días', from: sumarDias(hoy(), -29), to: hoy() },
  { key: '90d', label: '90 días', from: sumarDias(hoy(), -89), to: hoy() },
  {
    key: 'mes',
    label: 'Este mes',
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    to: hoy()
  },
  {
    key: 'anio',
    label: 'Este año',
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    to: hoy()
  }
];

// estados visibles en KPIs
const ESTADOS = [
  'registrado',
  'en_cartera',
  'depositado',
  'acreditado',
  'aplicado_a_compra',
  'entregado',
  'rechazado',
  'anulado',
  'compensado'
];

export default function ProveedorChequesKPIModal({
  open,
  onClose,
  proveedorId,
  proveedorNombre,
  userId
}) {
  const [from, setFrom] = useState(presetRanges[1].from); // default 30d
  const [to, setTo] = useState(presetRanges[1].to);
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState(null); // {totales, porEstado, serie?}
  const [error, setError] = useState('');

  // Normaliza el JSON de /cheques/resumen a la forma interna del modal
  function normalizeResumenFromApi(api) {
    const porEstadoObj = {};
    ESTADOS.forEach((e) => (porEstadoObj[e] = { count: 0, monto: 0 }));

    (api?.porEstado || []).forEach((r) => {
      const e = r.estado;
      if (!porEstadoObj[e]) porEstadoObj[e] = { count: 0, monto: 0 };
      porEstadoObj[e].count = Number(r.cantidad || 0);
      porEstadoObj[e].monto = Number(r.monto || 0);
    });

    const totales = {
      total: Number(api?.totalCheques || 0),
      totalMonto: Number(api?.totalMonto || 0),
      ingresos: Number(porEstadoObj.acreditado?.monto || 0),
      egresos: Number(porEstadoObj.compensado?.monto || 0),
      neto:
        Number(porEstadoObj.acreditado?.monto || 0) -
        Number(porEstadoObj.compensado?.monto || 0)
    };

    return {
      totales,
      porEstado: porEstadoObj,
      porTipo: api?.porTipo || []
    };
  }

  // Fallback client-side si el endpoint /resumen no está
  const buildResumenFromList = (rows = []) => {
    const inRange = rows.filter((r) => {
      // usamos created_at como proxy (o fecha_emision si preferís)
      const d = r.fecha_emision || r.created_at || r.updated_at;
      if (!d) return true;
      const dd = new Date(d).toISOString().slice(0, 10);
      return (!from || dd >= from) && (!to || dd <= to);
    });

    const porEstado = {};
    ESTADOS.forEach((e) => (porEstado[e] = { count: 0, monto: 0 }));
    let totalMonto = 0;
    inRange.forEach((r) => {
      const e = r.estado || 'registrado';
      const m = Number(r.monto || 0);
      if (!porEstado[e]) porEstado[e] = { count: 0, monto: 0 };
      porEstado[e].count += 1;
      porEstado[e].monto += m;
      totalMonto += m;
    });
    const totales = {
      total: inRange.length,
      totalMonto,
      ingresos: porEstado.acreditado?.monto || 0,
      egresos: porEstado.compensado?.monto || 0, // aproximación
      neto:
        (porEstado.acreditado?.monto || 0) - (porEstado.compensado?.monto || 0)
    };
    return { totales, porEstado, data: inRange };
  };

  const fetchKPIs = async () => {
    if (!proveedorId) return;
    setLoading(true);
    setError('');
    try {
      // 1) intento resumen del backend
      try {
        const data = await getChequesResumenByProveedor(proveedorId, {
          from,
          to,
          usuario_log_id: userId
        });
          setResumen(normalizeResumenFromApi(data));
      } catch {
        // 2) fallback: levanto lista y calculo
        const list = await getChequesByProveedor(proveedorId, {
          page: 1,
          limit: 1000,
          orderBy: 'created_at',
          orderDir: 'DESC',
          usuario_log_id: userId
        });
        const rows = Array.isArray(list?.data)
          ? list.data
          : Array.isArray(list)
          ? list
          : [];
        setResumen(buildResumenFromList(rows));
      }
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchKPIs(); /* eslint-disable-next-line */
  }, [open]);
  useEffect(() => {
    if (open) fetchKPIs(); /* eslint-disable-next-line */
  }, [from, to]);

  const porEstado = resumen?.porEstado || {};
  const tot = resumen?.totales || {
    total: 0,
    totalMonto: 0,
    ingresos: 0,
    egresos: 0,
    neto: 0
  };

  // Export CSV simple (lo arma en cliente con lo que hay en memoria)
  const exportCSV = () => {
    const headers = ['Estado', 'Cantidad', 'Monto'];
    const lines = ESTADOS.map((e) => {
      const row = porEstado[e] || { count: 0, monto: 0 };
      return [e, row.count, row.monto].join(',');
    });
    const totalLine = ['TOTAL', tot.total, tot.totalMonto].join(',');
    const csv = [headers.join(','), ...lines, totalLine].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cheques_kpis_proveedor_${proveedorId}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* sheet */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="absolute inset-3 md:inset-6 xl:inset-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-[#0b0e0f] via-[#0c1112] to-[#0b0e0f] text-gray-100"
          >
            {/* header */}
            <div className="px-4 md:px-6 py-3 border-b border-white/10 bg-white/5 sticky top-0 z-10">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-2 text-emerald-300 text-sm px-2 py-1 rounded-full border border-emerald-900/50 bg-emerald-900/20">
                    <BarChart3 size={16} /> KPIs de Cheques
                  </span>
                  {proveedorNombre && (
                    <>
                      <span className="text-sm text-gray-300">de</span>
                      <span className="text-sm font-semibold truncate max-w-[30ch]">
                        {proveedorNombre}
                      </span>
                    </>
                  )}
                </div>

                {/* filtros */}
                <div className="w-full md:w-auto md:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <Calendar size={16} className="opacity-70" />
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="bg-transparent outline-none"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="bg-transparent outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {presetRanges.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setFrom(p.from);
                          setTo(p.to);
                        }}
                        className={cx(
                          'px-3 py-2 rounded-lg text-xs border',
                          from === p.from && to === p.to
                            ? 'bg-emerald-500/90 text-black border-emerald-400'
                            : 'bg-white/5 text-gray-200 border-white/10 hover:bg-white/10'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={fetchKPIs}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                    title="Actualizar"
                  >
                    <RefreshCw size={16} /> Actualizar
                  </button>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-black"
                    title="Exportar CSV"
                  >
                    <FileDown size={16} /> Exportar
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10"
                    title="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* body */}
            <div className="h-full overflow-y-auto p-4 md:p-6">
              {error && (
                <div className="mb-4 text-sm text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* tarjetas KPI */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
                <KpiCard title="Total cheques" value={tot.total} />
                <KpiCard title="Monto total" value={fmt(tot.totalMonto)} />
                <KpiCard
                  title="Acreditado"
                  value={fmt(porEstado.acreditado?.monto || 0)}
                />
                <KpiCard
                  title="Compensado"
                  value={fmt(porEstado.compensado?.monto || 0)}
                />
                <KpiCard title="Neto" value={fmt(tot.neto)} accent />
                <KpiCard
                  title="En cartera"
                  value={porEstado.en_cartera?.count || 0}
                />
              </div>

              {/* tabla por estado */}
              {/* tabla por estado con scroll vertical */}
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 border-b border-white/10 px-4 py-2 text-sm flex items-center gap-2">
                  <Filter size={16} /> Resumen por estado
                </div>

                {/* Wrapper con scroll vertical y horizontal (mobile) */}
                <div
                  className="
      max-h-[260px]           /* altura máxima visible */
      overflow-y-auto
      overflow-x-auto
      [-webkit-overflow-scrolling:touch]
    "
                >
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 sticky top-0 z-10">
                      <tr className="text-left">
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2">Cantidad</th>
                        <th className="px-4 py-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ESTADOS.map((e) => {
                        const r = porEstado[e] || { count: 0, monto: 0 };
                        return (
                          <tr key={e} className="border-t border-white/5">
                            <td className="px-4 py-2 capitalize">
                              {e.replaceAll('_', ' ')}
                            </td>
                            <td className="px-4 py-2">{r.count}</td>
                            <td className="px-4 py-2">{fmt(r.monto)}</td>
                          </tr>
                        );
                      })}
                      <tr className="border-t border-white/10 bg-white/5 font-semibold">
                        <td className="px-4 py-2">TOTAL</td>
                        <td className="px-4 py-2">{tot.total}</td>
                        <td className="px-4 py-2">{fmt(tot.totalMonto)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* hint */}
              <div className="mt-4 text-xs text-gray-400 flex items-center gap-2">
                <TrendingUp size={14} /> Los KPIs respetan el rango de fechas
                seleccionado.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function KpiCard({ title, value, accent = false }) {
  return (
    <div
      className={cx(
        'rounded-2xl p-4 border',
        accent
          ? 'bg-emerald-900/20 border-emerald-900/50'
          : 'bg-white/5 border-white/10'
      )}
    >
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {title}
      </div>
      <div
        className={cx(
          'mt-1 text-lg font-semibold',
          accent ? 'text-emerald-300' : 'text-gray-100'
        )}
      >
        {value}
      </div>
    </div>
  );
}
