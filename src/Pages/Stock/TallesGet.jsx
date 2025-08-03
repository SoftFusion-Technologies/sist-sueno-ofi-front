import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { FaTshirt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack';
import ParticlesBackground from '../../Components/ParticlesBackground';
import AdminActions from '../../Components/AdminActions';

Modal.setAppElement('#root');

const TallesGet = () => {
  const [talles, setTalles] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    tipo_categoria: 'ropa'
  });

  const [categoriaFiltro, setCategoriaFiltro] = useState('todos');

  const [confirmDelete, setConfirmDelete] = useState(null); // objeto con ID a eliminar
  const [warningMessage, setWarningMessage] = useState('');

  const fetchTalles = async () => {
    try {
      const res = await axios.get('http://localhost:8080/talles');
      setTalles(res.data);
    } catch (error) {
      console.error('Error al obtener talles:', error);
    }
  };

  useEffect(() => {
    fetchTalles();
  }, []);

  const filteredTalles = talles
    .filter(
      (t) =>
        t.nombre.toLowerCase().includes(search.toLowerCase()) &&
        (categoriaFiltro === 'todos' || t.tipo_categoria === categoriaFiltro)
    )
    .sort((a, b) => {
      const ordenCategoria = { ropa: 1, calzado: 2, accesorio: 3 };
      return (
        ordenCategoria[a.tipo_categoria] - ordenCategoria[b.tipo_categoria]
      );
    });

  const openModal = (talle = null) => {
    if (talle) {
      // ✨ Editar: usar los datos existentes
      setEditId(talle.id);
      setFormValues({
        nombre: talle.nombre || '',
        descripcion: talle.descripcion || '',
        tipo_categoria: talle.tipo_categoria || 'ropa'
      });
    } else {
      // 🆕 Crear: usar valores por defecto
      setEditId(null);
      setFormValues({
        nombre: '',
        descripcion: '',
        tipo_categoria: 'ropa'
      });
    }

    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:8080/talles/${editId}`, formValues);
      } else {
        await axios.post('http://localhost:8080/talles', formValues);
      }
      fetchTalles();
      setModalOpen(false);
    } catch (error) {
      console.error('Error al guardar talle:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/talles/${id}`);
      fetchTalles();
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-pink-400 flex items-center gap-2 uppercase">
            <FaTshirt /> Talles
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaPlus /> Nuevo Talle
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar talle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="todos">Todos</option>
          <option value="ropa">Ropa</option>
          <option value="calzado">Calzado</option>
          <option value="accesorio">Accesorio</option>
        </select>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTalles.map((talle) => (
            <motion.div
              key={talle.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-white">ID: {talle.id}</h2>
              <h2 className="text-xl font-bold text-pink-300">
                {talle.nombre} ({talle.tipo_categoria})
              </h2>
              {talle.descripcion && (
                <p className="text-sm text-gray-300 mt-1">
                  {talle.descripcion}
                </p>
              )}
              <AdminActions
                onEdit={() => openModal(talle)}
                onDelete={() => handleDelete(talle.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-pink-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-pink-600">
            {editId ? 'Editar Talle' : 'Nuevo Talle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del Talle"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            ></textarea>
            <select
              value={formValues.tipo_categoria}
              onChange={(e) => {
                console.log('Seleccionado:', e.target.value); // 👀
                setFormValues({
                  ...formValues,
                  tipo_categoria: e.target.value
                });
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              <option value="ropa">Ropa</option>
              <option value="calzado">Calzado</option>
              <option value="accesorio">Accesorio</option>
            </select>

            <div className="text-right">
              <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 transition px-6 py-2 text-white font-medium rounded-lg"
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
                    `http://localhost:8080/talles/${confirmDelete}?forzar=true`
                  );
                  setConfirmDelete(null);
                  fetchTalles();
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

export default TallesGet;
