import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
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
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [formData, setFormData] = useState({
    organization_id: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await api.get('/clients');
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Si cambia el email a admin@boardquorum.com, limpiar organization_id
    if (name === 'email' && value === 'admin@boardquorum.com') {
      setFormData(prev => ({
        ...prev,
        email: value,
        organization_id: ''
      }));
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Si es super admin, no requiere organización
    const isSuperAdmin = formData.email === 'admin@boardquorum.com';
    
    // Si no es super admin y no hay organización seleccionada, mostrar error
    if (!isSuperAdmin && !formData.organization_id) {
      setError(t('selectOrganizationError'));
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/meetings');
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
          {formData.email !== 'admin@boardquorum.com' && (
            <div className="form-group">
              <label className="label">{t('selectOrganization')}</label>
              <select
                name="organization_id"
                value={formData.organization_id}
                onChange={handleChange}
                className="input"
                required
                disabled={loadingOrgs}
              >
                <option value="">
                  {loadingOrgs 
                    ? t('loading') + '...' 
                    : organizations.length === 0 
                      ? (language === 'es' ? 'No hay organizaciones disponibles' : 'No organizations available')
                      : t('selectOrganization')
                  }
                </option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

