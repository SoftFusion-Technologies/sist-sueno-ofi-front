// src/Components/Arca/PuntoVentaFormModal.jsx
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
  Building2,
  Hash,
  FileText,
  Layers,
  ToggleLeft,
  MapPinHouse
} from 'lucide-react';
import { listLocales } from '../../api/locales';

const TIPOS_PV = [
  { value: 'WS_ARCA', label: 'WS ARCA (API)' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CONTROLADOR_FISCAL', label: 'Controlador fiscal' }
];

const MODOS_PV = [
  { value: 'HOMO', label: 'Homologación' },
  { value: 'PROD', label: 'Producción' }
];

export default function PuntoVentaFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  empresas = []
}) {
  const [form, setForm] = useState({
    empresa_id: '',
    numero: '',
    descripcion: '',
    tipo: 'WS_ARCA',
    modo: 'HOMO',
    local_id: '',
    activo: true
  });
  const [saving, setSaving] = useState(false);
  const [locales, setLocales] = useState([]);
  const [loadingLocales, setLoadingLocales] = useState(false);

  const isEdit = !!initial?.id;
  const titleId = 'punto-venta-modal-title';
  const formId = 'punto-venta-form';

  // Inicializar form con datos iniciales
  useEffect(() => {
    if (open) {
      setForm({
        empresa_id: initial?.empresa_id ?? '',
        numero: initial?.numero ?? '',
        descripcion: initial?.descripcion ?? '',
        tipo: initial?.tipo ?? 'WS_ARCA',
        modo: initial?.modo ?? 'HOMO',
        local_id: initial?.local_id ?? '',
        activo: initial?.activo ?? true
      });
    }
  }, [open, initial]);

  // Cargar locales activos cuando se abre el modal
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const fetchLocales = async () => {
      try {
        setLoadingLocales(true);
        const data = await listLocales({ estado: 'activo' });
        if (!cancelled) {
          setLocales(data || []);
        }
      } catch (err) {
        console.error('Error cargando locales:', err);
      } finally {
        if (!cancelled) {
          setLoadingLocales(false);
        }
      }
    };

    fetchLocales();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!String(form.empresa_id).trim() || !String(form.numero).trim()) {
      alert('Empresa y número de punto de venta son obligatorios');
      return;
    }
    if (!form.tipo) {
      alert('Debés seleccionar un tipo de punto de venta');
      return;
    }
    if (!form.modo) {
      alert('Debés seleccionar un modo (HOMO / PROD)');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        empresa_id: form.empresa_id ? Number(form.empresa_id) : null,
        numero: form.numero ? Number(form.numero) : null,
        local_id: form.local_id ? Number(form.local_id) : null
      });
      onClose();
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

          {/* Grid / glow background */}
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
                       bg-[conic-gradient(from_180deg_at_50%_50%,rgba(16,185,129,0.18),rgba(45,212,191,0.18),rgba(59,130,246,0.12),transparent,rgba(16,185,129,0.16))]"
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
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl
                       max-h-[85vh] overflow-y-auto overscroll-contain
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
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
                <Layers className="h-6 w-6 text-emerald-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit
                    ? 'Editar punto de venta'
                    : 'Nuevo punto de venta fiscal'}
                </h3>
              </motion.div>

              {/* Form */}
              <motion.form
                id={formId}
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Empresa + Número */}
                <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      Empresa fiscal <span className="text-emerald-300">*</span>
                    </label>
                    <select
                      name="empresa_id"
                      value={form.empresa_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      <option value="" className="bg-slate-900 text-gray-300">
                        Seleccioná empresa…
                      </option>
                      {empresas.map((e) => (
                        <option
                          key={e.id}
                          value={e.id}
                          className="bg-slate-900 text-white"
                        >
                          {e.razon_social} ({e.cuit})
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      N° PV <span className="text-emerald-300">*</span>
                    </label>
                    <input
                      name="numero"
                      type="number"
                      value={form.numero}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 1"
                    />
                  </motion.div>
                </div>

                {/* Tipo + Modo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Tipo de punto de venta
                    </label>
                    <select
                      name="tipo"
                      value={form.tipo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      {TIPOS_PV.map((t) => (
                        <option
                          key={t.value}
                          value={t.value}
                          className="bg-slate-900 text-white"
                        >
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Modo
                    </label>
                    <select
                      name="modo"
                      value={form.modo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      {MODOS_PV.map((m) => (
                        <option
                          key={m.value}
                          value={m.value}
                          className="bg-slate-900 text-white"
                        >
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Local (selector) + descripción */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <MapPinHouse className="h-4 w-4 text-gray-400" />
                      Local asociado (opcional)
                    </label>
                    <select
                      name="local_id"
                      value={form.local_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      disabled={loadingLocales}
                    >
                      <option value="" className="bg-slate-900 text-gray-300">
                        {loadingLocales
                          ? 'Cargando locales…'
                          : 'Sin local asociado'}
                      </option>
                      {locales.map((loc) => (
                        <option
                          key={loc.id}
                          value={loc.id}
                          className="bg-slate-900 text-white"
                        >
                          {loc.nombre} {loc.ciudad ? `- ${loc.ciudad}` : ''}{' '}
                          {loc.provincia ? `(${loc.provincia})` : ''}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Descripción
                    </label>
                    <input
                      name="descripcion"
                      value={form.descripcion}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: PV Principal local Monteros"
                    />
                  </motion.div>
                </div>

                {/* Activo */}
                <motion.label
                  variants={fieldV}
                  className="inline-flex items-center gap-3 select-none cursor-pointer"
                  htmlFor="pv-activo"
                >
                  <input
                    id="pv-activo"
                    type="checkbox"
                    name="activo"
                    checked={!!form.activo}
                    onChange={handle}
                    className="peer sr-only"
                  />
                  <span
                    className="relative inline-flex h-6 w-11 items-center rounded-full
                               bg-white/10 peer-checked:bg-emerald-500/70 transition-colors duration-200"
                    aria-hidden
                  >
                    <span
                      className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow
                                 peer-checked:translate-x-5 transition-transform duration-200"
                    />
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-200">
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                    Activo
                  </span>
                </motion.label>

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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {saving
                      ? 'Guardando…'
                      : isEdit
                      ? 'Guardar cambios'
                      : 'Crear punto de venta'}
                  </button>
                </motion.div>
              </motion.form>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400/80 via-teal-300/80 to-emerald-400/80 opacity-50 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
