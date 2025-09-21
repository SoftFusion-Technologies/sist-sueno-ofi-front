// src/Components/Bancos/AccountSummaryChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Area,
  CartesianGrid
} from 'recharts';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

export default function AccountSummaryChart({ series, group = 'day' }) {
  if (!series || series.length === 0) return null;

  const data = series.map((s) => ({
    bucket: group === 'month' ? s.bucket.slice(0, 7) : s.bucket, // YYYY-MM
    Neto: Number(s.neto || 0),
    Acumulado: Number(s.acumulado || 0)
  }));

  return (
    <div className="mt-6 bg-white/90 rounded-2xl p-4 shadow border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-gray-800 font-semibold">Evolución del período</h4>
        <span className="text-sm text-gray-500">
          Agrupado por {group === 'month' ? 'mes' : 'día'}
        </span>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bucket" />
            <YAxis />
            <Tooltip formatter={(v, name) => [fmt(v), name]} />
            <Legend />
            <Bar dataKey="Neto" />
            <Area dataKey="Acumulado" type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
