import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { displayNameWithAccents } from '../../utils/nameDisplay';
import Logo from '../../components/Logo/Logo';
import './PublicAttendanceRegister.css';

const PublicAttendanceRegister = () => {
  const { meetingId } = useParams();
  const { t, language } = useLanguage();
  const [meeting, setMeeting] = useState(null);
  const [step, setStep] = useState('verify'); // 'verify', 'confirm', 'notFound', 'relation', 'manualOrg', 'manualGuest', 'manualAdmin', 'registered'
  const [formData, setFormData] = useState({
    cedula: '',
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: '',
    organo: 'Junta Directiva',
    registroTipo: 'ORG_MEMBER' // ORG_MEMBER | INVITADO | PERSONAL_ADMIN
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

    if (!formData.nombre_completo) {
      alert(language === 'es' ? 'Por favor ingresa tu nombre completo' : 'Please enter your full name');
      return;
    }

    setSubmitting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

      // Mapear el tipo elegido al campo `cargo` que exige el backend.
      // Nota: para que NO cuente al quórum, el backend registra con `member_id = null` y `pending_approval = true`.
      let mappedCargo = '';
      if (formData.registroTipo === 'INVITADO') {
        mappedCargo = 'INVITADO';
      } else if (formData.registroTipo === 'PERSONAL_ADMIN') {
        mappedCargo = formData.cargo
          ? `PERSONAL ADMIN - ${formData.cargo}`
          : 'PERSONAL ADMIN';
      } else {
        // Miembro de órgano: guardar etiqueta de validación (y opcionalmente el cargo)
        mappedCargo = formData.cargo
          ? `PENDIENTE VALIDAR - ${formData.cargo}`
          : 'PENDIENTE VALIDAR';
      }

      await axios.post(`${baseURL}/attendance/manual/meeting/${meetingId}`, {
        cedula: formData.cedula,
        nombre_completo: formData.nombre_completo,
        cargo: mappedCargo,
        telefono: formData.telefono,
        email: formData.email,
        organo: formData.organo
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

  const handleBackToNotFound = () => {
    setStep('notFound');
  };

  const startManualFlow = (tipo) => {
    setFormData(prev => ({
      ...prev,
      registroTipo: tipo,
      nombre_completo: prev.nombre_completo || '',
      cargo: prev.cargo || '',
      telefono: prev.telefono || '',
      email: prev.email || ''
    }));
    if (tipo === 'INVITADO') setStep('manualGuest');
    else if (tipo === 'PERSONAL_ADMIN') setStep('manualAdmin');
    else setStep('manualOrg');
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
                <p><strong>{language === 'es' ? 'Nombre' : 'Name'}:</strong> {displayNameWithAccents(memberData.name) || memberData.name}</p>
                <p><strong>{language === 'es' ? 'CC' : 'ID'}:</strong> {memberData.numero_documento}</p>
                <p><strong>{language === 'es' ? 'Cargo' : 'Position'}:</strong> {displayNameWithAccents(memberData.position) || memberData.position}</p>
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
                onClick={() => setStep('relation')}
                className="btn btn-warning btn-large"
                style={{ flex: '1', minWidth: '200px', backgroundColor: '#ffc107', color: '#000', fontWeight: 'bold' }}
              >
                {language === 'es' ? 'SÍ, ES CORRECTO (Continuar)' : 'YES, IT IS CORRECT (Continue)'}
              </button>
            </div>
          </div>
        )}

        {/* PASO: Selección del flujo (invitado / personal admin / miembro de órgano) */}
        {step === 'relation' && (
          <div className="relation-section">
            <h3 style={{ color: '#856404', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              {language === 'es' ? '¿Cuál es tu relación con esta reunión?' : 'What is your relationship with this meeting?'}
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginTop: '16px'
              }}
            >
              <div style={{ padding: '18px', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: 0, color: '#fbbf24' }}>Opción 1 - Miembro de un órgano ASOCOLCI</h4>
                <p style={{ color: '#cbd5e1', marginTop: '10px' }}>
                  {language === 'es'
                    ? 'Selecciona tu órgano y registra tu asistencia como PENDIENTE DE VALIDACIÓN (no cuenta al quórum hasta validación del Admin).'
                    : 'Select your organ and register your attendance as PENDING VALIDATION (does not count to quorum until Admin validation).'}
                </p>
                <button className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '14px' }} onClick={() => startManualFlow('ORG_MEMBER')}>
                  {language === 'es' ? 'Elegir Opción 1' : 'Choose Option 1'}
                </button>
              </div>

              <div style={{ padding: '18px', backgroundColor: '#0b1220', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: 0, color: '#60a5fa' }}>Opción 2 - Invitado externo</h4>
                <p style={{ color: '#cbd5e1', marginTop: '10px' }}>
                  {language === 'es'
                    ? 'Regístrate como INVITADO (PENDIENTE DE VALIDACIÓN). NUNCA suma al quórum y NUNCA puede votar.'
                    : 'Register as INVITED (PENDING VALIDATION). Never counts for quorum and cannot vote.'}
                </p>
                <button className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '14px' }} onClick={() => startManualFlow('INVITADO')}>
                  {language === 'es' ? 'Elegir Opción 2' : 'Choose Option 2'}
                </button>
              </div>

              <div style={{ padding: '18px', backgroundColor: '#0b1220', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: 0, color: '#34d399' }}>Opción 3 - Personal administrativo ASOCOLCI</h4>
                <p style={{ color: '#cbd5e1', marginTop: '10px' }}>
                  {language === 'es'
                    ? 'Regístrate como PERSONAL ADMIN (PENDIENTE DE VALIDACIÓN). NUNCA suma al quórum y NUNCA puede votar.'
                    : 'Register as PERSONAL ADMIN (PENDING VALIDATION). Never counts for quorum and cannot vote.'}
                </p>
                <button className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '14px' }} onClick={() => startManualFlow('PERSONAL_ADMIN')}>
                  {language === 'es' ? 'Elegir Opción 3' : 'Choose Option 3'}
                </button>
              </div>

              <div style={{ padding: '18px', backgroundColor: '#111827', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: 0, color: '#fb7185' }}>Opción 4 - Ninguna aplica / Error</h4>
                <p style={{ color: '#cbd5e1', marginTop: '10px' }}>
                  {language === 'es'
                    ? 'La persona no sabe por qué está aquí o se equivocó de número. Contacta al administrador.'
                    : 'The person is unsure or entered the wrong number. Contact the administrator.'}
                </p>
                <button className="btn btn-danger btn-large" style={{ width: '100%', marginTop: '14px' }} onClick={() => setStep('manualNone')}>
                  {language === 'es' ? 'Elegir Opción 4' : 'Choose Option 4'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={handleBackToNotFound} disabled={submitting}>
                {language === 'es' ? 'Volver' : 'Back'}
              </button>
            </div>
          </div>
        )}

        {/* Manual - Miembro de órgano ASOCOLCI */}
        {step === 'manualOrg' && (
          <div className="manual-registration-section">
            <h3 style={{ color: '#0072FF', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              {language === 'es' ? 'Miembro de órgano (Pendiente de validación)' : 'Organ member (Pending validation)'}
            </h3>

            <div className="alert alert-info" style={{ padding: '16px', backgroundColor: '#d1ecf1', borderRadius: '8px', marginBottom: '20px', border: '2px solid #0c5460' }}>
              <strong style={{ color: '#0c5460', fontSize: '14px' }}>
                {language === 'es' ? 'Se registrará como PENDIENTE DE VALIDACIÓN' : 'It will be recorded as PENDING VALIDATION'}
              </strong>
            </div>

            <form onSubmit={handleManualRegister} className="manual-form">
              <div className="form-group">
                <label className="label">{language === 'es' ? 'CC (confirmado)' : 'ID (confirmed)'}</label>
                <input type="text" value={formData.cedula} className="input" disabled />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Selecciona su órgano' : 'Select your organ'}</label>
                <select
                  name="organo"
                  value={formData.organo}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="Junta Directiva">Junta Directiva</option>
                  <option value="Junta de Vigilancia">Junta de Vigilancia</option>
                  <option value="Contabilidad">Contabilidad</option>
                  <option value="Revisoría">Revisoría</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Apellidos y Nombres completos' : 'Full names'} *</label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className="input"
                  placeholder={language === 'es' ? 'Nombres y apellidos completos' : 'Full names'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Número telefónico (opcional)' : 'Phone number (optional)'}</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="input" />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Correo electrónico (opcional)' : 'Email (optional)'}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Cargo dentro del órgano (opcional)' : 'Role within the organ (optional)'}</label>
                <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className="input" />
              </div>

              <button type="submit" className="btn btn-warning btn-large btn-block" disabled={submitting}>
                {submitting ? (language === 'es' ? 'Registrando...' : 'Registering...') : (language === 'es' ? 'Registrar (Pendiente Aprobación)' : 'Register (Pending Approval)')}
              </button>

              <button type="button" className="btn btn-secondary btn-large btn-block" style={{ marginTop: '10px' }} onClick={handleBackToNotFound} disabled={submitting}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </form>
          </div>
        )}

        {/* Manual - Invitado */}
        {step === 'manualGuest' && (
          <div className="manual-registration-section">
            <h3 style={{ color: '#60a5fa', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              {language === 'es' ? 'Invitado externo (Pendiente de validación)' : 'External guest (Pending validation)'}
            </h3>

            <div className="alert alert-info" style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '20px', border: '2px solid #1d4ed8' }}>
              <strong style={{ color: '#1d4ed8', fontSize: '14px' }}>
                {language === 'es' ? 'Se registrará como INVITADO. NUNCA suma al quórum.' : 'Will be recorded as INVITED. Never counts for quorum.'}
              </strong>
            </div>

            <form onSubmit={handleManualRegister} className="manual-form">
              <div className="form-group">
                <label className="label">{language === 'es' ? 'CC (confirmado)' : 'ID (confirmed)'}</label>
                <input type="text" value={formData.cedula} className="input" disabled />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Apellidos y Nombres completos' : 'Full names'} *</label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className="input"
                  placeholder={language === 'es' ? 'Nombres y apellidos completos' : 'Full names'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Número telefónico (opcional)' : 'Phone number (optional)'}</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="input" />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Correo electrónico (opcional)' : 'Email (optional)'}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
              </div>

              <button type="submit" className="btn btn-warning btn-large btn-block" disabled={submitting}>
                {submitting ? (language === 'es' ? 'Registrando...' : 'Registering...') : (language === 'es' ? 'Registrar (Pendiente Aprobación)' : 'Register (Pending Approval)')}
              </button>

              <button type="button" className="btn btn-secondary btn-large btn-block" style={{ marginTop: '10px' }} onClick={handleBackToNotFound} disabled={submitting}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </form>
          </div>
        )}

        {/* Manual - Personal administrativo */}
        {step === 'manualAdmin' && (
          <div className="manual-registration-section">
            <h3 style={{ color: '#34d399', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              {language === 'es' ? 'Personal administrativo (Pendiente de validación)' : 'Administrative staff (Pending validation)'}
            </h3>

            <div className="alert alert-info" style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', marginBottom: '20px', border: '2px solid #16a34a' }}>
              <strong style={{ color: '#166534', fontSize: '14px' }}>
                {language === 'es' ? 'Se registrará como PERSONAL ADMIN. NUNCA suma al quórum.' : 'Will be recorded as PERSONAL ADMIN. Never counts for quorum.'}
              </strong>
            </div>

            <form onSubmit={handleManualRegister} className="manual-form">
              <div className="form-group">
                <label className="label">{language === 'es' ? 'CC (confirmado)' : 'ID (confirmed)'}</label>
                <input type="text" value={formData.cedula} className="input" disabled />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Apellidos y Nombres completos' : 'Full names'} *</label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className="input"
                  placeholder={language === 'es' ? 'Nombres y apellidos completos' : 'Full names'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Cargo o función (opcional)' : 'Role/function (optional)'}</label>
                <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className="input" />
              </div>

              <div className="form-group">
                <label className="label">{language === 'es' ? 'Correo electrónico (opcional)' : 'Email (optional)'}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" />
              </div>

              <button type="submit" className="btn btn-warning btn-large btn-block" disabled={submitting}>
                {submitting ? (language === 'es' ? 'Registrando...' : 'Registering...') : (language === 'es' ? 'Registrar (Pendiente Aprobación)' : 'Register (Pending Approval)')}
              </button>

              <button type="button" className="btn btn-secondary btn-large btn-block" style={{ marginTop: '10px' }} onClick={handleBackToNotFound} disabled={submitting}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </form>
          </div>
        )}

        {/* Manual - Ninguna aplica / Error */}
        {step === 'manualNone' && (
          <div className="manual-registration-section">
            <h3 style={{ color: '#fb7185', marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>
              {language === 'es' ? 'Error - Ninguna aplica' : 'Error - None applies'}
            </h3>

            <div className="alert alert-warning" style={{ padding: '16px', backgroundColor: '#fff1f2', borderRadius: '8px', marginBottom: '20px', border: '2px solid #fb7185' }}>
              <strong style={{ color: '#be123c', fontSize: '14px' }}>
                {language === 'es'
                  ? 'La persona no sabe por qué está aquí o se equivocó de número.'
                  : 'The person is unsure why they are here or entered the wrong number.'}
              </strong>
              <p style={{ marginTop: '10px', color: '#4b5563' }}>
                {language === 'es' ? 'Botón: Contactar al administrador' : 'Button: Contact the administrator'}
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-large btn-block"
              onClick={() => alert(language === 'es' ? 'Contacta al administrador de la reunión.' : 'Contact the meeting administrator.')}
              disabled={submitting}
            >
              {language === 'es' ? 'Contactar al administrador' : 'Contact administrator'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-large btn-block"
              style={{ marginTop: '10px' }}
              onClick={handleRetry}
              disabled={submitting}
            >
              {language === 'es' ? 'Volver a ingresar cédula' : 'Back to ID input'}
            </button>
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
