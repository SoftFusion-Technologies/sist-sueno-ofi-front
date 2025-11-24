// src/api/productos.js
import { client } from './bancos';

export const listProductos = async (params = {}) => {
  const { data } = await client.get('/productos', { params });
  return Array.isArray(data) ? data : data?.data || [];
};
