/*
 * Programador: Benjamin Orellana
 * Fecha Actualización: 21 / 06 / 2025
 * Versión: 1.2
 *
 * Descripción:
 * Este archivo (AuthContext.jsx) gestiona el estado de sesión del usuario mediante token JWT
 * basado en la nueva tabla de usuarios, sincronizado con el backend Node.js.
 *
 * Tema: Autenticación
 * Capa: Frontend
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userLevel, setUserLevel] = useState('');
  const [userLocalId, setUserLocalId] = useState(null);

  const logout = () => {
    setAuthToken(null);
    setUserId(null);
    setUserName('');
    setUserEmail('');
    setUserLevel('');
    setUserLocalId(null);

    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userLevel');
    localStorage.removeItem('userLocalId');
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userLevel');
    const localId = localStorage.getItem('userLocalId');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = Date.now() >= payload.exp * 1000;
        if (isExpired) {
          logout();
        } else {
          setAuthToken(token);
        }
      } catch (e) {
        console.error('Token inválido:', e);
        logout();
      }
    }

    if (id) setUserId(id);
    if (name) setUserName(name);
    if (email) setUserEmail(email);
    if (role) setUserLevel(role);
    if (localId) setUserLocalId(localId);

    const handleBeforeUnload = () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userLevel');
      localStorage.removeItem('userLocalId');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = (token, id, name, email, role, localId) => {
    setAuthToken(token);
    setUserId(id);
    setUserName(name);
    setUserEmail(email);
    setUserLevel(role);
    setUserLocalId(localId);

    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userLevel', role);
    localStorage.setItem('userLocalId', localId);
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userId,
        userName,
        userEmail,
        userLevel,
        userLocalId,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
