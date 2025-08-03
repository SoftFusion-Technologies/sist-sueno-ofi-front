function TotalConOpciones({
  totalCalculado,
  formatearPrecio,
  aplicarDescuento,
  setAplicarDescuento,
  descuentoPersonalizado,
  setDescuentoPersonalizado,
  mostrarValorTicket,
  setMostrarValorTicket
}) {
  return (
    <>
      {/* Selector aplicar descuento */}
      <div className="flex justify-end items-center gap-6 mb-2 text-white select-none text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="aplicarDescuento"
            checked={aplicarDescuento}
            onChange={() => setAplicarDescuento(true)}
            className="accent-emerald-400"
          />
          Aplicar
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="aplicarDescuento"
            checked={!aplicarDescuento}
            onChange={() => setAplicarDescuento(false)}
            className="accent-emerald-400"
          />
          No aplicar
        </label>
        {/* Input solo si está activo */}
        {aplicarDescuento && (
          <input
            type="number"
            min={0}
            max={100}
            value={descuentoPersonalizado}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val < 0) val = 0;
              if (val > 100) val = 100;
              setDescuentoPersonalizado(val);
            }}
            placeholder="Descuento %"
            className="w-20 px-2 py-1 rounded bg-gray-100 text-black font-bold"
          />
        )}
      </div>

      {/* Toggle mostrar valor ticket */}
      <div className="flex justify-end items-center gap-3 mt-4 text-white select-none text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarValorTicket}
            onChange={() => setMostrarValorTicket((prev) => !prev)}
            className="accent-emerald-400"
          />
          Mostrar valor del ticket
        </label>
      </div>

      {totalCalculado.total === 0 && (
        <div className="text-red-500 font-bold text-center mt-2">
          ¡Atención! Estás por registrar una venta gratuita (descuento 100%).
        </div>
      )}

      {/* Total */}
      {totalCalculado && totalCalculado.total > 0 && (
        <div className="text-right text-lg font-bold text-white space-y-1">
          <div>
            Total:{' '}
            {aplicarDescuento &&
            totalCalculado.precio_base !== totalCalculado.total ? (
              <>
                <span className="line-through text-red-400 mr-2">
                  {formatearPrecio(totalCalculado.precio_base)}
                </span>
                <span
                  className={
                    totalCalculado.ajuste_porcentual < 0
                      ? 'text-emerald-400'
                      : 'text-orange-300'
                  }
                >
                  {formatearPrecio(totalCalculado.total)}
                </span>
              </>
            ) : (
              <span>{formatearPrecio(totalCalculado.precio_base)}</span>
            )}
          </div>

          {aplicarDescuento &&
            totalCalculado.monto_por_cuota &&
            totalCalculado.cuotas > 1 && (
              <div className="text-xs text-gray-300">
                {totalCalculado.cuotas - 1} cuotas de{' '}
                {formatearPrecio(totalCalculado.monto_por_cuota)} y 1 cuota de{' '}
                {formatearPrecio(
                  totalCalculado.monto_por_cuota +
                    totalCalculado.diferencia_redondeo
                )}
              </div>
            )}

          {aplicarDescuento &&
            (totalCalculado.ajuste_porcentual !== 0 ||
              totalCalculado.porcentaje_recargo_cuotas !== 0) && (
              <div
                className={`text-xs font-medium italic ${
                  totalCalculado.ajuste_porcentual < 0
                    ? 'text-emerald-300'
                    : 'text-orange-300'
                }`}
              >
                {totalCalculado.ajuste_porcentual > 0 &&
                  `+${totalCalculado.ajuste_porcentual}% por método de pago`}
                {totalCalculado.ajuste_porcentual < 0 &&
                  `${Math.abs(totalCalculado.ajuste_porcentual)}% de descuento`}
                {totalCalculado.porcentaje_recargo_cuotas > 0 &&
                  ` + ${totalCalculado.porcentaje_recargo_cuotas}% por ${
                    totalCalculado.cuotas
                  } cuota${totalCalculado.cuotas > 1 ? 's' : ''}`}
              </div>
            )}
        </div>
      )}
    </>
  );
}

export default TotalConOpciones;
