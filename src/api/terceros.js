// src/api/terceros.js
import { client } from './bancos';

// Todas aceptan params genéricos si tu backend soporta paginado/filtro
export const listClientes = async (params = {}) => {
  const { data } = await client.get('/clientes', { params });
  return Array.isArray(data) ? data : data?.data || [];
};

export const listProveedores = async (params = {}) => {
  const { data } = await client.get('/proveedores', { params });
  return Array.isArray(data) ? data : data?.data || [];
};

// Si ventas devuelve {data, meta} o array, lo manejamos igual
export const listVentas = async (params = {}) => {
  const { data } = await client.get('/ventas', { params });
  return Array.isArray(data) ? data : data?.data || [];
};
