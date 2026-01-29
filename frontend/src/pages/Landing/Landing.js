import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { contactService } from '../../services/contactService';
import './Landing.css';

const Landing = () => {
  const { t, language } = useLanguage();
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    organization: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  return (
    <div className="landing">
      <section className="hero">
        <div className="container">
          <div className="hero-logo">
            <div className="logo-large">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="55" stroke="url(#heroGradient)" strokeWidth="3" fill="none"/>
                <text x="60" y="75" fontSize="60" fontWeight="700" fill="url(#heroGradient)" textAnchor="middle">Q</text>
                <path d="M45 60 L52 67 L75 44" stroke="url(#heroGradient)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00C6FF" />
                    <stop offset="100%" stopColor="#0072FF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 className="hero-title">
            <span className="text-gradient">BOARD QUORUM</span>
          </h1>
          <p className="subtitle">
            {t('heroSubtitle')}
          </p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary btn-large">
              {t('loginButton')}
            </Link>
          </div>
        </div>
      </section>

      <section className="what-is">
        <div className="container">
          <h2 className="section-title">{t('whatIsTitle')}</h2>
          <p className="what-is-description">{t('whatIsDescription')}</p>
        </div>
      </section>

      <section id="producto" className="features">
        <div className="container">
          <h2 className="section-title">{t('mainFeatures')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="url(#featureGradient)" strokeWidth="2"/>
                  <path d="M16 24 L20 28 L32 16" stroke="url(#featureGradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="featureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#0072FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3>{t('attendanceRegistration')}</h3>
              <p>{t('attendanceDescription')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="url(#featureGradient2)" strokeWidth="2"/>
                  <text x="24" y="30" fontSize="20" fontWeight="700" fill="url(#featureGradient2)" textAnchor="middle">Q</text>
                  <defs>
                    <linearGradient id="featureGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#0072FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3>{t('quorumValidation')}</h3>
              <p>{t('quorumDescription')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="12" width="32" height="24" rx="4" stroke="url(#featureGradient3)" strokeWidth="2" fill="none"/>
                  <path d="M18 24 L22 28 L30 20" stroke="url(#featureGradient3)" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="featureGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#0072FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3>{t('voting')}</h3>
              <p>{t('votingDescription')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M12 36 L24 24 L36 36" stroke="url(#featureGradient4)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <rect x="12" y="8" width="24" height="16" rx="2" stroke="url(#featureGradient4)" strokeWidth="2" fill="none"/>
                  <defs>
                    <linearGradient id="featureGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00C6FF" />
                      <stop offset="100%" stopColor="#0072FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h3>{t('reports')}</h3>
              <p>{t('reportsDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="modulos" className="modules">
        <div className="container">
          <h2 className="section-title">{t('availableModules')}</h2>
          <div className="modules-grid">
            <div className="module-card module-active">
              <div className="module-badge">MVP</div>
              <h3>{t('boardMeeting')}</h3>
              <p>{t('boardDescription')}</p>
              <ul>
                <li>✓ {t('createMeetings')}</li>
                <li>✓ {t('registerAttendance')}</li>
                <li>✓ {t('validateQuorum')}</li>
                <li>✓ {t('votingResults')}</li>
              </ul>
            </div>
            <div className="module-card module-coming">
              <div className="module-badge">{t('comingSoon')}</div>
              <h3>{t('generalAssembly')}</h3>
              <p>{t('generalDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="benefits">
        <div className="container">
          <h2 className="section-title">{t('benefits')}</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>{t('efficiency')}</h3>
              <p>{t('efficiencyDescription')}</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h3>{t('traceability')}</h3>
              <p>{t('traceabilityDescription')}</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>{t('security')}</h3>
              <p>{t('securityDescription')}</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <h3>{t('accessibility')}</h3>
              <p>{t('accessibilityDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="contact">
        <div className="container">
          <h2 className="section-title">{t('contactTitle')}</h2>
          <p className="contact-subtitle">
            {t('contactSubtitle')}
          </p>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Pivot Consulting</h3>
              <div className="info-item">
                <strong>{t('email')}:</strong>
                <a href="mailto:bq@pivotconsulting.com.co">bq@pivotconsulting.com.co</a>
              </div>
              <div className="info-item">
                <strong>Sitio Web:</strong>
                <a href="https://pivotconsulting.com.co" target="_blank" rel="noopener noreferrer">
                  pivotconsulting.com.co
                </a>
              </div>
            </div>
            <form 
              className="contact-form" 
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setSubmitStatus(null);
                
                try {
                  await contactService.sendMessage(contactData);
                  setSubmitStatus('success');
                  setContactData({
                    name: '',
                    email: '',
                    organization: '',
                    message: ''
                  });
                  setTimeout(() => setSubmitStatus(null), 5000);
                } catch (error) {
                  console.error('Error sending message:', error);
                  setSubmitStatus('error');
                  setTimeout(() => setSubmitStatus(null), 5000);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitStatus === 'success' && (
                <div className="alert alert-success" style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}>
                    {language === 'es' ? '✓ Mensaje enviado correctamente. Te responderemos pronto.' : '✓ Message sent successfully. We will respond soon.'}
                  </div>
              )}
              {submitStatus === 'error' && (
                <div className="alert alert-error" style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                    {language === 'es' ? '✗ Error al enviar el mensaje. Por favor, intenta de nuevo.' : '✗ Error sending message. Please try again.'}
                  </div>
              )}
              <div className="form-group">
                <label className="label">{t('name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="input"
                  required
                  placeholder={t('namePlaceholder')}
                />
              </div>
              <div className="form-group">
                <label className="label">{t('email')} *</label>
                <input
                  type="email"
                  name="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="input"
                  required
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label className="label">{t('organization')} *</label>
                <input
                  type="text"
                  name="organization"
                  value={contactData.organization}
                  onChange={(e) => setContactData({ ...contactData, organization: e.target.value })}
                  className="input"
                  required
                  placeholder={t('organizationPlaceholder')}
                />
              </div>
              <div className="form-group">
                <label className="label">{t('message')} *</label>
                <textarea
                  name="message"
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                  className="input textarea"
                  required
                  rows="4"
                  placeholder={t('messagePlaceholder')}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting 
                  ? (language === 'es' ? 'Enviando...' : 'Sending...')
                  : t('sendMessage')
                }
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">BOARD QUORUM</span>
              <span className="footer-tagline">{t('platformTagline')}</span>
            </div>
            <div className="footer-info">
              <p>{t('developedBy')} <strong>Pivot Consulting</strong></p>
              <p>pivotconsulting.com.co</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

