// src/Pages/Bancos/MovimientosCards.jsx
import React, { useEffect, useMemo, useState } from 'react';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch, FaDownload } from 'react-icons/fa';

import { listBancos } from '../../api/bancos';
import { listBancoCuentas } from '../../api/bancoCuentas';
import {
  listBancoMovimientos,
  createBancoMovimiento,
  updateBancoMovimiento,
  deleteBancoMovimiento,
  exportMovimientosCSV,
  getSaldoCuenta,
  getResumenCuenta
} from '../../api/bancosmovimientos';

import BankMovementCard from '../../Components/Bancos/BankMovementCard';
import BankMovementFormModal from '../../Components/Bancos/BankMovementFormModal';
import BankMovementViewModal from '../../Components/Bancos/BankMovementViewModal';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';

import AccountKPICards from '../../Components/Bancos/AccountKPICards';
import AccountSummaryChart from '../../Components/Bancos/AccountSummaryChart';

const useDebounce = (value, ms = 400) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
};

export default function MovimientosCards() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bancos, setBancos] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  const [bancoId, setBancoId] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [tipo, setTipo] = useState('todos'); // todos|debito|credito
  const [refTipo, setRefTipo] = useState(''); // opcional
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [inclSaldo, setInclSaldo] = useState(true);

  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const limit = 18;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [kpiLoading, setKpiLoading] = useState(false);
  const [group, setGroup] = useState('day'); // 'day' | 'month' para el resumen
  const [kpi, setKpi] = useState(null); // { saldoActual }
  const [resumen, setResumen] = useState(null); // { totales, series, periodo }

  useEffect(() => {
    (async () => {
      const bs = await listBancos({
        activo: '1',
        orderBy: 'nombre',
        orderDir: 'ASC',
        limit: 500
      });
      const arrB = Array.isArray(bs) ? bs : bs.data || [];
      setBancos(arrB);
    })().catch(() => {});
  }, []);

  // Cuando NO hay banco seleccionado, traemos algunas cuentas activas globales y seteamos la primera
  useEffect(() => {
    if (!bancoId) {
      (async () => {
        const cs = await listBancoCuentas({
          activo: '1',
          limit: 50,
          orderBy: 'nombre_cuenta',
          orderDir: 'ASC'
        });
        const arr = Array.isArray(cs) ? cs : cs.data || [];
        setCuentas(arr);
        if (!cuentaId && arr[0]) setCuentaId(String(arr[-1].id));
      })().catch(() => {});
      return;
    }
    (async () => {
      const cs = await listBancoCuentas({
        banco_id: bancoId,
        activo: '1',
        limit: 500,
        orderBy: 'nombre_cuenta',
        orderDir: 'ASC'
      });
      const arr = Array.isArray(cs) ? cs : cs.data || [];
      setCuentas(arr);
      if (!cuentaId && arr[0]) setCuentaId(String(arr[0].id));
    })().catch(() => {});
  }, [bancoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        q: dq || '',
        orderBy: 'fecha',
        orderDir: 'DESC',
        includeSaldoAcumulado: inclSaldo ? '1' : undefined
      };
      if (bancoId) params.banco_id = bancoId;
      if (cuentaId) params.banco_cuenta_id = cuentaId;
      if (from) params.fecha_from = from;
      if (to) params.fecha_to = to;
      if (refTipo) params.referencia_tipo = refTipo;

      const data = await listBancoMovimientos(params);
      if (Array.isArray(data)) {
        // SIN meta
        const filtered = data.filter((r) =>
          tipo === 'debito'
            ? Number(r.debito) > 0
            : tipo === 'credito'
            ? Number(r.credito) > 0
            : true
        );
        setRows(filtered);
        setMeta(null);
      } else {
        const arr = (data.data || []).filter((r) =>
          tipo === 'debito'
            ? Number(r.debito) > 0
            : tipo === 'credito'
            ? Number(r.credito) > 0
            : true
        );
        setRows(arr);
        setMeta(data.meta || null);
      }
    } catch (e) {
      console.error(e);
      alert('Error cargando movimientos bancarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, [dq, bancoId, cuentaId, from, to, refTipo, tipo, inclSaldo, page]);

  const onNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const onEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };
  const onSubmit = async (payload) => {
    if (editing?.id) {
      await updateBancoMovimiento(editing.id, payload);
    } else {
      await createBancoMovimiento(payload);
    }
    await fetchData();
  };

  const onAskDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };
  const onConfirmDelete = async () => {
    try {
      await deleteBancoMovimiento(toDelete.id);
      setRows((r) => r.filter((x) => x.id !== toDelete.id));
    } catch (e) {
      console.error(e);
      alert('No se pudo eliminar (puede estar vinculado a un cheque)');
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const bancoNombre = (id) =>
    bancos.find((b) => Number(b.id) === Number(id))?.nombre || `Banco #${id}`;
  const cuentaNombre = (id) =>
    cuentas.find((c) => Number(c.id) === Number(id))?.nombre_cuenta ||
    `Cuenta #${id}`;

  // 🔁 Cargar KPIs (saldo + resumen) cuando cambia cuenta/fechas/grupo
  const loadKPIs = async () => {
    const cid = cuentaId || cuentas[0]?.id || '';
    if (!cid) {
      setKpi(null);
      setResumen(null);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const toDate = to || today; // por defecto: hoy
    const fromDate = from || '1900-01-01'; // por defecto: histórico

    try {
      setKpiLoading(true);
      const [saldo, res] = await Promise.all([
        getSaldoCuenta(cid, toDate),
        getResumenCuenta(cid, fromDate, toDate, group)
      ]);
      setKpi({ saldoActual: saldo.saldo });
      setResumen(res);
    } catch (e) {
      console.error(e);
      setKpi(null);
      setResumen(null);
    } finally {
      setKpiLoading(false);
    }
  };

  // Llamar KPIs cuando cambien dependencias
  useEffect(() => {
    if (cuentaId) loadKPIs();
    // si no hay cuenta aún, no intentes cargar
    // eslint-disable-next-line
  }, [cuentaId, from, to, group]);

  const Pager = useMemo(() => {
    if (!meta) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!meta.hasPrev}
          className="px-3 py-2 rounded-xl border border-white/30 bg-white/70 hover:bg-white disabled:opacity-50"
        >
          ← Anterior
        </button>
        <span className="text-white/90 text-sm">
          Página {meta.page} / {meta.totalPages}
        </span>
        <button
          onClick={() => setPage((p) => (meta.hasNext ? p + 1 : p))}
          disabled={!meta.hasNext}
          className="px-3 py-2 rounded-xl border border-white/30 bg-white/70 hover:bg-white disabled:opacity-50"
        >
          Siguiente →
        </button>
      </div>
    );
  }, [meta]);

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        <div className="min-h-screen bg-gradient-to-b from-[#001219] via-[#003049] to-[#005f73]">
          <ParticlesBackground />
          <ButtonBack />

          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white mb-3 drop-shadow-md"
            >
              Movimientos Bancarios
            </motion.h1>
            <p className="text-white/80">
              Gestioná créditos y débitos por cuenta.
            </p>
          </div>

          {/* Filtros */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="relative lg:col-span-3">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Buscar descripción…"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <select
                value={bancoId}
                onChange={(e) => {
                  setPage(1);
                  setBancoId(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 lg:col-span-2"
              >
                <option value="">Banco (todos)</option>
                {bancos.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>

              <select
                value={cuentaId}
                onChange={(e) => {
                  setPage(1);
                  setCuentaId(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 lg:col-span-2"
              >
                <option value="">Cuenta (todas)</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_cuenta}
                  </option>
                ))}
              </select>

              <select
                value={tipo}
                onChange={(e) => {
                  setPage(1);
                  setTipo(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 lg:col-span-2"
              >
                <option value="todos">Tipo (todos)</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
              </select>

              <select
                value={refTipo}
                onChange={(e) => {
                  setPage(1);
                  setRefTipo(e.target.value);
                }}
                className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 lg:col-span-1"
              >
                <option value="">Ref (todas)</option>
                <option value="cheque">cheque</option>
                <option value="transferencia">transferencia</option>
                <option value="venta">venta</option>
                <option value="compra">compra</option>
                <option value="pago">pago</option>
                <option value="deposito">deposito</option>
                <option value="conciliacion">conciliacion</option>
                <option value="otro">otro</option>
              </select>

              <div className="flex items-center gap-2 lg:col-span-2">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setPage(1);
                    setFrom(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                />
                <span className="text-white/80">→</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setPage(1);
                    setTo(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-white/90 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={inclSaldo}
                  onChange={(e) => setInclSaldo(e.target.checked)}
                />
                Incluir saldo acumulado
              </label>

              <div className="flex items-center gap-2 lg:col-span-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
                >
                  <FaPlus /> Nuevo Movimiento
                </button>
                {/* <button
                  onClick={() =>
                    exportMovimientosCSV({
                      banco_cuenta_id: cuentaId || cuentas[0]?.id || '',
                      from: from || '1900-01-01',
                      to: to || '9999-12-31'
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60"
                  disabled={!cuentaId && cuentas.length === 0}
                >
                  <FaDownload /> Export CSV
                </button> */}
              </div>
            </div>
          </div>

          {/* 🔧 Selector de agrupación para el gráfico */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-white/90 text-sm">Agrupar por:</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="day">Día</option>
                <option value="month">Mes</option>
              </select>
              <button
                onClick={loadKPIs}
                className="ml-auto px-3 py-2 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30"
              >
                Actualizar KPIs
              </button>
            </div>
          </div>

          {/* 📊 KPIs + Chart (solo si hay cuenta seleccionada o disponible) */}
          {(cuentaId || cuentas.length > 0) && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {!cuentaId && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                  <div className="bg-white/90 border border-white/20 rounded-2xl p-4 text-gray-700">
                    Seleccioná un <b>Banco</b> y una <b>Cuenta</b> para ver el
                    resumen y el saldo. (O dejalo en blanco: se tomará la
                    primera cuenta activa disponible.)
                  </div>
                </div>
              )}

              {(cuentaId || cuentas.length > 0) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {kpiLoading ? (
                    <div className="bg-white/90 border border-white/20 rounded-2xl p-6 mt-6">
                      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="h-20 bg-gray-100 rounded-xl" />
                        <div className="h-20 bg-gray-100 rounded-xl" />
                        <div className="h-20 bg-gray-100 rounded-xl" />
                        <div className="h-20 bg-gray-100 rounded-xl" />
                      </div>
                      <div className="h-72 bg-gray-100 rounded-xl mt-6" />
                    </div>
                  ) : (
                    <>
                      <AccountKPICards
                        cuentaNombre={cuentaNombre(cuentaId || cuentas[0]?.id)}
                        periodo={resumen?.periodo}
                        totales={resumen?.totales}
                        saldoActual={kpi?.saldoActual}
                      />
                      <AccountSummaryChart
                        series={resumen?.series}
                        group={group}
                      />
                    </>
                  )}
                </div>
              )}
            
            </div>
          )}
          {/* Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-10 w-10 border-4 border-white/50 border-t-teal-400 rounded-full animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center text-white/80 py-24">
                No hay movimientos con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rows.map((it) => (
                  <BankMovementCard
                    key={it.id}
                    item={it}
                    bancoNombre={bancoNombre(it.cuenta?.banco_id ?? bancoId)}
                    cuentaNombre={cuentaNombre(it.banco_cuenta_id)}
                    onView={(row) => {
                      setViewing(row);
                      setViewOpen(true);
                    }}
                    onEdit={(row) => {
                      setEditing(row);
                      setModalOpen(true);
                    }}
                    onDelete={(row) => onAskDelete(row)}
                  />
                ))}
              </div>
            )}

            {Pager}
          </div>
        </div>
      </section>

      {/* Modales */}
      <BankMovementFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
        initial={editing}
      />

      <BankMovementViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewing}
        bancoNombre={bancoNombre(viewing?.cuenta?.banco_id ?? bancoId)}
        cuentaNombre={cuentaNombre(viewing?.banco_cuenta_id)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar movimiento"
        message={
          toDelete
            ? `¿Seguro que desea eliminar el movimiento #${toDelete.id}?`
            : ''
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
