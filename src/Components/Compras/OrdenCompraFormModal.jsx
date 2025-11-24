/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 24 / 11 / 2025
 * Versión: 1.1
 *
 * Descripción:
 * Modal vítreo para crear / editar Órdenes de Compra en estado borrador.
 * Usa catálogos de proveedores y locales con SearchableSelect.
 *
 * Tema: Compras - Órdenes de Compra
 * Capa: Frontend (Components)
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import {
  X,
  ClipboardList,
  Calendar,
  Building2,
  FileText as FileTextIcon,
  Factory
} from 'lucide-react';

import SearchableSelect from '../Common/SearchableSelect';
import { listProveedores } from '../../api/terceros.js';
import { listLocales } from '../../api/locales.js';
import Swal from 'sweetalert2';

// ===== Helpers UI/labels para proveedor
const fmtProveedor = (p) => {
  if (!p) return '';
  const nom = p.nombre || p.razon_social || '';
  const doc = p.cuit || p.documento || '';
  return [nom, doc].filter(Boolean).join(' • ');
};

const getProveedorSearchText = (p) => {
  if (!p) return '';
  return [p.id, p.nombre, p.razon_social, p.cuit, p.documento]
    .filter(Boolean)
    .join(' ');
};

export default function OrdenCompraFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const [form, setForm] = useState({
    proveedor_id: '',
    proveedor_nombre: '',
    local_id: '',
    local_nombre: '',
    fecha_estimada_entrega: '',
    observaciones: '',
    estado: 'BORRADOR'
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;
  const titleId = 'orden-compra-modal-title';
  const formId = 'orden-compra-form';

  const [proveedores, setProveedores] = useState([]);
  const [locales, setLocales] = useState([]);

  // ======= Carga de catálogos cuando abre
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [pvs, locs] = await Promise.all([
          listProveedores?.({
            limit: 5000,
            orderBy: 'nombre',
            orderDir: 'ASC'
          }),
          listLocales?.({
            limit: 5000,
            orderBy: 'nombre',
            orderDir: 'ASC'
          })
        ]);

        const norm = (x) => (Array.isArray(x) ? x : x?.data) ?? [];

        setProveedores(norm(pvs));
        setLocales(norm(locs));
      } catch (err) {
        console.error('Catálogos OC:', err);
        setProveedores([]);
        setLocales([]);
      }
    })();
  }, [open]);

  // Cargar datos en edición
  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        proveedor_id: initial?.proveedor_id ?? '',
        proveedor_nombre:
          initial?.proveedor_nombre ||
          initial?.proveedor_razon_social ||
          initial?.proveedor?.razon_social ||
          '',
        local_id: initial?.local_id ?? '',
        local_nombre: initial?.local_nombre || initial?.local?.nombre || '',
        fecha_estimada_entrega: initial?.fecha_estimada_entrega
          ? String(initial.fecha_estimada_entrega).slice(0, 10)
          : '',
        observaciones:
          initial?.observaciones ||
          initial?.comentario ||
          initial?.descripcion ||
          '',
        estado: initial?.estado || 'BORRADOR'
      }));
    } else {
      setSaving(false);
    }
  }, [open, initial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  // 🔸 Validación: proveedor obligatorio
  if (!form.proveedor_id) {
    await Swal.fire({
      icon: 'warning',
      title: 'Proveedor requerido',
      text: 'Debés seleccionar un proveedor antes de guardar la orden de compra.'
    });
    return;
  }

  try {
    setSaving(true);

    await onSubmit({
      ...form,
      estado: form.estado || 'BORRADOR'
    });

    // ✅ Feedback de éxito
    await Swal.fire({
      icon: 'success',
      title: isEdit ? 'Orden actualizada' : 'Borrador creado',
      timer: 1500,
      showConfirmButton: false
    });

    onClose();
  } catch (err) {
    console.error(err);

    // 💡 Tomamos el detalle real del backend
    const msg =
      err?.error || // cuando tirás { ok:false, error:'...' }
      err?.mensajeError ||
      err?.response?.data?.error ||
      err?.response?.data?.mensajeError ||
      err?.message ||
      'No se pudo guardar la orden de compra.';

    await Swal.fire({
      icon: 'error',
      title: isEdit
        ? 'No se pudo actualizar la orden'
        : 'No se pudo crear la orden',
      text: msg
    });
  } finally {
    setSaving(false);
  }
};


  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Ambient grid + auroras */}
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
            className="pointer-events-none absolute -top-24 -left-20 size-[22rem] sm:size-[28rem] rounded-full blur-3xl opacity-45
                       bg-[conic-gradient(from_180deg_at_50%_50%,rgba(16,185,129,0.20),rgba(6,182,212,0.16),rgba(52,211,153,0.18),transparent,rgba(16,185,129,0.22))]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-16 size-[24rem] sm:size-[30rem] rounded-full blur-3xl opacity-35
                       bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_60%)]"
          />

          {/* Panel vítreo */}
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[94vw] sm:max-w-xl md:max-w-2xl
                       max-h-[88vh] overflow-y-auto overscroll-contain
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            {/* Borde metálico sutil */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
            />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg
                         bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-200" />
            </button>

            <div className="relative z-10 p-5 sm:p-6 md:p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="mb-5 sm:mb-6 flex items-center gap-3"
              >
                <ClipboardList className="h-7 w-7 text-emerald-200 shrink-0" />
                <div>
                  <h3
                    id={titleId}
                    className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                  >
                    {isEdit
                      ? 'Editar Orden de Compra'
                      : 'Nueva Orden de Compra (borrador)'}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-emerald-100/80">
                    Seleccioná proveedor, sucursal y datos generales. El detalle
                    de ítems lo manejamos en la vista de detalle.
                  </p>
                </div>
              </motion.div>

              {/* Form con stagger */}
              <motion.form
                id={formId}
                onSubmit={handleSubmit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Proveedor / Local */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Proveedor */}
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Factory className="h-4 w-4 text-gray-400" /> Proveedor{' '}
                      <span className="text-emerald-300">*</span>
                    </label>
                    <SearchableSelect
                      items={proveedores}
                      value={form.proveedor_id}
                      onChange={(id) =>
                        setForm((f) => {
                          const numeric = id ? Number(id) : '';
                          const found = proveedores.find(
                            (p) => Number(p.id) === numeric
                          );
                          return {
                            ...f,
                            proveedor_id: numeric,
                            proveedor_nombre:
                              found?.nombre ||
                              found?.razon_social ||
                              f.proveedor_nombre
                          };
                        })
                      }
                      getOptionLabel={fmtProveedor}
                      getOptionValue={(p) => p?.id}
                      getOptionSearchText={getProveedorSearchText}
                      placeholder="Buscar proveedor…"
                      portal
                    />
                    <p className="mt-1 text-[11px] text-emerald-100/70">
                      Podés buscar por nombre, razón social, CUIT o ID.
                    </p>
                  </motion.div>

                  {/* Local / sucursal */}
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" /> Local /
                      Sucursal
                    </label>
                    <SearchableSelect
                      items={locales}
                      value={form.local_id}
                      onChange={(id) =>
                        setForm((f) => {
                          const numeric = id ? Number(id) : '';
                          const found = locales.find(
                            (l) => Number(l.id) === numeric
                          );
                          return {
                            ...f,
                            local_id: numeric,
                            local_nombre: found?.nombre || f.local_nombre
                          };
                        })
                      }
                      getOptionLabel={(l) => l?.nombre ?? ''}
                      getOptionValue={(l) => l?.id}
                      placeholder="(Opcional) Seleccionar local…"
                      portal
                    />
                  </motion.div>
                </div>

                {/* Fecha estimada */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <Calendar className="h-4 w-4 text-emerald-200" />
                    Fecha estimada de entrega
                  </label>
                  <input
                    type="date"
                    name="fecha_estimada_entrega"
                    value={form.fecha_estimada_entrega}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent text-sm"
                  />
                </motion.div>

                {/* Observaciones */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <FileTextIcon className="h-4 w-4 text-emerald-200" />
                    Observaciones / comentario interno
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent resize-y"
                    placeholder="Condiciones de pago, referencia a cotizaciones, notas internas, etc."
                  />
                  <p className="mt-1 text-[11px] text-emerald-100/70">
                    Esta nota es interna para Compras. Más adelante podemos
                    separar en comentario interno / comentario para proveedor.
                  </p>
                </motion.div>

                {/* Estado (solo edición) */}
                {isEdit && (
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-orange-400
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      <option value="BORRADOR">Borrador</option>
                      <option value="PENDIENTE">Pendiente Aprobación</option>
                      <option value="APROBADA">Aprobada</option>
                      <option value="RECHAZADA">Rechazada</option>
                      <option value="CERRADA">Cerrada</option>
                    </select>
                  </motion.div>
                )}

                {/* Acciones */}
                <motion.div
                  variants={fieldV}
                  className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1"
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {saving
                      ? 'Guardando…'
                      : isEdit
                      ? 'Guardar cambios'
                      : 'Crear borrador'}
                  </button>
                </motion.div>
              </motion.form>
            </div>

            {/* Línea base metálica */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400/70 via-emerald-200/70 to-emerald-400/70 opacity-40 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
