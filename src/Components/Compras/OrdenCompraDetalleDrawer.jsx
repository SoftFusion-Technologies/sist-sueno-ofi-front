// src/Components/Compras/OrdenCompraDetalleDrawer.jsx
/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 24 / 11 / 2025
 * Versión: 1.1
 *
 * Descripción:
 * Drawer lateral para ver el detalle completo de una Orden de Compra:
 * cabecera + líneas (detalles) + totales estimados.
 *
 * Tema: Compras - Órdenes de Compra
 * Capa: Frontend (Components)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ClipboardList,
  Factory,
  Building2,
  Calendar,
  DollarSign,
  Package2,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import http from '../../api/http';
import { listProductos } from '../../api/productos.js';
import SearchableSelect from '../Common/SearchableSelect.jsx';
import Swal from 'sweetalert2';

const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const panelV = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 260, damping: 26 }
  },
  exit: { x: '100%', transition: { duration: 0.25 } }
};

export default function OrdenCompraDetalleDrawer({
  open,
  onClose,
  ordenId,
  onUpdated,
  onNeedReload
}) {
  const [loading, setLoading] = useState(false);
  const [orden, setOrden] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [items, setItems] = useState([]);
  const [savingItems, setSavingItems] = useState(false);
  const [productos, setProductos] = useState([]);

  const [generandoCompra, setGenerandoCompra] = useState(false);
  const [compraGeneradaId, setCompraGeneradaId] = useState(null);

  // Helpers producto
  const fmtProducto = (p) =>
    p ? [p.codigo_sku, p.nombre].filter(Boolean).join(' • ') : '';

  const getProductoSearchText = (p) =>
    p
      ? [p.id, p.codigo_sku, p.nombre, p.categoria_nombre]
          .filter(Boolean)
          .join(' ')
      : '';

  // Normalizar items cuando llega la orden
  useEffect(() => {
    if (!orden) {
      setItems([]);
      return;
    }

    const dets =
      orden.detalles || orden.detalle || orden.items || orden.lineas || [];

    const normalizados = dets.map((d) => ({
      id: d.id ?? null,
      producto_id: d.producto_id ?? d.producto?.id ?? '',
      descripcion: d.descripcion || d.detalle || d.observaciones || '',
      cantidad: d.cantidad ?? d.cant ?? 1,
      precio_unitario:
        d.precio_unitario ?? d.precio ?? d.costo_unit_estimado ?? 0
    }));

    setItems(normalizados);
  }, [orden]);

  // Cargar productos al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await listProductos?.({
          limit: 5000,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        const norm = (x) => (Array.isArray(x) ? x : x?.data) ?? [];
        setProductos(norm(resp));
      } catch (err) {
        console.error('Error cargando productos OC:', err);
        setProductos([]);
      }
    })();
  }, [open]);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
      }),
    []
  );

  // Helpers cabecera
  const getProveedorNombre = (oc) =>
    oc?.proveedor_razon_social ||
    oc?.proveedor_nombre ||
    oc?.proveedor?.razon_social ||
    oc?.proveedor?.nombre ||
    '-';

  const getProveedorDoc = (oc) =>
    oc?.proveedor_cuit || oc?.proveedor?.cuit || null;

  const getLocalNombre = (oc) =>
    oc?.local_nombre || oc?.local?.nombre || oc?.sucursal || '-';

  const getFechaEmision = (oc) => {
    const raw = oc?.fecha || oc?.fecha_emision || oc?.created_at;
    if (!raw) return '-';
    try {
      return new Date(raw).toLocaleDateString('es-AR');
    } catch {
      return String(raw).slice(0, 10);
    }
  };

  // CRUD items en memoria
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: null,
        producto_id: '',
        descripcion: '',
        cantidad: 1,
        precio_unitario: 0
      }
    ]);
  };

  const handleChangeItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveItems = async () => {
    if (!orden?.id) return;

    const detallesPayload = items
      .filter((it) => it.producto_id && Number(it.cantidad) > 0)
      .map((it) => ({
        id: it.id ?? undefined,
        producto_id: it.producto_id,
        descripcion: it.descripcion || null,
        cantidad: Number(it.cantidad) || 0,
        costo_unit_estimado: Number(it.precio_unitario) || 0,
        // por ahora IVA/descuentos/otros los dejamos en default
        alicuota_iva_estimado: Number(it.alicuota_iva_estimado ?? 21),
        inc_iva_estimado: Number(it.inc_iva_estimado ?? 0),
        descuento_porcentaje: Number(it.descuento_porcentaje ?? 0),
        otros_impuestos_estimados: Number(it.otros_impuestos_estimados ?? 0)
      }));

    if (detallesPayload.length === 0) {
      const ok = window.confirm(
        'No hay ítems válidos. ¿Guardar la orden sin detalle?'
      );
      if (!ok) return;
    }

    try {
      setSavingItems(true);

      const payload = {
        proveedor_id: orden.proveedor_id,
        local_id: orden.local_id,
        fecha_estimada_entrega: orden.fecha_estimada_entrega,
        condicion_compra: orden.condicion_compra,
        moneda: orden.moneda,
        prioridad: orden.prioridad,
        observaciones: orden.observaciones,
        detalles: detallesPayload
      };

      const resp = await http.put(`/ordenes-compra/${orden.id}`, payload);
      const updated = resp.data?.orden || resp.data?.data || resp.data || null;

      if (updated) {
        setOrden(updated);
        onUpdated?.(updated);
      }

      onNeedReload?.();
      alert('Ítems de la orden guardados correctamente.');
    } catch (err) {
      console.error('Error guardando ítems OC:', err);
      const msg =
        err?.mensajeError ||
        err?.error ||
        'No se pudieron guardar los ítems de la orden.';
      alert(msg);
    } finally {
      setSavingItems(false);
    }
  };

  // Detalles "oficiales" que vienen del backend
  const detalles = useMemo(() => {
    if (!orden) return [];
    return orden.detalles || orden.detalle || orden.items || orden.lineas || [];
  }, [orden]);

  // Totales estimados
  const subtotal = Number(orden?.subtotal_neto_estimado ?? 0);
  const iva = Number(orden?.iva_estimado ?? 0);
  const percep = Number(orden?.percepciones_estimadas ?? 0);
  const ret = Number(orden?.retenciones_estimadas ?? 0);
  const percepRet = percep + ret;

  const total =
    orden?.total_estimado != null
      ? Number(orden.total_estimado)
      : subtotal + iva + percepRet;

  // Fetch detalle (open + ordenId)
  useEffect(() => {
    if (!open || !ordenId) return;

    let active = true;
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const resp = await http.get(`/ordenes-compra/${ordenId}`);
        const root = resp.data || {};
        const oc = root.orden || root.data || root;
        if (!active) return;
        setOrden(oc || null);
        // Si la OC ya está cerrada y viene linkeo a compra, podrías setear aquí compraGeneradaId
        // setCompraGeneradaId(oc?.compra_id ?? null);
      } catch (err) {
        if (!active) return;
        console.error('Error cargando detalle OC:', err);
        const msg =
          err?.mensajeError ||
          err?.error ||
          'No se pudo cargar la orden de compra.';
        setErrorMsg(msg);
      } finally {
        active && setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, ordenId]);

  const handleClose = () => {
    setOrden(null);
    setErrorMsg(null);
    setCompraGeneradaId(null);
    onClose?.();
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!orden?.id) return;

    const isAprobar = nuevoEstado === 'aprobada';

    const result = await Swal.fire({
      title: isAprobar ? 'Aprobar Orden' : 'Cambiar estado',
      text: isAprobar
        ? 'La orden pasará a estado APROBADA y ya no podrás editar sus ítems.'
        : `La orden pasará a estado ${nuevoEstado}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const resp = await http.patch(`/ordenes-compra/${orden.id}/estado`, {
        estado_nuevo: nuevoEstado
      });

      const oc = resp.data?.orden ?? resp.data;

      if (oc) {
        // 🔥 Esto actualiza el drawer (badge + botón "Generar compra")
        setOrden(oc);
        onUpdated?.(oc);
      }

      onNeedReload?.();

      await Swal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error cambiando estado OC:', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo cambiar el estado',
        text:
          err?.mensajeError ||
          err?.error ||
          'Ocurrió un error inesperado al cambiar el estado.'
      });
    }
  };

  const handleGenerarCompra = async () => {
    if (!orden?.id) return;

    const result = await Swal.fire({
      title: 'Generar compra',
      text: 'Se creará una COMPRA en borrador a partir de esta Orden de Compra APROBADA. Luego podrás completar los datos del comprobante y confirmarla.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar compra',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      setGenerandoCompra(true);

      const payload = {
        condicion_compra: orden?.condicion_compra,
        canal: orden?.canal,
        moneda: orden?.moneda,
        observaciones: orden?.observaciones,
        fecha_vencimiento: orden?.fecha_estimada_entrega || orden?.fecha || null
      };

      const resp = await http.post(
        `/ordenes-compra/${orden.id}/generar-compra`,
        payload
      );

      const { compra, orden_actualizada } = resp.data || {};

      if (compra?.id) {
        setCompraGeneradaId(compra.id);
      }

      if (orden_actualizada) {
        setOrden(orden_actualizada);
        onUpdated?.(orden_actualizada);
      }

      onNeedReload?.();

      await Swal.fire({
        icon: 'success',
        title: 'Compra generada',
        html: `Se creó la compra <b>#${compra?.id}</b> en estado <b>borrador</b>.<br/>La Orden de Compra quedó <b>cerrada</b>.`,
        timer: 2600,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error generando compra desde OC:', err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo generar la compra',
        text:
          err?.response?.data?.error ||
          err?.mensajeError ||
          err?.error ||
          'Ocurrió un error inesperado al generar la compra desde la Orden.'
      });
    } finally {
      setGenerandoCompra(false);
    }
  };

  const estadoLower = String(orden?.estado || '').toLowerCase();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop click-cerrar */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            variants={panelV}
            className="relative w-full max-w-xl md:max-w-2xl bg-gradient-to-b from-[#020617] via-[#020815] to-[#020617]
                       border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-lg
                         bg-white/5 border border-white/10 hover:bg-white/10 transition z-20"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-100" />
            </button>

            {/* Header */}
            <div className="relative px-5 pt-5 pb-3 border-b border-white/10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent"
              />

              <div className="relative flex items-start gap-3">
                <div className="mt-1 rounded-xl bg-emerald-500/15 border border-emerald-400/40 p-2.5">
                  <ClipboardList className="h-6 w-6 text-emerald-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="titulo text-lg sm:text-xl font-semibold text-white">
                    Orden de Compra #{orden?.numero_interno || orden?.id || '-'}
                  </h2>
                  <p className="mt-1 text-xs text-emerald-100/80">
                    Borrador / pre-aprobación antes de generar la compra
                    definitiva.
                  </p>

                  {/* Badges */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-400/50 px-2 py-0.5 text-emerald-100">
                      <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {String(orden?.estado || 'BORRADOR')
                        .toUpperCase()
                        .replace(/_/g, ' ')}
                    </span>
                    {orden?.prioridad && (
                      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-gray-100">
                        Prioridad: {String(orden.prioridad).toLowerCase()}
                      </span>
                    )}
                    {orden?.moneda && (
                      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-gray-100">
                        Moneda: {orden.moneda}
                      </span>
                    )}

                    {estadoLower === 'cerrada' && compraGeneradaId && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-[11px] text-emerald-100 ml-2">
                        Compra #{compraGeneradaId}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón Aprobar */}
                {estadoLower === 'borrador' && (
                  <button
                    type="button"
                    onClick={() => handleCambiarEstado('aprobada')}
                    className="mt-8 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
               bg-emerald-500/20 border border-emerald-400/70 text-emerald-50 text-[11px]
               hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/20 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Aprobar Orden
                  </button>
                )}

                {/* Botón Generar compra */}
                {estadoLower === 'aprobada' && (
                  <button
                    type="button"
                    onClick={handleGenerarCompra}
                    disabled={generandoCompra}
                    className="mt-8 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
               bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[11px] font-semibold
               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {generandoCompra ? 'Generando…' : 'Generar compra'}
                  </button>
                )}
              </div>
            </div>

            {/* Cabecera detalle */}
            <div className="px-5 py-4 border-b border-white/10 bg-black/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-100">
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Factory className="h-4 w-4 text-emerald-300 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-emerald-100/80">
                        Proveedor
                      </div>
                      <div className="font-semibold text-sm">
                        {getProveedorNombre(orden)}
                      </div>
                      {getProveedorDoc(orden) && (
                        <div className="text-[11px] text-emerald-100/70">
                          CUIT {getProveedorDoc(orden)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-emerald-300 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-emerald-100/80">
                        Local / Sucursal
                      </div>
                      <div className="font-medium text-sm">
                        {getLocalNombre(orden)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-emerald-300 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-emerald-100/80">
                        Fechas
                      </div>
                      <div className="text-[11px]">
                        Emisión:{' '}
                        <span className="font-medium">
                          {getFechaEmision(orden)}
                        </span>
                      </div>
                      {orden?.fecha_estimada_entrega && (
                        <div className="text-[11px]">
                          Entrega estimada:{' '}
                          <span className="font-medium">
                            {new Date(
                              orden.fecha_estimada_entrega
                            ).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-300 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-emerald-100/80">
                        Totales estimados
                      </div>
                      <div className="text-[11px]">
                        Subtotal:{' '}
                        <span className="font-medium">
                          {currency.format(subtotal || 0)}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        IVA:{' '}
                        <span className="font-medium">
                          {currency.format(iva || 0)}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        Percep / Ret:{' '}
                        <span className="font-medium">
                          {currency.format(percepRet || 0)}
                        </span>
                      </div>
                      <div className="text-[11px] mt-1">
                        Total:{' '}
                        <span className="font-semibold text-emerald-300">
                          {currency.format(total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {orden?.observaciones && (
                <div className="mt-3 rounded-xl bg-white/5 border border-white/10 p-3 text-[11px] text-gray-100">
                  <div className="font-semibold text-emerald-100/90 mb-0.5">
                    Observaciones
                  </div>
                  <div className="max-h-32 overflow-y-auto pr-1">
                    {orden.observaciones}
                  </div>
                </div>
              )}
            </div>

            {/* Contenido principal: tabla de detalles */}
            <div className="flex-1 overflow-y-auto bg-black/60 px-5 py-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-emerald-100/80 text-sm">
                  <div className="h-9 w-9 rounded-full border-2 border-emerald-400/60 border-t-transparent animate-spin" />
                  Cargando detalle de la orden…
                </div>
              ) : errorMsg ? (
                <div className="mt-4 text-sm text-rose-200">{errorMsg}</div>
              ) : detalles.length === 0 ? (
                <div className="space-y-4">
                  {estadoLower === 'borrador' && (
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-emerald-100/80">
                        Gestioná los ítems de esta Orden de Compra.
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="px-3 py-1.5 rounded-xl text-xs bg-emerald-500/20 border border-emerald-400/60 text-emerald-50 hover:bg-emerald-500/30 transition"
                        >
                          + Agregar ítem
                        </button>
                        <button
                          type="button"
                          disabled={savingItems}
                          onClick={handleSaveItems}
                          className="px-3 py-1.5 rounded-xl text-xs bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold
                       hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {savingItems ? 'Guardando…' : 'Guardar ítems'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-left text-gray-50">
                        <thead>
                          <tr className="bg-black/40 text-[11px] uppercase tracking-wide">
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Descripción</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                            <th className="px-3 py-2 text-right">
                              Precio unit.
                            </th>
                            <th className="px-3 py-2 text-right">Total</th>
                            {estadoLower === 'borrador' && (
                              <th className="px-3 py-2 text-right">Acciones</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-3 py-4 text-center text-emerald-100/70"
                              >
                                Esta orden todavía no tiene líneas. Agregá el
                                primer ítem con el botón de arriba.
                              </td>
                            </tr>
                          ) : (
                            items.map((it, idx) => {
                              const cant = Number(it.cantidad) || 0;
                              const pu = Number(it.precio_unitario) || 0;
                              const totalLinea = cant * pu;

                              const editable = estadoLower === 'borrador';

                              return (
                                <tr
                                  key={it.id ?? `tmp-${idx}`}
                                  className="border-t border-white/5 hover:bg-white/5"
                                >
                                  <td className="px-3 py-2 align-top">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 align-top min-w-[180px]">
                                    {editable ? (
                                      <SearchableSelect
                                        items={productos}
                                        value={it.producto_id}
                                        onChange={(id) =>
                                          handleChangeItem(
                                            idx,
                                            'producto_id',
                                            id ? Number(id) : ''
                                          )
                                        }
                                        getOptionLabel={fmtProducto}
                                        getOptionValue={(p) => p?.id}
                                        getOptionSearchText={
                                          getProductoSearchText
                                        }
                                        placeholder="Producto…"
                                        portal
                                      />
                                    ) : (
                                      <span>
                                        {
                                          productos.find(
                                            (p) =>
                                              Number(p.id) ===
                                              Number(it.producto_id)
                                          )?.nombre
                                        }
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 align-top">
                                    {editable ? (
                                      <textarea
                                        rows={2}
                                        value={it.descripcion}
                                        onChange={(e) =>
                                          handleChangeItem(
                                            idx,
                                            'descripcion',
                                            e.target.value
                                          )
                                        }
                                        className="w-full rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white
                                     placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
                                        placeholder="Detalle de la línea…"
                                      />
                                    ) : (
                                      <div className="text-[11px]">
                                        {it.descripcion || '—'}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 align-top text-right">
                                    {editable ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={it.cantidad}
                                        onChange={(e) =>
                                          handleChangeItem(
                                            idx,
                                            'cantidad',
                                            e.target.value
                                          )
                                        }
                                        className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-right text-[11px] text-white
                                     focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
                                      />
                                    ) : (
                                      cant
                                    )}
                                  </td>
                                  <td className="px-3 py-2 align-top text-right">
                                    {editable ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={it.precio_unitario}
                                        onChange={(e) =>
                                          handleChangeItem(
                                            idx,
                                            'precio_unitario',
                                            e.target.value
                                          )
                                        }
                                        className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-right text-[11px] text-white
                                     focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
                                      />
                                    ) : (
                                      currency.format(pu)
                                    )}
                                  </td>
                                  <td className="px-3 py-2 align-top text-right">
                                    {currency.format(totalLinea)}
                                  </td>
                                  {editable && (
                                    <td className="px-3 py-2 align-top text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-rose-500/15 border border-rose-400/50 text-rose-100 text-xs hover:bg-rose-500/25 transition"
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-100/80 mb-1">
                    <Package2 className="h-4 w-4" />
                    {detalles.length} ítem
                    {detalles.length !== 1 && 's'} en la orden
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-left text-gray-50">
                        <thead>
                          <tr className="bg-black/40 text-[11px] uppercase tracking-wide">
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Descripción</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                            <th className="px-3 py-2 text-right">
                              Precio unit.
                            </th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalles.map((d, idx) => {
                            const prodNombre =
                              d.producto_nombre ||
                              d.producto?.nombre ||
                              d.descripcion_corta ||
                              `Item #${idx + 1}`;

                            const desc =
                              d.descripcion ||
                              d.observaciones ||
                              d.detalle ||
                              '—';

                            const cant = Number(d.cantidad ?? d.cant ?? 0);
                            const pu =
                              d.costo_unit_estimado ??
                              d.precio_unitario ??
                              d.precio ??
                              d.precio_estimado ??
                              0;
                            const totalLinea = cant * pu;

                            return (
                              <tr
                                key={d.id ?? idx}
                                className="border-t border-white/5 hover:bg-white/5"
                              >
                                <td className="px-3 py-2 align-top">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="font-medium text-[11px]">
                                    {prodNombre}
                                  </div>
                                  {d.producto_id && (
                                    <div className="text-[10px] text-emerald-100/70">
                                      ID prod: {d.producto_id}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 align-top">
                                  <div className="text-[11px] line-clamp-3">
                                    {desc}
                                  </div>
                                </td>
                                <td className="px-3 py-2 align-top text-right">
                                  {cant}
                                </td>
                                <td className="px-3 py-2 align-top text-right">
                                  {currency.format(pu || 0)}
                                </td>
                                <td className="px-3 py-2 align-top text-right">
                                  {currency.format(totalLinea || 0)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 bg-black/70 px-5 py-3 flex items-center justify-between text-[11px] text-emerald-100/80">
              <span>
                OC ID: <span className="font-semibold">{ordenId}</span>
              </span>
              <span className="font-semibold text-emerald-300">
                Total estimado: {currency.format(total || 0)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
