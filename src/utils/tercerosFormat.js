// src/utils/tercerosFormat.js
const fmtDNI = (dni) => {
  const s = String(dni || '').replace(/\D/g, '');
  // 8 dígitos → 43.849.860
  return s.replace(/(\d{1,2})(\d{3})(\d{3})$/, '$1.$2.$3');
};

const fmtCUIT = (cuit) => {
  const s = String(cuit || '').replace(/\D/g, '');
  // 11 dígitos → 20-12345678-3
  return s.replace(/(\d{2})(\d{8})(\d{1})$/, '$1-$2-$3');
};

export const fmtDoc = (t) => {
  if (!t) return '';
  if (t.cuit) return `CUIT ${fmtCUIT(t.cuit)}`;
  if (t.cuil) return `CUIL ${fmtCUIT(t.cuil)}`;
  if (t.dni) return `DNI ${fmtDNI(t.dni)}`;
  if (t.documento) return `Doc ${t.documento}`;
  return '';
};

export const getTerceroSearchText = (t) => {
  if (!t) return '';
  const tokens = [
    t.id,
    t.nombre,
    t.razon_social,
    t.dni,
    t.cuit,
    t.cuil,
    t.documento,
    t.telefono,
    t.email,
    t.direccion
  ].filter(Boolean);
  return tokens.join(' ');
};

export const fmtTercero = (t) => {
  if (!t) return '';
  const nom = t.nombre || t.razon_social || '';
  const doc = fmtDoc(t);
  // const tel = t.telefono ? `📞 ${t.telefono}` : '';
  return [nom, doc].filter(Boolean).join(' • ');
};
