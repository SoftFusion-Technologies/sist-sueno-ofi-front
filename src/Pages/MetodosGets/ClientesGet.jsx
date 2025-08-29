import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import {
  FaUserFriends,
  FaPlus,
  FaWhatsapp,
  FaTimes,
  FaUserAlt,
  FaShoppingCart,
  FaPhoneAlt,
  FaIdCard,
  FaHome,
  FaEnvelope,
  FaStore,
  FaUserTie,
  FaCalendarAlt,
  FaCreditCard,
  FaCheckCircle,
  FaMoneyBillWave,
  FaRegCopy
} from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack';
import AdminActions from '../../Components/AdminActions';
import { ModalFeedback } from '../../Pages/Ventas/Config/ModalFeedback.jsx';
import {
  fetchLocales,
  fetchUsuarios,
  getNombreLocal
} from '../../utils/utils.js';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import formatearFechaARG from '../../Components/formatearFechaARG';
import { useAuth } from '../../AuthContext.jsx';
Modal.setAppElement('#root');

const displayPhone = (raw = '') =>
  raw
    .replace(/[^\d]/g, '')
    .replace(/^0+/, '')
    .replace(/(\d{2,4})(\d{6,8})/, '$1-$2');

const toWhatsAppNumber = (raw = '') => {
  // Normaliza a AR: +54 + número sin 0/15
  let n = raw.replace(/[^\d]/g, '');
  n = n.replace(/^0+/, '').replace(/^15/, ''); // quita 0/15
  return `54${n}`; // sin "+"
};

const mapsLink = (addr = '') =>
  addr
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        addr
      )}`
    : '#';

const safe = (v, fallback = '—') => (v && String(v).trim() ? v : fallback);

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
};

const initials = (name = '') =>
  name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const abreviar = (txt, len = 54) =>
  txt && txt.length > len ? txt.slice(0, len - 1) + '…' : txt || '—';

const copiar = async (valor) => {
  try {
    await navigator.clipboard.writeText(valor);
  } catch {}
};

export default function ClientesGet() {
  const { userId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    dni: ''
  });

  const [modalFeedbackOpen, setModalFeedbackOpen] = React.useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = React.useState('');
  const [modalFeedbackType, setModalFeedbackType] = React.useState('info'); // 'success', 'error', 'info'

  // Filtro avanzado: por nombre, teléfono, email o fecha de última compra
  const [fechaFiltro, setFechaFiltro] = useState('');

  const fetchClientes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const openModal = (cliente = null) => {
    if (cliente) {
      setEditId(cliente.id);
      setFormData({
        nombre: cliente.nombre || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        dni: cliente.dni || ''
      });
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        dni: ''
      });
    }
    setModalOpen(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // 👇 Enviar usuario_log_id también en UPDATE
        await axios.put(`http://localhost:8080/clientes/${editId}`, {
          ...formData,
          usuario_log_id: userId
        });
        setModalFeedbackMsg('Cliente actualizado correctamente');
        setModalFeedbackType('success');
      } else {
        // 👇 Enviar usuario_log_id también en CREATE
        await axios.post('http://localhost:8080/clientes', {
          ...formData,
          usuario_log_id: userId
        });
        setModalFeedbackMsg('Cliente creado correctamente');
        setModalFeedbackType('success');
      }
      fetchClientes();
      setModalOpen(false);
      setModalFeedbackOpen(true);
    } catch (err) {
      setModalFeedbackMsg(
        err.response?.data?.mensajeError || 'Error al guardar cliente'
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este cliente?')) return;

    try {
      // 👇 En axios.delete el body va en la clave "data" del config
      await axios.delete(`http://localhost:8080/clientes/${id}`, {
        data: { usuario_log_id: userId }
      });

      fetchClientes();
      setModalFeedbackMsg('Cliente eliminado correctamente');
      setModalFeedbackType('success');
    } catch (err) {
      const mensaje =
        err.response?.data?.mensajeError || 'Error al eliminar cliente';
      setModalFeedbackMsg(mensaje);
      setModalFeedbackType('error');
    }
    setModalFeedbackOpen(true);
  };

  const filtered = clientes.filter((c) => {
    const text = [c.nombre, c.telefono, c.email, c.direccion, c.dni]
      .join(' ')
      .toLowerCase();
    const filtroFecha = fechaFiltro
      ? (c.fecha_ultima_compra || '').slice(0, 10) === fechaFiltro
      : true;
    return text.includes(search.toLowerCase()) && filtroFecha;
  });

  // Convierte teléfono "3865417665" o similar en "5493865417665" para WhatsApp link (Argentina)
  function formatWhatsappNumber(phone) {
    // Elimina cualquier caracter no numérico
    let num = phone.replace(/\D/g, '');

    // Si empieza con 0, lo quitamos
    if (num.startsWith('0')) num = num.substring(1);

    // Si empieza con 54, asumimos que ya es nacional
    if (!num.startsWith('54')) num = '54' + num;

    // Si no tiene el "9" (para WhatsApp móvil Argentina), se lo agregamos luego de "54"
    if (num.startsWith('549')) return num;
    if (num.startsWith('54') && num[2] !== '9') return '549' + num.substring(2);

    return num;
  }

  // Formatea visualmente el teléfono para mostrarlo (+54 9 xxxx xxx xxx)
  function formatDisplayPhone(phone) {
    let num = phone.replace(/\D/g, '');

    if (num.startsWith('0')) num = num.substring(1);
    if (!num.startsWith('54')) num = '54' + num;
    if (!num.startsWith('549')) num = '549' + num.substring(2);

    // Ejemplo: 5493865417665 → +54 9 3865 41-7665
    return `+${num.slice(0, 2)} ${num.slice(2, 3)} ${num.slice(
      3,
      7
    )} ${num.slice(7, 9)}-${num.slice(9)}`;
  }

  const [detalleCliente, setDetalleCliente] = useState(null);

  const openDetalleCliente = (cliente) => {
    fetch(`http://localhost:8080/clientes/${cliente.id}/ventas`)
      .then((res) => res.json())
      .then((ventas) => setDetalleCliente({ ...cliente, ventas }))
      .catch(() => setDetalleCliente({ ...cliente, ventas: [] }));
  };

  const [detalleVenta, setDetalleVenta] = useState(null);

  const fetchDetalleVenta = (ventaId) => {
    fetch(`http://localhost:8080/ventas/${ventaId}/detalle`)
      .then((res) => res.json())
      .then((data) => setDetalleVenta(data))
      .catch(() => setDetalleVenta(null));
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-900 py-10 px-3 md:px-6 relative font-sans">
      <ParticlesBackground></ParticlesBackground>
      <ButtonBack />
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold flex items-center gap-3 drop-shadow-xl text-white uppercase titulo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FaUserFriends className="text-emerald-400 drop-shadow-lg" />
            Gestión de Clientes
          </motion.h1>
          <motion.button
            onClick={() => openModal()}
            className="text-white bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-colors active:scale-95"
            whileHover={{ scale: 1.05 }}
          >
            <FaPlus /> Nuevo Cliente
          </motion.button>
        </div>
        {/* Filtros */}
        <div className="w-full bg-white/10 p-5 rounded-2xl shadow-md mb-6 backdrop-blur-lg">
          <h2 className="text-emerald-200 text-lg font-semibold mb-4">
            Filtros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-emerald-200 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nombre, teléfono, email, dirección, DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
            </div>
            <div>
              <label className="block text-sm text-emerald-200 mb-1">
                Fecha última compra
              </label>
              <input
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-emerald-950 text-white border border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/80"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Cards-table para desktop (refactor UX) */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 gap-4 max-w-6xl mx-auto mt-6">
          {filtered.length === 0 ? (
            <div className="text-center text-emerald-200 py-12 rounded-2xl bg-white/5 shadow-xl">
              No hay clientes para mostrar.
            </div>
          ) : (
            filtered.map((c) => (
              <motion.div
                key={c.id}
                className="flex w-full min-h-[140px] rounded-3xl overflow-hidden bg-white/80 shadow-xl border border-emerald-100 hover:shadow-emerald-200/60 transition-all hover:scale-[1.01]"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
              >
                {/* Columna izquierda: identidad */}
                <div className="flex flex-col justify-center items-start gap-3 p-7 w-72 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center font-extrabold shadow-inner">
                      {initials(c.nombre)}
                    </div>
                    <div>
                      <div className="text-lg font-extrabold leading-tight">
                        {c.nombre || '—'}
                      </div>
                      <div className="opacity-90 text-sm">
                        {c.email || 'sin email'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <button
                      className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-white/95"
                      title="Llamar"
                      onClick={() =>
                        c.telefono
                          ? (window.location.href = `tel:${c.telefono}`)
                          : null
                      }
                    >
                      {c.telefono || 'sin teléfono'}
                    </button>
                    {c.telefono && (
                      <button
                        onClick={() => copiar(c.telefono)}
                        className="text-xs px-2 py-0.5 rounded-md bg-black/20 hover:bg-black/30"
                        title="Copiar teléfono"
                      >
                        Copiar
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-emerald-200">
                    <span className="opacity-80">DNI:</span>{' '}
                    <button
                      className="underline decoration-dotted underline-offset-4 hover:text-white transition"
                      onClick={() => c.dni && copiar(c.dni)}
                      title="Copiar DNI"
                    >
                      {c.dni || '—'}
                    </button>
                  </div>
                </div>

                {/* Centro: datos */}
                <div className="flex-1 grid grid-cols-3 gap-6 px-8 py-6 bg-white/80 backdrop-blur-lg text-gray-800 items-center text-sm">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">
                      Dirección
                    </div>
                    <div className="text-base">{abreviar(c.direccion, 64)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">
                      Fecha Alta
                    </div>
                    <div className="text-base">
                      {formatearFechaARG(c.fecha_alta)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">
                      Última Compra
                    </div>
                    <div className="text-base">
                      {formatearFechaARG(c.fecha_ultima_compra)}
                    </div>
                  </div>
                </div>

                {/* Derecha: acciones */}
                <div className="flex flex-col items-center justify-center px-6 gap-2 bg-white/70 backdrop-blur-xl">
                  <button
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-sm px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 transition"
                    onClick={() => openDetalleCliente(c)}
                    title="Ver detalle del cliente"
                  >
                    Ver detalle
                  </button>
                  <div className="h-3" />
                  <AdminActions
                    onEdit={() => openModal(c)}
                    onDelete={() => handleDelete(c.id)}
                  />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
       {/* === Tarjetas para mobile (UX 200%) === */}
      <div className="md:hidden grid grid-cols-1 gap-4 max-w-xl mx-auto mt-8">
        {filtered.length === 0 && (
          <div className="text-center text-emerald-200 py-10 rounded-2xl bg-white/5 shadow-lg">
            No hay clientes para mostrar.
          </div>
        )}

        {filtered.map((c, idx) => (
          <motion.div
            key={c.id}
            className="rounded-2xl p-4 shadow-xl bg-gradient-to-br from-[#14221b] via-[#0f1b16] to-[#0c1713] border border-emerald-900/30"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, delay: idx * 0.03 }}
          >
            {/* Header: avatar + nombre + acciones admin */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-100 flex items-center justify-center font-extrabold ring-1 ring-emerald-400/30 shadow-inner">
                  {initials(c.nombre)}
                </div>
                <div className="leading-tight">
                  <div className="text-emerald-100 font-extrabold text-base">
                    {safe(c.nombre)}
                  </div>
                  <div className="text-emerald-300/80 text-xs">
                    DNI: {safe(c.dni)}
                  </div>
                </div>
              </div>

              <div className="-mr-1">
                <AdminActions
                  onEdit={() => openModal(c)}
                  onDelete={() => handleDelete(c.id)}
                />
              </div>
            </div>

            {/* Datos principales */}
            <div className="mt-3 space-y-2 text-sm">
              {/* Email */}
              <div className="text-emerald-200/90">
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="underline decoration-dotted underline-offset-4 hover:text-emerald-300"
                  >
                    {c.email}
                  </a>
                ) : (
                  <span className="italic text-emerald-200/60">Sin email</span>
                )}
              </div>

              {/* Teléfono */}
              <div className="text-emerald-200/90">
                Tel:{' '}
                {c.telefono ? (
                  <a
                    href={`tel:${c.telefono}`}
                    className="font-semibold hover:text-emerald-300"
                  >
                    {displayPhone(c.telefono)}
                  </a>
                ) : (
                  <span className="italic text-emerald-200/60">
                    Sin teléfono
                  </span>
                )}
              </div>

              {/* Dirección */}
              <div className="text-emerald-200/90">
                {c.direccion ? (
                  <a
                    href={mapsLink(c.direccion)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block leading-snug hover:text-emerald-300"
                    title="Ver en Google Maps"
                  >
                    {c.direccion}
                  </a>
                ) : (
                  <span className="italic text-emerald-200/60">
                    Sin dirección
                  </span>
                )}
              </div>

              {/* Última compra */}
              <div className="text-xs text-emerald-400/90 mt-1">
                Última compra:{' '}
                {c.fecha_ultima_compra ? (
                  formatearFechaARG(c.fecha_ultima_compra)
                ) : (
                  <span className="italic text-emerald-200/60">Nunca</span>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  c.telefono && (window.location.href = `tel:${c.telefono}`)
                }
                className="px-2 py-2 rounded-xl bg-white/10 text-emerald-200 hover:bg-white/15 active:scale-[0.98] text-xs font-semibold"
              >
                Llamar
              </button>
              <button
                type="button"
                onClick={() =>
                  c.telefono &&
                  window.open(
                    `https://wa.me/${toWhatsAppNumber(c.telefono)}`,
                    '_blank'
                  )
                }
                className="px-2 py-2 rounded-xl bg-white/10 text-emerald-200 hover:bg-white/15 active:scale-[0.98] text-xs font-semibold"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() =>
                  c.email && (window.location.href = `mailto:${c.email}`)
                }
                className="px-2 py-2 rounded-xl bg-white/10 text-emerald-200 hover:bg-white/15 active:scale-[0.98] text-xs font-semibold"
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => c.dni && copyToClipboard(c.dni)}
                className="px-2 py-2 rounded-xl bg-white/10 text-emerald-200 hover:bg-white/15 active:scale-[0.98] text-xs font-semibold"
              >
                Copiar DNI
              </button>
            </div>

            {/* Footer: CTA detalle */}
            <div className="mt-4">
              <button
                className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow shadow-emerald-900/20 transition"
                onClick={() => openDetalleCliente(c)}
                title="Ver detalle del cliente"
              >
                Ver detalle
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal
            isOpen={modalOpen}
            onRequestClose={() => setModalOpen(false)}
            overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-emerald-500"
            closeTimeoutMS={300}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-emerald-600">
                {editId ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <input
                  type="text"
                  placeholder="DNI"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({ ...formData, dni: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-emerald-200"
                />
                <div className="text-right">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 text-white font-medium rounded-lg"
                  >
                    {editId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detalleCliente && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="bg-gradient-to-br from-[#1e242f]/90 via-[#1a222c] to-[#171b24] rounded-3xl max-w-2xl w-full shadow-2xl p-8 border border-emerald-500 relative ring-emerald-500 ring-1 ring-opacity-20"
            >
              {/* Cerrar */}
              <button
                className="absolute top-4 right-5 text-gray-400 hover:text-emerald-400 text-2xl transition-all"
                onClick={() => setDetalleCliente(null)}
              >
                <FaTimes />
              </button>

              {/* Header Cliente */}
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-emerald-600/30 rounded-full p-3 text-2xl text-emerald-300 shadow-lg">
                  <FaUserAlt />
                </div>
                <div>
                  <div className="text-xl font-black text-emerald-300 tracking-wide flex items-center gap-2">
                    Cliente:
                    <span className="text-white drop-shadow">
                      {detalleCliente.nombre}
                    </span>
                    {detalleCliente.vip && (
                      <span className="ml-2 bg-yellow-400/80 text-gray-900 text-xs px-2 py-0.5 rounded-full font-bold shadow">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    {detalleCliente.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <FaPhoneAlt /> {detalleCliente.telefono}
                      </span>
                    )}
                    {detalleCliente.email && (
                      <span className="inline-flex items-center gap-1">
                        <FaEnvelope /> {detalleCliente.email}
                      </span>
                    )}
                    {detalleCliente.dni && (
                      <span className="inline-flex items-center gap-1">
                        <FaIdCard /> {detalleCliente.dni}
                      </span>
                    )}
                    {detalleCliente.direccion && (
                      <span className="inline-flex items-center gap-1">
                        <FaHome /> {detalleCliente.direccion}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <FaCheckCircle className="text-emerald-400" />
                <span className="text-xs text-gray-200">
                  Última compra:&nbsp;
                  {detalleCliente.fecha_ultima_compra ? (
                    <b className="text-white">
                      {new Date(
                        detalleCliente.fecha_ultima_compra
                      ).toLocaleDateString()}
                    </b>
                  ) : (
                    <span className="italic text-emerald-200/80">Nunca</span>
                  )}
                </span>
              </div>

              {/* Historial de compras */}
              <h3 className="font-bold text-lg text-emerald-400 mb-2 mt-4 flex items-center gap-2">
                <FaShoppingCart /> Historial de compras
              </h3>
              <ul className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar mb-2">
                {detalleCliente.ventas && detalleCliente.ventas.length > 0 ? (
                  detalleCliente.ventas.map((venta) => (
                    <li
                      key={venta.id}
                      className="flex flex-col md:flex-row md:justify-between md:items-center gap-1 bg-emerald-950/60 px-4 py-3 rounded-xl shadow group hover:shadow-lg hover:bg-emerald-800/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-200 tracking-wide">
                          #{venta.id}
                        </span>
                        <span className="text-xs text-emerald-300 flex items-center gap-1">
                          <FaCalendarAlt />{' '}
                          {new Date(venta.fecha).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-300 ml-2">
                          Total:{' '}
                          <span className="font-bold text-emerald-200">
                            ${Number(venta.total).toLocaleString('es-AR')}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 md:mt-0">
                        <button
                          onClick={() => fetchDetalleVenta(venta.id)}
                          className="text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-700/80 transition-all shadow"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-200 text-center py-4">
                    Sin compras registradas.
                  </li>
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}

        {/* MODAL DETALLE VENTA */}
        {detalleVenta && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 35, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 25, opacity: 0 }}
              className="bg-gradient-to-br from-[#262b39]/90 via-[#232631] to-[#202331]/90 p-8 rounded-3xl max-w-2xl w-full shadow-2xl border border-emerald-500 relative"
            >
              <button
                className="absolute top-4 right-5 text-gray-400 hover:text-emerald-400 text-2xl transition-all"
                onClick={() => setDetalleVenta(null)}
              >
                <FaTimes />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <FaShoppingCart className="text-emerald-400 text-2xl" />
                <h3 className="text-xl font-black text-emerald-400 tracking-tight">
                  Detalle Venta #{detalleVenta.id}
                </h3>
              </div>
              <div className="mb-3 text-sm text-gray-300 space-y-1">
                <div>
                  <b>Cliente:</b>{' '}
                  <span className="text-white">
                    {detalleVenta.cliente?.nombre || 'Consumidor Final'}
                  </span>
                  {detalleVenta.cliente?.dni && (
                    <span className="ml-2 text-xs text-gray-400">
                      DNI: {detalleVenta.cliente.dni}
                    </span>
                  )}
                </div>
                <div>
                  <b>Fecha:</b> {new Date(detalleVenta.fecha).toLocaleString()}
                </div>
                <div>
                  <b>Medio de pago:</b>{' '}
                  <span className="inline-flex items-center gap-1">
                    <FaCreditCard className="text-emerald-300" />
                    <b>
                      {detalleVenta.venta_medios_pago?.[0]?.medios_pago
                        ?.nombre || 'Efectivo'}
                    </b>
                  </span>
                </div>
                <div>
                  <b>Vendedor:</b>{' '}
                  <span className="text-emerald-200">
                    {detalleVenta.usuario?.nombre || '-'}
                  </span>
                </div>
                <div>
                  <b>Local:</b>{' '}
                  <span className="text-emerald-200">
                    {getNombreLocal(
                      detalleVenta.usuario?.local_id || '-',
                      locales
                    )}
                  </span>
                </div>
              </div>
              <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar mb-3 mt-3">
                {detalleVenta.detalles?.map((d) => (
                  <li
                    key={d.id}
                    className="flex justify-between items-center px-3 py-2 bg-emerald-900/10 rounded-lg"
                  >
                    <span className="text-white">
                      {d.stock.producto.nombre}
                      {d.stock.talle && (
                        <span className="text-gray-400 ml-2">
                          Talle: {d.stock.talle.nombre}
                        </span>
                      )}
                      {d.stock.codigo_sku && (
                        <span className="ml-2 text-xs text-emerald-300">
                          SKU: {d.stock.codigo_sku}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">x{d.cantidad}</span>
                    <span className="font-bold text-emerald-300">
                      $
                      {Number(d.precio_unitario * d.cantidad).toLocaleString(
                        'es-AR'
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="text-right text-lg text-white font-black mt-4">
                <FaMoneyBillWave className="inline-block mr-2 text-emerald-400" />
                Total:{' '}
                <span className="text-emerald-200">
                  ${Number(detalleVenta.total).toLocaleString('es-AR')}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ModalFeedback
        open={modalFeedbackOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
        type={modalFeedbackType}
      />
    </div>
  );
}
