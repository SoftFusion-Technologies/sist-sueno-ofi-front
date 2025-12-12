// src/utils/alerts.js
import Swal from 'sweetalert2';

/**
 * Config global (editás acá y afecta toda la app)
 */
let CFG = {
  primary: '#059669', // emerald
  danger: '#dc2626', // red
  cancel: '#64748b', // slate
  toastTimer: 2200,
  zIndex: 9999,
  onSessionExpired: null // callback opcional (ej: navigate('/login'))
};

/**
 * Permite configurar desde App.jsx (opcional)
 */
export const configureAlerts = (opts = {}) => {
  CFG = { ...CFG, ...opts };
};

/**
 * Helper: extraer mensaje consistente (axios/fetch/throw)
 */
export const getErrorMessage = (err, fallback = 'Ocurrió un error') => {
  return (
    err?.response?.data?.mensajeError ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
};

const baseModal = {
  confirmButtonColor: CFG.primary,
  heightAuto: false,
  didOpen: () => {
    const container = Swal.getContainer();
    if (container) container.style.zIndex = String(CFG.zIndex);
  }
};

const toastMixin = () =>
  Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: CFG.toastTimer,
    timerProgressBar: true,
    heightAuto: false,
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.zIndex = String(CFG.zIndex);
    }
  });

export const Alerts = {
  // ---- Toasts ----
  toastSuccess: (title) => toastMixin().fire({ icon: 'success', title }),
  toastError: (title) => toastMixin().fire({ icon: 'error', title }),
  toastInfo: (title) => toastMixin().fire({ icon: 'info', title }),

  // ---- Modales ----
  success: (title, text) =>
    Swal.fire({
      ...baseModal,
      icon: 'success',
      title,
      text,
      confirmButtonText: 'OK'
    }),

  info: (title, text) =>
    Swal.fire({
      ...baseModal,
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK'
    }),

  warn: (title, text) =>
    Swal.fire({
      ...baseModal,
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'OK',
      confirmButtonColor: CFG.primary
    }),

  error: (title, text) =>
    Swal.fire({
      ...baseModal,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: CFG.primary
    }),

  // ---- Confirmación ----
  confirm: async ({
    title = '¿Confirmar?',
    text = '¿Deseás continuar?',
    confirmText = 'Sí, confirmar',
    cancelText = 'Cancelar',
    danger = false
  } = {}) => {
    const res = await Swal.fire({
      ...baseModal,
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: danger ? CFG.danger : CFG.primary,
      cancelButtonColor: CFG.cancel,
      reverseButtons: true
    });
    return res.isConfirmed;
  },

  // ---- Loading ----
  loading: (title = 'Procesando...') =>
    Swal.fire({
      ...baseModal,
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = String(CFG.zIndex);
        Swal.showLoading();
      }
    }),

  close: () => Swal.close(),

  // ---- Sesión expirada (estándar) ----
  sessionExpired: async () => {
    await Swal.fire({
      ...baseModal,
      icon: 'warning',
      title: 'Sesión expirada',
      text: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      confirmButtonText: 'Ir a login',
      confirmButtonColor: CFG.primary
    });
    if (typeof CFG.onSessionExpired === 'function') {
      CFG.onSessionExpired();
    }
  }
};
