import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import './Contact.css';

const Contact = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implementar envío del formulario al backend
    console.log('Formulario enviado:', formData);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', organization: '', message: '' });
    }, 3000);
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <button 
          onClick={() => navigate('/login')} 
          className="btn-back"
        >
          ← {t('backToLogin') || 'Volver al Login'}
        </button>

        <div className="contact-header">
          <Logo size="medium" showText={true} />
          <h1 style={{ marginBottom: '0', paddingBottom: '0', lineHeight: '1.1' }}>{t('contactUs') || 'Contáctanos'}</h1>
          <p className="contact-subtitle" style={{ marginTop: '4px', marginBottom: '0', paddingTop: '0', lineHeight: '1.4' }}>
            {t('contactSubtitle') || '¿Interesado en implementar BOARD QUORUM en tu organización? Déjanos tus datos y nos pondremos en contacto contigo.'}
          </p>
        </div>

        <div className="contact-content" style={{ gridTemplateColumns: '0.6fr 3fr' }}>
          <div className="contact-info">
            <h2>{t('contactPivot') || 'Pivot Consulting'}</h2>
            <div className="info-item">
              <strong>{t('email')}:</strong>
              <a href="mailto:contacto@pivotconsulting.com.co">contacto@pivotconsulting.com.co</a>
            </div>
            <div className="info-item">
              <strong>{t('website') || 'Sitio Web'}:</strong>
              <a href="https://pivotconsulting.com.co" target="_blank" rel="noopener noreferrer">
                pivotconsulting.com.co
              </a>
            </div>
            <div className="info-item">
              <p className="info-description">
                {t('contactDescription') || 'Somos especialistas en soluciones tecnológicas para la gestión empresarial. BOARD QUORUM es nuestra plataforma diseñada para optimizar la gestión de reuniones formales de órganos colegiados.'}
              </p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <h2>{t('sendMessage') || 'Envíanos un Mensaje'}</h2>
            
            <div className="form-group">
              <label className="label">{t('name') || 'Nombre'} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('namePlaceholder') || 'Tu nombre completo'}
              />
            </div>

            <div className="form-group">
              <label className="label">{t('email')} *</label>
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
              <label className="label">{t('organization') || 'Organización'} *</label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="input"
                required
                placeholder={t('organizationPlaceholder') || 'Nombre de tu organización'}
              />
            </div>

            <div className="form-group">
              <label className="label">{t('message') || 'Mensaje'} *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="input textarea"
                required
                rows="3"
                placeholder={t('messagePlaceholder') || 'Cuéntanos sobre tus necesidades...'}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={formSubmitted}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '600', marginTop: '6px' }}
            >
              {formSubmitted ? (t('messageSent') || '✓ Mensaje Enviado') : (t('sendMessage') || 'Enviar Mensaje')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;

