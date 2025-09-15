import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaUser, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
import { useAuth } from '../../AuthContext';
import axiosWithAuth from '../../utils/axiosWithAuth';
import { getUserId } from '../../utils/authUtils';
import PasswordEditor from '../../Security/PasswordEditor';
import Swal from 'sweetalert2';

Modal.setAppElement('#root');

export default function UsuariosGet() {
  const [usuarios, setUsuarios] = useState([]);
  const [locales, setLocales] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'socio',
    local_id: '',
    es_reemplazante: false // nuevo campo
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(true);

  // helpers
  const allowedRoles = ['socio', 'administrativo', 'vendedor', 'contador'];
  const passPolicyOk = (pwd) => {
    if (!pwd || pwd.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /\d/.test(pwd);
    const hasSym = /[^A-Za-z0-9]/.test(pwd);
    // mínimo: 8 y al menos 3 tipos
    const score = [hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;
    return score >= 3;
  };

  const usuarioId = getUserId();
  // RELACION AL FILTRADO BENJAMIN ORELLANA 24-04-25
  const [rolFiltro, setRolFiltro] = useState('todos');
  const [localFiltro, setLocalFiltro] = useState('todos');
  // RELACION AL FILTRADO BENJAMIN ORELLANA 24-04-25

  const fetchUsuarios = async () => {
    try {
      const res = await axiosWithAuth().get('/usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error(
        'Error al obtener usuarios:',
        error.response?.data || error.message
      );
    }
  };

  const fetchLocales = async () => {
    try {
      const res = await axios.get('http://localhost:8080/locales');
      setLocales(res.data);
    } catch (error) {
      console.error('Error al obtener locales:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchLocales();
  }, []);

  const openModal = (usuario = null) => {
    if (usuario) {
      setEditId(usuario.id);
      setFormData({
        nombre: usuario.nombre,
        email: usuario.email,
        password: '',
        rol: usuario.rol,
        local_id: usuario.local_id || '',
        es_reemplazante: !!usuario.es_reemplazante //  nuevo campo
      });
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'socio',
        local_id: '',
        es_reemplazante: false // nuevo campo
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const client = axiosWithAuth();

      // Saneo rol por si acaso
      let rol = formData.rol;
      if (!allowedRoles.includes(rol)) rol = 'socio';

      const payload = {
        ...formData,
        rol,
        usuario_log_id: usuarioId,
        local_id: formData.local_id ? Number(formData.local_id) : null,
        es_reemplazante: !!formData.es_reemplazante
      };

      // Validaciones con SweetAlert2
      if (!formData.nombre.trim()) {
        await Swal.fire('FALTAN DATOS', 'El nombre es obligatorio.', 'warning');
        return;
      }
      if (!formData.email.trim()) {
        await Swal.fire('FALTAN DATOS', 'El email es obligatorio.', 'warning');
        return;
      }

      if (editId) {
        // EDICIÓN
        if (!payload.password) {
          delete payload.password; // no tocar pass
        } else {
          // Si quiere cambiar pass: validar política
          if (!passPolicyOk(payload.password)) {
            await Swal.fire(
              'CONTRASEÑA DÉBIL',
              'Usá al menos 8 caracteres y combina mayúsculas, minúsculas, números y símbolos.',
              'error'
            );
            return;
          }
        }

        await client.put(`/usuarios/${editId}`, payload);
        await Swal.fire(
          'ACTUALIZADO',
          'Usuario actualizado correctamente',
          'success'
        );
      } else {
        // ALTA
        if (!payload.password) {
          await Swal.fire(
            'FALTAN DATOS',
            'La contraseña es obligatoria para crear el usuario.',
            'warning'
          );
          return;
        }
        if (!passwordValid || payload.password !== confirmPassword) {
          await Swal.fire(
            'REVISÁ LA CONTRASEÑA',
            'Las contraseñas no coinciden.',
            'error'
          );
          return;
        }
        if (!passPolicyOk(payload.password)) {
          await Swal.fire(
            'CONTRASEÑA DÉBIl',
            'Usá al menos 8 caracteres y combina mayúsculas, minúsculas, números y símbolos.',
            'error'
          );
          return;
        }

        await client.post('/usuarios', payload);
        await Swal.fire('CREADO', 'Usuario creado correctamente', 'success');
      }

      fetchUsuarios();
      setModalOpen(false);
      // limpiar confirm al cerrar
      setConfirmPassword('');
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      await Swal.fire(
        'ERROR',
        err?.response?.data?.mensajeError || 'Ocurrió un error al guardar.',
        'error'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      const client = axiosWithAuth();
      await client.delete(`/usuarios/${id}`, {
        data: { usuario_log_id: usuarioId }
      });
      fetchUsuarios();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
    }
  };

  const filtered = usuarios.filter((u) => {
    const coincideTexto = [u.nombre, u.email, u.rol].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    );

    const coincideRol = rolFiltro === 'todos' || u.rol === rolFiltro;
    const coincideLocal =
      localFiltro === 'todos' || u.local_id === parseInt(localFiltro);

    return coincideTexto && coincideRol && coincideLocal;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#000000] py-12 px-6 text-white relative font-sans">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl titulo uppercase font-extrabold text-white flex items-center gap-3 drop-shadow-xl">
            <FaUser className="text-indigo-400" /> Gestión de Usuarios
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-md"
          >
            <FaPlus /> Nuevo Usuario
          </button>
        </div>

        <div className="w-full bg-gray-900 p-4 rounded-xl shadow-md mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de texto */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, email o rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/80"
              />
            </div>

            {/* Filtro por rol */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rol</label>
              <select
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/80"
              >
                <option value="todos">Todos</option>
                <option value="socio">Socio</option>
                <option value="administrativo">Administrativo</option>
                <option value="vendedor">Vendedor</option>
                <option value="contador">Contador</option>
              </select>
            </div>

            {/* Filtro por local */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Local</label>
              <select
                value={localFiltro}
                onChange={(e) => setLocalFiltro(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/80"
              >
                <option value="todos">Todos</option>
                {locales.map((local) => (
                  <option key={local.id} value={local.id}>
                    {local.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-auto rounded-2xl shadow-xl bg-white/5 backdrop-blur-sm">
          <table className="w-full text-sm text-left text-white">
            <thead className="uppercase bg-indigo-600/80">
              <tr className="text-sm text-white">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Local</th>
                <th className="px-6 py-4">Reemplazante</th> {/* nuevo */}
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-white/10 hover:bg-white/10 transition"
                >
                  <td className="px-6 py-3 font-medium text-white/90">
                    {u.nombre}
                  </td>
                  <td className="px-6 py-3 text-white/80">{u.email}</td>
                  <td className="px-6 py-3 capitalize text-white/80">
                    {u.rol}
                  </td>
                  <td className="px-6 py-3 text-white/80">
                    {locales.find((l) => l.id === u.local_id)?.nombre || '-'}
                  </td>
                  {/*  pill */}
                  <td className="px-6 py-3">
                    <div className="flex justify-center">
                      {u.es_reemplazante ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{' '}
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />{' '}
                          No
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3 text-center flex justify-center gap-4">
                    <button
                      onClick={() => openModal(u)}
                      className="text-yellow-400 hover:text-yellow-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-indigo-500"
        >
          <h2 className="uppercase text-2xl font-bold mb-4 text-indigo-600">
            {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
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
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
            {/* ANTES
            {!editId && (
              <input
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            )} */}

            <PasswordEditor
              value={formData.password}
              onChange={(val) => setFormData({ ...formData, password: val })}
              showConfirm={!editId} // confirma SOLO en alta
              confirmValue={confirmPassword}
              onConfirmChange={setConfirmPassword}
              onValidityChange={setPasswordValid} // 👈 opcional (match/mismatch)
            />

            <select
              value={formData.rol}
              onChange={(e) =>
                setFormData({ ...formData, rol: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              required
            >
              <option value="socio">Socio</option>
              <option value="administrativo">Administrativo</option>
              <option value="vendedor">Vendedor</option>
              <option value="contador">Contador</option>
            </select>
            <select
              value={formData.local_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, local_id: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              required
            >
              <option value="">Seleccione Local</option>
              {locales.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre}
                </option>
              ))}
            </select>
            {/* 👇 Select moderno: es_reemplazante */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                ¿Habilitado para reemplazar?
              </label>
              <div className="relative">
                <select
                  value={formData.es_reemplazante ? '1' : '0'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      es_reemplazante: e.target.value === '1'
                    })
                  }
                  className="
          w-full appearance-none px-4 py-2 rounded-lg border border-gray-300
          bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        "
                  required
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
                {/* caret */}
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.355a.75.75 0 111.02 1.1l-4.214 3.813a.75.75 0 01-1.012 0L5.25 8.33a.75.75 0 01-.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
            </div>
            <div className="text-right">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
