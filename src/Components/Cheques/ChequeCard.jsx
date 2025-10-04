import React from 'react';
import { motion } from 'framer-motion';
import {
  FaRegFolderOpen,
  FaEdit,
  FaTrash,
  FaArrowDown, // Depositar
  FaCheckCircle, // Acreditar
  FaTimesCircle, // Rechazar
  FaUserTie, // Aplicar a Proveedor
  FaHandHolding, // Entregar
  FaExchangeAlt, // Compensar
  FaBan, // Anular
  FaMoneyCheckAlt,
  FaUniversity,
  FaBook,
  FaMoneyBill,
  FaImages
} from 'react-icons/fa';

/**
 * ChequeCard — LemonTeal v1
 * --------------------------------------------------------------
 * Estilo fintech tipo Lemon Cash, pero en **teal**:
 *  - Card limpia, bordes 20px, sombra suave y gradiente teal sutil.
 *  - Monto grande arriba, chips redondeados simples.
 *  - Acciones "teal-first": botones cápsula sólidos/ghost consistentes.
 *  - Tipografía fuerte, layout de 2 columnas claro.
 * Mantiene la misma API.
 */

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

const chipTipo = (t = 'recibido') =>
  t === 'emitido' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';

const chipEstado = (e = 'registrado') =>
  ({
    registrado: 'bg-zinc-100 text-zinc-700',
    en_cartera: 'bg-indigo-100 text-indigo-700',
    aplicado_a_compra: 'bg-amber-100 text-amber-700',
    endosado: 'bg-cyan-100 text-cyan-700',
    depositado: 'bg-sky-100 text-sky-700',
    acreditado: 'bg-emerald-100 text-emerald-700',
    rechazado: 'bg-rose-100 text-rose-700',
    anulado: 'bg-zinc-200 text-zinc-700',
    entregado: 'bg-fuchsia-100 text-fuchsia-700',
    compensado: 'bg-teal-100 text-teal-700'
  }[e] || 'bg-zinc-100 text-zinc-700');

const Pill = ({ children, className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
  >
    {children}
  </span>
);

// Acciones permitidas (misma lógica)
function getAllowedActions(ch) {
  const { tipo, estado } = ch || {};
  if (tipo === 'recibido') {
    if (['registrado', 'en_cartera'].includes(estado))
      return ['depositar', 'entregar', 'aplicar-a-proveedor', 'anular'];
    if (estado === 'depositado') return ['acreditar', 'rechazar'];
    if (estado === 'entregado') return ['compensar'];
    return [];
  }
  if (tipo === 'emitido') {
    if (['registrado', 'en_cartera'].includes(estado))
      return ['entregar', 'anular'];
    if (['aplicado_a_compra', 'entregado'].includes(estado))
      return ['compensar', 'anular'];
    return [];
  }
  return [];
}

const BtnSolid = ({ onClick, icon, label, tone = 'teal' }) => {
  const tones = {
    teal: 'from-teal-500 to-teal-600 focus:ring-teal-300',
    amber: 'from-amber-400 to-amber-500 focus:ring-amber-300',
    rose: 'from-rose-500 to-rose-600 focus:ring-rose-300',
    blue: 'from-sky-500 to-sky-600 focus:ring-sky-300',
    green: 'from-emerald-500 to-emerald-600 focus:ring-emerald-300',
    fuchsia: 'from-fuchsia-500 to-fuchsia-600 focus:ring-fuchsia-300',
    zinc: 'from-zinc-600 to-zinc-700 focus:ring-zinc-300'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 border border-white/10 bg-gradient-to-br ${tones[tone]}`}
    >
      <span className="text-[13px]">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

const BtnGhost = ({ onClick, icon, label, tone = 'teal' }) => {
  const rings = {
    teal: 'ring-teal-300/50 text-teal-700 hover:bg-teal-50',
    amber: 'ring-amber-300/50 text-amber-700 hover:bg-amber-50',
    rose: 'ring-rose-300/50 text-rose-700 hover:bg-rose-50',
    sky: 'ring-sky-300/50 text-sky-700 hover:bg-sky-50',
    zinc: 'ring-zinc-300/60 text-zinc-700 hover:bg-zinc-50'
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ${rings[tone]} transition-colors`}
    >
      <span className="text-[13px]">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default function ChequeCard({
  item,
  bancoNombre,
  chequeraDesc,
  onView,
  onEdit,
  onDelete,
  onMovimientos,
  onImagenes,
  onActions
}) {
  if (!item) return null;

  const {
    id,
    tipo,
    canal,
    numero,
    monto,
    estado,
    fecha_emision,
    fecha_vencimiento,
    fecha_cobro_prevista
  } = item;

  const allowed = getAllowedActions(item);
  const handlers = {
    depositar: onActions?.depositar,
    acreditar: onActions?.acreditar,
    rechazar: onActions?.rechazar,
    'aplicar-a-proveedor': onActions?.aplicarProveedor,
    entregar: onActions?.entregar,
    compensar: onActions?.compensar,
    anular: onActions?.anular
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-3xl border border-teal-200/50 bg-white shadow-[0_12px_40px_-16px_rgba(13,148,136,0.35)]"
    >
      {/* header gradiente sutil */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-teal-50 to-transparent" />

      <div className="relative z-10 p-5 sm:p-6">
        {/* top: monto + chips */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Cheque #{numero}
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-zinc-900">
              {fmt(monto)}
            </div>
            <div className="mt-1 text-sm text-zinc-500">#{numero}</div>
          </div>
          <div className="flex items-center gap-2">
            <Pill className={chipTipo(tipo)}>{tipo}</Pill>
            <Pill className={chipEstado(estado)}>
              {String(estado).replaceAll('_', ' ')}
            </Pill>
          </div>
        </div>

        {/* info principal */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/60 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              Banco
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-800">
              <FaUniversity className="text-teal-600" /> {bancoNombre || '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/60 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              Chequera
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-zinc-800">
              <FaBook className="text-teal-600" /> {chequeraDesc || '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200/60 p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              Canal
            </div>
            <div className="mt-0.5 text-sm text-zinc-800">{canal || 'C1'}</div>
          </div>
        </div>

        {/* fechas */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-zinc-700">
          <div>
            <span className="font-medium">Emisión:</span>{' '}
            {fecha_emision ? new Date(fecha_emision).toLocaleDateString() : '—'}
          </div>
          <div>
            <span className="font-medium">Vencimiento:</span>{' '}
            {fecha_vencimiento
              ? new Date(fecha_vencimiento).toLocaleDateString()
              : '—'}
          </div>
          <div>
            <span className="font-medium">Cobro previsto:</span>{' '}
            {fecha_cobro_prevista
              ? new Date(fecha_cobro_prevista).toLocaleDateString()
              : '—'}
          </div>
          <div className="sm:col-span-3 text-[11px] text-zinc-500">
            ID: {id}
            {item.created_at
              ? ` — Creado: ${new Date(item.created_at).toLocaleString()}`
              : ''}
          </div>
        </div>

        {/* acciones */}
        <div className="mt-5 -mx-1 overflow-x-auto">
          <div className="flex items-center gap-2 px-1">
            <BtnSolid
              onClick={() => onView?.(item)}
              icon={<FaRegFolderOpen />}
              label="Abrir"
              tone="teal"
            />
            <BtnGhost
              onClick={() => onEdit?.(item)}
              icon={<FaEdit />}
              label="Editar"
              tone="amber"
            />
            <BtnGhost
              onClick={() => onImagenes?.(item)}
              icon={<FaImages />}
              label="Imágenes"
              tone="teal"
            />
            <BtnGhost
              onClick={() => onMovimientos?.(item)}
              icon={<FaMoneyBill />}
              label="Movimientos"
              tone="teal"
            />

            {allowed.map((k) => {
              const mapTone = {
                depositar: 'teal',
                acreditar: 'green',
                rechazar: 'rose',
                'aplicar-a-proveedor': 'amber',
                entregar: 'teal',
                compensar: 'teal',
                anular: 'rose'
              };
              const tone = mapTone[k] || 'zinc';
              const iconMap = {
                depositar: <FaArrowDown />,
                acreditar: <FaCheckCircle />,
                rechazar: <FaTimesCircle />,
                'aplicar-a-proveedor': <FaUserTie />,
                entregar: <FaHandHolding />,
                compensar: <FaExchangeAlt />,
                anular: <FaBan />
              };
              const labelMap = {
                depositar: 'Depositar',
                acreditar: 'Acreditar',
                rechazar: 'Rechazar',
                'aplicar-a-proveedor': 'Aplicar a Proveedor',
                entregar: 'Entregar',
                compensar: 'Compensar',
                anular: 'Anular'
              };
              return (
                <BtnGhost
                  key={k}
                  onClick={() => handlers[k]?.(item)}
                  icon={iconMap[k]}
                  label={labelMap[k]}
                  tone={tone}
                />
              );
            })}

            <div className="ml-auto" />
            <BtnGhost
              onClick={() => onDelete?.(item)}
              icon={<FaTrash />}
              label="Eliminar"
              tone="zinc"
            />
          </div>
        </div>
      </div>

      {/* footer teal soft */}
      <div className="h-3 w-full bg-gradient-to-r from-teal-100 via-transparent to-teal-100" />
    </motion.div>
  );
}
