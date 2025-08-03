import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSearchLocation } from 'react-icons/fa';
import Modal from 'react-modal';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ButtonBack from '../../Components/ButtonBack';
Modal.setAppElement('#root');

const LocalesGet = () => {
  const [locales, setLocales] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchLocales = async () => {
    const res = await axios.get('http://localhost:8080/locales');
    setLocales(res.data);
  };

  useEffect(() => {
    fetchLocales();
  }, []);

  const filteredLocales = locales.filter(
    (l) =>
      l.nombre.toLowerCase().includes(search.toLowerCase()) ||
      l.direccion.toLowerCase().includes(search.toLowerCase()) ||
      l.telefono.includes(search)
  );

  const openModal = (local = null) => {
    if (local) {
      setEditId(local.id);
      setFormValues({
        nombre: local.nombre,
        direccion: local.direccion,
        telefono: local.telefono
      });
    } else {
      setEditId(null);
      setFormValues({ nombre: '', direccion: '', telefono: '' });
    }
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8080/locales/${id}`);
    fetchLocales();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put(`http://localhost:8080/locales/${editId}`, formValues);
    } else {
      await axios.post('http://localhost:8080/locales', formValues);
    }
    fetchLocales();
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0e24] via-[#0f112b] to-[#131538] py-10 px-6 text-white relative overflow-hidden">
      <ButtonBack />
      <ParticlesBackground />
      <div className="max-w-5xl mx-auto z-10 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl titulo uppercase font-extrabold text-pink-400 flex items-center gap-3 drop-shadow-lg">
            <FaSearchLocation className="animate-pulse" /> Locales
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-colors px-5 py-2 rounded-xl font-bold shadow-md flex items-center gap-2"
          >
            <FaPlus /> Nuevo Local
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar local..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-gray-400"
        />

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLocales.map((local) => (
            <motion.div
              key={local.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-lg border border-white/10 hover:scale-[1.02] transition-transform"
            >
              <h2 className="text-xl font-bold text-pink-300 tracking-wide">
                {local.nombre}
              </h2>
              <p className="mt-2 text-sm text-gray-300 font-light italic">
                {local.direccion}
              </p>
              <p className="text-sm text-gray-400 font-light">
                📞 {local.telefono}
              </p>
              <h2 className="mt-2 text-xl font-bold text-pink-300 tracking-wide">
                ID: {local.id}
              </h2>
              <div className="mt-4 flex justify-end gap-4">
                <button
                  onClick={() => openModal(local)}
                  className="text-yellow-400 hover:text-yellow-300 text-xl"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(local.id)}
                  className="text-red-500 hover:text-red-400 text-xl"
                >
                  <FaTrash />
                </button>
              </div>
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
            {editId ? 'Editar Local' : 'Nuevo Local'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Dirección"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={formValues.direccion}
              onChange={(e) =>
                setFormValues({ ...formValues, direccion: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Teléfono"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
              value={formValues.telefono}
              onChange={(e) =>
                setFormValues({ ...formValues, telefono: e.target.value })
              }
              required
            />
            <div className="text-right">
              <button
                type="submit"
                className="bg-pink-500 hover:bg-pink-600 transition px-6 py-2 text-white font-semibold rounded-lg shadow-md"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default LocalesGet;
