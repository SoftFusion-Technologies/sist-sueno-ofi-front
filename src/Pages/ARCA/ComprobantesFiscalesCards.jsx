// src/Pages/Arca/ComprobantesFiscalesCards.jsx
import React, { useEffect, useMemo, useState } from 'react';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';
import { FaPlus, FaSearch } from 'react-icons/fa';

import ComprobanteFiscalCard from '../../Components/ARCA/ComprobanteFiscalCard';
import ComprobanteFiscalFormModal from '../../Components/ARCA/ComprobanteFiscalFormModal';
import ConfirmDialog from '../../Components/Common/ConfirmDialog';

import {
  listEmpresas,
  listPuntosVenta,
  listComprobantesFiscales,
  createComprobanteFiscalManual,
  updateComprobanteFiscal,
  deleteComprobanteFiscal
} from '../../api/arca';

import {
  showErrorSwal,
  showWarnSwal,
  showSuccessSwal,
  showConfirmSwal
} from '../../ui/swal';

const useDebounce = (value, ms = 400) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeb(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return deb;
};

export default function ComprobantesFiscalesCards() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [empresas, setEmpresas] = useState([]);
  const [puntosVenta, setPuntosVenta] = useState([]);

  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [pvFiltro, setPvFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos'); // todos | pendiente | aprobado | rechazado
  const [tipoFiltro, setTipoFiltro] = useState('todos');

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [caeFiltro, setCaeFiltro] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const empresasMap = useMemo(() => {
    const m = {};
    for (const e of empresas) {
      m[e.id] = `${e.razon_social} (${e.cuit})`;
    }
    return m;
  }, [empresas]);

  const puntosVentaMap = useMemo(() => {
    const m = {};
    for (const pv of puntosVenta) {
      const desc = pv.descripcion
        ? `PV #${pv.numero} - ${pv.descripcion}`
        : `PV #${pv.numero}`;
      m[pv.id] = desc;
    }
    return m;
  }, [puntosVenta]);

  const fetchCombos = async () => {
    try {
      const [empResp, pvResp] = await Promise.all([
        listEmpresas({ estado: 'activa' }),
        listPuntosVenta({ activo: '1' })
      ]);
      setEmpresas(Array.isArray(empResp) ? empResp : empResp?.data || []);
      setPuntosVenta(Array.isArray(pvResp) ? pvResp : pvResp?.data || []);
    } catch (err) {
      console.error('Error cargando combos ARCA:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (empresaFiltro !== 'todas') params.empresa_id = empresaFiltro;
      if (pvFiltro !== 'todos') params.punto_venta_id = pvFiltro;
      if (estadoFiltro !== 'todos') params.estado = estadoFiltro;
      if (tipoFiltro !== 'todos') params.tipo_comprobante = tipoFiltro;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (caeFiltro) params.cae = caeFiltro;
      if (dq) params.q = dq;

      const data = await listComprobantesFiscales(params);
      setRows(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error(err);
      await showErrorSwal({
        title: 'Error',
        text: 'Error cargando comprobantes fiscales.',
        tips: ['Revisá tu conexión o reintentá más tarde.']
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  useEffect(() => {
    fetchData(); // eslint-disable-next-line
  }, [
    empresaFiltro,
    pvFiltro,
    estadoFiltro,
    tipoFiltro,
    fechaDesde,
    fechaHasta,
    caeFiltro,
    dq
  ]);

  const onNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const onSubmit = async (payload) => {
    try {
      if (editing?.id) {
        await updateComprobanteFiscal(editing.id, payload);
        await showSuccessSwal({
          title: 'Guardado',
          text: 'Comprobante fiscal actualizado'
        });
      } else {
        await createComprobanteFiscalManual(payload);
        await showSuccessSwal({
          title: 'Creado',
          text: 'Comprobante fiscal creado'
        });
      }
      await fetchData();
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      const { code, mensajeError, tips } = err || {};

      if (code === 'MODEL_VALIDATION' || code === 'BAD_REQUEST') {
        return showWarnSwal({
          title: 'Datos inválidos',
          text: mensajeError || 'Revisá los campos del formulario.',
          tips
        });
      }

      if (code === 'NETWORK') {
        return showErrorSwal({
          title: 'Sin conexión',
          text: mensajeError,
          tips
        });
      }

      if (code === 'DUPLICATE') {
        return showErrorSwal({
          title: 'Duplicado',
          text:
            mensajeError ||
            'Ya existe un comprobante con ese número para la misma empresa / PV / tipo.',
          tips
        });
      }

      return showErrorSwal({
        title: 'No se pudo guardar',
        text: mensajeError || 'Ocurrió un error inesperado',
        tips
      });
    }
  };

  const onAskDelete = (item) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    const item = toDelete;
    setConfirmOpen(false);

    const res = await showConfirmSwal({
      title: '¿Eliminar comprobante fiscal?',
      text: `Se eliminará el comprobante ${item?.tipo_comprobante || ''} ${
        item?.letra || ''
      } #${
        item?.numero_comprobante
      }. Solo es posible si está pendiente y sin CAE.`,
      confirmText: 'Sí, eliminar'
    });
    if (!res.isConfirmed) return;

    try {
      await deleteComprobanteFiscal(item.id);
      setRows((r) => r.filter((x) => x.id !== item.id));
      await showSuccessSwal({
        title: 'Eliminado',
        text: 'Comprobante fiscal eliminado correctamente'
      });
    } catch (err) {
      const { mensajeError, tips } = err || {};
      await showErrorSwal({
        title: 'No se pudo eliminar',
        text:
          mensajeError ||
          'Solo se pueden eliminar comprobantes pendientes y sin CAE.',
        tips
      });
    } finally {
      setToDelete(null);
    }
  };

  const puntosFiltradosPorEmpresa = useMemo(() => {
    if (empresaFiltro === 'todas') return puntosVenta;
    return puntosVenta.filter(
      (pv) => String(pv.empresa_id) === String(empresaFiltro)
    );
  }, [empresaFiltro, puntosVenta]);

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#02141b] to-[#022c22]">
          <ParticlesBackground />
          <ButtonBack />

          {/* Header */}
          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl titulo uppercase font-bold text-white mb-3 drop-shadow-md"
            >
              Comprobantes Fiscales
            </motion.h1>
            <p className="text-white/80 text-sm sm:text-base">
              Monitoreá facturas, notas de crédito y comprobantes vinculados a
              ARCA/AFIP.
            </p>
          </div>

          {/* Filtros */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="flex flex-col gap-4">
              {/* Búsqueda principal */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar por CAE o número de comprobante…"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onNew}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 text-sm shadow-lg"
                  >
                    <FaPlus /> Nuevo (Manual)
                  </button>
                </div>
              </div>

              {/* Filtros avanzados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={empresaFiltro}
                    onChange={(e) => {
                      setEmpresaFiltro(e.target.value);
                      setPvFiltro('todos');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="todas">Todas las empresas</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.razon_social} ({e.cuit})
                      </option>
                    ))}
                  </select>

                  <select
                    value={pvFiltro}
                    onChange={(e) => setPvFiltro(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="todos">Todos los PV</option>
                    {puntosFiltradosPorEmpresa.map((pv) => (
                      <option key={pv.id} value={pv.id}>
                        PV #{pv.numero}
                        {pv.descripcion ? ` - ${pv.descripcion}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="aprobado">Aprobados</option>
                    <option value="rechazado">Rechazados</option>
                  </select>

                  <select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="1">01 - Factura A</option>
                    <option value="6">06 - Factura B</option>
                    <option value="11">11 - Factura C</option>
                    <option value="3">03 - NC A</option>
                    <option value="8">08 - NC B</option>
                    <option value="13">13 - NC C</option>
                    <option value="2">02 - ND A</option>
                    <option value="7">07 - ND B</option>
                    <option value="12">12 - ND C</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    value={caeFiltro}
                    onChange={(e) => setCaeFiltro(e.target.value)}
                    placeholder="Filtrar por CAE…"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-white/20 bg-white/90 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid de cards */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-10 w-10 border-4 border-white/50 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center text-white/80 py-24 text-sm">
                No hay comprobantes con esos filtros.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {rows.map((it) => (
                  <ComprobanteFiscalCard
                    key={it.id}
                    item={it}
                    onEdit={onEdit}
                    onDelete={onAskDelete}
                    empresaLabel={empresasMap[it.empresa_id]}
                    puntoVentaLabel={puntosVentaMap[it.punto_venta_id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal alta/edición manual */}
      <ComprobanteFiscalFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        initial={editing}
        empresas={empresas}
        puntosVenta={puntosVenta}
      />

      {/* Confirm eliminar */}
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar comprobante fiscal"
        message={
          toDelete
            ? `¿Seguro que deseás eliminar el comprobante ${
                toDelete.tipo_comprobante || ''
              } ${toDelete.letra || ''} #${toDelete.numero_comprobante}?`
            : ''
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
