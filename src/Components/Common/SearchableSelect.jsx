// src/Components/Common/SearchableSelect.jsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';

export default function SearchableSelect({
  label,
  items = [],
  value,
  onChange,
  placeholder = 'Seleccionar…',
  disabled = false,
  required = false,
  className = '',
  getOptionLabel = (o) => o?.nombre ?? '',
  getOptionValue = (o) => o?.id,
  portal = false,
  dropdownMaxHeight = '60vh',
  portalZIndex = 2000,
  menuPlacement = 'auto',
  getOptionSearchText = (o, getLabel) => getLabel(o) || '',
  lockBodyScroll = false,
  withBackdrop = true
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const [menuStyle, setMenuStyle] = useState({});
  const [placement, setPlacement] = useState('bottom');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPositioned, setIsPositioned] = useState(false);

  const backdropTap = useRef({ x: 0, y: 0, armed: false });

  const listboxId = useRef(
    `ss-list-${Math.random().toString(36).slice(2)}`
  ).current;

  const selected = useMemo(
    () =>
      items.find((i) => String(getOptionValue(i)) === String(value)) || null,
    [items, value, getOptionValue]
  );

  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  const filtered = useMemo(() => {
    const s = normalize(q.trim());
    if (!s) return items;
    return items.filter((i) =>
      normalize(getOptionSearchText(i, getOptionLabel)).includes(s)
    );
  }, [items, q, getOptionLabel, getOptionSearchText]);

  // ===== Scroll-lock del body (opcional) =====
  useEffect(() => {
    if (!portal || !lockBodyScroll) return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, portal, lockBodyScroll]);

  // ===== Posicionamiento del menú cuando es portal =====
  const computePosition = useCallback(() => {
    if (!portal || !rootRef.current) return;

    const rect = rootRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceAbove = rect.top;
    const spaceBelow = vh - rect.bottom;

    let want = menuPlacement;
    if (menuPlacement === 'auto') {
      want = spaceBelow >= 240 || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    }
    setPlacement(want);

    const width = Math.min(rect.width, vw - 16);
    const left = Math.min(Math.max(8, rect.left), vw - width - 8);

    const maxHpx =
      want === 'bottom'
        ? Math.max(120, Math.min(spaceBelow - 8, vh * 0.6))
        : Math.max(120, Math.min(spaceAbove - 8, vh * 0.6));

    const top =
      want === 'bottom'
        ? Math.min(rect.bottom + 8, vh - 8)
        : Math.max(8, rect.top - maxHpx - 8);

    // 👉 FIX: no pisamos visibility a 'hidden' si ya está en 'visible'
    setMenuStyle((prev) => ({
      ...prev,
      position: 'fixed',
      top,
      left,
      width,
      maxHeight: `${maxHpx}px`,
      zIndex: portalZIndex + 1,
      visibility: prev.visibility || 'hidden', // primera vez 'hidden', luego respetamos 'visible'
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }));
    setIsPositioned(true);
  }, [portal, menuPlacement, portalZIndex]);

  useLayoutEffect(() => {
    if (!portal || !open) return;
    computePosition();
  }, [open, portal, computePosition]);

  useEffect(() => {
    if (!portal || !open) return;
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, portal, computePosition]);

  // ===== Foco (sin saltos de scroll) =====
  useEffect(() => {
    if (!open) return;
    const focusInput = () => {
      if (inputRef.current) {
        try {
          inputRef.current.focus({ preventScroll: true });
        } catch {
          inputRef.current.focus();
        }
      }
      if (portal) {
        // aseguramos que quede visible al menos una vez
        setMenuStyle((s) => ({ ...s, visibility: 'visible' }));
      }
    };
    if (portal) {
      if (isPositioned) requestAnimationFrame(focusInput);
    } else {
      requestAnimationFrame(focusInput);
    }
  }, [open, portal, isPositioned]);

  // ===== Cierre por click externo =====
  useEffect(() => {
    if (!open) return;

    const isInside = (node, e) => {
      if (!node) return false;
      const path = e.composedPath ? e.composedPath() : [];
      return path.includes(node) || node.contains(e.target);
    };

    if (!portal || !withBackdrop) {
      const onDocPointerDown = (e) => {
        const root = rootRef.current;
        const menu = menuRef.current;
        if (isInside(root, e) || isInside(menu, e)) return;
        setOpen(false);
        setActiveIndex(-1);
      };
      document.addEventListener('pointerdown', onDocPointerDown, true);
      return () =>
        document.removeEventListener('pointerdown', onDocPointerDown, true);
    }
  }, [open, portal, withBackdrop]);

  // ===== Navegación por teclado =====
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min((i ?? -1) + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max((i ?? filtered.length) - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          const opt = filtered[activeIndex];
          onChange?.(getOptionValue(opt), opt);
          setQ('');
          setOpen(false);
          setActiveIndex(-1);
        } else if (filtered.length === 1) {
          const opt = filtered[0];
          onChange?.(getOptionValue(opt), opt);
          setQ('');
          setOpen(false);
          setActiveIndex(-1);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex, onChange, getOptionValue]);

  // 👉 Extra: auto-scroll al item activo al navegar con teclado
  useEffect(() => {
    if (!open) return;
    if (activeIndex < 0) return;
    if (!menuRef.current) return;

    const list = menuRef.current.querySelector('ul[role="listbox"]');
    if (!list) return;
    const item = list.querySelector(`li[data-idx="${activeIndex}"]`);
    if (item && item.scrollIntoView) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  const renderHighlighted = (text, query) => {
    if (!query) return text;
    const nText = text.toLowerCase();
    const nQ = query.toLowerCase();
    const i = nText.indexOf(nQ);
    if (i === -1) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="bg-yellow-100 rounded px-0.5">
          {text.slice(i, i + query.length)}
        </mark>
        {text.slice(i + query.length)}
      </>
    );
  };

  const Button = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        setIsPositioned(false);
        setOpen((v) => !v);
        setActiveIndex(-1);
      }}
      className={`w-full px-4 py-2 rounded-lg border bg-white text-gray-800 flex items-center justify-between ${
        disabled
          ? 'border-gray-200 opacity-60 cursor-not-allowed'
          : 'border-gray-300'
      }`}
      role="combobox"
      aria-controls={listboxId}
      aria-expanded={open}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-required={required}
      aria-activedescendant={
        activeIndex >= 0 && filtered[activeIndex]
          ? `${listboxId}-opt-${getOptionValue(filtered[activeIndex])}`
          : undefined
      }
    >
      <span className={`truncate ${selected ? '' : 'text-gray-500'}`}>
        {selected ? getOptionLabel(selected) : placeholder}
      </span>
      <span className="ml-2 opacity-60">▾</span>
    </button>
  );

  const MenuPanel = (
    <div
      ref={menuRef}
      onPointerDownCapture={(e) => e.stopPropagation()}
      className={`mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-2xl flex flex-col ${
        portal ? '' : 'absolute z-50'
      } ${
        !portal ? (placement === 'top' ? 'bottom-full mb-2' : 'max-h-80') : ''
      }`}
      style={
        portal
          ? menuStyle
          : {
              maxHeight: dropdownMaxHeight,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }
      }
      role="dialog"
      aria-modal="true"
    >
      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActiveIndex(-1);
          }}
          placeholder="Buscar…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition"
        />
      </div>

      <ul
        id={listboxId}
        role="listbox"
        className="flex-1 overflow-y-auto py-1 overscroll-contain"
      >
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-gray-500 select-none">
            Sin resultados
          </li>
        )}
        {filtered.map((opt, idx) => {
          const id = getOptionValue(opt);
          const lab = getOptionLabel(opt) || '';
          const isSel = String(id) === String(value);
          const isActive = idx === activeIndex;
          return (
            <li
              key={id}
              id={`${listboxId}-opt-${id}`}
              data-idx={idx}
              role="option"
              aria-selected={isSel}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(-1)}
              // mantenemos preventDefault para no robar foco, pero el click sigue funcionando
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange?.(id, opt);
                setOpen(false);
                setQ('');
                setActiveIndex(-1);
              }}
              className={`px-3 py-2 text-sm cursor-pointer select-none hover:bg-gray-50 active:bg-gray-100 ${
                isSel
                  ? 'bg-cyan-50 text-cyan-700 font-semibold ring-1 ring-cyan-100'
                  : ''
              } ${isActive ? 'bg-gray-50' : ''}`}
            >
              {renderHighlighted(lab, q)}
            </li>
          );
        })}
      </ul>

      <div className="p-2 flex items-center justify-between border-t border-gray-200 sticky bottom-0 bg-white">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange?.('');
            setQ('');
            setOpen(false);
            setActiveIndex(-1);
          }}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Limpiar
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen(false);
            setActiveIndex(-1);
          }}
          className="text-xs px-2 py-1 rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
        >
          Listo
        </button>
      </div>
    </div>
  );

  const Backdrop =
    withBackdrop && open ? (
      <div
        onPointerDown={(e) => {
          backdropTap.current = { x: e.clientX, y: e.clientY, armed: true };
        }}
        onPointerMove={(e) => {
          const dx = e.clientX - backdropTap.current.x;
          const dy = e.clientY - backdropTap.current.y;
          if (dx * dx + dy * dy > 36) backdropTap.current.armed = false;
        }}
        onPointerUp={() => {
          if (backdropTap.current.armed) {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: portalZIndex,
          background: 'transparent'
          // ojo: saqué touchAction: 'none' para no interferir con gestos de scroll en algunos contextos
        }}
      />
    ) : null;

  const MenuLayer = portal
    ? createPortal(
        <>
          {Backdrop}
          {open && MenuPanel}
        </>,
        document.body
      )
    : open && MenuPanel;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && <label className="block font-semibold mb-1">{label}</label>}
      {Button}
      {!disabled && MenuLayer}
    </div>
  );
}
