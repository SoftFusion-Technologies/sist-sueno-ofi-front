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

// --- Función para formatear teléfono:
function formatDisplayPhone(num) {
  // Saca todo lo que no es número
  let n = num.replace(/\D/g, '');

  // Si ya empieza con 54, asumimos formato internacional argentino
  if (n.length === 13 && n.startsWith('54')) {
    // +54 9 3863 41-4717
    return `+${n.slice(0, 2)} ${n[2]} ${n.slice(3, 7)} ${n.slice(
      7,
      9
    )}-${n.slice(9, 13)}`;
  }

  // +549...
  if (n.length === 12 && n.startsWith('549')) {
    return `+${n.slice(0, 2)} ${n[2]} ${n.slice(3, 7)} ${n.slice(
      7,
      9
    )}-${n.slice(9, 12)}`;
  }

  // 11 dígitos típico móvil Arg: 38653488333 → +54 9 3865 34-8833
  if (n.length === 11) {
    return `+54 9 ${n.slice(0, 4)} ${n.slice(4, 6)}-${n.slice(6, 10)}`;
  }

  // 10 dígitos típico fijo Arg: 3816583391 → +54 3816 58-3391
  if (n.length === 10) {
    return `+54 ${n.slice(0, 4)} ${n.slice(4, 6)}-${n.slice(6, 10)}`;
  }

  // 8 ó 7 dígitos, local corto
  if (n.length === 8) {
    return `${n.slice(0, 4)}-${n.slice(4, 8)}`;
  }
  if (n.length === 7) {
    return `${n.slice(0, 3)}-${n.slice(3, 7)}`;
  }

  // Si no, devolvé como está, pero podés agregarle prefijo si querés
  return num;
}

function TelCell({ telefono }) {
  const [copied, setCopied] = useState(false);

  // Lógica igual que antes
  const raw = telefono.replace(/\D/g, '');
  const link = `https://wa.me/${raw.startsWith('54') ? raw : '54' + raw}`;
  const display = formatDisplayPhone(telefono);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div className="flex items-center justify-center">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366] rounded-full px-4 py-2 font-bold text-emerald-200 hover:bg-[#25D366]/20 hover:text-white shadow-sm transition-all whitespace-nowrap"
        title="Enviar WhatsApp"
        style={{ fontSize: '1.1em', letterSpacing: '0.02em' }}
      >
        <FaWhatsapp className="text-[#25D366] text-xl mr-2" />
        <span className="font-bold tracking-wider">{display}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            copyToClipboard();
          }}
          className="ml-2 text-xs text-gray-400 hover:text-emerald-200 transition"
          title="Copiar número"
          tabIndex={-1}
        >
          {copied ? (
            <FaCheckCircle className="text-emerald-400 text-lg" />
          ) : (
            <FaRegCopy className="text-lg" />
          )}
        </button>
      </a>
    </div>
  );
}

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
      {/* Cards-table para desktop */}
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
                className="flex w-full min-h-[140px] bg-white/70 shadow-xl rounded-3xl border-l-8 transition-all border-emerald-500/80 hover:scale-[1.012] hover:shadow-2xl overflow-hidden"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                {/* Identidad */}
                <div className="flex flex-col justify-between items-start p-7 w-64 bg-gradient-to-br from-emerald-700/90 to-emerald-900/90 text-white">
                  <div>
                    <div className="text-xl font-extrabold flex items-center gap-2 drop-shadow-sm">
                      {c.nombre}
                      {c.pagado === 'SI' ? (
                        <span className="ml-2 flex items-center bg-emerald-200 text-emerald-900 rounded-full px-3 py-0.5 text-xs font-bold shadow animate-pulse">
                          <svg
                            className="w-4 h-4 mr-1 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Pagado
                        </span>
                      ) : (
                        <span className="ml-2 flex items-center bg-rose-500 text-white rounded-full px-3 py-0.5 text-xs font-bold shadow animate-pulse">
                          <svg
                            className="w-4 h-4 mr-1 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                          Pendiente
                        </span>
                      )}
                    </div>
                    <div className="mt-1 opacity-90 text-base">{c.email}</div>
                    <div className="flex items-center gap-2 mt-1 text-sm opacity-90">
                      {c.telefono}
                    </div>
                    <div className="text-xs text-emerald-200 mt-2">
                      <span className="opacity-80">DNI:</span> {c.dni}
                    </div>
                  </div>
                </div>

                {/* Detalle */}
                <div className="flex-1 grid grid-cols-4 gap-6 px-8 py-6 bg-white/80 backdrop-blur-lg text-gray-800 items-center text-sm">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold">
                      Fecha Alta
                    </div>
                    <div className="text-base mb-5">
                      {formatearFechaARG(c.fecha_alta)}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">
                      Fecha Última Compra
                    </div>
                    <div className="text-base">
                      {formatearFechaARG(c.fecha_ultima_compra)}
                    </div>
                  </div>
                </div>

                <button
                  className="text-red-500 mt-4 text-xs font-semibold hover:text-red-600 transition"
                  onClick={() => openDetalleCliente(c)}
                  title="Ver detalle del cliente"
                >
                  Ver detalle
                </button>

                {/* Acciones */}
                <div className="flex flex-col items-center justify-center px-6 gap-3 bg-white/60 backdrop-blur-xl">
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
      {/* Tarjetas para mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4 max-w-xl mx-auto mt-8">
        {filtered.length === 0 && (
          <div className="text-center text-emerald-200 py-12">
            No hay clientes para mostrar.
          </div>
        )}
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            className="bg-emerald-800/90 rounded-xl p-5 shadow-xl flex flex-col gap-2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-emerald-100">{c.nombre}</h3>
              <AdminActions
                onEdit={() => openModal(c)}
                onDelete={() => handleDelete(c.id)}
              />
              <button
                className="text-emerald-400 mt-4 text-xs font-semibold hover:text-emerald-300 transition"
                onClick={() => openDetalleCliente(c)}
                title="Ver detalle del cliente"
              >
                Ver detalle
              </button>
            </div>
            <div className="text-sm text-emerald-200/90">
              {c.email || 'Sin Email Agregado'}
            </div>

            <div className="text-sm text-emerald-200/90">
              {c.dni || 'Sin DNI Agregado'}
            </div>

            <div className="text-sm text-emerald-200/90">
              {c.direccion || 'Sin Dirección Agregada'}
            </div>
            <div className="text-sm text-emerald-300">
              Tel:{' '}
              {c.telefono ? (
                <a
                  href={`https://wa.me/${formatWhatsappNumber(c.telefono)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline hover:text-emerald-400 transition cursor-pointer"
                  title="Enviar WhatsApp"
                >
                  {formatDisplayPhone(c.telefono)}
                  <FaWhatsapp className="ml-1 text-green-500" />
                </a>
              ) : (
                '-'
              )}
            </div>

            <div className="text-xs text-emerald-400 mt-1">
              Última compra:{' '}
              {c.fecha_ultima_compra ? (
                new Date(c.fecha_ultima_compra).toLocaleDateString()
              ) : (
                <span className="italic text-emerald-200/60">Nunca</span>
              )}
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
      ;
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
