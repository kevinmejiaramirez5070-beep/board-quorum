import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { meetingService } from '../../services/meetingService';
import './CreateMeeting.css';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'junta_directiva',
    status: 'scheduled',
    google_meet_link: ''
  });
  const [loading, setLoading] = useState(false);
  const [meetLinkGenerated, setMeetLinkGenerated] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateMeetLink = () => {
    // Abrir Google Meet en una nueva pestaña para que el usuario cree la reunión
    window.open('https://meet.google.com/new', '_blank');
    setMeetLinkGenerated(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await meetingService.create(formData);
      console.log('Meeting creation response:', response);
      console.log('Response data:', response.data);
      
      // Extraer el ID correctamente
      let meetingId = null;
      if (response.data) {
        if (typeof response.data === 'object' && response.data.id) {
          meetingId = response.data.id;
        } else if (typeof response.data === 'number') {
          meetingId = response.data;
        } else if (response.data.id !== undefined) {
          meetingId = response.data.id;
        }
      }
      
      if (!meetingId) {
        console.error('No se pudo extraer el ID de la reunión:', response);
        throw new Error('No se recibió el ID de la reunión creada');
      }
      
      console.log('Navegando a reunión con ID:', meetingId);
      navigate(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(t('errorCreatingMeeting'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-meeting">
      <div className="container">
        <div className="form-header">
          <h1>{t('newMeetingTitle')}</h1>
          <button onClick={() => navigate('/meetings')} className="btn btn-secondary">
            {t('cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label className="label">{language === 'es' ? 'Título de la Reunión' : 'Meeting Title'} *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
              placeholder={language === 'es' ? 'Ej: Junta Directiva - Enero 2025' : 'Ex: Board Meeting - January 2025'}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('date')} *</label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('location')}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder={language === 'es' ? 'Ej: Sala de juntas, Virtual, etc.' : 'Ex: Meeting room, Virtual, etc.'}
            />
          </div>

          <div className="form-group">
            <label className="label">{language === 'es' ? 'Enlace de Google Meet' : 'Google Meet Link'}</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <input
                type="url"
                name="google_meet_link"
                value={formData.google_meet_link}
                onChange={handleChange}
                className="input"
                placeholder={language === 'es' ? 'https://meet.google.com/xxx-xxxx-xxx' : 'https://meet.google.com/xxx-xxxx-xxx'}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={generateMeetLink}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                {language === 'es' ? 'Crear en Google Meet' : 'Create in Google Meet'}
              </button>
            </div>
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {language === 'es' 
                ? 'Crea una reunión en Google Meet y pega el enlace aquí. Las reuniones se realizarán en Google Meet.'
                : 'Create a meeting in Google Meet and paste the link here. Meetings will be held in Google Meet.'
              }
            </small>
          </div>

          <div className="form-group">
            <label className="label">{t('meetingType')}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="junta_directiva">{t('boardMeeting')}</option>
              <option value="asamblea">{t('assembly')}</option>
              <option value="comite">{t('committee')}</option>
              <option value="consejo">{t('council')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">{t('description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input textarea"
              rows="5"
              placeholder={language === 'es' ? 'Descripción de la reunión, agenda, temas a tratar...' : 'Meeting description, agenda, topics to discuss...'}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('creating') : t('createMeeting')}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/meetings')}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeeting;

