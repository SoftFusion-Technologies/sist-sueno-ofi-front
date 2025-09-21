// src/Components/Bancos/AccountKPICards.jsx
import React from 'react';
import {
  FaWallet,
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale
} from 'react-icons/fa';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function AccountKPICards({
  cuentaNombre,
  periodo,
  totales,
  saldoActual
}) {
  if (!totales) return null;
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-lg font-semibold">
          Resumen de {cuentaNombre || 'la cuenta'}
        </h3>
        {periodo?.from && periodo?.to && (
          <span className="text-white/80 text-sm">
            Período: {periodo.from} → {periodo.to}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 rounded-2xl p-4 shadow border border-white/20">
          <div className="text-xs text-gray-500">Saldo inicial</div>
          <div className="text-gray-900 text-xl font-bold">
            {fmt(totales.saldo_inicial)}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 shadow border border-white/20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaArrowDown className="text-rose-600" /> Débitos
          </div>
          <div className="text-rose-700 text-xl font-bold">
            {fmt(totales.debitos)}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 shadow border border-white/20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaArrowUp className="text-emerald-600" /> Créditos
          </div>
          <div className="text-emerald-700 text-xl font-bold">
            {fmt(totales.creditos)}
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-4 shadow border border-white/20">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaBalanceScale className="text-teal-600" /> Saldo final (período)
          </div>
          <div className="text-teal-700 text-xl font-bold">
            {fmt(totales.saldo_final)}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-white/90 rounded-2xl p-4 shadow border border-white/20">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Saldo actual (hasta {periodo?.to || 'hoy'})
          </div>
          <div className="text-2xl font-extrabold text-gray-900">
            {fmt(saldoActual)}
          </div>
        </div>
      </div>
    </div>
  );
}
