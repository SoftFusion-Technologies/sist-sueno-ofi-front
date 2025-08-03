// src/Pages/Ventas/PuntoVenta.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCashRegister,
  FaSearch,
  FaShoppingCart,
  FaTrash,
  FaMinus,
  FaPlus,
  FaUser,
  FaUserAlt,
  FaCheckCircle,
  FaUserPlus,
  FaBarcode,
  FaBoxOpen,
  FaCubes
} from 'react-icons/fa';
import ParticlesBackground from '../../Components/ParticlesBackground';
import ModalNuevoCliente from '../../Components/Ventas/ModalNuevoCliente';
import { FaCog } from 'react-icons/fa';
import { dynamicIcon } from '../../utils/dynamicIcon'; // Lo creamos abajo
import ModalMediosPago from '../../Components/Ventas/ModalMediosPago'; // Lo creamos abajo
import axios from 'axios';
import { useAuth } from '../../AuthContext'; // Ajustá el path si es necesario
import TicketVentaModal from './Config/TicketVentaModal';
import TotalConOpciones from './Components/TotalConOpciones';
// Agrupa productos por producto_id y junta sus talles en un array
function agruparProductosConTalles(stockItems) {
  const map = new Map();

  stockItems.forEach((item) => {
    const productoNombre = item.nombre || 'Producto desconocido';
    const productoPrecio = parseFloat(item.precio || 0);

    if (!map.has(item.producto_id)) {
      map.set(item.producto_id, {
        id: item.producto_id,
        producto_id: item.producto_id,
        nombre: productoNombre,
        precio: productoPrecio,
        descuento_porcentaje: parseFloat(item.descuento_porcentaje) || 0,
        precio_con_descuento:
          parseFloat(item.precio_con_descuento) || productoPrecio,
        talles: []
      });
    }

    const producto = map.get(item.producto_id);

    producto.talles.push({
      id: item.talle_id,
      nombre: item.talle_nombre || 'Sin talle',
      cantidad: item.cantidad_disponible,
      stock_id: item.stock_id,
      codigo_sku: item.codigo_sku
    });
  });

  return Array.from(map.values());
}

export default function PuntoVenta() {
  const navigate = useNavigate();
  const [mediosPago, setMediosPago] = useState([]);
  const [loadingMediosPago, setLoadingMediosPago] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [medioPago, setMedioPago] = useState(null);
  const { userId, userLocalId } = useAuth();
  const [modalNuevoClienteOpen, setModalNuevoClienteOpen] = useState(false);
  const [aplicarDescuento, setAplicarDescuento] = useState(true);
  const [descuentoPersonalizado, setDescuentoPersonalizado] = useState('');
  const [usarDescuentoPorProducto, setUsarDescuentoPorProducto] = useState({});
  const [modalUsarDescuento, setModalUsarDescuento] = useState(true);

  const [mostrarModalCaja, setMostrarModalCaja] = useState(false);
  const [mensajeCaja, setMensajeCaja] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [confirmarAbrirCaja, setConfirmarAbrirCaja] = useState(false);

  const inputRef = useRef(); // input invisible
  const buscadorRef = useRef(); // buscador manual

  const [modoEscaner, setModoEscaner] = useState(false); // Arranca en manual

  const [modalVerCombosOpen, setModalVerCombosOpen] = useState(false);
  const [combosModal, setCombosModal] = useState([]);
  const [modalComboSearch, setModalComboSearch] = useState('');

  const [comboSeleccionado, setComboSeleccionado] = useState(null);
  const [combosSeleccionados, setCombosSeleccionados] = useState([]);

  useEffect(() => {
    if (modoEscaner) {
      inputRef.current && inputRef.current.focus();
    } else {
      buscadorRef.current && buscadorRef.current.focus();
    }
  }, [modoEscaner]);

  // Función para toggle checkbox
  const toggleDescuento = (id) => {
    setUsarDescuentoPorProducto((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  // Traer medios de pago al montar
  useEffect(() => {
    setLoadingMediosPago(true);
    axios
      .get('http://localhost:8080/medios-pago')
      .then((res) => setMediosPago(res.data))
      .finally(() => setLoadingMediosPago(false));
  }, []);

  useEffect(() => {
    if (!loadingMediosPago && mediosPago.length > 0 && medioPago == null) {
      // Busca el medio de pago con id === 1 (efectivo)
      const efectivo = mediosPago.find((m) => m.id === 1);
      if (efectivo) setMedioPago(efectivo.id);
      else setMedioPago(mediosPago[0].id); // fallback: primero de la lista
    }
  }, [loadingMediosPago, mediosPago]);

  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]); // Productos agrupados con talles
  const [carrito, setCarrito] = useState([]);

  const [modalProducto, setModalProducto] = useState(null);
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  const [modalVerProductosOpen, setModalVerProductosOpen] = useState(false);
  const [productosModal, setProductosModal] = useState([]);
  const [ventaFinalizada, setVentaFinalizada] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const delay = setTimeout(() => {
      if (busqueda.trim() !== '') {
        setLoading(true); // Spinner pro
        fetch(
          `http://localhost:8080/buscar-productos-detallado?query=${encodeURIComponent(
            busqueda
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (!ignore) {
              setProductos(
                Array.isArray(data) ? agruparProductosConTalles(data) : []
              );
            }
          })
          .catch(() => {
            if (!ignore) setProductos([]);
          })
          .finally(() => {
            if (!ignore) setLoading(false);
          });
      } else {
        setProductos([]);
      }
    }, 0); // o 350ms

    return () => {
      clearTimeout(delay);
      ignore = true;
    };
  }, [busqueda]);

  // Agregar producto al carrito
  const agregarAlCarrito = (producto, talle, usarDesc) => {
    const stockId = talle.stock_id;
    setCarrito((prev) => {
      const existe = prev.find((i) => i.stock_id === stockId);
      if (existe) {
        if (existe.cantidad >= talle.cantidad) return prev;
        return prev.map((i) =>
          i.stock_id === stockId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }

      return [
        ...prev,
        {
          stock_id: stockId,
          producto_id: producto.producto_id,
          nombre: `${producto.nombre} - ${talle.nombre}`,
          precio_original: producto.precio,
          precio_con_descuento:
            producto.precio_con_descuento ?? producto.precio,
          precio: usarDesc
            ? producto.precio_con_descuento ?? producto.precio
            : producto.precio,
          descuentoPorcentaje: usarDesc
            ? producto.descuento_porcentaje ?? 0
            : 0, // 👈 esto es clave

          talla_id: talle.id,
          cantidad_disponible: talle.cantidad,
          cantidad: 1
        }
      ];
    });
    setModalProducto(null);
    setTalleSeleccionado(null);
  };

  // Manejo click para agregar producto (modal si tiene varios talles)
  const manejarAgregarProducto = (producto, usarDesc) => {
    if (!producto.talles || producto.talles.length === 0) return;

    if (producto.talles.length === 1) {
      agregarAlCarrito(producto, producto.talles[0], usarDesc);
    } else {
      setModalProducto(producto);
      setTalleSeleccionado(null);
      setModalUsarDescuento(usarDesc); // inicializar modal con ese valor si usas modal
    }
  };

  useEffect(() => {
    setCarrito((prev) =>
      prev.map((item) => {
        const aplicarDesc = usarDescuentoPorProducto[item.producto_id] ?? true;

        const nuevoPrecio = aplicarDesc
          ? item.precio_con_descuento ?? item.precio_original
          : item.precio_original;

        // Solo actualiza si el precio cambió para evitar renders innecesarios
        if (item.precio !== nuevoPrecio) {
          return {
            ...item,
            precio: nuevoPrecio
          };
        }

        return item;
      })
    );
  }, [usarDescuentoPorProducto]);

  const cambiarCantidad = (stockId, delta) =>
    setCarrito((prev) =>
      prev
        .map((it) =>
          it.stock_id === stockId
            ? {
                ...it,
                cantidad: Math.max(
                  1,
                  Math.min(it.cantidad + delta, it.cantidad_disponible)
                )
              }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );

  const quitarProducto = (stockId) =>
    setCarrito((prev) => prev.filter((i) => i.stock_id !== stockId));

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const productosRequest = carrito.map((item) => ({
    stock_id: item.stock_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio
  }));

  const [mostrarValorTicket, setMostrarValorTicket] = useState(true);

  const formatearPrecio = (valor) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);

  const abrirModalVerProductos = async () => {
    setModalVerProductosOpen(true);
    try {
      const res = await fetch(
        'http://localhost:8080/buscar-productos-detallado?query='
      );
      const data = await res.json();
      setProductosModal(data);
    } catch (error) {
      console.error('Error al cargar productos para el modal:', error);
    }
  };

  const abrirModalVerCombos = async () => {
    setModalVerCombosOpen(true);
    try {
      const res = await fetch('http://localhost:8080/combos');
      const data = await res.json();
      setCombosModal(data);
    } catch (error) {
      console.error('Error al cargar combos para el modal:', error);
    }
  };

  const filteredCombosModal = combosModal.filter((combo) =>
    combo.nombre.toLowerCase().includes(modalComboSearch.toLowerCase())
  );

  const seleccionarProductoModal = (productoConTalle) => {
    // productoConTalle tiene todas las propiedades de producto + talle
    // Construimos un "producto" y "talle" para pasar a agregarAlCarrito

    const producto = {
      producto_id: productoConTalle.producto_id,
      nombre: productoConTalle.nombre,
      precio: productoConTalle.precio
    };

    const talle = {
      id: productoConTalle.talle_id,
      nombre: productoConTalle.talle_nombre,
      cantidad: productoConTalle.cantidad_disponible,
      stock_id: productoConTalle.stock_id
    };

    agregarAlCarrito(producto, talle);
    setModalVerProductosOpen(false);
  };
  const seleccionarCombo = async (combo) => {
    try {
      const res = await fetch(
        `http://localhost:8080/combo-productos-permitidos/${combo.id}`
      );
      const permitidos = await res.json();

      const productosDirectos = permitidos.filter((p) => p.producto);

      const productosSeleccionados = [];

      for (const item of productosDirectos) {
        const producto = item.producto;

        const resStock = await fetch(
          `http://localhost:8080/buscar-productos-detallado?query=${producto.id}`
        );
        const stockData = await resStock.json();

        if (stockData.length > 0) {
          const talleDisponible = stockData[0];

          const productoData = {
            producto_id: producto.id,
            nombre: producto.nombre,
            precio: parseFloat(combo.precio_fijo) / combo.cantidad_items // Reparto proporcional
          };

          const talle = {
            id: talleDisponible.talle_id,
            nombre: talleDisponible.talle_nombre,
            cantidad: talleDisponible.cantidad_disponible,
            stock_id: talleDisponible.stock_id
          };

          // 👇 Agregar al carrito
          agregarAlCarrito(productoData, talle, false);

          // 👇 Agregar al listado para combosSeleccionados
          productosSeleccionados.push({
            stock_id: talleDisponible.stock_id
          });
        }
      }

      // 🔥 Guardar combo seleccionado con sus productos usados
      if (productosSeleccionados.length > 0) {
        setCombosSeleccionados((prev) => [
          ...prev,
          {
            combo_id: combo.id,
            precio_combo: parseFloat(combo.precio_fijo),
            productos: productosSeleccionados
          }
        ]);
      }

      setModalVerCombosOpen(false);
    } catch (error) {
      console.error('Error al seleccionar combo:', error);
    }
  };

  const [modalSearch, setModalSearch] = useState('');
  const filteredProductosModal = productosModal.filter((prod) =>
    prod.nombre.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const handleBusquedaCliente = async (e) => {
    setBusquedaCliente(e.target.value);
    if (e.target.value.length > 2) {
      try {
        const res = await fetch(
          `http://localhost:8080/clientes/search?query=${encodeURIComponent(
            e.target.value
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          setSugerencias(data);
        } else if (res.status === 404) {
          setSugerencias([]); // No hay resultados, es válido
        } else {
          // Otro error de red
          setSugerencias([]);
        }
      } catch (err) {
        setSugerencias([]); // Error de red/fetch
      }
    } else {
      setSugerencias([]);
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.nombre);
    setSugerencias([]);
  };

  function calcularTotalAjustado(precioBase, ajuste) {
    return parseFloat((precioBase * (1 + ajuste / 100)).toFixed(2));
  }
  const medioSeleccionado = mediosPago.find((m) => m.id === medioPago);
  const ajuste = medioSeleccionado?.ajuste_porcentual || 0;

  const totalBase = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const totalAjustado = calcularTotalAjustado(totalBase, ajuste);

  const [cuotasDisponibles, setCuotasDisponibles] = useState([]);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState(1);
  const [totalCalculado, setTotalCalculado] = useState(null);

  // useEffect(() => {
  //   if (!totalCalculado) return; // 🟢 Esto lo previene

  //   let total = totalCalculado.precio_base;
  //   let ajuste = 0;
  //   if (aplicarDescuento && descuentoPersonalizado !== '') {
  //     ajuste = parseFloat(descuentoPersonalizado);
  //     if (!isNaN(ajuste) && ajuste > 0) {
  //       total = total * (1 - ajuste / 100);
  //     }
  //   } else if (aplicarDescuento && totalCalculado.ajuste_porcentual < 0) {
  //     ajuste = Math.abs(totalCalculado.ajuste_porcentual);
  //     total = total * (1 - ajuste / 100);
  //   }
  //   // ...
  // }, [totalCalculado, descuentoPersonalizado, aplicarDescuento]);

  useEffect(() => {
    if (!medioPago) return;

    const cargarCuotas = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/cuotas-medios-pago/${medioPago}`
        );
        setCuotasDisponibles(res.data);
        setCuotasSeleccionadas(1); // reset por defecto
      } catch (err) {
        setCuotasDisponibles([]);
      }
    };

    cargarCuotas();
  }, [medioPago]);

  useEffect(() => {
    const calcularTotal = async () => {
      if (!medioPago || carrito.length === 0) return;

      const precio_base = carrito.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );

      // Armar el payload con descuento personalizado si corresponde
      let payload = {
        carrito,
        medio_pago_id: medioPago,
        cuotas: cuotasSeleccionadas
      };
      // Si hay descuento personalizado y se está aplicando, incluilo
      if (
        aplicarDescuento &&
        descuentoPersonalizado !== '' &&
        !isNaN(Number(descuentoPersonalizado))
      ) {
        payload.descuento_personalizado = Number(descuentoPersonalizado);
      }

      try {
        const res = await axios.post(
          'http://localhost:8080/calcular-total-final',
          payload
        );
        setTotalCalculado(res.data);
      } catch (err) {
        console.error('Error al calcular total', err);
      }
    };

    calcularTotal();
    // Ahora dependé también de estos estados 👇
  }, [
    carrito,
    medioPago,
    cuotasSeleccionadas,
    aplicarDescuento,
    descuentoPersonalizado
  ]);

  const cuotasUnicas = Array.from(
    new Set([1, ...cuotasDisponibles.map((c) => c.cuotas)])
  ).sort((a, b) => a - b);

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      alert('Agregá productos al carrito.');
      return;
    }
    if (!medioPago) {
      alert('Seleccioná un medio de pago.');
      return;
    }
    if (!window.confirm('¿Deseás registrar la venta?')) return;

    const productosRequest = carrito.map((item) => {
      const precioOriginal = item.producto?.precio || item.precio; // fallback si no tenés producto.precio
      const precioFinal = item.precio_con_descuento ?? item.precio;
      const descuento = precioOriginal - precioFinal;
      const descuentoPorcentaje =
        descuento > 0 && precioOriginal > 0
          ? (descuento / precioOriginal) * 100
          : 0;

      return {
        stock_id: item.stock_id,
        cantidad: item.cantidad,
        precio_unitario: precioOriginal,
        descuento: descuento,
        descuento_porcentaje: descuentoPorcentaje.toFixed(2),
        precio_unitario_con_descuento: precioFinal
      };
    });

    // 🔢 Calcular orígenes de descuento
    const origenes_descuento = [];

    // 1. Descuentos por producto
    carrito.forEach((item) => {
      if (item.descuentoPorcentaje && item.descuentoPorcentaje > 0) {
        origenes_descuento.push({
          tipo: 'producto',
          referencia_id: item.producto_id ?? null,
          detalle: item.nombre ?? 'Producto sin nombre',
          porcentaje: item.descuentoPorcentaje,
          monto:
            item.descuentoPorcentaje > 0
              ? (item.precio_original * item.descuentoPorcentaje) / 100
              : 0
        });
      }
    });

    // Bandera si hay descuento manual
    const hayDescuentoManual =
      aplicarDescuento &&
      descuentoPersonalizado !== '' &&
      parseFloat(descuentoPersonalizado) > 0;

    // 2. Descuento por medio de pago (solo si NO hay manual)
    if (
      aplicarDescuento && // esta es la condición clave
      !hayDescuentoManual &&
      totalCalculado.ajuste_porcentual !== 0
    ) {
      origenes_descuento.push({
        tipo: 'medio_pago',
        referencia_id: medioPago,
        detalle:
          mediosPago.find((m) => m.id === medioPago)?.nombre || 'Medio de pago',
        porcentaje: totalCalculado.ajuste_porcentual,
        monto:
          (totalCalculado.precio_base * totalCalculado.ajuste_porcentual) / 100
      });
    }

    // 3. Descuento manual (tiene prioridad)
    if (hayDescuentoManual) {
      origenes_descuento.push({
        tipo: 'manual',
        referencia_id: null,
        detalle: 'Descuento personalizado',
        porcentaje: parseFloat(descuentoPersonalizado),
        monto:
          (totalCalculado.precio_base * parseFloat(descuentoPersonalizado)) /
          100
      });
    }

    const totalFinalCalculado = aplicarDescuento
      ? totalCalculado.total
      : totalCalculado.precio_base;

    const ventaRequest = {
      cliente_id: clienteSeleccionado ? clienteSeleccionado.id : null,
      productos: productosRequest,
      combos: combosSeleccionados,
      total: totalFinalCalculado, // Total sin descuentos ni recargos
      medio_pago_id: medioPago,
      usuario_id: userId,
      local_id: userLocalId,
      descuento_porcentaje:
        aplicarDescuento && descuentoPersonalizado !== ''
          ? parseFloat(descuentoPersonalizado)
          : aplicarDescuento && totalCalculado.ajuste_porcentual < 0
          ? Math.abs(totalCalculado.ajuste_porcentual)
          : 0,
      recargo_porcentaje:
        aplicarDescuento && totalCalculado.ajuste_porcentual > 0
          ? totalCalculado.ajuste_porcentual
          : 0,
      aplicar_descuento: aplicarDescuento, // Flag para backend
      origenes_descuento: origenes_descuento,
      cuotas: totalCalculado.cuotas,
      monto_por_cuota: totalCalculado?.monto_por_cuota ?? null,
      porcentaje_recargo_cuotas: totalCalculado?.porcentaje_recargo_cuotas ?? 0,
      diferencia_redondeo: totalCalculado?.diferencia_redondeo ?? 0,
      precio_base: totalCalculado.precio_base,
      recargo_monto_cuotas: totalCalculado?.recargo_monto_cuotas ?? 0
    };

    try {
      const response = await fetch('http://localhost:8080/ventas/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        const msg = error.mensajeError || 'Error al registrar la venta';

        if (msg.toLowerCase().includes('caja abierta')) {
          setMensajeCaja(msg);
          setMostrarModalCaja(true);
        } else {
          alert(msg);
        }
        return;
      }

      setCarrito([]);
      setBusqueda('');
      // 👇 LIMPIÁ el input de descuento y el radio
      setDescuentoPersonalizado('');
      setAplicarDescuento(false);
      if (busqueda.trim() !== '') {
        fetch(
          `http://localhost:8080/buscar-productos-detallado?query=${encodeURIComponent(
            busqueda
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            const agrupados = agruparProductosConTalles(data);
            setProductos(agrupados);
          });
      }
      const data = await response.json();
      const ventaId = data.venta_id;

      const ventaCompleta = await fetch(
        `http://localhost:8080/ventas/${ventaId}`
      ).then((r) => r.json());
      setVentaFinalizada(ventaCompleta);
      alert('✅ Venta registrada correctamente');

      setCarrito([]);
      setClienteSeleccionado(null);
      setBusquedaCliente('');
    } catch (err) {
      alert('Error de red al registrar la venta');
      console.error('Error:', err);
    }
  };

  const abrirCaja = async () => {
    if (
      !saldoInicial ||
      isNaN(parseFloat(saldoInicial)) ||
      parseFloat(saldoInicial) < 0
    ) {
      alert('Ingresá un saldo inicial válido');
      return false;
    }
    try {
      const res = await axios.post(`http://localhost:8080/caja`, {
        usuario_id: userId,
        local_id: userLocalId,
        saldo_inicial: parseFloat(saldoInicial)
      });
      setSaldoInicial('');
      return true; // ✅ apertura exitosa
    } catch (err) {
      alert(err.response?.data?.mensajeError || 'Error al abrir caja');
      return false;
    }
  };

  const abrirModalNuevoCliente = () => setModalNuevoClienteOpen(true);

  const buscarProductoPorCodigo = (codigo) => {
    if (!codigo) return;

    fetch(
      `http://localhost:8080/buscar-productos-detallado?query=${encodeURIComponent(
        codigo
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Elegimos el primer resultado (el código debe ser único)
          const prod = data[0];
          // Llamamos a tu función para sumar al carrito, con la info correcta
          agregarAlCarrito(
            {
              producto_id: prod.producto_id,
              nombre: prod.nombre,
              precio: prod.precio
            },
            {
              stock_id: prod.stock_id,
              id: prod.talle_id,
              nombre: prod.talle_nombre,
              cantidad: prod.cantidad_disponible
            }
          );
        } else {
          alert('Producto no encontrado o sin stock');
        }
      })
      .catch((err) => {
        console.error('Error al buscar producto por código:', err);
        alert('Error al buscar producto');
      });
  };

  // Si el input pierde el foco, volvelo a enfocar después de un pequeño delay
  const handleBlur = () => {
    setTimeout(() => {
      inputRef.current && inputRef.current.focus();
    }, 100);
  };

  // Cuando se presiona ENTER, procesá el valor escaneado
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      buscarProductoPorCodigo(e.target.value.trim());
      e.target.value = ''; // Limpia el input invisible

      // Si querés volver automáticamente a manual después de escanear:
      setModoEscaner(false); // Opcional, si el flujo es escanear uno y buscar a mano
      // O dejá en modo escáner si vas a escanear varios
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6 text-white">
      <ParticlesBackground />
      {/* <ButtonBack /> */}
      <h1 className="text-3xl font-bold mb-6 titulo uppercase flex items-center gap-3 text-emerald-400">
        <FaCashRegister /> Punto de Venta
      </h1>

      <div className="mb-4 w-full max-w-2xl">
        <label className="block text-xl font-bold mb-1 text-gray-200">
          Cliente
        </label>

        <div className="relative w-full max-w-3xl mb-6 flex items-center gap-2">
          {/* Input + icono */}
          <div className="relative flex-grow">
            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 text-lg" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre, DNI o teléfono..."
              value={busquedaCliente}
              onChange={handleBusquedaCliente}
              className="pl-10 pr-4 py-3 w-full rounded-xl bg-[#232323] text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow"
              autoComplete="off"
            />
            {/* SUGERENCIAS */}
            {sugerencias.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-[#191919] shadow-xl rounded-xl mt-2 max-h-52 overflow-auto border border-emerald-700">
                {sugerencias.map((cli) => (
                  <li
                    key={cli.id}
                    onClick={() => seleccionarCliente(cli)}
                    className="px-4 py-2 hover:bg-emerald-800/80 cursor-pointer text-gray-200"
                  >
                    {cli.nombre} –{' '}
                    <span className="text-emerald-400">
                      {cli.dni ? cli.dni : cli.telefono}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botón "Nuevo" alineado a la derecha */}
          <button
            type="button"
            onClick={abrirModalNuevoCliente}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center gap-2"
            title="Agregar nuevo cliente"
          >
            <FaUserPlus /> Nuevo Cliente
          </button>
        </div>

        <div className="mt-2">
          {clienteSeleccionado ? (
            <div className="flex items-center gap-3 text-emerald-400">
              <FaCheckCircle className="text-emerald-500" />
              <span>
                {clienteSeleccionado.nombre} ({clienteSeleccionado.dni})
              </span>
              <button
                className="ml-4 text-xs text-emerald-500 underline"
                onClick={() => setClienteSeleccionado(null)}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <FaUserAlt />
              <span>
                Cliente no seleccionado (
                <b className="text-emerald-400">Consumidor Final</b>)
              </span>
            </div>
          )}
        </div>
      </div>
      {/* lector de codigo de barras invicible */}
      <div>
        <input
          ref={inputRef}
          type="text"
          style={{
            opacity: 0,
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none'
          }}
          onBlur={() => setModoEscaner(false)} // Si el input invisible pierde foco, vuelve a manual
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Buscador por fuera*/}
      <div className="w-full max-w-3xl mb-6 sm:mx-0 mx-auto">
        {/* Acá el truco: flex-col por defecto (mobile), flex-row en sm+ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
          {/* Input arriba en mobile, a la izquierda en desktop */}
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 text-lg" />
            <input
              ref={buscadorRef}
              type="text"
              placeholder="Buscar por nombre, SKU o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 pr-4 py-3 w-full rounded-xl bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-md"
              onFocus={() => setModoEscaner(false)}
            />
          </div>

          {/* Botón principal */}
          <button
            onClick={abrirModalVerProductos}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white w-full sm:w-auto px-2 py-2 rounded-xl font-bold shadow-md hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 transition-all focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            type="button"
          >
            <span className="flex items-center gap-1">
              <FaBoxOpen className="inline -ml-1" />
              Ver Productos
            </span>
          </button>

          <button
            onClick={abrirModalVerCombos}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-full sm:w-auto px-2 py-2 rounded-xl font-bold shadow-md hover:scale-105 hover:from-purple-600 hover:to-purple-700 transition-all focus:ring-2 focus:ring-purple-400 focus:outline-none"
            type="button"
          >
            <span className="flex items-center gap-1">
              <FaCubes className="inline -ml-1" />
              Ver Combos
            </span>
          </button>

          {/* Botón escanear */}
          <button
            onClick={() => setModoEscaner(true)}
            className={`flex items-center gap-1 w-full sm:w-auto px-4 py-2 rounded-xl border-2 font-semibold shadow-sm transition-all text-emerald-700 bg-white
        ${
          modoEscaner
            ? 'border-emerald-500 ring-2 ring-emerald-300 bg-emerald-50 scale-105'
            : 'border-gray-200 hover:bg-emerald-50 hover:border-emerald-400'
        }
      `}
            type="button"
          >
            <FaBarcode className="inline" />
            Escanear
          </button>
        </div>
      </div>

      {/* Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Productos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[60vh] pr-1">
            {productos.length === 0 && (
              <p className="text-gray-400 col-span-full">Sin resultados…</p>
            )}
            {productos.map((producto) => {
              const tieneDescuento =
                producto.descuento_porcentaje > 0 &&
                producto.precio_con_descuento < producto.precio;

              const usarDescuento =
                usarDescuentoPorProducto[producto.producto_id] ?? true; // true por defecto

              return (
                <div
                  key={producto.producto_id}
                  className="bg-white/5 p-4 rounded-xl shadow hover:shadow-lg transition relative flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg text-white truncate max-w-[70%]">
                      {producto.nombre}
                    </span>

                    {tieneDescuento && (
                      <label className="flex items-center gap-1 text-xs text-green-400 select-none mr-10">
                        <input
                          type="checkbox"
                          checked={usarDescuento}
                          onChange={() => toggleDescuento(producto.producto_id)}
                          className="accent-green-400"
                        />
                        Aplicar descuento
                      </label>
                    )}
                  </div>

                  <span className="text-emerald-300 text-sm mt-auto">
                    {tieneDescuento && usarDescuento ? (
                      <>
                        <span className="line-through mr-2 text-red-400">
                          {formatearPrecio(producto.precio)}
                        </span>
                        <span>
                          {formatearPrecio(producto.precio_con_descuento)}
                        </span>
                        <span className="ml-2 text-xs text-green-400 font-semibold">
                          -{producto.descuento_porcentaje.toFixed(2)}% OFF
                        </span>
                      </>
                    ) : (
                      <>{formatearPrecio(producto.precio)}</>
                    )}
                  </span>

                  <button
                    onClick={() =>
                      manejarAgregarProducto(producto, usarDescuento)
                    }
                    className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full shadow"
                    title="Agregar al carrito"
                  >
                    <FaPlus />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white/10 p-4 rounded-xl sticky top-24 h-fit space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 m-0">
              <FaShoppingCart /> Carrito ({carrito.length})
            </h2>
            {/* Tuerca para abrir el modal */}
            <button
              className="p-2 rounded-full hover:bg-white/10 text-xl shrink-0"
              title="Gestionar medios de pago"
              onClick={() => setShowModal(true)}
            >
              <FaCog />
            </button>
          </div>

          {carrito.length === 0 ? (
            <p className="text-gray-400">Aún no hay artículos</p>
          ) : (
            <div className="max-h-64 overflow-y-auto pr-1 space-y-3">
              {carrito.map((item) => (
                <div
                  key={item.stock_id}
                  className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg text-sm"
                >
                  <div className="text-white font-medium w-1/2 truncate">
                    {item.nombre}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cambiarCantidad(item.stock_id, -1)}
                      className="p-1"
                    >
                      <FaMinus />
                    </button>
                    <span>{item.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(item.stock_id, 1)}
                      className="p-1"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <div className="text-emerald-300 w-20 text-right">
                    {formatearPrecio(item.precio * item.cantidad)}
                  </div>

                  <button
                    onClick={() => quitarProducto(item.stock_id)}
                    className="text-red-400 hover:text-red-600"
                    title="Quitar producto"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          {carrito.length > 0 &&
            totalCalculado &&
            totalCalculado.total >= 0 && (
              <TotalConOpciones
                totalCalculado={totalCalculado}
                formatearPrecio={formatearPrecio}
                aplicarDescuento={aplicarDescuento}
                setAplicarDescuento={setAplicarDescuento}
                descuentoPersonalizado={descuentoPersonalizado}
                setDescuentoPersonalizado={setDescuentoPersonalizado}
                mostrarValorTicket={mostrarValorTicket}
                setMostrarValorTicket={setMostrarValorTicket}
              />
            )}

          {/* Medios de pago */}
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {loadingMediosPago ? (
                <span className="text-gray-300 text-sm">Cargando...</span>
              ) : (
                mediosPago
                  .filter((m) => m.activo)
                  .sort((a, b) => a.orden - b.orden)
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMedioPago(m.id)}
                      className={`flex items-center gap-1 justify-center px-3 py-2 rounded-md text-sm font-semibold transition min-w-[110px] mb-1
              ${
                medioPago === m.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
                      style={{ flex: '1 1 130px', maxWidth: '180px' }} // Hace que no se achiquen demasiado ni se amontonen
                    >
                      {dynamicIcon(m.icono)} {m.nombre}
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* SELECTOR DE CUOTAS */}
          {cuotasDisponibles.length > 0 && (
            <div className="flex items-center justify-end gap-2 text-white text-sm">
              <label htmlFor="cuotas">Cuotas:</label>
              <select
                id="cuotas"
                value={cuotasSeleccionadas}
                onChange={(e) => setCuotasSeleccionadas(Number(e.target.value))}
                className="bg-transparent border border-emerald-400 text-emerald-600 rounded px-2 py-1 focus:outline-none"
              >
                {cuotasUnicas.map((num) => (
                  <option key={num} value={num}>
                    {num} cuota{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={finalizarVenta}
            disabled={carrito.length === 0 && mediosPago.length === ''}
            className={`w-full py-3 rounded-xl font-bold transition ${
              carrito.length === 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            Finalizar Venta
          </button>
        </div>
      </div>

      {/* Modal para seleccionar talle si hay más de uno */}
      {modalProducto && modalProducto.talles && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg animate-fadeIn">
            {/* Título */}
            <h3
              id="modal-title"
              className="text-2xl font-bold mb-5 text-center text-gray-800"
            >
              Seleccioná talle para{' '}
              <span className="text-emerald-600">{modalProducto.nombre}</span>
            </h3>

            {/* Lista talles */}
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-gray-100">
              {modalProducto.talles.map((talle) => {
                const selected = talleSeleccionado?.id === talle.id;
                return (
                  <button
                    key={talle.id}
                    onClick={() => setTalleSeleccionado(talle)}
                    className={`flex justify-between items-center p-4 rounded-lg border transition-shadow focus:outline-none ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg'
                        : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
                    }`}
                    aria-pressed={selected}
                    type="button"
                  >
                    <span className="text-lg font-semibold">
                      {talle.nombre || 'Sin talle'}
                    </span>
                    <span className="text-sm font-medium opacity-75">
                      {talle.cantidad} disponibles
                    </span>
                    {selected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Botones */}
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => {
                  setModalProducto(null);
                  setTalleSeleccionado(null);
                }}
                className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                type="button"
              >
                Cancelar
              </button>
              <button
                disabled={!talleSeleccionado}
                onClick={() =>
                  agregarAlCarrito(
                    modalProducto,
                    talleSeleccionado,
                    modalUsarDescuento // este estado debe existir
                  )
                }
                className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                  talleSeleccionado
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-emerald-300 cursor-not-allowed'
                }`}
                type="button"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalVerProductosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-xl max-h-[70vh] flex flex-col"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3
                id="modalTitle"
                className="text-2xl font-semibold text-gray-900 select-none"
              >
                Seleccioná un producto
              </h3>
              <button
                aria-label="Cerrar modal"
                onClick={() => setModalVerProductosOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Buscador al clickear ver productos */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Filtrar productos..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                autoFocus
                aria-label="Buscar productos"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 10.5a7.5 7.5 0 0012.9 6.15z"
                />
              </svg>
            </div>

            {/* Resultados y lista */}
            {filteredProductosModal.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No se encontraron productos.
              </p>
            ) : (
              <ul
                className="overflow-y-auto max-h-[50vh] space-y-2 scrollbar-thin scrollbar-thumb-emerald-400 scrollbar-track-gray-100"
                tabIndex={0}
                aria-label="Lista de productos"
              >
                {filteredProductosModal.map((prod) => (
                  <li key={prod.stock_id}>
                    <button
                      onClick={() => seleccionarProductoModal(prod)}
                      className="flex justify-between items-center w-full p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-emerald-50 focus:bg-emerald-100 focus:outline-none transition"
                      type="button"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-semibold text-gray-900">
                          {prod.nombre}
                          {prod.talle_nombre
                            ? ` - Talle ${prod.talle_nombre}`
                            : ''}
                        </span>
                        <span className="text-sm text-gray-500 mt-0.5">
                          Stock: {prod.cantidad_disponible}
                        </span>
                      </div>
                      {prod.cantidad_disponible <= 3 && (
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full select-none">
                          ¡Stock bajo!
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => navigate('/dashboard/stock/stock')}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold shadow transition-all"
                type="button"
              >
                <FaPlus />
                Agregar Producto
              </button>
              <button
                onClick={() => setModalVerProductosOpen(false)}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold text-gray-800 transition"
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalVerCombosOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalCombosTitle"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-xl max-h-[70vh] flex flex-col"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3
                id="modalCombosTitle"
                className="text-2xl font-semibold text-gray-900 select-none"
              >
                Seleccioná un combo
              </h3>
              <button
                aria-label="Cerrar modal"
                onClick={() => setModalVerCombosOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Filtrar combos..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition"
                value={modalComboSearch}
                onChange={(e) => setModalComboSearch(e.target.value)}
                autoFocus
                aria-label="Buscar combos"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 10.5a7.5 7.5 0 0012.9 6.15z"
                />
              </svg>
            </div>

            {/* Lista */}
            {filteredCombosModal.length === 0 ? (
              <p className="text-center text-gray-500 mt-8">
                No se encontraron combos.
              </p>
            ) : (
              <ul
                className="overflow-y-auto max-h-[50vh] space-y-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100"
                tabIndex={0}
                aria-label="Lista de combos"
              >
                {filteredCombosModal.map((combo) => (
                  <li key={combo.id}>
                    <button
                      onClick={() => {
                        seleccionarCombo(combo); // lo definimos abajo
                      }}
                      className="flex flex-col items-start w-full p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-purple-50 focus:bg-purple-100 focus:outline-none transition"
                      type="button"
                    >
                      <span className="font-semibold text-gray-900 text-left">
                        {combo.nombre}
                      </span>
                      <span className="text-sm text-gray-600">
                        {combo.descripcion}
                      </span>
                      <span className="text-sm mt-1 text-gray-500">
                        {combo.cantidad_items} items por $
                        {parseFloat(combo.precio_fijo).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalVerCombosOpen(false)}
                className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold text-gray-800 transition"
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión */}
      <ModalMediosPago
        show={showModal}
        onClose={() => setShowModal(false)}
        mediosPago={mediosPago}
        setMediosPago={setMediosPago}
      />
      {ventaFinalizada && (
        <TicketVentaModal
          venta={ventaFinalizada}
          onClose={() => setVentaFinalizada(null)}
          mostrarValorTicket={mostrarValorTicket}
        />
      )}
      <ModalNuevoCliente
        open={modalNuevoClienteOpen}
        onClose={() => setModalNuevoClienteOpen(false)}
      />
      {mostrarModalCaja && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative border-t-4 border-pink-500">
            <h2 className="text-xl font-bold text-pink-600 mb-4 text-center">
              ¡Atención!
            </h2>
            <p className="text-gray-700 text-center mb-4">{mensajeCaja}</p>

            {!confirmarAbrirCaja ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-gray-700">
                  ¿Deseás abrir una nueva caja para continuar con la venta?
                </p>
                <div className="flex justify-center gap-4 mt-2">
                  <button
                    onClick={() => setMostrarModalCaja(false)}
                    className="text-black px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setConfirmarAbrirCaja(true)}
                    className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition"
                  >
                    Sí, abrir caja
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Campo de saldo inicial */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Ingresá el saldo inicial
                  </label>
                  <input
                    type="number"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    className="text-black w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Ej: 1000"
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => {
                      setConfirmarAbrirCaja(false);
                      setMostrarModalCaja(false);
                    }}
                    className="text-black px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const exito = await abrirCaja();
                      if (exito) {
                        setMostrarModalCaja(false);
                        setConfirmarAbrirCaja(false);
                        finalizarVenta(); // Reintenta la venta
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition"
                  >
                    Abrir Caja
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
