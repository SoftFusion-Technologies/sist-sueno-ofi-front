// src/Components/Bancos/BankMovementCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaMoneyCheckAlt,
  FaUniversity,
  FaWallet,
  FaEdit,
  FaTrash,
  FaEye
} from 'react-icons/fa';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function BankMovementCard({
  item,
  bancoNombre,
  cuentaNombre,
  onView,
  onEdit,
  onDelete
}) {
  const isCredito = Number(item.credito) > 0;
  const monto = isCredito ? item.credito : item.debito;
  const sign = isCredito ? '+' : '-';
  const color = isCredito ? 'text-emerald-700' : 'text-rose-700';
  const bgAmt = isCredito ? 'bg-emerald-50' : 'bg-rose-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg
                 hover:shadow-teal-400/60 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-teal-600 shrink-0">
          <FaMoneyCheckAlt />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              {item.descripcion || 'Movimiento'}
            </h3>
            <div
              className={`text-sm font-semibold ${color} ${bgAmt} px-2 py-1 rounded-md`}
            >
              {sign}
              {fmt(monto)}
              {item.saldo_acumulado !== undefined && (
                <span className="ml-2 text-xs text-gray-600">
                  • Acum: {fmt(item.saldo_acumulado)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUniversity className="text-teal-600" />
              <span className="truncate" title={bancoNombre}>
                {bancoNombre}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaWallet className="text-teal-600" />
              <span className="truncate" title={cuentaNombre}>
                {cuentaNombre}
              </span>
            </div>
            <div>
              <span className="font-medium">Fecha:</span>{' '}
              {new Date(item.fecha).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Referencia:</span>{' '}
              {item.referencia_tipo || '—'}{' '}
              {item.referencia_id ? `#${item.referencia_id}` : ''}
            </div>
            <div className="sm:col-span-2 text-xs text-gray-500">
              ID: {item.id} — Creado:{' '}
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onView(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <FaEye /> Ver
            </button>
            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
