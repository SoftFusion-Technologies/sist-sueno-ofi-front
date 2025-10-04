// src/api/chequeras.js
import { client, url } from './bancos';

export const listChequesByChequera = async (chequeraId, params = {}) => {
  const { data } = await client.get(`/chequeras/${chequeraId}/cheques`, {
    params
  });
  return data;
};

// Filtros soportados (según tu backend): page, limit, q, banco_id, banco_cuenta_id, estado, orderBy, orderDir
export const listChequeras = async (params = {}) => {
  const { data } = await client.get('/chequeras', { params });
  return data;
};

export const getChequera = async (id) => {
  const { data } = await client.get(`/chequeras/${id}`);
  return data;
};

// { banco_cuenta_id, descripcion, nro_desde, nro_hasta, proximo_nro, estado }
export const createChequera = async (payload) => {
  const { data } = await client.post('/chequeras', payload);
  return data;
};

export const updateChequera = async (id, payload) => {
  const { data } = await client.patch(`/chequeras/${id}`, payload);
  return data;
};

// ⚠️ aceptar params (p.ej. { forzar:1 })
export const deleteChequera = async (id, params = {}) => {
  const { data } = await client.delete(`/chequeras/${id}`, { params });
  return data;
};
