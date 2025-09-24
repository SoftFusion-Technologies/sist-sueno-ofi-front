// src/Components/Bancos/BankAccountCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaWallet,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaCopy,
  FaHashtag,
  FaUniversity,
  FaEye
} from 'react-icons/fa';

const ChipActivo = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full
    ${active ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'}`}
  >
    {active ? <FaCheckCircle /> : <FaTimesCircle />}
    {active ? 'Activo' : 'Inactivo'}
  </span>
);

const ChipMoneda = ({ moneda }) => (
  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-sky-100 text-sky-700">
    <FaHashtag /> {moneda || 'ARS'}
  </span>
);

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text || '');
  } catch {}
};

export default function BankAccountCard({
  item,
  bancoNombre,
  onEdit,
  onToggleActivo,
  onDelete,
  onView
}) {
  const cbuShown = item.cbu || '—';
  const aliasShown = item.alias_cbu || '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5
             shadow-lg hover:shadow-teal-400/60 hover:scale-[1.02] transition-all duration-300
             overflow-hidden" // ✅ evita que nada se “salga” visualmente
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-teal-600 shrink-0">
          <FaWallet />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              {item.nombre_cuenta}
            </h3>
            <div className="flex items-center gap-2">
              <ChipMoneda moneda={item.moneda} />
              <ChipActivo active={!!item.activo} />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUniversity className="text-teal-600" />
              <span className="truncate" title={bancoNombre || ''}>
                {bancoNombre || `Banco #${item.banco_id}`}
              </span>
            </div>
            <div>
              <span className="font-medium">N° Cuenta:</span>{' '}
              {item.numero_cuenta || '—'}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">CBU:</span>
              <span className="truncate">{cbuShown}</span>
              {item.cbu && (
                <button
                  onClick={() => copy(item.cbu)}
                  className="text-gray-500 hover:text-teal-700"
                  title="Copiar CBU"
                >
                  <FaCopy />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Alias:</span>
              <span className="truncate">{aliasShown}</span>
              {item.alias_cbu && (
                <button
                  onClick={() => copy(item.alias_cbu)}
                  className="text-gray-500 hover:text-teal-700"
                  title="Copiar alias"
                >
                  <FaCopy />
                </button>
              )}
            </div>
            <div className="sm:col-span-2 text-xs text-gray-500">
              ID: {item.id} — Creado:{' '}
              {new Date(item.created_at).toLocaleString()}
            </div>
          </div>

          <div className="mt-4 grid gap-2 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
            <button
              onClick={() => onView(item)}
              className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                 bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <FaEye className="text-base" />
              <span className="hidden md:inline">Ver</span>
            </button>

            <button
              onClick={() => onEdit(item)}
              className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                 bg-yellow-500 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <FaEdit className="text-base" />
              <span className="hidden md:inline">Editar</span>
            </button>

            <button
              onClick={() => onToggleActivo(item)}
              className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                 bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <FaEdit className="text-base" />
              <span className="hidden md:inline">
                {item.activo ? 'Desactivar' : 'Activar'}
              </span>
            </button>

            <button
              onClick={() => onDelete(item)}
              className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold
                 bg-rose-600 text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <FaTrash className="text-base" />
              <span className="hidden md:inline">Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
