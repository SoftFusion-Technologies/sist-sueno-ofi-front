// src/ui/animHelpers.js

/** Variantes: backdrop fade in/out */
export const backdropV = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

/** Variantes: panel (sube con spring) */
export const panelV = {
  hidden: { y: 30, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 210, damping: 20 }
  },
  exit: { y: 30, opacity: 0, scale: 0.98 }
};

/** Variantes: contenedor con stagger */
export const formContainerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};

/** Variantes: cada campo entra de abajo hacia arriba */
export const fieldV = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22 }
  },
  exit: { opacity: 0, y: 10 }
};

/** Utils simples */
export const pad = (n, w = 6) => String(n ?? '').padStart(w, '0');
export const toInt = (v) => (v === '' || v == null ? null : Number(v));

/**
 * Factories (opcional): crear variantes con parámetros
 * - útil si querés distintos delays/stagger o springs en otros forms
 */
export const makeFieldV = ({ y = 18, stiffness = 300, damping = 22 } = {}) => ({
  hidden: { opacity: 0, y },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness, damping }
  },
  exit: { opacity: 0, y: Math.min(12, y) }
});

export const makeFormContainerV = ({ stagger = 0.06, delay = 0.05 } = {}) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } }
});
