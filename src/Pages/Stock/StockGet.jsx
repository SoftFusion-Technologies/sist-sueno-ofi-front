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
  FaPrint,
  FaCopy,
  FaTicketAlt,
  FaTimes
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import { useAuth } from '../../AuthContext.jsx';
import { toast, ToastContainer } from 'react-toastify';
import { ModalFeedback } from '../Ventas/Config/ModalFeedback.jsx';
import Barcode from 'react-barcode';
import { getUserId } from '../../utils/authUtils';
import SearchableSelect from './Components/SearchableSelect.jsx';

Modal.setAppElement('#root');

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const MAX_NOMBRE = 100;
// R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
const descargarPdf = async (pathWithQuery, filename, token) => {
  const url = `${API_BASE}${
    pathWithQuery.startsWith('/') ? '' : '/'
  }${pathWithQuery}`;

  console.log(url);
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('No se pudo generar/descargar el PDF');
  const blob = await res.blob();
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
// R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅

const StockGet = () => {
  const { userLevel } = useAuth();
  const UMBRAL_STOCK_BAJO = 5;
  const [stock, setStock] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    local_id: '',
    locales: [], // ← nuevo: varios locales
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
  const [localesFiltro, setLocalesFiltro] = useState([]); // [] = todos
  const [showLocalesFiltro, setShowLocalesFiltro] = useState(false);
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

  const [descargandoTicket, setDescargandoTicket] = useState(false);

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅
  const [dupOpen, setDupOpen] = useState(false);
  const [dupGroup, setDupGroup] = useState(null);
  const [dupNombre, setDupNombre] = useState('');
  const [dupCopiarCant, setDupCopiarCant] = useState(false); // por defecto NO copiar cantidades
  const [dupLoading, setDupLoading] = useState(false);
  // NUEVOS estados para el modal mejorado
  const [dupShowPreview, setDupShowPreview] = useState(false);
  const [dupLocalesSel, setDupLocalesSel] = useState([]); // ids de locales seleccionados
  const [dupShowLocales, setDupShowLocales] = useState(false); // dropdown de locales
  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅

  // R3 - PERMITIR ASIGNAR STOCK A MAS DE UN LUGAR
  const [showLocalesPicker, setShowLocalesPicker] = useState(false);
  const [localesQuery, setLocalesQuery] = useState('');

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
      setFormData({ ...item, locales: [] });
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
        locales: [],
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

    // Unificar local_id (select simple) + locales[] (multiselect)
    const localesUnicos = [
      Number(formData.local_id) || null,
      ...(Array.isArray(formData.locales) ? formData.locales.map(Number) : [])
    ].filter(Boolean);
    const localesDedupe = [...new Set(localesUnicos)];

    // ✅ Validaciones (sin talles)
    if (
      !formData.producto_id ||
      !formData.lugar_id ||
      !formData.estado_id ||
      isNaN(cantidadNumerica) ||
      cantidadNumerica < 0 ||
      (editId ? !formData.local_id : localesDedupe.length === 0)
    ) {
      setModalFeedbackMsg(
        editId
          ? 'Completa producto, local, lugar, estado y una cantidad válida.'
          : 'Completa producto, lugar, estado, cantidad y seleccioná al menos un local.'
      );
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    const usuario_log_id = getUserId();

    // Base del payload (sin talle)
    const basePayload = {
      producto_id: Number(formData.producto_id),
      lugar_id: Number(formData.lugar_id),
      estado_id: Number(formData.estado_id),
      en_exhibicion: !!formData.en_exhibicion, // si tu backend usa en_exhibicion, ajustalo aquí
      cantidad: cantidadNumerica,
      usuario_log_id
    };

    // 🔄 EDICIÓN (una fila de stock)
    if (editId) {
      try {
        const payload = {
          ...basePayload,
          local_id: Number(formData.local_id)
        };
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

    // ➕ ALTA (una o varias filas según locales seleccionados)
    try {
      if (localesDedupe.length === 1) {
        // Un solo local → un POST
        const payload = {
          ...basePayload,
          local_id: localesDedupe[0]
        };
        await axios.post(`http://localhost:8080/stock`, payload);
      } else {
        // Varios locales → un POST por local
        await Promise.all(
          localesDedupe.map((locId) =>
            axios.post(`http://localhost:8080/stock`, {
              ...basePayload,
              local_id: locId
            })
          )
        );
      }

      fetchAll();
      setModalOpen(false);
      setModalFeedbackMsg(
        localesDedupe.length > 1
          ? 'Stock creado en los locales seleccionados.'
          : 'Stock creado correctamente.'
      );
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
      await axios.delete(`http://localhost:8080/stock/${id}`, {
        data: {
          usuario_log_id: getUserId()
        }
      });

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
        estado_id: grupoAEliminar.estado_id,
        usuario_log_id: getUserId()
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

  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
  const hayImprimiblesEnGrupo = (group) =>
    Array.isArray(group?.items) &&
    group.items.some((i) => (i.cantidad ?? 0) > 0);
  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅

  const imprimirTicketGrupo = async (group, opts = {}) => {
    if (!hayImprimiblesEnGrupo(group)) {
      setModalFeedbackMsg(
        'Este grupo no tiene stock disponible para imprimir.'
      );
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    try {
      setDescargandoTicket(true);

      const producto = productos.find((p) => p.id === group.producto_id);
      const nombreProd = producto?.nombre || 'producto';

      const safeNombre = nombreProd
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      // Fecha dd-mm-aaaa
      const d = new Date();
      const fecha = [
        String(d.getDate()).padStart(2, '0'),
        String(d.getMonth() + 1).padStart(2, '0'),
        d.getFullYear()
      ].join('-');

      // Perfil robusto por defecto (Code128 1D con ALTURA FIJA + texto)
      const defaults = {
        mode: 'group',
        producto_id: String(group.producto_id),
        local_id: String(group.local_id),
        lugar_id: String(group.lugar_id),
        estado_id: String(group.estado_id),

        copies: '1', // 'qty' si querés una por unidad en stock
        minQty: '1',

        // Impresora 30×15 mm a 203dpi
        dpi: '203',
        quiet_mm: '3',

        // Valor del código: numérico por IDs (lo que el lector escanea)
        barcode_src: 'numeric',

        // ---- 1D robusto (Code128)
        symb: 'code128', // 'code128' | 'qrcode'

        // Mostrar número debajo (legible para humano)
        showText: '1', // <— AHORA ON por defecto
        text_value: 'numeric', // <— mostrar el numérico (no el slug)
        text_mode: 'shrink', // ajusta fuente a 1 línea
        text_gap_mm: '2', // separación barras–texto

        // Altura de barras y quiet interna
        min_barcode_mm: '12', // 12–14mm si el lector es exigente
        pad_modules: '6', // quiet-zone interna aprox (subí a 8 si hace falta)

        // Tipos de letra
        font_pt: '6',
        min_font_pt: '3.5'
      };

      // Permite overrides rápidos (p.ej. { text_mode: 'shrink' } )
      const params = new URLSearchParams({ ...defaults, ...opts });

      await descargarPdf(
        `/stock/etiquetas/ticket?${params.toString()}`,
        `${safeNombre}_${fecha}_ticket.pdf`
      );
    } catch (e) {
      console.error(e);
      setModalFeedbackMsg('No se pudo generar el PDF de ticket.');
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    } finally {
      setDescargandoTicket(false);
    }
  };

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅
  const abrirDuplicar = (group) => {
    setDupGroup(group);

    // nombre base
    const prod = productos.find((p) => p.id === group.producto_id);
    const nombreBase = prod?.nombre || 'Producto';
    setDupNombre(`${nombreBase} (copia)`);

    setDupCopiarCant(false);

    // 👇 resetear selección de locales al abrir
    setDupLocalesSel([]); // ← importante si en tu modal usás este estado

    setDupOpen(true);
  };

  const duplicarProducto = async () => {
    if (!dupGroup) return;

    if (!dupNombre?.trim()) {
      setModalFeedbackMsg('Ingresá un nombre nuevo para el producto.');
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    try {
      setDupLoading(true);

      const prodId = dupGroup.producto_id;

      // ¿hay locales seleccionados en el modal?
      const hayLocales =
        Array.isArray(dupLocalesSel) && dupLocalesSel.length > 0;

      const body = {
        nuevoNombre: dupNombre.trim(),
        duplicarStock: true,
        copiarCantidad: dupCopiarCant,
        generarSku: true,

        // ✅ MODO A: duplicar SOLO este grupo (si no eligieron locales)
        ...(!hayLocales
          ? {
              soloGrupo: true,
              local_id: dupGroup.local_id,
              lugar_id: dupGroup.lugar_id,
              estado_id: dupGroup.estado_id
            }
          : {}),

        // ✅ MODO B: duplicar por lista de locales (si eligieron en el modal)
        ...(hayLocales
          ? {
              locales: dupLocalesSel
            }
          : {})
      };

      const { data } = await axios.post(
        `http://localhost:8080/productos/${prodId}/duplicar`,
        body
      );

      setModalFeedbackMsg(
        `Producto duplicado. Nuevo ID: ${data.nuevo_producto_id}`
      );
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);

      setDupOpen(false);
      await fetchAll();
    } catch (e) {
      setModalFeedbackMsg(
        `No se pudo duplicar el producto. ${
          e?.response?.data?.mensajeError || e.message
        }`
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    } finally {
      setDupLoading(false);
    }
  };

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅

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

            // locales (además del actual) donde este producto tiene stock > 0
            const otrosLocalesConStock = (() => {
              const tot = new Map(); // local_id -> total
              for (const s of stock) {
                if (s.producto_id === group.producto_id) {
                  tot.set(
                    s.local_id,
                    (tot.get(s.local_id) || 0) + (Number(s.cantidad) || 0)
                  );
                }
              }
              const idsConStock = [...tot.entries()]
                .filter(([, q]) => q > 0)
                .map(([id]) => id);

              // mapeamos a objetos de "locales", excluyendo el local actual del grupo
              return locales.filter(
                (l) => idsConStock.includes(l.id) && l.id !== group.local_id
              );
            })();

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
                {otrosLocalesConStock.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-white/70">También en:</span>
                    {otrosLocalesConStock.map((l) => (
                      <span
                        key={l.id}
                        className="px-2 py-1 rounded-full bg-white/10 border border-white/10"
                      >
                        {l.nombre}
                      </span>
                    ))}
                  </div>
                )}
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
                      {/* Botón Imprimir TICKET por grupo (30×15) */}
                      <button
                        type="button"
                        onClick={() => imprimirTicketGrupo(group)}
                        disabled={
                          descargandoTicket || !hayImprimiblesEnGrupo(group)
                        }
                        className={`mt-2 mb-2 px-3 py-1 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60
    ${
      hayImprimiblesEnGrupo(group)
        ? 'bg-orange-500 hover:bg-orange-400'
        : 'bg-white/20 cursor-not-allowed'
    }`}
                        title={
                          hayImprimiblesEnGrupo(group)
                            ? 'Imprimir TICKET 30×15 del grupo'
                            : 'Sin stock para imprimir'
                        }
                      >
                        <FaTicketAlt className="text-orange-200" />
                        {descargandoTicket ? '' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirDuplicar(group)}
                        className="mt-2 mb-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                        title="Duplicar producto"
                      >
                        <FaCopy className="text-blue-200" />
                      </button>
                      <button
                        onClick={() => {
                          openModal(null, group); // null para item, group como segundo argumento
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          setGrupoAEliminar(group);
                          setOpenConfirm(true);
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaTrash />
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
            {/* Producto */}
            <SearchableSelect
              label="Producto"
              items={productos}
              value={formData.producto_id}
              onChange={(id) =>
                setFormData((fd) => ({ ...fd, producto_id: Number(id) || '' }))
              }
              required
              placeholder="Buscar o seleccionar producto…"
            />

            {/* Local (single). Si eligen multi-locales más abajo, este deja de ser requerido */}
            <SearchableSelect
              label="Local"
              items={locales}
              value={formData.local_id}
              onChange={(id) =>
                setFormData((fd) => ({ ...fd, local_id: Number(id) || '' }))
              }
              required={!(formData.locales?.length > 0)}
              placeholder="Buscar local…"
            />

            {/* Lugar */}
            <SearchableSelect
              label="Lugar"
              items={lugares}
              value={formData.lugar_id}
              onChange={(id) =>
                setFormData((fd) => ({ ...fd, lugar_id: Number(id) || '' }))
              }
              required
              placeholder="Buscar lugar…"
            />

            {/* Estado */}
            <SearchableSelect
              label="Estado"
              items={estados}
              value={formData.estado_id}
              onChange={(id) =>
                setFormData((fd) => ({ ...fd, estado_id: Number(id) || '' }))
              }
              required
              placeholder="Buscar estado…"
            />

            {/* 🔹 NUEVO: selección múltiple de locales (solo en alta/edición de grupo) */}
            {!editId && (
              <div className="relative">
                <label className="block font-semibold mb-1">
                  Locales (múltiple)
                </label>

                {/* Botón que abre el picker */}
                <button
                  type="button"
                  onClick={() => setShowLocalesPicker((v) => !v)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white flex items-center justify-between"
                >
                  <span className="text-left truncate">
                    {formData.locales?.length
                      ? `Seleccionados: ${formData.locales.length}`
                      : 'Seleccionar uno o más…'}
                  </span>
                  {/* <FaChevronDown className="opacity-60" /> */}
                </button>

                {/* Chips de selección actual */}
                {formData.locales?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.locales
                      .map((id) => locales.find((l) => l.id === id))
                      .filter(Boolean)
                      .map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs"
                        >
                          {l.nombre}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((fd) => ({
                                ...fd,
                                locales: fd.locales.filter((x) => x !== l.id)
                              }))
                            }
                            className="hover:text-cyan-900"
                            title="Quitar"
                          >
                            {/* <FaTimes /> */}×
                          </button>
                        </span>
                      ))}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((fd) => ({ ...fd, locales: [] }))
                      }
                      className="text-xs text-gray-600 underline"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                {/* Popover */}
                {showLocalesPicker && (
                  <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-xl shadow-xl p-2">
                    {/* Buscador + acciones rápidas */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 relative">
                        {/* <FaSearch className="absolute left-2 top-2.5 text-gray-400" /> */}
                        <input
                          type="text"
                          value={localesQuery}
                          onChange={(e) => setLocalesQuery(e.target.value)}
                          placeholder="Buscar local…"
                          className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((fd) => ({
                            ...fd,
                            locales: locales
                              .filter((l) =>
                                l.nombre
                                  .toLowerCase()
                                  .includes(localesQuery.toLowerCase())
                              )
                              .map((l) => l.id)
                          }))
                        }
                        className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        title="Seleccionar todos (filtrados)"
                      >
                        Seleccionar todos
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((fd) => ({ ...fd, locales: [] }))
                        }
                        className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Limpiar
                      </button>
                    </div>

                    {/* Lista con checkboxes */}
                    <div className="space-y-1">
                      {locales
                        .filter((l) =>
                          l.nombre
                            .toLowerCase()
                            .includes(localesQuery.toLowerCase())
                        )
                        .map((l) => {
                          const checked = formData.locales.includes(l.id);
                          return (
                            <label
                              key={l.id}
                              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setFormData((fd) => ({
                                    ...fd,
                                    locales: e.target.checked
                                      ? [...new Set([...fd.locales, l.id])]
                                      : fd.locales.filter((id) => id !== l.id)
                                  }));
                                }}
                              />
                              <span className="text-sm">{l.nombre}</span>
                              {checked && (
                                <span className="ml-auto text-xs text-cyan-700">
                                  ✓
                                </span>
                              )}
                            </label>
                          );
                        })}
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLocalesPicker(false)}
                        className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLocalesPicker(false)}
                        className="px-3 py-1 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Si seleccionás al menos un local acá, ignoramos el campo
                  “Local” de arriba.
                </p>
              </div>
            )}
            {editId && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Código SKU (Generado automáticamente)
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

      {dupOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDupOpen(false);
            if (
              e.key === 'Enter' &&
              dupNombre.trim() &&
              dupNombre.trim().length <= MAX_NOMBRE &&
              !dupLoading
            )
              duplicarProducto();
          }}
        >
          <div className="w-full max-w-2xl bg-zinc-900/95 text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-start justify-between border-b border-white/10">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FaCopy className="text-blue-300" /> Duplicar producto
                </h3>
                <p className="text-xs text-white/70">
                  Producto ID {dupGroup?.producto_id}
                </p>
                {!!productos?.length && (
                  <p className="text-sm text-white/80">
                    {productos.find((p) => p.id === dupGroup?.producto_id)
                      ?.nombre ?? '—'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDupOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Resumen pills (sin talles) */}
              {(() => {
                const items = dupGroup?.items || [];
                const totalItems = items.length;
                const totalQty = items.reduce(
                  (a, i) => a + (i.cantidad ?? 0),
                  0
                );

                const localName =
                  locales.find((l) => l.id === dupGroup?.local_id)?.nombre ??
                  `Local ${dupGroup?.local_id}`;
                const lugarName =
                  lugares.find((l) => l.id === dupGroup?.lugar_id)?.nombre ??
                  `Lugar ${dupGroup?.lugar_id}`;
                const estadoName =
                  estados.find((e) => e.id === dupGroup?.estado_id)?.nombre ??
                  `Estado ${dupGroup?.estado_id}`;

                return (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Ítems: <b>{totalItems}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Stock total: <b>{totalQty}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Local: <b>{localName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Lugar: <b>{lugarName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Estado: <b>{estadoName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      {dupCopiarCant ? 'Copiando stock' : 'Cantidades = 0'}
                    </span>
                  </div>
                );
              })()}

              {/* Nombre + validación y contador */}
              {(() => {
                const nameExists = productos.some(
                  (p) =>
                    p.id !== dupGroup?.producto_id &&
                    (p.nombre || '').trim().toLowerCase() ===
                      dupNombre.trim().toLowerCase()
                );
                const tooLong = dupNombre.trim().length > MAX_NOMBRE;
                const invalid = !dupNombre.trim() || tooLong;

                // guardamos la condición para el botón
                window.__dupInvalid = invalid;

                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">
                        Nuevo nombre
                      </label>
                      <span
                        className={`text-xs ${
                          tooLong ? 'text-red-300' : 'text-white/50'
                        }`}
                      >
                        {dupNombre.trim().length}/{MAX_NOMBRE}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={dupNombre}
                        onChange={(e) => setDupNombre(e.target.value)}
                        autoFocus
                        className={`mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2
                    ${
                      invalid
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-white/10 focus:ring-purple-500'
                    }`}
                        placeholder="Ingresá el nuevo nombre…"
                      />
                      {!!dupNombre && (
                        <button
                          type="button"
                          onClick={() => setDupNombre('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          aria-label="Limpiar"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-xs">
                      <p className="text-white/60">
                        Se copiará la <b>estructura de stock</b> del producto
                        original.
                      </p>
                      {nameExists && (
                        <p className="text-yellow-300 mt-1">
                          Ya existe otro producto con este nombre. Podés
                          continuar, pero conviene diferenciarlo.
                        </p>
                      )}
                      {tooLong && (
                        <p className="text-red-300 mt-1">
                          Máximo {MAX_NOMBRE} caracteres.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Opciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    id="chk-copiar-cant"
                    type="checkbox"
                    checked={dupCopiarCant}
                    onChange={(e) => setDupCopiarCant(e.target.checked)}
                    className="h-4 w-4 accent-purple-600"
                  />
                  <span className="text-sm">Copiar stock</span>
                </label>

                {/* Dropdown de Locales (Req 3 listo) */}
                {/* <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDupShowLocales((v) => !v)}
                    className="w-full text-left text-sm text-white/90 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <span>
                      {dupLocalesSel.length === 0
                        ? 'Todos los locales'
                        : `Locales seleccionados: ${dupLocalesSel.length}`}
                    </span>
                    <span className="text-white/60">
                      {dupShowLocales ? '▲' : '▼'}
                    </span>
                  </button>
                  {dupShowLocales && (
                    <div className="absolute mt-2 w-full bg-zinc-900/95 border border-white/10 rounded-xl shadow-xl z-[130] p-2 max-h-56 overflow-auto">
                      <div className="flex items-center justify-between px-2 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDupLocalesSel(locales.map((l) => l.id))
                          }
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setDupLocalesSel([])}
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Limpiar
                        </button>
                      </div>
                      {locales.map((l) => {
                        const checked = dupLocalesSel.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-purple-600"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...dupLocalesSel, l.id]
                                  : dupLocalesSel.filter((id) => id !== l.id);
                                setDupLocalesSel(next);
                              }}
                            />
                            <span className="text-sm">{l.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div> */}
              </div>

              {/* Preview SKU (sin talle) */}
              {(() => {
                const localName = locales.find(
                  (l) => l.id === dupGroup?.local_id
                )?.nombre;
                const lugarName = lugares.find(
                  (g) => g.id === dupGroup?.lugar_id
                )?.nombre;
                const estadoName = estados.find(
                  (e) => e.id === dupGroup?.estado_id
                )?.nombre;

                // 🔧 Si tenías un helper buildSkuPreview que incluía talleNombre, ajustalo a esta firma.
                const buildSkuPreview = ({
                  productoNombre,
                  localNombre,
                  lugarNombre,
                  estadoNombre
                }) => {
                  const parts = [
                    (productoNombre || '').trim(),
                    localNombre,
                    lugarNombre,
                    estadoNombre
                  ].filter(Boolean);
                  return parts.join(' · ');
                };

                const productoNombre =
                  dupNombre ||
                  productos.find((p) => p.id === dupGroup?.producto_id)
                    ?.nombre ||
                  '';

                const exampleSku = buildSkuPreview({
                  productoNombre,
                  localNombre: localName,
                  lugarNombre: lugarName,
                  estadoNombre: estadoName
                });

                return (
                  <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-white/90 font-semibold">
                      Preview SKU:
                    </span>{' '}
                    {exampleSku}
                  </div>
                );
              })()}

              {/* Detalle de stock (sin talles) */}
              <button
                type="button"
                onClick={() => setDupShowPreview((v) => !v)}
                className="w-full text-left text-sm text-white/80 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2"
              >
                <span>Ver detalle de stock</span>
                <span className="text-white/60">
                  {dupShowPreview ? '▲' : '▼'}
                </span>
              </button>

              {dupShowPreview && (
                <div className="max-h-56 overflow-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Ítem</th>
                        <th className="text-right px-3 py-2">
                          Cantidad origen
                        </th>
                        <th className="text-right px-3 py-2">
                          Cantidad destino
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dupGroup?.items || []).map((it) => (
                        <tr key={it.id} className="border-t border-white/10">
                          <td className="px-3 py-2">
                            {/* Si querés más info, podés incluir: `ID ${it.id}` o nombre del producto */}
                            ID {it.id}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {it.cantidad ?? 0}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {dupCopiarCant ? it.cantidad ?? 0 : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setDupOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => duplicarProducto(dupLocalesSel)}
                disabled={
                  dupLoading ||
                  !dupNombre.trim() ||
                  dupNombre.trim().length > MAX_NOMBRE
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                title={
                  !dupNombre.trim()
                    ? 'Ingresá un nombre'
                    : dupNombre.trim().length > MAX_NOMBRE
                    ? `Máximo ${MAX_NOMBRE} caracteres`
                    : ''
                }
              >
                {dupLoading ? 'Duplicando…' : 'Duplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
