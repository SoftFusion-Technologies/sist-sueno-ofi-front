// ===============================
// FILE: src/Pages/Compras/CompraForm.jsx (mejorado)
// ===============================
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import http from '../../api/http';
import { moneyAR, round2 } from '../../utils/money';
import {
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaSave,
  FaSearch,
  FaTimes,
  FaBuilding,
  FaMapMarkerAlt
} from 'react-icons/fa';

// ===== Enums (de tu Modelo Sequelize) =====
const ENUMS = {
  canal: ['C1', 'C2'],
  condicion_compra: ['contado', 'cuenta_corriente', 'credito', 'otro'],
  tipo_comprobante: ['FA', 'FB', 'FC', 'ND', 'NC', 'REMITO', 'OTRO'],
  moneda: ['ARS', 'USD', 'EUR', 'Otro']
};

function calcularTotalLinea({
  cantidad,
  costo_unit_neto,
  alicuota_iva = 21,
  inc_iva = 0,
  descuento_porcentaje = 0,
  otros_impuestos = 0
}) {
  const qty = Math.max(1, parseInt(cantidad || 1, 10));
  const costo = Number(costo_unit_neto || 0);
  const desc = Number(descuento_porcentaje || 0);
  const base = qty * costo * (1 - desc / 100);
  const iva = inc_iva ? 0 : base * (Number(alicuota_iva) / 100);
  const otros = Number(otros_impuestos || 0);
  return round2(base + iva + otros);
}

function recomputarTotales(detalles = [], impuestosDoc = []) {
  let subtotal_neto = 0;
  let iva_total = 0;
  let percepciones_total = 0;
  let retenciones_total = 0;
  let total = 0;

  for (const d of detalles) {
    const qty = Math.max(1, parseInt(d.cantidad || 1, 10));
    const costo = Number(d.costo_unit_neto || 0);
    const desc = Number(d.descuento_porcentaje || 0);
    const base = qty * costo * (1 - desc / 100);
    const iva = d.inc_iva ? 0 : base * (Number(d.alicuota_iva || 21) / 100);

    subtotal_neto += base;
    iva_total += iva;
    total += calcularTotalLinea(d);
  }

  for (const i of impuestosDoc) {
    const tipo = String(i.tipo || '').toUpperCase();
    const monto = Number(i.monto || 0);
    if (tipo === 'IVA') iva_total += monto;
    else if (tipo === 'PERCEPCION') percepciones_total += monto;
    else if (tipo === 'RETENCION') retenciones_total += monto;
    else total += monto;
  }

  subtotal_neto = round2(subtotal_neto);
  iva_total = round2(iva_total);
  percepciones_total = round2(percepciones_total);
  retenciones_total = round2(retenciones_total);
  total = round2(total + percepciones_total + retenciones_total);

  return {
    subtotal_neto,
    iva_total,
    percepciones_total,
    retenciones_total,
    total
  };
}

export default function CompraForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    canal: 'C1',
    proveedor_id: '',
    local_id: '',
    fecha: new Date().toISOString().slice(0, 10),
    condicion_compra: 'cuenta_corriente',
    fecha_vencimiento: '',
    moneda: 'ARS',
    tipo_comprobante: 'FA',
    punto_venta: '',
    nro_comprobante: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});

  const [detalles, setDetalles] = useState([
    {
      producto_id: '',
      cantidad: 1,
      costo_unit_neto: 0,
      alicuota_iva: 21,
      inc_iva: 0,
      descuento_porcentaje: 0,
      otros_impuestos: 0
    }
  ]);
  const [impuestos, setImpuestos] = useState([]);
  const totals = useMemo(
    () => recomputarTotales(detalles, impuestos),
    [detalles, impuestos]
  );
  const [saving, setSaving] = useState(false);

  // ====== Autocomplete proveedor ======
  const [provTxt, setProvTxt] = useState('');
  const [provSel, setProvSel] = useState(null); // {id,label,cuit}
  const [provList, setProvList] = useState([]);
  const [openProv, setOpenProv] = useState(false);
  const provBoxRef = useRef(null);

  // ====== Autocomplete local ======
  const [localTxt, setLocalTxt] = useState('');
  const [localSel, setLocalSel] = useState(null); // { id, label, sub }
  const [localList, setLocalList] = useState([]);
  const [openLocal, setOpenLocal] = useState(false);
  const localBoxRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  // resalta coincidencia
  const highlight = (txt = '', q = '') => {
    if (!q) return txt;
    const i = txt.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return txt;
    return (
      <>
        {txt.slice(0, i)}
        <mark className="bg-emerald-100 text-emerald-800 rounded px-0.5">
          {txt.slice(i, i + q.length)}
        </mark>
        {txt.slice(i + q.length)}
      </>
    );
  };

  // Buscar proveedores por texto (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!provTxt?.trim()) {
        setProvList([]);
        setOpenProv(false);
        return;
      }
      try {
        const { data } = await http.get('/proveedores', {
          params: { q: provTxt, page: 1, pageSize: 50 }
        });
        const items = (data?.data || []).map((p) => ({
          id: p.id,
          label: p.nombre_fantasia || p.razon_social || `#${p.id}`,
          cuit: p.cuit
        }));
        setProvList(items.slice(0, 20));
        setOpenProv(true);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [provTxt]);

  // Buscar locales por texto (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!localTxt.trim()) {
        setLocalList([]);
        setOpenLocal(false);
        return;
      }
      try {
        const { data } = await http.get('/locales', {
          params: { q: localTxt, page: 1, pageSize: 50 }
        });
        const rows = data?.data || data || [];
        const items = rows.map((l) => ({
          id: l.id,
          label: `${l.nombre}${l.codigo ? ` (${l.codigo})` : ''}`,
          sub: [l.ciudad, l.provincia].filter(Boolean).join(', ')
        }));
        setLocalList(items.slice(0, 20));
        setOpenLocal(true);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [localTxt]);

  // Hydrate labels cuando entras a editar
  useEffect(() => {
    const hydrate = async () => {
      try {
        if (form.proveedor_id) {
          const { data } = await http.get('/proveedores', {
            params: { page: 1, pageSize: 1, id: form.proveedor_id }
          });
          const p = (data?.data || []).find((x) => x.id === form.proveedor_id);
          if (p)
            setProvSel({
              id: p.id,
              label: p.nombre_fantasia || p.razon_social || `#${p.id}`,
              cuit: p.cuit
            });
        }
        if (form.local_id) {
          const { data } = await http.get('/locales', {
            params: { page: 1, pageSize: 1, id: form.local_id }
          });
          const l = (data?.data || data || []).find(
            (x) => x.id === form.local_id
          );
          if (l)
            setLocalSel({
              id: l.id,
              label: `${l.nombre}${l.codigo ? ` (${l.codigo})` : ''}`,
              sub: [l.ciudad, l.provincia].filter(Boolean).join(', ')
            });
        }
      } catch {}
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cerrar dropdowns click-afuera
  useEffect(() => {
    const onDownProv = (e) => {
      if (!provBoxRef.current) return;
      if (!provBoxRef.current.contains(e.target)) setOpenProv(false);
    };
    const onDownLoc = (e) => {
      if (!localBoxRef.current) return;
      if (!localBoxRef.current.contains(e.target)) setOpenLocal(false);
    };
    document.addEventListener('mousedown', onDownProv);
    document.addEventListener('mousedown', onDownLoc);
    return () => {
      document.removeEventListener('mousedown', onDownProv);
      document.removeEventListener('mousedown', onDownLoc);
    };
  }, []);

  // Mobile flag
  useEffect(() => {
    const mm = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mm.matches);
    update();
    mm.addEventListener('change', update);
    return () => mm.removeEventListener('change', update);
  }, []);

  // Carga al editar
  useEffect(() => {
    if (mode === 'edit' && id) {
      (async () => {
        try {
          const { data } = await http.get(`/compras/${id}`);
          if (data?.ok) {
            const c = data.data;
            setForm({
              canal: c.canal || 'C1',
              proveedor_id: c.proveedor_id || '',
              local_id: c.local_id || '',
              fecha: c.fecha?.slice(0, 10) || '',
              condicion_compra: c.condicion_compra || 'cuenta_corriente',
              fecha_vencimiento: c.fecha_vencimiento?.slice(0, 10) || '',
              moneda: c.moneda || 'ARS',
              tipo_comprobante: c.tipo_comprobante || 'FA',
              punto_venta: c.punto_venta || '',
              nro_comprobante: c.nro_comprobante || '',
              observaciones: c.observaciones || ''
            });
            setDetalles(
              (c.detalles || []).map((d) => ({
                producto_id: d.producto_id || '',
                cantidad: d.cantidad || 1,
                costo_unit_neto: d.costo_unit_neto || 0,
                alicuota_iva: d.alicuota_iva ?? 21,
                inc_iva: d.inc_iva || 0,
                descuento_porcentaje: d.descuento_porcentaje || 0,
                otros_impuestos: d.otros_impuestos || 0
              }))
            );
            setImpuestos(
              (c.impuestos || []).map((i) => ({
                tipo: i.tipo,
                codigo: i.codigo,
                monto: i.monto
              }))
            );
          }
        } catch (e) {
          alert(e?.response?.data?.error || 'Error cargando compra');
        }
      })();
    }
  }, [mode, id]);

  const onChangeHeader = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ===== Validaciones suaves previas al submit (alineadas con Modelo) =====
  const requiresVenc = ['cuenta_corriente', 'credito'].includes(
    String(form.condicion_compra)
  );

  const validate = () => {
    const err = {};
    // proveedor obligatorio
    if (!form.proveedor_id) err.proveedor_id = 'Seleccioná un proveedor';
    // documento coherente: o vienen ambos, o ninguno
    const hasPV = String(form.punto_venta || '').trim() !== '';
    const hasNro = String(form.nro_comprobante || '').trim() !== '';
    if (hasPV !== hasNro)
      err.documento = 'Si completás PV o Nro, deben venir ambos';
    // tipos numéricos
    if (hasPV && !/^\d+$/.test(String(form.punto_venta)))
      err.punto_venta = 'PV debe ser numérico';
    if (hasNro && !/^\d+$/.test(String(form.nro_comprobante)))
      err.nro_comprobante = 'Nro debe ser numérico';
    // vencimiento requerido
    if (requiresVenc && !form.fecha_vencimiento)
      err.fecha_vencimiento = 'Requerido por condición de compra';
    // detalles mínimos
    if (!detalles.length) err.detalles = 'Agregá al menos un ítem';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const addLinea = () =>
    setDetalles((d) => [
      ...d,
      {
        producto_id: '',
        cantidad: 1,
        costo_unit_neto: 0,
        alicuota_iva: 21,
        inc_iva: 0,
        descuento_porcentaje: 0,
        otros_impuestos: 0
      }
    ]);
  const delLinea = (idx) => setDetalles((d) => d.filter((_, i) => i !== idx));
  const updLinea = (idx, k, v) =>
    setDetalles((d) =>
      d.map((row, i) => (i === idx ? { ...row, [k]: v } : row))
    );

  const addImpuesto = () =>
    setImpuestos((arr) => [...arr, { tipo: 'IVA', codigo: '21', monto: 0 }]);
  const delImpuesto = (idx) =>
    setImpuestos((arr) => arr.filter((_, i) => i !== idx));
  const updImpuesto = (idx, k, v) =>
    setImpuestos((arr) =>
      arr.map((row, i) => (i === idx ? { ...row, [k]: v } : row))
    );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      const payload = {
        ...form,
        // normalizaciones acordes al modelo
        canal: String(form.canal),
        condicion_compra: String(form.condicion_compra),
        tipo_comprobante: String(form.tipo_comprobante),
        moneda: String(form.moneda),
        punto_venta:
          form.punto_venta === '' ? null : parseInt(form.punto_venta, 10),
        nro_comprobante:
          form.nro_comprobante === ''
            ? null
            : parseInt(form.nro_comprobante, 10),
        proveedor_id: form.proveedor_id || null,
        local_id: form.local_id || null,
        fecha: form.fecha || new Date(),
        fecha_vencimiento: form.fecha_vencimiento || null,
        detalles: detalles.map((d) => ({
          ...d,
          cantidad: Number(d.cantidad || 1),
          costo_unit_neto: Number(d.costo_unit_neto || 0),
          descuento_porcentaje: Number(d.descuento_porcentaje || 0),
          otros_impuestos: Number(d.otros_impuestos || 0)
        })),
        impuestos: impuestos.map((i) => ({ ...i, monto: Number(i.monto || 0) }))
      };

      if (mode === 'edit') {
        await http.put(`/compras/${id}`, payload);
        navigate(`/dashboard/compras/${id}`);
      } else {
        const { data } = await http.post('/compras', payload);
        const newId = data?.compra?.id;
        navigate(
          newId ? `/dashboard/compras/${newId}` : '/dashboard/compras/listado'
        );
      }
    } catch (e) {
      alert(e?.response?.data?.error || 'Error guardando compra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#041f1a] via-[#064e3b] to-[#0b3b2f]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20"
          >
            <FaArrowLeft /> Volver
          </button>
          <h1 className="text-2xl font-bold">
            {mode === 'edit' ? 'Editar Compra' : 'Nueva Compra'}
          </h1>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Cabecera */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Proveedor (autocomplete) */}
              <div ref={provBoxRef} className="md:col-span-1 relative group">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/70" />
                  <input
                    value={provSel?.label ?? provTxt}
                    onChange={(e) => {
                      setProvSel(null);
                      setProvTxt(e.target.value);
                      onChangeHeader('proveedor_id', '');
                    }}
                    onFocus={() => provList.length && setOpenProv(true)}
                    placeholder="Proveedor (razón social o fantasía)…"
                    className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-white/30 bg-white/80 backdrop-blur-xl text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-transparent transition"
                    aria-invalid={!!errors.proveedor_id}
                  />
                  {provSel && (
                    <button
                      type="button"
                      onClick={() => {
                        setProvSel(null);
                        setProvTxt('');
                        onChangeHeader('proveedor_id', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-500 bg-white/80 hover:bg-white shadow border border-white/40 hover:ring-2 hover:ring-emerald-400/40 transition"
                      title="Quitar proveedor"
                      aria-label="Quitar proveedor"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                {errors.proveedor_id && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.proveedor_id}
                  </p>
                )}

                {/* Dropdown / Bottom-sheet */}
                {openProv && !provSel && provList.length > 0 && (
                  <>
                    {/* Desktop/Tablet */}
                    {!isMobile && (
                      <div className="absolute z-30 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/10">
                        <div className="max-h-[40vh] overflow-y-auto overscroll-contain divide-y divide-gray-100/60">
                          {provList.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setProvSel(p);
                                setProvTxt('');
                                setOpenProv(false);
                                onChangeHeader('proveedor_id', p.id); // setea el ID
                              }}
                              className="w-full text-left px-3 py-2.5 m-1 rounded-xl hover:bg-emerald-50/60 focus:bg-emerald-50/90 transition flex items-center gap-3"
                            >
                              <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <FaBuilding />
                              </span>
                              <span className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {highlight(p.label, provTxt)}
                                </div>
                                <div className="text-[11px] font-mono text-gray-500">
                                  CUIT {p.cuit}
                                </div>
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="sticky bottom-0 px-3 py-2 text-[11px] text-gray-500 bg-white/95 rounded-b-2xl border-t">
                          Mostrando {provList.length} resultados · escribí más
                          para afinar
                        </div>
                      </div>
                    )}

                    {/* Mobile */}
                    {isMobile && (
                      <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpenProv(false)}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl ring-1 ring-emerald-500/10 border border-white/40 max-h-[80vh] w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between p-3">
                            <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto" />
                            <button
                              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                              onClick={() => setOpenProv(false)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <div className="px-4 pb-2 text-sm text-gray-600">
                            Seleccioná un proveedor
                          </div>
                          <div className="max-h-[calc(80vh-100px)] overflow-y-auto overscroll-contain divide-y">
                            {provList.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setProvSel(p);
                                  setProvTxt('');
                                  setOpenProv(false);
                                  onChangeHeader('proveedor_id', p.id);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50/60 transition flex items-center gap-3"
                              >
                                <span className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                  <FaBuilding />
                                </span>
                                <span className="min-w-0">
                                  <div className="text-base font-semibold text-gray-900 truncate">
                                    {highlight(p.label, provTxt)}
                                  </div>
                                  <div className="text-[11px] font-mono text-gray-500">
                                    CUIT {p.cuit}
                                  </div>
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="px-4 py-2 text-[12px] text-gray-500">
                            Tip: escribí 3+ letras para filtrar mejor.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Canal (ENUM) */}
              <select
                value={form.canal}
                onChange={(e) => onChangeHeader('canal', e.target.value)}
                className="px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                {ENUMS.canal.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Fecha */}
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => onChangeHeader('fecha', e.target.value)}
                className="px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />

              {/* Condición de compra (ENUM) */}
              <select
                value={form.condicion_compra}
                onChange={(e) =>
                  onChangeHeader('condicion_compra', e.target.value)
                }
                className="px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                {ENUMS.condicion_compra.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Vencimiento (requerido para CC/Crédito) */}
              <div>
                <input
                  type="date"
                  value={form.fecha_vencimiento || ''}
                  onChange={(e) =>
                    onChangeHeader('fecha_vencimiento', e.target.value)
                  }
                  className={`px-3 py-2 rounded-2xl border bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
                    errors.fecha_vencimiento
                      ? 'border-rose-300'
                      : 'border-white/30'
                  }`}
                  placeholder="Vencimiento"
                />
                {errors.fecha_vencimiento && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.fecha_vencimiento}
                  </p>
                )}
              </div>

              {/* Local (autocomplete) */}
              <div ref={localBoxRef} className="md:col-span-2 relative group">
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600/70" />
                  <input
                    value={localSel?.label ?? localTxt}
                    onChange={(e) => {
                      setLocalSel(null);
                      setLocalTxt(e.target.value);
                      onChangeHeader('local_id', '');
                    }}
                    onFocus={() => localList.length && setOpenLocal(true)}
                    placeholder="Local (nombre o código)…"
                    className="w-full pl-10 pr-12 py-2.5 rounded-2xl border border-white/30 bg-white/80 backdrop-blur-xl text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-transparent transition"
                  />
                  {localSel && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSel(null);
                        setLocalTxt('');
                        onChangeHeader('local_id', '');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full text-gray-500 bg-white/80 hover:bg-white shadow border border-white/40 hover:ring-2 hover:ring-emerald-400/40 transition"
                      title="Quitar local"
                      aria-label="Quitar local"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>

                {openLocal && !localSel && localList.length > 0 && (
                  <>
                    {/* Desktop/Tablet */}
                    {!isMobile && (
                      <div className="absolute z-30 w-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/30 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.45)] ring-1 ring-emerald-500/10">
                        <div className="max-h-[40vh] overflow-y-auto overscroll-contain divide-y divide-gray-100/60">
                          {localList.map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setLocalSel(l);
                                setLocalTxt('');
                                setOpenLocal(false);
                                onChangeHeader('local_id', l.id); // setea el ID
                              }}
                              className="w-full text-left px-3 py-2.5 m-1 rounded-xl hover:bg-emerald-50/60 focus:bg-emerald-50/90 transition"
                            >
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {highlight(l.label, localTxt)}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {l.sub}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="sticky bottom-0 px-3 py-2 text-[11px] text-gray-500 bg-white/95 rounded-b-2xl border-t">
                          Mostrando {localList.length} resultados · escribí más
                          para afinar
                        </div>
                      </div>
                    )}

                    {/* Mobile */}
                    {isMobile && (
                      <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpenLocal(false)}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl ring-1 ring-emerald-500/10 border border-white/40 max-h-[80vh] w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between p-3">
                            <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto" />
                            <button
                              className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                              onClick={() => setOpenLocal(false)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                          <div className="px-4 pb-2 text-sm text-gray-600">
                            Seleccioná un local
                          </div>
                          <div className="max-h-[calc(80vh-100px)] overflow-y-auto overscroll-contain divide-y">
                            {localList.map((l) => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  setLocalSel(l);
                                  setLocalTxt('');
                                  setOpenLocal(false);
                                  onChangeHeader('local_id', l.id);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50/60 transition"
                              >
                                <div className="text-base font-semibold text-gray-900 truncate">
                                  {highlight(l.label, localTxt)}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {l.sub}
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="px-4 py-2 text-[12px] text-gray-500">
                            Tip: escribí 2–3 letras para filtrar mejor.
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tipo comprobante (ENUM) */}
              <select
                value={form.tipo_comprobante}
                onChange={(e) =>
                  onChangeHeader('tipo_comprobante', e.target.value)
                }
                className="px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                {ENUMS.tipo_comprobante.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Punto de venta / Nro */}
              <div>
                <input
                  value={form.punto_venta}
                  onChange={(e) =>
                    onChangeHeader('punto_venta', e.target.value)
                  }
                  placeholder="Punto de Venta"
                  inputMode="numeric"
                  className={`px-3 py-2 rounded-2xl border bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
                    errors.punto_venta ? 'border-rose-300' : 'border-white/30'
                  }`}
                />
                {errors.punto_venta && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.punto_venta}
                  </p>
                )}
              </div>
              <div>
                <input
                  value={form.nro_comprobante}
                  onChange={(e) =>
                    onChangeHeader('nro_comprobante', e.target.value)
                  }
                  placeholder="Nro Comprobante"
                  inputMode="numeric"
                  className={`px-3 py-2 rounded-2xl border bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
                    errors.nro_comprobante
                      ? 'border-rose-300'
                      : 'border-white/30'
                  }`}
                />
                {errors.nro_comprobante && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.nro_comprobante}
                  </p>
                )}
                {errors.documento && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.documento}
                  </p>
                )}
              </div>

              {/* Moneda (ENUM) */}
              <select
                value={form.moneda}
                onChange={(e) => onChangeHeader('moneda', e.target.value)}
                className="px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              >
                {ENUMS.moneda.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>

              {/* Observaciones */}
              <input
                value={form.observaciones}
                onChange={(e) =>
                  onChangeHeader('observaciones', e.target.value)
                }
                placeholder="Observaciones"
                className="md:col-span-3 px-3 py-2 rounded-2xl border border-white/30 bg-white/90 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>
          </div>

          {/* Detalles */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Detalles</h2>
              <button
                type="button"
                onClick={addLinea}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FaPlus /> Agregar ítem
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-2 py-1">Producto ID</th>
                    <th className="px-2 py-1">Cant.</th>
                    <th className="px-2 py-1">Costo Neto</th>
                    <th className="px-2 py-1">IVA%</th>
                    <th className="px-2 py-1">Inc. IVA</th>
                    <th className="px-2 py-1">Desc %</th>
                    <th className="px-2 py-1">Otros Imp.</th>
                    <th className="px-2 py-1 text-right">Total Línea</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-2 py-1">
                        <input
                          value={d.producto_id}
                          onChange={(e) =>
                            updLinea(idx, 'producto_id', e.target.value)
                          }
                          className="w-28 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min="1"
                          value={d.cantidad}
                          onChange={(e) =>
                            updLinea(idx, 'cantidad', e.target.value)
                          }
                          className="w-20 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={d.costo_unit_neto}
                          onChange={(e) =>
                            updLinea(idx, 'costo_unit_neto', e.target.value)
                          }
                          className="w-28 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.1"
                          value={d.alicuota_iva}
                          onChange={(e) =>
                            updLinea(idx, 'alicuota_iva', e.target.value)
                          }
                          className="w-20 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="checkbox"
                          checked={!!d.inc_iva}
                          onChange={(e) =>
                            updLinea(idx, 'inc_iva', e.target.checked ? 1 : 0)
                          }
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.1"
                          value={d.descuento_porcentaje}
                          onChange={(e) =>
                            updLinea(
                              idx,
                              'descuento_porcentaje',
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={d.otros_impuestos}
                          onChange={(e) =>
                            updLinea(idx, 'otros_impuestos', e.target.value)
                          }
                          className="w-28 px-2 py-1 rounded-lg border"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-semibold">
                        {moneyAR(calcularTotalLinea(d))}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <button
                          type="button"
                          onClick={() => delLinea(idx)}
                          className="px-2 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.detalles && (
              <p className="mt-2 text-xs text-rose-600">{errors.detalles}</p>
            )}
          </div>

          {/* Impuestos doc */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Impuestos del Documento</h2>
              <button
                type="button"
                onClick={addImpuesto}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <FaPlus /> Agregar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {impuestos.map((i, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={i.tipo}
                    onChange={(e) => updImpuesto(idx, 'tipo', e.target.value)}
                    className="col-span-4 px-3 py-2 rounded-xl border"
                  >
                    <option value="IVA">IVA</option>
                    <option value="PERCEPCION">Percepción</option>
                    <option value="RETENCION">Retención</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  <input
                    value={i.codigo || ''}
                    onChange={(e) => updImpuesto(idx, 'codigo', e.target.value)}
                    placeholder="Código"
                    className="col-span-4 px-3 py-2 rounded-xl border"
                  />
                  <div className="col-span-3 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={i.monto}
                      onChange={(e) =>
                        updImpuesto(idx, 'monto', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => delImpuesto(idx)}
                    className="col-span-1 px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totales + Guardar */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-white rounded-xl p-3 border">
                <div className="text-gray-500">Subtotal Neto</div>
                <div className="font-semibold">
                  {moneyAR(totals.subtotal_neto)}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border">
                <div className="text-gray-500">IVA</div>
                <div className="font-semibold">{moneyAR(totals.iva_total)}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border">
                <div className="text-gray-500">Perc + Ret</div>
                <div className="font-semibold">
                  {moneyAR(
                    totals.percepciones_total + totals.retenciones_total
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border">
                <div className="text-gray-500">Total</div>
                <div className="font-semibold">{moneyAR(totals.total)}</div>
              </div>
            </div>
            <div className="mt-4">
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <FaSave />{' '}
                {saving
                  ? 'Guardando…'
                  : mode === 'edit'
                  ? 'Guardar Cambios'
                  : 'Crear Compra'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
