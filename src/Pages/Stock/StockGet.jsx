import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaWarehouse,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaBoxOpen,
  FaMapPin,
  FaCircle,
  FaPrint
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import { useAuth } from '../../AuthContext.jsx';
import { toast, ToastContainer } from 'react-toastify';
import { ModalFeedback } from '../Ventas/Config/ModalFeedback.jsx';
import Barcode from 'react-barcode';
Modal.setAppElement('#root');

const StockGet = () => {
  const { userLevel } = useAuth();
  const UMBRAL_STOCK_BAJO = 5;
  const [stock, setStock] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    local_id: '',
    lugar_id: '',
    estado_id: '',
    cantidad: 0,
    en_exhibicion: true,
    observaciones: '',
    codigo_sku: ''
  });

  const [modalOpen, setModalOpen] = useState(false);
  // const [modalTallesOpen, setModalTallesOpen] = useState(false);
  // const [tallesGroupView, setTallesGroupView] = useState(null); // El grupo actual

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const [productos, setProductos] = useState([]);
  // const [talles, setTalles] = useState([]);
  const [locales, setLocales] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [estados, setEstados] = useState([]);

  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25
  // const [talleFiltro, setTalleFiltro] = useState('todos');
  const [localFiltro, setLocalFiltro] = useState('todos');
  const [lugarFiltro, setLugarFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [enPercheroFiltro, setEnPercheroFiltro] = useState('todos');
  const [cantidadMin, setCantidadMin] = useState('');
  const [cantidadMax, setCantidadMax] = useState('');
  const [skuFiltro, setSkuFiltro] = useState('');
  const [verSoloStockBajo, setVerSoloStockBajo] = useState(false);
  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25

  // const [cantidadesPorTalle, setCantidadesPorTalle] = useState([]);

  const [grupoOriginal, setGrupoOriginal] = useState(null);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);

  const [modalFeedbackOpen, setModalFeedbackOpen] = useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState('');
  const [modalFeedbackType, setModalFeedbackType] = useState('info'); // success | error | info

  const [openConfirm, setOpenConfirm] = useState(false);

  const [skuParaImprimir, setSkuParaImprimir] = useState(null);
  const titleRef = useRef(document.title);

  const fetchAll = async () => {
    try {
      const [resStock, resProd, resLocales, resLugares, resEstados] =
        await Promise.all([
          axios.get('http://localhost:8080/stock'),
          axios.get('http://localhost:8080/productos'),
          // axios.get('http://localhost:8080/talles'),
          axios.get('http://localhost:8080/locales'),
          axios.get('http://localhost:8080/lugares'),
          axios.get('http://localhost:8080/estados')
        ]);
      setStock(resStock.data);
      setProductos(resProd.data);
      // setTalles(resTalles.data);
      setLocales(resLocales.data);
      setLugares(resLugares.data);
      setEstados(resEstados.data);
    } catch (err) {
      setModalFeedbackMsg(
        'Ocurrió un error al cargar los datos.\n' +
          (process.env.NODE_ENV !== 'production'
            ? err.message || err.toString()
            : '')
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openModal = (item = null, group = null) => {
    if (item) {
      setEditId(item.id);
      setFormData({ ...item });
      setGrupoOriginal(null);
      setGrupoEditando(null);
    } else if (group) {
      const primerItem = group.items[0]; // ✅ obtenemos el primer item real
      setEditId(primerItem.id); // ✅ usamos su ID para modo edición

      setFormData({
        ...primerItem
      });

      setGrupoOriginal({
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        en_exhibicion: group.en_exhibicion,
        observaciones: group.observaciones
      });
      setGrupoEditando(group);
    } else {
      setEditId(null);
      setFormData({
        producto_id: '',
        local_id: '',
        lugar_id: '',
        estado_id: '',
        en_exhibicion: true,
        codigo_sku: '',
        observaciones: '',
        cantidad: ''
      });
      setGrupoOriginal(null);
      setGrupoEditando(null);
    }

    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cantidadNumerica = Number(formData.cantidad);

    // Validaciones
    if (
      !formData.producto_id ||
      !formData.local_id ||
      !formData.lugar_id ||
      !formData.estado_id ||
      isNaN(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {
      setModalFeedbackMsg(
        'Completa todos los campos obligatorios con valores válidos.'
      );
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    const payload = {
      ...formData,
      cantidad: cantidadNumerica
    };

    // 🔄 EDICIÓN
    if (editId) {
      try {
        await axios.put(`http://localhost:8080/stock/${editId}`, payload);
        fetchAll();
        setModalOpen(false);
        setModalFeedbackMsg('Stock actualizado correctamente.');
        setModalFeedbackType('success');
        setModalFeedbackOpen(true);
      } catch (err) {
        setModalFeedbackMsg(
          err.response?.data?.mensajeError ||
            err.response?.data?.message ||
            err.message ||
            'Error inesperado al editar el stock'
        );
        setModalFeedbackType('error');
        setModalFeedbackOpen(true);
        console.error('Error al editar stock:', err);
      }
      return;
    }

    // ➕ NUEVO
    try {
      await axios.post(`http://localhost:8080/stock`, payload);
      fetchAll();
      setModalOpen(false);
      setModalFeedbackMsg('Stock creado correctamente.');
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);
    } catch (err) {
      setModalFeedbackMsg(
        err.response?.data?.mensajeError ||
          err.response?.data?.message ||
          err.message ||
          'Error inesperado al crear el stock'
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
      console.error('Error al crear stock:', err);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este stock? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    try {
      await axios.delete(`http://localhost:8080/stock/${id}`);
      fetchAll();

      setModalFeedbackMsg('Stock eliminado correctamente.');
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);
    } catch (err) {
      setModalFeedbackMsg(
        err.response?.data?.mensajeError ||
          err.response?.data?.message ||
          err.message ||
          'Ocurrió un error al eliminar el stock. Intenta de nuevo.'
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);

      console.error('Error al eliminar stock:', err);
    }
  };

  // handler SIN parámetro, usa el estado actual
  const handleDeleteGroup = async () => {
    if (!grupoAEliminar) return;

    const nombreProducto =
      productos.find((p) => p.id === grupoAEliminar.producto_id)?.nombre || '';

    try {
      const res = await axios.post('http://localhost:8080/eliminar-grupo', {
        producto_id: grupoAEliminar.producto_id,
        local_id: grupoAEliminar.local_id,
        lugar_id: grupoAEliminar.lugar_id,
        estado_id: grupoAEliminar.estado_id
      });

      setModalFeedbackMsg(
        res.data.message ||
          `Stock de "${nombreProducto}" eliminado correctamente.`
      );
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);
    } catch (err) {
      const mensaje =
        err.response?.data?.mensajeError ||
        err.response?.data?.message ||
        err.message ||
        'Error inesperado al eliminar el grupo de stock.';

      setModalFeedbackMsg(mensaje);
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    } finally {
      setOpenConfirm(false);
      setGrupoAEliminar(null);
      fetchAll();
    }
  };

  const filtered = stock
    .filter((item) => {
      const producto = productos.find((p) => p.id === item.producto_id);
      return producto?.nombre?.toLowerCase().includes(search.toLowerCase());
    })
    // 🔥 Se eliminó filtro por talle
    .filter(
      (item) =>
        localFiltro === 'todos' || item.local_id === parseInt(localFiltro)
    )
    .filter(
      (item) =>
        lugarFiltro === 'todos' || item.lugar_id === parseInt(lugarFiltro)
    )
    .filter(
      (item) =>
        estadoFiltro === 'todos' || item.estado_id === parseInt(estadoFiltro)
    )
    .filter((item) => {
      if (enPercheroFiltro === 'todos') return true;
      return item.en_exhibicion === (enPercheroFiltro === 'true');
    })
    .filter((item) => {
      const min = parseInt(cantidadMin) || 0;
      const max = parseInt(cantidadMax) || Infinity;
      return item.cantidad >= min && item.cantidad <= max;
    })
    .filter((item) =>
      item.codigo_sku?.toLowerCase().includes(skuFiltro.toLowerCase())
    )
    .filter((item) =>
      verSoloStockBajo ? item.cantidad <= UMBRAL_STOCK_BAJO : true
    );

  const exportarStockAExcel = (datos) => {
    const exportData = datos.map((item) => ({
      Producto:
        productos.find((p) => p.id === item.producto_id)?.nombre ||
        'Sin nombre',
      Local: item.local_id || '-',
      Lugar: item.lugar_id || '-',
      Estado: item.estado_id || '-',
      Cantidad: item.cantidad,
      'En Exhibición': item.en_exhibicion ? 'Sí' : 'No',
      SKU: item.codigo_sku || '',
      'Última actualización': new Date(item.updated_at).toLocaleString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

    const fecha = new Date();
    const timestamp = fecha
      .toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-');

    const nombreArchivo = `stock-exportado-${timestamp}.xlsx`;

    XLSX.writeFile(workbook, nombreArchivo);
  };
  // Agrupar el stock sin considerar talles
  const stockAgrupado = [];
  filtered.forEach((item) => {
    const key = [
      item.producto_id,
      item.local_id,
      item.lugar_id,
      item.estado_id,
      item.en_exhibicion
    ].join('-');

    let group = stockAgrupado.find((g) => g.key === key);

    if (!group) {
      group = {
        key,
        producto_id: item.producto_id,
        local_id: item.local_id,
        lugar_id: item.lugar_id,
        estado_id: item.estado_id,
        en_exhibicion: item.en_exhibicion,
        items: []
      };
      stockAgrupado.push(group);
    }

    group.items.push(item);
  });

  const handleImprimirCodigoBarra = (item) => {
    setSkuParaImprimir(item);
  };

  const handlePrint = () => {
    titleRef.current = document.title;
    document.title = skuParaImprimir.codigo_sku || 'Etiqueta';
    window.print();
    setTimeout(() => {
      document.title = titleRef.current;
      setSkuParaImprimir(null);
    }, 1000);
  };

  const handleClose = () => {
    document.title = titleRef.current;
    setSkuParaImprimir(null);
  };

  useEffect(() => {
    return () => {
      document.title = titleRef.current;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-2 uppercase">
            <FaWarehouse /> Stock
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <BulkUploadButton
              tabla="stock"
              onSuccess={() => fetchAll()} // función para recargar stock después de importar
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            />
            <button
              onClick={() => exportarStockAExcel(filtered)}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
            >
              <FaDownload /> Exportar Excel
            </button>

            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nuevo
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* Filtro por Local */}
          <select
            value={localFiltro}
            onChange={(e) => setLocalFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los locales</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Lugar */}
          <select
            value={lugarFiltro}
            onChange={(e) => setLugarFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los lugares</option>
            {lugares.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los estados</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por exhibición */}
          <select
            value={enPercheroFiltro}
            onChange={(e) => setEnPercheroFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos</option>
            <option value="true">En exhibición</option>
            <option value="false">No en exhibición</option>
          </select>

          {/* Filtro por cantidad */}
          <input
            type="number"
            placeholder="Cantidad mínima"
            value={cantidadMin}
            onChange={(e) => setCantidadMin(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
          <input
            type="number"
            placeholder="Cantidad máxima"
            value={cantidadMax}
            onChange={(e) => setCantidadMax(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />

          {/* Filtro por SKU */}
          <input
            type="text"
            placeholder="Buscar por SKU"
            value={skuFiltro}
            onChange={(e) => setSkuFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
        </div>

        <button
          onClick={() => setVerSoloStockBajo((prev) => !prev)}
          className={`px-4 mb-2 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
            verSoloStockBajo
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-800 text-white'
          }`}
        >
          {verSoloStockBajo ? 'Ver Todos' : 'Mostrar Stock Bajo'}
        </button>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {stockAgrupado.map((group, idx) => {
            const producto = productos.find((p) => p.id === group.producto_id);
            const local = locales.find((l) => l.id === group.local_id);
            const lugar = lugares.find((l) => l.id === group.lugar_id);
            const estado = estados.find((e) => e.id === group.estado_id);
            const cantidadTotal = group.items.reduce(
              (sum, i) => sum + i.cantidad,
              0
            );

            return (
              <motion.div
                key={group.key}
                layout
                className="bg-white/10 p-6 rounded-2xl shadow-md border border-white/10 hover:scale-[1.02] transition-all"
              >
                <h2 className="text-xl font-bold text-cyan-300 mb-1 uppercase">
                  {producto?.nombre}
                </h2>
                <p className="text-sm">ID: {producto?.id}</p>
                <p className="text-sm">Local: {local?.nombre}</p>
                <p className="text-sm">Lugar: {lugar?.nombre || 'Sin lugar'}</p>
                <p className="text-sm">
                  Estado: {estado?.nombre || 'Sin Estado'}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <span
                    className={
                      cantidadTotal <= UMBRAL_STOCK_BAJO
                        ? 'text-red-400'
                        : 'text-green-300'
                    }
                  >
                    Cantidad total: {cantidadTotal}
                  </span>
                  {cantidadTotal <= UMBRAL_STOCK_BAJO && (
                    <span className="flex items-center text-red-500 font-bold text-xs animate-pulse">
                      <FaExclamationTriangle className="mr-1" />
                      ¡Stock bajo!
                    </span>
                  )}
                </p>
                <p className="text-sm flex items-center gap-2">
                  En exhibición:
                  {group.en_exhibicion ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <FaCheckCircle /> Sí
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <FaTimesCircle /> No
                    </span>
                  )}
                </p>
                <p className="text-sm mt-2 text-white/90">
                  SKU:{' '}
                  <span className="font-mono">
                    {group.items[0]?.codigo_sku || '—'}
                  </span>
                </p>

                <div className="flex gap-2">
                  {userLevel === 'socio' && (
                    <>
                      <button
                        onClick={() => {
                          openModal(null, group); // null para item, group como segundo argumento
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        onClick={() => {
                          setGrupoAEliminar(group);
                          setOpenConfirm(true);
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 shadow-2xl border-l-4 border-cyan-500 max-w-2xl w-full mx-4"
        >
          <h2 className="text-2xl font-bold mb-4 text-cyan-600">
            {editId ? 'Editar Stock' : 'Nuevo Stock'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            {/* Campos comunes */}
            {[
              { label: 'Producto', name: 'producto_id', options: productos },
              { label: 'Local', name: 'local_id', options: locales },
              { label: 'Lugar', name: 'lugar_id', options: lugares },
              { label: 'Estado', name: 'estado_id', options: estados }
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block font-semibold mb-1">{label}</label>
                <select
                  value={formData[name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [name]: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  required
                >
                  <option value="">Seleccione {label}</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* SKU solo en edición */}
            {editId && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Código SKU
                </label>
                <input
                  type="text"
                  value={formData.codigo_sku || ''}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="block font-semibold mb-1">Cantidad</label>
              <input
                type="number"
                min="0"
                value={formData.cantidad}
                onChange={(e) =>
                  setFormData({ ...formData, cantidad: Number(e.target.value) })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                required
              />
            </div>

            {/* exhibición */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.en_exhibicion}
                onChange={(e) =>
                  setFormData({ ...formData, en_exhibicion: e.target.checked })
                }
              />
              <label>En exhibición</label>
            </div>

            {/* Botón */}
            <div className="text-right">
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
      {/* <ModalError
        open={modalErrorOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
      /> */}
      {/* Modal simple */}
      {openConfirm && grupoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#232b32] rounded-2xl shadow-2xl p-8 w-[90vw] max-w-sm flex flex-col gap-4 border border-gray-800 animate-fade-in">
            <div className="flex items-center gap-2 text-xl font-bold text-[#32d8fd]">
              <FaExclamationTriangle className="text-yellow-400 text-2xl" />
              Eliminar de stock
            </div>
            <div className="text-base text-gray-200">
              ¿Seguro que deseas eliminar TODO el stock del producto{' '}
              <span className="font-bold text-pink-400">
                "
                {productos.find((p) => p.id === grupoAEliminar.producto_id)
                  ?.nombre || ''}
                "
              </span>
              ?
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Esta acción no puede deshacerse.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow"
              >
                Eliminar
              </button>

              <button
                onClick={() => {
                  setOpenConfirm(false);
                  setGrupoAEliminar(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold shadow"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!skuParaImprimir}
        onRequestClose={() => setSkuParaImprimir(null)}
        overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
      >
        <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
          <FaPrint className="text-green-400" /> Imprimir código de barras
        </h3>
        {skuParaImprimir && (
          <div className="flex flex-col items-center gap-4">
            {/* Nombre y talle */}
            <div className="font-semibold text-base text-black">
              {skuParaImprimir.producto?.nombre}
            </div>
            {/* <div className="text-sm text-gray-600">
              TALLE:{skuParaImprimir.talle?.nombre}
            </div> */}

            {/* Código de barras */}
            <div
              className="barcode-etiqueta"
              style={{
                width: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              <Barcode
                value={skuParaImprimir.codigo_sku}
                format="CODE128"
                width={2}
                height={60}
                displayValue={false} // <-- Oculta el texto cortado
                margin={0}
              />
              {/* Texto SKU completo, centrado y sin cortes */}
              <div
                style={{
                  fontSize: 13,
                  marginTop: 4,
                  fontWeight: 700,
                  textAlign: 'center',
                  wordBreak: 'break-all',
                  maxWidth: '95%'
                }}
              >
                {skuParaImprimir.codigo_sku}
              </div>
            </div>

            {/* Botón imprimir */}
            <button
              onClick={handlePrint}
              className="mt-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
            >
              Imprimir
            </button>

            <button
              onClick={handleClose}
              className="mt-2 px-5 py-1 rounded-full border border-green-300 text-green-700 font-semibold bg-white hover:bg-green-50 hover:border-green-400 transition-all text-sm shadow-sm"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>

      <ModalFeedback
        open={modalFeedbackOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
        type={modalFeedbackType}
      />

      <ToastContainer />
    </div>
  );
};

export default StockGet;
