// src/api/chequesmovimientos.js
import { client } from './bancos'; // baseURL + interceptor con usuario_log_id

const basePath = (chequeId) => `/cheques/${chequeId}/movimientos`;

const globalBasePath = '/cheques/movimientos';

export const listAllChequeMovimientos = async (params = {}) => {
  const { data } = await client.get(globalBasePath, { params });
  return data;
};
// Listado con filtros opcionales: { q, tipo, desde, hasta, page, pageSize }
export const listChequeMovimientos = async (chequeId, params = {}) => {
  if (!chequeId) throw new Error('chequeId es requerido');
  const { data } = await client.get(basePath(chequeId), { params });
  return data; // se espera { items, total, page, pageSize }
};

export const getChequeMovimiento = async (chequeId, id) => {
  if (!chequeId || !id) throw new Error('chequeId e id son requeridos');
  const { data } = await client.get(`${basePath(chequeId)}/${id}`);
  return data; // detalle del movimiento
};

// payload sugerido: { tipo, canal, referencia, monto, fecha_mov, observaciones }
export const createChequeMovimiento = async (chequeId, payload) => {
  if (!chequeId) throw new Error('chequeId es requerido');
  const { data } = await client.post(basePath(chequeId), payload);
  return data; // { message, creado }
};

export const updateChequeMovimiento = async (chequeId, id, payload) => {
  if (!chequeId || !id) throw new Error('chequeId e id son requeridos');
  const { data } = await client.patch(`${basePath(chequeId)}/${id}`, payload);
  return data; // { message, actualizado }
};

export const deleteChequeMovimiento = async (chequeId, id) => {
  if (!chequeId || !id) throw new Error('chequeId e id son requeridos');
  const { data } = await client.delete(`${basePath(chequeId)}/${id}`);
  return data; // { message, eliminado: true }
};
