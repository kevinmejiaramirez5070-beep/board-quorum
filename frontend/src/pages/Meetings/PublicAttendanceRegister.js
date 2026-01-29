import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import Logo from '../../components/Logo/Logo';
import './PublicAttendanceRegister.css';

const PublicAttendanceRegister = () => {
  const { meetingId } = useParams();
  const { t, language } = useLanguage();
  const [meeting, setMeeting] = useState(null);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    member_id: '',
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    loadData();
  }, [meetingId]);

  const loadData = async () => {
    try {
      // Usar endpoints públicos (sin autenticación)
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const [meetingRes, membersRes] = await Promise.all([
        axios.get(`${baseURL}/meetings/public/${meetingId}`),
        axios.get(`${baseURL}/members/public/meeting/${meetingId}`)
      ]);
      setMeeting(meetingRes.data);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(t('errorLoadingMeeting') || (language === 'es' ? 'Error al cargar la información de la reunión' : 'Error loading meeting information'));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Si seleccionó un miembro existente, usar su ID
      let memberId = formData.member_id;
      
      // Si no seleccionó un miembro pero ingresó nombre/email, buscar o crear
      if (!memberId && formData.name) {
        // Buscar miembro por nombre o email
        const foundMember = members.find(m => 
          m.name.toLowerCase() === formData.name.toLowerCase() || 
          m.email?.toLowerCase() === formData.email.toLowerCase()
        );
        
        if (foundMember) {
          memberId = foundMember.id;
        } else {
          alert(t('memberNotFoundHelp') || (language === 'es' ? 'Por favor selecciona un miembro de la lista o verifica que el nombre/email coincida con un miembro registrado.' : 'Please select a member from the list or verify that the name/email matches a registered member.'));
          setSubmitting(false);
          return;
        }
      }

      if (!memberId) {
        alert(t('selectMember') || (language === 'es' ? 'Por favor selecciona un miembro' : 'Please select a member'));
        setSubmitting(false);
        return;
      }

      // Llamar al endpoint público directamente
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${baseURL}/attendance/public/meeting/${meetingId}`, {
        member_id: parseInt(memberId),
        status: 'present'
      });
      
      setRegistered(true);
      setTimeout(() => {
        if (meeting?.google_meet_link) {
          window.open(meeting.google_meet_link, '_blank');
        }
      }, 2000);
    } catch (error) {
      console.error('Error registering attendance:', error);
      const errorMessage = error.response?.data?.message || (language === 'es' ? 'Error al registrar la asistencia' : 'Error registering attendance');
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-attendance-page">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="public-attendance-page">
        <div className="error-message">{t('meetingNotFound')}</div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="public-attendance-page">
        <div className="public-attendance-container">
          <Logo size="medium" showText={true} />
          <div className="success-message">
            <h2>✓ {t('attendanceRegistered')}</h2>
            <p>{t('attendanceRegisteredSuccess')}</p>
            {meeting.google_meet_link && (
              <div style={{ marginTop: '24px' }}>
                <a 
                  href={meeting.google_meet_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-large"
                >
                  {t('joinMeeting')} →
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
        <h1>{t('attendanceRegistration')}</h1>
        <div className="meeting-info-card">
          <h2>{meeting.title}</h2>
          <p><strong>{t('dateAndTime')}:</strong> {new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}</p>
          {meeting.location && <p><strong>{t('location')}:</strong> {meeting.location}</p>}
        </div>

        <form onSubmit={handleSubmit} className="public-attendance-form">
          <div className="form-group">
            <label className="label">{t('selectMember')} *</label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleChange}
              className="input select-member"
              required
            >
              <option value="">{t('selectMemberFromList')}</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} {member.position ? `- ${member.position}` : ''}
                </option>
              ))}
            </select>
            <small className="form-help">{t('memberNotFoundHelp')}</small>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-large btn-block"
            disabled={submitting}
          >
            {submitting ? t('registering') : t('registerAttendance')}
          </button>
        </form>

        {meeting.google_meet_link && (
          <div className="meet-link-section">
            <a 
              href={meeting.google_meet_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-large btn-block"
            >
              {t('joinMeeting')} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicAttendanceRegister;



