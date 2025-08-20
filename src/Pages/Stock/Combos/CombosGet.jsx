import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaGift,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCubes,
  FaCoins
} from 'react-icons/fa';
import ButtonBack from '../../../Components/ButtonBack';
import ParticlesBackground from '../../../Components/ParticlesBackground';
import AdminActions from '../../../Components/AdminActions';
import { formatearPeso } from '../../../utils/formatearPeso';
import { Link } from 'react-router-dom';
import { getUserId } from '../../../utils/authUtils';

Modal.setAppElement('#root');

const CombosGet = () => {
  const [combos, setCombos] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecioFijo, setFormPrecioFijo] = useState('');
  const [formCantidadItems, setFormCantidadItems] = useState('');
  const [formEstado, setFormEstado] = useState('activo');

  const [confirmDeleteCombo, setConfirmDeleteCombo] = useState(null);
  const [warningMessageCombo, setWarningMessageCombo] = useState('');
  const [deleteMetaCombo, setDeleteMetaCombo] = useState(null);
  const [deletingCombo, setDeletingCombo] = useState(false);

  const fetchCombos = async () => {
    try {
      const res = await axios.get('http://localhost:8080/combos');
      setCombos(res.data);
    } catch (error) {
      console.error('Error al obtener combos:', error);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

  const filteredCombos = combos.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (combo = null) => {
    setEditId(combo ? combo.id : null);
    setFormNombre(combo?.nombre || '');
    setFormDescripcion(combo?.descripcion || '');
    setFormPrecioFijo(combo?.precio_fijo || '');
    setFormCantidadItems(combo?.cantidad_items || '');
    setFormEstado(combo?.estado || 'activo');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Normalización
    const precioFijoNum = Number(
      String(formPrecioFijo ?? '').replace(',', '.')
    );
    const cantidadItemsNum = Number.parseInt(formCantidadItems, 10);

    // Validaciones mínimas (podés ajustarlas a tu UX)
    if (!formNombre?.trim()) {
      console.error('Nombre requerido');
      return;
    }
    if (!Number.isFinite(precioFijoNum)) {
      console.error('Precio fijo inválido');
      return;
    }
    if (!Number.isInteger(cantidadItemsNum) || cantidadItemsNum < 1) {
      console.error('Cantidad de ítems inválida');
      return;
    }

    const payload = {
      nombre: formNombre.trim(),
      descripcion: formDescripcion?.trim() || null,
      precio_fijo: precioFijoNum,
      cantidad_items: cantidadItemsNum,
      estado: formEstado || 'activo',
      usuario_log_id: getUserId() // 👈 para registrar en logs (crear/actualizar)
    };

    try {
      if (editId) {
        await axios.put(`http://localhost:8080/combos/${editId}`, payload);
      } else {
        await axios.post('http://localhost:8080/combos', payload);
      }
      fetchCombos();
      setModalOpen(false);
    } catch (error) {
      const msg =
        error?.response?.data?.mensajeError ||
        error?.message ||
        'Error al guardar combo';
      console.error(msg, error);
      // si usás toasts/modales de feedback, podés mostrar `msg` al usuario aquí
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/combos/${id}`, {
        data: { usuario_log_id: getUserId() } // ← enviar quién elimina
      });
      fetchCombos();
    } catch (err) {
      if (err.response?.status === 409) {
        // Mensaje y metadata para decidir UI
        setConfirmDeleteCombo(id);
        setWarningMessageCombo(
          err.response.data?.mensajeError || 'No se pudo eliminar el combo.'
        );
        setDeleteMetaCombo(err.response.data || null); // e.g. { reason: 'HAS_ITEMS', items_count: N }
      } else {
        console.error('Error al eliminar combo:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ButtonBack />
      <ParticlesBackground />
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-2 uppercase">
            <FaGift /> Combos
          </h1>
          <button
            onClick={() => openModal()}
            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaPlus /> Nuevo Combo
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar combo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCombos.map((combo) => (
            <motion.div
              key={combo.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-md backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-white">{combo.nombre}</h2>
              <p className="text-sm text-gray-300 mb-2">
                {combo.descripcion || 'Sin descripción'}
              </p>
              <p className="text-sm flex items-center gap-1">
                <FaCubes /> Items: <strong>{combo.cantidad_items}</strong>
              </p>
              <p className="text-sm flex items-center gap-1 text-emerald-300">
                <FaCoins /> Precio:{' '}
                <strong>{formatearPeso(combo.precio_fijo)}</strong>
              </p>
              <p className="text-sm mt-3 flex items-center gap-2">
                Estado:{' '}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    combo.estado === 'activo'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  ● {combo.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </p>

              <AdminActions
                onEdit={() => openModal(combo)}
                onDelete={() => handleDelete(combo.id)}
              />
              <Link
                to={`/dashboard/stock/combos/${combo.id}/permitidos`}
                className="text-sm mt-2 inline-block text-purple-300 hover:text-purple-500 font-semibold"
              >
                Editar productos permitidos
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal de creación/edición */}
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-purple-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-purple-600">
            {editId ? 'Editar Combo' : 'Nuevo Combo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre del combo"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
            <input
              type="number"
              placeholder="Precio fijo"
              value={formPrecioFijo}
              onChange={(e) => setFormPrecioFijo(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
            <input
              type="number"
              placeholder="Cantidad de productos requeridos"
              value={formCantidadItems}
              onChange={(e) => setFormCantidadItems(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
            />
            <textarea
              placeholder="Descripción del combo"
              value={formDescripcion}
              onChange={(e) => setFormDescripcion(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows="3"
            />
            <select
              value={formEstado}
              onChange={(e) => setFormEstado(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <div className="text-right">
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal de advertencia al eliminar */}
        <Modal
          isOpen={!!confirmDeleteCombo}
          onRequestClose={() => {
            setConfirmDeleteCombo(null);
            setDeleteMetaCombo(null);
          }}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-yellow-500"
        >
          <h2 className="text-xl font-bold text-yellow-600 mb-4">
            Advertencia
          </h2>
          <p className="mb-6 text-gray-800">{warningMessageCombo}</p>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setConfirmDeleteCombo(null);
                setDeleteMetaCombo(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cerrar
            </button>

            {/* Si el backend dijo que tiene ítems, ofrecemos borrado forzado */}
            {deleteMetaCombo?.reason === 'HAS_ITEMS' && (
              <button
                disabled={deletingCombo}
                onClick={async () => {
                  try {
                    setDeletingCombo(true);
                    await axios.delete(
                      `http://localhost:8080/combos/${confirmDeleteCombo}`,
                      {
                        data: { usuario_log_id: getUserId(), forzado: true } // ← forzado
                      }
                    );
                    setConfirmDeleteCombo(null);
                    setDeleteMetaCombo(null);
                    fetchCombos();
                  } catch (error) {
                    console.error(
                      'Error al eliminar combo con sus ítems:',
                      error
                    );
                  } finally {
                    setDeletingCombo(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {deletingCombo ? 'Eliminando…' : 'Eliminar combo con sus ítems'}
              </button>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CombosGet;
