// ModalFeedback.jsx
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

export function ModalFeedback({ open, onClose, msg, type = 'info' }) {
  if (!open) return null;

  let icon, color, title;
  switch (type) {
    case 'success':
      icon = <FaCheckCircle className="text-green-400 text-3xl" />;
      color = 'text-green-400';
      title = '¡Operación exitosa!';
      break;
    case 'error':
      icon = <FaExclamationTriangle className="text-red-500 text-3xl" />;
      color = 'text-red-400';
      title = 'Ocurrió un error';
      break;
    default:
      icon = <FaInfoCircle className="text-cyan-400 text-3xl" />;
      color = 'text-cyan-400';
      title = 'Información';
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-[#232b32] rounded-2xl shadow-2xl p-7 max-w-sm w-full mx-4 border border-gray-700 animate-fade-in">
        <div className={`flex items-center gap-3 mb-2 ${color}`}>
          {icon}
          <span className={`font-bold text-lg ${color}`}>{title}</span>
        </div>
        <div className="text-gray-200 whitespace-pre-line mb-6">{msg}</div>
        <div className="text-right">
          <button
            className="bg-cyan-500 hover:bg-cyan-600 transition px-6 py-2 text-white font-medium rounded-lg"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
