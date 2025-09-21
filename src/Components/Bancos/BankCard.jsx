// src/Components/Bancos/BankCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUniversity,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash
} from 'react-icons/fa';

const Chip = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
    ${active ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'}`}
  >
    {active ? <FaCheckCircle /> : <FaTimesCircle />}
    {active ? 'Activo' : 'Inactivo'}
  </span>
);

export default function BankCard({ item, onEdit, onToggleActivo, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5
                 shadow-lg hover:shadow-teal-400/60 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-teal-600 shrink-0">
          <FaUniversity />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              {item.nombre}
            </h3>
            <Chip active={!!item.activo} />
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-700">CUIT:</span>{' '}
              {item.cuit || '-'}
            </div>
            <div>
              <span className="font-medium text-gray-700">Alias:</span>{' '}
              {item.alias || '-'}
            </div>
            <div className="sm:col-span-2 text-xs text-gray-500">
              ID: {item.id} — Creado:{' '}
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-yellow-500 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
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
            <button
              onClick={() => onToggleActivo(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {item.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
