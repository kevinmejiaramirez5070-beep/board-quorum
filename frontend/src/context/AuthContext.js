import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOperatorValidation, setNeedsOperatorValidation] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('user');
      const storedClient = localStorage.getItem('client');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        if (userData.role === 'admin_master') {
          setClient(null);
          localStorage.removeItem('client');
        } else if (storedClient) {
          setClient(JSON.parse(storedClient));
        } else if (userData.client_id) {
          // Sin cliente en localStorage: obtenerlo del servidor
          try {
            const res = await api.get(`/clients/${userData.client_id}`);
            if (res.data) {
              setClient(res.data);
              localStorage.setItem('client', JSON.stringify(res.data));
            }
          } catch (e) {
            console.error('Error obteniendo cliente:', e);
          }
        }

        if (userData.role === 'authorized' && !sessionStorage.getItem('operatorValidated')) {
          setNeedsOperatorValidation(true);
        }
      }
      setLoading(false);
    };
    init();
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
      
      if (userData.role === 'authorized') {
        setNeedsOperatorValidation(true);
      }

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, message };
    }
  };

  const validateOperatorIdentity = async (documentNumber) => {
    try {
      const response = await api.post('/auth/validate-member', { document_number: documentNumber });
      if (response.data.valid) {
        sessionStorage.setItem('operatorValidated', '1');
        setNeedsOperatorValidation(false);
        return { success: true, memberName: response.data.member_name };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al validar documento';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setClient(null);
    setNeedsOperatorValidation(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('client');
    sessionStorage.removeItem('operatorValidated');
  };

  const value = {
    user,
    setUser,
    client,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    needsOperatorValidation,
    validateOperatorIdentity,
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
