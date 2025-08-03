/*
 * Programador: Benjamin Orellana
 * Fecha Creación: 26 / 05 / 2025
 * Versión: 1.0
 *
 * Descripción:
 * Este archivo (AuthContext.jsx) es el componente el cual proteje las rutas.
 *
 * Tema: Renderizacion
 * Capa: Frontend
 * Contacto: benjamin.orellanaof@gmail.com || 3863531891
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { authToken } = useAuth();

  if (!authToken) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
