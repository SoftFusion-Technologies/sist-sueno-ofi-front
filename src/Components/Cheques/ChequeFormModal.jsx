// src/Components/Cheques/ChequeFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listChequeras } from '../../api/chequeras';
import { listBancoCuentas } from '../../api/bancoCuentas';
import { listClientes, listProveedores, listVentas } from '../../api/terceros';
import SearchableSelect from '../Common/SearchableSelect';

const TIPOS = ['recibido', 'emitido'];
const CANALES = ['C1', 'C2'];
const ESTADOS = [
  'registrado',
  'en_cartera',
  'aplicado_a_compra',
  'endosado',
  'depositado',
  'acreditado',
  'rechazado',
  'anulado',
  'entregado',
  'compensado'
];

const fmtVenta = (v) => {
  if (!v) return '';
  const code = v.codigo || v.comprobante || v.numero || `ID ${v.id}`;
  const nom = v.cliente_nombre || v.cliente || v.nombre || '';
  const fecha = v.fecha || v.created_at || '';
  return [code, nom, fecha].filter(Boolean).join(' • ');
};
const fmtTercero = (t) => {
  if (!t) return '';
  const nom = t.nombre || t.razon_social || '';
  const doc = t.cuit || t.documento || '';
  return [nom, doc].filter(Boolean).join(' • ');
};

export default function ChequeFormModal({ open, onClose, onSubmit, initial }) {
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);

  const [bancos, setBancos] = useState([]);
  const [chequeras, setChequeras] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ventas, setVentas] = useState([]);

  const [form, setForm] = useState({
    tipo: 'recibido',
    canal: 'C1',
    banco_id: '',
    chequera_id: '',
    numero: '',
    monto: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    fecha_cobro_prevista: '',
    cliente_id: '',
    proveedor_id: '',
    venta_id: '',
    beneficiario_nombre: '',
    estado: 'registrado',
    motivo_estado: '',
    observaciones: ''
  });

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [bs, ch, cs, cls, pvs, vts] = await Promise.all([
        listBancos({
          activo: '1',
          orderBy: 'nombre',
          orderDir: 'ASC',
          limit: 5000
        }),
        listChequeras({ orderBy: 'created_at', orderDir: 'DESC', limit: 5000 }),
        listBancoCuentas({
          activo: '1',
          orderBy: 'nombre_cuenta',
          orderDir: 'ASC',
          limit: 5000
        }),
        listClientes({ limit: 5000, orderBy: 'nombre', orderDir: 'ASC' }),
        listProveedores({ limit: 5000, orderBy: 'nombre', orderDir: 'ASC' }),
        listVentas({ limit: 5000, orderBy: 'created_at', orderDir: 'DESC' })
      ]);
      setBancos(Array.isArray(bs) ? bs : bs.data || []);
      setChequeras(Array.isArray(ch) ? ch : ch.data || []);
      setCuentas(Array.isArray(cs) ? cs : cs.data || []);
      setClientes(Array.isArray(cls) ? cls : cls.data || []);
      setProveedores(Array.isArray(pvs) ? pvs : pvs.data || []);
      setVentas(Array.isArray(vts) ? vts : vts.data || []);
    })().catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) {
      setForm({
        tipo: initial?.tipo ?? 'recibido',
        canal: initial?.canal ?? 'C1',
        banco_id: initial?.banco_id ?? '',
        chequera_id: initial?.chequera_id ?? '',
        numero: initial?.numero ?? '',
        monto: initial?.monto ?? '',
        fecha_emision: initial?.fecha_emision ?? '',
        fecha_vencimiento: initial?.fecha_vencimiento ?? '',
        fecha_cobro_prevista: initial?.fecha_cobro_prevista ?? '',
        cliente_id: initial?.cliente_id ?? '',
        proveedor_id: initial?.proveedor_id ?? '',
        venta_id: initial?.venta_id ?? '',
        beneficiario_nombre: initial?.beneficiario_nombre ?? '',
        estado: initial?.estado ?? 'registrado',
        motivo_estado: initial?.motivo_estado ?? '',
        observaciones: initial?.observaciones ?? ''
      });
    }
  }, [open, initial]);

  // Autocompletar banco / número desde chequera (emitidos)
  const chequeraSel = useMemo(
    () =>
      chequeras.find((c) => String(c.id) === String(form.chequera_id)) || null,
    [chequeras, form.chequera_id]
  );
  const bancoIdPorChequera = useMemo(() => {
    if (!chequeraSel) return '';
    const cta = cuentas.find(
      (ct) => Number(ct.id) === Number(chequeraSel.banco_cuenta_id)
    );
    return cta?.banco_id ? String(cta.banco_id) : '';
  }, [chequeraSel, cuentas]);

  useEffect(() => {
    if (form.tipo === 'emitido') {
      if (
        bancoIdPorChequera &&
        String(form.banco_id) !== String(bancoIdPorChequera)
      ) {
        setForm((f) => ({ ...f, banco_id: bancoIdPorChequera }));
      }
      if (chequeraSel && !form.numero) {
        setForm((f) => ({
          ...f,
          numero: String(chequeraSel.proximo_nro || '')
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo, bancoIdPorChequera, chequeraSel?.proximo_nro]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.numero || Number(form.numero) <= 0)
      return alert('Número de cheque inválido');
    if (!form.monto || Number(form.monto) <= 0) return alert('Monto inválido');

    if (form.tipo === 'emitido') {
      if (!form.chequera_id) return alert('Seleccione chequera');
    } else {
      if (!form.banco_id) return alert('Seleccione banco');
    }

    const payload = {
      tipo: form.tipo,
      canal: form.canal,
      banco_id: form.banco_id ? Number(form.banco_id) : null,
      chequera_id: form.chequera_id ? Number(form.chequera_id) : null,
      numero: Number(form.numero),
      monto: Number(form.monto),
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      fecha_cobro_prevista: form.fecha_cobro_prevista || null,
      cliente_id: form.cliente_id ? Number(form.cliente_id) : null,
      proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
      venta_id: form.venta_id ? Number(form.venta_id) : null,
      beneficiario_nombre: form.beneficiario_nombre?.trim() || null,
      estado: form.estado,
      motivo_estado: form.motivo_estado?.trim() || null,
      observaciones: form.observaciones?.trim() || null
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          {/* Sheet / Dialog */}
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="
              relative w-full sm:max-w-4xl bg-white
              rounded-t-2xl sm:rounded-2xl shadow-2xl
              max-h-[100svh] sm:max-h-[90vh]
              flex flex-col
              touch-pan-y overscroll-contain
            "
          >
            {/* Header sticky */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b bg-white sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {isEdit ? 'Editar Cheque' : 'Nuevo Cheque'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cerrar
              </button>
            </div>

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
              <form onSubmit={submit} className="space-y-5">
                {/* Línea 1: tipo/canal/banco */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Tipo *</label>
                    <select
                      name="tipo"
                      value={form.tipo}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Canal *</label>
                    <select
                      name="canal"
                      value={form.canal}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    >
                      {CANALES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <SearchableSelect
                    label={`Banco ${form.tipo === 'recibido' ? '*' : ''}`}
                    items={bancos}
                    value={form.banco_id}
                    onChange={(id) =>
                      setForm((f) => ({ ...f, banco_id: id ? Number(id) : '' }))
                    }
                    getOptionLabel={(b) => b?.nombre ?? ''}
                    getOptionValue={(b) => b?.id}
                    placeholder="Seleccionar banco…"
                    portal
                  />
                </div>

                {/* Línea 2: chequera (sólo emitido) */}
                {form.tipo === 'emitido' && (
                  <div className="grid grid-cols-1 gap-4">
                    <SearchableSelect
                      label="Chequera *"
                      items={chequeras}
                      value={form.chequera_id}
                      onChange={(id, opt) =>
                        setForm((f) => ({
                          ...f,
                          chequera_id: id ? Number(id) : '',
                          numero:
                            f.numero ||
                            (opt?.proximo_nro
                              ? String(opt.proximo_nro)
                              : f.numero)
                        }))
                      }
                      getOptionLabel={(ch) =>
                        ch
                          ? `#${ch.id} — ${ch.descripcion} (${ch.nro_desde}-${ch.nro_hasta}) • Próx: ${ch.proximo_nro}`
                          : ''
                      }
                      getOptionValue={(ch) => ch?.id}
                      placeholder="Buscar o seleccionar chequera…"
                      portal
                    />
                  </div>
                )}

                {/* Línea 3: número/monto/beneficiario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Número *
                    </label>
                    <input
                      name="numero"
                      value={form.numero}
                      onChange={handle}
                      type="number"
                      min="1"
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Monto *</label>
                    <input
                      name="monto"
                      value={form.monto}
                      onChange={handle}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Beneficiario
                    </label>
                    <input
                      name="beneficiario_nombre"
                      value={form.beneficiario_nombre}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                </div>

                {/* Línea 4: fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">
                      Fecha emisión
                    </label>
                    <input
                      type="date"
                      name="fecha_emision"
                      value={form.fecha_emision || ''}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Fecha vencimiento
                    </label>
                    <input
                      type="date"
                      name="fecha_vencimiento"
                      value={form.fecha_vencimiento || ''}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Cobro previsto
                    </label>
                    <input
                      type="date"
                      name="fecha_cobro_prevista"
                      value={form.fecha_cobro_prevista || ''}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                </div>

                {/* Línea 5: referencias blandas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.tipo === 'recibido' ? (
                    <>
                      <SearchableSelect
                        label="Cliente"
                        items={clientes}
                        value={form.cliente_id}
                        onChange={(id) =>
                          setForm((f) => ({
                            ...f,
                            cliente_id: id ? Number(id) : ''
                          }))
                        }
                        getOptionLabel={fmtTercero}
                        getOptionValue={(c) => c?.id}
                        placeholder="Buscar cliente…"
                        portal
                      />
                      <SearchableSelect
                        label="Venta"
                        items={ventas}
                        value={form.venta_id}
                        onChange={(id) =>
                          setForm((f) => ({
                            ...f,
                            venta_id: id ? Number(id) : ''
                          }))
                        }
                        getOptionLabel={fmtVenta}
                        getOptionValue={(v) => v?.id}
                        placeholder="Buscar venta…"
                        portal
                      />
                    </>
                  ) : (
                    <>
                      <SearchableSelect
                        label="Proveedor"
                        items={proveedores}
                        value={form.proveedor_id}
                        onChange={(id) =>
                          setForm((f) => ({
                            ...f,
                            proveedor_id: id ? Number(id) : ''
                          }))
                        }
                        getOptionLabel={fmtTercero}
                        getOptionValue={(p) => p?.id}
                        placeholder="Buscar proveedor…"
                        portal
                      />
                      {/* placeholder para mantener grid en md */}
                      <div className="hidden md:block" />
                    </>
                  )}
                </div>

                {/* Línea 6: estado/motivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Estado</label>
                    <select
                      name="estado"
                      value={form.estado}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Motivo estado
                    </label>
                    <input
                      name="motivo_estado"
                      value={form.motivo_estado}
                      onChange={handle}
                      className="w-full rounded-xl border px-3 py-2"
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handle}
                    rows={3}
                    className="w-full rounded-xl border px-3 py-2"
                  />
                </div>
              </form>
            </div>

            {/* Footer sticky */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-white sticky bottom-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                form="" // no hace falta; el botón está fuera del <form>, pero podemos manejarlo con JS:
                onClick={(e) => {
                  // dispara submit del form de arriba
                  const formEl = e.currentTarget
                    .closest('div[class*="flex"]')
                    .previousElementSibling.querySelector('form');
                  formEl?.requestSubmit();
                }}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 w-full sm:w-auto"
              >
                {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
