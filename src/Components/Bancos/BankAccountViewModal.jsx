// src/Components/Bancos/BankAccountViewModal.jsx
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaWallet,
  FaUniversity,
  FaHashtag,
  FaCheckCircle,
  FaTimesCircle,
  FaCopy,
  FaTimes
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

const copy = async (t) => {
  try {
    await navigator.clipboard.writeText(t || '');
  } catch {}
};

export default function BankAccountViewModal({
  open,
  onClose,
  data,
  bancoNombre
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

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
          {/* Fondo negro */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 210, damping: 22 }}
            className="relative w-[min(920px,92vw)] bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#003049] to-[#005f73]">
              <div className="text-3xl text-white/90">
                <FaWallet />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg truncate">
                  {data.nombre_cuenta}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-2 text-white/90 text-sm">
                    <FaUniversity /> {bancoNombre || `Banco #${data.banco_id}`}
                  </span>
                  <ChipMoneda moneda={data.moneda} />
                  <ChipActivo active={!!data.activo} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl p-2"
                title="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Banco</div>
                  <div className="text-gray-800 font-medium">
                    {bancoNombre || `Banco #${data.banco_id}`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Moneda</div>
                  <div className="text-gray-800 font-medium">{data.moneda}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    Nombre de la cuenta
                  </div>
                  <div className="text-gray-800 font-medium">
                    {data.nombre_cuenta || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">N° de cuenta</div>
                  <div className="text-gray-800 font-medium">
                    {data.numero_cuenta || '—'}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">CBU</div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-50 text-gray-800">
                      {data.cbu || '—'}
                    </code>
                    {data.cbu && (
                      <button
                        onClick={() => copy(data.cbu)}
                        className="text-gray-500 hover:text-teal-700 text-sm"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">Alias CBU</div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-50 text-gray-800">
                      {data.alias_cbu || '—'}
                    </code>
                    {data.alias_cbu && (
                      <button
                        onClick={() => copy(data.alias_cbu)}
                        className="text-gray-500 hover:text-teal-700 text-sm"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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

              <div className="mt-8 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
