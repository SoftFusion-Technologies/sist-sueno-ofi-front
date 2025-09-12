import React, { useMemo } from 'react';

export default function BlockModal({
  open,
  reason,
  skewMs,
  toleranceMs,
  onRetry
}) {
  if (!open) return null;

  // ---- helpers ----
  const formatSkew = (ms) => {
    const abs = Math.abs(ms);
    if (abs >= 60_000)
      return `${ms < 0 ? '-' : ''}${Math.round(abs / 60_000)} min`;
    if (abs >= 1_000) return `${ms < 0 ? '-' : ''}${Math.round(abs / 1_000)} s`;
    return `${Math.round(ms)} ms`;
  };
  const reasonText = {
    SKEW_EXCEEDED: 'La hora del dispositivo no coincide con la hora oficial.',
    MAX_OFFLINE: 'No se pudo sincronizar con el servidor por demasiado tiempo.',
    BACKEND_428: 'El servidor rechazó la operación por hora no válida.',
    NETWORK: 'Problema de red al sincronizar hora.',
    null: 'Bloqueo por validación de hora.'
  }[reason ?? 'null'];

  const severity = useMemo(() => {
    if (reason === 'NETWORK' || reason === 'MAX_OFFLINE') return 'warning';
    if (reason === 'SKEW_EXCEEDED' || reason === 'BACKEND_428') return 'danger';
    return 'info';
  }, [reason]);

  // ---- styles (inline + <style> for keyframes) ----
  const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 2147483647,
    background:
      'radial-gradient(1200px 600px at 20% -10%, rgba(99,102,241,0.18), transparent 60%), ' +
      'radial-gradient(800px 500px at 110% 110%, rgba(16,185,129,0.18), transparent 60%), ' +
      'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  };

  const card = {
    width: 'min(92vw, 680px)',
    color: '#E5E7EB',
    background:
      'linear-gradient(180deg, rgba(17,24,39,0.85) 0%, rgba(17,24,39,0.75) 100%)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden'
  };

  const gradientBorder = {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    padding: 1,
    background:
      'linear-gradient(120deg, rgba(99,102,241,0.8), rgba(16,185,129,0.8), rgba(236,72,153,0.8))',
    WebkitMask:
      'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none'
  };

  const content = { position: 'relative', padding: '24px 22px 20px 22px' };

  const header = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10
  };

  const iconWrap = {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background:
      severity === 'danger'
        ? 'linear-gradient(180deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))'
        : severity === 'warning'
        ? 'linear-gradient(180deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))'
        : 'linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.08))',
    border: '1px solid rgba(255,255,255,0.1)',
    animation: 'pulseGlow 1.6s ease-in-out infinite'
  };

  const title = {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.1
  };

  const badge = {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: 999,
    letterSpacing: 0.3,
    border: '1px solid rgba(255,255,255,0.1)',
    color:
      severity === 'danger'
        ? '#fecaca'
        : severity === 'warning'
        ? '#fde68a'
        : '#c7d2fe',
    background:
      severity === 'danger'
        ? 'rgba(239,68,68,0.12)'
        : severity === 'warning'
        ? 'rgba(245,158,11,0.12)'
        : 'rgba(99,102,241,0.12)'
  };

  const sub = { opacity: 0.9, lineHeight: 1.6, marginTop: 8 };

  const metrics = {
    marginTop: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10
  };

  const metric = (label, value) => ({
    fontSize: 13,
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(31,41,55,0.6)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    ...(label === 'Desvío' ? { color: '#fde68a' } : { color: '#c7d2fe' })
  });

  const list = {
    marginTop: 14,
    marginBottom: 18,
    paddingLeft: 18,
    opacity: 0.9
  };

  const actions = { display: 'flex', gap: 12, flexWrap: 'wrap' };

  const btnPrimary = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    border: '0',
    borderRadius: 12,
    padding: '12px 16px',
    fontWeight: 800,
    letterSpacing: 0.2,
    color: '#0a1915',
    background:
      'linear-gradient(135deg, #34D399 0%, #10B981 40%, #22D3EE 100%)',
    boxShadow:
      '0 8px 20px rgba(16,185,129,0.35), inset 0 -2px 0 rgba(0,0,0,0.15)',
    cursor: 'pointer',
    transition: 'transform .06s ease'
  };

  const btnGhost = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: '12px 14px',
    fontWeight: 700,
    color: '#E5E7EB',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer'
  };

  // ---- UI ----
  return (
    <div
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tg-title"
      aria-describedby="tg-desc"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* keyframes (scoped) */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.15); }
          50% { box-shadow: 0 0 0 12px rgba(16,185,129,0.03); }
        }
        @keyframes inCard {
          from { transform: translateY(8px) scale(.98); opacity: 0 }
          to   { transform: translateY(0)     scale(1);   opacity: 1 }
        }
        .tg-card-enter { animation: inCard .18s ease-out both }
        .tg-btn:active { transform: translateY(1px) scale(.995) }
        .tg-kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px; padding: 2px 6px; border-radius: 6px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
        }
      `}</style>

      <div
        className="tg-card-enter"
        style={card}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={gradientBorder} aria-hidden />

        <div style={content}>
          <div style={header}>
            <div style={iconWrap} aria-hidden>
              {/* lock icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 10V8a5 5 0 1 1 10 0v2"
                  stroke="#86efac"
                  strokeWidth="1.6"
                />
                <rect
                  x="4"
                  y="10"
                  width="16"
                  height="10"
                  rx="2.5"
                  stroke="#86efac"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="15" r="1.8" fill="#86efac" />
              </svg>
            </div>
            <h2 id="tg-title" className="titulo uppercase" style={title}>
              Sistema bloqueado por hora no válida
            </h2>
            <span style={badge}>
              {reason === 'NETWORK'
                ? 'RED'
                : reason === 'MAX_OFFLINE'
                ? 'SINCRONIZACIÓN'
                : reason === 'SKEW_EXCEEDED'
                ? 'DESVÍO'
                : reason === 'BACKEND_428'
                ? 'SERVIDOR'
                : 'REVISIÓN'}
            </span>
          </div>

          <p id="tg-desc" style={sub}>
            {reasonText}
          </p>

          <div style={metrics}>
            {typeof skewMs === 'number' && (
              <div style={metric('Desvío', skewMs)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 6v6l4 2"
                    stroke="#fde68a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <strong>Desvío:</strong> {formatSkew(skewMs)}
              </div>
            )}
            {typeof toleranceMs === 'number' && (
              <div style={metric('Tolerancia', toleranceMs)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14"
                    stroke="#c7d2fe"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <strong>Tolerancia:</strong> {formatSkew(toleranceMs)}
              </div>
            )}
          </div>

          <ol style={list}>
            <li>
              Verificá fecha y hora del dispositivo (ideal: automáticas por
              internet).
            </li>
            <li>Si usás VM/servidor, confirmá que tenga NTP activo.</li>
            <li>
              Tras corregir, presioná{' '}
              <span className="tg-kbd">Reintentar sincronizar</span>.
            </li>
          </ol>

          <div style={actions}>
            <button
              type="button"
              className="tg-btn"
              style={btnPrimary}
              onClick={onRetry}
              autoFocus
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12a9 9 0 1 1-2.64-6.36"
                  stroke="#0a1915"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 5v6h-6"
                  stroke="#0a1915"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Reintentar sincronizar
            </button>

            <a href="/logout" style={btnGhost}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 17l5-5-5-5M21 12H9"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M13 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Cerrar sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
