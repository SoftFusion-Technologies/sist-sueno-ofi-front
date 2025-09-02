import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, CheckCircle2, Wand2 } from 'lucide-react';

/**
 * ProductoSetupWizard (v2)
 *
 * Cambios clave:
 * - Solo lo abre el padre cuando hay proveedor seleccionado.
 * - Paso 1: agrega "Sugerir nombre" (arma nombre con marca/modelo/medida/SKU/categoría si existen).
 * - Paso 2: select de moneda con texto negro + opciones ARS, USD, EUR y OTRO (muestra campo adicional si es OTRO).
 * - KPIs extra: Precio venta (con desc), Markup y Margen %. Alertas si margen negativo.
 * - Validaciones y bloqueos de botones más robustos.
 *
 * Props
 * - open: boolean
 * - onClose: () => void
 * - producto: { id, nombre, categoria_id, precio, descuento_porcentaje, marca, modelo, medida, codigo_sku, categoria?.nombre }
 * - proveedorInicial: { id, razon_social } | null
 * - ppInicialId: number | null
 * - uid: string|number|null
 * - BASE_URL: string
 * - onRefresh: () => void
 */

const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

// es-AR: $ 80.000,00
const fmtNumAR = (n) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(n) || 0);

// ARS/USD/EUR/OTRO (si OTRO y escribís por ejemplo "BRL", intenta usarlo)
const fmtCurrency = (monedaUI, value, monedaOtro = '') => {
  const code =
    monedaUI === 'OTRO'
      ? monedaOtro?.trim()?.toUpperCase() || 'ARS' // intenta usar el ingresado
      : monedaUI || 'ARS';

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2
    }).format(Number(value) || 0);
  } catch {
    // por si el code no es ISO válido (e.g. “UYU?”) → usa número con sufijo
    return `${fmtNumAR(value)} ${code}`;
  }
};

export default function ProductoSetupWizard({
  open,
  onClose,
  producto,
  proveedorInicial,
  ppInicialId,
  uid,
  BASE_URL,
  onRefresh
}) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // --- Paso 1: datos del producto ---
  const [pNombre, setPNombre] = useState('');
  const [pCategoriaId, setPCategoriaId] = useState('');
  const [pPrecio, setPPrecio] = useState('');
  const [pDesc, setPDesc] = useState('');

  // --- Paso 2: costos proveedor ---
  const [costo, setCosto] = useState(0);
  const [moneda, setMoneda] = useState('ARS');
  const [monedaOtro, setMonedaOtro] = useState('');
  const [alicuota, setAlicuota] = useState(21);
  const [incIva, setIncIva] = useState(false);
  const [descCompra, setDescCompra] = useState(0); // %
  const [plazoDias, setPlazoDias] = useState(7);
  const [minimoCompra, setMinimoCompra] = useState(1);
  const [motivo, setMotivo] = useState('Setup inicial');
  // NUEVO: snapshot del PP guardado en BD
  const [ppSnapshot, setPpSnapshot] = useState(null);

  // Caja abierta + UI Paso 3
  const [cajaActual, setCajaActual] = useState(null);
  const [cargandoCaja, setCargandoCaja] = useState(false);

  // Paso 3 – egreso opcional
  const [egresoOn, setEgresoOn] = useState(false);
  const [egresoMonto, setEgresoMonto] = useState(0);
  const [egresoDesc, setEgresoDesc] = useState('');

  // Moneda efectivamente guardada para decidir si se puede egresar directo
  const [lastSavedMoneda, setLastSavedMoneda] = useState('ARS');

  useEffect(() => {
    if (open && producto) {
      // ... (lo que ya tenías)
      setEgresoOn(false);
      setEgresoMonto(0);
      setEgresoDesc('');
      // setPostingEgreso(false);
      setLastSavedMoneda('ARS');
      setCajaActual(null);
    }
  }, [open, producto]);

  // Detectar caja abierta del usuario (y local si lo tenés)
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setCargandoCaja(true);
        const r = await fetch(`${BASE_URL}/caja`, {
          headers: { 'X-User-Id': String(uid ?? '') }
        });
        const js = await r.json().catch(() => null);
        const arr = Array.isArray(js?.data)
          ? js.data
          : Array.isArray(js)
          ? js
          : [];
        // ajustá userLocalId si lo tenés como prop/context; si no, quitá ese AND
        const abierta =
          arr.find(
            (c) =>
              c.usuario_id == uid &&
              /* c.local_id == userLocalId && */ c.fecha_cierre === null
          ) ||
          arr.find((c) => c.fecha_cierre === null) ||
          null;
        setCajaActual(abierta);
      } catch {
        setCajaActual(null);
      } finally {
        setCargandoCaja(false);
      }
    })();
  }, [open, uid, BASE_URL /*, userLocalId*/]);

  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(3, s + 1));

  useEffect(() => {
    let abort = false;
    async function loadSnapshot() {
      if (!open || !ppInicialId) return;
      try {
        const r = await fetch(`${BASE_URL}/producto-proveedor/${ppInicialId}`);
        if (!r.ok) return;
        const json = await r.json().catch(() => null);
        const data = json?.pp || json?.data || json; // según tu API
        if (!abort) setPpSnapshot(data || null);
      } catch {}
    }
    loadSnapshot();
    return () => {
      abort = true;
    };
  }, [open, ppInicialId, BASE_URL]);

  // === NUEVO: calculador reutilizable para compra ===
  const calcCompra = ({ costo, descPct, alicPct, incluyeIva }) => {
    const c = Number(costo) || 0;
    const d = clamp(descPct, 0, 100);
    const a = clamp(alicPct, 0, 27);
    const netoConDesc = c * (1 - d / 100);
    const ivaCalc = incluyeIva ? 0 : netoConDesc * (a / 100);
    const total = netoConDesc + ivaCalc;
    return {
      neto: red(c),
      netoConDesc: red(netoConDesc),
      iva: red(ivaCalc),
      total: red(total)
    };
  };

  // === NUEVO: preview de compra guardada en BD ===
  const compraGuardada = useMemo(() => {
    if (!ppSnapshot) return null;
    return calcCompra({
      costo: ppSnapshot.costo_neto,
      descPct: ppSnapshot.descuento_porcentaje,
      alicPct: ppSnapshot.alicuota_iva,
      incluyeIva: !!ppSnapshot.inc_iva
    });
  }, [ppSnapshot]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') return onClose?.();
      if (e.altKey && e.key === 'ArrowLeft') return goPrev();
      if (e.altKey && e.key === 'ArrowRight') return goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open && producto) {
      setStep(1);
      setError('');
      setSaving(false);
      setPNombre(producto?.nombre ?? '');
      setPCategoriaId(producto?.categoria_id ?? '');
      setPPrecio(String(producto?.precio ?? ''));
      setPDesc(
        producto?.descuento_porcentaje === null ||
          producto?.descuento_porcentaje === undefined
          ? ''
          : String(producto?.descuento_porcentaje)
      );

      // defaults Paso 2
      setCosto(0);
      setMoneda('ARS');
      setMonedaOtro('');
      setAlicuota(21);
      setIncIva(false);
      setDescCompra(0);
      setPlazoDias(7);
      setMinimoCompra(1);
      setMotivo('Setup inicial');
    }
  }, [open, producto]);

  // ---------- Helpers ----------
  function red(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  // Nombre sugerido con lo que haya
  const nombreSugerido = useMemo(() => {
    const parts = [];
    const marca = producto?.marca?.trim();
    const modelo = producto?.modelo?.trim();
    const medida = producto?.medida?.trim();
    const sku = producto?.codigo_sku?.trim();
    const cat = producto?.categoria?.nombre?.trim();

    if (marca) parts.push(marca);
    if (modelo) parts.push(modelo);
    if (medida) parts.push(medida);
    if (!parts.length && cat) parts.push(cat);
    if (sku) parts.push(`#${sku}`);

    return parts.length ? parts.join(' · ') : '';
  }, [producto]);

  // Preview compra (costo → descuento → IVA)
  const compraPreview = useMemo(() => {
    const c = Number(costo) || 0;
    const d = clamp(descCompra, 0, 100);
    const a = clamp(alicuota, 0, 27);

    const netoConDesc = c * (1 - d / 100);
    const ivaCalc = incIva ? 0 : netoConDesc * (a / 100);
    const total = netoConDesc + ivaCalc;

    return {
      neto: red(c),
      netoConDesc: red(netoConDesc),
      iva: red(ivaCalc),
      total: red(total)
    };
  }, [costo, descCompra, alicuota, incIva]);

  // === NUEVO: elegir base de costo para KPIs ===
  const costoBaseParaKPIs =
    step === 2
      ? compraPreview // en paso 2: lo que estás editando
      : compraGuardada || compraPreview; // en paso 1: lo guardado (si no hay, usa edición)

  // === REEMPLAZA tu ventaPreview actual por este ===
  const ventaPreview = useMemo(() => {
    const precio = Number(pPrecio) || 0;
    const d = clamp(pDesc === '' ? 0 : pDesc, 0, 100);
    const precioConDesc = red(precio * (1 - d / 100));
    const costoTotal = costoBaseParaKPIs.total;
    const margen$ = red(precioConDesc - costoTotal);
    const margenPct =
      precioConDesc > 0 ? red((margen$ / precioConDesc) * 100) : 0;
    const markupPct =
      costoTotal > 0 ? red((precioConDesc / costoTotal - 1) * 100) : 0;
    return { precioConDesc, costoTotal, margen$, margenPct, markupPct };
  }, [pPrecio, pDesc, costoBaseParaKPIs]);

  // NUEVO: helpers para firmar el estado del Paso 2
  const signPPState = (st) =>
    JSON.stringify({
      costo: Number(st.costo || 0),
      moneda: st.moneda,
      monedaOtro: st.moneda === 'OTRO' ? st.monedaOtro?.trim() || '' : '',
      alicuota: clamp(st.alicuota, 0, 27),
      incIva: !!st.incIva,
      descCompra: clamp(st.descCompra, 0, 100),
      plazoDias: Math.max(0, Number(st.plazoDias) || 0),
      minimoCompra: Math.max(0, Number(st.minimoCompra) || 0)
    });

  // NUEVO: estados para idempotencia del Paso 2
  const [lastSavedStep2Sig, setLastSavedStep2Sig] = useState('');
  const [step2Saved, setStep2Saved] = useState(false);

  useEffect(() => {
    if (open && producto) {
      // ... tus defaults ya existentes
      setLastSavedStep2Sig('');
      setStep2Saved(false);
    }
  }, [open, producto]);

  // Si usás los setters ya existentes, podés centralizar con este efecto:
  useEffect(() => {
    const currentSig = signPPState({
      costo,
      moneda,
      monedaOtro,
      alicuota,
      incIva,
      descCompra,
      plazoDias,
      minimoCompra
    });
    setStep2Saved(currentSig === lastSavedStep2Sig);
  }, [
    costo,
    moneda,
    monedaOtro,
    alicuota,
    incIva,
    descCompra,
    plazoDias,
    minimoCompra,
    lastSavedStep2Sig
  ]);

  // ---------- Actions ----------
  async function guardarPaso1() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...producto,
        nombre: pNombre?.trim() || producto.nombre,
        categoria_id: pCategoriaId || producto.categoria_id,
        precio: Number(pPrecio || 0).toFixed(2),
        descuento_porcentaje: pDesc === '' ? null : Number(pDesc),
        usuario_log_id: uid ?? null
      };

      const res = await fetch(`${BASE_URL}/productos/${producto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(uid ?? '')
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('No se pudo guardar cambios del producto');
      setStep(2);
    } catch (e) {
      setError(e.message || 'Error en Paso 1');
    } finally {
      setSaving(false);
    }
  }
  async function guardarPaso2() {
    if (!ppInicialId || !proveedorInicial?.id) {
      setError(
        'No hay relación producto↔proveedor para actualizar. Cerrá y volvé a intentar.'
      );
      return;
    }

    // Si no cambió nada desde el último guardado, pasamos directo al paso 3
    const currentSig = signPPState({
      costo,
      moneda,
      monedaOtro,
      alicuota,
      incIva,
      descCompra,
      plazoDias,
      minimoCompra
    });
    if (currentSig === lastSavedStep2Sig) {
      setStep(3);
      return;
    }

    const monedaDb = moneda === 'OTRO' ? 'Otro' : moneda;
    const obsMonedaOtro =
      moneda === 'OTRO' && monedaOtro?.trim()
        ? `Moneda real: ${monedaOtro.trim()}`
        : null;

    setSaving(true);
    setError('');
    try {
      // 1) PUT PP
      const payloadPP = {
        costo_neto: Number(costo || 0),
        moneda: monedaDb,
        alicuota_iva: clamp(alicuota, 0, 27),
        inc_iva: !!incIva,
        descuento_porcentaje: clamp(descCompra, 0, 100),
        plazo_entrega_dias: Math.max(0, Number(plazoDias) || 0),
        minimo_compra: Math.max(0, Number(minimoCompra) || 0),
        vigente: true,
        usuario_log_id: uid ?? null
      };

      const r1 = await fetch(`${BASE_URL}/producto-proveedor/${ppInicialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(uid ?? '')
        },
        body: JSON.stringify(payloadPP)
      });
      if (!r1.ok) {
        const txt = await r1.text().catch(() => '');
        throw new Error(
          `No se pudo actualizar proveedor/costos: ${r1.status} ${txt}`
        );
      }

      // 2) Evitar duplicar historial si no hay cambios reales respecto del último
      //    (extra seguro, consultando el último registro y comparando)
      try {
        const ult = await fetch(
          `${BASE_URL}/producto-proveedor/${ppInicialId}/historial/ultimo`
        );
        let crearHist = true;
        if (ult.ok) {
          const ultimo = await ult.json().catch(() => null);
          const u = ultimo?.data || ultimo; // según tu API
          if (u) {
            const iguales =
              Number(u.costo_neto) === Number(costo || 0) &&
              String(u.moneda).toUpperCase() ===
                String(monedaDb).toUpperCase() &&
              Number(u.alicuota_iva) === clamp(alicuota, 0, 27) &&
              Number(u.descuento_porcentaje) === clamp(descCompra, 0, 100);
            if (iguales) crearHist = false;
          }
        }
        if (crearHist) {
          const hist = {
            costo_neto: Number(costo || 0),
            moneda: monedaDb,
            alicuota_iva: clamp(alicuota, 0, 27),
            descuento_porcentaje: clamp(descCompra, 0, 100),
            motivo: motivo || 'Actualización de parámetros de costo',
            observaciones: obsMonedaOtro,
            usuario_log_id: uid ?? null
          };
          await fetch(
            `${BASE_URL}/producto-proveedor/${ppInicialId}/historial`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': String(uid ?? '')
              },
              body: JSON.stringify(hist)
            }
          );
        }
      } catch {
        /* no crítico */
      }

      // Marcar como guardado (firma idempotente)
      setLastSavedStep2Sig(currentSig);
      setStep2Saved(true);
      // luego de guardar PP + (opcional) historial:
      setPpSnapshot({
        ...(ppSnapshot || {}),
        costo_neto: Number(costo || 0),
        moneda: monedaDb,
        alicuota_iva: clamp(alicuota, 0, 27),
        inc_iva: !!incIva,
        descuento_porcentaje: clamp(descCompra, 0, 100)
      });

      // moneda guardada para la decisión
      setLastSavedMoneda(monedaDb);

      // Prefill del egreso si es ARS
      const totalCompra = compraPreview.total;
      if (monedaDb === 'ARS') {
        setEgresoOn(true);
        setEgresoMonto(Number(totalCompra || 0));
        setEgresoDesc(
          `Alta de costo proveedor ${proveedorInicial?.razon_social || ''} · ${
            producto?.nombre || ''
          }`.trim()
        );
      } else {
        setEgresoOn(false); // si no es ARS, pedimos convertir manualmente o deshabilitamos
      }

      setStep(3);
      onRefresh?.();
    } catch (e) {
      setError(e.message || 'Error en Paso 2');
    } finally {
      setSaving(false);
    }
  }

  async function registrarEgresoCaja() {
    try {
      if (!egresoOn) return;
      if (!cajaActual?.id) {
        alert('No hay caja abierta para este usuario.');
        return;
      }
      if (lastSavedMoneda !== 'ARS') {
        alert(
          `El costo está en ${lastSavedMoneda}. Convertí a ARS o ajustá backend para manejar moneda.`
        );
        return;
      }
      const monto = Number(egresoMonto || 0);
      if (!monto || isNaN(monto) || monto <= 0) {
        alert('Monto inválido');
        return;
      }

      await fetch(`${BASE_URL}/movimientos_caja`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(uid ?? '')
        },
        body: JSON.stringify({
          caja_id: cajaActual.id,
          tipo: 'egreso',
          descripcion:
            egresoDesc ||
            `Compra proveedor ${proveedorInicial?.razon_social || ''} · ${
              producto?.nombre || ''
            }`,
          monto,
          referencia: `PP#${ppInicialId}`,
          usuario_id: uid
        })
      });
      alert('Egreso registrado en caja.');
      setEgresoOn(false); // opcional: desactivar el toggle
    } catch {
      alert('Error al registrar egreso en caja.');
    }
  }

  // ---------- Validaciones ----------
  const disabledNext1 = !pPrecio || Number.isNaN(Number(pPrecio));
  const monedaOk = moneda !== 'OTRO' ? true : monedaOtro?.trim().length > 0;
  const costoOk = !Number.isNaN(Number(costo)) && Number(costo) >= 0;
  const disabledNext2 = !(monedaOk && costoOk);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-2xl border border-rose-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100">
              <div>
                <div className="text-xs uppercase tracking-widest text-rose-500 font-semibold">
                  Setup de producto
                </div>
                <h3 className="text-xl font-bold text-rose-700">
                  {producto?.nombre || 'Producto'}
                </h3>
                {proveedorInicial?.razon_social && (
                  <p className="text-sm text-gray-500">
                    Proveedor: {proveedorInicial.razon_social}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-rose-50 text-rose-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-3">
              <StepDot
                n={1}
                active={step === 1}
                done={step > 1}
                label="Datos"
              />
              <Dash />
              <StepDot
                n={2}
                active={step === 2}
                done={step > 2}
                label="Proveedor y Costos"
              />
              <Dash />
              <StepDot n={3} active={step === 3} done={false} label="Listo" />
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {error && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-gray-700">
                        Nombre
                      </label>
                      {nombreSugerido && (
                        <button
                          type="button"
                          onClick={() => setPNombre(nombreSugerido)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"
                          title="Sugerir con marca/modelo/medida/SKU"
                        >
                          <Wand2 size={14} /> Usar sugerido
                        </button>
                      )}
                    </div>
                    <input
                      value={pNombre}
                      onChange={(e) => setPNombre(e.target.value)}
                      placeholder={nombreSugerido || 'Nombre del producto'}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pPrecio}
                      onChange={(e) => setPPrecio(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                      placeholder="0"
                    />
                  </div>

                  {/* KPIs de venta */}
                  <div className="md:col-span-2">
                    <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-4">
                      <div className="text-sm text-slate-700 font-semibold mb-2">
                        Vista previa de venta
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <KV
                          k="Precio venta (con desc)"
                          v={fmtCurrency('ARS', ventaPreview.precioConDesc)} // asumiendo venta en ARS
                        />
                        <KV
                          k="Costo compra total"
                          v={fmtCurrency(
                            moneda,
                            ventaPreview.costoTotal,
                            monedaOtro
                          )}
                        />
                        <KV
                          k="Margen $"
                          v={fmtCurrency('ARS', ventaPreview.margen$)} // margen mostrado en ARS
                        />
                        <KV
                          k="Margen %"
                          v={`${fmtNumAR(ventaPreview.margenPct)}%`}
                        />
                        <KV
                          k="Markup"
                          v={`${fmtNumAR(ventaPreview.markupPct)}%`}
                        />
                      </div>
                      {step === 2 && ventaPreview.margen$ < 0 && (
                        <div className="mt-2 text-xs text-red-600">
                          ⚠️ Atención: margen negativo respecto al costo de
                          compra.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Costo neto
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Moneda
                    </label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-400 bg-white text-gray-900"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="OTRO">OTRO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Alicuota IVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="27"
                      step="0.01"
                      value={alicuota}
                      onChange={(e) => setAlicuota(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {moneda === 'OTRO' && (
                    <div className="md:col-span-3">
                      <label className="block text-sm text-gray-700 mb-1">
                        Especificar moneda
                      </label>
                      <input
                        value={monedaOtro}
                        onChange={(e) => setMonedaOtro(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                        placeholder="Ej: BRL, UYU, CLP, etc."
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="inciva"
                      type="checkbox"
                      checked={incIva}
                      onChange={(e) => setIncIva(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="inciva" className="text-sm text-gray-700">
                      Costo incluye IVA
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Descuento compra (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={descCompra}
                      onChange={(e) => setDescCompra(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Plazo de entrega (días)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={plazoDias}
                      onChange={(e) => setPlazoDias(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Mínimo de compra
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={minimoCompra}
                      onChange={(e) => setMinimoCompra(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm text-gray-700 mb-1">
                      Motivo (historial)
                    </label>
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border text-black border-gray-300 focus:ring-2 focus:ring-rose-400"
                      placeholder="Setup inicial / Negociación / Actualización precio proveedor"
                    />
                  </div>

                  {/* Preview cálculo */}
                  <div className="md:col-span-3">
                    <div className="rounded-xl border bg-gradient-to-br from-rose-50 to-white p-4">
                      <div className="text-sm text-rose-600 font-semibold mb-2">
                        Vista previa del costo de compra
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <KV
                          k="Neto"
                          v={fmtCurrency(
                            moneda,
                            compraPreview.neto,
                            monedaOtro
                          )}
                        />
                        <KV
                          k="Neto con desc"
                          v={fmtCurrency(
                            moneda,
                            compraPreview.netoConDesc,
                            monedaOtro
                          )}
                        />
                        <KV
                          k={incIva ? 'IVA' : 'IVA a agregar'}
                          v={fmtCurrency(moneda, compraPreview.iva, monedaOtro)}
                        />
                        <KV
                          k="Total compra"
                          v={fmtCurrency(
                            moneda,
                            compraPreview.total,
                            monedaOtro
                          )}
                          strong
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4 py-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        ¡Producto listo!
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Guardamos los datos del producto y la configuración de
                        costos del proveedor.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border p-4 bg-gradient-to-br from-emerald-50/50 to-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-emerald-700">
                          ¿Registrar egreso en caja?
                        </div>
                        <div className="text-xs text-gray-500">
                          Se creará un movimiento de tipo <b>egreso</b> con la
                          compra total.
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={egresoOn}
                          onChange={(e) => setEgresoOn(e.target.checked)}
                        />
                        <span>Registrar</span>
                      </label>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Caja
                        </label>
                        <input
                          value={
                            cargandoCaja
                              ? 'Buscando caja...'
                              : cajaActual?.nombre ||
                                (cajaActual?.id
                                  ? `ID ${cajaActual.id}`
                                  : 'Sin caja abierta')
                          }
                          readOnly
                          className="w-full px-3 py-2 rounded-lg border bg-gray-50 text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Monto (ARS)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={egresoMonto}
                          onChange={(e) => setEgresoMonto(e.target.value)}
                          className="w-full px-3 py-2 text-black rounded-lg border"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">
                          Descripción
                        </label>
                        <input
                          value={egresoDesc}
                          onChange={(e) => setEgresoDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-black border"
                          placeholder={`Compra proveedor ${
                            proveedorInicial?.razon_social || ''
                          } · ${producto?.nombre || ''}`}
                        />
                      </div>

                      {lastSavedMoneda !== 'ARS' && (
                        <div className="md:col-span-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded">
                          La moneda guardada del costo es{' '}
                          <b>{lastSavedMoneda}</b>. Ingresá manualmente el
                          equivalente en ARS o ajustá tu backend para registrar
                          movimientos con moneda/FX.
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={registrarEgresoCaja}
                        disabled={
                          !egresoOn ||
                          !cajaActual?.id ||
                          lastSavedMoneda !== 'ARS' ||
                          Number(egresoMonto) <= 0
                        }
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60"
                      >
                        Registrar egreso
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-rose-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">Paso {step} de 3</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={saving}
                >
                  Cerrar
                </button>
                {/* Botón Atrás visible en pasos > 1 */}
                {step > 1 && (
                  <button
                    onClick={goPrev}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-gray-700"
                    title="Alt + ←"
                  >
                    Atrás
                  </button>
                )}
                {step === 1 && (
                  <button
                    onClick={guardarPaso1}
                    disabled={saving || disabledNext1}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60"
                    title="Alt + →"
                  >
                    Continuar <ChevronRight size={18} />
                  </button>
                )}
                {step === 2 && (
                  <button
                    onClick={guardarPaso2}
                    disabled={saving || disabledNext2 || step2Saved} // 👈 deshabilita si ya está guardado y no cambiaste nada
                    className={
                      'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ' +
                      (step2Saved
                        ? 'bg-emerald-600 cursor-not-allowed'
                        : 'bg-rose-500 hover:bg-rose-600')
                    }
                    title={
                      step2Saved
                        ? 'Ya está guardado. Modificá algo para habilitar.'
                        : 'Alt + →'
                    }
                  >
                    {step2Saved ? 'Guardado ✓' : 'Guardar y finalizar'}{' '}
                    <ChevronRight size={18} />
                  </button>
                )}

                {step === 3 && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Listo
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepDot({ n, label, active, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          'h-7 w-7 rounded-full border flex items-center justify-center text-sm font-semibold',
          active
            ? 'bg-rose-600 text-white border-rose-600'
            : done
            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
            : 'bg-white text-rose-600 border-rose-300'
        ].join(' ')}
      >
        {done ? <CheckCircle2 size={18} /> : n}
      </div>
      <span
        className={
          'text-xs ' +
          (active ? 'text-rose-700 font-semibold' : 'text-gray-500')
        }
      >
        {label}
      </span>
    </div>
  );
}
function Dash() {
  return (
    <div className="flex-1 h-[2px] bg-gradient-to-r from-rose-200 to-rose-100" />
  );
}
function KV({ k, v, strong }) {
  return (
    <div className="rounded-lg bg-white/70 border p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {k}
      </div>
      <div
        className={
          'mt-0.5 text-sm ' +
          (strong ? 'font-semibold text-gray-900' : 'text-gray-700')
        }
      >
        {v}
      </div>
    </div>
  );
}
