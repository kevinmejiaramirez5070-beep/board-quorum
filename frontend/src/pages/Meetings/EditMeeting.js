import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import './CreateMeeting.css';

const EditMeeting = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    google_meet_link: '',
    type: 'junta_directiva',
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    try {
      const response = await meetingService.getById(id);
      const meeting = response.data;
      
      // Formatear la fecha para el input datetime-local
      const date = new Date(meeting.date);
      const formattedDate = date.toISOString().slice(0, 16);
      
      setFormData({
        title: meeting.title || '',
        description: meeting.description || '',
        date: formattedDate,
        location: meeting.location || '',
        google_meet_link: meeting.google_meet_link || '',
        type: meeting.type || 'junta_directiva',
        status: meeting.status || 'scheduled'
      });
    } catch (error) {
      console.error('Error loading meeting:', error);
      alert(language === 'es' ? 'Error al cargar la reunión' : 'Error loading meeting');
      navigate('/meetings');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await meetingService.update(id, formData);
      navigate(`/meetings/${id}`);
    } catch (error) {
      console.error('Error updating meeting:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al actualizar la reunión' : 'Error updating meeting');
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div className="create-meeting">
      <div className="container">
        <div className="form-header">
          <h1>{language === 'es' ? 'Editar Reunión' : 'Edit Meeting'}</h1>
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
            <label className="label">{language === 'es' ? 'Fecha y Hora' : 'Date and Time'} *</label>
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
            <input
              type="url"
              name="google_meet_link"
              value={formData.google_meet_link}
              onChange={handleChange}
              className="input"
              placeholder={language === 'es' ? 'https://meet.google.com/xxx-xxxx-xxx' : 'https://meet.google.com/xxx-xxxx-xxx'}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {language === 'es' 
                ? 'Las reuniones se realizan en Google Meet. Comparte este enlace con los participantes.'
                : 'Meetings are held in Google Meet. Share this link with participants.'
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
              {loading 
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')
              }
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

export default EditMeeting;






