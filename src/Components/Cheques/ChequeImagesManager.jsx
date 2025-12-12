import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCloudUploadAlt,
  FaTrash,
  FaDownload,
  FaInfoCircle,
  FaTimes,
  FaImages,
  FaPen,
  FaEye,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaCamera,
  FaLayerGroup
} from 'react-icons/fa';
import {
  listChequeImagenes,
  getChequeImagen,
  uploadChequeImagen,
  downloadChequeImagen,
  updateChequeImagen,
  deleteChequeImagen,
  listChequeImagenThumbs,
  downloadChequeImagenThumb,
  listChequeImagenEventos,
  createChequeImagenEvento
} from '../../api/chequesImagenes';
import { Alerts, getErrorMessage } from '../../utils/alerts';
import Swal from 'sweetalert2';

/**
 * ChequeImagesManager
 * ------------------------------------------------------------------
 * UI ultra moderna para gestionar imágenes de cheques por cheque_id.
 * - Grid responsive (masonry-lite) con thumbs.
 * - Upload drag&drop + botón.
 * - Visor modal con zoom/rotate, metadatos y eventos.
 * - Acciones: descargar, renombrar/editar metadatos, eliminar.
 * - Panel de eventos por imagen (timeline).
 * - Soporta paginación y búsqueda por observaciones/tipo.
 *
 * Props:
 * - chequeId (number) **requerido**
 */
export default function ChequeImagesManager({ chequeId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState(''); // ej: 'frente', 'dorso', 'comprobante'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [total, setTotal] = useState(0);

  const [viewer, setViewer] = useState({ open: false, img: null });
  const [thumbs, setThumbs] = useState([]);
  const [eventos, setEventos] = useState([]);

  const fileRef = useRef(null);

  const [errorDetails, setErrorDetails] = useState(''); // opcional: para ver el backend msg

  const [tipoNuevo, setTipoNuevo] = useState('frente');

  // NUEVO: modal de subida
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTipo, setUploadTipo] = useState('frente'); // default
  const [uploadObs, setUploadObs] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const uploadFileRef = useRef(null);

  useEffect(() => {
    fetchData(1); /* eslint-disable-line */
  }, [chequeId, pageSize, tipo]);
  useEffect(() => {
    const h = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 300);
    return () => clearTimeout(h);
  }, [q]);
  useEffect(() => {
    fetchData(page); /* eslint-disable-line */
  }, [page]);

  async function fetchData(pageToFetch = 1) {
    if (!chequeId) return;
    setLoading(true);
    setError('');
    setErrorDetails('');
    try {
      const resp = await listChequeImagenes(chequeId, {
        q: q || undefined,
        tipo: tipo || undefined, // si viene vacío no lo mandamos
        page: pageToFetch,
        pageSize
      });

      // Tolerancia de shape: array plano o {items,total}
      const itemsSafe = Array.isArray(resp) ? resp : resp?.items || [];
      const totalSafe = Array.isArray(resp)
        ? resp.length
        : Number(resp?.total || 0);
      setItems(itemsSafe);
      setTotal(totalSafe);
    } catch (err) {
      console.error('Listado imágenes error:', err);
      // Guardá detalle crudo del backend si existe:
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.mensajeError ||
        err?.message ||
        'Error interno';
      setError('No se pudieron cargar las imágenes.');
      setErrorDetails(String(serverMsg));
      // Fallback para que la UI siga
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  function onOpenFile() {
    fileRef.current?.click();
  }

  async function onFilesSelected(files) {
    if (!files || !files.length) return;

    setLoading(true);
    const fallidas = [];

    try {
      for (const file of files) {
        try {
          const tipoInferido = guessTipo(file.name);
          const resp = await uploadChequeImagen(chequeId, file, {
            tipo: tipoInferido,
            tipo_imagen: tipoInferido // compat
          });
          const creado = resp?.creado ?? resp;
          const imagenId = creado?.id;

          // evento no crítico
          try {
            if (imagenId) {
              await createChequeImagenEvento(chequeId, {
                imagen_id: imagenId,
                tipo_evento: 'upload',
                detalle: file.name
              });
            }
          } catch (e) {
            console.warn(
              'Evento no registrado (no crítico):',
              e?.response?.data || e?.message || e
            );
          }
        } catch (eUp) {
          console.error('Fallo al subir:', file.name, eUp);
          fallidas.push(file.name);
        }
      }

      await fetchData(1);

      if (fallidas.length) {
        await Alerts.error(
          'Subida incompleta',
          `No se pudo subir:\n• ${fallidas.join('\n• ')}`
        );
      } else {
        Alerts.toastSuccess('Imágenes subidas');
      }
    } catch (err) {
      console.error(err);
      setError('Error inesperado al subir imágenes.');
      setErrorDetails(err?.response?.data?.error || err?.message || '');
    } finally {
      setLoading(false);
      if (fileRef?.current) fileRef.current.value = null;
    }
  }

  function onDrop(ev) {
    ev.preventDefault();
    const files = ev.dataTransfer.files;
    onFilesSelected(files);
  }

  function guessTipo(name = '') {
    const n = name.toLowerCase();
    if (n.includes('frente')) return 'frente';
    if (n.includes('dorso')) return 'dorso';
    return 'otro';
  }

  async function openViewer(img) {
    setViewer({ open: true, img });
    console.log('[openViewer] chequeId:', chequeId, 'img.id:', img?.id);

    try {
      const [ths, evs] = await Promise.all([
        listChequeImagenThumbs(chequeId, img.id),
        listChequeImagenEventos(chequeId, { imagen_id: img.id })
      ]);

      // console.log('[openViewer] thumbs resp:', ths);
      // console.log('[openViewer] eventos resp normalizado:', evs);

      setThumbs(ths?.items || []);
      setEventos(evs?.items || []); // <- ahora siempre es array
    } catch (err) {
      console.error('[openViewer] error:', err);
      setThumbs([]);
      setEventos([]);
    }
  }

  function closeViewer() {
    setViewer({ open: false, img: null });
    setThumbs([]);
    setEventos([]);
  }

  async function handleDownload(img) {
    try {
      await downloadChequeImagen(chequeId, img.id);
    } catch (e) {
      console.error(e);
      await Alerts.error(
        'Descarga',
        getErrorMessage(e, 'No se pudo descargar.')
      );
    }
  }
  async function handleDelete(img) {
    const ok = await Alerts.confirm({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;

    try {
      Alerts.loading('Eliminando...');
      await deleteChequeImagen(chequeId, img.id);
      Alerts.close();
      Alerts.toastSuccess('Imagen eliminada');
      fetchData(page);
    } catch (e) {
      Alerts.close();
      console.error(e);
      await Alerts.error(
        'No se pudo eliminar',
        getErrorMessage(e, 'Error al eliminar la imagen.')
      );
    }
  }

  async function handleEdit(img) {
    const res = await Swal.fire({
      title: 'Editar observaciones',
      input: 'text',
      inputValue: img.observaciones || '',
      inputPlaceholder: 'Observaciones / nombre...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    });

    if (!res.isConfirmed) return;

    const nuevo = String(res.value || '').trim();

    try {
      Alerts.loading('Actualizando...');
      await updateChequeImagen(chequeId, img.id, {
        observaciones: nuevo || null
      });
      Alerts.close();
      Alerts.toastSuccess('Actualizado');
      fetchData(page);
    } catch (e) {
      Alerts.close();
      console.error(e);
      await Alerts.error(
        'No se pudo actualizar',
        getErrorMessage(e, 'Error al actualizar la imagen.')
      );
    }
  }

  function openUploadModal() {
    setUploadTipo('frente');
    setUploadObs('');
    setUploadOpen(true);
  }
  function closeUploadModal() {
    if (uploadBusy) return; // evitar cerrar en medio de subida
    setUploadOpen(false);
  }

  async function handleUploadSubmit() {
    const files = uploadFileRef.current?.files;
    if (!files || !files.length) {
      alert('Elegí al menos un archivo');
      return;
    }

    setUploadBusy(true);
    const fallidas = [];
    for (const file of files) {
      try {
        const created = await uploadChequeImagen(chequeId, file, {
          tipo: uploadTipo,
          observaciones: uploadObs
          // si usás auditoría en back:
          // usuario_log_id: currentUserId
        });

        // evento no crítico
        try {
          await createChequeImagenEvento(chequeId, {
            imagen_id: created?.id,
            tipo_evento: 'upload',
            detalle: `${uploadTipo} - ${file.name}`
          });
        } catch (e) {
          console.warn(
            'Evento no registrado:',
            e?.response?.data || e?.message
          );
        }
      } catch (e) {
        console.error('Fallo al subir', file.name, e?.response?.data || e);
        // mensaje específico si ya existe frente/dorso
        const msg =
          e?.response?.data?.mensajeError ||
          e?.response?.data?.error ||
          e?.message ||
          'Error';
        fallidas.push(`${file.name} (${msg})`);
      }
    }

    await fetchData(1);
    setUploadBusy(false);
    setUploadOpen(false);
    if (uploadFileRef.current) uploadFileRef.current.value = null;

    if (fallidas.length) {
      alert(`No se pudo subir:\n• ${fallidas.join('\n• ')}`);
    }
  }

  return (
    <section className="relative w-full">
      {/* Fondo sutil */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0f172a] via-[#0b2b3e] to-[#0ea5b8] opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl p-4 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/60 ring-1 ring-white/10">
                <FaImages className="text-white/80" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  Imágenes de Cheque #{chequeId}
                </h2>
                <p className="text-white/60 text-sm">
                  Subí, administrá y revisá evidencias del cheque.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={openUploadModal}
                className="px-3 py-2 rounded-xl bg-black/60 text-white hover:bg-black/70 ring-1 ring-white/10 inline-flex items-center gap-2"
              >
                <FaCloudUploadAlt /> Subir
              </button>

              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por observaciones o tipo"
                  className="w-60 pl-10 pr-3 py-2 rounded-xl bg-black/60 text-white ring-1 ring-white/10 placeholder-white/40"
                />
              </div>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/60 text-white ring-1 ring-white/10"
              >
                <option value="">Tipo (todos)</option>
                <option value="frente">Frente</option>
                <option value="dorso">Dorso</option>
                <option value="comprobante">Comprobante</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-100 p-3 text-sm">
              {error}
              {errorDetails && (
                <div className="mt-1 text-red-200/80 text-xs">
                  Detalle: {errorDetails}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFilesSelected(e.target.files)}
          />

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/30 p-4 text-white/70"
          >
            Arrastrá y soltá imágenes aquí o hacé click en{' '}
            <button onClick={onOpenFile} className="underline">
              Subir
            </button>
          </div>

          {/* Stats + paginación */}
          <div className="mt-3 flex items-center justify-between text-white/70 text-sm">
            <div>
              Mostrando <b className="text-white">{items.length}</b> de{' '}
              <b className="text-white">{total}</b>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-black/60 text-white disabled:opacity-40"
              >
                ‹
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-black/60 text-white disabled:opacity-40"
              >
                ›
              </button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-black/60 text-white"
              >
                {[12, 24, 48, 96].map((n) => (
                  <option key={n} value={n}>
                    {n}/página
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-5 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
          <AnimatePresence initial={false}>
            {loading && <div className="text-white/70">Cargando…</div>}
            {!loading && items.length === 0 && (
              <div className="text-white/80">No hay imágenes.</div>
            )}
            {!loading &&
              items.map((img) => (
                <motion.div
                  key={img.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="break-inside-avoid mb-4"
                >
                  <div className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black/50">
                    <img
                      src={img.url || getThumbFallback(img)}
                      alt={img.observaciones || img.tipo || 'imagen'}
                      className="w-full h-auto object-cover"
                      onClick={() => openViewer(img)}
                    />
                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition" />
                    {/* actions */}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <IconGhost onClick={() => openViewer(img)} title="Ver">
                        <FaEye />
                      </IconGhost>
                      <IconGhost onClick={() => handleEdit(img)} title="Editar">
                        <FaPen />
                      </IconGhost>
                      <IconGhost
                        onClick={() => handleDownload(img)}
                        title="Descargar"
                      >
                        <FaDownload />
                      </IconGhost>
                      <IconGhost
                        onClick={() => handleDelete(img)}
                        title="Eliminar"
                        danger
                      >
                        <FaTrash />
                      </IconGhost>
                    </div>
                  </div>
                  <div className="px-2 py-2 text-white/80 text-xs flex items-center justify-between gap-2 bg-black/40 rounded-b-2xl">
                    <div className="truncate" title={img.observaciones || ''}>
                      {img.observaciones || '—'}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 ring-1 ring-white/10">
                      {img.tipo || 'otro'}
                    </span>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>

      {/* VIEWER */}
      <AnimatePresence>
        {viewer.open && viewer.img && (
          <Modal
            onClose={closeViewer}
            title={
              viewer.img.observaciones || viewer.img.tipo || 'Imagen de cheque'
            }
          >
            <ImageViewerContent
              chequeId={chequeId}
              img={viewer.img}
              thumbs={thumbs}
              eventos={eventos}
              onReload={() => fetchData(page)}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onEdit={handleEdit}
            />
          </Modal>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {uploadOpen && (
          <Modal
            title={`Subir imágenes — Cheque #${chequeId}`}
            onClose={closeUploadModal}
            maxWidth={640}
          >
            <UploadImagesModal
              tipo={uploadTipo}
              setTipo={setUploadTipo}
              obs={uploadObs}
              setObs={setUploadObs}
              fileRef={uploadFileRef}
              busy={uploadBusy}
              onCancel={closeUploadModal}
              onSubmit={handleUploadSubmit}
            />
          </Modal>
        )}
      </AnimatePresence>
    </section>
  );
}

function getThumbFallback(img) {
  // Si no hay url ni thumb, devolvemos un data-URI transparente (no rompe el <img>)
  if (img?.thumb_url) return img.thumb_url;
  if (img?.url) return img.url;
  // 1x1 transparente
  return 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
}

// ---------- Subcomponentes ----------
function IconGhost({ children, onClick, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg ${
        danger
          ? 'bg-red-500/30 hover:bg-red-500/40'
          : 'bg-white/10 hover:bg-white/20'
      } text-white backdrop-blur-sm`}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose, maxWidth = 1100 }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999]"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-h-[90vh] overflow-auto rounded-2xl bg-black/85 ring-1 ring-white/15 shadow-2xl"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              <FaTimes />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ImageViewerContent({
  chequeId,
  img,
  thumbs,
  eventos,
  onReload,
  onDelete,
  onDownload,
  onEdit
}) {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Imagen grande */}
      <div className="lg:col-span-2">
        <div className="rounded-xl overflow-hidden ring-1 ring-white/10 bg-black/60 p-2">
          <div className="flex items-center justify-between text-white/70 text-sm px-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10 ring-1 ring-white/10">
                <FaCamera /> ID {img.id}
              </span>
              <span className="px-2 py-1 rounded-lg bg-white/10 ring-1 ring-white/10">
                {img.tipo || 'otro'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                className="px-2 py-1 rounded bg-white/10 text-white"
              >
                -
              </button>
              <span className="w-14 text-center text-white/80">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="px-2 py-1 rounded bg-white/10 text-white"
              >
                +
              </button>
              <button
                onClick={() => setRotate((r) => (r + 90) % 360)}
                className="px-2 py-1 rounded bg-white/10 text-white"
              >
                ↻
              </button>
            </div>
          </div>
          <div
            className="relative bg-black/80 rounded-lg overflow-auto"
            style={{ height: '60vh' }}
          >
            <img
              src={getThumbFallback(img)}
              alt={img.observaciones || img.tipo || 'imagen'}
              className="mx-auto select-none"
              style={{
                transform: `scale(${zoom}) rotate(${rotate}deg)`,
                transformOrigin: 'center top'
              }}
              onClick={() => openViewer(img)}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onDownload(img)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 inline-flex items-center gap-2"
            >
              <FaDownload /> Descargar
            </button>
            <button
              onClick={() => onEdit(img)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 inline-flex items-center gap-2"
            >
              <FaPen /> Editar
            </button>
            <button
              onClick={() => onDelete(img)}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/30 inline-flex items-center gap-2"
            >
              <FaTrash /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Panel lateral: thumbs + eventos */}
      <div className="space-y-4">
        {/* <div className="rounded-xl ring-1 ring-white/10 bg-black/60 p-3 text-white/80">
          <div className="font-semibold mb-2 inline-flex items-center gap-2">
            <FaLayerGroup /> Thumbnails
          </div>
          <div className="grid grid-cols-3 gap-2">
            {thumbs?.length ? (
              thumbs.map((t) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    await downloadChequeImagenThumb(chequeId, img.id, t.id);
                  }}
                  className="group relative"
                >
                  <img
                    src={t.url || t.thumb_url}
                    className="w-full h-auto rounded-lg ring-1 ring-white/10"
                  />
                  <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/80">
                    {t.tipo || 'thumb'}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-white/60 text-sm">No hay thumbnails.</div>
            )}
          </div>
        </div> */}

        {/* Panel lateral: Eventos */}
        <div className="rounded-xl ring-1 ring-white/10 bg-black/60 p-3 text-white/80">
          <div className="font-semibold mb-2 inline-flex items-center gap-2">
            <FaHistory /> Eventos
          </div>
          <div className="space-y-2 max-h-[38vh] overflow-auto pr-1">
            {Array.isArray(eventos) && eventos.length > 0 ? (
              eventos.map((ev) => (
                <div
                  key={ev.id || `${ev.evento}-${ev.created_at}`}
                  className="rounded-lg bg-white/5 px-3 py-2"
                >
                  <div className="text-xs text-white/60">
                    {ev.created_at
                      ? new Date(ev.created_at).toLocaleString()
                      : '—'}
                  </div>
                  <div className="text-sm text-white">
                    {(ev.evento || 'evento').toUpperCase()} — {ev.detalle || ''}
                  </div>
                  {/* opcional: quién lo hizo */}
                  {ev.user_id && (
                    <div className="text-[11px] text-white/50">
                      Usuario #{ev.user_id}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-white/60 text-sm">Sin eventos.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadImagesModal({
  tipo,
  setTipo,
  obs,
  setObs,
  fileRef,
  busy,
  onCancel,
  onSubmit
}) {
  return (
    <div className="space-y-4 text-white">
      {/* Paso 1: elegir tipo */}
      <div>
        <div className="text-sm text-white/70 mb-2">Tipo de imagen</div>
        <div className="grid grid-cols-3 gap-2">
          {['frente', 'dorso', 'otro'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-3 py-2 rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10 ${
                tipo === t ? 'outline-2 outline-emerald-400/60' : ''
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/60">
          Recordá: solo puede haber 1 <b>frente</b> y 1 <b>dorso</b> por cheque.
        </p>
      </div>

      {/* Paso 2: observaciones opcionales */}
      <div>
        <div className="text-sm text-white/70 mb-2">
          Observaciones (opcional)
        </div>
        <input
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ej: foto recortada, buena calidad, etc."
          className="w-full px-3 py-2 rounded-xl bg-black/60 text-white ring-1 ring-white/10 placeholder-white/40"
        />
      </div>

      {/* Paso 3: elegir archivos */}
      <div>
        <div className="text-sm text-white/70 mb-2">Archivos</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-white"
        />
        <p className="mt-2 text-xs text-white/60">
          Podés seleccionar varias imágenes. Todas se subirán como <b>{tipo}</b>
          .
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 ring-1 ring-white/10"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-300 inline-flex items-center gap-2"
        >
          {busy ? 'Subiendo…' : 'Subir'}
        </button>
      </div>
    </div>
  );
}
