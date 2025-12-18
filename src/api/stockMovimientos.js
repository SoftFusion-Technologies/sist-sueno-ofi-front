// src/api/stockMovimientos.js
import axios from 'axios';
import { client } from './bancos';


export async function listStockMovimientos(params = {}) {
  const { data } = await client.get('/stock-movimientos', { params });
  return data;
}

export async function getStockMovimiento(id) {
  const { data } = await client.get(`/stock-movimientos/${id}`);
  return data;
}

export async function createStockMovimiento(payload) {
  const { data } = await client.post('/stock-movimientos', payload);
  return data;
}

export async function updateStockMovimientoNotas(id, notas) {
  const { data } = await client.put(`/stock-movimientos/${id}`, { notas });
  return data;
}

export async function revertirStockMovimiento(id) {
  const { data } = await client.post(`/stock-movimientos/${id}/revertir`);
  return data;
}
