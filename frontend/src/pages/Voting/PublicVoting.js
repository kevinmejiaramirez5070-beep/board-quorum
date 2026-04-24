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
  // step: 'verify' | 'confirm' | 'notFound' | 'blocked' | 'voted'
  const [step, setStep] = useState('verify');
  const [formData, setFormData] = useState({ cedula: '', option: '' });
  const [memberData, setMemberData] = useState(null);
  const [blockInfo, setBlockInfo] = useState(null); // { status, cargo, message }
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
      const activeVotingId = voting?.id || votingId;
      const response = await api.post(`/votes/verify/${activeVotingId}`, { cedula: formData.cedula });
      const { status, member, cargo } = response.data;

      if (status === 'OK' || status === 'SUPLENTE_ACTUANDO') {
        setMemberData({ ...member, isSuplenteActuando: status === 'SUPLENTE_ACTUANDO' });
        setStep('confirm');
      } else {
        // Cualquier otro status OK con found=true y no blocked → confirmar
        if (response.data.found && !response.data.blocked) {
          setMemberData(member);
          setStep('confirm');
        }
      }
    } catch (error) {
      const data = error.response?.data || {};
      const status = data.status;
      const cargo = data.cargo;

      if (status === 'NOT_FOUND' || (error.response?.status === 404 && data.found === false)) {
        setStep('notFound');
      } else if (['NO_VOTE', 'SUPLENTE_SIN_VOTO', 'JV_VOTED', 'JV_VOZ', 'ALREADY_VOTED'].includes(status)) {
        setBlockInfo({ status, cargo, message: getBlockMessage(status, cargo) });
        setStep('blocked');
      } else {
        setInlineError(data.message || (language === 'es' ? 'Error al verificar la cédula.' : 'Error verifying ID.'));
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
      const activeVotingId = voting?.id || votingId;
      await api.post(`/votes/confirm/${activeVotingId}`, {
        cedula: formData.cedula,
        option: formData.option,
        confirmado: true
      });
      setStep('voted');
    } catch (error) {
      const data = error.response?.data || {};
      const status = data.status;
      // Si el backend detecta en confirmVote un bloqueo tardío, mostrarlo correctamente
      if (['NO_VOTE', 'SUPLENTE_SIN_VOTO', 'JV_VOTED', 'JV_VOZ'].includes(status)) {
        setBlockInfo({ status, cargo: data.cargo, message: getBlockMessage(status, data.cargo) });
        setStep('blocked');
      } else {
        setInlineError(data.message || (language === 'es' ? 'Error al confirmar el voto.' : 'Error confirming vote.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Mensajes por status code — tomados literalmente del BQ_ESPECIFICACION_v2
  const getBlockMessage = (status, cargo) => {
    const c = cargo || 'Tu cargo';
    const msgs = {
      es: {
        NO_VOTE: `Tu cargo (${c}) no tiene voto en las sesiones de Junta Directiva. Tu asistencia ya fue registrada.`,
        SUPLENTE_SIN_VOTO: `El cargo ${c} ya tiene voto registrado por el miembro principal. Tu asistencia quedó registrada con voz.`,
        JV_VOTED: 'El voto de la Junta de Vigilancia ya fue registrado por el representante designado. Tu presencia queda registrada.',
        JV_VOZ: 'El voto de la Junta de Vigilancia ya fue registrado por el representante designado. Tu presencia queda registrada.',
        ALREADY_VOTED: 'Ya has votado en esta votación.',
      },
      en: {
        NO_VOTE: `Your role (${c}) does not have voting rights in Board of Directors sessions. Your attendance has been recorded.`,
        SUPLENTE_SIN_VOTO: `The ${c} position already has a vote registered by the principal member. Your attendance is recorded with voice only.`,
        JV_VOTED: 'The Oversight Board vote has already been cast by the designated representative. Your presence is recorded.',
        JV_VOZ: 'The Oversight Board vote has already been cast by the designated representative. Your presence is recorded.',
        ALREADY_VOTED: 'You have already voted in this voting.',
      }
    };
    return msgs[language]?.[status] || msgs.es[status] || 'No autorizado para votar.';
  };

  const handleRetry = () => {
    setStep('verify');
    setFormData({ cedula: '', option: '' });
    setInlineError(null);
    setMemberData(null);
    setBlockInfo(null);
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
                {/* Aviso especial si suplente está actuando como principal */}
                {memberData.isSuplenteActuando && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', fontSize: '13px', color: '#059669' }}>
                    ✅ {language === 'es'
                      ? `Estás actuando en reemplazo del principal de ${memberData.cargo || memberData.position}. Tu voto es válido y computa para esta votación.`
                      : `You are acting as replacement for the principal of ${memberData.cargo || memberData.position}. Your vote is valid and counts.`}
                  </div>
                )}

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

          {/* Bloqueo por status específico: NO_VOTE, SUPLENTE_SIN_VOTO, JV_VOTED, ALREADY_VOTED */}
          {step === 'blocked' && blockInfo && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                padding: '24px',
                background: 'rgba(239,68,68,0.06)',
                border: '1.5px solid rgba(239,68,68,0.35)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>
                  {blockInfo.status === 'ALREADY_VOTED' ? '✓' : '🚫'}
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
                  {blockInfo.status === 'ALREADY_VOTED'
                    ? (language === 'es' ? 'Voto ya registrado' : 'Already voted')
                    : (language === 'es' ? 'No es posible registrar su voto' : 'Unable to register your vote')}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                  {blockInfo.message}
                </p>
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
