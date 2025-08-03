import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import axios from 'axios';

export default function ModalNuevoCliente({ open, onClose, onClienteCreado }) {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    dni: ''
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      // Reemplaza la URL por la de tu backend
      const { data } = await axios.post('http://localhost:8080/clientes', form);
      setCargando(false);
      onClienteCreado?.(data); // Puedes usar esto para refrescar la lista si querés
      onClose();
    } catch (err) {
      setCargando(false);
      setError(
        err.response?.data?.mensajeError ||
          err.message ||
          'Ocurrió un error al crear el cliente.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-[#232323] p-7 rounded-2xl shadow-xl w-full max-w-md mx-2 border border-emerald-700 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-emerald-400 text-xl"
          aria-label="Cerrar"
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold text-emerald-400 mb-6">
          Nuevo Cliente
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-gray-200">Nombre *</label>
            <input
              type="text"
              name="nombre"
              required
              value={form.nombre}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#191919] text-gray-100 border border-gray-600 focus:border-emerald-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="font-semibold text-gray-200">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#191919] text-gray-100 border border-gray-600 focus:border-emerald-500 outline-none"
              placeholder="Ej: 3815123456"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-200">DNI</label>
            <input
              type="text"
              name="dni"
              value={form.dni}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#191919] text-gray-100 border border-gray-600 focus:border-emerald-500 outline-none"
              placeholder="Ej: 40404040"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-200">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#191919] text-gray-100 border border-gray-600 focus:border-emerald-500 outline-none"
              placeholder="Ej: cliente@email.com"
            />
          </div>
          <div>
            <label className="font-semibold text-gray-200">Dirección</label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="w-full mt-1 px-4 py-2 rounded-lg bg-[#191919] text-gray-100 border border-gray-600 focus:border-emerald-500 outline-none"
              placeholder="Ej: Calle 123"
            />
          </div>
          {error && (
            <div className="text-red-400 font-semibold text-sm">{error}</div>
          )}
          <div className="text-right mt-2">
            <button
              type="submit"
              disabled={cargando}
              className="bg-emerald-500 hover:bg-emerald-600 px-7 py-2 rounded-lg text-white font-semibold shadow transition"
            >
              {cargando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
