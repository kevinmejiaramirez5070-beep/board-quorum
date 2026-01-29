import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo/Logo';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import UserMenuDropdown from '../UserMenu/UserMenuDropdown';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, client, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Admin Master NO muestra logo/nombre de organización (usa branding oficial de Board Quorum)
  const isAdminMaster = user?.role === 'admin_master';
  // Mostrar logo de la organización si existe y estamos autenticados (no en landing) y NO es admin_master
  const showOrgLogo = isAuthenticated && !isLandingPage && !isAdminMaster && client?.logo;
  // Mostrar nombre de organización si hay cliente (incluso sin logo) y NO es admin_master
  const showOrgName = isAuthenticated && !isLandingPage && !isAdminMaster && client?.name;

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <div className="logo-container">
              {showOrgLogo ? (
                <img 
                  src={client.logo} 
                  alt={client.name || 'Logo'} 
                  style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                />
              ) : (
                <Logo size="medium" showText={false} />
              )}
              {showOrgName && (
                <span className="organization-name">{client.name}</span>
              )}
            </div>
          </Link>
          <nav className="nav">
            {!isAuthenticated && isLandingPage ? (
              <>
                <a href="#producto" onClick={(e) => { e.preventDefault(); document.getElementById('producto')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {t('product')}
                </a>
                <a href="#modulos" onClick={(e) => { e.preventDefault(); document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {t('modules')}
                </a>
                <a href="#beneficios" onClick={(e) => { e.preventDefault(); document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {t('benefits')}
                </a>
                <a href="#contacto" onClick={(e) => { e.preventDefault(); document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  {t('contact')}
                </a>
              </>
            ) : (
              <>
                {isAuthenticated && (
                  <>
                    <Link to="/meetings">{t('meetings')}</Link>
                    {/* Admin Master: Ver organizaciones */}
                    {user?.role === 'admin_master' && (
                      <Link to="/admin/organizations">{t('organizations')}</Link>
                    )}
                    {/* Admin: Ver miembros (puede editarlos) */}
                    {user?.role === 'admin' && (
                      <Link to="/admin/members">{t('members')}</Link>
                    )}
                    {/* Authorized: Ver miembros (solo lectura) */}
                    {user?.role === 'authorized' && (
                      <Link to="/admin/members">{t('members')}</Link>
                    )}
                    <Link to="/admin">{t('administration')}</Link>
                  </>
                )}
              </>
            )}
            {isAuthenticated ? (
              <div className="user-menu">
                <LanguageSelector />
                <ThemeToggle />
                <UserMenuDropdown />
              </div>
            ) : (
              <div className="user-menu">
                <LanguageSelector />
                <ThemeToggle />
                <Link to="/login" className="btn-login">{t('login')}</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

