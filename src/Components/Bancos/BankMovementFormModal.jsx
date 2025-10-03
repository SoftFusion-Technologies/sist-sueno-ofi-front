// src/Components/Bancos/BankMovementFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listBancoCuentas } from '../../api/bancoCuentas';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../ui/animHelpers';
import {
  X,
  Landmark,
  Wallet,
  Calendar,
  Coins,
  FileText,
  Hash,
  Link2
} from 'lucide-react';

const TIPOS_REF = [
  'cheque',
  'transferencia',
  'venta',
  'compra',
  'pago',
  'deposito',
  'conciliacion',
  'otro'
];

export default function BankMovementFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);

  const [bancos, setBancos] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  const [form, setForm] = useState({
    banco_id: '',
    banco_cuenta_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: '',
    tipo: 'credito', // 'debito' | 'credito'
    monto: '',
    referencia_tipo: 'otro',
    referencia_id: ''
  });

  const titleId = 'bank-movement-modal-title';
  const formId = 'bank-movement-form';

  // Cargar bancos al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      const bs = await listBancos({
        activo: '1',
        orderBy: 'nombre',
        orderDir: 'ASC',
        limit: 500
      });
      const arrB = Array.isArray(bs) ? bs : bs?.data || [];
      setBancos(arrB);
    })().catch(() => setBancos([]));
  }, [open]);

  // Cargar cuentas cuando cambia banco
  useEffect(() => {
    if (!open) return;
    const bid = form.banco_id || initial?.banco_id;
    if (!bid) {
      setCuentas([]);
      return;
    }
    (async () => {
      const cs = await listBancoCuentas({
        banco_id: bid,
        activo: '1',
        limit: 500,
        orderBy: 'nombre_cuenta',
        orderDir: 'ASC'
      });
      const arrC = Array.isArray(cs) ? cs : cs?.data || [];
      setCuentas(arrC);
    })().catch(() => setCuentas([]));
  }, [open, form.banco_id, initial?.banco_id]);

  // Cargar valores iniciales
  useEffect(() => {
    if (open) {
      setForm({
        banco_id: initial?.cuenta?.banco_id ?? initial?.banco_id ?? '',
        banco_cuenta_id: initial?.banco_cuenta_id ?? '',
        fecha:
          (initial?.fecha &&
            new Date(initial.fecha).toISOString().slice(0, 10)) ||
          new Date().toISOString().slice(0, 10),
        descripcion: initial?.descripcion || '',
        tipo: Number(initial?.debito) > 0 ? 'debito' : 'credito',
        monto:
          Number(initial?.debito) > 0
            ? initial?.debito || ''
            : initial?.credito || '',
        referencia_tipo: initial?.referencia_tipo || 'otro',
        referencia_id: initial?.referencia_id || ''
      });
    }
  }, [open, initial]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.banco_cuenta_id) return alert('Seleccione una cuenta');
    const monto = Number(form.monto);
    if (!(monto > 0)) return alert('Monto debe ser > 0');

    const payload = {
      banco_cuenta_id: Number(form.banco_cuenta_id),
      fecha: form.fecha,
      descripcion: form.descripcion?.trim(),
      debito: form.tipo === 'debito' ? monto : 0,
      credito: form.tipo === 'credito' ? monto : 0,
      referencia_tipo: form.referencia_tipo,
      referencia_id: form.referencia_id ? Number(form.referencia_id) : null
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cuentasFiltradas = useMemo(() => {
    if (!form.banco_id) return cuentas;
    return cuentas.filter((c) => String(c.banco_id) === String(form.banco_id));
  }, [cuentas, form.banco_id]);

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
            className="relative w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl
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
                <Wallet className="h-6 w-6 text-gray-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit
                    ? 'Editar Movimiento Bancario'
                    : 'Nuevo Movimiento Bancario'}
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
                {/* Banco / Cuenta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Landmark className="h-4 w-4 text-gray-400" />
                      Banco
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
                      <Wallet className="h-4 w-4 text-gray-400" />
                      Cuenta <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="banco_cuenta_id"
                      value={form.banco_cuenta_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="" className="bg-gray-900">
                        Seleccionar…
                      </option>
                      {cuentasFiltradas.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-900">
                          {c.nombre_cuenta} {c.moneda ? `(${c.moneda})` : ''}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Fecha / Tipo / Monto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Fecha <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      type="date"
                      name="fecha"
                      value={form.fecha}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Tipo <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="tipo"
                      value={form.tipo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="credito" className="bg-gray-900">
                        Crédito
                      </option>
                      <option value="debito" className="bg-gray-900">
                        Débito
                      </option>
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Coins className="h-4 w-4 text-gray-400" />
                      Monto <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="monto"
                      value={form.monto}
                      onChange={handle}
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>
                </div>

                {/* Descripción */}
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
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Descripción del movimiento"
                  />
                </motion.div>

                {/* Referencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Link2 className="h-4 w-4 text-gray-400" />
                      Referencia Tipo
                    </label>
                    <select
                      name="referencia_tipo"
                      value={form.referencia_tipo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      {TIPOS_REF.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">
                          {t}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      Referencia ID
                    </label>
                    <input
                      name="referencia_id"
                      value={form.referencia_id}
                      onChange={handle}
                      type="number"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="(Opcional)"
                    />
                  </motion.div>
                </div>

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
