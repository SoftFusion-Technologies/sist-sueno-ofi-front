// src/Components/Compras/StockMovimientos/StockMovimientoCard.jsx
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { DeltaBadge, TipoBadge, fmtDateTime, fmtMoney } from './ui.jsx';

export default function StockMovimientoCard({ row, onOpen }) {
  const producto =
    row?.producto?.nombre || `Producto #${row?.producto_id ?? '-'}`;
  const local =
    row?.local?.nombre || (row?.local_id ? `Local #${row.local_id}` : '-');
  const lugar =
    row?.lugar?.nombre || (row?.lugar_id ? `Lugar #${row.lugar_id}` : '-');
  const estado =
    row?.estado?.nombre || (row?.estado_id ? `Estado #${row.estado_id}` : '-');

  return (
    <button
      onClick={() => onOpen?.(row)}
      className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl
                 hover:bg-white/[0.08] transition p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <TipoBadge tipo={row?.tipo} />
            <DeltaBadge delta={row?.delta} />
          </div>

          <div className="mt-2 text-sm font-semibold text-white truncate">
            {producto}
          </div>

          <div className="mt-1 text-xs text-gray-300 flex flex-wrap gap-x-3 gap-y-1">
            <span>{local}</span>
            <span>•</span>
            <span>{lugar}</span>
            <span>•</span>
            <span>{estado}</span>
          </div>

          <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
            <span>{fmtDateTime(row?.created_at)}</span>
            <span className="text-gray-300">
              {fmtMoney(row?.costo_unit_neto, row?.moneda)}
            </span>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-gray-300 shrink-0 mt-1" />
      </div>
    </button>
  );
}
