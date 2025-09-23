// src/Components/Cheques/ChequeraCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaBook,
  FaUniversity,
  FaWallet,
  FaEdit,
  FaTrash,
  FaEye,
  FaRegFolderOpen
} from 'react-icons/fa';

const ChipEstado = ({ estado = 'activa' }) => {
  const map = {
    activa: 'bg-emerald-100 text-emerald-700',
    agotada: 'bg-gray-200 text-gray-700',
    bloqueada: 'bg-amber-100 text-amber-700',
    anulada: 'bg-rose-100 text-rose-700'
  };
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
        map[estado] || map['activa']
      }`}
    >
      {estado}
    </span>
  );
};

export default function ChequeraCard({
  item,
  bancoNombre,
  cuentaNombre,
  onView,
  onEdit,
  onDelete
}) {
  // 🔒 Guard: si viene nulo/indefinido, no renderiza
  if (!item) return null;

  const id = item.id ?? '—';
  const desc = item.descripcion || `Chequera #${id}`;
  const desde = item.nro_desde ?? '—';
  const hasta = item.nro_hasta ?? '—';
  const prox = item.proximo_nro ?? '—';
  const estado = item.estado || 'activa';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg
                 hover:shadow-emerald-400/60 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-emerald-600 shrink-0">
          <FaBook />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              CHEQUERA: {desc}
            </h3>
            <ChipEstado estado={estado} />
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUniversity className="text-emerald-600" />
              <span className="truncate" title={bancoNombre}>
                {bancoNombre || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaWallet className="text-emerald-600" />
              <span className="truncate" title={cuentaNombre}>
                {cuentaNombre || '—'}
              </span>
            </div>
            <div>
              <span className="font-medium">Rango:</span> {desde} – {hasta}
            </div>
            <div>
              <span className="font-medium">Próximo Nº:</span> {prox}
            </div>
            <div className="sm:col-span-2 text-xs text-gray-500">
              ID: {id}{' '}
              {item.created_at && (
                <>— Creado: {new Date(item.created_at).toLocaleString()}</>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onView?.(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <FaEye /> Ver
            </button>
            <button
              onClick={() => onView?.(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <FaRegFolderOpen /> Abrir
            </button>
            <button
              onClick={() => onEdit?.(item)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                         bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onDelete?.(item)}
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
