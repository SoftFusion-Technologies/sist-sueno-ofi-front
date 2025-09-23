// src/Components/Cheques/ChequeTransitionModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SearchableSelect from '../Common/SearchableSelect';
import { listBancoCuentas } from '../../api/bancoCuentas';
import { listBancos } from '../../api/bancos';
import { listProveedores } from '../../api/terceros';
import { getUserId } from '../../utils/authUtils';
import {
  FaMoneyCheckAlt,
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const ACTION_META = {
  depositar: { label: 'Depositar', grad: 'from-sky-700 to-sky-500' },
  acreditar: { label: 'Acreditar', grad: 'from-emerald-700 to-emerald-500' },
  rechazar: { label: 'Rechazar', grad: 'from-rose-700 to-rose-500' },
  'aplicar-a-proveedor': {
    label: 'Aplicar',
    grad: 'from-amber-700 to-amber-500'
  },
  entregar: { label: 'Entregar', grad: 'from-fuchsia-700 to-fuchsia-500' },
  compensar: { label: 'Compensar', grad: 'from-cyan-700 to-cyan-500' },
  anular: { label: 'Anular', grad: 'from-zinc-700 to-zinc-500' }
};

const chipTipo = (t = 'recibido') =>
  t === 'emitido'
    ? 'bg-amber-100 text-amber-700 border border-amber-200'
    : 'bg-sky-100 text-sky-700 border border-sky-200';

const chipEstado = (e = 'registrado') =>
  ({
    registrado: 'bg-gray-100 text-gray-700 border border-gray-200',
    en_cartera: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    aplicado_a_compra: 'bg-amber-100 text-amber-700 border border-amber-200',
    endosado: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    depositado: 'bg-blue-100 text-blue-700 border border-blue-200',
    acreditado: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rechazado: 'bg-rose-100 text-rose-700 border border-rose-200',
    anulado: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
    entregado: 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
    compensado: 'bg-teal-100 text-teal-700 border border-teal-200'
  }[e] || 'bg-gray-100 text-gray-700 border border-gray-200');

export default function ChequeTransitionModal({
  open,
  onClose,
  action,
  onConfirm,
  item
}) {
  const meta = ACTION_META[action] || {
    label: 'Acción',
    grad: 'from-zinc-700 to-zinc-500'
  };
  const isEmitido = item?.tipo === 'emitido';

  // ───────────────────────────────── state
  const [payload, setPayload] = useState({
    fecha_operacion: '',
    motivo_estado: '',
    proveedor_id: item?.proveedor_id || '',
    destinatario: '',
    banco_cuenta_id: ''
  });

  const [cuentas, setCuentas] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedorNombre, setProveedorNombre] = useState('');

  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [loadingCuentas, setLoadingCuentas] = useState(false);
  const [errorProveedores, setErrorProveedores] = useState('');
  const [errorCuentas, setErrorCuentas] = useState('');

  // ───────────────────────────────── etiquetas
  const label = useMemo(() => meta.label, [meta.label]);

  // ¿Acción requiere cuenta bancaria propia?
  const requiereCuenta =
    action === 'depositar' ||
    action === 'acreditar' ||
    action === 'rechazar' ||
    (action === 'compensar' && isEmitido);

  // ───────────────────────────────── helpers
  const bancoNombre = (id) =>
    bancos.find((b) => Number(b.id) === Number(id))?.nombre || `Banco #${id}`;

  const shouldLoadProveedores =
    (action === 'aplicar-a-proveedor' && item?.tipo === 'recibido') ||
    (action === 'entregar' && isEmitido);

  // ───────────────────────────────── efectos: inicial
  useEffect(() => {
    if (!open) return;

    setPayload((p) => ({
      ...p,
      fecha_operacion:
        p.fecha_operacion || new Date().toISOString().slice(0, 10),
      banco_cuenta_id: requiereCuenta ? p.banco_cuenta_id : ''
    }));

    // Cuentas/Bancos si hace falta
    (async () => {
      if (!requiereCuenta) return;
      setLoadingCuentas(true);
      setErrorCuentas('');
      try {
        const [cs, bs] = await Promise.all([
          listBancoCuentas({
            activo: '1',
            orderBy: 'nombre_cuenta',
            orderDir: 'ASC',
            limit: 5000
          }),
          listBancos({
            activo: '1',
            orderBy: 'nombre',
            orderDir: 'ASC',
            limit: 5000
          })
        ]);
        const arrC = Array.isArray(cs)
          ? cs
          : Array.isArray(cs?.data)
          ? cs.data
          : cs?.data?.data || [];
        const arrB = Array.isArray(bs)
          ? bs
          : Array.isArray(bs?.data)
          ? bs.data
          : bs?.data?.data || [];
        setCuentas(arrC);
        setBancos(arrB);
        if (arrC.length === 1) {
          setPayload((p) => ({ ...p, banco_cuenta_id: arrC[0].id }));
        }
      } catch (err) {
        setErrorCuentas('No se pudieron cargar las cuentas/bancos.');
      } finally {
        setLoadingCuentas(false);
      }
    })();
  }, [open, requiereCuenta]);

  // ───────────────────────────────── efectos: proveedores (aplicar RECIBIDO / entregar EMITIDO)
  useEffect(() => {
    if (!open || !shouldLoadProveedores) return;

    setLoadingProveedores(true);
    setErrorProveedores('');
    (async () => {
      try {
        const res = await listProveedores({
          activo: '1',
          limit: 5000,
          orderBy: 'nombre',
          orderDir: 'ASC'
        });
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];
        setProveedores(arr);

        // Preselección si ya hay proveedor
        const provIdActual = Number(
          item?.proveedor_id || payload.proveedor_id || 0
        );
        if (provIdActual) {
          setPayload((p) => ({ ...p, proveedor_id: provIdActual }));
          const pSel = arr.find((x) => Number(x.id) === provIdActual);
          const nombre =
            pSel?.nombre || pSel?.razon_social || `ID ${provIdActual}`;
          setProveedorNombre(nombre);
          // prellenamos destinatario si no lo tiene
          setPayload((p) => ({ ...p, destinatario: p.destinatario || nombre }));
        } else {
          setProveedorNombre('');
        }
      } catch (err) {
        setErrorProveedores('No se pudieron cargar los proveedores.');
      } finally {
        setLoadingProveedores(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shouldLoadProveedores, item?.proveedor_id]);

  // ───────────────────────────────── submit
  const submit = async (e) => {
    e.preventDefault();

    // Validaciones por acción
    if (requiereCuenta && !payload.banco_cuenta_id) {
      alert('Debe seleccionar la cuenta bancaria destino.');
      return;
    }

    // ENTREGAR (emitido): proveedor obligatorio
    if (action === 'entregar' && isEmitido) {
      const provId = Number(payload.proveedor_id || item?.proveedor_id || 0);
      if (!provId) {
        alert(
          'Debe seleccionar el proveedor para entregar este cheque emitido.'
        );
        return;
      }
      // autocompletar destinatario si falta
      if (!payload.destinatario) {
        const pSel = proveedores.find((x) => Number(x.id) === provId);
        const nombre =
          pSel?.nombre || pSel?.razon_social || `Proveedor ${provId}`;
        setPayload((p) => ({ ...p, destinatario: nombre }));
      }
    }

    // APLICAR A PROVEEDOR (recibido): proveedor obligatorio
    if (action === 'aplicar-a-proveedor' && item?.tipo === 'recibido') {
      const provId = Number(payload.proveedor_id || 0);
      if (!provId) {
        alert(
          'Debe seleccionar el proveedor para aplicar este cheque recibido.'
        );
        return;
      }
    }

    const finalPayload = { ...payload };

    // Fecha por si quedó vacía
    if (!finalPayload.fecha_operacion) {
      finalPayload.fecha_operacion = new Date().toISOString().slice(0, 10);
    }

    // Aplicar a proveedor: no requiere cuenta
    if (action === 'aplicar-a-proveedor') {
      if (item?.tipo === 'emitido') {
        // Emitidos: usar el del cheque o el elegido si lo hubiere
        finalPayload.proveedor_id =
          Number(item?.proveedor_id || finalPayload.proveedor_id || 0) || null;
      }
      delete finalPayload.banco_cuenta_id;
    }

    // Usuario para auditoría/log
    const uid = Number(getUserId() || 0);
    if (uid) finalPayload.usuario_log_id = uid;

    await onConfirm(finalPayload);
    onClose();
  };

  // ───────────────────────────────── ayudas contextuales por acción
  const Hint = () => {
    if (action === 'aplicar-a-proveedor' && item?.tipo === 'recibido') {
      return (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <FaInfoCircle className="mt-0.5" />
          <p className="text-sm">
            <strong>Endoso:</strong> el cheque recibido se aplicará a un
            proveedor. No se proyectará depósito en tu flujo de fondos.
          </p>
        </div>
      );
    }
    if (action === 'entregar' && isEmitido) {
      return (
        <div className="flex items-start gap-2 text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3">
          <FaInfoCircle className="mt-0.5" />
          <p className="text-sm">
            <strong>Entrega:</strong> registra la entrega física del cheque
            emitido. La salida efectiva de fondos se registra al{' '}
            <em>compensar</em>.
          </p>
        </div>
      );
    }
    if (requiereCuenta) {
      return (
        <div className="flex items-start gap-2 text-sky-700 bg-sky-50 border border-sky-200 rounded-xl p-3">
          <FaInfoCircle className="mt-0.5" />
          <p className="text-sm">
            Esta acción requiere seleccionar una{' '}
            <strong>cuenta bancaria destino</strong>.
          </p>
        </div>
      );
    }
    return null;
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
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet / Modal */}
          <motion.form
            onSubmit={submit}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
            className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl
                       max-h-[100svh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div
              className={`px-5 py-4 border-b bg-gradient-to-r ${meta.grad} text-white`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  <FaMoneyCheckAlt />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">
                    {label} — Cheque #{item?.numero}
                  </h3>
                  <div className="text-white/90 text-sm truncate">
                    {item?.banco?.nombre || '—'} •{' '}
                    {item?.chequera?.descripcion || '—'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25"
                >
                  Cerrar
                </button>
              </div>

              {/* chips contextuales */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs ${chipTipo(
                    item?.tipo
                  )}`}
                >
                  {item?.tipo || '—'}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs ${chipEstado(
                    item?.estado
                  )}`}
                >
                  {item?.estado || '—'}
                </span>
              </div>
            </div>

            {/* Content (scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              <Hint />

              {/* fila 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold">
                    Fecha operación
                  </label>
                  <input
                    type="date"
                    value={payload.fecha_operacion || ''}
                    onChange={(e) =>
                      setPayload((p) => ({
                        ...p,
                        fecha_operacion: e.target.value
                      }))
                    }
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>

                {/* ENTREGAR (EMITIDO): selector proveedor */}
                {action === 'entregar' && isEmitido && (
                  <SearchableSelect
                    label="Proveedor *"
                    items={proveedores}
                    value={payload.proveedor_id}
                    onChange={(id, opt) => {
                      const nombre = opt?.nombre || opt?.razon_social || '';
                      setPayload((p) => ({
                        ...p,
                        proveedor_id: id ? Number(id) : '',
                        destinatario: nombre || p.destinatario
                      }));
                      setProveedorNombre(nombre);
                    }}
                    getOptionLabel={(p) => p?.nombre || p?.razon_social || ''}
                    getOptionValue={(p) => p?.id}
                    placeholder={
                      loadingProveedores
                        ? 'Cargando proveedores…'
                        : errorProveedores
                        ? 'No se pudo cargar'
                        : 'Seleccionar proveedor…'
                    }
                    disabled={loadingProveedores || !!errorProveedores}
                    portal
                    portalZIndex={5000}
                    menuPlacement="auto"
                    required
                  />
                )}

                {/* ENTREGAR (RECIBIDO): destinatario libre */}
                {action === 'entregar' && !isEmitido && (
                  <div>
                    <label className="block text-sm font-semibold">
                      Destinatario
                    </label>
                    <input
                      value={payload.destinatario}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          destinatario: e.target.value
                        }))
                      }
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="Tercero"
                    />
                  </div>
                )}
              </div>

              {/* APLICAR A PROVEEDOR (RECIBIDO): selector proveedor */}
              {action === 'aplicar-a-proveedor' &&
                item?.tipo === 'recibido' && (
                  <SearchableSelect
                    label="Proveedor *"
                    items={proveedores}
                    value={payload.proveedor_id}
                    onChange={(id) =>
                      setPayload((p) => ({
                        ...p,
                        proveedor_id: Number(id) || ''
                      }))
                    }
                    getOptionLabel={(p) => p?.nombre || p?.razon_social || ''}
                    getOptionValue={(p) => p?.id}
                    placeholder={
                      loadingProveedores
                        ? 'Cargando proveedores…'
                        : errorProveedores
                        ? 'No se pudo cargar'
                        : 'Seleccionar proveedor…'
                    }
                    disabled={loadingProveedores || !!errorProveedores}
                    required
                    portal
                    portalZIndex={5000}
                  />
                )}

              {/* Cuenta bancaria (según acción) */}
              {requiereCuenta && (
                <SearchableSelect
                  label="Cuenta bancaria destino *"
                  items={cuentas}
                  value={payload.banco_cuenta_id}
                  onChange={(id) =>
                    setPayload((p) => ({
                      ...p,
                      banco_cuenta_id: id ? Number(id) : ''
                    }))
                  }
                  getOptionValue={(c) => c?.id}
                  getOptionLabel={(c) =>
                    c
                      ? `${c.nombre_cuenta} • ${c.moneda} • ${bancoNombre(
                          c.banco_id
                        )}`
                      : ''
                  }
                  placeholder={
                    loadingCuentas
                      ? 'Cargando cuentas…'
                      : errorCuentas
                      ? 'No se pudo cargar'
                      : 'Seleccionar cuenta…'
                  }
                  disabled={loadingCuentas || !!errorCuentas}
                  portal
                  portalZIndex={5000}
                  menuPlacement="auto"
                />
              )}

              {/* Motivo / Nota */}
              <div>
                <label className="block text-sm font-semibold">
                  Motivo / Nota
                </label>
                <textarea
                  value={payload.motivo_estado}
                  onChange={(e) =>
                    setPayload((p) => ({ ...p, motivo_estado: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Detalle o aclaración (opcional)"
                />
              </div>

              {/* warnings sutiles */}
              {errorProveedores && (
                <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <FaExclamationTriangle className="mt-0.5" />
                  <p className="text-sm">{errorProveedores}</p>
                </div>
              )}
              {errorCuentas && (
                <div className="flex items-start gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <FaExclamationTriangle className="mt-0.5" />
                  <p className="text-sm">{errorCuentas}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-white sticky bottom-0 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Confirmar
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
