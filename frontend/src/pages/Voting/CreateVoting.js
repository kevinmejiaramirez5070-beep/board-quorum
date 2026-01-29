import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { votingService } from '../../services/votingService';
import './CreateVoting.css';

const CreateVoting = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'simple',
    status: 'pending',
    options: [] // Para múltiples opciones
  });
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(false);
  const [votingLink, setVotingLink] = useState(null);
  const [showLink, setShowLink] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Si cambia a simple, limpiar opciones múltiples
    if (name === 'type' && value === 'simple') {
      setFormData(prev => ({ ...prev, options: [] }));
    }
  };

  const handleAddOption = () => {
    if (newOption.trim() && formData.options.length < 10) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await votingService.create(meetingId, formData);
      const votingId = response.data?.id || response.data;
      
      if (votingId) {
        // Generar el link público de votación
        const link = `${window.location.origin}/public/voting/${votingId}`;
        setVotingLink(link);
        setShowLink(true);
        
        // Mostrar alert con el link
        const message = language === 'es' 
          ? `Votación creada exitosamente.\n\nLink de Votación:\n${link}\n\nComparte este link en la reunión de Google Meet para que los participantes puedan votar.`
          : `Voting created successfully.\n\nVoting Link:\n${link}\n\nShare this link in the Google Meet meeting so participants can vote.`;
        alert(message);
      }
      
      // No navegar automáticamente, dejar que el usuario vea el link
      // navigate(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Error creating voting:', error);
      const errorMessage = error.response?.data?.message || error.message || (language === 'es' ? 'Error al crear la votación' : 'Error creating voting');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-voting">
      <div className="container">
        <button onClick={() => navigate(`/meetings/${meetingId}`)} className="btn-back">
          ← {language === 'es' ? 'Volver a Reunión' : 'Back to Meeting'}
        </button>

        <div className="form-header">
          <h1>{language === 'es' ? 'Nueva Votación' : 'New Voting'}</h1>
        </div>

        {showLink && votingLink && (
          <div className="link-success-card">
            <div className="link-success-header">
              <span className="link-success-icon">✅</span>
              <h3>{language === 'es' ? 'Votación Creada Exitosamente' : 'Voting Created Successfully'}</h3>
            </div>
            <div className="link-success-content">
              <p className="link-label">{language === 'es' ? 'Link de Votación:' : 'Voting Link:'}</p>
              <div className="link-display">
                <input 
                  type="text" 
                  value={votingLink} 
                  readOnly 
                  className="link-input"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(votingLink);
                    alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                  }}
                  className="link-copy-btn"
                  title={language === 'es' ? 'Copiar link' : 'Copy link'}
                >
                  📋
                </button>
                <a 
                  href={votingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-open-btn"
                >
                  {language === 'es' ? 'Abrir' : 'Open'} →
                </a>
              </div>
              <p className="link-help">
                {language === 'es' 
                  ? 'Comparte este link en la reunión de Google Meet para que los participantes puedan votar.'
                  : 'Share this link in the Google Meet meeting so participants can vote.'}
              </p>
            </div>
            <div className="link-success-actions">
              <button 
                onClick={() => navigate(`/meetings/${meetingId}`)}
                className="btn btn-primary"
              >
                {language === 'es' ? 'Volver a Reunión' : 'Back to Meeting'}
              </button>
              <button 
                onClick={() => {
                  setShowLink(false);
                  setFormData({ title: '', description: '', type: 'simple', status: 'pending', options: [] });
                  setNewOption('');
                }}
                className="btn btn-secondary"
              >
                {language === 'es' ? 'Crear Otra Votación' : 'Create Another Voting'}
              </button>
            </div>
          </div>
        )}

        {!showLink && (
          <form onSubmit={handleSubmit} className="voting-form">
            <div className="form-group">
              <label className="label">{language === 'es' ? 'Título de la Votación' : 'Voting Title'} *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input"
                required
                placeholder={language === 'es' ? 'Ej: Aprobación del presupuesto 2025' : 'Ex: Approval of 2025 budget'}
              />
            </div>

            {formData.type === 'multiple' && (
              <div className="form-group">
                <label className="label">{language === 'es' ? 'Opciones de Votación' : 'Voting Options'} *</label>
                <div className="options-input-group">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    className="input"
                    placeholder={language === 'es' ? 'Escribe una opción y presiona Enter o el botón +' : 'Type an option and press Enter or the + button'}
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="btn btn-secondary btn-add-option"
                    disabled={!newOption.trim() || formData.options.length >= 10}
                  >
                    +
                  </button>
                </div>
                {formData.options.length > 0 && (
                  <div className="options-list">
                    {formData.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <span>{option}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="btn-remove-option"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.options.length === 0 && (
                  <p className="form-hint" style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>
                    {language === 'es' ? 'Debes agregar al menos una opción' : 'You must add at least one option'}
                  </p>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="label">{language === 'es' ? 'Tipo de Votación' : 'Voting Type'}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                <option value="simple">{language === 'es' ? 'Simple (Sí/No/Abstención)' : 'Simple (Yes/No/Abstention)'}</option>
                <option value="multiple">{language === 'es' ? 'Múltiple opciones' : 'Multiple options'}</option>
                <option value="weighted">{language === 'es' ? 'Ponderada' : 'Weighted'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">{language === 'es' ? 'Descripción' : 'Description'}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input textarea"
                rows="6"
                placeholder={language === 'es' ? 'Descripción detallada de la votación, contexto, opciones disponibles...' : 'Detailed description of the vote, context, available options...'}
              />
            </div>

            <div className="form-info">
              <p>ℹ️ {language === 'es' 
                ? 'La votación se creará en estado "Pendiente". Podrás activarla desde el detalle de la reunión.'
                : 'The vote will be created in "Pending" status. You can activate it from the meeting details.'}
              </p>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || (formData.type === 'multiple' && formData.options.length === 0)}
              >
                {loading 
                  ? (language === 'es' ? 'Creando...' : 'Creating...')
                  : (language === 'es' ? 'Crear Votación' : 'Create Voting')
                }
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate(`/meetings/${meetingId}`)}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateVoting;
