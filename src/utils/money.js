// ===============================
// FILE: src/utils/money.js
// ===============================
export const moneyAR = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(
    Number(n) || 0
  );

export const round2 = (n) =>
  Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
