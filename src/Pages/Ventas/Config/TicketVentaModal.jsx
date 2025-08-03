import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* ------------------------ Utils ------------------------ */

const formatCurrency = (n) =>
  Number(n || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

/**
 * Convierte un número a letras en español (monto en pesos argentinos).
 * Soporta hasta miles de millones, con centavos.
 */
function numeroALetras(num) {
  const UNIDADES = [
    '',
    'uno',
    'dos',
    'tres',
    'cuatro',
    'cinco',
    'seis',
    'siete',
    'ocho',
    'nueve',
    'diez',
    'once',
    'doce',
    'trece',
    'catorce',
    'quince',
    'dieciseis',
    'diecisiete',
    'dieciocho',
    'diecinueve',
    'veinte'
  ];

  const DECENAS = [
    '',
    'diez',
    'veinte',
    'treinta',
    'cuarenta',
    'cincuenta',
    'sesenta',
    'setenta',
    'ochenta',
    'noventa'
  ];

  const CENTENAS = [
    '',
    'cien',
    'doscientos',
    'trescientos',
    'cuatrocientos',
    'quinientos',
    'seiscientos',
    'setecientos',
    'ochocientos',
    'novecientos'
  ];

  const secciones = (num) => {
    const millones = Math.floor(num / 1000000);
    const miles = Math.floor((num - millones * 1000000) / 1000);
    const cientos = num - millones * 1000000 - miles * 1000;
    return { millones, miles, cientos };
  };

  const centenas = (num) => {
    if (num === 0) return '';
    if (num === 100) return 'cien';
    const c = Math.floor(num / 100);
    const resto = num % 100;
    return `${CENTENAS[c]}${resto > 0 ? ' ' + decenas(resto) : ''}`;
  };

  const decenas = (num) => {
    if (num === 0) return '';
    if (num <= 20) return UNIDADES[num];
    const d = Math.floor(num / 10);
    const u = num % 10;
    if (num >= 21 && num <= 29) {
      return `veinti${UNIDADES[u]}`;
    }
    return `${DECENAS[d]}${u > 0 ? ' y ' + UNIDADES[u] : ''}`;
  };

  const miles = (num) => {
    if (num === 0) return '';
    if (num < 1000) return centenas(num);
    const m = Math.floor(num / 1000);
    const resto = num % 1000;
    const milesTxt = m === 1 ? 'mil' : `${centenas(m)} mil`;
    return `${milesTxt}${resto > 0 ? ' ' + centenas(resto) : ''}`;
  };

  const millones = (num) => {
    if (num < 1000000) return miles(num);
    const mill = Math.floor(num / 1000000);
    const resto = num % 1000000;
    const millTxt = mill === 1 ? 'un millon' : `${miles(mill)} millones`;
    return `${millTxt}${resto > 0 ? ' ' + miles(resto) : ''}`;
  };

  const entero = Math.floor(Math.abs(num));
  const cent = Math.round((Math.abs(num) - entero) * 100);

  const letrasEntero = entero === 0 ? 'cero' : millones(entero);

  const letrasCentavos =
    cent > 0 ? ` con ${cent.toString().padStart(2, '0')}/100` : '';

  // Ajustes de género y casos especiales
  const final =
    letrasEntero
      .replace(' uno ', ' un ')
      .replace(/ uno$/, ' un')
      .replace(/^uno$/, 'un') + letrasCentavos;

  return `${final.toUpperCase()} PESOS`;
}

/* ------------------------------------------------------ */

export default function TicketVentaModal({ venta, onClose, mostrarValorTicket }) {
  const ref = useRef();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:8080/ticket-config')
      .then((res) => setConfig(res.data))
      .catch(() => setConfig(null));
  }, []);

  if (!venta) return null;

  const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];
  const descuentos = Array.isArray(venta.descuentos) ? venta.descuentos : [];

  // Totales (más consistentes y claros)
  const subtotalBruto = detalles.reduce((acc, d) => {
    const p = Number(d.stock?.producto?.precio ?? 0);
    return acc + p * d.cantidad;
  }, 0);

  const totalCobradoProductos = detalles.reduce((acc, d) => {
    const p = Number(d.precio_unitario ?? 0);
    return acc + p * d.cantidad;
  }, 0);

  const totalDescuentoProductos = Math.max(
    0,
    subtotalBruto - totalCobradoProductos
  );

  // Solo 1 medio de pago (según confirmaste)
  const descuentoMedioPago = descuentos
    .filter((d) => d.tipo === 'medio_pago')
    .reduce((acc, d) => acc + Math.abs(Number(d.monto || 0)), 0);

  const descuentoManual = descuentos
    .filter((d) => d.tipo === 'manual')
    .reduce((acc, d) => acc + Math.abs(Number(d.monto || 0)), 0);

  const subtotal = totalCobradoProductos; // luego de aplicar descuento por productos

  const recargoPorcentaje = Number(venta.recargo_porcentaje || 0);
  const recargoMonto =
    recargoPorcentaje > 0
      ? (Number(venta.precio_base || subtotal) * recargoPorcentaje) / 100
      : 0;

  const totalCalculado =
    subtotal - descuentoMedioPago - descuentoManual + recargoMonto;

  const totalFinal = Number(venta.total ?? totalCalculado);
  const totalEnLetras = numeroALetras(totalFinal);

  const medioPago = descuentos.find((d) => d.tipo === 'medio_pago');

  const exportPDF = async () => {
    const element = ref.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px', // usamos píxeles para mayor control
      format: [canvas.width, canvas.height] // se adapta a la altura real
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`ticket-venta-${venta.id}.pdf`);
  };

  const printTicket = () => {
    const printContents = ref.current.innerHTML;
    const win = window.open('', '', 'width=600,height=800');

    win.document.write(`
    <html>
      <head>
        <title>Ticket de Venta</title>
        <style>
          @media print {
            body {
              width: 58mm;
              margin: 0 auto;
            }
          }

          body {
            font-family: 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            color: #1f2937;
            padding: 16px 12px;
            line-height: 1.6;
            text-align: center;
          }

          h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 1px;
            color: #059669;
          }

          .ticket-header {
            margin-bottom: 8px;
          }

          .ticket-header div {
            font-size: 12px;
            color: #6b7280;
          }

          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #059669;
            margin: 16px 0 6px;
            padding-top: 6px;
            border-top: 1px dashed #ccc;
          }

          .line {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
            text-align: left;
          }

          .line-center {
            justify-content: center;
            text-align: center;
          }

          .bold {
            font-weight: bold;
          }

          .total {
            font-size: 16px;
            font-weight: 800;
            color: #047857;
            margin-top: 10px;
          }

          .cuotas {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }

          .footer {
            margin-top: 16px;
            font-size: 11px;
            text-align: center;
            color: #6b7280;
            line-height: 1.4;
          }

          del {
            color: #9ca3af;
            font-size: 11px;
          }

          .tabular-nums {
            font-variant-numeric: tabular-nums;
          }

          .spacer {
            margin: 8px 0;
          }

          img {
            max-height: 50px;
            margin: 0 auto 8px;
            display: block;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl relative border border-[#059669] animate-fade-in overflow-auto max-h-[90vh]">
        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-3xl text-gray-400 hover:text-[#059669] dark:hover:text-emerald-400"
          title="Cerrar"
        >
          ×
        </button>

        {/* TICKET */}
        <div
          ref={ref}
          className="ticket-pdf font-mono text-sm text-black dark:text-white p-4"
          style={{ background: 'white', borderRadius: '12px', minWidth: 260 }}
        >
          {/* Encabezado */}
          <div className="text-center mb-4">
            {/* Ticket simple */}
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              TICKET SIMPLE
            </div>

            {config?.logo_url && (
              <img
                src={config.logo_url}
                alt="Logo"
                className="mx-auto mb-2 max-h-16 object-contain rounded shadow"
                style={{ maxWidth: 120 }}
              />
            )}

            <div
              className="font-extrabold text-2xl tracking-widest mb-1 uppercase"
              style={{ color: '#6d28d9', letterSpacing: 2 }}
            >
              {config?.nombre_tienda || ''}
            </div>

            {config?.lema && (
              <div
                className="text-xs font-bold tracking-widest mb-1"
                style={{ color: '#059669' }}
              >
                {config.lema}
              </div>
            )}

            {(config?.direccion || config?.telefono) && (
              <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">
                {config?.direccion}
                {config?.telefono && <span> • {config.telefono}</span>}
              </div>
            )}

            {config?.email && (
              <div className="text-xs text-gray-500">{config.email}</div>
            )}
          </div>

          {/* Info Venta */}
          <div className="flex justify-between mb-3 font-semibold text-gray-700 dark:text-gray-200 text-lg">
            <span>Venta #{venta.id}</span>
            <span className="text-xs text-gray-400 dark:text-gray-300">
              {venta.fecha ? new Date(venta.fecha).toLocaleString() : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1 mb-3 text-gray-800 dark:text-gray-200 text-sm">
            <div>
              <span className="font-bold">Vendedor:</span>{' '}
              <span>{venta.usuario?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold">Local:</span>{' '}
              <span>{venta.locale?.nombre || '-'}</span>
            </div>
            <div>
              <span className="font-bold">Cliente:</span>{' '}
              <span>{venta.cliente?.nombre || 'Consumidor Final'}</span>
            </div>
          </div>

          {/* Artículos */}
          <div
            className="mb-2 mt-5 text-sm font-bold tracking-widest text-center"
            style={{ color: '#059669' }}
          >
            ARTÍCULOS
          </div>

          <div className="mb-4 space-y-3">
            {detalles.length === 0 ? (
              <div className="text-center text-gray-400 py-2">
                Cargando productos...
              </div>
            ) : (
              detalles.map((d) => {
                const nombre = d.stock?.producto?.nombre || 'Producto';
                const talle = d.stock?.talle?.nombre
                  ? ` - ${d.stock.talle.nombre}`
                  : '';
                const cantidad = d.cantidad;

                const precioOriginalUnit = Number(
                  d.stock?.producto?.precio ?? 0
                );
                const precioCobradoUnit = Number(d.precio_unitario ?? 0);

                const precioOriginalTotal = precioOriginalUnit * cantidad;
                const precioCobradoTotal = precioCobradoUnit * cantidad;

                const diferencia = Math.max(
                  0,
                  precioOriginalTotal - precioCobradoTotal
                );
                const porcentaje =
                  precioOriginalTotal > 0
                    ? ((diferencia / precioOriginalTotal) * 100).toFixed(2)
                    : 0;

                return (
                  <div
                    key={d.id}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-800"
                  >
                    <div className="flex justify-between text-sm font-semibold">
                      <span>
                        {nombre}
                        {talle}{' '}
                        <span className="text-xs text-gray-400">
                          ×{cantidad}
                        </span>
                      </span>
                      {/* Ocultar precios si el toggle está apagado */}
                      {mostrarValorTicket && (
                        <span className="tabular-nums">
                          ${formatCurrency(precioCobradoTotal)}
                        </span>
                      )}
                    </div>

                    {/* Precio unitario + descuento */}
                    {/* Mostrar info de precio unitario y descuentos solo si está activo */}
                    {mostrarValorTicket && (
                      <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                        <span>
                          Unit: ${formatCurrency(precioCobradoUnit)}
                          {diferencia > 0 && (
                            <>
                              {' '}
                              <del className="text-gray-400">
                                ${formatCurrency(precioOriginalUnit)}
                              </del>
                            </>
                          )}
                        </span>
                        {diferencia > 0 && (
                          <span className="text-red-500">
                            -${formatCurrency(diferencia)} ({porcentaje}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Descuentos manuales */}
          {descuentoManual > 0 && (
            <div className="mb-4 mt-2">
              <div className="text-sm font-bold text-gray-700 dark:text-white mb-1">
                Descuentos personalizados
              </div>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {descuentos
                  .filter((d) => d.tipo === 'manual')
                  .map((d) => (
                    <li key={d.id} className="flex justify-between">
                      <span>
                        🛍️ {d.detalle}{' '}
                        <span className="text-xs text-gray-400">
                          ({Number(d.porcentaje || 0).toFixed(2)}%)
                        </span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        -${formatCurrency(Math.abs(Number(d.monto)))}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Descuento por medio de pago */}
          {medioPago && (
            <div className="mb-4 mt-2">
              <div className="text-sm font-bold text-gray-700 dark:text-white mb-1">
                {Number(medioPago.porcentaje) < 0
                  ? 'Descuento por medio de pago'
                  : 'Recargo por medio de pago'}
              </div>
              <div
                className={`flex justify-between text-sm ${
                  Number(medioPago.porcentaje) < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                <span>
                  💳 {medioPago.detalle}{' '}
                  <span className="text-xs text-gray-400">
                    ({Number(medioPago.porcentaje).toFixed(2)}%)
                  </span>
                </span>
                <span className="font-semibold tabular-nums">
                  {Number(medioPago.porcentaje) < 0 ? '-' : '+'}$
                  {formatCurrency(Math.abs(Number(medioPago.monto)))}
                </span>
              </div>
            </div>
          )}

          {/* Resumen de totales */}
          <div className="border-t border-dotted border-gray-300 mt-4 pt-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Subtotal bruto</span>
              <span>${formatCurrency(subtotalBruto)}</span>
            </div>

            {totalDescuentoProductos > 0 && (
              <div className="flex justify-between text-sm text-rose-500 font-semibold">
                <span>Descuento productos</span>
                <span>-${formatCurrency(totalDescuentoProductos)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>

            {descuentoManual > 0 && (
              <div className="flex justify-between text-sm text-rose-500 font-semibold">
                <span>Descuento manual</span>
                <span>-${formatCurrency(descuentoManual)}</span>
              </div>
            )}

            {medioPago && Number(medioPago.porcentaje) < 0 && (
              <div className="flex justify-between text-sm text-rose-500 font-semibold">
                <span>Descuento medio de pago</span>
                <span>
                  -${formatCurrency(Math.abs(Number(medioPago.monto)))}
                </span>
              </div>
            )}

            {recargoPorcentaje > 0 && (
              <div className="flex justify-between text-sm text-orange-500 font-semibold">
                <span>
                  Recargo método pago ({recargoPorcentaje.toFixed(2)}%)
                </span>
                <span>+${formatCurrency(recargoMonto)}</span>
              </div>
            )}

            {Number(venta.recargo_cuotas_porcentaje) > 0 && (
              <div className="flex justify-between text-sm text-orange-500 font-semibold">
                <span>
                  Recargo por cuotas (
                  {Number(venta.recargo_cuotas_porcentaje).toFixed(2)}%)
                </span>
                <span>
                  +$
                  {formatCurrency(
                    (Number(venta.precio_base) *
                      Number(venta.recargo_cuotas_porcentaje)) /
                      100
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between text-lg font-extrabold text-emerald-700 dark:text-emerald-400 mt-3">
              <span>Total</span>
              <span>${formatCurrency(totalFinal)}</span>
            </div>

            {/* Cuotas si aplica */}
            {venta.cuotas > 1 && (
              <div className="text-[13px] font-semibold text-right text-gray-600 dark:text-gray-300 mt-1">
                {venta.cuotas} cuotas de $
                {formatCurrency(totalFinal / venta.cuotas)}
              </div>
            )}

            {/* Línea resumen de recargos */}
            {(recargoPorcentaje > 0 || venta.recargo_cuotas_porcentaje > 0) && (
              <div className="text-xs text-orange-600 text-right font-medium mt-1">
                {recargoPorcentaje > 0 &&
                  `+${recargoPorcentaje.toFixed(2)}% por método de pago`}
                {recargoPorcentaje > 0 &&
                  venta.recargo_cuotas_porcentaje > 0 &&
                  ' + '}
                {venta.recargo_cuotas_porcentaje > 0 &&
                  `+${Number(venta.recargo_cuotas_porcentaje).toFixed(
                    2
                  )}% por ${venta.cuotas} cuotas`}
              </div>
            )}

            {/* Monto en letras */}
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-right">
              {totalEnLetras}
            </div>
          </div>

          {/* Footer */}
          {config?.mensaje_footer ? (
            <div
              className="text-center text-[11px] mt-3 font-medium tracking-wider"
              style={{ color: '#059669', opacity: 0.9 }}
            >
              {config.mensaje_footer}
            </div>
          ) : (
            <div className="text-center text-[11px] mt-3 font-medium tracking-wider text-gray-500">
              ¡Gracias por su compra!
            </div>
          )}
        </div>

        {/* Acciones */}
        <button
          onClick={exportPDF}
          className="mt-5 w-full py-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
        >
          Descargar PDF
        </button>

        <button
          onClick={printTicket}
          className="mt-2 w-full py-2 rounded-lg font-bold bg-zinc-700 hover:bg-zinc-900 text-white shadow-md transition"
        >
          Imprimir directo
        </button>

        <button
          onClick={() => navigate('/dashboard/ventas/caja')}
          className="mt-2 w-full py-2 rounded-lg font-bold bg-emerald-900 hover:bg-emerald-800 text-white shadow-md transition"
        >
          Ir a Caja
        </button>
      </div>
    </div>
  );
}
