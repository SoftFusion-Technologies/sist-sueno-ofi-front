// src/api/bancos.js
import axios from 'axios';
import { getUserId } from '../utils/authUtils';

export const url = 'http://localhost:8080/';

export const client = axios.create({
  baseURL: url,
  timeout: 15000
});

/** Inyecta usuario_log_id en TODAS las requests de banco */
client.interceptors.request.use((config) => {
  const uid = getUserId();
  if (!uid) return config;

  const method = (config.method || 'get').toLowerCase();

  // Helpers de merge sin pisar si ya viene seteado
  const ensureBodyWithUser = () => {
    if (config.data instanceof FormData) {
      if (!config.data.has('usuario_log_id'))
        config.data.append('usuario_log_id', uid);
    } else {
      const body =
        config.data && typeof config.data === 'object' ? config.data : {};
      if (!('usuario_log_id' in body)) {
        config.data = { ...body, usuario_log_id: uid };
      } else {
        config.data = body; // respeta el valor existente
      }
    }
  };

  const ensureParamsWithUser = () => {
    const curr =
      config.params && typeof config.params === 'object' ? config.params : {};
    if (!('usuario_log_id' in curr)) {
      config.params = { ...curr, usuario_log_id: uid };
    } else {
      config.params = curr;
    }
  };

  if (method === 'get' || method === 'head' || method === 'delete') {
    // Para GET/HEAD/DELETE lo pasamos como querystring (nuestros controladores lo aceptan)
    ensureParamsWithUser();
  } else {
    // Para POST/PUT/PATCH lo pasamos en el body (o FormData)
    ensureBodyWithUser();
  }

  return config;
});

/* =============================
   Endpoints Bancos
   ============================= */
export const listBancos = async (params = {}) => {
  // soporta: page, limit, q, activo, orderBy, orderDir
  const { data } = await client.get('/bancos', { params });
  return data;
};

export const getBanco = async (id) => {
  const { data } = await client.get(`/bancos/${id}`);
  return data;
};

export const createBanco = async (payload) => {
  const { data } = await client.post('/bancos', payload);
  return data;
};

export const updateBanco = async (id, payload) => {
  const { data } = await client.patch(`/bancos/${id}`, payload);
  return data;
};

export const deleteBanco = async (id) => {
  const { data } = await client.delete(`/bancos/${id}`);
  return data;
};
