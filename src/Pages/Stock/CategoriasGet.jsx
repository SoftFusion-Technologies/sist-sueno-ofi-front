import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { FaFolderOpen, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import AdminActions from '../../Components/AdminActions';
import { getUserId } from '../../utils/authUtils';

Modal.setAppElement('#root');

const CategoriasGet = () => {
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    estado: 'activo'
  });

  const [confirmDelete, setConfirmDelete] = useState(null); // objeto con ID a eliminar
  const [warningMessage, setWarningMessage] = useState('');
  const usuarioId = getUserId();
  const fetchCategorias = async () => {
    try {
      const res = await axios.get('http://localhost:8080/categorias');
      setCategorias(res.data);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const filteredCategorias = categorias.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (categoria = null) => {
    setEditId(categoria ? categoria.id : null);
    setFormValues(
      categoria
        ? {
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || '',
            estado: categoria.estado || 'activo'
          }
        : { nombre: '', descripcion: '', estado: 'activo' }
    );
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formValues,
        usuario_log_id: usuarioId // 👈 clave para registrar el log
      };

      if (editId) {
        await axios.put(`http://localhost:8080/categorias/${editId}`, payload);
      } else {
        await axios.post('http://localhost:8080/categorias', payload);
      }

      fetchCategorias();
      setModalOpen(false);
    } catch (error) {
      console.error(
        'Error al guardar local:',
        error.response?.data || error.message
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log(usuarioId);

      await axios.delete(`http://localhost:8080/categorias/${id}`, {
        data: {
          usuario_log_id: usuarioId,
          forzar: true
        }
      });
      fetchCategorias();
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
      } else {
        console.error('Error al eliminar lugar:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ButtonBack />
      <ParticlesBackground />
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          {/* Título */}
          <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2 uppercase">
            <FaFolderOpen /> Categorías
          </h1>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <BulkUploadButton
              tabla="categorias"
              onSuccess={() => fetchCategorias()} // refrescar lista
            />

            <button
              onClick={() => openModal()}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nueva Categoría
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategorias.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-white">ID: {cat.id}</h2>
              <h2 className="text-xl font-bold text-blue-300">{cat.nombre}</h2>
              {cat.descripcion && (
                <p className="text-sm text-gray-300 mt-1">{cat.descripcion}</p>
              )}
              {/* Contador de productos */}
              <p className="text-sm mt-2">
                <span className="font-semibold text-blue-400">
                  {cat.cantidadProductos}
                </span>{' '}
                producto{cat.cantidadProductos !== 1 && 's'} asignado
                {cat.cantidadProductos !== 1 && 's'}
              </p>{' '}
              {/* 🆕 */}
              <p
                className={`text-sm mt-2 font-semibold ${
                  cat.estado === 'activo' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                Estado: {cat.estado}
              </p>
              <AdminActions
                onEdit={() => openModal(cat)}
                onDelete={() => handleDelete(cat.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-blue-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-600">
            {editId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
            <select
              value={formValues.estado}
              onChange={(e) =>
                setFormValues({ ...formValues, estado: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!confirmDelete}
          onRequestClose={() => setConfirmDelete(null)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-yellow-500"
        >
          <h2 className="text-xl font-bold text-yellow-600 mb-4">
            Advertencia
          </h2>
          <p className="mb-6 text-gray-800">{warningMessage}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await axios.delete(
                    `http://localhost:8080/categorias/${confirmDelete}?forzar=true`
                  );
                  setConfirmDelete(null);
                  fetchCategorias();
                } catch (error) {
                  console.error('Error al eliminar con forzado:', error);
                }
              }}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CategoriasGet;
