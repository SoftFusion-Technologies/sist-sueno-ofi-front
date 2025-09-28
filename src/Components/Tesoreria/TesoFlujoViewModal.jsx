// src/Components/Tesoreria/TesoFlujoViewModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function TesoFlujoViewModal({ open, onClose, data }) {
  if (!data) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 210, damping: 22 }}
            className="relative w-[min(800px,92vw)] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b bg-gradient-to-r from-amber-700 to-amber-500 text-white flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">
                  Proyección de Tesorería
                </div>
                <h3 className="text-lg font-bold">
                  {data.fecha} — {data.signo?.toUpperCase()} — {fmt(data.monto)}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1"
              >
                Cerrar
              </button>
            </div>

            <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500">Fecha</div>
                <div className="text-gray-800">{data.fecha}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Signo</div>
                <div className="text-gray-800">{data.signo}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Monto</div>
                <div className="text-gray-800">{fmt(data.monto)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Origen</div>
                <div className="text-gray-800">{data.origen_tipo || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Origen ID</div>
                <div className="text-gray-800">{data.origen_id ?? '—'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Descripción</div>
                <div className="text-gray-800">{data.descripcion || '—'}</div>
              </div>
              {data.created_at && (
                <div>
                  <div className="text-xs text-gray-500">Creado</div>
                  <div className="text-gray-800">
                    {new Date(data.created_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
