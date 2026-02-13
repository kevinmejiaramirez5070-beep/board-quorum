import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { meetingService } from '../../services/meetingService';
import { joinRequestService } from '../../services/joinRequestService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './MeetingsList.css';

const MeetingsList = () => {
  const { productId } = useParams();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [requestStatuses, setRequestStatuses] = useState({});

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    loadMeetings();
  }, [productId]);

  useEffect(() => {
    if (user?.role === 'member' && meetings.length > 0) {
      loadRequestStatuses();
    }
  }, [meetings, user]);

  const loadRequestStatuses = async () => {
    const statuses = {};
    for (const meeting of meetings) {
      try {
        const response = await joinRequestService.checkUserRequest(meeting.id);
        statuses[meeting.id] = response.data.status; // 'pending', 'accepted', 'rejected', 'none'
      } catch (error) {
        statuses[meeting.id] = 'none';
      }
    }
    setRequestStatuses(statuses);
  };

  const loadProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const loadMeetings = async () => {
    try {
      let response;
      if (productId) {
        // Filtrar por producto
        response = await api.get(`/meetings?product_id=${productId}`);
      } else {
        // Cargar todas las reuniones (compatibilidad hacia atrás)
        response = await meetingService.getAll();
      }
      setMeetings(response.data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, meetingId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(t('confirmDelete'))) {
      try {
        const response = await meetingService.delete(meetingId);
        // Actualizar la lista removiendo la reunión eliminada
        setMeetings(meetings.filter(m => m.id !== meetingId));
        // Mostrar mensaje de éxito
        alert('✅ ' + t('meetingDeleted'));
      } catch (error) {
        console.error('Error deleting meeting:', error);
        console.error('Error response:', error.response);
        const errorMessage = error.response?.data?.message || error.message || t('errorDeletingMeeting');
        alert('❌ ' + errorMessage);
      }
    }
  };

  const handleEdit = (e, meetingId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/meetings/${meetingId}/edit`);
  };

  const handleJoinRequest = async (e, meetingId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm(t('confirmJoinRequest') || '¿Deseas solicitar unirte a esta reunión? El administrador revisará tu solicitud.')) {
      return;
    }

    try {
      await joinRequestService.requestToJoin(meetingId);
      setRequestStatuses({ ...requestStatuses, [meetingId]: 'pending' });
      alert(t('joinRequestSent') || '✅ Solicitud enviada. El administrador la revisará.');
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('errorSendingRequest') || 'Error al enviar la solicitud';
      alert('❌ ' + errorMessage);
    }
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="meetings-list">
      <div className="container" style={{ paddingLeft: '0' }}>
        <div className="page-header" style={{ paddingLeft: '0', marginLeft: '0' }}>
          <div className="header-content" style={{ paddingLeft: '0', marginLeft: '0' }}>
            {product ? (
              <>
                <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>{product.name}</h1>
                <p className="page-subtitle">
                  {language === 'es' ? 'Gestiona las reuniones de este órgano' : 'Manage meetings for this body'}
                </p>
              </>
            ) : (
              <p className="page-subtitle">{t('manageMeetings')}</p>
            )}
          </div>
          {(user?.role === 'admin' || user?.role === 'admin_master') && (
            <Link 
              to={productId ? `/products/${productId}/meetings/new` : '/meetings/new'} 
              className="btn btn-primary"
            >
              <span style={{ fontSize: '18px' }}>+</span> {product ? (language === 'es' ? 'Nueva Reunión' : 'New Meeting') : t('newMeeting')}
            </Link>
          )}
        </div>

        {meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>{t('noMeetings')}</h2>
              <p>{t('createFirstMeeting')}</p>
              {user?.role === 'admin' && (
                <Link to="/meetings/new" className="btn btn-primary btn-large">
                  {t('createFirstMeetingBtn')}
                </Link>
              )}
            </div>
        ) : (
          <>
            <div className="meetings-stats">
              <div className="stat-item">
                <span className="stat-number">{meetings.length}</span>
                <span className="stat-label">{t('totalMeetings')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {meetings.filter(m => m.status === 'active').length}
                </span>
                <span className="stat-label">{t('active')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {meetings.filter(m => m.status === 'completed').length}
                </span>
                <span className="stat-label">{t('completed')}</span>
              </div>
            </div>
            <div className="meetings-grid">
              {meetings.map(meeting => (
                <div key={meeting.id} className="meeting-card">
                  <div className="meeting-card-header">
                    <h3>{meeting.title}</h3>
                    <span className={`status status-${meeting.status}`}>
                      {meeting.status === 'scheduled' ? t('scheduled') : 
                       meeting.status === 'active' ? t('activeStatus') : 
                       meeting.status === 'completed' ? t('completedStatus') : meeting.status}
                    </span>
                  </div>
                  <div className="meeting-card-body">
                    <div className="meeting-info-item">
                      <span className="info-icon">📅</span>
                      <span className="date">
                        {new Date(meeting.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {meeting.location && (
                      <div className="meeting-info-item">
                        <span className="info-icon">📍</span>
                        <span>{meeting.location}</span>
                      </div>
                    )}
                    {meeting.type && (
                      <div className="meeting-info-item">
                        <span className="info-icon">🏢</span>
                        <span>
                          {meeting.type === 'junta_directiva' ? t('boardMeeting') :
                           meeting.type === 'asamblea' ? t('assembly') :
                           meeting.type === 'comite' ? t('committee') :
                           meeting.type === 'consejo' ? t('council') : meeting.type}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="meeting-card-footer">
                    {(user?.role === 'admin' || user?.role === 'admin_master') && (
                      <div className="meeting-card-actions">
                        <button
                          onClick={(e) => handleEdit(e, meeting.id)}
                          className="btn-action btn-edit"
                          title={t('editMeetingTitle')}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, meeting.id)}
                          className="btn-action btn-delete"
                          title={t('deleteMeetingTitle')}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                    <div className="meeting-card-footer-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {user?.role === 'member' && requestStatuses[meeting.id] !== 'pending' && requestStatuses[meeting.id] !== 'accepted' && (
                        <button
                          onClick={(e) => handleJoinRequest(e, meeting.id)}
                          className="btn btn-primary btn-small"
                        >
                          {t('joinMeeting') || 'Unirse'}
                        </button>
                      )}
                      {user?.role === 'member' && requestStatuses[meeting.id] === 'pending' && (
                        <span className="request-status pending" style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '500' }}>
                          {t('requestPending') || 'Solicitud pendiente'}
                        </span>
                      )}
                      {user?.role === 'member' && requestStatuses[meeting.id] === 'accepted' && (
                        <span className="request-status accepted" style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                          {t('requestAccepted') || '✓ Aceptado'}
                        </span>
                      )}
                      <Link to={`/meetings/${meeting.id}`} className="view-link">
                        {t('viewDetails')} →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MeetingsList;

