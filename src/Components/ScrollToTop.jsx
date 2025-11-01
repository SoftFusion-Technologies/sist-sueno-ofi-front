// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop({
  top = 0,
  behavior = 'smooth',
  skipHash = true // si true, no hace scroll si la URL trae #ancla
}) {
  const { pathname, hash, search } = useLocation();

  useEffect(() => {
    if (skipHash && hash) return; // no interferir con anclas tipo /ruta#seccion
    // pequeño timeout para esperar montaje de la vista
    const id = setTimeout(() => {
      window.scrollTo({ top, left: 0, behavior });
    }, 0);
    return () => clearTimeout(id);
  }, [pathname, search, hash, top, behavior, skipHash]);

  return null;
}
