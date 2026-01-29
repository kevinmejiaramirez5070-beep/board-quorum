import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario y cliente desde localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    const storedClient = localStorage.getItem('client');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Admin Master NO debe tener cliente asociado (usa colores oficiales)
      if (userData.role === 'admin_master') {
        setClient(null);
        localStorage.removeItem('client');
        console.log('Admin Master detectado - cliente removido (usa colores oficiales)');
      } else if (storedClient) {
        const clientData = JSON.parse(storedClient);
        setClient(clientData);
        console.log('Cliente cargado desde localStorage:', clientData);
      } else {
        console.warn('⚠️ No hay cliente guardado en localStorage');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData, client: clientData } = response.data;
      
      console.log('Login response:', {
        user: userData,
        client: clientData,
        hasClient: !!clientData
      });
      
      setUser(userData);
      
      // Admin Master NO debe tener cliente asociado (usa colores oficiales de Board Quorum)
      if (userData.role === 'admin_master') {
        setClient(null);
        localStorage.removeItem('client');
        console.log('Admin Master detectado - cliente no guardado (usa colores oficiales)');
      } else {
        setClient(clientData);
        if (clientData) {
          localStorage.setItem('client', JSON.stringify(clientData));
          console.log('Cliente guardado en localStorage:', clientData);
        } else {
          localStorage.removeItem('client');
          console.warn('⚠️ No se recibió información del cliente en el login');
        }
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setClient(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('client');
  };

  const value = {
    user,
    setUser,
    client,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
