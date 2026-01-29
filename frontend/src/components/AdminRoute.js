import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permitir acceso a admin, admin_master y authorized
  if (user?.role !== 'admin' && user?.role !== 'admin_master' && user?.role !== 'authorized') {
    return <Navigate to="/meetings" replace />;
  }

  return children;
};

export default AdminRoute;






