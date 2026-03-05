import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeNameForDisplay } from '../../utils/nameDisplay';
import Logo from '../../components/Logo/Logo';
import './PublicAttendanceRegister.css';

const PublicAttendanceRegister = () => {
  const { meetingId } = useParams();
  const { t, language } = useLanguage();
  const [meeting, setMeeting] = useState(null);
  const [step, setStep] = useState('verify'); // 'verify', 'confirm', 'manual', 'registered'
  const [formData, setFormData] = useState({
    cedula: '',
    nombre_completo: '',
    cargo: ''
  });
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [quorumMessage, setQuorumMessage] = useState(null);

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  const loadMeeting = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const meetingRes = await axios.get(`${baseURL}/meetings/public/${meetingId}`);
      setMeeting(meetingRes.data);
    } catch (error) {
      console.error('Error loading meeting:', error);
      alert(language === 'es' ? 'Error al cargar la información de la reunión' : 'Error loading meeting information');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // PASO 1: Verificar cédula
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!formData.cedula) {
      alert(language === 'es' ? 'Por favor ingresa tu número de cédula' : 'Please enter your ID number');
      return;
    }

    setSubmitting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${baseURL}/attendance/verify/meeting/${meetingId}`, {
        cedula: formData.cedula
      });

      if (response.data.found) {
        // Miembro encontrado - mostrar confirmación
        setMemberData(response.data.member);
        setQuorumMessage(response.data.quorumMessage);
        setStep('confirm');
      } else {
        // No encontrado - mostrar opción de registro manual
        setStep('notFound');
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.found === false) {
        // No encontrado - mostrar opción de registro manual
        setStep('notFound');
      } else {
        console.error('Error verifying document:', error);
        const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al verificar la cédula' : 'Error verifying ID');
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // PASO 5: Confirmar asistencia
  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${baseURL}/attendance/confirm/meeting/${meetingId}`, {
        cedula: formData.cedula,
        confirmado: true
      });
      
      setRegistered(true);
      setStep('registered');
      setTimeout(() => {
        if (meeting?.google_meet_link) {
          window.open(meeting.google_meet_link, '_blank');
        }
      }, 2000);
    } catch (error) {
      console.error('Error confirming attendance:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al confirmar la asistencia' : 'Error confirming attendance');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Registro manual
  const handleManualRegister = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo || !formData.cargo) {
      alert(language === 'es' ? 'Por favor completa todos los campos' : 'Please complete all fields');
      return;
    }

    setSubmitting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${baseURL}/attendance/manual/meeting/${meetingId}`, {
        cedula: formData.cedula,
        nombre_completo: formData.nombre_completo,
        cargo: formData.cargo
      });
      
      setRegistered(true);
      setStep('registered');
      alert(language === 'es' 
        ? 'Tu registro quedará pendiente de revisión por el administrador' 
        : 'Your registration will be pending administrator review');
    } catch (error) {
      console.error('Error registering manual attendance:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al registrar la asistencia' : 'Error registering attendance');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStep('verify');
    setFormData({ ...formData, cedula: '' });
  };

  if (loading) {
    return (
      <div className="public-attendance-page">
        <div className="loading">{t('loading') || 'Cargando...'}</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="public-attendance-page">
        <div className="error-message">{t('meetingNotFound') || 'Reunión no encontrada'}</div>
      </div>
    );
  }

  if (registered && step === 'registered') {
    return (
      <div className="public-attendance-page">
        <div className="public-attendance-container">
          <Logo size="medium" showText={true} />
          <div className="success-message">
            <h2>✓ {language === 'es' ? 'Asistencia Registrada' : 'Attendance Registered'}</h2>
            <p>{language === 'es' ? 'Tu asistencia ha sido registrada exitosamente' : 'Your attendance has been successfully registered'}</p>
            {meeting.google_meet_link && (
              <div style={{ marginTop: '24px' }}>
                <a 
                  href={meeting.google_meet_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-large"
                >
                  {language === 'es' ? 'Unirse a la Reunión' : 'Join Meeting'} →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-attendance-page">
      <div className="public-attendance-container">
        <Logo size="medium" showText={true} />
        <h1>{language === 'es' ? 'Registro de Asistencia' : 'Attendance Registration'}</h1>
        
        <div className="meeting-info-card">
          <h2>{meeting.title}</h2>
          <p><strong>{language === 'es' ? 'Fecha y Hora' : 'Date and Time'}:</strong> {new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}</p>
          {meeting.location && <p><strong>{language === 'es' ? 'Ubicación' : 'Location'}:</strong> {meeting.location}</p>}
        </div>

        {/* PASO 1: Verificar cédula */}
        {step === 'verify' && (
          <form onSubmit={handleVerify} className="public-attendance-form">
            <div className="form-group">
              <label className="label">{language === 'es' ? 'Ingresa tu número de cédula' : 'Enter your ID number'} *</label>
              <input
                type="text"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                className="input"
                placeholder={language === 'es' ? 'Ejemplo: 52209188' : 'Example: 52209188'}
                required
              />
              <small className="form-help">
                {language === 'es' 
                  ? 'Si no encuentras tu cédula, contacta al administrador' 
                  : 'If you cannot find your ID, contact the administrator'}
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-large btn-block"
              disabled={submitting}
            >
              {submitting 
                ? (language === 'es' ? 'Verificando...' : 'Verifying...') 
                : (language === 'es' ? 'Verificar Asistencia' : 'Verify Attendance')}
            </button>
          </form>
        )}

        {/* PASO 4: Confirmación (miembro encontrado) */}
        {step === 'confirm' && memberData && (
          <div className="confirmation-section">
            <div className="confirmation-card">
              <h3>{language === 'es' ? 'Confirmación' : 'Confirmation'}</h3>
              <div className="member-info">
                <p><strong>{language === 'es' ? 'Nombre' : 'Name'}:</strong> {normalizeNameForDisplay(memberData.name) || memberData.name}</p>
                <p><strong>{language === 'es' ? 'CC' : 'ID'}:</strong> {memberData.numero_documento}</p>
                <p><strong>{language === 'es' ? 'Cargo' : 'Position'}:</strong> {normalizeNameForDisplay(memberData.position) || memberData.position}</p>
              </div>
              
              {quorumMessage && (
                <div className="quorum-notice-box">
                  {quorumMessage}
                </div>
              )}

              <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }}>
                {language === 'es' ? '¿Eres tú?' : 'Is it you?'}
              </p>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button 
                  onClick={handleRetry}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  {language === 'es' ? 'No, Reintentar' : 'No, Retry'}
                </button>
                <button 
                  onClick={handleConfirm}
                  className="btn btn-primary btn-large"
                  disabled={submitting}
                >
                  {submitting 
                    ? (language === 'es' ? 'Registrando...' : 'Registering...') 
                    : (language === 'es' ? 'SÍ, SOY YO' : 'YES, IT\'S ME')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CASO: Cédula no encontrada */}
        {step === 'notFound' && (
          <div className="not-found-section">
            <div className="alert alert-warning" style={{ 
              padding: '24px', 
              backgroundColor: '#fff3cd', 
              borderRadius: '8px', 
              marginBottom: '24px',
              border: '2px solid #ffc107',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '32px', marginRight: '12px' }}>⚠️</span>
                <strong style={{ fontSize: '18px', color: '#856404' }}>
                  {language === 'es' ? 'Cédula No Encontrada' : 'ID Not Found'}
                </strong>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ffc107' }}>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#333' }}>
                  <strong style={{ color: '#856404' }}>{language === 'es' ? 'Número ingresado:' : 'Number entered:'}</strong>{' '}
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>{formData.cedula}</span>
                </p>
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  {language === 'es' ? 'No se encontró en la base de datos' : 'Not found in the database'}
                </p>
              </div>
              <p style={{ marginTop: '16px', fontSize: '16px', fontWeight: 'bold', color: '#856404' }}>
                {language === 'es' ? '¿El número es correcto?' : 'Is the number correct?'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleRetry}
                className="btn btn-secondary btn-large"
                style={{ flex: '1', minWidth: '200px' }}
              >
                {language === 'es' ? 'NO, ME EQUIVOQUÉ (Reintentar)' : 'NO, I MADE A MISTAKE (Retry)'}
              </button>
              <button 
                onClick={() => setStep('manual')}
                className="btn btn-warning btn-large"
                style={{ flex: '1', minWidth: '200px', backgroundColor: '#ffc107', color: '#000', fontWeight: 'bold' }}
              >
                {language === 'es' ? 'SÍ, ES CORRECTO (Continuar)' : 'YES, IT IS CORRECT (Continue)'}
              </button>
            </div>

            {/* Registro Manual */}
            {step === 'manual' && (
              <div className="manual-registration-section">
                <h3 style={{ color: '#0072FF', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
                  {language === 'es' ? 'Registro Manual' : 'Manual Registration'}
                </h3>
                <div className="alert alert-info" style={{ 
                  padding: '16px', 
                  backgroundColor: '#d1ecf1', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  border: '2px solid #0c5460',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <strong style={{ color: '#0c5460', fontSize: '14px' }}>
                    {language === 'es' 
                      ? 'Este registro quedará pendiente de revisión por el administrador' 
                      : 'This registration will be pending administrator review'}
                  </strong>
                </div>

                <form onSubmit={handleManualRegister} className="manual-form">
                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'CC (confirmado)' : 'ID (confirmed)'}</label>
                    <input
                      type="text"
                      value={formData.cedula}
                      className="input"
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'Nombre completo' : 'Full name'} *</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      className="input"
                      placeholder={language === 'es' ? 'Nombres y apellidos completos' : 'First and last names'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'Cargo' : 'Position'} *</label>
                    <input
                      type="text"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="input"
                      placeholder={language === 'es' ? 'Selecciona...' : 'Select...'}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-warning btn-large btn-block"
                    disabled={submitting}
                  >
                    {submitting 
                      ? (language === 'es' ? 'Registrando...' : 'Registering...') 
                      : (language === 'es' ? 'Registrar (Pendiente Aprobación)' : 'Register (Pending Approval)')}
                  </button>
                </form>

                <div className="use-cases" style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <strong>{language === 'es' ? 'CASOS DE USO:' : 'USE CASES:'}</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    <li>{language === 'es' ? 'Error de digitación del miembro' : 'Member typing error'}</li>
                    <li>{language === 'es' ? 'Invitado ocasional no en BD' : 'Occasional guest not in DB'}</li>
                    <li>{language === 'es' ? 'Miembro nuevo sin actualizar BD' : 'New member not updated in DB'}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {meeting.google_meet_link && step === 'verify' && (
          <div className="meet-link-section" style={{ marginTop: '24px' }}>
            <a 
              href={meeting.google_meet_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-large btn-block"
            >
              {language === 'es' ? 'Unirse a la Reunión' : 'Join Meeting'} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicAttendanceRegister;
