import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export default function FeedbackModal({
  open,
  type = 'info',
  title,
  message,
  onClose,
  autoCloseMs = 3000
}) {
  // Títulos por defecto
  const defaultTitle =
    type === 'success'
      ? 'Operación exitosa'
      : type === 'error'
      ? 'Ocurrió un error'
      : 'Información';

  // Colores / estilos por tipo
  const palette =
    {
      success: {
        ring: 'ring-emerald-500/30',
        border: 'border-emerald-500/30',
        bg: 'bg-[#0f1213]',
        title: 'text-emerald-300',
        text: 'text-gray-100',
        bar: 'bg-emerald-500'
      },
      error: {
        ring: 'ring-rose-500/30',
        border: 'border-rose-500/30',
        bg: 'bg-[#0f1213]',
        title: 'text-rose-300',
        text: 'text-gray-100',
        bar: 'bg-rose-500'
      },
      info: {
        ring: 'ring-sky-500/25',
        border: 'border-sky-500/25',
        bg: 'bg-[#0f1213]',
        title: 'text-sky-300',
        text: 'text-gray-100',
        bar: 'bg-sky-500'
      }
    }[type] || palette?.info;

  // Cierre con ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Autocierre + barra de progreso
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    const started = Date.now();
    let raf;
    const tick = () => {
      const elapsed = Date.now() - started;
      const p = Math.min(1, elapsed / autoCloseMs);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onClose?.();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [open, autoCloseMs, onClose]);

  // Click fuera para cerrar
  const onOverlay = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px] flex items-center justify-center px-4"
          onMouseDown={onOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-md ${palette.bg} border ${palette.border} rounded-2xl shadow-2xl ring-1 ${palette.ring} overflow-hidden`}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            onMouseDown={(e) => e.stopPropagation()} // evita cerrar al click dentro
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <h3 className={`text-base font-semibold ${palette.title}`}>
                {title || defaultTitle}
              </h3>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="text-gray-400 hover:text-gray-200 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className={`px-5 py-4 ${palette.text}`}>
              <p className="text-sm leading-relaxed">{message}</p>
            </div>

            {/* Footer con barra de progreso */}
            <div className="px-5 pb-4 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-sm border border-white/15 text-gray-100 hover:bg-white/5 transition"
              >
                Cerrar
              </button>
            </div>

            {/* Progress bar (auto close) */}
            <div className="h-1 w-full bg-white/5">
              <div
                className={`h-1 ${palette.bar} transition-[width] duration-100`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
