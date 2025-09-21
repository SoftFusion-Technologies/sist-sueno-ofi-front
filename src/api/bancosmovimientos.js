// src/api/bancosmovimientos.js
import { client, url } from './bancos';

// Listado con filtros: q, banco_id, banco_cuenta_id, fecha_from, fecha_to,
// referencia_tipo, referencia_id, includeSaldoAcumulado, orderBy, orderDir, page, limit
export const listBancoMovimientos = async (params = {}) => {
  const { data } = await client.get('/banco-movimientos', { params });
  return data;
};

export const getBancoMovimiento = async (id) => {
  const { data } = await client.get(`/banco-movimientos/${id}`);
  return data;
};

export const createBancoMovimiento = async (payload) => {
  // payload: { banco_cuenta_id, fecha, descripcion, debito, credito, referencia_tipo?, referencia_id? }
  const { data } = await client.post('/banco-movimientos', payload);
  return data;
};

export const updateBancoMovimiento = async (id, payload) => {
  const { data } = await client.patch(`/banco-movimientos/${id}`, payload);
  return data;
};

export const deleteBancoMovimiento = async (id) => {
  const { data } = await client.delete(`/banco-movimientos/${id}`);
  return data;
};

// Extras opcionales del backend (KPIs/Export)
export const getSaldoCuenta = async (bancoCuentaId, hasta) => {
  const { data } = await client.get(`/banco-cuentas/${bancoCuentaId}/saldo`, {
    params: { hasta }
  });
  return data;
};

export const getResumenCuenta = async (
  bancoCuentaId,
  from,
  to,
  group = 'day'
) => {
  const { data } = await client.get(`/banco-cuentas/${bancoCuentaId}/resumen`, {
    params: { from, to, group }
  });
  return data;
};

export const exportMovimientosCSV = async ({
  banco_cuenta_id,
  from,
  to,
  filename
}) => {
  const { data } = await client.get('/banco-movimientos/export.csv', {
    params: { banco_cuenta_id, from, to },
    responseType: 'blob'
  });
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download =
    filename || `movimientos_${banco_cuenta_id}_${from}_${to}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};
