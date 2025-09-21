// src/Components/Bancos/BankAccountFormModal.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listBancos } from '../../api/bancos';

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

  useEffect(() => {
    if (!open) return;
    // carga bancos para combo
    listBancos({ activo: '1', limit: 500, orderBy: 'nombre', orderDir: 'ASC' })
      .then((data) => setBancos(Array.isArray(data) ? data : data.data || []))
      .catch(() => setBancos([]));
  }, [open]);

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
      return alert('El nombre de la cuenta es obligatorio');
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            className="relative w-full max-w-xl bg-white rounded-2xl p-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {isEdit ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </h3>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banco *
                  </label>
                  <select
                    name="banco_id"
                    value={form.banco_id}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Seleccionar…</option>
                    {bancos.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda *
                  </label>
                  <select
                    name="moneda"
                    value={form.moneda}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la cuenta *
                </label>
                <input
                  name="nombre_cuenta"
                  value={form.nombre_cuenta}
                  onChange={handle}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Cta Cte $ Casa Central"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° de cuenta
                  </label>
                  <input
                    name="numero_cuenta"
                    value={form.numero_cuenta}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alias CBU
                  </label>
                  <input
                    name="alias_cbu"
                    value={form.alias_cbu}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CBU
                </label>
                <input
                  name="cbu"
                  value={form.cbu}
                  onChange={handle}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="activo"
                  checked={!!form.activo}
                  onChange={handle}
                />
                <span className="text-sm text-gray-700">Activo</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
