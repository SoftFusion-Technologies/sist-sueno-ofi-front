// src/Components/Bancos/BankMovementViewModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMoneyCheckAlt } from 'react-icons/fa';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function BankMovementViewModal({
  open,
  onClose,
  data,
  bancoNombre,
  cuentaNombre
}) {
  if (!data) return null;
  const isCredito = Number(data.credito) > 0;
  const monto = isCredito ? data.credito : data.debito;

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
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#003049] to-[#005f73]">
              <div className="text-3xl text-white/90">
                <FaMoneyCheckAlt />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">
                  {isCredito ? 'Crédito' : 'Débito'} — {fmt(monto)}
                  {data.saldo_acumulado !== undefined && (
                    <span className="text-white/80 text-sm ml-2">
                      • Acum: {fmt(data.saldo_acumulado)}
                    </span>
                  )}
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
                <div className="text-xs text-gray-500">Fecha</div>
                <div className="text-gray-800">
                  {new Date(data.fecha).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Descripción</div>
                <div className="text-gray-800">{data.descripcion || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Referencia Tipo</div>
                <div className="text-gray-800">
                  {data.referencia_tipo || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Referencia ID</div>
                <div className="text-gray-800">{data.referencia_id || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">ID</div>
                <div className="text-gray-800">{data.id}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Creado</div>
                <div className="text-gray-800">
                  {new Date(data.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Actualizado</div>
                <div className="text-gray-800">
                  {new Date(data.updated_at).toLocaleString()}
                </div>
              </div>
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
