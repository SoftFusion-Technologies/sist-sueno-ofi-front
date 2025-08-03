import React, { useState, useEffect } from 'react';
import {
  FaTicketAlt,
  FaSave,
  FaEdit,
  FaCheck,
  FaTimes,
  FaTrash,
  FaEye
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../../AuthContext';

const API_URL = 'http://localhost:8080/ticket-config';

const FIELDS = [
  { name: 'nombre_tienda', label: 'Nombre de la tienda', max: 100 },
  { name: 'lema', label: 'Lema', max: 255 },
  { name: 'descripcion', label: 'Descripción', textarea: true },
  { name: 'direccion', label: 'Dirección', max: 255 },
  { name: 'telefono', label: 'Teléfono', max: 50 },
  { name: 'email', label: 'Email', max: 100 },
  { name: 'web', label: 'Web', max: 100 },
  { name: 'cuit', label: 'CUIT', max: 20 },
  { name: 'logo_url', label: 'Logo (URL)', max: 255 },
  { name: 'mensaje_footer', label: 'Mensaje Footer', textarea: true }
];

export default function TicketConfigCard() {
  const [config, setConfig] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const { userLevel } = useAuth(); // ✅ Obtené el nivel de usuario

  // Cargar configuración
  useEffect(() => {
    setLoading(true);
    axios
      .get(API_URL)
      .then(({ data }) => {
        setConfig(data);
        setForm(data);
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMsg('');
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setMsg('');
    setError('');
    try {
      let res;
      if (config && config.id) {
        res = await axios.put(`${API_URL}/${config.id}`, form);
      } else {
        res = await axios.post(API_URL, form);
      }
      setMsg('¡Configuración guardada!');
      setConfig(res.data.config || res.data.actualizado);
      setEdit(false);
    } catch {
      setError('Ocurrió un error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        '¿Seguro deseas eliminar la configuración del ticket? Esta acción no se puede deshacer.'
      )
    )
      return;
    setLoading(true);
    setMsg('');
    setError('');
    try {
      await axios.delete(`${API_URL}/${config.id}`);
      setConfig(null);
      setForm({});
      setMsg('Configuración eliminada');
    } catch {
      setError('No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* SOLO ESCRITORIO */}
      <div className="w-full max-w-5xl mx-auto flex-col lg:flex-row gap-8 hidden lg:flex">
        {/* Formulario */}
        <div className="flex-1 min-w-0 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <FaTicketAlt className="text-violet-400 dark:text-violet-300 text-2xl" />
            <span className="font-bold text-xl text-zinc-800 dark:text-white">
              Ticket de Venta
            </span>
            <span className="ml-2 text-xs text-zinc-400 font-semibold uppercase tracking-widest">
              {config && !edit ? 'Vista' : edit ? 'Edición' : 'Nuevo'}
            </span>
          </div>
          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {FIELDS.map((f) =>
              f.textarea ? (
                <div className="col-span-2" key={f.name}>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-white">
                    {f.label}
                  </label>
                  <textarea
                    name={f.name}
                    value={form[f.name] || ''}
                    maxLength={f.max}
                    disabled={loading || (!edit && !!config)}
                    onChange={handleChange}
                    rows={2}
                    className="w-full mt-1 rounded-lg border border-zinc-200 dark:border-violet-700 px-3 py-2 text-base bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-violet-400 focus:outline-none transition disabled:bg-zinc-800 disabled:opacity-60"
                    placeholder={f.label}
                  />
                </div>
              ) : (
                <div key={f.name}>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-white">
                    {f.label}
                  </label>
                  <input
                    name={f.name}
                    value={form[f.name] || ''}
                    maxLength={f.max}
                    disabled={loading || (!edit && !!config)}
                    onChange={handleChange}
                    className="w-full mt-1 rounded-lg border border-zinc-200 dark:border-violet-700 px-3 py-2 text-base bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-white placeholder-zinc-400 focus:ring-2 focus:ring-violet-400 focus:outline-none transition disabled:bg-zinc-800 disabled:opacity-60"
                    placeholder={f.label}
                  />
                </div>
              )
            )}

            {/* Botones */}
            {userLevel === 'admin' && (
              <div className="col-span-2 flex flex-wrap gap-3 mt-2">
                {!edit && config && (
                  <button
                    type="button"
                    onClick={() => setEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-violet-500 hover:bg-violet-600 text-white transition focus:ring-2 focus:ring-violet-400 disabled:opacity-60"
                    disabled={loading}
                  >
                    <FaEdit /> Editar
                  </button>
                )}
                {(edit || !config) && (
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
                    disabled={loading}
                  >
                    <FaSave /> Guardar
                  </button>
                )}
                {edit && config && (
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-zinc-300 hover:bg-zinc-400 text-zinc-800 transition focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
                    onClick={() => {
                      setEdit(false);
                      setForm(config);
                    }}
                    disabled={loading}
                  >
                    <FaTimes /> Cancelar
                  </button>
                )}
                {config && (
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-red-500 hover:bg-red-600 text-white transition focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <FaTrash /> Eliminar
                  </button>
                )}
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold border border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-300 bg-white dark:bg-zinc-900 hover:bg-violet-100 dark:hover:bg-violet-900 transition focus:ring-2 focus:ring-violet-400 disabled:opacity-60"
                  onClick={() => setShowPreview((v) => !v)}
                  disabled={loading}
                >
                  <FaEye /> {showPreview ? 'Ocultar Previa' : 'Ver Previa'}
                </button>
              </div>
            )}

            <div className="col-span-2 mt-2">
              {msg && (
                <div className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-2">
                  <FaCheck /> {msg}
                </div>
              )}
              {error && (
                <div className="text-red-500 dark:text-red-400 font-bold flex items-center gap-2">
                  <FaTimes /> {error}
                </div>
              )}
            </div>
          </form>
        </div>
        {/* Preview */}
        {showPreview && (
          <div className="flex-1 max-w-xs mx-auto lg:mx-0 mt-8 lg:mt-0">
            <TicketPreview config={form} />
          </div>
        )}
      </div>
    </div>
  );
}

function TicketPreview({ config }) {
  return (
    <div className="w-full max-w-xs bg-white dark:bg-zinc-950 border border-violet-200 dark:border-violet-700 rounded-2xl shadow-xl py-6 px-4 text-center mx-auto relative">
      {config.logo_url && (
        <img
          src={config.logo_url}
          alt="Logo"
          className="mx-auto mb-2 max-h-16 object-contain rounded"
        />
      )}
      <div className="text-[18px] font-extrabold uppercase text-violet-700 dark:text-violet-300 tracking-tight mb-1">
        {config.nombre_tienda || ''}
      </div>
      <div className="text-xs italic text-emerald-600 dark:text-emerald-400 mb-1">
        {config.lema || 'LEMA'}
      </div>
      <div className="text-[13px] text-zinc-800 dark:text-zinc-200 mb-1">
        {config.descripcion}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
        {config.direccion}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
        {config.telefono}
      </div>
      <div className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
        {config.email}
      </div>
      <div className="text-xs text-blue-700 dark:text-blue-400 underline mb-1">
        {config.web}
      </div>
      <div className="text-xs text-zinc-800 dark:text-zinc-400 mb-1">
        CUIT: {config.cuit}
      </div>
      <hr className="my-2 border-violet-100 dark:border-violet-800" />
      <div className="text-[13px] text-zinc-700 dark:text-zinc-300 italic opacity-90">
        {config.mensaje_footer}
      </div>
      <div className="absolute left-0 right-0 bottom-2 text-[10px] text-zinc-400 opacity-40 font-mono">
        Vista previa
      </div>
    </div>
  );
}
