import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import {
  FaCashRegister,
  FaPlay,
  FaStop,
  FaPlus,
  FaShoppingCart,
  FaCalendarAlt,
  FaUserCircle,
  FaUser,
  FaMapMarkerAlt,
  FaMoneyBillAlt,
  FaBarcode,
  FaMinus,
  FaTimes,
  FaHistory,
  FaClock,
  FaCheckCircle,
  FaMoneyBillWave,
  FaStore,
  FaCalendarCheck,
  FaTimesCircle,
  FaPercentage
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { formatearPeso } from '../../utils/formatearPeso';

import {
  fetchLocales,
  fetchUsuarios,
  getNombreLocal,
  getInfoLocal,
  getNombreUsuario
} from '../../utils/utils.js';
// Microcomponente Glass Card
const GlassCard = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl p-6 shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/10 ${className}`}
  >
    {children}
  </div>
);

export default function CajaPOS() {
  const { userId, userLocalId } = useAuth();

  const [cajaActual, setCajaActual] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [saldoInicial, setSaldoInicial] = useState('');
  const [cargando, setCargando] = useState(true);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: 'ingreso',
    monto: '',
    descripcion: ''
  });
  const [historial, setHistorial] = useState([]);
  const [showHistorial, setShowHistorial] = useState(false);

  useEffect(() => {
    const fetchCaja = async () => {
      setCargando(true);
      try {
        const res = await axios.get(`http://localhost:8080/caja`);
        const abierta = res.data.find(
          (c) =>
            c.usuario_id == userId &&
            c.local_id == userLocalId &&
            c.fecha_cierre === null
        );
        setCajaActual(abierta || null);

        if (abierta) {
          // Ahora usa el endpoint RESTful, NO query params
          const mov = await axios.get(
            `http://localhost:8080/movimientos/caja/${abierta.id}`
          );
          setMovimientos(mov.data);
        }
      } catch {
        setCajaActual(null);
      }
      setCargando(false);
    };
    fetchCaja();
  }, [userId, userLocalId]);

  // Cargar historial
  const cargarHistorial = async () => {
    const res = await axios.get(
      `http://localhost:8080/caja?local_id=${userLocalId}`
    );
    setHistorial(res.data.filter((c) => c.fecha_cierre !== null));
    setShowHistorial(true);
  };

  const abrirCaja = async () => {
    if (
      !saldoInicial ||
      isNaN(parseFloat(saldoInicial)) ||
      parseFloat(saldoInicial) < 0
    ) {
      alert('Ingresá un saldo inicial válido');
      return;
    }
    try {
      const res = await axios.post(`http://localhost:8080/caja`, {
        usuario_id: userId,
        local_id: userLocalId,
        saldo_inicial: parseFloat(saldoInicial)
      });
      setCajaActual(res.data.caja || res.data);
      setMovimientos([]);
      setSaldoInicial('');
    } catch (err) {
      alert(err.response?.data?.mensajeError || 'Error al abrir caja');
    }
  };

  const cerrarCaja = async () => {
    if (!cajaActual) return;
    if (!window.confirm('¿Cerrar caja?')) return;
    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'egreso')
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const saldoFinal =
      Number(cajaActual.saldo_inicial) + totalIngresos - totalEgresos;
    try {
      await axios.put(`http://localhost:8080/caja/${cajaActual.id}`, {
        fecha_cierre: new Date(),
        saldo_final: saldoFinal
      });
      setCajaActual(null);
      setMovimientos([]);
    } catch (err) {
      alert(err.response?.data?.mensajeError || 'Error al cerrar caja');
    }
  };

  const registrarMovimiento = async () => {
    if (!cajaActual) return;
    if (
      !nuevoMovimiento.descripcion ||
      !nuevoMovimiento.monto ||
      isNaN(Number(nuevoMovimiento.monto))
    ) {
      alert('Completá todos los datos');
      return;
    }
    try {
      await axios.post(`http://localhost:8080/movimientos_caja`, {
        caja_id: cajaActual.id,
        tipo: nuevoMovimiento.tipo,
        descripcion: nuevoMovimiento.descripcion,
        monto: Number(nuevoMovimiento.monto)
      });
      const mov = await axios.get(
        `http://localhost:8080/movimientos/caja/${cajaActual.id}`
      );

      setMovimientos(mov.data);
      setNuevoMovimiento({ tipo: 'ingreso', monto: '', descripcion: '' });
    } catch (err) {
      alert('Error al registrar movimiento');
    }
  };

  const totalIngresos = movimientos
    .filter((m) => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + Number(m.monto), 0);
  const totalEgresos = movimientos
    .filter((m) => m.tipo === 'egreso')
    .reduce((sum, m) => sum + Number(m.monto), 0);

  // Estado para modal de detalle
  const [detalleVenta, setDetalleVenta] = useState(null);

  // Función para obtener detalle de venta
  const mostrarDetalleVenta = async (idVenta) => {
    try {
      const res = await fetch(
        `http://localhost:8080/ventas/${idVenta}/detalle`
      );
      if (!res.ok) throw new Error('No se pudo obtener el detalle');
      const data = await res.json();
      setDetalleVenta(data);
    } catch (err) {
      alert('No se pudo obtener el detalle de la venta');
    }
  };

  const [detalleCaja, setDetalleCaja] = useState(null);

  const [locales, setLocales] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carga ambos catálogos en paralelo
    setLoading(true);
    Promise.all([fetchLocales(), fetchUsuarios()])
      .then(([localesData, usuariosData]) => {
        setLocales(localesData);
        setUsuarios(usuariosData);
      })
      .finally(() => setLoading(false));
  }, []);

  const infoLocal = detalleCaja
    ? getInfoLocal(detalleCaja.local_id, locales)
    : { nombre: '-', direccion: '-' };

  // RESPONSIVE & GLASS
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#101016] via-[#181A23] to-[#11192b] px-2 py-8">
      <ParticlesBackground />
      <ButtonBack></ButtonBack>
      {/* <ButtonBack /> */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="shadow-2xl">
          <h1 className="flex gap-3 items-center text-2xl md:text-3xl font-bold mb-6 text-emerald-400 tracking-wider">
            <FaCashRegister className="text-emerald-400 text-3xl" /> CAJA
          </h1>

          {cargando ? (
            <div className="flex justify-center items-center min-h-[140px]">
              <span className="text-emerald-300 font-bold animate-pulse text-lg">
                Cargando...
              </span>
            </div>
          ) : cajaActual ? (
            <>
              <div className="flex flex-col md:flex-row md:justify-between gap-3 mb-3 text-sm">
                <span>
                  <b className="text-white">Caja abierta</b> #{cajaActual.id}
                </span>
                <span className="text-emerald-200">
                  Apertura:{' '}
                  {new Date(cajaActual.fecha_apertura).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="bg-black/30 rounded-lg px-4 py-2 flex flex-col items-center">
                  <span className="text-xs text-gray-300">Saldo inicial</span>
                  <span className="font-bold text-emerald-300 text-lg">
                    {formatearPeso(cajaActual.saldo_inicial)}
                  </span>
                </div>
                <div className="bg-black/30 rounded-lg px-4 py-2 flex flex-col items-center">
                  <span className="text-xs text-gray-300">Ingresos</span>

                  <span className="font-bold text-green-400 text-lg">
                    +{formatearPeso(totalIngresos)}
                  </span>
                </div>
                <div className="bg-black/30 rounded-lg px-4 py-2 flex flex-col items-center">
                  <span className="text-xs text-gray-300">Egresos</span>
                  <span className="font-bold text-red-400 text-lg">
                    -{formatearPeso(totalEgresos)}
                  </span>
                </div>
                <div className="bg-black/40 rounded-lg px-4 py-2 flex flex-col items-center border border-emerald-700 shadow-inner">
                  <span className="text-xs text-gray-300">Saldo actual</span>
                  <span className="font-bold text-emerald-400 text-xl">
                    {formatearPeso(
                      Number(cajaActual.saldo_inicial) +
                        totalIngresos -
                        totalEgresos
                    )}
                  </span>
                </div>
              </div>
              <h2 className="mt-8 text-xl font-semibold mb-2 text-white">
                Movimientos
              </h2>
              <div className="max-h-56 overflow-y-auto mb-2 rounded-xl bg-gradient-to-br from-[#192023] to-[#232631] p-2 custom-scrollbar shadow-inner">
                {movimientos.length === 0 ? (
                  <p className="text-gray-400 text-center">Sin movimientos…</p>
                ) : (
                  // Ordena de más reciente a más antiguo
                  movimientos
                    .slice()
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map((m) => {
                      // Determina color y estilo por tipo y si es venta
                      let bg, border, icon;
                      if (m.descripcion?.toLowerCase().includes('venta #')) {
                        bg =
                          'bg-gradient-to-r from-emerald-900/80 to-emerald-800/60';
                        border = 'border-l-4 border-emerald-400';
                        icon = (
                          <FaCashRegister className="text-emerald-400 mr-2" />
                        );
                      } else if (m.tipo === 'egreso') {
                        bg = 'bg-gradient-to-r from-red-900/70 to-red-700/40';
                        border = 'border-l-4 border-red-500';
                        icon = <FaMinus className="text-red-400 mr-2" />;
                      } else {
                        bg =
                          'bg-gradient-to-r from-green-900/70 to-green-800/30';
                        border = 'border-l-4 border-green-400';
                        icon = <FaPlus className="text-green-300 mr-2" />;
                      }
                      return (
                        <motion.div
                          key={m.id}
                          className={`grid grid-cols-[minmax(120px,2fr)_minmax(95px,1fr)_minmax(78px,auto)_auto] items-center gap-2 py-2 px-3 mb-2 rounded-xl text-base shadow-sm transition-all ${bg} ${border}`}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.17 }}
                        >
                          {/* Icono y descripción */}
                          <div className="flex items-center truncate font-semibold">
                            {icon}
                            <span className="truncate">{m.descripcion}</span>
                          </div>
                          {/* Monto */}
                          <span
                            className={
                              m.tipo === 'ingreso'
                                ? 'text-green-300 font-semibold text-lg text-right'
                                : 'text-red-300 font-semibold text-lg text-right'
                            }
                          >
                            {m.tipo === 'ingreso' ? '+' : '-'}$
                            {Number(m.monto).toLocaleString('es-AR', {
                              minimumFractionDigits: 2
                            })}
                          </span>
                          {/* Hora */}
                          <span className="text-xs text-gray-400 text-right">
                            {new Date(m.fecha).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {/* Botón detalle solo para venta */}
                          {m.tipo === 'ingreso' &&
                            m.referencia &&
                            /^\d+$/.test(m.referencia) && (
                              <button
                                className="text-emerald-300 underline text-xs font-semibold hover:text-emerald-200 transition whitespace-nowrap ml-2"
                                onClick={() =>
                                  mostrarDetalleVenta(Number(m.referencia))
                                }
                                title="Ver detalle de venta"
                              >
                                Ver detalle
                              </button>
                            )}
                        </motion.div>
                      );
                    })
                )}
              </div>

              {/* Registrar movimiento manual */}
              <div className="mt-8">
                <h3 className="font-bold mb-3 flex gap-2 items-center text-lg text-white">
                  <FaPlus /> Registrar movimiento manual
                </h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value={nuevoMovimiento.tipo}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        tipo: e.target.value
                      })
                    }
                    className="rounded-lg p-2 bg-[#232323] text-white border border-emerald-500 focus:ring-emerald-500"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={nuevoMovimiento.monto}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        monto: e.target.value
                      })
                    }
                    placeholder="Monto"
                    className="rounded-lg p-2 bg-[#232323] text-white border border-emerald-500 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={nuevoMovimiento.descripcion}
                    onChange={(e) =>
                      setNuevoMovimiento({
                        ...nuevoMovimiento,
                        descripcion: e.target.value
                      })
                    }
                    placeholder="Descripción"
                    className="rounded-lg p-2 bg-[#232323] text-white border border-emerald-500 focus:ring-emerald-500"
                    maxLength={70}
                  />
                  <button
                    onClick={registrarMovimiento}
                    className="bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-lg transition"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              <button
                onClick={cerrarCaja}
                className="w-full mt-8 py-3 rounded-xl font-bold transition bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white text-lg flex items-center gap-2 justify-center shadow-2xl"
              >
                <FaStop /> Cerrar caja
              </button>
            </>
          ) : (
            // No hay caja abierta
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                Abrir caja
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 items-center mb-6">
                <input
                  type="number"
                  min={0}
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  placeholder="Saldo inicial"
                  className="rounded-lg p-3 bg-[#232323] text-white border border-emerald-500 focus:ring-emerald-500 flex-1"
                />
                <button
                  onClick={abrirCaja}
                  className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-2 rounded-lg hover:from-emerald-700 hover:to-green-800 font-bold text-white text-lg shadow-lg"
                >
                  <FaPlay /> Abrir caja
                </button>
              </div>
              <button
                className="text-emerald-400 hover:underline mt-2 text-sm flex items-center"
                onClick={cargarHistorial}
              >
                <FaHistory className="inline mr-2" /> Ver historial de cajas
              </button>
            </div>
          )}
        </GlassCard>

        {/* Modal historial */}
        <AnimatePresence>
          {showHistorial && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 40 }}
                transition={{ duration: 0.18 }}
                className="bg-[#23253a] rounded-2xl max-w-lg w-full shadow-2xl p-7 relative border border-emerald-700"
              >
                <button
                  className="absolute top-4 right-5 text-gray-400 hover:text-emerald-400 text-xl transition-transform hover:scale-125"
                  onClick={() => setShowHistorial(false)}
                >
                  <FaTimes />
                </button>
                <div className="flex items-center gap-3 mb-5">
                  <FaHistory className="text-emerald-400 text-lg" />
                  <h4 className="font-bold text-emerald-400 text-xl tracking-tight">
                    Historial de cajas cerradas
                  </h4>
                </div>
                <ul className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {historial.length === 0 ? (
                    <li className="text-gray-400 text-center py-8 font-semibold text-base">
                      Sin historial…
                    </li>
                  ) : (
                    historial.map((c) => (
                      <li
                        key={c.id}
                        onClick={() => setDetalleCaja(c)}
                        className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-black/20 rounded-xl px-4 py-3 font-mono border border-transparent hover:border-emerald-400 hover:bg-emerald-900/30 cursor-pointer transition-all shadow-sm group"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 font-bold text-emerald-300 group-hover:text-white">
                            #{c.id}
                            <span
                              className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold shadow 
                      ${
                        c.fecha_cierre
                          ? 'bg-emerald-600/80 text-white'
                          : 'bg-yellow-400/80 text-gray-900'
                      }
                    `}
                            >
                              {c.fecha_cierre ? (
                                <span className="flex items-center gap-1">
                                  <FaCheckCircle className="inline" /> Cerrada
                                </span>
                              ) : (
                                'Abierta'
                              )}
                            </span>
                          </span>
                          <span className="text-gray-400 flex items-center gap-2 text-xs">
                            <FaClock />{' '}
                            {new Date(c.fecha_apertura).toLocaleDateString()}{' '}
                            <span className="text-gray-500">
                              (
                              {new Date(c.fecha_apertura).toLocaleTimeString(
                                [],
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                              )
                            </span>
                          </span>
                        </div>
                        <span className="flex items-center gap-2 text-xs text-emerald-300 group-hover:text-emerald-100 mt-2 sm:mt-0">
                          <FaMoneyBillWave className="inline" />
                          {c.saldo_final ? (
                            'Final: ' + formatearPeso(c.saldo_final)
                          ) : (
                            <span className="text-yellow-400">Sin cerrar</span>
                          )}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* Estilos scrollbar propios */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #41e1b1; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      <AnimatePresence>
        {detalleVenta && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDetalleVenta(null)}
          >
            <motion.div
              className="bg-[#181d2b] max-w-md w-full rounded-3xl shadow-2xl p-7 relative text-white"
              initial={{ scale: 0.85, y: 80 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40, opacity: 0 }}
              transition={{ duration: 0.23 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cerrar */}
              <button
                className="absolute top-5 right-6 text-2xl text-gray-300 hover:text-emerald-400"
                onClick={() => setDetalleVenta(null)}
                title="Cerrar"
              >
                ×
              </button>

              <div className="flex items-center gap-3 mb-3">
                <FaShoppingCart className="text-emerald-400 text-2xl" />
                <h2 className="text-2xl font-bold tracking-wide flex-1">
                  Venta #{detalleVenta.id}
                </h2>
              </div>

              {/* Info básica */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <FaCalendarAlt className="text-emerald-300" />
                  {new Date(detalleVenta.fecha).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaUserCircle className="text-emerald-300" />
                  {detalleVenta.usuario?.nombre}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm mb-3">
                <FaUser className="text-emerald-300" />
                <span>
                  Cliente:{' '}
                  <b className="text-emerald-300">
                    {detalleVenta.cliente?.nombre || 'Consumidor Final'}
                  </b>
                  {detalleVenta.cliente?.dni && (
                    <span className="ml-2 text-xs text-gray-400">
                      DNI: {detalleVenta.cliente.dni}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm mb-3">
                <FaMapMarkerAlt className="text-emerald-300" />
                <span>
                  Local:{' '}
                  <b className="text-emerald-200">
                    {detalleVenta.locale?.nombre}
                  </b>
                </span>
              </div>

              {/* Medio de pago */}
              <div className="mb-4 flex gap-2 items-center">
                <FaMoneyBillAlt className="text-emerald-300" />
                <span>
                  Medio de pago:{' '}
                  <b className="text-emerald-300">
                    {detalleVenta.venta_medios_pago?.[0]?.medios_pago?.nombre ||
                      'Efectivo'}
                  </b>
                </span>
              </div>

              {/* Productos vendidos */}
              <div>
                <h4 className="text-lg font-bold mb-2 text-emerald-300 flex gap-2 items-center">
                  <FaBarcode /> Detalle productos
                </h4>
                <ul className="space-y-3 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400">
                  {detalleVenta.detalles.map((d) => {
                    const precioOriginal =
                      Number(d.stock.producto?.precio) ||
                      Number(d.precio_unitario);
                    const precioFinal = Number(d.precio_unitario);
                    const cantidad = d.cantidad;

                    return (
                      <li
                        key={d.id}
                        className="bg-emerald-900/10 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">
                            {d.stock.producto?.nombre || 'Producto'}
                          </span>
                          <span className="text-xs text-gray-400">
                            Talle: {d.stock.talle?.nombre || 'Sin talle'}
                            <span className="ml-2">
                              SKU: {d.stock.codigo_sku}
                            </span>
                          </span>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-emerald-200 font-bold">
                            x{cantidad}
                          </div>

                          {precioOriginal > precioFinal ? (
                            <>
                              <div className="line-through text-gray-400">
                                $
                                {Number(
                                  precioOriginal * cantidad
                                ).toLocaleString('es-AR')}
                              </div>
                              <div className="text-emerald-400 font-semibold text-base">
                                $
                                {Number(precioFinal * cantidad).toLocaleString(
                                  'es-AR'
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="text-emerald-400 font-semibold text-base">
                              $
                              {Number(precioFinal * cantidad).toLocaleString(
                                'es-AR'
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Descuentos aplicados */}
              {detalleVenta.descuentos?.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-lg font-bold mb-2 text-emerald-300 flex gap-2 items-center">
                    <FaPercentage /> Descuentos aplicados
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {detalleVenta.descuentos.map((d, i) => {
                      const esRecargo =
                        d.porcentaje > 0 &&
                        (d.tipo === 'medio_pago' || d.tipo === 'cuotas');
                      return (
                        <li
                          key={i}
                          className="flex justify-between border-b border-emerald-800 pb-1"
                        >
                          <span>
                            {d.tipo === 'producto' && '🛍️ '}
                            {d.tipo === 'medio_pago' && '💳 '}
                            {d.tipo === 'manual' && '✏️ '}
                            {d.tipo === 'cuotas' && '📆 '}
                            {d.detalle} ({esRecargo ? '+' : '-'}
                            {Number(d.porcentaje).toFixed(2)}%)
                          </span>
                          <span
                            className={`font-bold ${
                              esRecargo ? 'text-orange-400' : 'text-emerald-400'
                            }`}
                          >
                            {esRecargo ? '+ ' : '- '}$
                            {Math.abs(Number(d.monto)).toLocaleString('es-AR')}
                          </span>
                        </li>
                      );
                    })}
                    {detalleVenta.cuotas > 1 && (
                      <div>
                        📆 <b className="text-emerald-300">Financiación:</b>{' '}
                        {detalleVenta.cuotas} cuotas con recargo del{' '}
                        <span className="text-orange-400 font-bold">
                          {Number(
                            detalleVenta.porcentaje_recargo_cuotas
                          ).toFixed(2)}
                          %
                        </span>
                        <br />➤ Cada cuota:{' '}
                        <span className="text-white font-bold">
                          $
                          {Number(detalleVenta.monto_por_cuota).toLocaleString(
                            'es-AR'
                          )}
                        </span>
                        <br />➤ Recargo total por cuotas:{' '}
                        <span className="text-orange-400 font-bold">
                          +$
                          {Number(
                            detalleVenta.recargo_monto_cuotas
                          ).toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                  </ul>
                </div>
              )}

              {/* Totales */}
              <div className="mt-6 text-right">
                {detalleVenta.total_sin_descuentos > detalleVenta.total && (
                  <div className="text-sm text-gray-400 mb-1">
                    Precio original:{' '}
                    <span className="font-semibold text-white">
                      $
                      {Number(detalleVenta.total_sin_descuentos).toLocaleString(
                        'es-AR'
                      )}
                    </span>
                    <br />
                    <span className="text-emerald-300 text-sm font-semibold">
                      Descuento: $
                      {Number(
                        detalleVenta.total_sin_descuentos - detalleVenta.total
                      ).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
                <div className="text-2xl font-bold text-emerald-400 border-t pt-4 border-emerald-900">
                  Total: ${Number(detalleVenta.total).toLocaleString('es-AR')}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detalleCaja && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-50"
            key="detalle-caja-modal"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.19 }}
              className="bg-[#1a202d] p-8 rounded-3xl max-w-lg w-full shadow-2xl relative border border-emerald-600"
            >
              {/* Botón de cerrar */}
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-emerald-400 text-2xl transition-transform hover:scale-125"
                aria-label="Cerrar"
                onClick={() => setDetalleCaja(null)}
              >
                <FaTimesCircle />
              </button>

              {/* Header con badge */}
              <div className="flex items-center gap-4 mb-5">
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs shadow 
            ${
              detalleCaja.fecha_cierre
                ? 'bg-emerald-500/80 text-white'
                : 'bg-yellow-400/80 text-gray-900'
            }`}
                >
                  {detalleCaja.fecha_cierre ? 'CERRADA' : 'ABIERTA'}
                </span>
                <h3 className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2 drop-shadow">
                  <FaMoneyBillWave /> Caja #{detalleCaja.id}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 text-[15px]">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <FaStore className="text-emerald-400" />
                    <span>
                      <b>Local: </b>
                      <span className="text-gray-400">{infoLocal.nombre}</span>
                    </span>
                  </div>
                  <div className="flex gap-2 items-center text-gray-400 text-xs pl-6">
                    {infoLocal.direccion}
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <FaUser className="text-emerald-400" />
                    <span>
                      <b>Usuario:</b>{' '}
                      <span className="text-gray-400">
                        {getNombreUsuario(detalleCaja.usuario_id, usuarios)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <FaClock className="text-emerald-400" />
                    <span>
                      <b>Apertura:</b>
                      <br />
                      <span className="text-gray-100">
                        {new Date(detalleCaja.fecha_apertura).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <FaCalendarCheck className="text-emerald-400" />
                    <span>
                      <b>Cierre:</b>
                      <br />
                      {detalleCaja.fecha_cierre ? (
                        <span className="text-gray-100">
                          {new Date(detalleCaja.fecha_cierre).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-yellow-400">Sin cerrar</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6 mb-3">
                <div className="flex flex-col items-start">
                  <span className="flex gap-2 items-center text-lg font-bold text-emerald-400">
                    <FaMoneyBillWave /> Saldo inicial:
                  </span>
                  <span className="text-2xl font-black text-gray-100 tracking-wide">
                    {formatearPeso(detalleCaja.saldo_inicial)}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="flex gap-2 items-center text-lg font-bold text-emerald-400">
                    <FaMoneyBillWave /> Saldo final:
                  </span>
                  <span
                    className={`text-2xl font-black tracking-wide ${
                      detalleCaja.saldo_final
                        ? 'text-emerald-300'
                        : 'text-yellow-400'
                    }`}
                  >
                    {detalleCaja.saldo_final
                      ? formatearPeso(detalleCaja.saldo_final)
                      : 'Sin cerrar'}
                  </span>
                </div>
              </div>

              {/* Footer con botón */}
              <div className="mt-7 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="px-7 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-lg text-white transition shadow-lg shadow-emerald-800/10"
                  onClick={() => setDetalleCaja(null)}
                >
                  Cerrar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
