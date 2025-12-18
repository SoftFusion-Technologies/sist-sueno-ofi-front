// src/Components/Compras/StockMovimientos/StockMovimientoFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, PackagePlus, Hash, FileText, BadgeCheck } from 'lucide-react';
import { Alerts, getErrorMessage } from '../../../utils/alerts';
import { TIPOS, MONEDAS } from './ui';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV
} from '../../../ui/animHelpers';

const toInt = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
};

const toMoney = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

function guardDeltaByTipo(tipo, delta) {
  const d = Number(delta);
  if (!Number.isFinite(d) || d === 0)
    return 'delta debe ser un entero distinto de 0';

  if (['COMPRA', 'DEVOLUCION_CLIENTE', 'RECEPCION_OC'].includes(tipo)) {
    if (!(d > 0)) return `Para tipo ${tipo}, delta debe ser > 0`;
  }
  if (['VENTA', 'DEVOLUCION_PROVEEDOR'].includes(tipo)) {
    if (!(d < 0)) return `Para tipo ${tipo}, delta debe ser < 0`;
  }
  return null;
}

export default function StockMovimientoFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const isEdit = false; // en este módulo NO editamos el movimiento, sólo creamos. Notas se editan aparte.
  const titleId = 'stock-mov-form-title';

  const [form, setForm] = useState({
    producto_id: '',
    local_id: '',
    lugar_id: '',
    estado_id: '',
    tipo: 'AJUSTE',
    delta: '',
    costo_unit_neto: '',
    moneda: 'ARS',
    ref_tabla: '',
    ref_id: '',
    notas: ''
  });

  const [saving, setSaving] = useState(false);

  const needsRef = useMemo(() => form.tipo !== 'AJUSTE', [form.tipo]);

  useEffect(() => {
    if (!open) return;
    setForm({
      producto_id: initial?.producto_id ?? '',
      local_id: initial?.local_id ?? '',
      lugar_id: initial?.lugar_id ?? '',
      estado_id: initial?.estado_id ?? '',
      tipo: initial?.tipo ?? 'AJUSTE',
      delta: initial?.delta ?? '',
      costo_unit_neto: initial?.costo_unit_neto ?? '',
      moneda: initial?.moneda ?? 'ARS',
      ref_tabla: initial?.ref_tabla ?? '',
      ref_id: initial?.ref_id ?? '',
      notas: initial?.notas ?? ''
    });
  }, [open, initial]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    const producto_id = toInt(form.producto_id);
    const local_id = toInt(form.local_id);
    const lugar_id = toInt(form.lugar_id);
    const estado_id = toInt(form.estado_id);

    if (!producto_id)
      return Alerts.error('Validación', 'producto_id es obligatorio.');
    if (!local_id)
      return Alerts.error('Validación', 'local_id es obligatorio.');

    const tipo = String(form.tipo || '').toUpperCase();
    if (!TIPOS.includes(tipo))
      return Alerts.error('Validación', 'tipo inválido.');

    const delta = toInt(form.delta);
    if (!delta || delta === 0)
      return Alerts.error('Validación', 'delta debe ser distinto de 0.');

    const deltaErr = guardDeltaByTipo(tipo, delta);
    if (deltaErr) return Alerts.error('Validación', deltaErr);

    const moneda = form.moneda || 'ARS';
    if (!MONEDAS.includes(moneda))
      return Alerts.error('Validación', 'moneda inválida.');

    const ref_tabla = (form.ref_tabla || '').trim() || null;
    const ref_id = toInt(form.ref_id);

    if (needsRef) {
      if (!ref_tabla || !ref_id) {
        return Alerts.error(
          'Validación',
          'ref_tabla y ref_id son obligatorios cuando tipo != AJUSTE.'
        );
      }
    }

    const costo_unit_neto = toMoney(form.costo_unit_neto);
    if (costo_unit_neto != null && costo_unit_neto < 0) {
      return Alerts.error('Validación', 'costo_unit_neto debe ser >= 0.');
    }

    const payload = {
      producto_id,
      local_id,
      lugar_id: lugar_id || null,
      estado_id: estado_id || null,
      tipo,
      delta,
      costo_unit_neto: costo_unit_neto == null ? null : costo_unit_neto,
      moneda,
      ref_tabla,
      ref_id: ref_id || null,
      notas: (form.notas || '').trim() || null
    };

    try {
      setSaving(true);
      Alerts.loading('Registrando movimiento...');
      await onSubmit(payload);
      Alerts.close();
      Alerts.toastSuccess('Movimiento registrado');
      onClose();
    } catch (err) {
      Alerts.close();
      await Alerts.error(
        'No se pudo guardar',
        getErrorMessage(err, 'Error al crear el movimiento')
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

          {/* Ambient */}
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
                       bg-[conic-gradient(from_180deg_at_50%_50%,rgba(16,185,129,0.16),rgba(6,182,212,0.12),rgba(99,102,241,0.10),transparent,rgba(16,185,129,0.12))]"
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
            className="relative w-full max-w-[94vw] sm:max-w-2xl
                       max-h-[88vh] overflow-y-auto overscroll-contain
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
              <div className="mb-5 sm:mb-6 flex items-center gap-3">
                <PackagePlus className="h-6 w-6 text-gray-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit ? 'Editar Movimiento' : 'Nuevo Movimiento de Stock'}
                </h3>
              </div>

              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* IDs base */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      Producto ID <span className="text-emerald-300">*</span>
                    </label>
                    <input
                      name="producto_id"
                      value={form.producto_id}
                      onChange={handle}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 15"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      Local ID <span className="text-emerald-300">*</span>
                    </label>
                    <input
                      name="local_id"
                      value={form.local_id}
                      onChange={handle}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 1"
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Lugar ID (opcional)
                    </label>
                    <input
                      name="lugar_id"
                      value={form.lugar_id}
                      onChange={handle}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 3"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Estado ID (opcional)
                    </label>
                    <input
                      name="estado_id"
                      value={form.estado_id}
                      onChange={handle}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 1"
                    />
                  </motion.div>
                </div>

                {/* Tipo / Delta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <BadgeCheck className="h-4 w-4 text-gray-400" />
                      Tipo <span className="text-emerald-300">*</span>
                    </label>
                    <select
                      name="tipo"
                      value={form.tipo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t} className="bg-zinc-900">
                          {t}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-400">
                      Regla: COMPRA/DEV. CLIENTE/RECEPCIÓN OC = delta &gt; 0 |
                      VENTA/DEV. PROVEEDOR = delta &lt; 0
                    </p>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Delta <span className="text-emerald-300">*</span>
                    </label>
                    <input
                      name="delta"
                      value={form.delta}
                      onChange={handle}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 5 (entra) o -2 (sale)"
                    />
                  </motion.div>
                </div>

                {/* Costo / Moneda */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Costo unit neto (opcional)
                    </label>
                    <input
                      name="costo_unit_neto"
                      value={form.costo_unit_neto}
                      onChange={handle}
                      inputMode="decimal"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder="Ej: 12000.50"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Moneda
                    </label>
                    <select
                      name="moneda"
                      value={form.moneda}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    >
                      {MONEDAS.map((m) => (
                        <option key={m} value={m} className="bg-zinc-900">
                          {m}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Ref */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      ref_tabla{' '}
                      {needsRef && <span className="text-emerald-300">*</span>}
                    </label>
                    <input
                      name="ref_tabla"
                      value={form.ref_tabla}
                      onChange={handle}
                      disabled={!needsRef}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 disabled:opacity-60
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder={
                        needsRef
                          ? 'Ej: compras / ventas / recepciones'
                          : 'No requerido para AJUSTE'
                      }
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      ref_id{' '}
                      {needsRef && <span className="text-emerald-300">*</span>}
                    </label>
                    <input
                      name="ref_id"
                      value={form.ref_id}
                      onChange={handle}
                      disabled={!needsRef}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 disabled:opacity-60
                                 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                      placeholder={
                        needsRef ? 'Ej: 123' : 'No requerido para AJUSTE'
                      }
                    />
                  </motion.div>
                </div>

                {/* Notas */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    name="notas"
                    value={form.notas}
                    onChange={handle}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 focus:border-transparent"
                    placeholder="Motivo / aclaración del movimiento…"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Máx. 300 caracteres.
                  </p>
                </motion.div>

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
                    {saving ? 'Guardando…' : 'Crear movimiento'}
                  </button>
                </motion.div>
              </motion.form>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-gray-400/70 via-gray-200/70 to-gray-400/70 opacity-40 rounded-b-2xl" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
