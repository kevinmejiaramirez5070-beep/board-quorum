import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { meetingService } from '../../services/meetingService';
import { attendanceService } from '../../services/attendanceService';
import { votingService } from '../../services/votingService';
import './MeetingDetail.css';

const MeetingDetail = () => {
  const { id, meetingId } = useParams();
  const meetingIdParam = meetingId || id;
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [meeting, setMeeting] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [votings, setVotings] = useState([]);
  const [quorum, setQuorum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [votingLink, setVotingLink] = useState(null);
  const [attendanceLink, setAttendanceLink] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const getStatusLabel = (status) => {
    const labels = {
      es: {
        scheduled: 'Programada',
        active: 'Activa',
        completed: 'Completada'
      },
      en: {
        scheduled: 'Scheduled',
        active: 'Active',
        completed: 'Completed'
      }
    };
    return labels[language]?.[status] || status;
  };

  useEffect(() => {
    loadMeetingData();
  }, [meetingIdParam]);

  const loadMeetingData = async () => {
    try {
      // Cargar datos principales primero
      const [meetingRes, attendanceRes, votingsRes] = await Promise.all([
        meetingService.getById(meetingIdParam),
        attendanceService.getByMeeting(meetingIdParam),
        votingService.getByMeeting(meetingIdParam)
      ]);
      
      setMeeting(meetingRes.data);
      setAttendance(attendanceRes.data);
      
      // Generar el link de asistencia automáticamente
      const attendanceLink = `${window.location.origin}/public/meeting/${meetingIdParam}/attendance`;
      setAttendanceLink(attendanceLink);
      
      // Asegurar que votings sea un array
      const votingsData = Array.isArray(votingsRes.data) ? votingsRes.data : [];
      setVotings(votingsData);
      
      // Si hay votaciones, generar el link
      if (votingsData.length > 0 && votingsData[0].id) {
        const link = `${window.location.origin}/public/voting/${votingsData[0].id}`;
        setVotingLink(link);
      } else {
        setVotingLink(null);
      }
      
      // Debug: verificar votaciones cargadas
      console.log('Votaciones cargadas:', votingsData);
      console.log('Número de votaciones:', votingsData.length);
      if (votingsData.length > 0) {
        console.log('Primera votación:', votingsData[0]);
        console.log('Link de votaciones generado:', `${window.location.origin}/public/voting/${votingsData[0].id}`);
      } else {
        console.warn('No se encontraron votaciones para esta reunión');
      }
      
      // Intentar cargar quorum, pero no fallar si hay error
      try {
        const quorumRes = await meetingService.getQuorum(meetingIdParam);
        setQuorum(quorumRes.data);
      } catch (quorumError) {
        console.warn('Error loading quorum (non-critical):', quorumError);
        setQuorum(null);
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVoting = async (votingId) => {
    try {
      setErrorMessage(null);
      await votingService.activate(votingId);
      loadMeetingData();
    } catch (error) {
      console.error('Error activating voting:', error);
      // Mostrar el mensaje específico del backend si está disponible
      const errorMsg = error.response?.data?.message || t('errorActivatingVoting');
      setErrorMessage(errorMsg);
    }
  };

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (!meeting) return <div className="error">{t('meetingNotFound')}</div>;

  return (
    <div className="meeting-detail">
      {errorMessage && (
        <div className="error-modal-overlay" onClick={() => setErrorMessage(null)}>
          <div className="error-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="error-card-header">
              <span className="error-icon">⚠️</span>
              <h3>{language === 'es' ? 'Error al Activar Votación' : 'Error Activating Voting'}</h3>
            </div>
            <div className="error-card-body">
              <p>{errorMessage}</p>
            </div>
            <div className="error-card-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setErrorMessage(null)}
              >
                {language === 'es' ? 'Aceptar' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <button onClick={() => navigate('/meetings')} className="btn-back">
          ← {t('backToMeetings')}
        </button>

        <div className="meeting-header">
          <h1>{meeting.title}</h1>
          <span className={`status status-${meeting.status}`}>{getStatusLabel(meeting.status)}</span>
        </div>

        <div className="meeting-info">
          <div className="info-item">
            <strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
          </div>
          {meeting.location && (
            <div className="info-item">
              <strong>{language === 'es' ? 'Ubicación:' : 'Location:'}</strong> {meeting.location}
            </div>
          )}
          {meeting.description && (
            <div className="info-item">
              <strong>{language === 'es' ? 'Descripción:' : 'Description:'}</strong> {meeting.description}
            </div>
          )}
        </div>

        {/* Sección de Links Importantes */}
        {(meeting.google_meet_link || votingLink || attendanceLink) && (
          <div className="links-section">
            <h3 style={{ marginBottom: '16px', fontSize: '20px', color: 'var(--text-primary)' }}>
              {language === 'es' ? 'Links Importantes' : 'Important Links'}
            </h3>
            <div className="links-grid">
              {meeting.google_meet_link && (
                <div className="link-card">
                  <div className="link-icon">📹</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Google Meet' : 'Google Meet'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Link para unirse a la reunión en Google Meet'
                        : 'Link to join the meeting in Google Meet'}
                    </p>
                    <a 
                      href={meeting.google_meet_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Unirse a Google Meet' : 'Join Google Meet'} →
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(meeting.google_meet_link);
                        alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                      }}
                      className="link-copy-btn"
                      title={language === 'es' ? 'Copiar link' : 'Copy link'}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
              
              {attendanceLink && (
                <div className="link-card">
                  <div className="link-icon">✅</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Link de Asistencia' : 'Attendance Link'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Comparte este link para que los participantes registren su asistencia'
                        : 'Share this link so participants can register their attendance'}
                    </p>
                    <a 
                      href={attendanceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Ver Link de Asistencia' : 'View Attendance Link'} →
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(attendanceLink);
                        alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                      }}
                      className="link-copy-btn"
                      title={language === 'es' ? 'Copiar link' : 'Copy link'}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
              
              {votingLink && (
                <div className="link-card">
                  <div className="link-icon">🗳️</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Link de Votaciones' : 'Voting Link'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Comparte este link para que los participantes puedan votar'
                        : 'Share this link so participants can vote'}
                    </p>
                    <a 
                      href={votingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Ver Link de Votaciones' : 'View Voting Link'} →
                    </a>
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {quorum && (
          <div className={`quorum-card ${quorum.met ? 'quorum-met' : 'quorum-not-met'}`}>
            <h3>{t('quorum')}</h3>
            <div className="quorum-stats">
              <div className="stat">
                <span className="stat-value">{quorum.present}</span>
                <span className="stat-label">{language === 'es' ? 'Presentes' : 'Present'}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{quorum.total}</span>
                <span className="stat-label">{language === 'es' ? 'Total' : 'Total'}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{quorum.percentage}%</span>
                <span className="stat-label">{language === 'es' ? 'Porcentaje' : 'Percentage'}</span>
              </div>
            </div>
            <div className={`quorum-status ${quorum.met ? 'met' : 'not-met'}`}>
              {quorum.met 
                ? (language === 'es' ? '✓ Quórum alcanzado' : '✓ Quorum reached')
                : (language === 'es' ? '✗ Quórum no alcanzado' : '✗ Quorum not reached')
              }
            </div>
          </div>
        )}

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            {t('attendance')} ({attendance.length})
          </button>
          <button 
            className={`tab ${activeTab === 'votings' ? 'active' : ''}`}
            onClick={() => setActiveTab('votings')}
          >
            {t('votings')} ({votings.length})
          </button>
        </div>

        <div className="tab-content">
              {activeTab === 'attendance' && (
            <div className="attendance-section">
              <div className="section-header">
                <h2>{language === 'es' ? 'Lista de Asistencia' : 'Attendance List'}</h2>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate(`/meetings/${id}/attendance/register`)}
                >
                  {t('registerAttendance')}
                </button>
              </div>
              {attendance.length === 0 ? (
                <p className="empty">{language === 'es' ? 'No hay registros de asistencia' : 'No attendance records'}</p>
              ) : (
                <div className="attendance-list">
                  {attendance.map((item) => (
                    <div key={item.id} className="attendance-item">
                      <div className="member-info">
                        <strong>{item.member_name}</strong>
                        <span className="role">{item.role}</span>
                      </div>
                      <span className={`attendance-status status-${item.status}`}>
                        {item.status === 'present' 
                          ? (language === 'es' ? '✓ Presente' : '✓ Present')
                          : item.status
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'votings' && (
            <div className="votings-section">
              <div className="section-header">
                <h2>{t('votings')}</h2>
                <button className="btn btn-primary" onClick={() => navigate(`/meetings/${meetingId || id}/votings/new`)}>
                  {t('newVoting')}
                </button>
              </div>
              {votings.length === 0 ? (
                <p className="empty">{language === 'es' ? 'No hay votaciones registradas' : 'No votings registered'}</p>
              ) : (
                <div className="votings-list">
                  {votings.map((voting) => (
                    <div key={voting.id} className="voting-card">
                      <div className="voting-header">
                        <h3>{voting.title}</h3>
                        <span className={`voting-status status-${voting.status}`}>
                          {voting.status === 'pending' 
                            ? (language === 'es' ? 'Pendiente' : 'Pending')
                            : voting.status === 'active'
                            ? (language === 'es' ? 'Activa' : 'Active')
                            : voting.status === 'completed'
                            ? (language === 'es' ? 'Completada' : 'Completed')
                            : voting.status
                          }
                        </span>
                      </div>
                      {voting.description && <p>{voting.description}</p>}
                      <div className="voting-actions">
                        {voting.status === 'pending' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleActivateVoting(voting.id)}
                          >
                            {t('activate')}
                          </button>
                        )}
                        {voting.status === 'active' && (
                          <button 
                            className="btn btn-secondary"
                            onClick={() => navigate(`/meetings/${id}/voting/${voting.id}`)}
                          >
                            {language === 'es' ? 'Ver Votación' : 'View Voting'}
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary"
                          onClick={() => navigate(`/meetings/${id}/voting/${voting.id}/results`)}
                        >
                          {t('viewResults')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingDetail;

