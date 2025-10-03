// src/Components/Cheques/ChequeraFormModal.jsx
import React, { useEffect, useMemo, useState, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { listBancos } from '../../api/bancos';
import { listBancoCuentas } from '../../api/bancoCuentas';
import Swal from 'sweetalert2';
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
import { X, CreditCard, Building2, Book, Hash, ArrowRight } from 'lucide-react';


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

  const tipsHtml = (tips) =>
    Array.isArray(tips) && tips.length
      ? `<ul style="text-align:left;padding-left:18px;margin:8px 0 0">${tips
          .map((t) => `<li>${t}</li>`)
          .join('')}</ul>`
      : '';

  const pickErr = (e) => {
    // Si usás interceptor, err YA ES { ok:false, code, mensajeError, tips, details }
    if (e && (e.mensajeError || e.code || e.ok === false)) return e;
    // Fallback Axios
    const d = e?.response?.data;
    if (d && (d.mensajeError || d.code || d.ok === false)) return d;
    // Último recurso
    return {
      ok: false,
      code: 'ERROR',
      mensajeError: e?.message || 'Ocurrió un error inesperado'
    };
  };

  const toNumber = (v) => (v === '' || v == null ? null : Number(v));

  const submit = async (e) => {
    e.preventDefault();

    // ── Validaciones UI
    if (!form.banco_cuenta_id) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta la cuenta bancaria',
        text: 'Seleccione una cuenta bancaria.'
      });
      return;
    }
    if (!form.descripcion?.trim()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Descripción requerida',
        text: 'Complete la descripción.'
      });
      return;
    }

    const desde = toNumber(form.nro_desde);
    const hasta = toNumber(form.nro_hasta);

    if (!(desde > 0 && hasta > 0 && hasta >= desde)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Rango inválido',
        text: 'El rango de cheques es inválido.'
      });
      return;
    }

    const hasProx = form.proximo_nro !== '' && form.proximo_nro != null;
    const proxNum = hasProx ? toNumber(form.proximo_nro) : null;

    if (hasProx && !(proxNum >= desde && proxNum <= hasta)) {
      await Swal.fire({
        icon: 'warning',
        title: 'Próximo número fuera de rango',
        text: 'El próximo número debe estar dentro del rango.'
      });
      return;
    }

    const basePayload = {
      banco_cuenta_id: Number(form.banco_cuenta_id),
      descripcion: form.descripcion.trim(),
      nro_desde: desde,
      nro_hasta: hasta,
      ...(hasProx ? { proximo_nro: proxNum } : {}), // si no viene, el backend usa nro_desde
      estado: form.estado
    };

    try {
      setSaving(true);
      await onSubmit(basePayload);

      await Swal.fire({
        icon: 'success',
        title: hasProx ? 'Chequera guardada' : 'Chequera creada',
        text: `Rango ${desde}–${hasta}`
      });

      onClose();
    } catch (rawErr) {
      const err = pickErr(rawErr);

      // Caso especial: superposición con sugerencia
      if (err.code === 'RANGO_SUPERPUESTO' && err.details?.suggestion) {
        const s = err.details.suggestion; // { nro_desde, nro_hasta, proximo_nro }
        const { isConfirmed } = await Swal.fire({
          icon: 'warning',
          title: err.mensajeError || 'Rango en conflicto',
          html: `
          <p style="margin:0 0 8px">Rango pedido: <b>${
            err.details?.requested?.nro_desde
          }–${err.details?.requested?.nro_hasta}</b></p>
          <p style="margin:0 0 8px">Rango sugerido: <b>${s.nro_desde}–${
            s.nro_hasta
          }</b></p>
          ${tipsHtml(err.tips)}
          <p style="margin-top:8px">¿Querés usar el rango sugerido?</p>
        `,
          showCancelButton: true,
          confirmButtonText: 'Usar sugerido',
          cancelButtonText: 'Editar'
        });

        if (isConfirmed) {
          try {
            // Reintento con auto=true aplicando sugerencia
            await onSubmit({
              ...basePayload,
              nro_desde: s.nro_desde,
              nro_hasta: s.nro_hasta,
              proximo_nro: s.proximo_nro ?? s.nro_desde,
              auto: true
            });

            await Swal.fire({
              icon: 'success',
              title: 'Chequera creada con rango sugerido',
              text: `Rango ${s.nro_desde}–${s.nro_hasta}`
            });

            onClose();
          } catch (rawErr2) {
            const err2 = pickErr(rawErr2);
            await Swal.fire({
              icon: 'error',
              title:
                err2.mensajeError || 'No se pudo crear con el rango sugerido',
              html: tipsHtml(err2.tips) || undefined
            });
          }
        }
        return;
      }

      // Otros errores normalizados
      await Swal.fire({
        icon: 'error',
        title: err.mensajeError || 'Error',
        html: tipsHtml(err.tips) || undefined
      });
    } finally {
      setSaving(false);
    }
  };
  const titleId = useId();

  // Cálculos preview
  const width = String(form?.nro_hasta ?? '').length || 6;
  const desde = toInt(form?.nro_desde);
  const hasta = toInt(form?.nro_hasta);
  const prox = toInt(form?.proximo_nro);

  const rangoOK = (desde && hasta && hasta >= desde) || false;
  const proxOK = rangoOK && prox != null && prox >= desde && prox <= hasta;
  const disponibles = useMemo(() => {
    if (!rangoOK || prox == null) return null;
    const d = hasta - prox + 1;
    return Number.isFinite(d) ? Math.max(d, 0) : null;
  }, [rangoOK, hasta, prox]);

  // Esc para cerrar
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && open && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

          {/* Ambient grid + auroras (no afecta layout) */}
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

          {/* Panel responsive */}
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
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white  "
                >
                  {isEdit ? 'Editar Chequera' : 'Nueva Chequera'}
                </h3>
              </motion.div>

              {/* FORM con stagger y fields que suben */}
              <motion.form
                onSubmit={submit}
                variants={formContainerV}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6"
              >
                {/* Banco + Cuenta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      Banco
                    </label>
                    <select
                      name="banco_id"
                      value={form.banco_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="" className="bg-gray-900">
                        (Todos)
                      </option>
                      {bancos.map((b) => (
                        <option key={b.id} value={b.id} className="bg-gray-900">
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                      <Book className="h-4 w-4 text-gray-400" />
                      Cuenta <span className="text-cyan-300">*</span>
                    </label>
                    <select
                      name="banco_cuenta_id"
                      value={form.banco_cuenta_id}
                      onChange={handle}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    >
                      <option value="" className="bg-gray-900">
                        Seleccionar…
                      </option>
                      {cuentasFiltradas.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-900">
                          {c.nombre_cuenta} {c.moneda ? `(${c.moneda})` : ''}
                        </option>
                      ))}
                    </select>
                  </motion.div>
                </div>

                {/* Descripción */}
                <motion.div variants={fieldV}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    Descripción <span className="text-cyan-300">*</span>
                  </label>
                  <input
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handle}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    placeholder="Chequera 2025 CC$"
                  />
                </motion.div>

                {/* Rango / Próximo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Nº desde <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="nro_desde"
                      value={form.nro_desde}
                      onChange={handle}
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                    {rangoOK && desde != null && (
                      <p className="mt-1 text-xs text-gray-300/70">
                        Ej: {pad(desde, width)}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Nº hasta <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="nro_hasta"
                      value={form.nro_hasta}
                      onChange={handle}
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-white
                                 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent"
                    />
                    {rangoOK && hasta != null && (
                      <p className="mt-1 text-xs text-gray-300/70">
                        Ej: {pad(hasta, width)}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={fieldV}>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Próximo Nº <span className="text-cyan-300">*</span>
                    </label>
                    <input
                      name="proximo_nro"
                      value={form.proximo_nro}
                      onChange={handle}
                      type="number"
                      min="1"
                      className={`w-full rounded-xl border px-3.5 py-3 text-white focus:outline-none
                                  ${
                                    proxOK || prox == null
                                      ? 'border-white/10 bg-white/5 focus:ring-2 focus:ring-cyan-300/40 focus:border-transparent'
                                      : 'border-rose-500/50 bg-rose-500/10 focus:ring-2 focus:ring-rose-400/40'
                                  }`}
                    />
                    {rangoOK && prox != null && (
                      <p
                        className={`mt-1 text-xs ${
                          proxOK ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {proxOK
                          ? `Disponibles: ${disponibles ?? '—'}`
                          : 'El próximo número debe estar dentro del rango'}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Preview compacto */}
                <motion.div
                  variants={fieldV}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200
                             flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3"
                >
                  <span className="inline-flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 opacity-70" />
                    <strong className="font-semibold">Rango:</strong>{' '}
                    {rangoOK
                      ? `${pad(desde, width)} – ${pad(hasta, width)}`
                      : '—'}
                  </span>
                  <span className="hidden sm:inline opacity-60">•</span>
                  <span>
                    <strong className="font-semibold">Próximo:</strong>{' '}
                    {prox != null ? pad(prox, width) : '—'}
                  </span>
                  <span className="hidden sm:inline opacity-60">•</span>
                  <span>
                    <strong className="font-semibold">Disponibles:</strong>{' '}
                    {disponibles ?? '—'}
                  </span>
                </motion.div>

                {/* Estado */}
                <motion.div variants={fieldV}>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
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
                    disabled={saving || (rangoOK && prox != null && !proxOK)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold
                               hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    title={
                      rangoOK && prox != null && !proxOK
                        ? 'El próximo número debe estar dentro del rango'
                        : undefined
                    }
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
