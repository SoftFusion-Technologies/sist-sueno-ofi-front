/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 24 / 11 / 2025
 * Versión: 1.0
 *
 * Descripción:
 * Página de listado de Órdenes de Compra.
 * Tabla moderna + filtros + alta/edición vía modal vítreo.
 *
 * Tema: Compras - Órdenes de Compra
 * Capa: Frontend (Pages)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  RefreshCcw,
  Filter,
  Search,
  Edit3,
  Trash2,
  FileText as FileTextIcon
} from 'lucide-react';

import NavbarStaff from '../Dash/NavbarStaff';
import ButtonBack from '../../Components/ButtonBack';
import ParticlesBackground from '../../Components/ParticlesBackground';
import { useAuth } from '../../AuthContext';
import http from '../../api/http';
import OrdenCompraFormModal from '../../Components/Compras/OrdenCompraFormModal';
import OrdenCompraDetalleDrawer from '../../Components/Compras/OrdenCompraDetalleDrawer';
import Swal from 'sweetalert2';

const ESTADOS_OC = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'PENDIENTE', label: 'Pendiente Aprobación' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
  { value: 'CERRADA', label: 'Cerrada' }
];

const ESTADO_BADGE = {
  BORRADOR:
    'bg-slate-500/20 text-slate-100 border border-slate-400/40 shadow-inner',
  PENDIENTE:
    'bg-amber-500/10 text-amber-200 border border-amber-400/40 shadow-inner',
  APROBADA:
    'bg-emerald-500/10 text-emerald-200 border border-emerald-400/40 shadow-inner',
  RECHAZADA:
    'bg-rose-500/10 text-rose-200 border border-rose-400/40 shadow-inner',
  CERRADA: 'bg-gray-500/20 text-gray-200 border border-gray-400/40 shadow-inner'
};

const THEME = {
  bg: 'bg-gradient-to-b from-[#041f1a] via-[#064e3b] to-[#0b3b2f]'
};

const LIMIT_DEFAULT = 10;

const OrdenesCompraListado = () => {
  const { userLevel } = useAuth();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(LIMIT_DEFAULT);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: LIMIT_DEFAULT
  });

  const [filtros, setFiltros] = useState({
    q: '',
    estado: 'TODOS'
  });

  const [reloadFlag, setReloadFlag] = useState(0);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
      }),
    []
  );

  const handleVerDetalle = (oc) => {
    if (!oc?.id) return;
    setDetalleId(oc.id);
    setDetalleOpen(true);
  };

  const puedeGestionar = useMemo(() => {
    const nivel = String(userLevel || '').toLowerCase();
    return nivel === 'socio' || nivel === 'supervisor';
  }, [userLevel]);

  // =====================
  // Helpers visuales
  // =====================
  const getProveedorNombre = (oc) =>
    oc.proveedor_razon_social ||
    oc.proveedor_nombre ||
    oc.proveedor?.razon_social ||
    oc.proveedor?.nombre ||
    '-';

  const getLocalNombre = (oc) =>
    oc.local_nombre || oc.local?.nombre || oc.sucursal || '-';

  const getFechaEmision = (oc) => {
    const raw =
      oc.fecha_emision || oc.fecha || oc.created_at || oc.fecha_creacion;
    if (!raw) return '-';
    try {
      return new Date(raw).toLocaleDateString('es-AR');
    } catch {
      return String(raw).slice(0, 10);
    }
  };

  const getTotalEstimado = (oc) => {
    const v =
      oc.total_estimado ??
      oc.monto_estimado ??
      oc.total ??
      oc.importe_estimado ??
      0;
    return currencyFormatter.format(Number(v) || 0);
  };

  const getEstadoBadgeClass = (estadoRaw) => {
    const key = String(estadoRaw || 'BORRADOR').toUpperCase();
    return (
      ESTADO_BADGE[key] ||
      'bg-slate-600/30 text-slate-100 border border-slate-400/40'
    );
  };

  // =====================
  // Fetch principal
  // =====================
  useEffect(() => {
    let active = true;

    const fetchOrdenes = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const params = {
          page,
          limit
          // Adaptá nombres de filtros según tu backend:
          // Por ejemplo, OBRS_OrdenesCompra_CTS podría esperar "q" y "estado"
        };

        if (filtros.q?.trim()) {
          params.q = filtros.q.trim();
        }
        if (filtros.estado && filtros.estado !== 'TODOS') {
          params.estado = filtros.estado;
        }

        const resp = await http.get('/ordenes-compra', { params });

        // Estructura flexible: { data, meta } o { rows, meta }
        const payload = resp.data || {};
        const rows = payload.data || payload.rows || [];
        const metaResp = payload.meta ||
          payload.pagination || {
            total: Array.isArray(rows) ? rows.length : 0,
            page,
            limit
          };

        if (!active) return;
        setOrdenes(Array.isArray(rows) ? rows : []);
        setMeta({
          total: Number(metaResp.total ?? rows.length ?? 0),
          page: Number(metaResp.page ?? page),
          limit: Number(metaResp.limit ?? limit)
        });
      } catch (err) {
        if (!active) return;
        console.error('Error cargando órdenes de compra', err);
        const msg =
          err?.mensajeError ||
          err?.message ||
          'No se pudieron cargar las órdenes de compra.';
        setErrorMsg(msg);
      } finally {
        active && setLoading(false);
      }
    };

    fetchOrdenes();
    return () => {
      active = false;
    };
  }, [page, limit, filtros.q, filtros.estado, reloadFlag]);

  // =====================
  // Acciones
  // =====================
  const handleBuscarChange = (e) => {
    setFiltros((f) => ({
      ...f,
      q: e.target.value
    }));
    setPage(1);
  };

  const handleEstadoChangeFiltro = (e) => {
    setFiltros((f) => ({ ...f, estado: e.target.value }));
    setPage(1);
  };

  const handleRefrescar = () => {
    setReloadFlag((f) => f + 1);
  };

  const handleNueva = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEditar = (oc) => {
    setEditing(oc);
    setModalOpen(true);
  };
  const handleEliminar = async (oc) => {
    if (!oc?.id) return;

    try {
      const result = await Swal.fire({
        title: `¿Eliminar la Orden de Compra #${oc.numero_interno || oc.id}?`,
        html: '<small>Esta acción <b>no se puede deshacer</b>.</small>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        focusCancel: true
      });

      if (!result.isConfirmed) return;

      await http.delete(`/ordenes-compra/${oc.id}`);

      setOrdenes((prev) => prev.filter((x) => x.id !== oc.id));
      setMeta((m) => ({
        ...m,
        total: Math.max(0, (m.total || 1) - 1)
      }));

      await Swal.fire({
        icon: 'success',
        title: 'Orden eliminada',
        text: `La Orden de Compra #${
          oc.numero_interno || oc.id
        } fue eliminada correctamente.`,
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);

      const backendMsg =
        // 👇 tu caso: error viene plano { ok:false, error:'...' }
        err?.error ||
        err?.mensajeError ||
        // 👇 por si a veces viene como error de Axios
        err?.response?.data?.error ||
        err?.response?.data?.mensajeError ||
        err?.message ||
        'No se pudo eliminar la orden de compra.';

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: backendMsg
      });
    }
  };

  const handleSubmitModal = async (form) => {
    // form viene desde OrdenCompraFormModal
    if (editing?.id) {
      // Update borrador
      const resp = await http.put(`/ordenes-compra/${editing.id}`, form);
      // Intentar refrescar en memoria sin pegar de nuevo
      const updated = resp.data?.data || resp.data || null;
      if (updated && updated.id) {
        setOrdenes((prev) =>
          prev.map((oc) => (oc.id === updated.id ? { ...oc, ...updated } : oc))
        );

        // cierro modal y rehidro desde backend
        setModalOpen(false);
        setReloadFlag((f) => f + 1);
      } else {
        // fallback: refetch
        setReloadFlag((f) => f + 1);
      }
    } else {
      // Crear nuevo borrador
      const resp = await http.post('/ordenes-compra', form);
      const nueva = resp.data?.data || resp.data || null;
      if (nueva && nueva.id) {
        setOrdenes((prev) => [nueva, ...prev]);
        setMeta((m) => ({ ...m, total: (m.total || 0) + 1 }));
      } else {
        setReloadFlag((f) => f + 1);
      }
    }
  };

  const mapEstadoUIToApi = (estadoUI) => {
    const s = String(estadoUI || '').toUpperCase();

    switch (s) {
      case 'BORRADOR':
        return 'borrador';
      case 'PENDIENTE':
      case 'PENDIENTE_APROBACION':
        return 'pendiente_aprobacion';
      case 'APROBADA':
        return 'aprobada';
      case 'RECHAZADA':
        return 'rechazada';
      case 'CERRADA':
        return 'cerrada';
      default:
        return null;
    }
  };

  const handleEstadoRowChange = async (oc, nuevoEstadoUI) => {
    if (!oc?.id) return;

    // Mapear valor del select (BORRADOR/APROBADA/...) al estado real del backend
    const estadoApi = mapEstadoUIToApi(nuevoEstadoUI);

    if (!estadoApi) {
      await Swal.fire({
        icon: 'error',
        title: 'Estado inválido',
        text: 'Estado destino inválido.'
      });
      return;
    }

    const prevEstadoUI = String(oc.estado || 'BORRADOR');
    const prevEstadoApi = mapEstadoUIToApi(prevEstadoUI);

    // Si no cambia realmente, no hacemos nada
    if (estadoApi === prevEstadoApi) return;

    // 🎯 Optimistic UI: actualizamos la tabla con el estado nuevo (UI: BORRADOR/APROBADA/etc.)
    setOrdenes((prev) =>
      prev.map((row) =>
        row.id === oc.id ? { ...row, estado: nuevoEstadoUI } : row
      )
    );

    try {
      //  PATCH correcto al backend (clave: estado_nuevo)
      await http.patch(`/ordenes-compra/${oc.id}/estado`, {
        estado_nuevo: estadoApi
      });

      // 💧 Refrescar desde backend para asegurar que todo quede hidratado
      setReloadFlag((f) => f + 1);

      await Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `La orden pasó a estado ${nuevoEstadoUI}.`,
        timer: 1400,
        showConfirmButton: false
      });
    } catch (err) {
      console.error(err);

      // 💡 Igual que en handleEliminar: cubrimos ambos formatos de error
      const backendMsg =
        err?.error || // cuando viene plano { ok:false, error:'...' }
        err?.mensajeError ||
        err?.response?.data?.error ||
        err?.response?.data?.mensajeError ||
        err?.message ||
        'No se pudo cambiar el estado de la orden.';

      await Swal.fire({
        icon: 'error',
        title: 'No se pudo cambiar el estado',
        text: backendMsg
      });

      // ⏪ Revertimos el estado en la UI
      setOrdenes((prev) =>
        prev.map((row) =>
          row.id === oc.id ? { ...row, estado: prevEstadoUI } : row
        )
      );
    }
  };

  // =====================
  // Render
  // =====================
  const totalPages = useMemo(() => {
    if (!meta.limit || !meta.total) return 1;
    return Math.max(1, Math.ceil(meta.total / meta.limit));
  }, [meta.limit, meta.total]);

  const fromIndex = useMemo(() => {
    if (!meta.total) return 0;
    return (meta.page - 1) * meta.limit + 1;
  }, [meta.page, meta.limit, meta.total]);

  const toIndex = useMemo(() => {
    if (!meta.total) return 0;
    return Math.min(meta.page * meta.limit, meta.total);
  }, [meta.page, meta.limit, meta.total]);

  return (
    <>
      <NavbarStaff />

      <section className="relative w-full min-h-screen bg-black">
        <div className={`min-h-screen relative ${THEME.bg}`}>
          <ParticlesBackground />
          <ButtonBack />

          {/* Glow superior */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h1 className="uppercase titulo text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Órdenes de Compra
                </h1>
                <p className="mt-2 text-sm sm:text-base text-emerald-200/80 max-w-xl">
                  Gestioná borradores, aprobaciones y estados de las órdenes
                  antes de transformarlas en compras reales.
                </p>
              </div>

              {puedeGestionar && (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRefrescar}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium
                               bg-white/5 border border-white/15 text-emerald-100 hover:bg-white/10
                               hover:border-emerald-300/50 transition shadow-sm"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refrescar
                  </button>
                  <button
                    type="button"
                    onClick={handleNueva}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                               bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg
                               hover:brightness-110 transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nueva orden (borrador)
                  </button>
                </div>
              )}
            </motion.div>

            {/* Línea decorativa */}
            <div className="mt-6 mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />

            {/* Filtros */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="mb-6 rounded-2xl border border-white/15 bg-black/25 backdrop-blur-xl p-4 sm:p-5 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wide uppercase text-emerald-200/80">
                <Filter className="h-4 w-4" />
                Filtros
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                {/* Buscar */}
                <div className="flex-1">
                  <label className="block text-xs text-emerald-100/80 mb-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200/70" />
                    <input
                      value={filtros.q}
                      onChange={handleBuscarChange}
                      placeholder="Proveedor, número interno, comentario…"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/15 text-white
                                 placeholder-emerald-100/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="w-full md:w-56">
                  <label className="block text-xs text-emerald-100/80 mb-1">
                    Estado
                  </label>
                  <div className="relative">
                    <select
                      value={filtros.estado}
                      onChange={handleEstadoChangeFiltro}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm bg-white/5 border border-white/15 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent"
                    >
                      {ESTADOS_OC.map((e) => (
                        <option
                          className="text-stone-950"
                          key={e.value}
                          value={e.value}
                        >
                          {e.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/60 text-xs">
                      ▼
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contenido Tabla */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-white/15 bg-black/30 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              {/* Header tabla */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-100/90">
                  <FileTextIcon className="h-4 w-4" />
                  <span>Listado de órdenes</span>
                </div>
                {meta.total > 0 && (
                  <div className="text-[11px] text-emerald-100/70">
                    Mostrando <span className="font-semibold">{fromIndex}</span>
                    –<span className="font-semibold">{toIndex}</span> de{' '}
                    <span className="font-semibold">{meta.total}</span>{' '}
                    registros
                  </div>
                )}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-emerald-50/90">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide bg-white/5 text-emerald-100/80 border-b border-white/10">
                      <th className="px-4 py-3 whitespace-nowrap">#</th>
                      <th className="px-4 py-3 whitespace-nowrap">Proveedor</th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Local / Sucursal
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Fecha Emisión
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Fecha de Entrega
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                      <th className="px-4 py-3 whitespace-nowrap text-right">
                        Total estimado
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Comentario
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-emerald-100/70"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-9 w-9 rounded-full border-2 border-emerald-400/60 border-t-transparent animate-spin" />
                            <div className="text-xs">
                              Cargando órdenes de compra…
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : ordenes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-8 text-center text-emerald-100/70"
                        >
                          {errorMsg ? (
                            <div className="text-sm text-rose-200/90">
                              {errorMsg}
                            </div>
                          ) : (
                            <div className="text-sm">
                              No se encontraron órdenes de compra con los
                              filtros actuales.
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      ordenes.map((oc, idx) => (
                        <motion.tr
                          key={oc.id ?? idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.015 }}
                          className="border-b border-white/5 last:border-b-0 hover:bg-white/5/60 transition-colors"
                        >
                          {/* # */}
                          <td className="px-4 py-3 align-top text-xs text-emerald-100/80">
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {oc.numero_interno || oc.id || '-'}
                              </span>
                              {oc.id && (
                                <span className="text-[11px] text-emerald-100/50">
                                  ID: {oc.id}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Proveedor */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getProveedorNombre(oc)}
                              </span>
                              {oc.proveedor_cuit && (
                                <span className="text-[11px] text-emerald-100/60">
                                  CUIT {oc.proveedor_cuit}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Local */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getLocalNombre(oc)}
                              </span>
                              {oc.local_codigo && (
                                <span className="text-[11px] text-emerald-100/60">
                                  Código: {oc.local_codigo}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Fecha */}
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span className="text-sm">
                              {getFechaEmision(oc)}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <span className="text-sm">
                              {oc.fecha_estimada_entrega}
                            </span>
                          </td>
                          {/* Estado */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <span
                                className={[
                                  'inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold',
                                  getEstadoBadgeClass(oc.estado)
                                ].join(' ')}
                              >
                                {String(oc.estado || 'BORRADOR')
                                  .toUpperCase()
                                  .replace(/_/g, ' ')}
                              </span>

                              {/* {puedeGestionar && (
                                <select
                                  value={String(
                                    oc.estado || 'BORRADOR'
                                  ).toUpperCase()}
                                  onChange={(e) =>
                                    handleEstadoRowChange(oc, e.target.value)
                                  }
                                  className="mt-1 w-full rounded-full bg-black/40 border border-white/10 text-[11px] text-emerald-100
             px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-400/70"
                                >
                                  {ESTADOS_OC.filter(
                                    (e) => e.value !== 'TODOS'
                                  ).map((e) => (
                                    <option key={e.value} value={e.value}>
                                      {e.label}
                                    </option>
                                  ))}
                                </select>
                              )} */}
                            </div>
                          </td>

                          {/* Total estimado */}
                          <td className="px-4 py-3 align-top text-right whitespace-nowrap font-semibold">
                            {getTotalEstimado(oc)}
                          </td>

                          {/* Comentario */}
                          <td className="px-4 py-3 align-top max-w-xs">
                            <span className="text-xs text-emerald-50/80 line-clamp-2">
                              {oc.observaciones ||
                                oc.comentario ||
                                oc.descripcion ||
                                '—'}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3 align-top">
                            <div className="flex justify-end gap-1.5">
                              {/* Ver detalle */}
                              <button
                                type="button"
                                onClick={() => handleVerDetalle(oc)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-emerald-400/40 bg-emerald-500/10
               hover:bg-emerald-500/20 text-emerald-100 transition"
                                title="Ver detalle"
                              >
                                <FileTextIcon className="h-4 w-4" />
                              </button>

                              {/* Editar cabecera */}
                              <button
                                type="button"
                                onClick={() => handleEditar(oc)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/15 bg-white/5
               hover:bg-white/10 text-emerald-50 transition"
                                title="Editar cabecera"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              {/* Eliminar */}
                              {puedeGestionar && (
                                <button
                                  type="button"
                                  onClick={() => handleEliminar(oc)}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-500/40 bg-rose-500/10
                 hover:bg-rose-500/20 text-rose-100 transition"
                                  title="Eliminar orden"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer tabla: paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-white/10 bg-black/30">
                <div className="text-[11px] text-emerald-100/70">
                  Página {meta.page} de {totalPages}
                </div>
                <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPage((p) => (p > 1 ? p - 1 : p))}
                    disabled={meta.page <= 1}
                    className="px-3 py-1.5 text-xs text-emerald-100/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs text-emerald-100/80 border-x border-white/10">
                    {meta.page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                    disabled={meta.page >= totalPages}
                    className="px-3 py-1.5 text-xs text-emerald-100/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modal de alta/edición */}
      <OrdenCompraFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
        initial={editing}
      />
      <OrdenCompraDetalleDrawer
        open={detalleOpen}
        ordenId={detalleId}
        onClose={() => setDetalleOpen(false)}
        onNeedReload={() => setReloadFlag((f) => f + 1)}
      />
    </>
  );
};

export default OrdenesCompraListado;
