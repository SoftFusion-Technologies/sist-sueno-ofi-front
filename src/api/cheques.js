// src/api/cheques.js
import { client } from './bancos'; // ya trae baseURL e interceptor con usuario_log_id

// Listado (filtros opcionales)
export const listCheques = async (params = {}) => {
  const { data } = await client.get('/cheques', { params });
  return data;
};

export const getCheque = async (id) => {
  const { data } = await client.get(`/cheques/${id}`);
  return data;
};

// payload: { tipo, canal, banco_id?, chequera_id?, numero, monto, fechas..., refs blandas..., beneficiario_nombre?, observaciones? }
export const createCheque = async (payload) => {
  const { data } = await client.post('/cheques', payload);
  return data;
};

export const updateCheque = async (id, payload) => {
  const { data } = await client.patch(`/cheques/${id}`, payload);
  return data;
};

export const deleteCheque = async (id) => {
  const { data } = await client.delete(`/cheques/${id}`);
  return data;
};

/* ========================
 * Transiciones de estado
 * ======================*/
export const depositarCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/depositar`, payload);
  return data;
};
export const acreditarCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/acreditar`, payload);
  return data;
};
export const rechazarCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/rechazar`, payload);
  return data;
};
export const aplicarProveedorCheque = async (id, payload = {}) => {
  const { data } = await client.patch(
    `/cheques/${id}/aplicar-a-proveedor`,
    payload
  );
  return data;
};
export const entregarCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/entregar`, payload);
  return data;
};
export const compensarCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/compensar`, payload);
  return data;
};
export const anularCheque = async (id, payload = {}) => {
  const { data } = await client.patch(`/cheques/${id}/anular`, payload);
  return data;
};
