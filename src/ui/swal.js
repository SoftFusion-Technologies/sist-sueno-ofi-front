// src/ui/swal.js
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Tema base: oscuro translúcido con animación
export const baseSwal = Swal.mixin({
  background: 'rgba(17, 24, 39, 0.9)', // tailwind gray-900/90
  color: '#E5E7EB', // gray-200
  confirmButtonColor: '#10b981', // emerald-500
  cancelButtonColor: '#6b7280', // gray-500
  showClass: {
    popup: 'swal2-show animate__animated animate__fadeInUp'
  },
  hideClass: {
    popup: 'swal2-hide animate__animated animate__fadeOutDown'
  },

  customClass: {
    popup: 'rounded-2xl shadow-2xl',
    title: 'text-xl font-bold',
    htmlContainer: 'text-sm',
    confirmButton: 'rounded-xl font-semibold px-4 py-2',
    cancelButton: 'rounded-xl font-semibold px-4 py-2',
    actions: 'gap-2'
  }
});

// Renderiza tips como lista <ul>
const tipsToHTML = (tips) =>
  Array.isArray(tips) && tips.length
    ? `<ul style="margin:0.5rem 0 0;padding-left:1rem;opacity:.9">
         ${tips.map((t) => `<li>• ${t}</li>`).join('')}
       </ul>`
    : '';

export const showErrorSwal = ({ title = 'Error', text = '', tips = [] } = {}) =>
  baseSwal.fire({
    icon: 'error',
    title,
    html: `${text || ''}${tipsToHTML(tips)}`,
    confirmButtonText: 'Entendido'
  });

export const showWarnSwal = ({
  title = 'Atención',
  text = '',
  tips = []
} = {}) =>
  baseSwal.fire({
    icon: 'warning',
    title,
    html: `${text || ''}${tipsToHTML(tips)}`,
    confirmButtonText: 'Ok'
  });

export const showSuccessSwal = ({ title = 'Hecho', text = '' } = {}) =>
  baseSwal.fire({
    icon: 'success',
    title,
    text,
    timer: 1400,
    showConfirmButton: false,
    position: 'top-end',
    toast: true
  });

export const showConfirmSwal = async ({
  title = '¿Confirmar?',
  text = '',
  confirmText = 'Sí, confirmar',
  cancelText = 'Cancelar',
  icon = 'question'
} = {}) =>
  baseSwal.fire({
    icon,
    title,
    html: text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
