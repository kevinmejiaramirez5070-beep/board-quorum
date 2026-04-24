import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import api from '../../services/api';
import './PublicVoting.css';

// meetingMode=true: la URL es /public/meeting/:meetingId/vote → busca la votación ACTIVA de la reunión
const PublicVoting = ({ meetingMode = false }) => {
  const { votingId, meetingId } = useParams();
  const { t, language } = useLanguage();
  const [voting, setVoting] = useState(null);
  const [step, setStep] = useState('verify');
  const [formData, setFormData] = useState({ cedula: '', option: '' });
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState(null);

  useEffect(() => {
    loadVotingData();
    // En meetingMode refrescar cada 15s para capturar cuándo se activa una votación
    if (meetingMode) {
      const interval = setInterval(loadVotingData, 15000);
      return () => clearInterval(interval);
    }
  }, [votingId, meetingId]);

  const loadVotingData = async () => {
    try {
      let response;
      if (meetingMode) {
        response = await api.get(`/votings/public/meeting/${meetingId}/active`);
      } else {
        response = await api.get(`/votings/public/${votingId}`);
      }
      setVoting(response.data);
    } catch (error) {
      if (meetingMode && error.response?.data?.noActive) {
        // No hay votación activa aún — mostrar pantalla de espera sin error
        setVoting({ status: 'waiting', title: '', meeting_id: meetingId });
      } else {
        console.error('Error loading voting data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getVotingOptions = () => {
    if (voting?.type === 'multiple' && voting?.options && Array.isArray(voting.options)) {
      return voting.options;
    }
    return ['A favor', 'En contra', 'Abstención'];
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setInlineError(null);
  };

  // PASO 1: Verificar cédula
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!formData.cedula) {
      setInlineError(language === 'es' ? 'Por favor ingresa tu número de cédula.' : 'Please enter your ID number.');
      return;
    }

    setSubmitting(true);
    setInlineError(null);
    try {
      const response = await api.post(`/votes/verify/${votingId}`, { cedula: formData.cedula });

      if (response.data.found && !response.data.alreadyVoted) {
        setMemberData(response.data.member);
        setStep('confirm');
      } else if (response.data.alreadyVoted) {
        setInlineError(language === 'es' ? 'Ya has votado en esta votación.' : 'You have already voted.');
      } else {
        setStep('notFound');
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.found === false) {
        setStep('notFound');
      } else if (error.response?.status === 400 && error.response?.data?.alreadyVoted) {
        setInlineError(language === 'es' ? 'Ya has votado en esta votación.' : 'You have already voted.');
      } else {
        setInlineError(error.response?.data?.message || (language === 'es' ? 'Error al verificar la cédula.' : 'Error verifying ID.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // PASO 2: Confirmar voto
  const handleConfirmVote = async () => {
    if (!formData.option) {
      setInlineError(language === 'es' ? 'Por favor selecciona una opción.' : 'Please select an option.');
      return;
    }

    setSubmitting(true);
    setInlineError(null);
    try {
      await api.post(`/votes/confirm/${votingId}`, {
        cedula: formData.cedula,
        option: formData.option,
        confirmado: true
      });
      setStep('voted');
    } catch (error) {
      const msg = error.response?.data?.message;
      // VOT-SUPLENCIAS / VOT-JV-VOTO: mensajes claros de bloqueo
      setInlineError(msg || (language === 'es' ? 'Error al confirmar el voto.' : 'Error confirming vote.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStep('verify');
    setFormData({ cedula: '', option: '' });
    setInlineError(null);
    setMemberData(null);
  };

  if (loading) {
    return (
      <div className="public-voting-page">
        <div className="loading">{t('loading') || 'Cargando...'}</div>
      </div>
    );
  }

  if (!voting) {
    return (
      <div className="public-voting-page">
        <div className="container">
          <div className="voting-card">
            <Logo size="medium" showText={true} />
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '24px' }}>
              {language === 'es' ? 'Votación no encontrada.' : 'Voting not found.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Esperando que el admin active una votación (modo reunión, aún sin activa)
  if (voting.status === 'waiting' || voting.status !== 'active') {
    return (
      <div className="public-voting-page">
        <div className="container">
          <div className="voting-card">
            <Logo size="medium" showText={true} />
            <h1>{voting.title}</h1>
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <p style={{ fontWeight: 600, fontSize: '16px', margin: 0 }}>
                {language === 'es'
                  ? 'La votación aún no ha sido habilitada. El administrador la activará en breve. Por favor espera.'
                  : 'The vote has not been enabled yet. The administrator will activate it shortly. Please wait.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voto registrado exitosamente
  if (step === 'voted') {
    return (
      <div className="public-voting-page">
        <div className="container">
          <div className="voting-card success">
            <Logo size="medium" showText={true} />
            <h1>✓ {language === 'es' ? 'Voto Registrado' : 'Vote Registered'}</h1>
            <p>{language === 'es' ? 'Tu voto ha sido registrado exitosamente.' : 'Your vote has been registered successfully.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const options = getVotingOptions();

  return (
    <div className="public-voting-page">
      <div className="container">
        <div className="voting-card">
          <Logo size="medium" showText={true} />
          <h1>{voting.title}</h1>
          {voting.description && <p className="voting-description">{voting.description}</p>}

          {/* Mensaje de error inline — reemplaza todos los alert() */}
          {inlineError && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: 500
            }}>
              ⚠️ {inlineError}
            </div>
          )}

          {/* PASO 1: Verificar cédula */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="voting-form">
              <div className="form-group">
                <label className="label">
                  {language === 'es' ? 'Ingresa tu número de cédula' : 'Enter your ID number'} *
                </label>
                <input
                  type="text"
                  name="cedula"
                  value={formData.cedula}
                  onChange={handleChange}
                  className="input"
                  placeholder={language === 'es' ? 'Ejemplo: 52209188' : 'Example: 52209188'}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-large btn-block"
                disabled={submitting}
              >
                {submitting
                  ? (language === 'es' ? 'Verificando...' : 'Verifying...')
                  : (language === 'es' ? 'Verificar Identidad' : 'Verify Identity')}
              </button>
            </form>
          )}

          {/* PASO 2: Confirmar identidad y emitir voto */}
          {step === 'confirm' && memberData && (
            <div className="confirmation-section">
              <div className="confirmation-card">
                <h3>{language === 'es' ? 'Confirmación de identidad' : 'Identity confirmation'}</h3>
                <div className="member-info">
                  <p><strong>{language === 'es' ? 'Nombre' : 'Name'}:</strong> {memberData.name}</p>
                  <p><strong>{language === 'es' ? 'CC' : 'ID'}:</strong> {memberData.numero_documento}</p>
                  <p><strong>{language === 'es' ? 'Cargo' : 'Position'}:</strong> {memberData.position}</p>
                </div>

                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--surface, #f8f9fa)', borderRadius: '8px' }}>
                  <div className="form-group">
                    <label className="label" style={{ fontWeight: 700 }}>
                      {language === 'es' ? 'Tu Voto' : 'Your Vote'} *
                    </label>
                    <div className="options-group">
                      {options.map((option, index) => (
                        <label key={index} className="option-radio">
                          <input
                            type="radio"
                            name="option"
                            value={option}
                            checked={formData.option === option}
                            onChange={handleChange}
                          />
                          <span className="radio-label">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button onClick={handleRetry} className="btn btn-secondary" disabled={submitting}>
                      {language === 'es' ? 'No soy yo' : 'Not me'}
                    </button>
                    <button
                      onClick={handleConfirmVote}
                      className="btn btn-primary btn-large"
                      disabled={submitting || !formData.option}
                    >
                      {submitting
                        ? (language === 'es' ? 'Registrando...' : 'Registering...')
                        : (language === 'es' ? 'Confirmar Voto' : 'Confirm Vote')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VOT-INVITADO FIX: Cédula no encontrada → bloqueo total. Sin flujo de invitado. */}
          {step === 'notFound' && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                padding: '24px',
                background: 'rgba(239,68,68,0.08)',
                border: '2px solid rgba(239,68,68,0.4)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div>
                <h3 style={{ color: '#dc2626', margin: '0 0 8px' }}>
                  {language === 'es' ? 'No es posible registrar su voto' : 'Unable to register your vote'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 6px' }}>
                  {language === 'es'
                    ? 'La cédula ingresada no se encuentra habilitada para esta votación.'
                    : 'The ID entered is not authorized to vote in this session.'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                  {language === 'es'
                    ? 'Solo pueden votar personas registradas en la reunión con derecho a voto.'
                    : 'Only members registered in the meeting with voting rights can vote.'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '13px', marginTop: '12px', color: '#94a3b8' }}>
                  CC: {formData.cedula}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="btn btn-secondary btn-large btn-block"
                style={{ marginTop: '16px' }}
              >
                {language === 'es' ? 'Reintentar con otra cédula' : 'Retry with another ID'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicVoting;
