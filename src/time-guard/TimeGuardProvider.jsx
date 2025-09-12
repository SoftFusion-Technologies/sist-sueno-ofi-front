import React, { createContext, useContext, useEffect, useState } from 'react';
import { timeSync } from './TimeSync.js';
import BlockModal from './BlockModal.jsx';

const TimeGuardContext = createContext(null);

export function TimeGuardProvider({ axios, children }) {
  const [state, setState] = useState(timeSync.getState());

  // TimeGuardProvider.jsx
  useEffect(() => {
    timeSync.init(); // es idempotente ahora
    return () => {}; // no desmontes timers acá
  }, []);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      // Si recibimos axios, instalamos interceptores
      if (axios) timeSync.installAxios(axios);
      await timeSync.init();
      unsub = timeSync.subscribe(setState);
    })();

    return () => {
      try {
        unsub();
      } catch {}
    };
  }, [axios]);

  const retrySync = async () => timeSync.retrySync();

  const isBlocked =
    state.locked ||
    state.status === 'invalid-clock' ||
    state.status === 'syncing';

  return (
    <TimeGuardContext.Provider value={{ ...state, retrySync }}>
      <BlockModal
        open={isBlocked}
        reason={state.reason}
        skewMs={state.skewMs}
        toleranceMs={state.toleranceMs}
        onRetry={retrySync}
      />

      <div
        style={{
          pointerEvents: isBlocked ? 'none' : 'auto',
          userSelect: isBlocked ? 'none' : 'auto',
          filter: isBlocked ? 'grayscale(0.2)' : 'none'
        }}
        aria-hidden={isBlocked ? 'true' : undefined}
      >
        {children}
      </div>
      <div
        style={{
          pointerEvents:
            state.locked || state.status === 'invalid-clock' ? 'none' : 'auto',
          userSelect:
            state.locked || state.status === 'invalid-clock' ? 'none' : 'auto',
          filter:
            state.locked || state.status === 'invalid-clock'
              ? 'grayscale(0.2)'
              : 'none'
        }}
        aria-hidden={
          state.locked || state.status === 'invalid-clock' ? 'true' : undefined
        }
      >
        {children}
      </div>

      <div
        style={{
          pointerEvents:
            state.locked || state.status === 'invalid-clock' ? 'none' : 'auto',
          userSelect:
            state.locked || state.status === 'invalid-clock' ? 'none' : 'auto',
          filter:
            state.locked || state.status === 'invalid-clock'
              ? 'grayscale(0.2)'
              : 'none'
        }}
        aria-hidden={
          state.locked || state.status === 'invalid-clock' ? 'true' : undefined
        }
      >
        {children}
      </div>
    </TimeGuardContext.Provider>
  );
}

export function useTimeGuard() {
  return useContext(TimeGuardContext);
}
