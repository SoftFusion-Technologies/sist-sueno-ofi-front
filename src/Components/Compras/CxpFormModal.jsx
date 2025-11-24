// ===============================
// FILE: src/Components/Compras/CxpFormModal.jsx
// DESC: Modal vítreo ultra moderno para Crear/Actualizar CxP
// MODOS soportados (prop `mode`):
//   - 'create'            -> POST   /compras/cxp
//   - 'update-fechas'     -> PUT    /compras/cxp/:id/fechas
//   - 'ajustar-monto'     -> PUT    /compras/cxp/:id/monto
//   - 'recalcular'        -> POST   /compras/cxp/:id/recalcular
// NOTE: Mantiene el mismo look&feel del ejemplo BankFormModal (animHelpers + lucide)
// ===============================

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import {
  X,
  Landmark,
  Calendar,
  CalendarRange,
  BadgeCheck,
  DollarSign,
  Building2,
  Factory,
  RefreshCw
} from 'lucide-react';
import http from '../../api/http';
import { moneyAR } from '../../utils/money';

export const CXP_MODE = {
  CREATE: 'create',
  UPDATE_FECHAS: 'update-fechas',
  AJUSTAR_MONTO: 'ajustar-monto',
  RECALCULAR: 'recalcular'
};
// reutilizamos el componente para seleccionar un proveedor
import SearchableSelect from '../../Components/Common/SearchableSelect';
/**
 * CxpFormModal
 * @param {boolean} open
 * @param {function} onClose
 * @param {('create'|'update-fechas'|'ajustar-monto'|'recalcular')} mode
 * @param {object} initial  // { id, proveedor_id, canal, fecha_emision, fecha_vencimiento, monto_total, proveedor? }
 * @param {function} onSuccess // callback luego de éxito (refrescar lista, etc.)
 */

// ===== Helpers UI/labels
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
export default function CxpFormModal({
  open,
  onClose,
  mode = CXP_MODE.CREATE,
  initial,
  onSuccess
}) {
  const isEdit = mode !== CXP_MODE.CREATE;
  const id = initial?.id ?? null;

  // Form base
  const [form, setForm] = useState({
    proveedor_id: '',
    canal: 'C1',
    fecha_emision: '',
    fecha_vencimiento: '',
    monto_total: ''
  });
  const [saving, setSaving] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  useEffect(() => {
    if (!open) return;
    // Pre-cargar según modo
    setForm({
      proveedor_id: initial?.proveedor_id ?? '',
      canal: initial?.canal ?? 'C1',
      fecha_emision: initial?.fecha_emision ?? '',
      fecha_vencimiento: initial?.fecha_vencimiento ?? '',
      monto_total: initial?.monto_total ?? ''
    });
  }, [open, initial, mode]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // Opción A: usando servicio existente
        // const res = await listProveedores({ limit: 5000, orderBy: 'nombre', orderDir: 'ASC' });
        // const data = Array.isArray(res) ? res : res?.data || [];

        // Opción B: llamada directa
        const { data } = await http.get('/proveedores', {
          params: {
            page: 1,
            pageSize: 5000,
            orderBy: 'nombre',
            orderDir: 'ASC'
          }
        });
        const dataList = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setProveedores(dataList);
      } catch (err) {
        console.error('Catálogo proveedores:', err);
        setProveedores([]);
      }
    })();
  }, [open]);
  const title = useMemo(() => {
    switch (mode) {
      case CXP_MODE.UPDATE_FECHAS:
        return `Actualizar Fechas ${id ? `· CxP #${id}` : ''}`;
      case CXP_MODE.AJUSTAR_MONTO:
        return `Ajustar Monto ${id ? `· CxP #${id}` : ''}`;
      case CXP_MODE.RECALCULAR:
        return `Recalcular Saldo ${id ? `· CxP #${id}` : ''}`;
      default:
        return 'Nueva CxP';
    }
  }, [mode, id]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (mode === CXP_MODE.CREATE) {
      if (!String(form.proveedor_id).trim())
        return 'El proveedor es obligatorio';
      if (!form.fecha_emision) return 'La fecha de emisión es obligatoria';
      if (!form.fecha_vencimiento)
        return 'La fecha de vencimiento es obligatoria';
      if (form.monto_total === '' || Number(form.monto_total) < 0)
        return 'El monto debe ser ≥ 0';
    }
    if (mode === CXP_MODE.UPDATE_FECHAS) {
      if (!id) return 'Falta el ID de la CxP';
      if (!form.fecha_emision && !form.fecha_vencimiento)
        return 'Ingresá al menos una fecha';
    }
    if (mode === CXP_MODE.AJUSTAR_MONTO) {
      if (!id) return 'Falta el ID de la CxP';
      if (form.monto_total === '' || Number(form.monto_total) < 0)
        return 'El monto debe ser ≥ 0';
    }
    if (mode === CXP_MODE.RECALCULAR) {
      if (!id) return 'Falta el ID de la CxP';
    }
    return null;
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    const err = validate();
    if (err) return alert(err); // Podés reemplazar por SweetAlert si preferís

    if (!form.proveedor_id) {
      return Swal.fire(
        'Falta proveedor',
        'Seleccioná un proveedor.',
        'warning'
      );
    }
    try {
      setSaving(true);
      if (mode === CXP_MODE.CREATE) {
        const payload = {
          proveedor_id: Number(form.proveedor_id),
          canal: form.canal,
          fecha_emision: form.fecha_emision,
          fecha_vencimiento: form.fecha_vencimiento,
          monto_total: Number(form.monto_total)
        };
        await http.post('/compras/cxp', payload);
      }
      if (mode === CXP_MODE.UPDATE_FECHAS) {
        await http.put(`/compras/cxp/${id}/fechas`, {
          fecha_emision: form.fecha_emision || undefined,
          fecha_vencimiento: form.fecha_vencimiento || undefined
        });
      }
      if (mode === CXP_MODE.AJUSTAR_MONTO) {
        await http.put(`/compras/cxp/${id}/monto`, {
          monto_total: Number(form.monto_total)
        });
      }
      if (mode === CXP_MODE.RECALCULAR) {
        await http.post(`/compras/cxp/${id}/recalcular`);
      }
      onSuccess?.();
      onClose?.();
    } catch (ex) {
      // Normalizado por interceptor, pero por si acaso…
      const msg =
        ex?.mensajeError || ex?.error || 'No se pudo completar la operación';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // Visibilidad de campos según modo
  const showProveedor = mode === CXP_MODE.CREATE;
  const showCanal = mode === CXP_MODE.CREATE;
  const showFechas =
    mode === CXP_MODE.CREATE || mode === CXP_MODE.UPDATE_FECHAS;
  const showMonto = mode === CXP_MODE.CREATE || mode === CXP_MODE.AJUSTAR_MONTO;
  const showConfirm = mode === CXP_MODE.RECALCULAR;

  const titleId = 'cxp-modal-title';
  const formId = 'cxp-form';

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
            className="pointer-events-none absolute -top-24 -left-20 size-[22rem] sm:size-[28rem] rounded-full blur-3xl opacity-45 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.14),rgba(6,182,212,0.12),rgba(99,102,241,0.12),transparent,rgba(6,182,212,0.12))]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-16 size-[24rem] sm:size-[30rem] rounded-full blur-3xl opacity-35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_60%)]"
          />

          {/* Panel vítreo */}
          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
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
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
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
                {mode === CXP_MODE.RECALCULAR ? (
                  <RefreshCw className="h-6 w-6 text-gray-300 shrink-0" />
                ) : mode === CXP_MODE.AJUSTAR_MONTO ? (
                  <DollarSign className="h-6 w-6 text-gray-300 shrink-0" />
                ) : mode === CXP_MODE.UPDATE_FECHAS ? (
                  <CalendarRange className="h-6 w-6 text-gray-300 shrink-0" />
                ) : (
                  <Landmark className="h-6 w-6 text-gray-300 shrink-0" />
                )}
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {title}
                </h3>
              </motion.div>

              {/* Info del registro (si aplica) */}
              {isEdit && (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300/90">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 opacity-80" />
                    <span>Proveedor:</span>
                    <strong className="ml-1">
                      {initial?.proveedor?.razon_social ||
                        initial?.proveedor_id ||
                        '-'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 opacity-80" />
                    <span>ID CxP:</span>
                    <strong className="ml-1">#{id}</strong>
                  </div>
                  {typeof initial?.monto_total !== 'undefined' && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 opacity-80" />
                      <span>Monto:</span>
                      <strong className="ml-1">
                        {moneyAR(initial?.monto_total)}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Formulario / Contenido */}
              <motion.form
                id={formId}
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Campos de creación */}
                {showProveedor && (
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Factory className="h-4 w-4 text-gray-400" /> Proveedor{' '}
                      <span className="text-cyan-300">*</span>
                    </label>
                    <SearchableSelect
                      items={proveedores}
                      value={form.proveedor_id}
                      onChange={(id) =>
                        setForm((f) => ({
                          ...f,
                          proveedor_id: id ? Number(id) : ''
                        }))
                      }
                      getOptionLabel={fmtProveedor}
                      getOptionValue={(p) => p?.id}
                      getOptionSearchText={getProveedorSearchText}
                      placeholder="Buscar proveedor…"
                      portal
                    />
                  </motion.div>
                )}

                {showCanal && (
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Canal
                    </label>
                    <select
                      name="canal"
                      value={form.canal}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </motion.div>
                )}

                {showFechas && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div variants={fieldV}>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        <Calendar className="inline-block h-4 w-4 mr-1 text-gray-400" />{' '}
                        Fecha de emisión
                        {mode === CXP_MODE.CREATE && (
                          <span className="text-cyan-300"> *</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="fecha_emision"
                        value={form.fecha_emision}
                        onChange={handle}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      />
                    </motion.div>
                    <motion.div variants={fieldV}>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        <Calendar className="inline-block h-4 w-4 mr-1 text-gray-400" />{' '}
                        Fecha de vencimiento
                        {mode === CXP_MODE.CREATE && (
                          <span className="text-cyan-300"> *</span>
                        )}
                      </label>
                      <input
                        type="date"
                        name="fecha_vencimiento"
                        value={form.fecha_vencimiento}
                        onChange={handle}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      />
                    </motion.div>
                  </div>
                )}

                {showMonto && (
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-400" /> Monto
                      total{' '}
                      {mode === CXP_MODE.CREATE && (
                        <span className="text-cyan-300">*</span>
                      )}
                    </label>
                    <input
                      name="monto_total"
                      type="number"
                      step="0.01"
                      min="0"
                      disabled
                      value={form.monto_total}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </motion.div>
                )}

                {showConfirm && (
                  <motion.div
                    variants={fieldV}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-200"
                  >
                    Confirmá que querés <strong>recalcular el saldo</strong> de
                    esta CxP. Esta acción recomputa el saldo según
                    pagos/imputaciones vigentes.
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {saving
                      ? 'Procesando…'
                      : mode === CXP_MODE.CREATE
                      ? 'Crear CxP'
                      : mode === CXP_MODE.UPDATE_FECHAS
                      ? 'Guardar fechas'
                      : mode === CXP_MODE.AJUSTAR_MONTO
                      ? 'Guardar monto'
                      : 'Recalcular'}
                  </button>
                </motion.div>
              </motion.form>
            </div>

            {/* Línea base metálica */}
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gray-400/70 via-gray-200/70 to-gray-400/70 opacity-40 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
