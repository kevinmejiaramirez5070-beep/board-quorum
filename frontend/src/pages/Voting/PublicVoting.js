import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import api from '../../services/api';
import './PublicVoting.css';

const PublicVoting = () => {
  const { votingId } = useParams();
  const { t, language } = useLanguage();
  const [voting, setVoting] = useState(null);
  const [step, setStep] = useState('verify'); // 'verify', 'confirm', 'notFound', 'guest', 'voted'
  const [formData, setFormData] = useState({
    cedula: '',
    option: '',
    guestName: '',
    guestEmail: ''
  });
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteMessage, setVoteMessage] = useState(null);

  useEffect(() => {
    loadVotingData();
  }, [votingId]);

  const loadVotingData = async () => {
    try {
      const response = await api.get(`/votings/public/${votingId}`);
      setVoting(response.data);
    } catch (error) {
      console.error('Error loading voting data:', error);
      const msg = error.response?.data?.message || (language === 'es' ? 'Error al cargar la información de la votación' : 'Error loading voting information');
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Obtener opciones según el tipo de votación
  const getVotingOptions = () => {
    if (voting?.type === 'multiple' && voting?.options && Array.isArray(voting.options)) {
      return voting.options;
    }
    // Opciones por defecto para votación simple
    return ['Sí', 'No', 'Abstención'];
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
      const response = await api.post(`/votes/verify/${votingId}`, {
        cedula: formData.cedula
      });

      if (response.data.found && !response.data.alreadyVoted) {
        // Miembro encontrado y no ha votado - mostrar confirmación
        setMemberData(response.data.member);
        setVoteMessage(response.data.voteMessage);
        setStep('confirm');
      } else if (response.data.alreadyVoted) {
        // Ya votó
        alert(language === 'es' ? 'Ya has votado en esta votación' : 'You have already voted in this voting');
        setSubmitting(false);
      } else {
        // No encontrado
        setStep('notFound');
      }
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.found === false) {
        // No encontrado
        setStep('notFound');
      } else if (error.response?.status === 400 && error.response?.data?.alreadyVoted) {
        alert(language === 'es' ? 'Ya has votado en esta votación' : 'You have already voted in this voting');
      } else {
        console.error('Error verifying document:', error);
        const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al verificar la cédula' : 'Error verifying ID');
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // PASO 5: Confirmar voto
  const handleConfirmVote = async () => {
    if (!formData.option) {
      alert(language === 'es' ? 'Por favor selecciona una opción' : 'Please select an option');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/votes/confirm/${votingId}`, {
        cedula: formData.cedula,
        option: formData.option,
        confirmado: true
      });
      
      setVoted(true);
      setStep('voted');
    } catch (error) {
      console.error('Error confirming vote:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al confirmar el voto' : 'Error confirming vote');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStep('verify');
    setFormData({ ...formData, cedula: '', option: '', guestName: '', guestEmail: '' });
  };

  // PASO 6 (invitado): cuando no existe la cédula, permitir registrar un voto como invitado
  const handleGuestVote = async () => {
    if (!formData.guestName || !formData.option) {
      alert(
        language === 'es'
          ? 'Ingresa tu nombre (invitado) y selecciona una opción'
          : 'Enter your name (guest) and select an option'
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/votes/public/${votingId}`, {
        name: formData.guestName,
        email: formData.guestEmail || null,
        option: formData.option
      });

      setVoted(true);
      setStep('voted');
    } catch (error) {
      console.error('Error casting guest vote:', error);
      const errorMessage =
        error.response?.data?.message ||
        (language === 'es' ? 'Error al registrar el voto como invitado' : 'Error casting guest vote');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
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
        <div className="error-message">{language === 'es' ? 'Votación no encontrada' : 'Voting not found'}</div>
      </div>
    );
  }

  if (voting.status !== 'active') {
    const meetingId = voting.meeting_id;
    const backToMeeting =
      meetingId
        ? `${window.location.origin}/meetings/${meetingId}#meeting-quorum-card`
        : null;

    return (
      <div className="public-voting-page">
        <div className="container">
          <div className="voting-card">
            <Logo size="medium" showText={true} />
            <h1>{voting.title}</h1>
            <p className="status-message">
              {language === 'es'
                ? 'Aún no puedes votar porque la votación no está habilitada. Revisa la reunión y espera a que el Admin active la votación cuando el quórum sea alcanzado.'
                : 'You cannot vote yet because the voting is not enabled. Check the meeting and wait for the Admin to activate the voting once quorum is reached.'}
            </p>

            {backToMeeting && (
              <a
                href={backToMeeting}
                className="btn btn-secondary btn-large btn-block"
                style={{ marginTop: '16px' }}
              >
                {language === 'es' ? 'Volver a la reunión' : 'Back to meeting'}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (voted && step === 'voted') {
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
          {voting.description && (
            <p className="voting-description">{voting.description}</p>
          )}

          {/* PASO 1: Verificar cédula */}
          {step === 'verify' && (
            <form onSubmit={handleVerify} className="voting-form">
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
                  : (language === 'es' ? 'Verificar Identidad' : 'Verify Identity')}
              </button>
            </form>
          )}

          {/* PASO 4: Confirmación (miembro encontrado) */}
          {step === 'confirm' && memberData && (
            <div className="confirmation-section">
              <div className="confirmation-card">
                <h3>{language === 'es' ? 'Confirmación' : 'Confirmation'}</h3>
                <div className="member-info">
                  <p><strong>{language === 'es' ? 'Nombre' : 'Name'}:</strong> {memberData.name}</p>
                  <p><strong>{language === 'es' ? 'CC' : 'ID'}:</strong> {memberData.numero_documento}</p>
                  <p><strong>{language === 'es' ? 'Cargo' : 'Position'}:</strong> {memberData.position}</p>
                </div>
                
                {voteMessage && (
                  <div className="alert alert-warning" style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    {voteMessage}
                  </div>
                )}

                <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }}>
                  {language === 'es' ? '¿Eres tú?' : 'Is it you?'}
                </p>

                {/* Selección de voto - siempre visible después de confirmar identidad */}
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'Tu Voto' : 'Your Vote'} *</label>
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
                    <button 
                      onClick={handleRetry}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      {language === 'es' ? 'No, Reintentar' : 'No, Retry'}
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
                  {language === 'es' ? 'Solo los miembros registrados pueden votar.' : 'Only registered members can vote.'}
                </p>
              </div>

              <button 
                onClick={handleRetry}
                className="btn btn-secondary btn-large btn-block"
                style={{ padding: '14px', fontSize: '16px', fontWeight: '600' }}
              >
                {language === 'es' ? 'Reintentar' : 'Retry'}
              </button>

              <button
                type="button"
                onClick={() => setStep('guest')}
                className="btn btn-warning btn-large btn-block"
                style={{ marginTop: '12px', padding: '14px', fontSize: '16px', fontWeight: '700' }}
              >
                {language === 'es' ? 'Continuar como invitado' : 'Continue as guest'}
              </button>
            </div>
          )}

          {/* PASO INVITADO */}
          {step === 'guest' && (
            <div className="guest-section">
              <div className="confirmation-card">
                <h3>{language === 'es' ? 'Flujo de invitado' : 'Guest flow'}</h3>
                <p style={{ color: '#666', marginTop: '8px' }}>
                  {language === 'es'
                    ? 'Registra tu voto como invitado. (Si perteneces a la organización, intenta con tu cédula.)'
                    : 'Register your vote as a guest. (If you are part of the organization, try with your ID.)'}
                </p>

                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="label">{language === 'es' ? 'Nombre' : 'Name'} *</label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleChange}
                      className="input"
                      placeholder={language === 'es' ? 'Ej: Juan Invitado' : 'e.g. John Guest'}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="label">{language === 'es' ? 'Email (opcional)' : 'Email (optional)'}</label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={formData.guestEmail}
                      onChange={handleChange}
                      className="input"
                      placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'Tu Voto' : 'Your Vote'} *</label>
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
                    <button
                      onClick={handleRetry}
                      className="btn btn-secondary"
                      disabled={submitting}
                    >
                      {language === 'es' ? 'Volver' : 'Back'}
                    </button>
                    <button
                      type="button"
                      onClick={handleGuestVote}
                      className="btn btn-primary btn-large"
                      disabled={submitting || !formData.option}
                    >
                      {submitting
                        ? language === 'es'
                          ? 'Registrando...'
                          : 'Registering...'
                        : language === 'es'
                        ? 'Confirmar Voto'
                        : 'Confirm Vote'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicVoting;
