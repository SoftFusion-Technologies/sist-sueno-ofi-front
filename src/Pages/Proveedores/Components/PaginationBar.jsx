import React from 'react';

export default function PaginationBar({
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const [jumpOpen, setJumpOpen] = React.useState(false);
  const [jumpVal, setJumpVal] = React.useState(String(page));
  const [isMobile, setIsMobile] = React.useState(false);

  const jumpRef = React.useRef(null);

  React.useEffect(() => setJumpVal(String(page)), [page]);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  // ESC para cerrar el popover/sheet
  React.useEffect(() => {
    if (!jumpOpen) return;
    const onKey = (e) => e.key === 'Escape' && setJumpOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jumpOpen]);

  const go = (p) => onPageChange?.(Math.min(Math.max(1, p), totalPages));

  const range = getPageRange(page, totalPages, 1); // delta 1 => 2 vecinas

  // Cerrar popover desktop con click afuera
  React.useEffect(() => {
    if (!jumpOpen || isMobile) return;
    const onClick = (e) => {
      if (!jumpRef.current) return;
      if (!jumpRef.current.contains(e.target)) setJumpOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [jumpOpen, isMobile]);

  return (
    <div className="mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="w-full rounded-xl px-3 md:px-4 py-3 flex items-center justify-between gap-3
                     bg-[rgba(16,18,20,0.85)] border border-white/10 backdrop-blur-md"
          role="navigation"
          aria-label="Paginación de proveedores"
        >
          {/* Izquierda: info y (opcional) items por página */}
          <div className="flex items-center gap-3 text-sm text-gray-300 tabular-nums">
            <span>
              Página <b className="text-gray-100">{page}</b> de{' '}
              <b className="text-gray-100">{totalPages}</b>
            </span>
            {typeof onPageSizeChange === 'function' && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-gray-500">•</span>
                <label className="text-gray-400">Items</label>
                <select
                  aria-label="Items por página"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 rounded-md bg-[#0f1213] border border-white/10 text-gray-200
                             focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  {[12, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Centro: botones (oculto en mobile) */}
          <div className="hidden sm:flex items-center gap-1">
            <PageBtn
              label="«"
              disabled={!canPrev}
              onClick={() => go(1)}
              title="Primera"
            />
            <PageBtn
              label="‹"
              disabled={!canPrev}
              onClick={() => go(page - 1)}
              title="Anterior"
            />
            {range.map((it, idx) =>
              it === '…' ? (
                <span
                  key={`dots-${idx}`}
                  className="w-9 h-9 grid place-items-center text-gray-400 select-none"
                >
                  …
                </span>
              ) : (
                <PageBtn
                  key={it}
                  label={String(it)}
                  active={it === page}
                  onClick={() => go(it)}
                  ariaCurrent={it === page ? 'page' : undefined}
                />
              )
            )}
            <PageBtn
              label="›"
              disabled={!canNext}
              onClick={() => go(page + 1)}
              title="Siguiente"
            />
            <PageBtn
              label="»"
              disabled={!canNext}
              onClick={() => go(totalPages)}
              title="Última"
            />
          </div>

          {/* Derecha: salto rápido + prev/next móvil */}
          <div className="flex items-center gap-2">
            {/* Mobile prev/next */}
            <div className="sm:hidden flex items-center gap-1">
              <PageBtn
                label="‹"
                compact
                disabled={!canPrev}
                onClick={() => go(page - 1)}
                title="Anterior"
              />
              <PageBtn
                label="›"
                compact
                disabled={!canNext}
                onClick={() => go(page + 1)}
                title="Siguiente"
              />
            </div>

            {/* Botón Ir */}
            <div className="relative" ref={jumpRef}>
              <button
                onClick={() => setJumpOpen(true)}
                className="px-3 py-2 rounded-lg border border-white/15 text-gray-200 hover:bg-white/5 text-sm"
                title="Ir a página"
                aria-haspopup="dialog"
                aria-expanded={jumpOpen}
              >
                Ir
              </button>

              {/* Desktop: popover compacto */}
              {!isMobile && jumpOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-[#0f1213] border border-white/10 rounded-lg p-2 shadow-xl z-10"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="text-xs text-gray-400 mb-1">Ir a página</div>
                  <div className="flex items-center gap-2">
                    <input
                      value={jumpVal}
                      onChange={(e) =>
                        setJumpVal(e.target.value.replace(/\D+/g, ''))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          go(Number(jumpVal || page));
                          setJumpOpen(false);
                        }
                      }}
                      className="flex-1 px-2 py-1 rounded-md bg-[#0e1112] border border-white/10 text-gray-100
                                 focus:outline-none focus:ring-1 focus:ring-white/20 tabular-nums"
                      placeholder={`${page}`}
                      inputMode="numeric"
                      aria-label="Número de página"
                    />
                    <button
                      onClick={() => {
                        go(Number(jumpVal || page));
                        setJumpOpen(false);
                      }}
                      className="px-2 py-1 rounded-md bg-emerald-500/90 hover:bg-emerald-500 text-black text-sm"
                    >
                      Ir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: bottom sheet */}
        {isMobile && jumpOpen && (
          <div
            className="fixed inset-0 z-40"
            aria-modal="true"
            role="dialog"
            aria-label="Ir a página"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setJumpOpen(false)}
            />
            {/* Sheet */}
            <div className="absolute bottom-0 inset-x-0">
              <div
                className="mx-auto w-full max-w-7xl rounded-t-2xl bg-[#0f1213] border-t border-white/10 p-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
                <div className="text-sm text-gray-300 mb-2 text-center">
                  Ir a página (1–{totalPages})
                </div>
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={jumpVal}
                    onChange={(e) =>
                      setJumpVal(e.target.value.replace(/\D+/g, ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        go(Number(jumpVal || page));
                        setJumpOpen(false);
                      }
                    }}
                    className="flex-1 px-3 py-3 rounded-xl bg-[#0e1112] border border-white/10 text-gray-100
                               focus:outline-none focus:ring-1 focus:ring-white/20 tabular-nums text-base"
                    placeholder={`${page}`}
                    inputMode="numeric"
                    aria-label="Número de página"
                  />
                  <button
                    onClick={() => {
                      go(Number(jumpVal || page));
                      setJumpOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold"
                  >
                    Ir
                  </button>
                </div>
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setJumpOpen(false)}
                    className="text-gray-400 text-sm underline underline-offset-4 decoration-dotted"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// rango compacto con elipsis y ancho estable
function getPageRange(current, total, delta = 1) {
  const range = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('…');

  for (let i = left; i <= right; i++) range.push(i);

  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);

  // bordes
  if (current === 1 && total >= 3) {
    if (!range.includes(2)) range.splice(1, 0, 2);
  }
  if (current === total && total >= 3) {
    if (!range.includes(total - 1))
      range.splice(range.length - 1, 0, total - 1);
  }
  return [...new Set(range)];
}

function PageBtn({
  label,
  onClick,
  disabled,
  active,
  title,
  compact,
  ariaCurrent
}) {
  const base =
    'grid place-items-center rounded-lg border text-sm transition select-none tabular-nums';
  const size = compact ? 'w-8 h-8' : 'w-9 h-9';
  const styles = active
    ? 'border-white/20 bg-white/10 text-gray-100'
    : disabled
    ? 'border-white/10 text-gray-500 cursor-not-allowed'
    : 'border-white/15 text-gray-200 hover:bg-white/5';
  return (
    <button
      type="button"
      aria-current={ariaCurrent}
      title={title || (typeof label === 'string' ? label : undefined)}
      className={`${base} ${size} ${styles}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
