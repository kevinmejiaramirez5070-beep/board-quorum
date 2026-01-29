import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import UserSettingsModal from '../UserSettings/UserSettingsModal';
import './UserMenuDropdown.css';

const UserMenuDropdown = () => {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getRoleLabel = () => {
    if (user?.role === 'admin_master') {
      return language === 'es' ? 'ADMIN MASTER' : 'ADMIN MASTER';
    }
    if (user?.role === 'admin') {
      return language === 'es' ? 'ADMIN' : 'ADMIN';
    }
    if (user?.role === 'authorized') {
      return language === 'es' ? 'AUTORIZADO' : 'AUTHORIZED';
    }
    return '';
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      <div className="user-menu-dropdown" ref={dropdownRef}>
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="User menu"
        >
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role ${user?.role === 'authorized' ? 'authorized' : ''}`}>
              {getRoleLabel()}
            </span>
          </div>
          <svg
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <div className="user-email">{user?.email}</div>
            </div>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item" onClick={handleSettingsClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.3333 8C13.3333 6.66667 13.3333 5.33333 12.6667 4.66667C12 4 10.6667 4 9.33333 4H6.66667C5.33333 4 4 4 3.33333 4.66667C2.66667 5.33333 2.66667 6.66667 2.66667 8C2.66667 9.33333 2.66667 10.6667 3.33333 11.3333C4 12 5.33333 12 6.66667 12H9.33333C10.6667 12 12 12 12.6667 11.3333C13.3333 10.6667 13.3333 9.33333 13.3333 8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{language === 'es' ? 'Configuración' : 'Settings'}</span>
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item logout-item" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.6667 11.3333L14 8L10.6667 4.66667"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 8H6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t('logout')}</span>
            </button>
          </div>
        )}
      </div>

      <UserSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default UserMenuDropdown;






