// src/Components/Compras/StockMovimientos/StockMovimientoDetailDrawer.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw, FileText, User, MapPin, Package } from 'lucide-react';
import { DeltaBadge, TipoBadge, fmtDateTime, fmtMoney } from './ui';

const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const panelV = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: 40, opacity: 0 }
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
        <Icon className="h-4 w-4 text-gray-300" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.16em] text-gray-400">
          {label}
        </div>
        <div className="text-sm text-white mt-1 break-words">
          {value ?? '-'}
        </div>
      </div>
    </div>
  );
}

export default function StockMovimientoDetailDrawer({
  open,
  onClose,
  row,
  onEditNotas,
  onRevertir
}) {
  const producto =
    row?.producto?.nombre || `Producto #${row?.producto_id ?? '-'}`;
  const sku = row?.producto?.codigo_sku
    ? `SKU ${row.producto.codigo_sku}`
    : null;

  const local =
    row?.local?.nombre || (row?.local_id ? `Local #${row.local_id}` : '-');
  const lugar =
    row?.lugar?.nombre || (row?.lugar_id ? `Lugar #${row.lugar_id}` : '-');
  const estado =
    row?.estado?.nombre || (row?.estado_id ? `Estado #${row.estado_id}` : '-');

  const usuario =
    row?.usuario?.nombre ||
    (row?.usuario_id ? `Usuario #${row.usuario_id}` : '-');

  const ref =
    row?.ref_tabla && row?.ref_id ? `${row.ref_tabla} #${row.ref_id}` : '-';

  const esReversa =
    row?.tipo === 'AJUSTE' &&
    String(row?.ref_tabla || '').toLowerCase() === 'stock_movimientos' &&
    !!row?.ref_id;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          variants={backdropV}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            variants={panelV}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="absolute right-0 top-0 h-full w-full sm:w-[520px]
                       border-l border-white/10 bg-zinc-950/75 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <TipoBadge tipo={row?.tipo} />
                    <DeltaBadge delta={row?.delta} />
                    {esReversa && (
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-200">
                        Reversa
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-lg font-bold text-white truncate">
                    {producto}
                  </div>
                  {sku && (
                    <div className="text-xs text-gray-400 mt-1">{sku}</div>
                  )}

                  <div className="text-xs text-gray-400 mt-2">
                    Fecha:{' '}
                    <span className="text-gray-200">
                      {fmtDateTime(row?.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                             bg-white/5 border border-white/10 hover:bg-white/10 transition"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-200" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto h-[calc(100%-140px)] custom-scrollbar">
              <InfoRow
                icon={Package}
                label="Costo Unit. Neto"
                value={fmtMoney(row?.costo_unit_neto, row?.moneda)}
              />
              <InfoRow icon={FileText} label="Referencia" value={ref} />
              <InfoRow
                icon={MapPin}
                label="Ubicación"
                value={`${local} • ${lugar} • ${estado}`}
              />
              <InfoRow icon={User} label="Usuario" value={usuario} />

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-gray-400">
                  Notas
                </div>
                <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words">
                  {row?.notas?.trim?.() ? row.notas : '—'}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                onClick={() => onEditNotas?.(row)}
                className="px-4 py-2 rounded-xl border border-white/10 text-gray-200 hover:bg-white/10 transition"
              >
                Editar notas
              </button>

              <button
                onClick={() => onRevertir?.(row)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold
                           hover:brightness-110 transition inline-flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Revertir
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
