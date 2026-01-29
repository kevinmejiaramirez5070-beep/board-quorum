import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import './PublicVoting.css';

const PublicVoting = () => {
  const { votingId } = useParams();
  const { t, language } = useLanguage();
  const [voting, setVoting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    option: ''
  });

  useEffect(() => {
    loadVotingData();
  }, [votingId]);

  const loadVotingData = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${baseURL}/votings/public/${votingId}`);
      setVoting(response.data);
    } catch (error) {
      console.error('Error loading voting data:', error);
      alert(language === 'es' ? 'Error al cargar la información de la votación' : 'Error loading voting information');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.option) {
      alert(language === 'es' ? 'Por favor selecciona una opción' : 'Please select an option');
      return;
    }
    
    setSubmitting(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${baseURL}/votes/public/${votingId}`, {
        name: formData.name,
        email: formData.email,
        option: formData.option
      });
      
      setVoted(true);
    } catch (error) {
      console.error('Error casting vote:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al registrar el voto' : 'Error casting vote');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-voting-page">
        <div className="loading">{t('loading')}</div>
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
    return (
      <div className="public-voting-page">
        <div className="container">
          <div className="voting-card">
            <Logo size="medium" showText={true} />
            <h1>{voting.title}</h1>
            <p className="status-message">
              {language === 'es' 
                ? 'Esta votación no está activa actualmente.' 
                : 'This voting is not currently active.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (voted) {
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
          
          <form onSubmit={handleSubmit} className="voting-form">
            <div className="form-group">
              <label className="label">{language === 'es' ? 'Nombre' : 'Name'} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder={language === 'es' ? 'Tu nombre completo' : 'Your full name'}
              />
            </div>

            <div className="form-group">
              <label className="label">{language === 'es' ? 'Correo Electrónico' : 'Email'}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
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

            <button 
              type="submit" 
              className="btn btn-primary btn-large btn-block"
              disabled={submitting || !formData.option}
            >
              {submitting 
                ? (language === 'es' ? 'Registrando...' : 'Registering...')
                : (language === 'es' ? 'Registrar Voto' : 'Cast Vote')
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicVoting;

