// src/ui/swal.js
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/* =========================
   Estilo base (oscuro)
   ========================= */
export const baseSwal = Swal.mixin({
  background: 'rgba(17, 24, 39, 0.9)', // gray-900/90
  color: '#E5E7EB', // gray-200
  confirmButtonColor: '#10b981', // emerald-500
  cancelButtonColor: '#6b7280', // gray-500
  showClass: { popup: 'swal2-show animate__animated animate__fadeInUp' },
  hideClass: { popup: 'swal2-hide animate__animated animate__fadeOutDown' },
  customClass: {
    popup: 'rounded-2xl shadow-2xl',
    title: 'text-xl font-bold',
    htmlContainer: 'text-sm',
    confirmButton: 'rounded-xl font-semibold px-4 py-2',
    cancelButton: 'rounded-xl font-semibold px-4 py-2',
    actions: 'gap-2'
  }
});

/* =========================
   Utilidades internas
   ========================= */
const isPO = (v) => v && typeof v === 'object' && !Array.isArray(v);
const tipsToHTML = (tips) =>
  Array.isArray(tips) && tips.length
    ? `<div style="margin-top:10px"><strong>Sugerencias</strong><ul style="margin:.25rem 0 0 1rem;text-align:left">${tips
        .map((t) => `<li>${t}</li>`)
        .join('')}</ul></div>`
    : '';

/** Normaliza llamadas en formato:
 *  - objeto:  { title, text/html, tips, ... }
 *  - posicional: (title, text, opts?)
 */
const norm = (inputOrTitle, text, opts = {}) => {
  if (isPO(inputOrTitle)) return inputOrTitle;
  return { title: inputOrTitle, text, ...(opts || {}) };
};

/* =========================
   Helpers de uso general
   ========================= */
export const showSuccessToast = (title = 'Hecho', text = '') =>
  baseSwal.fire({
    icon: 'success',
    title,
    text,
    timer: 1400,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });

export const showSuccessSwal = (a, b, c) => {
  const { title = 'Hecho', text = '', html, footer } = norm(a, b, c);
  return baseSwal.fire({
    icon: 'success',
    title,
    ...(html ? { html } : { text }),
    footer,
    confirmButtonText: 'Ok'
  });
};

export const showWarnSwal = (a, b, c) => {
  const {
    title = 'Atención',
    text = '',
    html,
    tips = [],
    footer
  } = norm(a, b, c);
  return baseSwal.fire({
    icon: 'warning',
    title,
    html: `${html ?? text ?? ''}${tipsToHTML(tips)}`,
    footer,
    confirmButtonText: 'Ok'
  });
};

export const showErrorSwal = (a, b, c) => {
  const { title = 'Error', text = '', html, tips = [], footer } = norm(a, b, c);
  return baseSwal.fire({
    icon: 'error',
    title,
    html: `${html ?? text ?? ''}${tipsToHTML(tips)}`,
    footer,
    confirmButtonText: 'Entendido'
  });
};

/** Confirm reutilizable. Soporta:
 *  - posicional: (title, textOrHtml, { confirmText, cancelText, icon })
 *  - objeto: { title, text/html, confirmText, cancelText, icon }
 *  Devuelve boolean (isConfirmed).
 */
export const showConfirmSwal = async (a, b, c) => {
  const {
    title = '¿Confirmar?',
    text,
    html,
    confirmText = 'Sí, confirmar',
    cancelText = 'Cancelar',
    icon = 'question'
  } = norm(a, b, c);
  const { isConfirmed } = await baseSwal.fire({
    icon,
    title,
    ...(html ? { html } : { html: text }), // usamos html si viene, si no interpretamos `text` como html simple
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
  return isConfirmed;
};

/* =========================
   Errores normalizados API
   ========================= */
/** Muestra errores del backend normalizados por tu interceptor:
 *    { ok:false, code, mensajeError, tips?:[], details?:{} }
 *  Firma:
 *   - showApiErrorSwal(err)
 *   - showApiErrorSwal(err, { title?, icon? })
 */
export const showApiErrorSwal = (err, opt = {}) => {
  const title = opt.title || 'Atención';
  const code = (err?.code || '').toString().toUpperCase();
  const msg = err?.mensajeError || err?.message || 'Ocurrió un error';
  const tips = Array.isArray(err?.tips) ? err.tips : [];
  const det = err?.details || err?.detalle || {};

  const counts = [];
  if (typeof det.movimientosAsociados === 'number')
    counts.push(`Movimientos: <strong>${det.movimientosAsociados}</strong>`);
  if (typeof det.chequerasAsociadas === 'number')
    counts.push(`Chequeras: <strong>${det.chequerasAsociadas}</strong>`);

  const countsHtml =
    counts.length > 0
      ? `<div style="text-align:left;margin-top:10px">${counts
          .map((c) => `• ${c}`)
          .join('<br/>')}</div>`
      : '';

  const finalIcon =
    opt.icon ||
    (code.includes('DUPLICATE') || code.includes('CONFLICT')
      ? 'warning'
      : 'error');

  return baseSwal.fire({
    icon: finalIcon,
    title,
    html: `<div style="text-align:left">${msg}</div>${countsHtml}${tipsToHTML(
      tips
    )}`,
    confirmButtonText: 'Ok'
  });
};
