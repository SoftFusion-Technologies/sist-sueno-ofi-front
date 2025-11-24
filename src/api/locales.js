// src/api/locales.js
import { client } from './bancos';

export const listLocales = async (params = {}) => {
  const { data } = await client.get('/locales', { params });
  return Array.isArray(data) ? data : data?.data || [];
};
