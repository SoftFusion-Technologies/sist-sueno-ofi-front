import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import api from './api/axios'; // tu instancia
import { TimeGuardProvider } from './time-guard';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TimeGuardProvider axios={api}>
      <App />
    </TimeGuardProvider>
  </React.StrictMode>
);
