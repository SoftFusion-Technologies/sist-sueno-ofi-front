// src/Components/Tesoreria/TesoFlujoFormModal.jsx
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Swal from 'sweetalert2';

const defaultForm = {
  fecha: new Date().toISOString().slice(0, 10),
  signo: 'ingreso',
  monto: '',
  origen_tipo: 'otro',
  origen_id: '',
  descripcion: ''
};

export default function TesoFlujoFormModal({
  open,
  onClose,
  initial,
  onSubmit
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        fecha: initial.fecha || defaultForm.fecha,
        signo: initial.signo || 'ingreso',
        monto: initial.monto || '',
        origen_tipo: initial.origen_tipo || 'otro',
        origen_id: initial.origen_id ?? '',
        descripcion: initial.descripcion || ''
      });
    } else {
      setForm(defaultForm);
    }
  }, [open, isEdit, initial]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.fecha) {
      Swal.fire('Validación', 'La fecha es requerida', 'warning');
      return;
    }
    if (!['ingreso', 'egreso'].includes(form.signo)) {
      Swal.fire('Validación', 'El signo debe ser ingreso o egreso', 'warning');
      return;
    }
    const monto = Number(form.monto);
    if (!(monto > 0)) {
      Swal.fire('Validación', 'El monto debe ser mayor a 0', 'warning');
      return;
    }

    const payload = {
      fecha: form.fecha,
      signo: form.signo,
      monto,
      origen_tipo: form.origen_tipo || 'otro',
      origen_id: form.origen_id ? Number(form.origen_id) : 0,
      descripcion: form.descripcion?.trim() || null
    };

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.form
            onSubmit={submit}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[100svh] sm:max-h-[90vh] flex flex-col"
          >
            <div className="px-4 sm:px-6 py-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-800">
                {isEdit ? 'Editar proyección' : 'Nueva proyección'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Signo *</label>
                  <select
                    name="signo"
                    value={form.signo}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                    required
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Monto *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto"
                    value={form.monto}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Origen</label>
                  <select
                    name="origen_tipo"
                    value={form.origen_tipo}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                  >
                    <option value="cheque">Cheque</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Origen ID</label>
                  <input
                    type="number"
                    name="origen_id"
                    value={form.origen_id}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="ID del origen (opcional)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handle}
                    className="w-full rounded-xl border px-3 py-2"
                    rows={3}
                    placeholder="Detalle opcional"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-4 border-t bg-white sticky bottom-0 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
