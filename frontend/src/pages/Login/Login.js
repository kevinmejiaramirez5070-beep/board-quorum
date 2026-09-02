import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import './Login.css';

const Login = () => {
  // Deshabilitar scroll del body cuando se monta el componente
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // La organización no se pide: sale del propio usuario en el servidor.
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirigir según el rol del usuario
      if (result.user?.role === 'admin_master') {
        navigate('/admin/organizations');
      } else {
        navigate('/products');
      }
    } else {
      setError(result.message || t('loginError'));
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <Logo size="medium" showText={true} />
          <h2>{t('loginTitle')}</h2>
          <p>{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* El selector de organización se retiró a propósito.
              Listaba públicamente los nombres de TODOS los clientes, y no servía
              para nada: login() solo envía correo y contraseña, y la organización
              sale del propio usuario en el servidor. Un cliente no debe ver los
              nombres de los demás. */}

          <div className="form-group">
            <label className="label">{t('emailLabel')}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('passwordLabel')}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-large btn-block"
            disabled={loading}
          >
            {loading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <div className="login-footer">
          <p>{t('noAccount')} <a 
            href="/#contacto" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
              // Esperar a que la página cargue y luego hacer scroll
              setTimeout(() => {
                const contactoSection = document.getElementById('contacto');
                if (contactoSection) {
                  contactoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
          >{t('contactPivot')}</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

