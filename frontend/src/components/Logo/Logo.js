import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Logo.css';

const Logo = ({ variant = 'default', size = 'medium', showText = true }) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [currentLogoPath, setCurrentLogoPath] = useState('');
  
  const sizes = {
    small: 32,
    medium: 40,
    large: 200
  };

  const iconSize = sizes[size] || sizes.medium;

  useEffect(() => {
    // Resetear error cuando cambia el tema
    setImageError(false);
    // Logo es lll.png (mismo para ambos temas)
    setCurrentLogoPath('/lll.png');
  }, [theme]);

  const handleImageError = () => {
    setImageError(true);
    console.warn(`Logo no encontrado en: ${currentLogoPath}. Asegúrate de que los logos estén en frontend/public/`);
  };

  return (
    <div className={`logo logo-${variant} logo-${size}`}>
      <div className="logo-icon">
        {!imageError && currentLogoPath ? (
          <img 
            src={currentLogoPath} 
            alt="BOARD QUORUM Logo" 
            onError={handleImageError}
            style={{ width: iconSize, height: iconSize, objectFit: 'contain' }}
          />
        ) : (
          <svg 
            width={iconSize} 
            height={iconSize} 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="20" cy="20" r="18" stroke="url(#logoGradient)" strokeWidth="2" fill="none"/>
            <text x="20" y="26" fontSize="20" fontWeight="700" fill="url(#logoGradient)" textAnchor="middle">Q</text>
            <path d="M15 20 L18 23 L25 16" stroke="url(#logoGradient)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C6FF" />
                <stop offset="100%" stopColor="#0072FF" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
      {showText && (
        <div className="logo-text">
          <span className="logo-main">BOARD QUORUM</span>
          <span className="logo-short">BQ</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
