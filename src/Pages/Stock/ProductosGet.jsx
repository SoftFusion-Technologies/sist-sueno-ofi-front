import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import {
  FaBox,
  FaPlus,
  FaPercentage,
  FaTrash,
  FaDownload
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import DropdownCategoriasConFiltro from '../../Components/DropdownCategoriasConFiltro.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import AdminActions from '../../Components/AdminActions';
import AjustePreciosModal from './Components/AjustePreciosModal.jsx';
import { useAuth } from '../../AuthContext.jsx';
import { getUserId } from '../../utils/authUtils';

Modal.setAppElement('#root');
const BASE_URL = 'http://localhost:8080';

const ProductosGet = () => {
  const { userLevel } = useAuth();
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formValues, setFormValues] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    modelo: '',
    medida: '',
    categoria_id: '',
    precio: '',
    descuento_porcentaje: '',
    codigo_sku: '',
    imagen_url: '',
    estado: 'activo'
  });

  const [confirmDelete, setConfirmDelete] = useState(null); // objeto con ID a eliminar
  const [warningMessage, setWarningMessage] = useState('');
  const [deleteMeta, setDeleteMeta] = useState(null); // ← NUEVO

  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [estadoCategoriaFiltro, setEstadoCategoriaFiltro] = useState('todas');

  const [categorias, setCategorias] = useState([]);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ordenCampo, setOrdenCampo] = useState('nombre');
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);

  const [showAjustePrecios, setShowAjustePrecios] = useState(false);

  const [proveedores, setProveedores] = useState([]);
  const [proveedorIdSel, setProveedorIdSel] = useState(''); // '' = NULL
  useEffect(() => {
    // Cargar proveedores activos (podés ajustar al endpoint que uses)
    fetch(`${BASE_URL}/proveedores`)
      .then((r) => r.json())
      .then((json) => {
        const arr = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
          ? json
          : [];
        setProveedores(arr.filter((p) => p.estado === 'activo'));
      })
      .catch(() => setProveedores([]));
  }, []);
  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25

  const fetchData = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        axios.get('http://localhost:8080/productos'),
        axios.get('http://localhost:8080/categorias')
      ]);
      setProductos(resProd.data);
      setCategorias(resCat.data);
    } catch (error) {
      console.error('Error al cargar productos o categorías:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = productos
    .filter((p) => {
      const searchLower = search.toLowerCase();

      // Campos a buscar (solo strings)
      const campos = [
        p.nombre,
        p.descripcion,
        p.categoria?.nombre // <- extraemos nombre de la categoría
      ];

      return campos.some(
        (campo) =>
          typeof campo === 'string' && campo.toLowerCase().includes(searchLower)
      );
    })
    .filter((p) =>
      estadoFiltro === 'todos' ? true : p.estado === estadoFiltro
    )
    .filter((p) =>
      categoriaFiltro === null
        ? true
        : p.categoria_id === parseInt(categoriaFiltro)
    )
    .filter((p) => {
      const precio = parseFloat(p.precio);
      const min = parseFloat(precioMin) || 0;
      const max = parseFloat(precioMax) || Infinity;
      return precio >= min && precio <= max;
    })
    .sort((a, b) => {
      if (ordenCampo === 'precio') return a.precio - b.precio;
      return a.nombre.localeCompare(b.nombre);
    });

  const openModal = (producto = null) => {
    if (producto) {
      setEditId(producto.id);
      setFormValues({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        marca: producto.marca || '',
        modelo: producto.modelo || '',
        medida: producto.medida || '',
        categoria_id: producto.categoria_id || producto.categoria?.id || '',
        precio: producto.precio?.toString() ?? '',
        descuento_porcentaje: producto.descuento_porcentaje?.toString() ?? '',
        codigo_sku: producto.codigo_sku || '',
        imagen_url: producto.imagen_url || '',
        estado: producto.estado || 'activo'
      });

      // 👇 si viene el preferido en el producto, lo mostramos en el select
      setProveedorIdSel(
        producto.proveedor_preferido_id ||
          producto.proveedor_preferido?.id ||
          ''
      );
    } else {
      setEditId(null);
      setFormValues({
        nombre: '',
        descripcion: '',
        marca: '',
        modelo: '',
        medida: '',
        categoria_id: '',
        precio: '0',
        descuento_porcentaje: '',
        codigo_sku: '',
        imagen_url: '',
        estado: 'activo'
      });
      setProveedorIdSel(''); // nuevo => sin preferido por defecto
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedPrecio = parseFloat(formValues.precio);
    if (isNaN(parsedPrecio) || parsedPrecio < 0) {
      alert('Por favor ingrese un precio válido');
      return;
    }

    const uid = getUserId?.() ?? null;

    try {
      const dataToSend = {
        ...formValues,
        precio: parsedPrecio.toFixed(2),
        usuario_log_id: uid,
        // 👇 NUEVO: mandamos el preferido (nullable)
        proveedor_preferido_id: proveedorIdSel ? Number(proveedorIdSel) : null
      };

      if (editId) {
        await axios.put(`${BASE_URL}/productos/${editId}`, dataToSend, {
          headers: { 'X-User-Id': String(uid ?? '') }
        });
      } else {
        const resp = await axios.post(`${BASE_URL}/productos`, dataToSend, {
          headers: { 'X-User-Id': String(uid ?? '') }
        });

        const nuevoProducto = resp?.data?.producto;
        if (!nuevoProducto?.id)
          throw new Error('No se recibió el ID del producto creado');

        // Si el usuario eligió un proveedor, creamos la relación producto↔proveedor
        if (proveedorIdSel) {
          const payloadPP = {
            producto_id: Number(nuevoProducto.id),
            proveedor_id: Number(proveedorIdSel),

            // 🔹 Prellenado "mejor"
            sku_proveedor: formValues.codigo_sku || null,
            nombre_en_proveedor: formValues.nombre || null,

            // costos/condiciones iniciales (ajustá estos defaults si querés)
            costo_neto: 0, // costo de compra (lo completarán luego)
            moneda: 'ARS',
            alicuota_iva: 21,
            inc_iva: false,
            descuento_porcentaje: 0,
            plazo_entrega_dias: 7,
            minimo_compra: 1,

            vigente: true,
            observaciones: 'Alta automática al crear producto',
            usuario_log_id: uid
          };

          try {
            const rPP = await axios.post(
              `${BASE_URL}/producto-proveedor`,
              payloadPP,
              {
                headers: { 'X-User-Id': String(uid ?? '') }
              }
            );
            // opcional: abrir modal para que completen detalles (ver B)
            const creado = rPP?.data?.data || rPP?.data?.pp || rPP?.data; // según tu respuesta
            // openPPAutoEdit(creado?.id, Number(proveedorIdSel), nuevoProducto.id);
          } catch (e) {
            console.warn('[producto-proveedor] no crítico:', e?.message || e);
          }
        }
      }

      fetchData?.();
      setModalOpen(false);
    } catch (err) {
      console.error('Error al guardar producto:', err);
      alert(
        err?.response?.data?.mensajeError || err.message || 'Error al guardar'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/productos/${id}`, {
        data: { usuario_log_id: getUserId() }
      });
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmDelete(id);
        setWarningMessage(err.response.data.mensajeError);
        setDeleteMeta(err.response.data || null); // ← guardamos reason
      } else {
        console.error('Error al eliminar producto:', err);
      }
    }
  };

  const exportarProductosAExcel = (productos) => {
    const data = productos.map((p) => ({
      ID: p.id,
      Nombre: p.nombre,
      Descripción: p.descripcion || '',
      Precio: `$${parseFloat(p.precio).toFixed(2)}`,
      Estado: p.estado === 'inactivo' ? 'Inactivo' : 'Activo',
      Categoría: p.categoria?.nombre || 'Sin categoría',
      SKU: p.codigo_sku || '',
      'Creado el': new Date(p.created_at).toLocaleString('es-AR'),
      'Actualizado el': new Date(p.updated_at).toLocaleString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // 🕒 Nombre de archivo dinámico con fecha
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

    const nombreArchivo = `productos-exportados-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  const proveedoresMap = useMemo(() => {
    const m = Object.create(null);
    for (const pr of proveedores) m[pr.id] = pr.razon_social;
    return m;
  }, [proveedores]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-10 px-6 text-white relative">
      <ParticlesBackground />
      <ButtonBack />
      <div className="max-w-6xl mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            {/* Título */}
            <h1 className="text-4xl font-bold titulo text-rose-400 flex items-center gap-3 uppercase drop-shadow">
              <FaBox /> Productos
            </h1>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {userLevel === 'socio' && (
                <button
                  onClick={() => setShowAjustePrecios(true)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-white"
                >
                  <FaPercentage /> Ajustar Precios
                </button>
              )}

              <BulkUploadButton
                tabla="productos"
                onSuccess={() => fetchData()} // refrescar lista si lo necesitas
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
              />

              <button
                onClick={() => exportarProductosAExcel(filtered)}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2 text-white"
              >
                <FaDownload /> Exportar Excel
              </button>

              <button
                onClick={() => openModal()}
                className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 transition px-5 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg"
              >
                <FaPlus /> Nuevo Producto
              </button>
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          {/* Categoría */}
          <DropdownCategoriasConFiltro
            categorias={categorias}
            selected={categoriaFiltro}
            onChange={setCategoriaFiltro}
          />

          {/* Orden */}
          <select
            value={ordenCampo}
            onChange={(e) => setOrdenCampo(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          >
            <option value="nombre">Ordenar por nombre</option>
            <option value="precio">Ordenar por precio</option>
          </select>

          {/* Precio mínimo */}
          <input
            type="number"
            placeholder="Precio mínimo"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          />

          {/* Precio máximo */}
          <input
            type="number"
            placeholder="Precio máximo"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className="px-4 py-2 rounded-lg border bg-gray-800 border-gray-600 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-md border border-white/10 hover:scale-[1.02] transition-all"
            >
              <h2 className="text-xl font-bold text-white mb-1">ID: {p.id}</h2>
              <h2 className="text-xl font-bold text-rose-300 mb-1">
                {p.nombre}
              </h2>

              <p className="text-sm text-gray-200 mb-1">
                <span className="font-semibold text-white">Descripción:</span>{' '}
                {p.descripcion || 'Sin descripción'}
              </p>

              <p className="text-sm text-gray-200 mb-1">
                <span className="font-semibold text-white">Marca:</span>{' '}
                {p.marca || 'Sin marca'}
              </p>

              <p className="text-sm text-gray-200 mb-1">
                <span className="font-semibold text-white">Modelo:</span>{' '}
                {p.modelo || 'Sin modelo'}
              </p>

              <p className="text-sm text-gray-200 mb-1">
                <span className="font-semibold text-white">Medida:</span>{' '}
                {p.medida || 'Sin medida'}
              </p>

              <p className="text-sm text-gray-200 mb-1">
                <span className="font-semibold text-white">SKU:</span>{' '}
                {p.codigo_sku || 'No asignado'}
              </p>

              <p className="text-sm text-gray-400 mb-1">
                <span className="font-semibold text-white">Categoría:</span>{' '}
                {p.categoria?.nombre || 'Sin categoría'}
              </p>

              {/* Proveedor preferido */}
              {(() => {
                const provName =
                  p.proveedor_preferido?.razon_social ?? // si el backend incluye el objeto
                  (p.proveedor_preferido_id
                    ? proveedoresMap[p.proveedor_preferido_id]
                    : null); // si solo viene el id

                return (
                  <p className="text-sm text-gray-200 mb-1">
                    <span className="font-semibold text-white">Proveedor:</span>{' '}
                    {provName ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-emerald-300 border border-emerald-900/40">
                        {provName}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </p>
                );
              })()}

              <div className="flex items-center gap-3 mt-2">
                {/* Precio original */}
                <span
                  className={
                    p.descuento_porcentaje > 0
                      ? 'text-gray-400 line-through text-sm'
                      : 'text-green-300 font-semibold'
                  }
                >
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 2
                  }).format(p.precio || 0)}
                </span>

                {/* Precio con descuento */}
                {p.descuento_porcentaje > 0 && (
                  <>
                    <span className="text-green-400 font-bold text-lg drop-shadow">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                        minimumFractionDigits: 2
                      }).format(p.precio_con_descuento)}
                    </span>
                    <span className="bg-rose-100 text-rose-500 rounded px-2 py-1 text-xs font-bold ml-1">
                      -{p.descuento_porcentaje}% OFF
                    </span>
                  </>
                )}
              </div>

              <p
                className={`mt-2 uppercase text-sm font-semibold ${
                  p.estado === 'activo' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {p.estado}
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Creado el:{' '}
                {new Date(p.created_at).toLocaleString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                })}
              </p>

              <AdminActions
                onEdit={() => openModal(p)}
                onDelete={() => handleDelete(p.id)}
              />
            </motion.div>
          ))}
        </div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-l-4 border-rose-500"
        >
          <h2 className="text-2xl font-bold mb-4 text-rose-600">
            {editId ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NOMBRE */}
            <input
              type="text"
              placeholder="Nombre"
              value={formValues.nombre}
              onChange={(e) =>
                setFormValues({ ...formValues, nombre: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            />

            {/* PROVEEDOR PREFERIDO (opcional) */}
            <label className="block">
              <span className="text-sm text-gray-700">
                Proveedor (opcional)
              </span>
              <select
                value={proveedorIdSel}
                onChange={(e) => setProveedorIdSel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.razon_social}
                  </option>
                ))}
              </select>
            </label>

            {/* DESCRIPCIÓN */}
            <textarea
              placeholder="Descripción"
              value={formValues.descripcion}
              onChange={(e) =>
                setFormValues({ ...formValues, descripcion: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows="3"
            />

            {/* MARCA */}
            <input
              type="text"
              placeholder="Marca"
              value={formValues.marca || ''}
              onChange={(e) =>
                setFormValues({ ...formValues, marca: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* MODELO */}
            <input
              type="text"
              placeholder="Modelo"
              value={formValues.modelo || ''}
              onChange={(e) =>
                setFormValues({ ...formValues, modelo: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* MEDIDA */}
            <input
              type="text"
              placeholder="Medida (ej: 140x190)"
              value={formValues.medida || ''}
              onChange={(e) =>
                setFormValues({ ...formValues, medida: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* CATEGORÍA */}
            <select
              value={formValues.categoria_id}
              onChange={(e) =>
                setFormValues({ ...formValues, categoria_id: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            {/* PRECIO */}
            <input
              type="number"
              placeholder="Precio"
              value={formValues.precio}
              onChange={(e) =>
                setFormValues({ ...formValues, precio: e.target.value })
              }
              min="0"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* DESCUENTO */}
            <input
              type="number"
              placeholder="Descuento (%)"
              value={formValues.descuento_porcentaje || ''}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 0) val = 0;
                if (val > 100) val = 100;
                setFormValues({ ...formValues, descuento_porcentaje: val });
              }}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* <input
              type="text"
              placeholder="Código SKU"
              value={formValues.codigo_sku || ''}
              onChange={(e) =>
                setFormValues({ ...formValues, codigo_sku: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            /> */}

            {/* IMAGEN */}
            <input
              type="text"
              placeholder="URL de Imagen"
              value={formValues.imagen_url || ''}
              onChange={(e) =>
                setFormValues({ ...formValues, imagen_url: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />

            {/* ESTADO */}
            <select
              value={formValues.estado}
              onChange={(e) =>
                setFormValues({ ...formValues, estado: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <div className="text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="mr-2 bg-gray-500 hover:bg-gray-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={!!confirmDelete}
          onRequestClose={() => {
            setConfirmDelete(null);
            setDeleteMeta(null);
          }}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border-l-4 border-yellow-500"
        >
          <h2 className="text-xl font-bold text-yellow-600 mb-4">
            Advertencia
          </h2>
          <p className="mb-6 text-gray-800">{warningMessage}</p>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setConfirmDelete(null);
                setDeleteMeta(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
            >
              Cerrar
            </button>

            {/* Caso: tiene stock -> ofrecer acción destructiva doble */}
            {deleteMeta?.reason === 'HAS_STOCK' && (
              <button
                onClick={async () => {
                  try {
                    const userId = getUserId();
                    // 1) Eliminar stock
                    await axios.delete(
                      `http://localhost:8080/stock/producto/${confirmDelete}`,
                      { data: { usuario_log_id: userId } }
                    );
                    // 2) Eliminar producto (forzado)
                    await axios.delete(
                      `http://localhost:8080/productos/${confirmDelete}`,
                      { data: { usuario_log_id: userId, forzado: true } }
                    );
                    setConfirmDelete(null);
                    setDeleteMeta(null);
                    fetchData();
                  } catch (error) {
                    console.error('Error al eliminar con forzado:', error);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar stock y producto
              </button>
            )}

            {/* Caso: asociado a proveedor -> permitir continuar igualmente */}
            {deleteMeta?.reason === 'HAS_PROVEEDOR' && (
              <button
                onClick={async () => {
                  try {
                    const userId = getUserId();
                    await axios.delete(
                      `http://localhost:8080/productos/${confirmDelete}`,
                      { data: { usuario_log_id: userId, forzado: true } } // <- clave
                    );
                    setConfirmDelete(null);
                    setDeleteMeta(null);
                    fetchData();
                  } catch (error) {
                    console.error(
                      'Error al eliminar producto (forzado por proveedor):',
                      error
                    );
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar de todas formas
              </button>
            )}

            {/* Caso: combos -> solo informar */}
            {deleteMeta?.reason === 'FK_COMBO' && (
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteMeta(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Entendido
              </button>
            )}

            {/* Caso: pedidos de stock -> solo informar */}
            {deleteMeta?.reason === 'FK_PEDIDOS' && (
              <button
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteMeta(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
              >
                Entendido
              </button>
            )}
          </div>
        </Modal>
      </div>
      <AjustePreciosModal
        open={showAjustePrecios}
        onClose={() => setShowAjustePrecios(false)}
        onSuccess={() => fetchData()} // refrescar productos
      />
    </div>
  );
};

export default ProductosGet;
