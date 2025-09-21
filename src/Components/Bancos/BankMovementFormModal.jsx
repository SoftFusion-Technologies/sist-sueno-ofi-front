// src/Components/Bancos/BankMovementFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listBancoCuentas } from '../../api/bancoCuentas';

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

  useEffect(() => {
    if (!open) return;
    (async () => {
      const bs = await listBancos({
        activo: '1',
        orderBy: 'nombre',
        orderDir: 'ASC',
        limit: 500
      });
      const arrB = Array.isArray(bs) ? bs : bs.data || [];
      setBancos(arrB);
    })().catch(() => {});
  }, [open]);

  // Cargar cuentas al seleccionar banco
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
      const arrC = Array.isArray(cs) ? cs : cs.data || [];
      setCuentas(arrC);
    })().catch(() => {});
  }, [open, form.banco_id, initial?.banco_id]);

  useEffect(() => {
    if (open) {
      setForm({
        banco_id: initial?.cuenta?.banco_id ?? initial?.banco_id ?? '',
        banco_cuenta_id: initial?.banco_cuenta_id ?? '',
        fecha: (initial?.fecha || new Date()).toString().slice(0, 10),
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
              {isEdit
                ? 'Editar Movimiento Bancario'
                : 'Nuevo Movimiento Bancario'}
            </h3>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banco
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
                    Cuenta *
                  </label>
                  <select
                    name="banco_cuenta_id"
                    value={form.banco_cuenta_id}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Seleccionar…</option>
                    {cuentasFiltradas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_cuenta}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="credito">Crédito</option>
                    <option value="debito">Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto *
                  </label>
                  <input
                    name="monto"
                    value={form.monto}
                    onChange={handle}
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handle}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Descripción del movimiento"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia Tipo
                  </label>
                  <select
                    name="referencia_tipo"
                    value={form.referencia_tipo}
                    onChange={handle}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {TIPOS_REF.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia ID
                  </label>
                  <input
                    name="referencia_id"
                    value={form.referencia_id}
                    onChange={handle}
                    type="number"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

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
