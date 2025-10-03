// src/Components/Bancos/BankAccountFormModal.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import {
  X,
  Landmark,
  Coins,
  UserCircle2,
  Hash,
  CreditCard,
  KeySquare,
  BadgeCheck
} from 'lucide-react';

const MONEDAS = ['ARS', 'USD', 'EUR', 'OTRA'];

export default function BankAccountFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const [form, setForm] = useState({
    banco_id: '',
    nombre_cuenta: '',
    moneda: 'ARS',
    numero_cuenta: '',
    cbu: '',
    alias_cbu: '',
    activo: true
  });
  const [saving, setSaving] = useState(false);
  const [bancos, setBancos] = useState([]);
  const isEdit = !!initial?.id;
  const titleId = 'bank-account-modal-title';
  const formId = 'bank-account-form';

  // Carga bancos al abrir
  useEffect(() => {
    if (!open) return;
    listBancos({ activo: '1', limit: 500, orderBy: 'nombre', orderDir: 'ASC' })
      .then((data) => setBancos(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setBancos([]));
  }, [open]);

  // Carga estado inicial al abrir
  useEffect(() => {
    if (open) {
      setForm({
        banco_id: initial?.banco_id ?? '',
        nombre_cuenta: initial?.nombre_cuenta || '',
        moneda: initial?.moneda || 'ARS',
        numero_cuenta: initial?.numero_cuenta || '',
        cbu: initial?.cbu || '',
        alias_cbu: initial?.alias_cbu || '',
        activo: initial?.activo ?? true
      });
    }
  }, [open, initial]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.banco_id) return alert('Seleccione un banco');
    if (!form.nombre_cuenta.trim())
      return alert('El nombre/titular de la cuenta es obligatorio');
    try {
      setSaving(true);
      await onSubmit({
        ...form,
        banco_id: Number(form.banco_id) || form.banco_id
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
                       bg-[conic-gradient(from_180deg_at_50%_50%,rgba(59,130,246,0.14),rgba(6,182,212,0.12),rgba(99,102,241,0.12),transparent,rgba(6,182,212,0.12))]"
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
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-lg
                       max-h-[85vh] overflow-y-auto overscroll-contain
                       rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
          >
            {/* Borde metálico */}
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
                <Landmark className="h-6 w-6 text-gray-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                </h3>
              </motion.div>

              {/* FORM con stagger y fields que suben */}
              <motion.form
                id={formId}
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Banco / Moneda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Landmark className="h-4 w-4 text-gray-400" />
                      Banco <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="banco_id"
                      value={form.banco_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="" className="bg-gray-900">
                        Seleccionar…
                      </option>
                      {bancos.map((b) => (
                        <option key={b.id} value={b.id} className="bg-gray-900">
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Coins className="h-4 w-4 text-gray-400" />
                      Moneda <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="moneda"
                      value={form.moneda}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      {MONEDAS.map((m) => (
                        <option key={m} value={m} className="bg-gray-900">
                          {m}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Nombre / Titular */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <UserCircle2 className="h-4 w-4 text-gray-400" />
                    Nombre / Titular de la cuenta{' '}
                    <span className="text-cyan-300">*</span>
                  </label>
                  <input
                    name="nombre_cuenta"
                    value={form.nombre_cuenta}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Cta Cte $ Casa Central"
                  />
                </motion.div>

                {/* Número / Alias CBU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      N° de cuenta
                    </label>
                    <input
                      name="numero_cuenta"
                      value={form.numero_cuenta}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="449-002566/3"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <KeySquare className="h-4 w-4 text-gray-400" />
                      Alias CBU
                    </label>
                    <input
                      name="alias_cbu"
                      value={form.alias_cbu}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="MI.CBU.ALIAS"
                    />
                  </motion.div>
                </div>

                {/* CBU */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    CBU
                  </label>
                  <input
                    name="cbu"
                    value={form.cbu}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="00000000-0000000000000000000000"
                  />
                </motion.div>

                {/* Activo (switch) */}
                <motion.label
                  variants={fieldV}
                  className="inline-flex items-center gap-3 select-none cursor-pointer"
                  htmlFor="bank-account-activo"
                >
                  <input
                    id="bank-account-activo"
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
                  <span className="text-sm text-gray-200">Activo</span>
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
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {saving
                      ? 'Guardando…'
                      : isEdit
                      ? 'Guardar cambios'
                      : 'Crear'}
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
