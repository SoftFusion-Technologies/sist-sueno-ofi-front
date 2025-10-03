// src/Components/Cheques/ChequeFormModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listChequeras } from '../../api/chequeras';
import { listBancoCuentas } from '../../api/bancoCuentas';
import { listClientes, listProveedores, listVentas } from '../../api/terceros';
import SearchableSelect from '../Common/SearchableSelect';
import {
  backdropV,
  panelV,
  formContainerV,
  fieldV,
  pad,
  toInt,
  makeFieldV,
  makeFormContainerV
} from '../../ui/animHelpers';
import { formatDateTimeAR, formatMoneyARS } from '../../utils/formatters';
import { fmtTercero, getTerceroSearchText } from '../../utils/tercerosFormat';
import {
  fmtChequera,
  getChequeraSearchText
} from '../../utils/chequerasFormat';

import {
  X,
  CreditCard,
  Building2,
  Book,
  Hash,
  DollarSign,
  User,
  Calendar,
  ShoppingCart,
  Factory,
  Tag,
  MessageSquare
} from 'lucide-react';

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

export const fmtVenta = (v, clientesIdx) => {
  if (!v) return '';

  const code = v.codigo || v.comprobante || v.numero || `#${v.id}`;

  // intenta en este orden: objeto anidado -> campos sueltos -> índice por id -> fallback
  const clienteNombre =
    v.cliente?.nombre ||
    v.cliente_nombre ||
    v.cliente ||
    v.nombre ||
    (v.cliente_id && clientesIdx?.[String(v.cliente_id)]?.nombre) ||
    (v.cliente_id ? `Cliente #${v.cliente_id}` : 'Sin cliente');

  const fecha = formatDateTimeAR(v.fecha || v.created_at);
  const total = v.total ? formatMoneyARS(v.total) : null;
  const estado = v.estado || null;

  // construimos sin duplicar bullets vacíos
  const parts = [
    code,
    fecha,
    total,
    estado && `${estado}`,
    `Cliente: ${clienteNombre}`
  ].filter(Boolean);

  return parts.join(' • ');
};

// Texto “oculto” para la búsqueda (más campos = mejor recall)
export const getVentaSearchText = (
  v,
  clientesIdx = null,
  resolverNombreCliente = null
) => {
  if (!v) return '';

  // 1) intentá usar un resolver custom si te lo pasan
  let nom =
    (typeof resolverNombreCliente === 'function' && resolverNombreCliente(v)) ||
    // 2) luego campos ya presentes en la venta
    v?.cliente?.nombre ||
    v?.cliente_nombre ||
    v?.cliente ||
    v?.nombre ||
    // 3) por último, buscá por cliente_id en el índice
    (v?.cliente_id && clientesIdx?.[String(v.cliente_id)]?.nombre) ||
    '';

  const fecha = formatDateTimeAR(v.fecha || v.created_at);
  const comp = v.codigo || v.comprobante || v.numero || '';
  const total = v.total != null ? String(v.total) : '';
  const estado = v.estado || '';
  const id = v.id != null ? String(v.id) : '';

  // Incluimos todo para que busque por cualquiera de estos tokens
  return [id, comp, nom, fecha, total, estado].filter(Boolean).join(' ');
};

// ahora lo resuelve el utils
// const fmtTercero = (t) => {
//   if (!t) return '';
//   const nom = t.nombre || t.razon_social || '';
//   const doc = t.cuit || t.documento || '';
//   return [nom, doc].filter(Boolean).join(' • ');
// };

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

  const clientesIdx = useMemo(() => {
    if (!Array.isArray(clientes)) return {};
    return Object.fromEntries(clientes.map((c) => [String(c.id), c]));
  }, [clientes]);

  const labelVenta = (v) => fmtVenta(v, clientesIdx);

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

  const cuentasIdx = useMemo(
    () => Object.fromEntries((cuentas || []).map((c) => [String(c.id), c])),
    [cuentas]
  );
  const bancosIdx = useMemo(
    () => Object.fromEntries((bancos || []).map((b) => [String(b.id), b])),
    [bancos]
  );

  const titleId = 'cheque-modal-title';
  const formId = 'cheque-form';

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

          {/* Panel */}
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
                <CreditCard className="h-6 w-6 text-gray-300 shrink-0" />
                <h3
                  id={titleId}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white"
                >
                  {isEdit ? 'Editar Cheque' : 'Nuevo Cheque'}
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
                {/* Tipo / Canal / Banco */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      Tipo <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="tipo"
                      value={form.tipo}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      {TIPOS.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">
                          {t}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      Canal <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="canal"
                      value={form.canal}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      {CANALES.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">
                          {t}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV} className="-mt-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      Banco{' '}
                      {form.tipo === 'recibido' && (
                        <span className="text-cyan-300">*</span>
                      )}
                    </label>
                    <SearchableSelect
                      items={bancos}
                      value={form.banco_id}
                      onChange={(id) =>
                        setForm((f) => ({
                          ...f,
                          banco_id: id ? Number(id) : ''
                        }))
                      }
                      getOptionLabel={(b) => b?.nombre ?? ''}
                      getOptionValue={(b) => b?.id}
                      placeholder="Seleccionar banco…"
                      portal
                    />
                  </motion.div>
                </div>

                {/* Chequera (solo emitido) */}
                {form.tipo === 'emitido' && (
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Book className="h-4 w-4 text-gray-400" />
                      Chequera <span className="text-cyan-300">*</span>
                    </label>
                    <SearchableSelect
                      items={chequeras}
                      value={form.chequera_id}
                      onChange={(id) =>
                        setForm((f) => ({
                          ...f,
                          chequera_id: id ? Number(id) : ''
                        }))
                      }
                      getOptionLabel={(ch) =>
                        fmtChequera(ch, cuentasIdx, bancosIdx)
                      }
                      getOptionValue={(ch) => ch?.id}
                      getOptionSearchText={(ch) =>
                        getChequeraSearchText(ch, cuentasIdx, bancosIdx)
                      }
                      placeholder="Buscar chequera…"
                      portal
                    />
                  </motion.div>
                )}

                {/* Número / Monto / Beneficiario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Hash className="h-4 w-4 text-gray-400" />
                      Número <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="numero"
                      value={form.numero}
                      onChange={handle}
                      type="number"
                      min="1"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      Monto <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="monto"
                      value={form.monto}
                      onChange={handle}
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      Beneficiario
                    </label>
                    <input
                      name="beneficiario_nombre"
                      value={form.beneficiario_nombre}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="(Opcional)"
                    />
                  </motion.div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" /> Fecha
                        emisión
                      </span>
                    </label>
                    <input
                      type="date"
                      name="fecha_emision"
                      value={form.fecha_emision || ''}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" /> Fecha
                        vencimiento
                      </span>
                    </label>
                    <input
                      type="date"
                      name="fecha_vencimiento"
                      value={form.fecha_vencimiento || ''}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-2 00 mb-2">
                      <span className="inline-flex items-center gap-2 text-white">
                        <Calendar className="h-4 w-4 text-gray-400" /> Cobro
                        previsto
                      </span>
                    </label>
                    <input
                      type="date"
                      name="fecha_cobro_prevista"
                      value={form.fecha_cobro_prevista || ''}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                  </motion.div>
                </div>

                {/* Referencias blandas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.tipo === 'recibido' ? (
                    <>
                      <motion.div variants={fieldV}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                          <User className="h-4 w-4 text-gray-400" />
                          Cliente
                        </label>
                        <SearchableSelect
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
                          getOptionSearchText={getTerceroSearchText}
                          placeholder="Buscar cliente…"
                          portal
                        />
                      </motion.div>

                      <motion.div variants={fieldV}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          Venta
                        </label>
                        <SearchableSelect
                          items={ventas}
                          value={form.venta_id}
                          onChange={(id) =>
                            setForm((f) => ({
                              ...f,
                              venta_id: id ? Number(id) : ''
                            }))
                          }
                          getOptionLabel={labelVenta}
                          getOptionValue={(v) => v?.id}
                          getOptionSearchText={(v) =>
                            getVentaSearchText(v, clientesIdx)
                          }
                          placeholder="Buscar venta…"
                          portal
                        />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={fieldV}>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                          <Factory className="h-4 w-4 text-gray-400" />
                          Proveedor
                        </label>
                        <SearchableSelect
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
                      </motion.div>
                      <div className="hidden md:block" />
                    </>
                  )}
                </div>

                {/* Estado / Motivo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      Estado
                    </label>
                    <select
                      name="estado"
                      value={form.estado}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e} className="bg-gray-900">
                          {e}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      Motivo estado
                    </label>
                    <input
                      name="motivo_estado"
                      value={form.motivo_estado}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                      placeholder="(No agregar nada aquí)"
                    />
                  </motion.div>
                </div>

                {/* Observaciones */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handle}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Notas internas…"
                  />
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
