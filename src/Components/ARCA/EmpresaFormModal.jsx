// src/Components/Arca/EmpresaFormModal.jsx
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
  FileText,
  IdCard,
  MapPin,
  Mail,
  Phone,
  CalendarClock
} from 'lucide-react';
import { Alerts, getErrorMessage } from '../../utils/alerts';

const IVA_OPTIONS = [
  { value: 'RI', label: 'Responsable Inscripto' },
  { value: 'MONOTRIBUTO', label: 'Monotributo' },
  { value: 'EXENTO', label: 'Exento' },
  { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable' }
];

export default function EmpresaFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
    razon_social: '',
    nombre_fantasia: '',
    cuit: '',
    condicion_iva: 'RI',
    iibb: '',
    domicilio_fiscal: '',
    inicio_actividades: '',
    email_facturacion: '',
    telefono: '',
    estado: 'activa'
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;
  const titleId = 'empresa-modal-title';
  const formId = 'empresa-form';

  useEffect(() => {
    if (open) {
      setForm({
        razon_social: initial?.razon_social || '',
        nombre_fantasia: initial?.nombre_fantasia || '',
        cuit: initial?.cuit || '',
        condicion_iva: initial?.condicion_iva || 'RI',
        iibb: initial?.iibb || '',
        domicilio_fiscal: initial?.domicilio_fiscal || '',
        inicio_actividades: initial?.inicio_actividades
          ? String(initial.inicio_actividades).slice(0, 10)
          : '',
        email_facturacion: initial?.email_facturacion || '',
        telefono: initial?.telefono || '',
        estado: initial?.estado || 'activa'
      });
    }
  }, [open, initial]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

 const submit = async (e) => {
   e.preventDefault();

   if (!form.razon_social.trim() || !form.cuit.trim()) {
     await Alerts.error(
       'Validación',
       'La razón social y el CUIT son obligatorios.'
     );
     return;
   }

   try {
     setSaving(true);
     Alerts.loading(
       isEdit ? 'Actualizando empresa...' : 'Guardando empresa...'
     );

     await onSubmit(form);

     Alerts.close();
     Alerts.toastSuccess(isEdit ? 'Empresa actualizada' : 'Empresa creada');

     onClose();
   } catch (err) {
     Alerts.close();
     await Alerts.error(
       'No se pudo guardar',
       getErrorMessage(err, 'Error al guardar la empresa')
     );
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
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

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
                       bg-[conic-gradient(from_180deg_at_50%_50%,rgba(16,185,129,0.16),rgba(45,212,191,0.16),rgba(59,130,246,0.12),transparent,rgba(16,185,129,0.16))]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-16 size-[24rem] sm:size-[30rem] rounded-full blur-3xl opacity-35
                       bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.10),transparent_60%)]"
          />

          <motion.div
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-[92vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent"
              style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
            />

            <button
              onClick={onClose}
              className="absolute z-50 top-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg
                         bg-white/5 border border-white/10 hover:bg-white/10 transition"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-200" />
            </button>

            <div className="relative z-10 p-5 sm:p-6 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="mb-5 sm:mb-6 flex items-center gap-3"
              >
                <Building2 className="h-6 w-6 text-emerald-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit ? 'Editar empresa fiscal' : 'Nueva empresa fiscal'}
                </h3>
              </motion.div>

              <motion.form
                id={formId}
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Razón social */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Razón social <span className="text-emerald-300">*</span>
                  </label>
                  <input
                    name="razon_social"
                    value={form.razon_social}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    placeholder="Ej: El Sueño S.A."
                  />
                </motion.div>

                {/* Fantasía + CUIT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Nombre de fantasía
                    </label>
                    <input
                      name="nombre_fantasia"
                      value={form.nombre_fantasia}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: El Sueño Hogar"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <IdCard className="h-4 w-4 text-gray-400" />
                      CUIT <span className="text-emerald-300">*</span>
                    </label>
                    <input
                      name="cuit"
                      value={form.cuit}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="20123456789"
                    />
                  </motion.div>
                </div>

                {/* Condición IVA + IIBB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Condición frente al IVA
                    </label>
                    <select
                      name="condicion_iva"
                      value={form.condicion_iva}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      {IVA_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-slate-900 text-white"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      N° de IIBB
                    </label>
                    <input
                      name="iibb"
                      value={form.iibb}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: CM-1234-567890-1"
                    />
                  </motion.div>
                </div>

                {/* Domicilio + Inicio actividades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Domicilio fiscal
                    </label>
                    <input
                      name="domicilio_fiscal"
                      value={form.domicilio_fiscal}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Calle, número, localidad, provincia"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <CalendarClock className="h-4 w-4 text-gray-400" />
                      Inicio de actividades
                    </label>
                    <input
                      type="date"
                      name="inicio_actividades"
                      value={form.inicio_actividades}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    />
                  </motion.div>
                </div>

                {/* Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      Email de facturación
                    </label>
                    <input
                      name="email_facturacion"
                      value={form.email_facturacion}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="facturacion@empresa.com"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      Teléfono
                    </label>
                    <input
                      name="telefono"
                      value={form.telefono}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="+54 381 xxx xxxx"
                    />
                  </motion.div>
                </div>

                {/* Estado */}
                <motion.div variants={fieldV} className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-200">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handle}
                    className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white
                               focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                  >
                    <option value="activa" className="bg-slate-900 text-white">
                      Activa
                    </option>
                    <option
                      value="inactiva"
                      className="bg-slate-900 text-white"
                    >
                      Inactiva
                    </option>
                  </select>
                </motion.div>

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
                      : 'Crear empresa'}
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
