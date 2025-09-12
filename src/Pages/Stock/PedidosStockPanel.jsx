import React, { useEffect, useMemo, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring
} from 'framer-motion';
import {
  FaPlus,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaTrash,
  FaEdit,
  FaBoxOpen,
  FaMapMarkerAlt,
  FaMinus,
  FaArrowUp,
  FaCircle,
  FaArrowsAltH,
  FaArrowDown
} from 'react-icons/fa';

import ParticlesBackground from '../../Components/ParticlesBackground';
import { useAuth } from '../../AuthContext';

// Card KPI pro — glass + microanimaciones + sparkline SVG
function KpiCardPro({
  label,
  value,
  delta = 0,
  hint,
  series = [], // array de números (length 14)
  tone = 'indigo', // 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate'
  onClick,
  loading = false
}) {
  const toneMap = {
    neutral: {
      surface: 'bg-white/40 backdrop-blur-xl ring-slate-200/30',
      text: 'text-slate-800',
      accent: 'text-slate-500',
      line: '#9ca3af' // gris medio para sparklines
    },
    soft: {
      surface: 'bg-slate-50/60 backdrop-blur-xl ring-slate-200/30',
      text: 'text-slate-700',
      accent: 'text-slate-400',
      line: '#cbd5e1' // gris claro para tendencia
    },
    minimal: {
      surface: 'bg-white/20 backdrop-blur-xl ring-slate-200/20',
      text: 'text-gray-800',
      accent: 'text-gray-600',
      line: '#94a3b8' // gris azulado para contraste sutil
    }
  }[tone] || {
    surface: 'bg-white/40 backdrop-blur-xl ring-slate-200/30',
    text: 'text-slate-800',
    accent: 'text-slate-500',
    line: '#9ca3af'
  };

  const DeltaIcon = delta > 0 ? FaArrowUp : delta < 0 ? FaArrowDown : FaMinus;
  const deltaColor =
    delta > 0
      ? 'text-emerald-600'
      : delta < 0
      ? 'text-rose-600'
      : 'text-slate-500';

  if (loading) {
    return (
      <div className="rounded-2xl backdrop-blur-xl bg-white/10 ring-1 ring-white/20 p-4 animate-pulse">
        <div className="h-3 w-24 bg-slate-200/50 rounded mb-3" />
        <div className="h-8 w-20 bg-slate-200/60 rounded mb-4" />
        <div className="h-14 bg-slate-200/40 rounded" />
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left rounded-2xl backdrop-blur-xl ${toneMap.surface} ${toneMap.text} ring-1 p-4 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-400`}
      aria-label={`${label}: ${value}${hint ? `, ${hint}` : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide opacity-70 flex items-center gap-1">
          <FaCircle className="text-[6px] opacity-60" />
          {label}
        </div>
        <div className={`flex items-center gap-1 text-xs ${deltaColor}`}>
          <DeltaIcon />
          <span className="font-semibold">
            {delta > 0 ? `+${delta}` : delta}
          </span>
          {hint && <span className="opacity-90">({hint})</span>}
        </div>
      </div>

      <div className="mt-1 text-3xl font-extrabold leading-tight">
        <AnimatedNumber value={value} />
      </div>

      {series && series.length > 1 && (
        <div className="mt-3 h-14">
          <SparklineSVG data={series} stroke={toneMap.line} />
        </div>
      )}
    </motion.button>
  );
}

// Sparkline simple sin librerías
function SparklineSVG({ data = [], stroke = '#4f46e5' }) {
  const w = 240,
    h = 56,
    pad = 4;
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);

  const x = (i) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v) => h - pad - ((v - min) * (h - pad * 2)) / range;

  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Número animado con framer-motion (sin libs extra)
function AnimatedNumber({ value }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20, mass: 0.6 });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    mv.set(value || 0);
  }, [value]); // anima a nuevo valor
  React.useEffect(() => spring.on('change', (v) => setDisplay(v)), [spring]);

  return <span>{Math.round(display).toLocaleString('es-AR')}</span>;
}

function EmptyState({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-xl shadow p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-gray-500 mt-1">{subtitle}</div>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow"
        >
          + {actionLabel}
        </button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow p-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-2 bg-gray-200 rounded w-full mb-2" />
      <div className="h-2 bg-gray-200 rounded w-4/5 mb-2" />
      <div className="h-2 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

function Chip({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-gray-100 text-gray-700',
    info: 'bg-blue-100 text-blue-700',
    success: 'bg-emerald-100 text-emerald-700',
    warn: 'bg-amber-100 text-amber-700'
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        tones[tone] || tones.default
      }`}
    >
      {children}
    </span>
  );
}

function EstadoBadge({ value }) {
  const map = {
    pendiente: 'bg-amber-100 text-amber-800',
    visto: 'bg-slate-100 text-slate-800',
    preparacion: 'bg-blue-100 text-blue-800',
    enviado: 'bg-indigo-100 text-indigo-800',
    entregado: 'bg-emerald-100 text-emerald-800',
    cancelado: 'bg-rose-100 text-rose-800'
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        map[value] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {value}
    </span>
  );
}

function PrioridadBadge({ value }) {
  return value === 'alta' ? (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
      prioridad: alta
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      prioridad: normal
    </span>
  );
}

function CantidadesBar({ solicitada, preparada, enviada, recibida }) {
  const safe = (n) => Math.max(0, Number(n) || 0);
  const total = Math.max(1, safe(solicitada));
  const pPrep = Math.min(100, Math.round((safe(preparada) / total) * 100));
  const pEnv = Math.min(100, Math.round((safe(enviada) / total) * 100));
  const pRec = Math.min(100, Math.round((safe(recibida) / total) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>
          Solicitada: <b>{safe(solicitada)}</b>
        </span>
        <span>
          Prep: <b>{safe(preparada)}</b> · Env: <b>{safe(enviada)}</b> · Rec:{' '}
          <b>{safe(recibida)}</b>
        </span>
      </div>
      {/* barra múltiple */}
      <div className="h-2 w-full bg-gray-100 rounded overflow-hidden flex">
        <div
          style={{ width: `${pPrep}%` }}
          className="h-full bg-blue-300"
          title={`Preparada ${pPrep}%`}
        />
        <div
          style={{ width: `${Math.max(0, pEnv - pPrep)}%` }}
          className="h-full bg-indigo-300"
          title={`Enviada ${pEnv}%`}
        />
        <div
          style={{ width: `${Math.max(0, pRec - pEnv)}%` }}
          className="h-full bg-emerald-300"
          title={`Recibida ${pRec}%`}
        />
      </div>
    </div>
  );
}

function ArrowRight() {
  return <span className="text-gray-400">→</span>;
}

function PedidoCard({
  row,
  onVer,
  onEditarCantidades,
  onCancelar,
  onCambiarEstado
}) {
  // próximo paso sugerido según estado (CTA primaria)
  const nextMap = {
    pendiente: ['visto', 'preparacion'],
    visto: ['preparacion'],
    preparacion: ['enviado'],
    enviado: ['entregado'],
    entregado: [],
    cancelado: []
  };
  const primaryNext = (nextMap[row.estado] || [])[0];

  const fechaStr = new Date(row.created_at).toLocaleString('es-AR');

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-slate-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Thumbnail del producto (si hay)
          {row.producto?.imagen_url ? (
            <img
              src={row.producto.imagen_url}
              alt={row.producto?.nombre || `Producto ${row.producto_id}`}
              className="h-12 w-12 rounded-xl object-cover border border-slate-200"
              loading="lazy"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 grid place-items-center text-slate-400 text-xs">
              IMG
            </div>
          )} */}

          <div className="min-w-0">
            <div className="text-[13px] text-slate-500">#{row.id}</div>
            <div className="font-semibold truncate">
              {row.producto?.nombre || `Producto ${row.producto_id}`}
            </div>
            <div className="text-[12px] text-slate-500 truncate">
              SKU: {row.producto?.codigo_sku ?? '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <EstadoBadge value={row.estado} />
          <PrioridadBadge value={row.prioridad} />
          <div className="text-[11px] text-slate-500">{fechaStr}</div>
        </div>
      </div>

      {/* Origen → Destino */}
      <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-700">
        <FaMapMarkerAlt className="text-slate-400" />
        <span className="px-2 py-0.5 rounded-full bg-slate-100">
          {row.local_origen?.codigo ||
            row.local_origen?.nombre ||
            row.local_origen_id}
        </span>
        <FaChevronRight className="text-slate-400" />
        <span className="px-2 py-0.5 rounded-full bg-slate-100">
          {row.local_destino?.codigo ||
            row.local_destino?.nombre ||
            row.local_destino_id}
        </span>
      </div>

      {/* Cantidades + Progreso */}
      <div className="mt-3">
        <CantidadesBar
          solicitada={row.cantidad_solicitada}
          preparada={row.cantidad_preparada}
          enviada={row.cantidad_enviada}
          recibida={row.cantidad_recibida}
        />
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-slate-600">
          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1">
            Solicitada: <b>{row.cantidad_solicitada}</b>
          </span>
          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1">
            Preparada: <b>{row.cantidad_preparada}</b>
          </span>
          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1">
            Enviada: <b>{row.cantidad_enviada}</b>
          </span>
          <span className="rounded-lg border border-slate-200 bg-white px-2 py-1">
            Recibida: <b>{row.cantidad_recibida}</b>
          </span>
        </div>
      </div>

      {/* Observaciones */}
      {row.observaciones && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {row.observaciones}
        </div>
      )}

      {/* Acciones */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* CTA contextual (si hay siguiente estado) */}
        <div className="flex items-center gap-2">
          {primaryNext && (
            <button
              onClick={() => onCambiarEstado(row, primaryNext)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-900"
              title={`Marcar ${primaryNext}`}
            >
              Marcar {primaryNext}
            </button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          {/* Ver (primario neutro sólido) */}
          <button
            onClick={onVer}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl
               bg-slate-900 text-white border border-slate-900/80
               shadow-[0_1px_0_rgba(255,255,255,.2),0_2px_10px_rgba(2,6,23,.15)]
               hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,6,23,.25)]
               active:translate-y-0 active:shadow-[inset_0_2px_6px_rgba(0,0,0,.2)]
               transition-all duration-200 cursor-pointer
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
            title="Ver detalle"
            aria-label="Ver detalle"
          >
            <FaEye className="text-[12px] opacity-90" />
            Ver
          </button>

          {/* Cantidades (mono táctil neutro) */}
          <button
            onClick={onEditarCantidades}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl
               bg-gradient-to-b from-white to-slate-50 text-slate-800
               border border-slate-200
               shadow-[0_1px_0_rgba(255,255,255,.9),0_2px_8px_rgba(2,6,23,.08)]
               hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(2,6,23,.12)]
               active:translate-y-0 active:shadow-[inset_0_2px_6px_rgba(2,6,23,.12)]
               transition-all duration-200 cursor-pointer
               focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
            title="Editar cantidades"
            aria-label="Editar cantidades"
          >
            <FaEdit className="text-[12px] opacity-80" />
            Cantidades
          </button>

          {/* Cancelar (danger neutro) */}
          <button
            onClick={onCancelar}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl
               bg-gradient-to-b from-white to-rose-50 text-rose-700
               border border-rose-200
               shadow-[0_1px_0_rgba(255,255,255,.9),0_2px_8px_rgba(225,29,72,.08)]
               hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(225,29,72,.15)]
               active:translate-y-0 active:shadow-[inset_0_2px_6px_rgba(225,29,72,.18)]
               transition-all duration-200 cursor-pointer
               focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-1
               disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancelar pedido"
            aria-label="Cancelar pedido"
            disabled={['entregado', 'cancelado'].includes(row.estado)}
          >
            <FaTrash className="text-[12px] opacity-85" />
            Cancelar
          </button>

          {/* Menú de estado existente */}
          <EstadoMenu row={row} onChangeEstado={onCambiarEstado} />
        </div>
      </div>
    </motion.div>
  );
}

// ================== CONFIG ==================
const API_BASE = 'http://localhost:8080';

// Si usás auth global, reemplazá estos por useAuth()
const ESTADOS = [
  'pendiente',
  'visto',
  'preparacion',
  'enviado',
  'entregado',
  'cancelado'
];
const ESTADO_BADGE = {
  pendiente: 'bg-red-100 text-red-700',
  visto: 'bg-yellow-100 text-yellow-700',
  preparacion: 'bg-blue-100 text-blue-700',
  enviado: 'bg-orange-100 text-orange-700',
  entregado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-gray-100 text-gray-700'
};
const ESTADO_EMOJI = {
  pendiente: '🟥',
  visto: '🟨',
  preparacion: '🟦',
  enviado: '🟧',
  entregado: '🟩',
  cancelado: '⬜'
};

// ================== HELPERS ==================

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.mensajeError || data.message || 'Error');
  return data;
}

// ================== MODALS ==================
const Modal = ({ open, onClose, title, children, size = 'max-w-3xl' }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          className={`bg-white rounded-2xl shadow-2xl w-full ${size} max-h-[88vh] flex flex-col`}
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <FaTimes />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ================== PANEL PRINCIPAL ==================
export default function PedidosStockPanel() {
  const { userId, userLocalId } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locales, setLocales] = useState([]);
  const [loadingLocales, setLoadingLocales] = useState(false);

  // filtros
  const [estado, setEstado] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // paginación simple client-side (el back ya tiene limit/offset si querés)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // modales
  const [openCreate, setOpenCreate] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openQty, setOpenQty] = useState(false);

  const [detailItem, setDetailItem] = useState(null);
  const [qtyItem, setQtyItem] = useState(null);

  useEffect(() => {
    const fetchLocales = async () => {
      setLoadingLocales(true);
      try {
        const resp = await fetch(`${API_BASE}/locales`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        // orden opcional por nombre
        data.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setLocales(data);
      } catch (e) {
        console.error('Error cargando locales:', e);
        setLocales([]);
      } finally {
        setLoadingLocales(false);
      }
    };
    fetchLocales();
  }, []);
  // crear form
  const [form, setForm] = useState({
    producto_id: '',
    stock_id_origen: '',
    local_origen_id: '',
    local_destino_id: userLocalId || '',
    cantidad: 1,
    prioridad: 'normal',
    observaciones: ''
  });

  // cantidades form
  const [qtyForm, setQtyForm] = useState({
    cantidad_preparada: '',
    cantidad_enviada: '',
    cantidad_recibida: ''
  });

  // Helpers de fecha (a ISO)
  const toISOStartOfDay = (yyyyMMdd) => {
    if (!yyyyMMdd) return null;
    const d = new Date(`${yyyyMMdd}T00:00:00`);
    return d.toISOString();
  };
  const toISOEndOfDay = (yyyyMMdd) => {
    if (!yyyyMMdd) return null;
    const d = new Date(`${yyyyMMdd}T23:59:59.999`);
    return d.toISOString();
  };

  // Arma querystring EXACTO como espera el back
  const buildQueryString = (qOverride) => {
    const params = new URLSearchParams();

    if (estado) params.set('estado', estado);

    const ori = Number(origen);
    if (!Number.isNaN(ori) && ori > 0)
      params.set('local_origen_id', String(ori));

    const des = Number(destino);
    if (!Number.isNaN(des) && des > 0)
      params.set('local_destino_id', String(des));

    if (desde) params.set('desde', toISOStartOfDay(desde));
    if (hasta) params.set('hasta', toISOEndOfDay(hasta));

    const qFinal = (qOverride ?? q).trim();
    if (qFinal) params.set('q', qFinal);

    // Traemos suficiente para paginar del lado del cliente
    params.set('limit', String(200));

    return params.toString();
  };

  const loadData = async (opts = {}) => {
    setLoading(true);
    try {
      const qs = buildQueryString(opts.qOverride);
      const data = await fetchJSON(`${API_BASE}/pedidos?${qs}`);
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      console.error(e);
      alert(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Load inicial
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-cargar cuando cambian filtros (excepto q que tiene debounce propio)
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, origen, destino, desde, hasta]);

  // Debounce del buscador libre
  useEffect(() => {
    const t = setTimeout(() => {
      void loadData({ qOverride: q });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filteredPage = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // acciones
  const openCreateModal = () => {
    setForm((f) => ({ ...f, local_destino_id: userLocalId || '' }));
    setOpenCreate(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        cantidad: Number(form.cantidad || 0),
        usuario_log_id: userId
      };
      await fetchJSON(`${API_BASE}/pedidos`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setOpenCreate(false);
      await loadData();
      alert('✅ Pedido creado');
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const askCancel = async (row) => {
    if (!window.confirm(`¿Cancelar el pedido #${row.id}?`)) return;
    try {
      await fetchJSON(`${API_BASE}/pedidos/${row.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ usuario_log_id: userId, motivo: 'Desde panel' })
      });
      await loadData();
      alert('Pedido cancelado');
    } catch (e) {
      alert(e.message);
    }
  };

  const changeEstado = async (row, nuevo_estado) => {
    try {
      if (!row?.id) throw new Error('ID de pedido inválido');
      if (!nuevo_estado) throw new Error('nuevo_estado es requerido');

      await fetchJSON(`${API_BASE}/pedidos/${row.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ nuevo_estado, usuario_log_id: userId })
      });

      await loadData();
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };


  const openQtyModal = (row) => {
    setQtyItem(row);
    setQtyForm({
      cantidad_preparada:
        row.cantidad_preparada ?? row.cantidad_solicitada ?? 0,
      cantidad_enviada: row.cantidad_enviada ?? 0,
      cantidad_recibida: row.cantidad_recibida ?? 0
    });
    setOpenQty(true);
  };

  const submitQty = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...qtyForm,
        usuario_log_id: userId
      };
      await fetchJSON(`${API_BASE}/pedidos/${qtyItem.id}/cantidades`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setOpenQty(false);
      await loadData();
    } catch (e) {
      alert(e.message);
    }
  };

  // UI helpers
  const EstadoBadge = ({ value }) => (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${ESTADO_BADGE[value]}`}
      title={value}
    >
      <span>{ESTADO_EMOJI[value]}</span>
      {value}
    </span>
  );

  const labelLocal = (loc) =>
    `${loc.nombre}${loc.codigo ? ` (${loc.codigo})` : ''}`;

  const toNumOrEmpty = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? String(n) : '';
  };

  // ================== RENDER ==================
  return (
    <div className="w-full">
      {/* HEADER */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-5 mb-8 p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 shadow-md border border-slate-200/60"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Título y descripción */}
        <div>
          <h1 className="titulo uppercase text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
            📦 Pedidos entre sucursales
          </h1>
          <p className="text-gray-500 text-sm mt-1 tracking-wide">
            Gestioná las{' '}
            <span className="font-semibold text-gray-700">
              transferencias de productos
            </span>{' '}
            entre locales.
          </p>
        </div>

        {/* Botón CTA */}
        <motion.button
          onClick={openCreateModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-all
               bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700
               focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <FaPlus className="text-sm" />
          Nuevo pedido
        </motion.button>
      </motion.div>

      {/* FILTROS */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 mb-6 transition-all duration-300">
        {/* Título sección */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FaSearch className="text-emerald-500" />
            Filtrar pedidos
          </h2>
          {(estado || origen || destino || desde || hasta || q) && (
            <button
              onClick={() => {
                setEstado('');
                setOrigen('');
                setDestino('');
                setDesde('');
                setHasta('');
                setQ('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline transition"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Estado */}
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-white/30 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Origen */}
          <select
            value={toNumOrEmpty(origen)}
            onChange={(e) => setOrigen(e.target.value)}
            className="bg-white/30 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            disabled={loadingLocales || locales.length === 0}
          >
            <option value="">Todos los orígenes</option>
            {locales.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {labelLocal(loc)}
              </option>
            ))}
          </select>

          {/* Destino */}
          <select
            value={toNumOrEmpty(destino)}
            onChange={(e) => setDestino(e.target.value)}
            className="bg-white/30 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            disabled={loadingLocales || locales.length === 0}
          >
            <option value="">Todos los destinos</option>
            {locales.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {labelLocal(loc)}
              </option>
            ))}
          </select>

          {/* Fechas */}
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="bg-white/30 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="bg-white/30 border border-gray-200 text-gray-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
          />

          {/* Buscar */}
          <div className="flex">
            <input
              type="text"
              placeholder="Buscar observaciones..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-white/30 border border-gray-200 text-gray-800 rounded-l-xl px-3 py-2 w-full focus:ring-2 focus:ring-emerald-400 focus:outline-none transition"
            />
            <button
              onClick={loadData}
              className="px-5 rounded-r-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition shadow-lg flex items-center justify-center"
              title="Buscar"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {(estado || origen || destino || desde || hasta || q) && (
          <div className="flex flex-wrap gap-2 mt-5">
            {estado && <Chip>{estado}</Chip>}
            {origen && (
              <Chip>
                Origen:{' '}
                {labelLocal(locales.find((l) => l.id === Number(origen)) || {})}
              </Chip>
            )}
            {destino && (
              <Chip>
                Destino:{' '}
                {labelLocal(
                  locales.find((l) => l.id === Number(destino)) || {}
                )}
              </Chip>
            )}
            {desde && <Chip>Desde: {desde}</Chip>}
            {hasta && <Chip>Hasta: {hasta}</Chip>}
            {q && <Chip>“{q}”</Chip>}
          </div>
        )}
      </div>

      {/* TABLA */}
      {/* LISTA EN CARDS */}
      <div className="space-y-3">
        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCardPro
            label="Total pedidos"
            value={items.length}
            series={buildSeries(items)} // todos
            delta={computeDelta(buildSeries(items))}
            hint="últimos 7 vs previos 7"
            tone="indigo"
            onClick={() => setEstado('')} // limpia filtro
            loading={loading}
          />
          <KpiCardPro
            label="Pendientes"
            value={items.filter((x) => x.estado === 'pendiente').length}
            series={buildSeries(items, (it) => it.estado === 'pendiente')}
            delta={computeDelta(
              buildSeries(items, (it) => it.estado === 'pendiente')
            )}
            hint="7d vs 7d prev"
            tone="amber"
            onClick={() => setEstado('pendiente')}
            loading={loading}
          />
          <KpiCardPro
            label="En tránsito"
            value={
              items.filter((x) => ['preparacion', 'enviado'].includes(x.estado))
                .length
            }
            series={buildSeries(items, (it) =>
              ['preparacion', 'enviado'].includes(it.estado)
            )}
            delta={computeDelta(
              buildSeries(items, (it) =>
                ['preparacion', 'enviado'].includes(it.estado)
              )
            )}
            hint="7d vs 7d prev"
            tone="indigo"
            onClick={() => setEstado('preparacion')} // tip: primer estado del “tránsito”
            loading={loading}
          />
          <KpiCardPro
            label="Entregados"
            value={items.filter((x) => x.estado === 'entregado').length}
            series={buildSeries(items, (it) => it.estado === 'entregado')}
            delta={computeDelta(
              buildSeries(items, (it) => it.estado === 'entregado')
            )}
            hint="7d vs 7d prev"
            tone="emerald"
            onClick={() => setEstado('entregado')}
            loading={loading}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPage.length === 0 && (
          <EmptyState
            title="Sin resultados"
            subtitle="No encontramos pedidos con los filtros aplicados."
            actionLabel="Crear pedido"
            onAction={openCreateModal}
          />
        )}

        {/* Grid de cards */}
        {!loading && filteredPage.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPage.map((row) => (
                <PedidoCard
                  key={row.id}
                  row={row}
                  onVer={() => {
                    setDetailItem(row);
                    setOpenDetail(true);
                  }}
                  onEditarCantidades={() => openQtyModal(row)}
                  onCancelar={() => askCancel(row)}
                  onCambiarEstado={changeEstado}
                />
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-3 border rounded-xl bg-white">
              <div className="text-xs text-gray-500">
                {items.length} resultado(s) • Página {page}/{totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
                  title="Anterior"
                >
                  ‹
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50"
                  title="Siguiente"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Crear */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nuevo pedido"
        size="max-w-2xl"
      >
        <CreatePedidoForm
          API_BASE={API_BASE}
          userLocalId={userLocalId}
          form={form}
          setForm={setForm}
          onCancel={() => setOpenCreate(false)}
          onSubmit={submitCreate}
        />
      </Modal>

      {/* MODAL: Detalle */}
      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title={`Pedido #${detailItem?.id ?? ''}`}
        size="max-w-2xl"
      >
        {!detailItem ? (
          <DetailSkeleton />
        ) : (
          <div className="space-y-5">
            {/* HEADER ENRIQUECIDO */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Pedido
                </div>
                <div className="text-2xl font-extrabold text-slate-800">
                  #{detailItem.id}
                </div>
                <div className="text-xs text-slate-500">
                  Creado:{' '}
                  {new Date(detailItem.created_at).toLocaleString('es-AR')}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <EstadoBadge value={detailItem.estado} />
                {detailItem.prioridad === 'alta' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600">
                    prioridad: alta
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                    prioridad: normal
                  </span>
                )}
              </div>
            </div>

            {/* STEPPER DE ESTADO */}
            <StepperEstado current={detailItem.estado} />

            {/* PRODUCTO + SKU */}
            <div className="rounded-xl border border-slate-200 bg-white/50 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoRow label="Producto">
                  <div className="font-semibold text-slate-800">
                    {detailItem.producto?.nombre ||
                      `ID ${detailItem.producto_id}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    SKU: {detailItem.producto?.codigo_sku ?? '—'}
                  </div>
                </InfoRow>
                <InfoRow label="Origen">
                  <Chip>
                    {detailItem.local_origen?.codigo ||
                      detailItem.local_origen?.nombre ||
                      detailItem.local_origen_id}
                  </Chip>
                </InfoRow>
                <InfoRow label="Destino">
                  <Chip tone="success">
                    {detailItem.local_destino?.codigo ||
                      detailItem.local_destino?.nombre ||
                      detailItem.local_destino_id}
                  </Chip>
                </InfoRow>
              </div>
            </div>

            {/* CANTIDADES + PROGRESO */}
            <div className="rounded-xl border border-slate-200 bg-white/50 p-4">
              <CantidadesBar
                solicitada={detailItem.cantidad_solicitada}
                preparada={detailItem.cantidad_preparada}
                enviada={detailItem.cantidad_enviada}
                recibida={detailItem.cantidad_recibida}
              />
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <Stat
                  label="Solicitada"
                  value={detailItem.cantidad_solicitada}
                />
                <Stat label="Preparada" value={detailItem.cantidad_preparada} />
                <Stat label="Enviada" value={detailItem.cantidad_enviada} />
                <Stat label="Recibida" value={detailItem.cantidad_recibida} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => openQtyModal(detailItem)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 text-slate-700 text-sm"
                  title="Editar cantidades"
                >
                  Editar cantidades
                </button>
              </div>
            </div>

            {/* OBSERVACIONES */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                Observaciones
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {detailItem.observaciones || '—'}
              </div>
            </div>

            {/* ACCIONES RÁPIDAS CONTEXTUALES */}
            <QuickActions
              row={detailItem}
              estado={detailItem.estado}
              onChangeEstado={(nuevo) => changeEstado(detailItem, nuevo)}
              onCancelar={() => askCancel(detailItem)}
            />

            {/* FOOTER STICKY (dentro del modal) */}
            <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-gradient-to-t from-white via-white to-transparent border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${window.location.origin}/pedidos/${detailItem.id}`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg border hover:bg-slate-50 text-slate-700"
                  title="Copiar enlace"
                >
                  Copiar enlace
                </button>
              </div>
              <button
                onClick={() => setOpenDetail(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Cantidades */}
      <Modal
        open={openQty}
        onClose={() => setOpenQty(false)}
        title={`Editar cantidades • Pedido #${qtyItem?.id ?? ''}`}
        size="max-w-xl"
      >
        {!qtyItem ? (
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-slate-200 rounded w-40" />
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <QtyEditor
            qtyItem={qtyItem}
            initial={qtyForm}
            onChange={setQtyForm}
            onCancel={() => setOpenQty(false)}
            onSubmit={submitQty}
          />
        )}
      </Modal>
    </div>
  );
}

// ================== MENÚ DE ESTADO ==================
function EstadoMenu({ row, onChangeEstado }) {
  const [open, setOpen] = useState(false);

  // mismas transiciones que el backend
  const opciones = useMemo(() => {
    const map = {
      pendiente: ['visto', 'cancelado'],
      visto: ['preparacion', 'cancelado'],
      preparacion: ['enviado', 'cancelado'],
      enviado: ['entregado'],
      entregado: [],
      cancelado: []
    };
    return map[row.estado] || [];
  }, [row.estado]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-gray-700"
        title="Cambiar estado"
      >
        <FaEllipsisV />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-10 overflow-hidden"
          >
            {opciones.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Sin acciones
              </div>
            ) : (
              opciones.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setOpen(false);
                    onChangeEstado(row, opt);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {ESTADO_EMOJI[opt]} {opt}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Devuelve series de 14 puntos (7 + 7 para delta) con conteos por día.
export function buildSeries(items, predicate = () => true, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKey = (d) => d.toISOString().slice(0, 10);

  const range = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return dayKey(d);
  });

  const buckets = Object.fromEntries(range.map((k) => [k, 0]));

  items.forEach((it) => {
    if (!predicate(it)) return;
    const k = dayKey(new Date(it.created_at));
    if (k in buckets) buckets[k] += 1;
  });

  return range.map((k) => buckets[k] || 0);
}

// Delta simple: última mitad – mitad previa (p.ej. 7d vs 7d previos)
export function computeDelta(series) {
  if (!Array.isArray(series) || series.length < 2) return 0;
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, series.length - half).reduce((a, b) => a + b, 0);
  const now = series.slice(series.length - half).reduce((a, b) => a + b, 0);
  return now - prev;
}

import {
  FaEye,
  FaTools,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

/* Skeleton elegante */
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 bg-slate-200 rounded" />
      <div className="h-4 w-64 bg-slate-200 rounded" />
      <div className="h-24 bg-slate-100 rounded" />
      <div className="h-24 bg-slate-100 rounded" />
      <div className="h-16 bg-slate-100 rounded" />
    </div>
  );
}

/* Stat pequeña */
function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-base font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* InfoRow: label + children */
function InfoRow({ label, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </div>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}

/* Stepper de estado (neutral) */
function StepperEstado({ current }) {
  const steps = [
    { key: 'pendiente', label: 'Pendiente', icon: FaEye },
    { key: 'preparacion', label: 'Preparación', icon: FaTools },
    { key: 'enviado', label: 'Enviado', icon: FaTruck },
    { key: 'entregado', label: 'Entregado', icon: FaCheckCircle }
  ];
  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === current)
  );

  return (
    <div className="relative">
      <div className="absolute left-[12px] right-[12px] top-1/2 -translate-y-1/2 h-[2px] bg-slate-200" />
      <div className="relative z-10 grid grid-cols-4 gap-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx <= activeIndex;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-400 border-slate-300'
                }`}
              >
                <Icon className="text-[10px]" />
              </div>
              <div
                className={`text-xs ${
                  isActive ? 'text-slate-800 font-medium' : 'text-slate-500'
                }`}
              >
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Acciones rápidas según estado */
function QuickActions({ row, estado, onChangeEstado, onCancelar }) {
  // Flujo propuesto sin "cancelado" (lo manejamos con el botón dedicado):
  const nextMap = {
    pendiente: ['visto', 'preparacion'],
    visto: ['preparacion'],
    preparacion: ['enviado'],
    enviado: ['entregado'],
    entregado: [],
    cancelado: []
  };

  const options = nextMap[estado] || [];
  if (!options.length && estado !== 'pendiente') {
    // igual mostramos el botón cancelar si aplica
    return (
      <div className="rounded-xl border border-slate-200 bg-white/50 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Acciones rápidas
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCancelar}
            className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-sm"
            title="Cancelar pedido"
          >
            Cancelar pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/50 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        Acciones rápidas
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChangeEstado(opt)}   // 👈 ahora pasa solo el string
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm"
          >
            Marcar {opt}
          </button>
        ))}

        {/* cancelar siempre separado con DELETE */}
        {!['entregado','cancelado'].includes(estado) && (
          <button
            onClick={onCancelar}
            className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-sm"
            title="Cancelar pedido"
          >
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  );
}

function clamp(n, min, max) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function QtyEditor({ qtyItem, initial, onChange, onCancel, onSubmit }) {
  const solicitada = Number(qtyItem?.cantidad_solicitada || 0);

  // estado local controlado + sincronizado con onChange del padre
  const [prep, setPrep] = React.useState(
    Number(initial.cantidad_preparada || qtyItem.cantidad_preparada || 0)
  );
  const [env, setEnv] = React.useState(
    Number(initial.cantidad_enviada || qtyItem.cantidad_enviada || 0)
  );
  const [rec, setRec] = React.useState(
    Number(initial.cantidad_recibida || qtyItem.cantidad_recibida || 0)
  );
  const [touched, setTouched] = React.useState(false);

  // helpers de set + clamp + cascada
  const setPreparada = (val) => {
    let v = clamp(Number(val || 0), 0, solicitada);
    // si baja preparada, ajusto enviada/recibida
    if (env > v) envSet(v);
    if (rec > v) recSet(Math.min(rec, v, env));
    setTouched(true);
    setPrep(v);
    onChange((f) => ({ ...f, cantidad_preparada: String(v) }));
  };
  const envSet = (v) => {
    setTouched(true);
    setEnv(v);
    onChange((f) => ({ ...f, cantidad_enviada: String(v) }));
  };
  const recSet = (v) => {
    setTouched(true);
    setRec(v);
    onChange((f) => ({ ...f, cantidad_recibida: String(v) }));
  };
  const setEnviada = (val) => {
    let maxEnv = prep;
    let v = clamp(Number(val || 0), 0, maxEnv);
    // si baja enviada, ajusto recibida
    if (rec > v) recSet(v);
    envSet(v);
  };
  const setRecibida = (val) => {
    let maxRec = env;
    let v = clamp(Number(val || 0), 0, maxRec);
    recSet(v);
  };

  // quick actions
  const fillPreparada = () => setPreparada(solicitada);
  const fillEnviadaTodo = () => setEnviada(prep);
  const fillRecibidaTodo = () => setRecibida(env);

  // validaciones
  const errors = [];
  if (prep > solicitada)
    errors.push('La cantidad preparada no puede superar la solicitada.');
  if (env > prep)
    errors.push('La cantidad enviada no puede superar la preparada.');
  if (rec > env)
    errors.push('La cantidad recibida no puede superar la enviada.');

  const hasErrors = errors.length > 0;

  // disabled si no cambió nada
  const unchanged =
    String(prep) === String(qtyItem.cantidad_preparada || 0) &&
    String(env) === String(qtyItem.cantidad_enviada || 0) &&
    String(rec) === String(qtyItem.cantidad_recibida || 0);

  // submit wrapper (mantengo tu submitQty original)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasErrors) return;
    onSubmit(e);
  };

  const faltanPrep = Math.max(0, solicitada - prep);
  const faltanEnv = Math.max(0, prep - env);
  const faltanRec = Math.max(0, env - rec);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Resumen y progreso */}
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Progreso
        </div>
        <MultiProgress
          solicitada={solicitada}
          preparada={prep}
          enviada={env}
          recibida={rec}
        />
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
          <BadgeNeutral label={`Faltan preparar: ${faltanPrep}`} />
          <BadgeNeutral label={`Faltan enviar: ${faltanEnv}`} />
          <BadgeNeutral label={`Faltan recibir: ${faltanRec}`} />
        </div>
      </div>

      {/* Campos */}
      <FieldBlock
        label="Cantidad preparada"
        value={prep}
        onChangeNumber={setPreparada}
        min={0}
        max={solicitada}
        helper={`Máximo: ${solicitada}`}
        onQuickMax={fillPreparada}
      />

      <FieldBlock
        label="Cantidad enviada"
        value={env}
        onChangeNumber={setEnviada}
        min={0}
        max={prep}
        helper={`Máximo: ${prep}`}
        onQuickMax={fillEnviadaTodo}
      />

      <FieldBlock
        label="Cantidad recibida"
        value={rec}
        onChangeNumber={setRecibida}
        min={0}
        max={env}
        helper={`Máximo: ${env}`}
        onQuickMax={fillRecibidaTodo}
      />

      {/* Errores */}
      {hasErrors && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-sm p-3 flex gap-2">
          <FaInfoCircle className="mt-0.5" />
          <div>
            {errors.map((e, i) => (
              <div key={i}>• {e}</div>
            ))}
          </div>
        </div>
      )}

      {/* Footer sticky */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-gradient-to-t from-white via-white to-transparent border-t border-slate-200 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Solicitada: <b>{solicitada}</b> · Prep: <b>{prep}</b> · Env:{' '}
          <b>{env}</b> · Rec: <b>{rec}</b>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={hasErrors || unchanged}
            className={`px-4 py-2 rounded-lg text-white ${
              hasErrors || unchanged
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Guardar
          </button>
        </div>
      </div>
    </form>
  );
}

/* Campo con label + stepper + slider sincronizado */
function FieldBlock({
  label,
  value,
  onChangeNumber,
  min = 0,
  max = 0,
  helper,
  onQuickMax
}) {
  const dec = () => onChangeNumber(value - 1);
  const inc = () => onChangeNumber(value + 1);
  const onInput = (e) => onChangeNumber(e.target.value);
  const onSlide = (e) => onChangeNumber(e.target.value);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{helper}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="p-2 rounded-lg border hover:bg-slate-50"
        >
          <FaMinus />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={onInput}
          className="border rounded-lg px-3 py-2 w-28 text-center"
        />
        <button
          type="button"
          onClick={inc}
          className="p-2 rounded-lg border hover:bg-slate-50"
        >
          <FaPlus />
        </button>

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onSlide}
          className="flex-1 accent-slate-600"
        />

        <button
          type="button"
          onClick={onQuickMax}
          className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-sm"
          title="Llenar al máximo permitido"
        >
          Llenar
        </button>
      </div>
    </div>
  );
}

/* Badge neutra */
function BadgeNeutral({ label }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-100 text-slate-700">
      {label}
    </span>
  );
}

/* Barra múltiple de progreso (neutra) */
function MultiProgress({ solicitada, preparada, enviada, recibida }) {
  const safe = (n) => Math.max(0, Number(n) || 0);
  const total = Math.max(1, safe(solicitada));
  const pPrep = Math.min(100, Math.round((safe(preparada) / total) * 100));
  const pEnv = Math.min(100, Math.round((safe(enviada) / total) * 100));
  const pRec = Math.min(100, Math.round((safe(recibida) / total) * 100));
  return (
    <div className="h-2 w-full bg-slate-100 rounded overflow-hidden flex">
      <div
        style={{ width: `${pPrep}%` }}
        className="h-full bg-slate-400"
        title={`Preparada ${pPrep}%`}
      />
      <div
        style={{ width: `${Math.max(0, pEnv - pPrep)}%` }}
        className="h-full bg-slate-500"
        title={`Enviada ${pEnv}%`}
      />
      <div
        style={{ width: `${Math.max(0, pRec - pEnv)}%` }}
        className="h-full bg-slate-700"
        title={`Recibida ${pRec}%`}
      />
    </div>
  );
}

function CreatePedidoForm({
  API_BASE,
  userLocalId,
  form,
  setForm,
  onCancel,
  onSubmit
}) {
  const [products, setProducts] = useState([]);
  const [locales, setLocales] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [prodFilter, setProdFilter] = useState('');

  // stock origen detectado (para UX de cantidad)
  const [stockOrigen, setStockOrigen] = useState(null); // { id, cantidad } | null
  const disponible =
    typeof stockOrigen?.cantidad === 'number'
      ? stockOrigen.cantidad
      : undefined;

  // cargar listas cuando se abre
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingLists(true);
        const [prods, locs] = await Promise.all([
          fetch(`${API_BASE}/productos`)
            .then((r) => r.json())
            .catch(() => []),
          fetch(`${API_BASE}/locales`)
            .then((r) => r.json())
            .catch(() => [])
        ]);
        if (!mounted) return;
        setProducts(Array.isArray(prods) ? prods : []);
        setLocales(Array.isArray(locs) ? locs : []);
      } finally {
        if (mounted) setLoadingLists(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // detectar stock en origen cuando cambia producto/origen
  useEffect(() => {
    const pid = Number(form.producto_id);
    const lid = Number(form.local_origen_id);
    if (!pid || !lid) {
      setStockOrigen(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const url = new URL(`${API_BASE}/stock`);
        url.searchParams.set('producto_id', pid);
        url.searchParams.set('local_id', lid);
        const data = await fetch(url)
          .then((r) => r.json())
          .catch(() => []);
        const s = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!mounted) return;
        setStockOrigen(
          s ? { id: s.id, cantidad: Number(s.cantidad || 0) } : null
        );
        // autocompletar stock_id_origen (oculto al usuario)
        setForm((f) => ({ ...f, stock_id_origen: s?.id ? String(s.id) : '' }));
      } catch {
        if (mounted) setStockOrigen(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE, form.producto_id, form.local_origen_id, setForm]);

  // labels
  const labelLocal = (loc) =>
    [loc.codigo, loc.nombre].filter(Boolean).join(' — ') || `#${loc.id}`;
  const selectedProduct = useMemo(
    () => products.find((p) => String(p.id) === String(form.producto_id)),
    [products, form.producto_id]
  );

  // filtro productos
  const filteredProducts = useMemo(() => {
    if (!prodFilter) return products;
    const q = prodFilter.toLowerCase();
    return products.filter(
      (p) =>
        String(p.id).includes(q) ||
        p.nombre?.toLowerCase().includes(q) ||
        p.codigo_sku?.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.modelo?.toLowerCase().includes(q)
    );
  }, [products, prodFilter]);

  // validaciones
  const cantidadNum = Number(form.cantidad || 0);
  const sameLocal =
    form.local_origen_id &&
    form.local_destino_id &&
    String(form.local_origen_id) === String(form.local_destino_id);
  const qtyTooHigh = typeof disponible === 'number' && cantidadNum > disponible;
  const canSubmit =
    Number(form.producto_id) > 0 &&
    Number(form.local_origen_id) > 0 &&
    Number(form.local_destino_id) > 0 &&
    !sameLocal &&
    cantidadNum >= 1 &&
    !qtyTooHigh;

  // acciones
  const swapLocales = () => {
    setForm((f) => ({
      ...f,
      local_origen_id: f.local_destino_id,
      local_destino_id: f.local_origen_id
    }));
  };

  const setCantidad = (v) => {
    let n = Math.max(1, Number(v || 1));
    if (typeof disponible === 'number') n = Math.min(n, disponible);
    setForm((f) => ({ ...f, cantidad: n }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(e); // usa tu submitCreate existente (toma form del estado)
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Producto + Previsualización */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Producto
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Buscar por nombre, SKU, marca…"
              value={prodFilter}
              onChange={(e) => setProdFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>
          <select
            value={form.producto_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, producto_id: e.target.value }))
            }
            className="w-full border rounded-lg px-3 py-2"
            disabled={loadingLists}
            required
          >
            <option value="">Seleccioná un producto…</option>
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.modelo ? `• ${p.modelo}` : ''}{' '}
                {p.medida ? `• ${p.medida}` : ''} — {p.codigo_sku}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Preview
          </div>
          <div className="flex items-center gap-3">
            {selectedProduct?.imagen_url ? (
              <img
                src={selectedProduct.imagen_url}
                alt={selectedProduct.nombre}
                className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                loading="lazy"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 grid place-items-center text-slate-400 text-xs">
                IMG
              </div>
            )}
            <div className="text-sm">
              <div className="font-semibold">
                {selectedProduct?.nombre ?? '—'}
              </div>
              <div className="text-slate-500 text-xs">
                SKU: {selectedProduct?.codigo_sku ?? '—'}
              </div>
              {selectedProduct?.precio_con_descuento && (
                <div className="text-slate-700 text-xs mt-1">
                  $
                  {Number(selectedProduct.precio_con_descuento).toLocaleString(
                    'es-AR'
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Origen / Destino + swap */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3">
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Local origen
          </div>
          <select
            value={form.local_origen_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, local_origen_id: e.target.value }))
            }
            className="w-full border rounded-lg px-3 py-2"
            disabled={loadingLists}
            required
          >
            <option value="">Seleccioná origen…</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {labelLocal(l)}
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-slate-500">
            {typeof disponible === 'number' ? (
              <>
                Stock disponible aquí: <b>{disponible}</b>
                {stockOrigen?.id ? ` • (stock_id #${stockOrigen.id})` : null}
              </>
            ) : (
              'Seleccioná producto y origen para ver stock disponible'
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={swapLocales}
            className="h-10 px-3 rounded-xl border bg-white hover:bg-slate-50 text-slate-700"
            title="Intercambiar origen/destino"
          >
            <FaArrowsAltH />
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Local destino
          </div>
          <select
            value={form.local_destino_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, local_destino_id: e.target.value }))
            }
            className="w-full border rounded-lg px-3 py-2"
            disabled={loadingLists}
            required
          >
            <option value="">Seleccioná destino…</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {labelLocal(l)}
              </option>
            ))}
          </select>
          {sameLocal && (
            <div className="mt-2 text-xs text-rose-600">
              El destino debe ser diferente del origen.
            </div>
          )}
        </div>
      </div>

      {/* Cantidad + Prioridad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cantidad con stepper + slider */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Cantidad
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCantidad(cantidadNum - 1)}
              className="p-2 rounded-lg border hover:bg-slate-50"
            >
              <FaMinus />
            </button>
            <input
              type="number"
              min={1}
              max={disponible ?? undefined}
              required
              value={form.cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="border rounded-lg px-3 py-2 w-28 text-center"
            />
            <button
              type="button"
              onClick={() => setCantidad(cantidadNum + 1)}
              className="p-2 rounded-lg border hover:bg-slate-50"
            >
              <FaPlus />
            </button>
            <input
              type="range"
              min={1}
              max={Math.max(1, disponible ?? 100)}
              value={cantidadNum || 1}
              onChange={(e) => setCantidad(e.target.value)}
              className="flex-1 accent-slate-600"
            />
            {typeof disponible === 'number' && (
              <button
                type="button"
                onClick={() => setCantidad(disponible)}
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-sm"
              >
                Llenar ({disponible})
              </button>
            )}
          </div>
          {qtyTooHigh && (
            <div className="mt-2 text-xs text-rose-600">
              No hay stock suficiente en el origen.
            </div>
          )}
        </div>

        {/* Prioridad */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Prioridad
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, prioridad: 'normal' }))}
              className={`px-3 py-2 rounded-lg border ${
                form.prioridad === 'normal'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, prioridad: 'alta' }))}
              className={`px-3 py-2 rounded-lg border ${
                form.prioridad === 'alta'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Alta
            </button>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
          Observaciones
        </div>
        <textarea
          placeholder="Ej: Pedido desde POS: Producto X"
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          value={form.observaciones}
          onChange={(e) =>
            setForm((f) => ({ ...f, observaciones: e.target.value }))
          }
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {!canSubmit && 'Completá los campos requeridos para crear el pedido.'}
          {canSubmit && 'Listo para crear.'}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-lg text-white ${
              canSubmit
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            Crear pedido
          </button>
        </div>
      </div>
    </form>
  );
}