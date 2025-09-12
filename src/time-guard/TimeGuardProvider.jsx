import React, { createContext, useMemo, useContext, useEffect, useState } from 'react';
import { timeSync } from './TimeSync.js';
import BlockModal from './BlockModal.jsx';

const TimeGuardContext = createContext(null);

export function TimeGuardProvider({ axios, children }) {
  // snapshot inicial del estado
  const [snap, setSnap] = useState(() => timeSync.getState());

  // init idempotente + suscripción
  useEffect(() => {
    timeSync.init(); // nuestra clase ya es idempotente
    const unsubscribe = timeSync.subscribe((s) => setSnap(s));
    return () => unsubscribe();
  }, []);

  // instalar interceptores de axios (una vez)
  useEffect(() => {
    if (axios) timeSync.installAxios(axios);
    // no re-instalar en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axios]);

  const isBlocked = useMemo(
    () =>
      snap.locked ||
      snap.status === 'invalid-clock' ||
      snap.status === 'syncing',
    [snap.locked, snap.status]
  );

  return (
    <>
      <BlockModal
        open={isBlocked}
        reason={snap.reason}
        skewMs={snap.skewMs}
        toleranceMs={snap.toleranceMs}
        onRetry={() => timeSync.retrySync()}
      />

      {/* ⚠️ Renderizamos children UNA SOLA VEZ */}
      <div
        style={{
          pointerEvents: isBlocked ? 'none' : 'auto',
          userSelect: isBlocked ? 'none' : 'auto',
          filter: isBlocked ? 'grayscale(0.2)' : 'none'
        }}
      >
        {children}
      </div>
    </>
  );
}
export function useTimeGuard() {
  return useContext(TimeGuardContext);
}
