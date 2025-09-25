// src/api/chequesImagenes.js
import { client } from './bancos';

/** Helpers */
const BASE = client.defaults.baseURL?.replace(/\/+$/, '') || '';

function pickMime(row) {
  return row?.mime_type || row?.mimetype || '';
}
function extFromMime(m) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf'
  };
  return map[m] || '';
}
function ensureExt(filename = '', mime = '') {
  const hasDot = /\.[a-z0-9]{2,5}$/i.test(filename);
  if (hasDot) return filename;
  const ext = extFromMime(mime);
  return ext ? `${filename}.${ext}` : filename || 'archivo';
}
function buildDownloadUrl(chequeId, id, opts = {}) {
  const q = new URLSearchParams(opts).toString();
  return `${BASE}/cheques/${chequeId}/imagenes/${id}/download${
    q ? `?${q}` : ''
  }`;
}
function normalizeImagen(row, chequeId) {
  const mime = pickMime(row);
  const url = row?.url || buildDownloadUrl(chequeId, row.id, { inline: 1 });
  // si el back expone un endpoint de thumbs, podrías construirlo acá
  const thumb_url = row?.thumb_url || url; // fallback hasta que tengas thumbs reales
  return {
    ...row,
    mime_type: mime,
    url,
    thumb_url,
    filename: ensureExt(row?.filename, mime)
  };
}

/** -------- Imágenes base -------- */
export const listChequeImagenes = async (chequeId, params = {}) => {
  // params puede llevar: q, tipo, page, pageSize
  const { data } = await client.get(`/cheques/${chequeId}/imagenes`, {
    params
  });
  if (Array.isArray(data)) {
    const items = data.map((r) => normalizeImagen(r, chequeId));
    return { items, total: items.length, page: 1, pageSize: items.length };
  }
  // paginado { items, total, page, pageSize }
  const items = (data?.items || data?.data || []).map((r) =>
    normalizeImagen(r, chequeId)
  );
  return {
    items,
    total: data?.total ?? data?.meta?.total ?? items.length,
    page: data?.page ?? data?.meta?.page ?? 1,
    pageSize: data?.pageSize ?? data?.meta?.limit ?? items.length
  };
};

export const getChequeImagen = async (chequeId, id) => {
  const { data } = await client.get(`/cheques/${chequeId}/imagenes/${id}`);
  return normalizeImagen(data, chequeId);
};

export const uploadChequeImagen = async (chequeId, file, meta = {}) => {
  const form = new FormData();
  form.append('file', file);
  if (meta.tipo) {
    form.append('tipo', meta.tipo);
    form.append('tipo_imagen', meta.tipo); // compat si el back usa este nombre
  }
  if (meta.observaciones) form.append('observaciones', meta.observaciones);
  if (meta.usuario_log_id) form.append('usuario_log_id', meta.usuario_log_id);

  const { data } = await client.post(`/cheques/${chequeId}/imagenes`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  // el back puede devolver { imagen } o { creado } o la fila directa
  const row = data?.imagen || data?.creado || data;
  return normalizeImagen(row, chequeId);
};

export const downloadChequeImagen = async (chequeId, id) => {
  // 1) obtenemos metadata para armar nombre correcto
  const meta = await getChequeImagen(chequeId, id).catch(() => null);
  const fallbackName = `cheque_${chequeId}_img_${id}`;
  const filename = meta?.filename || ensureExt(fallbackName, pickMime(meta));

  // 2) pedimos el blob
  const res = await client.get(`/cheques/${chequeId}/imagenes/${id}/download`, {
    responseType: 'blob'
  });

  // 3) si es PDF, abrir en pestaña; si es imagen, forzar descarga
  const mime = res?.data?.type || pickMime(meta);
  const blobUrl = URL.createObjectURL(res.data);
  if (mime === 'application/pdf') {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  } else {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
  }
  URL.revokeObjectURL(blobUrl);
};

export const updateChequeImagen = async (chequeId, id, payload) => {
  const { data } = await client.patch(
    `/cheques/${chequeId}/imagenes/${id}`,
    payload
  );
  const row = data?.imagen || data;
  return normalizeImagen(row, chequeId);
};

export const deleteChequeImagen = async (chequeId, id) => {
  const { data } = await client.delete(`/cheques/${chequeId}/imagenes/${id}`, {
    timeout: 60000
  });
  return data;
};


/** -------- Thumbs -------- */
export const listChequeImagenThumbs = async (chequeId, imagenId) => {
  const { data } = await client.get(
    `/cheques/${chequeId}/imagenes/${imagenId}/thumbs`
  );
  const arr = Array.isArray(data) ? data : data?.items || [];
  // opcional: normalizar cada thumb con url de descarga si el back no la manda
  return {
    items: arr.map((t) => ({
      ...t,
      url:
        t.url ||
        t.thumb_url ||
        `${BASE}/cheques/${chequeId}/imagenes/${imagenId}/thumbs/${t.id}/download?inline=1`
    }))
  };
};

export const downloadChequeImagenThumb = async (chequeId, imagenId, id) => {
  const res = await client.get(
    `/cheques/${chequeId}/imagenes/${imagenId}/thumbs/${id}/download`,
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cheque_${chequeId}_thumb_${id}.jpg`;
  a.click();
  URL.revokeObjectURL(url);
};

/** -------- Eventos -------- */
// src/api/chequesImagenes.js
export const listChequeImagenEventos = async (chequeId, params = {}) => {
  const { data } = await client.get(`/cheques/${chequeId}/imagenes/eventos`, {
    params
  });
  // console.log('[API] eventos GET data:', data);

  // Normalización a { items, total?, meta? }
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: data.total ?? data.items.length,
      meta: data.meta
    };
  }
  if (data && Array.isArray(data.data)) {
    return {
      items: data.data,
      total: data.meta?.total ?? data.data.length,
      meta: data.meta
    };
  }
  return { items: [] };
};

export const createChequeImagenEvento = async (chequeId, payload) => {
  const { data } = await client.post(
    `/cheques/${chequeId}/imagenes/eventos`,
    payload
  );
  return data;
};
