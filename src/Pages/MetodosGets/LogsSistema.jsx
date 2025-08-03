import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import {
  FaSearch,
  FaUndo,
  FaFilter,
  FaTimes,
  FaUserShield,
  FaCalendarAlt,
  FaCodeBranch
} from 'react-icons/fa';

import axiosWithAuth from '../../utils/axiosWithAuth';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';

const LogsSistema = () => {
  const [logs, setLogs] = useState([]);
  const [filtro, setFiltro] = useState({
    q: '',
    desde: '',
    hasta: '',
    accion: '',
    modulo: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const acciones = ['crear', 'editar', 'eliminar'];
  const modulos = ['usuarios', 'ventas', 'clientes', 'productos', 'locales'];

  const fetchLogs = async () => {
    try {
      const params = {};
      if (filtro.q) params.q = filtro.q;
      if (filtro.desde) params.fecha_inicio = filtro.desde;
      if (filtro.hasta) params.fecha_fin = filtro.hasta;
      if (filtro.accion) params.accion = filtro.accion;
      if (filtro.modulo) params.modulo = filtro.modulo;

      const res = await axiosWithAuth().get('/logs', { params });
      setLogs(res.data);
    } catch (error) {
      console.error('Error al obtener logs:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filtro]);

  const handleChange = (e) => {
    setFiltro({ ...filtro, [e.target.name]: e.target.value });
  };

  const resetFiltros = () => {
    setFiltro({ q: '', desde: '', hasta: '', accion: '', modulo: '' });
    fetchLogs();
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#000000] py-12 px-6 text-white relative font-sans">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl titulo uppercase font-extrabold text-white flex items-center gap-3 drop-shadow-xl">
            <FaFilter className="text-indigo-400" /> Auditoría del Sistema
          </h1>
        </div>

        {/* FILTROS */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 bg-white/10 p-6 rounded-3xl shadow-2xl mb-10 border border-white/20 backdrop-blur"
          whileHover={{ scale: 1.01 }}
        >
          <input
            type="text"
            name="q"
            placeholder="🔎 Usuario..."
            value={filtro.q}
            onChange={handleChange}
            className="col-span-2 bg-white/20 border border-white/30 text-white placeholder-white/60 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="date"
            name="desde"
            value={filtro.desde}
            onChange={handleChange}
            className="bg-white/20 border border-white/30 text-white p-3 rounded-xl focus:outline-none"
          />

          <input
            type="date"
            name="hasta"
            value={filtro.hasta}
            onChange={handleChange}
            className="bg-white/20 border border-white/30 text-white p-3 rounded-xl focus:outline-none"
          />

          <select
            name="accion"
            value={filtro.accion}
            onChange={handleChange}
            className="bg-white/20 border border-white/30 text-black p-3 rounded-xl focus:outline-none"
          >
            <option value="">Acción</option>
            {acciones.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>

          <select
            name="modulo"
            value={filtro.modulo}
            onChange={handleChange}
            className="bg-white/20 border border-white/30 text-black p-3 rounded-xl focus:outline-none"
          >
            <option value="">Módulo</option>
            {modulos.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>

          <div className="flex gap-2 col-span-2 md:col-span-1">
            <button
              onClick={fetchLogs}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-3 flex items-center justify-center gap-2 w-full transition-all"
            >
              <FaSearch /> Buscar
            </button>
            <button
              onClick={resetFiltros}
              className="bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl px-4 py-3 flex items-center justify-center gap-2 w-full transition-all"
            >
              <FaUndo /> Limpiar
            </button>
          </div>
        </motion.div>

        {/* TABLA */}
        <div className="overflow-x-auto rounded-3xl border border-white/20 shadow-2xl backdrop-blur">
          <table className="min-w-full bg-white/5 text-sm text-white">
            <thead className="bg-white/10 text-white/90 text-left">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Acción</th>
                <th className="p-4">Módulo</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-center">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <tr
                    key={log.id}
                    onClick={() => handleRowClick(log)}
                    className="border-t cursor-pointer border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="p-4 font-mono text-indigo-300">{log.id}</td>
                    <td className="p-4 font-semibold text-white/90">
                      {log.usuario?.nombre}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          log.accion === 'crear'
                            ? 'bg-green-500/20 text-green-300'
                            : log.accion === 'editar'
                            ? 'bg-yellow-400/20 text-yellow-200'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-4 capitalize text-white/80">
                      {log.modulo}
                    </td>
                    <td
                      className="p-4 max-w-[320px] truncate text-white/70"
                      title={log.descripcion}
                    >
                      {log.descripcion}
                    </td>
                    <td className="p-4 text-white/60">
                      {dayjs(log.fecha_hora).format('DD/MM/YYYY HH:mm')}
                    </td>
                    <td className="p-4 text-center text-white/60">{log.ip}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-white/50">
                    No se encontraron logs con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* MODAL DETALLE */}
      <AnimatePresence>
        {showModal && selectedLog && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-blue-800 rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.4)] w-full max-w-2xl p-8 relative text-white"
            >
              {/* Botón cerrar */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/70 hover:text-red-400 transition-all"
              >
                <FaTimes size={24} />
              </button>

              {/* Título */}
              <h2 className="text-3xl titulo uppercase font-extrabold text-white mb-6 flex items-center gap-3 border-b border-white/20 pb-4 drop-shadow-lg">
                <FaUserShield className="text-blue-400" />
                Detalle Completo del Log
              </h2>

              {/* Contenido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    ID
                  </span>
                  <span className="font-semibold">{selectedLog.id}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Usuario
                  </span>
                  <span className="font-semibold">
                    {selectedLog.usuario?.nombre}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Email
                  </span>
                  <span>{selectedLog.usuario?.email}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Acción
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize w-fit shadow-md ${
                      selectedLog.accion === 'crear'
                        ? 'bg-green-600/80 text-white'
                        : selectedLog.accion === 'editar'
                        ? 'bg-yellow-500/80 text-white'
                        : 'bg-red-600/80 text-white'
                    }`}
                  >
                    {selectedLog.accion}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Módulo
                  </span>
                  <span className="capitalize">{selectedLog.modulo}</span>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Descripción
                  </span>
                  <div className="bg-blue-900/50 p-4 rounded-xl border border-blue-600 text-white/90 leading-relaxed shadow-inner">
                    {selectedLog.descripcion}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    Fecha
                  </span>
                  <span>
                    {dayjs(selectedLog.fecha_hora).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs uppercase text-blue-300 mb-1">
                    IP
                  </span>
                  <span>{selectedLog.ip}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogsSistema;
