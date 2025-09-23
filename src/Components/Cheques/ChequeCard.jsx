// src/Components/Cheques/ChequeCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaArrowDown, // Depositar
  FaCheckCircle, // Acreditar
  FaTimesCircle, // Rechazar
  FaUserTie, // Aplicar a Proveedor
  FaHandHolding, // Entregar
  FaExchangeAlt, // Compensar
  FaBan, // Anular
  FaMoneyCheckAlt, // Icono principal
  FaUniversity, // Banco
  FaBook // Chequera
} from 'react-icons/fa';

// Config visual por acción
const BTN_CONFIG = {
  depositar: {
    label: 'Depositar',
    icon: <FaArrowDown />,
    classes: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300'
  },
  acreditar: {
    label: 'Acreditar',
    icon: <FaCheckCircle />,
    classes: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-300'
  },
  rechazar: {
    label: 'Rechazar',
    icon: <FaTimesCircle />,
    classes: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-300'
  },
  'aplicar-a-proveedor': {
    label: 'Aplicar a Proveedor',
    icon: <FaUserTie />,
    classes: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-300'
  },
  entregar: {
    label: 'Entregar',
    icon: <FaHandHolding />,
    classes: 'bg-fuchsia-600 hover:bg-fuchsia-700 focus:ring-fuchsia-300'
  },
  compensar: {
    label: 'Compensar',
    icon: <FaExchangeAlt />,
    classes: 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-300'
  },
  anular: {
    label: 'Anular',
    icon: <FaBan />,
    classes: 'bg-red-600 hover:bg-red-700 focus:ring-red-300'
  }
};

// Mini botón reutilizable
function ActionBtn({ label, icon, onClick, classes }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 ${classes}`}
      aria-label={label}
      title={label}
      type="button"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const Chip = ({ text, cls }) => (
  <span
    className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${cls}`}
  >
    {text}
  </span>
);

const chipTipo = (t = 'recibido') =>
  t === 'emitido' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700';

const chipEstado = (e = 'registrado') =>
  ({
    registrado: 'bg-gray-100 text-gray-700',
    en_cartera: 'bg-indigo-100 text-indigo-700',
    aplicado_a_compra: 'bg-amber-100 text-amber-700',
    endosado: 'bg-cyan-100 text-cyan-700',
    depositado: 'bg-blue-100 text-blue-700',
    acreditado: 'bg-emerald-100 text-emerald-700',
    rechazado: 'bg-rose-100 text-rose-700',
    anulado: 'bg-zinc-200 text-zinc-700',
    entregado: 'bg-fuchsia-100 text-fuchsia-700',
    compensado: 'bg-teal-100 text-teal-700'
  }[e] || 'bg-gray-100 text-gray-700');

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n || 0)
  );

// ───────────────────────────────── helper: qué acciones mostrar
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
      return ['entregar', 'anular']; // sin aplicar-a-proveedor si backend no soporta
    if (['aplicado_a_compra', 'entregado'].includes(estado))
      return ['compensar', 'anular'];
    return [];
  }
  return [];
}

// ───────────────────────────────── componente
export default function ChequeCard({
  item,
  bancoNombre, // string ya resuelto
  chequeraDesc, // string ya resuelto
  onView,
  onEdit,
  onDelete,
  onActions // { depositar, acreditar, rechazar, aplicarProveedor, entregar, compensar, anular }
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

  // Acciones permitidas por estado/tipo
  const allowed = getAllowedActions(item);

  // Mapeo clave->handler
  const handlers = {
    depositar: onActions?.depositar,
    acreditar: onActions?.acreditar,
    rechazar: onActions?.rechazar,
    'aplicar-a-proveedor': onActions?.aplicarProveedor, // ojo con el nombre
    entregar: onActions?.entregar,
    compensar: onActions?.compensar,
    anular: onActions?.anular
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg hover:shadow-emerald-400/60 hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl text-emerald-600 shrink-0">
          <FaMoneyCheckAlt />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">
              Cheque #{numero} — {fmt(monto)}
            </h3>
            <div className="flex items-center gap-2">
              <Chip text={tipo} cls={chipTipo(tipo)} />
              <Chip text={estado} cls={chipEstado(estado)} />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUniversity className="text-emerald-600" />
              <span className="truncate" title={bancoNombre}>
                {bancoNombre || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaBook className="text-emerald-600" />
              <span className="truncate" title={chequeraDesc}>
                {chequeraDesc || '—'}
              </span>
            </div>

            <div>
              <span className="font-medium">Canal:</span> {canal || 'C1'}
            </div>
            <div>
              <span className="font-medium">Emisión:</span>{' '}
              {fecha_emision
                ? new Date(fecha_emision).toLocaleDateString()
                : '—'}
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

            <div className="sm:col-span-2 text-xs text-gray-500">
              ID: {id}
              {item.created_at && (
                <> — Creado: {new Date(item.created_at).toLocaleString()}</>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-4 -mx-1 overflow-x-auto">
            <div className="flex items-center gap-2 px-1">
              {/* Ver / Editar */}
              <ActionBtn
                label="Ver"
                icon={<FaEye />}
                onClick={() => onView?.(item)}
                classes="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300"
              />
              <ActionBtn
                label="Editar"
                icon={<FaEdit />}
                onClick={() => onEdit?.(item)}
                classes="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300"
              />

              {/* Transiciones válidas (si hay handler definido) */}
              {allowed.map((key) => {
                const cfg = BTN_CONFIG[key];
                const fn = handlers[key];
                if (!cfg || !fn) return null;
                return (
                  <ActionBtn
                    key={key}
                    label={cfg.label}
                    icon={cfg.icon}
                    onClick={() => fn(item)}
                    classes={cfg.classes}
                  />
                );
              })}

              {/* Eliminar a la derecha */}
              <div className="ml-auto" />
              <ActionBtn
                label="Eliminar"
                icon={<FaTrash />}
                onClick={() => onDelete?.(item)}
                classes="bg-zinc-600 hover:bg-zinc-700 focus:ring-zinc-300"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
