import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const OrganizationColors = () => {
  const { client, user, loading } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    // Esperar a que termine de cargar
    if (loading) return;
    
    // Admin Master siempre usa los colores oficiales de Board Quorum
    const isAdminMaster = user?.role === 'admin_master';
    
    // Debug: verificar cliente
    if (client && !isAdminMaster) {
      console.log('OrganizationColors: Cliente cargado:', {
        name: client.name,
        primary_color: client.primary_color,
        secondary_color: client.secondary_color,
        logo: client.logo
      });
    } else if (isAdminMaster) {
      console.log('OrganizationColors: Admin Master detectado, usando colores oficiales de Board Quorum');
    } else {
      console.log('OrganizationColors: No hay cliente cargado');
    }
    
    // No aplicar colores de organización si:
    // 1. Es la landing page
    // 2. No hay cliente
    // 3. El usuario es admin_master (siempre usa colores oficiales)
    if (isLandingPage || !client || isAdminMaster) {
      // Restaurar colores por defecto (oficiales de Board Quorum)
      document.documentElement.style.setProperty('--primary', '#0072FF');
      document.documentElement.style.setProperty('--primary-light', '#00C6FF');
      document.documentElement.style.setProperty('--cyan-light', '#00C6FF');
      document.documentElement.style.setProperty('--cyan-dark', '#0072FF');
      document.documentElement.style.setProperty('--gradient-cyan', 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)');
      return;
    }

    // Aplicar colores de la organización (solo para usuarios que no son admin_master)
    if (client.primary_color) {
      document.documentElement.style.setProperty('--primary', client.primary_color);
      document.documentElement.style.setProperty('--cyan-dark', client.primary_color);
    }

    if (client.secondary_color) {
      document.documentElement.style.setProperty('--primary-light', client.secondary_color);
      document.documentElement.style.setProperty('--cyan-light', client.secondary_color);
    }

    // Actualizar el gradiente si ambos colores están disponibles
    if (client.primary_color && client.secondary_color) {
      const gradient = `linear-gradient(135deg, ${client.secondary_color} 0%, ${client.primary_color} 100%)`;
      document.documentElement.style.setProperty('--gradient-cyan', gradient);
    }
  }, [client, user, isLandingPage, loading]);

  return null;
};

export default OrganizationColors;

