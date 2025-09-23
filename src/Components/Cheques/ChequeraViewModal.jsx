// src/Components/Cheques/ChequeraViewModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaBook } from 'react-icons/fa';

export default function ChequeraViewModal({
  open,
  onClose,
  data,
  bancoNombre,
  cuentaNombre
}) {
  if (!data) return null;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
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
            className="relative w-[min(900px,92vw)] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#065f46] to-[#10b981]">
              <div className="text-3xl text-white/90">
                <FaBook />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">
                  Chequera #{data.id} • {data.numero_inicio}–{data.numero_fin}
                </h3>
                <div className="text-white/85 text-sm">
                  {bancoNombre} • {cuentaNombre}
                </div>
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
                <div className="text-xs text-gray-500">Banco</div>
                <div className="text-gray-800">{bancoNombre}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Cuenta</div>
                <div className="text-gray-800">{cuentaNombre}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Descripción</div>
                <div className="text-gray-800">{data.descripcion || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Rango</div>
                <div className="text-gray-800">
                  {data.nro_desde} — {data.nro_hasta}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Próximo Nº</div>
                <div className="text-gray-800">{data.proximo_nro ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Estado</div>
                <div className="text-gray-800 capitalize">
                  {data.estado || 'activa'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ID</div>
                <div className="text-gray-800">{data.id}</div>
              </div>
              {data.created_at && (
                <div>
                  <div className="text-xs text-gray-500">Creado</div>
                  <div className="text-gray-800">
                    {new Date(data.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              {data.updated_at && (
                <div>
                  <div className="text-xs text-gray-500">Actualizado</div>
                  <div className="text-gray-800">
                    {new Date(data.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
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
