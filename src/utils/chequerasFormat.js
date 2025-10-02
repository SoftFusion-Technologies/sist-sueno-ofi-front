// src/utils/chequerasFormat.js
import { padCheque, formatDateTimeAR } from './bankingFormat';

/**
 * cheq: objeto chequera
 * cuentasIdx?: { [id]: cuenta }
 * bancosIdx?: { [id]: banco }
 */
export const fmtChequera = (cheq, cuentasIdx = null, bancosIdx = null) => {
  if (!cheq) return '';

  const cuenta =
    cheq.cuenta || (cuentasIdx?.[String(cheq.banco_cuenta_id)] ?? null);
  const banco =
    cuenta?.banco ||
    (cuenta?.banco_id && bancosIdx?.[String(cuenta.banco_id)]) ||
    null;

  const bancoNombre = banco?.nombre || banco?.razon_social || '';
  const nombreCuenta = cuenta?.nombre_cuenta || '';
  const moneda = cuenta?.moneda || '';
  const numeroCuenta = cuenta?.numero_cuenta || '';
  const aliasCBU = cuenta?.alias_cbu || '';
  const cbu = cuenta?.cbu || '';

  // ancho de padding de cheque según nro_hasta
  const width = String(cheq.nro_hasta ?? '').length || 6;

  const rango =
    cheq.nro_desde != null && cheq.nro_hasta != null
      ? `${padCheque(cheq.nro_desde, width)}–${padCheque(
          cheq.nro_hasta,
          width
        )}`
      : '';

  const proximo =
    cheq.proximo_nro != null ? padCheque(cheq.proximo_nro, width) : null;

  const encabezado = `Chequera ${cheq.descripcion ?? ''}`.trim();
  const cuentaLinea = [
    bancoNombre,
    nombreCuenta && `${nombreCuenta} (${moneda || 'ARS'})`,
    numeroCuenta || aliasCBU || cbu
  ]
    .filter(Boolean)
    .join(' · ');

  const extras = [
    rango && `Rango: ${rango}`,
    proximo && `Próximo: ${proximo}`,
    cheq.disponibles != null && `Disponibles: ${cheq.disponibles}`,
    cheq.estado && `Estado: ${cheq.estado}`
  ]
    .filter(Boolean)
    .join(' · ');

  return [encabezado, cuentaLinea, extras].filter(Boolean).join(' — ');
};

export const getChequeraSearchText = (
  cheq,
  cuentasIdx = null,
  bancosIdx = null
) => {
  if (!cheq) return '';

  const cuenta =
    cheq.cuenta || (cuentasIdx?.[String(cheq.banco_cuenta_id)] ?? null);
  const banco =
    cuenta?.banco ||
    (cuenta?.banco_id && bancosIdx?.[String(cuenta.banco_id)]) ||
    null;

  const tokens = [
    cheq.id,
    cheq.descripcion,
    cheq.estado,
    cheq.disponibles,
    cheq.cantidadCheques,
    cheq.nro_desde,
    cheq.nro_hasta,
    cheq.proximo_nro,
    // cuenta
    cuenta?.nombre_cuenta,
    cuenta?.moneda,
    cuenta?.numero_cuenta,
    cuenta?.alias_cbu,
    cuenta?.cbu,
    // banco
    banco?.nombre || banco?.razon_social,
    // timestamps útiles
    formatDateTimeAR(cheq.created_at),
    formatDateTimeAR(cheq.updated_at)
  ].filter(Boolean);

  return tokens.join(' ');
};
