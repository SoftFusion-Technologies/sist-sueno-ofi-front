// src/Components/Cheques/ChequeViewModal.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMoneyCheckAlt } from 'react-icons/fa';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function ChequeViewModal({
  open,
  onClose,
  data,
  bancoNombre,
  chequeraDesc
}) {
  if (!data) return null;

  const titleId = 'cheque-view-title';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-labelledby={titleId}
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet / Dialog */}
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 210, damping: 22 }}
            className="
              relative w-full sm:max-w-3xl bg-white
              rounded-t-2xl sm:rounded-2xl shadow-2xl
              max-h-[100svh] sm:max-h-[90vh]
              flex flex-col overflow-hidden
              touch-pan-y overscroll-contain
            "
          >
            {/* Header sticky */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b bg-gradient-to-r from-[#065f46] to-[#10b981] sticky top-0 z-10">
              <div className="text-3xl text-white/90">
                <FaMoneyCheckAlt />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id={titleId}
                  className="text-white font-bold text-base sm:text-lg truncate"
                >
                  Cheque #{data.numero} — {fmt(data.monto)}
                </h3>
                <div className="text-white/85 text-xs sm:text-sm truncate">
                  {bancoNombre || '—'} • {chequeraDesc || '—'}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl px-3 py-1.5"
                type="button"
              >
                Cerrar
              </button>
            </div>

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <Field label="Tipo" value={data.tipo} />
                <Field label="Canal" value={data.canal} />

                <Field label="Banco" value={bancoNombre || '—'} />
                <Field label="Chequera" value={chequeraDesc || '—'} />

                <Field label="Número" value={data.numero} />
                <Field label="Monto" value={fmt(data.monto)} />

                <Field label="Emisión" value={data.fecha_emision || '—'} />
                <Field
                  label="Vencimiento"
                  value={data.fecha_vencimiento || '—'}
                />
                <Field
                  label="Cobro previsto"
                  value={data.fecha_cobro_prevista || '—'}
                />
                <Field label="Estado" value={data.estado} />
                <Field
                  label="Motivo estado"
                  value={data.motivo_estado || '—'}
                />

                <div className="sm:col-span-2">
                  <Field
                    label="Observaciones"
                    value={data.observaciones || '—'}
                  />
                </div>

                <Field label="Cliente ID" value={data.cliente_id ?? '—'} />
                <Field label="Proveedor ID" value={data.proveedor_id ?? '—'} />
                <Field label="Venta ID" value={data.venta_id ?? '—'} />
                <Field label="Compra ID" value={data.compra_id ?? '—'} />

                {data.created_at && (
                  <Field
                    label="Creado"
                    value={new Date(data.created_at).toLocaleString()}
                  />
                )}
                {data.updated_at && (
                  <Field
                    label="Actualizado"
                    value={new Date(data.updated_at).toLocaleString()}
                  />
                )}
              </div>
            </div>

            {/* Footer sticky */}
            <div
              className="px-4 sm:px-6 py-4 border-t bg-white sticky bottom-0"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
              }}
            >
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border text-gray-700 hover:bg-gray-50"
                  type="button"
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

/** Subcomponente para filas de datos */
function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-gray-800 break-words">{String(value)}</div>
    </div>
  );
}
