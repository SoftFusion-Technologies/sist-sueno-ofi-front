// src/Pages/Compras/AdminPageCompras.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavbarStaff from '../Dash/NavbarStaff';
import '../../Styles/staff/dashboard.css';
import '../../Styles/staff/background.css';
import { useAuth } from '../../AuthContext';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { motion } from 'framer-motion';

// Icons
import {
  FaShoppingCart,
  FaPlusCircle,
  FaFileInvoiceDollar,
  FaHandHoldingUsd,
  FaPercent,
  FaClipboardList,
  FaTruck,
  FaUndoAlt,
  FaFileInvoice,
  FaBook,
  FaCogs,
  FaCloudUploadAlt,
  FaSitemap,
  FaSearch
} from 'react-icons/fa';
import CompraFormModal from '../../Components/Compras/CompraFormModal';

/**
 * THEME — Emerald/Jade con toques de vidrio + brillo.
 * Si querés el mismo de Bancos (teal/azul): cambia bg y accent.
 */
const THEME = {
  title: 'Compras',
  bg: 'bg-gradient-to-b from-[#041f1a] via-[#064e3b] to-[#0b3b2f]',
  accentText: 'text-emerald-300',
  accentIcon: 'text-emerald-400',
  hoverShadow: 'hover:shadow-emerald-400',
  cardRing: 'ring-emerald-500/20',
  kpiGlow: 'from-emerald-400/40 via-transparent to-transparent'
};

// Links del módulo (TODO: ajusta rutas reales si difieren)
const links = [
  {
    to: '/dashboard/compras/listado',
    label: 'Compras',
    sub: 'Listado y estados',
    icon: <FaShoppingCart />
  },
  {
    to: '/dashboard/compras/cxp',
    label: 'Cuentas por Pagar',
    sub: 'Saldos y vencimientos',
    icon: <FaFileInvoiceDollar />
  },
  {
    to: '/dashboard/compras/pagos',
    label: 'Pagos a Proveedor',
    sub: 'Un/múltiples medios',
    icon: <FaHandHoldingUsd />
  },
  {
    to: '/dashboard/compras/impuestos',
    label: 'Impuestos por Compra',
    sub: 'IVA/perc/ret',
    icon: <FaPercent />
  },
  {
    to: '/dashboard/compras/ordenes',
    label: 'Órdenes de Compra',
    sub: 'Pre-aprobación',
    icon: <FaClipboardList />
  },
  {
    to: '/dashboard/compras/recepciones',
    label: 'Recepciones',
    sub: 'Remitos / ingreso',
    icon: <FaTruck />
  },
  {
    to: '/dashboard/compras/devoluciones',
    label: 'Devoluciones a Proveedor',
    sub: 'Stock + CxP',
    icon: <FaUndoAlt />
  },
  {
    to: '/dashboard/compras/notas-credito',
    label: 'Notas de Crédito',
    sub: 'Ajustes y referencias',
    icon: <FaFileInvoice />
  },
  {
    to: '/dashboard/compras/stock-movimientos',
    label: 'Libro Mayor de Stock',
    sub: 'COMPRA/VENTA/etc',
    icon: <FaBook />
  },
  {
    to: '/dashboard/compras/impuestos-config',
    label: 'Config. Impuestos',
    sub: 'Catálogo de alícuotas',
    icon: <FaCogs />
  },
  {
    to: '/dashboard/compras/adjuntos',
    label: 'Adjuntos',
    sub: 'PDF/Remitos/Comprob.',
    icon: <FaCloudUploadAlt />
  },
  {
    to: '/dashboard/compras/mapeo-contable',
    label: 'Mapeo Contable',
    sub: 'Cuentas por rubro',
    icon: <FaSitemap />
  }
];

// Mini hook de tilt 3D con framer-motion (efecto sutil, "poco visto")
function useTilt(maxTilt = 6) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const ry = (px - 0.5) * 2 * maxTilt; // -max..max
    const rx = -(py - 0.5) * 2 * maxTilt; // -max..max
    setTilt({ rx, ry });
  };

  const reset = () => setTilt({ rx: 0, ry: 0 });

  return { ref, tilt, handleMouseMove, reset };
}

const CardLink = ({ to, label, sub, icon, index }) => {
  const { ref, tilt, handleMouseMove, reset } = useTilt();
  return (
    <Link
      to={typeof to === 'string' ? to : to.pathname}
      state={typeof to === 'object' ? to.state || {} : {}}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={reset}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, delay: index * 0.05 }}
        style={{
          transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
        }}
        className={[
          'group relative bg-white/90 backdrop-blur-xl',
          'rounded-2xl border border-white/20',
          'shadow-lg transition-all duration-300',
          THEME.hoverShadow,
          'hover:scale-[1.03] p-5'
        ].join(' ')}
      >
        {/* Halo dinámico */}
        <div
          className={[
            'absolute inset-0 rounded-2xl pointer-events-none',
            'ring-1',
            THEME.cardRing,
            'opacity-0 group-hover:opacity-100 transition-opacity'
          ].join(' ')}
        />
        {/* Brillo diagonal sutil */}
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 blur-2xl" />
        </div>

        <div className="flex items-center gap-4">
          <span className={['text-4xl', THEME.accentIcon].join(' ')}>
            {icon}
          </span>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-gray-800 leading-tight">
              {label}
            </div>
            {sub && <div className="text-sm text-gray-500">{sub}</div>}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const StatCard = ({ label, value, hint }) => (
  <div className="relative overflow-hidden">
    <div className="absolute -top-14 -left-16 w-56 h-56 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-emerald-400/20 to-transparent" />
    <div className="absolute -bottom-14 -right-16 w-56 h-56 rounded-full blur-3xl opacity-30 bg-gradient-to-tr from-emerald-500/20 to-transparent" />
    <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-lg">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  </div>
);

const AdminPageCompras = () => {
  const { userLevel } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // 🔎 Búsqueda global (simple: redirige al listado con query)
  const [q, setQ] = useState('');
  const onSubmitSearch = (e) => {
    e.preventDefault();
    if (!q?.trim()) return;
    navigate(`/dashboard/compras/listado?q=${encodeURIComponent(q.trim())}`);
  };

  // 📊 KPIs (placeholder) — reemplazar con fetch a tu backend
  const [stats, setStats] = useState({ cxpTotal: 0, venceHoy: 0, pagosHoy: 0 });
  useEffect(() => {
    // TODO: fetch KPIs reales, ejemplo:
    // fetch('/api/compras/kpis').then(r => r.json()).then(setStats).catch(()=>{});
  }, []);

  return (
    <>
      <NavbarStaff />
      <section className="relative w-full min-h-screen bg-white">
        <div className={['min-h-screen', THEME.bg, 'relative'].join(' ')}>
          <ParticlesBackground />
          <ButtonBack />

          {/* Glow superior sutil */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />

          {/* Header */}
          <div className="text-center pt-24 px-4">
            <motion.h1
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl titulo uppercase font-bold text-white drop-shadow-md"
            >
              Gestión de {THEME.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={['mt-3 text-sm sm:text-base', THEME.accentText].join(
                ' '
              )}
            >
              <span className="font-semibold">Compras · CxP · Pagos</span>
            </motion.p>
          </div>

          {/* GRID principal */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* línea luminosa decorativa */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {links.map((item, index) => (
                <CardLink key={item.label} index={index} {...item} />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Modal Crear Compra */}
      <CompraFormModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={() => {}}
        initial={null}
      />
    </>
  );
};

export default AdminPageCompras;
