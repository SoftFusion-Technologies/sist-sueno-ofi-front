// src/utils/bankingFormat.js
export const formatDateTimeAR = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const padCheque = (n, width = 6) => String(n ?? '').padStart(width, '0');
