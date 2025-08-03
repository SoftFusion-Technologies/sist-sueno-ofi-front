import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FaBoxOpen,
  FaFolderOpen,
  FaTrashAlt,
  FaPlusCircle
} from 'react-icons/fa';
import ButtonBack from '../../../Components/ButtonBack';
import ParticlesBackground from '../../../Components/ParticlesBackground';

const ComboEditarPermitidos = () => {
  const { id } = useParams(); // ID del combo a editar

  const [combo, setCombo] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const fetchDatos = async () => {
    try {
      const [comboRes, productosRes, categoriasRes, asignadosRes] =
        await Promise.all([
          axios.get(`http://localhost:8080/combos/${id}`),
          axios.get('http://localhost:8080/productos'),
          axios.get('http://localhost:8080/categorias'),
          axios.get(`http://localhost:8080/combo-productos-permitidos/${id}`)
        ]);

      setCombo(comboRes.data);
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data);
      setAsignados(asignadosRes.data);
    } catch (err) {
      console.error('Error al cargar datos del combo:', err);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [id]);

  const eliminarAsignado = async (permId) => {
    if (!window.confirm('¿Eliminar este producto o categoría del combo?'))
      return;
    try {
      await axios.delete(
        `http://localhost:8080/combo-productos-permitidos/${permId}`
      );
      fetchDatos(); // actualizar la lista
    } catch (error) {
      console.error('Error al eliminar asignación:', error);
    }
  };

  const agregarProducto = async (producto_id) => {
    try {
      await axios.post('http://localhost:8080/combo-productos-permitidos', {
        combo_id: parseInt(id),
        producto_id
      });
      fetchDatos();
    } catch (err) {
      console.error('Error al asignar producto:', err);
    }
  };

  const agregarCategoria = async (categoria_id) => {
    try {
      await axios.post('http://localhost:8080/combo-productos-permitidos', {
        combo_id: parseInt(id),
        categoria_id
      });
      fetchDatos();
    } catch (err) {
      console.error('Error al asignar categoría:', err);
    }
  };

  // Filtrar productos que no están ya asignados
  const productosDisponibles = productos.filter(
    (p) => !asignados.some((a) => a.producto?.id === p.id)
  );

  const categoriasDisponibles = categorias.filter(
    (c) => !asignados.some((a) => a.categoria?.id === c.id)
  );

  const productosFiltrados = productosDisponibles.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
      <div className="min-h-screen bg-gray-900 text-white py-8 px-6">
        <ParticlesBackground></ParticlesBackground>
      <ButtonBack />
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white titulo uppercase mb-6">
          Editar productos permitidos para el combo
        </h1>

        {combo && (
          <div className="bg-white/10 p-4 rounded-lg mb-6">
            <h2 className="text-2xl font-bold text-purple-300">
              {combo.nombre}
            </h2>
            <p className="text-sm text-gray-300">{combo.descripcion}</p>
            <p className="text-sm mt-2">
              🎯 Debe tener <strong>{combo.cantidad_items}</strong> productos
              por combo.
            </p>
            <p className="text-sm text-yellow-300">Estado: {combo.estado}</p>
          </div>
        )}

        {/* Buscador */}
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        {/* Asignados */}
        <h2 className="text-xl font-bold text-white mb-2">
          🧩 Productos/Categorías asignadas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {asignados.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 p-4 rounded-xl flex justify-between items-center"
            >
              <div className="text-sm">
                {item.producto ? (
                  <>
                    <FaBoxOpen className="inline-block mr-2 text-green-400" />
                    Producto: <strong>{item.producto.nombre}</strong>
                  </>
                ) : (
                  <>
                    <FaFolderOpen className="inline-block mr-2 text-blue-400" />
                    Categoría: <strong>{item.categoria.nombre}</strong>
                  </>
                )}
              </div>
              <button
                className="text-red-400 hover:text-red-600"
                onClick={() => eliminarAsignado(item.id)}
              >
                <FaTrashAlt />
              </button>
            </div>
          ))}
        </div>

        {/* Agregar productos */}
        <h2 className="text-xl font-bold text-white mb-2">
          📦 Productos disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {productosFiltrados.map((p) => (
            <div
              key={p.id}
              className="bg-white/10 p-3 rounded-xl flex justify-between items-center"
            >
              <span>{p.nombre}</span>
              <button
                onClick={() => agregarProducto(p.id)}
                className="text-green-400 hover:text-green-600"
              >
                <FaPlusCircle />
              </button>
            </div>
          ))}
        </div>

        {/* Agregar categorías */}
        <h2 className="text-xl font-bold text-white mb-2">
          📂 Categorías disponibles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoriasDisponibles.map((c) => (
            <div
              key={c.id}
              className="bg-white/10 p-3 rounded-xl flex justify-between items-center"
            >
              <span>{c.nombre}</span>
              <button
                onClick={() => agregarCategoria(c.id)}
                className="text-blue-400 hover:text-blue-600"
              >
                <FaPlusCircle />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComboEditarPermitidos;
