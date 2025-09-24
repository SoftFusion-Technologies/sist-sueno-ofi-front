// src/Components/Cheques/ChequeraFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listBancoCuentas } from '../../api/bancoCuentas';
import Swal from 'sweetalert2';
const ESTADOS = ['activa', 'agotada', 'bloqueada', 'anulada'];

function getAxiosMsg(err) {
  return (
    err?.response?.data?.mensajeError ||
    err?.response?.data?.message ||
    err?.message ||
    'Ocurrió un error inesperado.'
  );
}

export default function ChequeraFormModal({
  open,
  onClose,
  onSubmit,
  initial
}) {
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);

  // Banco: sólo para filtrar cuentas en el selector (no se envía al backend)
  const [bancos, setBancos] = useState([]);
  const [cuentas, setCuentas] = useState([]);

  const [form, setForm] = useState({
    banco_id: '', // UI only
    banco_cuenta_id: '',
    descripcion: '',
    nro_desde: '',
    nro_hasta: '',
    proximo_nro: '',
    estado: 'activa'
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const bs = await listBancos({
        activo: '1',
        orderBy: 'nombre',
        orderDir: 'ASC',
        limit: 1000
      });
      const arrB = Array.isArray(bs) ? bs : bs.data || [];
      setBancos(arrB);
    })().catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const bid = form.banco_id || initial?.cuenta?.banco_id;
    (async () => {
      const cs = await listBancoCuentas({
        ...(bid ? { banco_id: bid } : {}),
        activo: '1',
        limit: 3000,
        orderBy: 'nombre_cuenta',
        orderDir: 'ASC'
      });
      const arrC = Array.isArray(cs) ? cs : cs.data || [];
      setCuentas(arrC);
    })().catch(() => {});
  }, [open, form.banco_id, initial?.cuenta?.banco_id]);

  useEffect(() => {
    if (open) {
      setForm({
        banco_id: initial?.cuenta?.banco_id ?? '',
        banco_cuenta_id: initial?.banco_cuenta_id ?? '',
        descripcion: initial?.descripcion ?? '',
        nro_desde: initial?.nro_desde ?? '',
        nro_hasta: initial?.nro_hasta ?? '',
        proximo_nro: initial?.proximo_nro ?? '',
        estado: initial?.estado ?? 'activa'
      });
    }
  }, [open, initial]);

  const cuentasFiltradas = useMemo(() => {
    if (!form.banco_id) return cuentas;
    return cuentas.filter((c) => String(c.banco_id) === String(form.banco_id));
  }, [cuentas, form.banco_id]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    // ── Validaciones de UI (mismas que tenías)
    if (!form.banco_cuenta_id) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta la cuenta bancaria',
        text: 'Seleccione una cuenta bancaria.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!form.descripcion?.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Descripción requerida',
        text: 'Complete la descripción.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const desde = Number(form.nro_desde);
    const hasta = Number(form.nro_hasta);

    if (!(desde > 0 && hasta > 0 && hasta >= desde)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Rango inválido',
        text: 'El rango de cheques es inválido.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    // Si proximo_nro viene vacío => NO lo enviamos (el backend usa nro_desde)
    const hasProx =
      form.proximo_nro !== '' &&
      form.proximo_nro !== null &&
      form.proximo_nro !== undefined;

    let proxNum;
    if (hasProx) {
      proxNum = Number(form.proximo_nro);
      if (!(proxNum >= desde && proxNum <= hasta)) {
        await Swal.fire({
          icon: 'warning',
          title: 'Próximo número fuera de rango',
          text: 'El próximo número debe estar dentro del rango.',
          confirmButtonColor: '#f59e0b'
        });
        return;
      }
    }

    const payload = {
      banco_cuenta_id: Number(form.banco_cuenta_id),
      descripcion: form.descripcion.trim(),
      nro_desde: desde,
      nro_hasta: hasta,
      ...(hasProx ? { proximo_nro: proxNum } : {}), // <- clave: si está vacío, no lo mandamos
      estado: form.estado
    };

    try {
      setSaving(true);
      await onSubmit(payload); // tu función create/update

      await Swal.fire({
        icon: 'success',
        title: hasProx ? 'Chequera guardada' : 'Chequera creada',
        text: `Rango ${desde}–${hasta}`,
        confirmButtonColor: '#10b981'
      });

      onClose();
    } catch (err) {
      const status = err?.response?.status;
      const msg = getAxiosMsg(err);

      if (status === 409) {
        await Swal.fire({
          icon: 'error',
          title: 'Rango en conflicto',
          text:
            msg ||
            'Existe otra chequera con rango que se superpone en esta cuenta bancaria.',
          footer:
            'Verificá que el rango no se superponga con otra chequera de la misma cuenta.',
          confirmButtonColor: '#ef4444'
        });
      } else if (status === 400) {
        await Swal.fire({
          icon: 'warning',
          title: 'Datos inválidos',
          text: msg,
          confirmButtonColor: '#f59e0b'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg,
          confirmButtonColor: '#ef4444'
        });
      }
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
              {isEdit ? 'Editar Chequera' : 'Nueva Chequera'}
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
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">(Todos)</option>
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
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handle}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Chequera 2025 CC$"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº desde *
                  </label>
                  <input
                    name="nro_desde"
                    value={form.nro_desde}
                    onChange={handle}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nº hasta *
                  </label>
                  <input
                    name="nro_hasta"
                    value={form.nro_hasta}
                    onChange={handle}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próximo Nº *
                  </label>
                  <input
                    name="proximo_nro"
                    value={form.proximo_nro}
                    onChange={handle}
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handle}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
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
