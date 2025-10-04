// src/Pages/Bancos/CuentasCards.jsx
import React, { useEffect, useMemo, useState } from 'react';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch } from 'react-icons/fa';

import BankAccountCard from '../../Components/Bancos/BankAccountCard';
import BankAccountFormModal from '../../Components/Bancos/BankAccountFormModal';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';
import BankAccountViewModal from '../../Components/Bancos/BankAccountViewModal';

import { listBancos } from '../../api/bancos';
import {
  listBancoCuentas,
  createBancoCuenta,
  updateBancoCuenta,
  deleteBancoCuenta
} from '../../api/bancoCuentas';

import {
  showErrorSwal,
  showWarnSwal,
  showSuccessSwal,
  showConfirmSwal,showApiErrorSwal
} from '../../ui/swal';


const useDebounce = (value, ms = 400) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
};

export default function CuentasCards() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bancos, setBancos] = useState([]);
  const [bancoId, setBancoId] = useState(''); // filtro banco
  const [moneda, setMoneda] = useState(''); // ARS|USD|EUR|OTRA
  const [estado, setEstado] = useState('todos'); // todos|activos|inactivos

  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const limit = 18;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // const [confirmOpen, setConfirmOpen] = useState(false);
  // const [toDelete, setToDelete] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  // bancos para filtros
  useEffect(() => {
    listBancos({ activo: '1', orderBy: 'nombre', orderDir: 'ASC', limit: 500 })
      .then((data) => setBancos(Array.isArray(data) ? data : data.data || []))
      .catch(() => setBancos([]));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        q: dq || '',
        orderBy: 'nombre_cuenta',
        orderDir: 'ASC'
      };
      if (bancoId) params.banco_id = bancoId;
      if (moneda) params.moneda = moneda;
      if (estado === 'activos') params.activo = '1';
      if (estado === 'inactivos') params.activo = '0';

      const data = await listBancoCuentas(params);
      if (Array.isArray(data)) {
        setRows(data);
        setMeta(null);
      } else {
        setRows(data.data || []);
        setMeta(data.meta || null);
      }
    } catch (e) {
      console.error(e);
      alert('Error cargando cuentas bancarias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, [dq, bancoId, moneda, estado, page]);

  const onNew = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const onEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };
  const onSubmit = async (form) => {
    try {
      if (editing?.id) {
        await updateBancoCuenta(editing.id, form);
        await showSuccessSwal(
          'Cuenta actualizada',
          'Los cambios se guardaron correctamente.'
        );
      } else {
        await createBancoCuenta(form);
        await showSuccessSwal('Cuenta creada', 'Se creó la cuenta bancaria.');
      }
      await fetchData();
      setEditing(null);
    } catch (e) {
      // gracias al interceptor, `e` ya viene normalizado: { ok:false, code, mensajeError, tips?, details? }
      if (e?.code === 'DUPLICATE' || e?.code === 'CONFLICT') {
        await showWarnSwal(
          'Dato duplicado',
          e.mensajeError || 'La cuenta ya existe.'
        );
      } else if (e?.code) {
        await showErrorSwal('Error', e.mensajeError || 'No se pudo guardar.');
      } else {
        await showErrorSwal('Error', 'No se pudo conectar con el servidor.');
      }
    }
  };

  // TOGGLE ACTIVO
  const onToggleActivo = async (item) => {
    try {
      await updateBancoCuenta(item.id, { activo: !item.activo });
      setRows((r) =>
        r.map((x) => (x.id === item.id ? { ...x, activo: !x.activo } : x))
      );
    } catch (e) {
      await showErrorSwal(
        'No se pudo actualizar',
        e?.mensajeError || 'Intente nuevamente.'
      );
    }
  };

  // ELIMINAR (con confirmación y fallback a desactivar si hay dependencias)
  const onAskDelete = async (item) => {
    const ok = await showConfirmSwal(
      'Eliminar cuenta bancaria',
      `¿Seguro que desea eliminar "${item.nombre_cuenta}"?`
    );
    if (!ok) return;

    try {
      await deleteBancoCuenta(item.id); // intento de eliminación dura
      setRows((r) => r.filter((x) => x.id !== item.id));
      await showSuccessSwal(
        'Cuenta eliminada',
        'La cuenta bancaria fue eliminada.'
      );
    } catch (e) {
      // Si hay dependencias, el backend devuelve 409 con codes HAS_MOVEMENTS / HAS_CHEQUERAS
      if (e?.code === 'HAS_MOVEMENTS' || e?.code === 'HAS_CHEQUERAS') {
        const desc = e?.mensajeError || 'La cuenta posee dependencias.';
        const okForzar = await showConfirmSwal(
          'No se puede eliminar',
          `${desc}\n\n¿Desea DESACTIVARLA de todas formas?`
        );
        if (!okForzar) return;

        try {
          await deleteBancoCuenta(item.id, { forzar: 1 }); // desactivar
          // reflejar inactivo en la grilla (no la quitamos)
          setRows((r) =>
            r.map((x) => (x.id === item.id ? { ...x, activo: false } : x))
          );
          await showSuccessSwal(
            'Cuenta desactivada',
            'La cuenta fue desactivada correctamente.'
          );
        } catch (e2) {
          await showErrorSwal(
            'No se pudo desactivar',
            e2?.mensajeError || 'Intente nuevamente.'
          );
        }
      } else if (e?.code) {
        await showErrorSwal('Error', e.mensajeError || 'No se pudo eliminar.');
      } else {
        await showErrorSwal('Error', 'No se pudo conectar con el servidor.');
      }
    }
  };

  // map banco_id -> nombre (para mostrar en card)
  const nombreBanco = (id) =>
    bancos.find((b) => Number(b.id) === Number(id))?.nombre || `Banco #${id}`;

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
              Cuentas Bancarias
            </motion.h1>
            <p className="text-white/80">Administrá cuentas bancarias.</p>
          </div>

          {/* Filtros / acciones */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => {
                    setPage(1);
                    setQ(e.target.value);
                  }}
                  placeholder="Buscar por nombre, nro de cuenta, CBU, alias…"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bancoId}
                  onChange={(e) => {
                    setPage(1);
                    setBancoId(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Banco (todos)</option>
                  {bancos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={moneda}
                  onChange={(e) => {
                    setPage(1);
                    setMoneda(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Moneda (todas)</option>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="OTRA">OTRA</option>
                </select>

                <select
                  value={estado}
                  onChange={(e) => {
                    setPage(1);
                    setEstado(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>

                <button
                  onClick={onNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
                >
                  <FaPlus /> Nueva Cuenta
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-10 w-10 border-4 border-white/50 border-t-teal-400 rounded-full animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center text-white/80 py-24">
                No hay cuentas con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rows.map((it) => (
                  <BankAccountCard
                    key={it.id}
                    item={it}
                    bancoNombre={nombreBanco(it.banco_id)}
                    onView={(row) => {
                      setViewing(row);
                      setViewOpen(true);
                    }}
                    onEdit={(row) => onEdit(row)}
                    onToggleActivo={onToggleActivo}
                    onDelete={(row) => onAskDelete(row)} // ✅ solo esto
                  />
                ))}
              </div>
            )}

            {Pager}
          </div>
        </div>
      </section>

      {/* Modales */}
      <BankAccountFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={onSubmit}
        initial={editing}
      />

      <BankAccountViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        data={viewing}
        bancoNombre={viewing ? nombreBanco(viewing.banco_id) : ''}
      />

      {/* <ConfirmDialog 
      //   open={confirmOpen}
      //   title="Eliminar cuenta bancaria"
      //   message={
      //     toDelete
      //       ? `¿Seguro que desea eliminar "${toDelete.nombre_cuenta}"?`
      //       : ''
      //   }
      //   onCancel={() => setConfirmOpen(false)}
      //   onConfirm={async () => {
      //     await deleteBancoCuenta(toDelete.id);
      //     setRows((r) => r.filter((x) => x.id !== toDelete.id));
      //     setConfirmOpen(false);
      //     setToDelete(null);
      //   }}
      // />
      */}
    </>
  );
}
