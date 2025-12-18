// src/Components/Compras/StockMovimientos/ui.js
import React from 'react';

export const TIPOS = [
  'COMPRA',
  'VENTA',
  'DEVOLUCION_PROVEEDOR',
  'DEVOLUCION_CLIENTE',
  'AJUSTE',
  'TRANSFERENCIA',
  'RECEPCION_OC'
];

export const MONEDAS = ['ARS', 'USD', 'EUR', 'Otro'];

export function fmtDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function fmtMoney(value, moneda = 'ARS') {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return '-';

  // 'Otro' no es ISO currency; mostramos número con separadores AR
  if (moneda === 'Otro') {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(n);
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(n);
}

export function tipoMeta(tipo) {
  const map = {
    COMPRA: { label: 'Compra', tone: 'emerald' },
    VENTA: { label: 'Venta', tone: 'rose' },
    DEVOLUCION_PROVEEDOR: { label: 'Dev. Proveedor', tone: 'amber' },
    DEVOLUCION_CLIENTE: { label: 'Dev. Cliente', tone: 'cyan' },
    AJUSTE: { label: 'Ajuste', tone: 'violet' },
    TRANSFERENCIA: { label: 'Transferencia', tone: 'indigo' },
    RECEPCION_OC: { label: 'Recepción OC', tone: 'teal' }
  };
  return map[tipo] || { label: tipo || '-', tone: 'zinc' };
}

export function TipoBadge({ tipo }) {
  const meta = tipoMeta(tipo);
  const tone = meta.tone;

  const toneCls = {
    emerald: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20',
    rose: 'bg-rose-500/10 text-rose-200 border-rose-400/20',
    amber: 'bg-amber-500/10 text-amber-200 border-amber-400/20',
    cyan: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
    violet: 'bg-violet-500/10 text-violet-200 border-violet-400/20',
    indigo: 'bg-indigo-500/10 text-indigo-200 border-indigo-400/20',
    teal: 'bg-teal-500/10 text-teal-200 border-teal-400/20',
    zinc: 'bg-white/5 text-gray-200 border-white/10'
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] tracking-wide ${toneCls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {meta.label}
    </span>
  );
}

export function DeltaBadge({ delta }) {
  const d = Number(delta);
  const isPos = d > 0;
  const isNeg = d < 0;
  const cls = isPos
    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20'
    : isNeg
    ? 'bg-rose-500/10 text-rose-200 border-rose-400/20'
    : 'bg-white/5 text-gray-200 border-white/10';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${cls}`}
    >
      {isPos ? `+${d}` : `${d}`}
    </span>
  );
}
