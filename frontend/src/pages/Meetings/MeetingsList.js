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
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    open: false, step: 1, meeting: null, confirmText: '', deleting: false, error: ''
  });

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

  const openDeleteModal = (e, meeting) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({ open: true, step: 1, meeting, confirmText: '', deleting: false, error: '' });
  };

  const closeDeleteModal = () => {
    if (deleteModal.deleting) return;
    setDeleteModal({ open: false, step: 1, meeting: null, confirmText: '', deleting: false, error: '' });
  };

  const handleDeleteStep = async () => {
    const { meeting, step, confirmText } = deleteModal;
    if (step === 1) {
      setDeleteModal(d => ({ ...d, step: 2, error: '' }));
      return;
    }
    if (step === 2) {
      if (confirmText.trim() !== meeting.title.trim()) {
        setDeleteModal(d => ({ ...d, error: language === 'es' ? 'El título no coincide. Escríbelo exactamente.' : 'Title does not match. Type it exactly.' }));
        return;
      }
      setDeleteModal(d => ({ ...d, step: 3, error: '' }));
      return;
    }
    // Paso 3: ejecutar borrado
    setDeleteModal(d => ({ ...d, deleting: true, error: '' }));
    try {
      await meetingService.delete(meeting.id);
      setMeetings(prev => prev.filter(m => m.id !== meeting.id));
      setDeleteModal({ open: false, step: 1, meeting: null, confirmText: '', deleting: false, error: '' });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || t('errorDeletingMeeting');
      setDeleteModal(d => ({ ...d, deleting: false, error: msg }));
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

  // Orden: activa primero, luego por fecha descendente
  const statusPriority = { active: 0, scheduled: 1, completed: 2, archived: 3 };
  const sortedMeetings = [...meetings].sort((a, b) => {
    const pA = statusPriority[a.status] ?? 4;
    const pB = statusPriority[b.status] ?? 4;
    if (pA !== pB) return pA - pB;
    return new Date(b.date) - new Date(a.date);
  });
  const byStatus = statusFilter === 'all'
    ? sortedMeetings
    : sortedMeetings.filter(m => m.status === statusFilter);

  const q = searchText.trim().toLowerCase();
  const filteredMeetings = q
    ? byStatus.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q) ||
        (m.type || '').toLowerCase().includes(q)
      )
    : byStatus;

  const filterLabels = {
    all: language === 'es' ? 'Todas' : 'All',
    active: language === 'es' ? 'En curso' : 'In Progress',
    scheduled: language === 'es' ? 'Programada' : 'Scheduled',
    completed: language === 'es' ? 'Finalizada' : 'Completed',
    archived: language === 'es' ? 'Archivada' : 'Archived',
  };

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

        {/* Buscador */}
        {meetings.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder={language === 'es' ? 'Buscar reunión por título, lugar o tipo...' : 'Search meeting by title, location or type...'}
              style={{
                width: '100%', padding: '9px 14px', borderRadius: '8px', fontSize: '14px',
                border: '1.5px solid var(--border, rgba(255,255,255,0.12))',
                background: 'var(--bg-input, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Filtros por estado */}
        {meetings.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {Object.entries(filterLabels).map(([key, label]) => {
              const count = key === 'all' ? meetings.length : meetings.filter(m => m.status === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                    border: statusFilter === key ? '2px solid var(--primary, #6366f1)' : '1.5px solid var(--border, rgba(255,255,255,0.12))',
                    background: statusFilter === key ? 'var(--primary, #6366f1)' : 'transparent',
                    color: statusFilter === key ? '#fff' : 'var(--text-secondary, #94a3b8)',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {label} {count > 0 && <span style={{ opacity: 0.75 }}>({count})</span>}
                </button>
              );
            })}
          </div>
        )}

        {meetings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h2>{t('noMeetings')}</h2>
              <p>{t('createFirstMeeting')}</p>
              {(user?.role === 'admin' || user?.role === 'admin_master') && (
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
            {filteredMeetings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary, #94a3b8)', fontSize: '14px' }}>
                {q
                  ? (language === 'es' ? `Sin resultados para "${searchText}".` : `No results for "${searchText}".`)
                  : (language === 'es' ? 'No hay reuniones con ese estado.' : 'No meetings with that status.')}
              </div>
            )}
            <div className="meetings-grid">
              {filteredMeetings.map(meeting => (
                <div key={meeting.id} className={`meeting-card${meeting.status === 'active' ? ' meeting-card--active' : ''}`}>
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
                          onClick={(e) => openDeleteModal(e, meeting)}
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

      {/* Modal de borrado multi-paso */}
      {deleteModal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-card, #1e293b)', borderRadius: '12px',
            padding: '36px 32px', maxWidth: '460px', width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            border: '1.5px solid rgba(239,68,68,0.3)'
          }}>
            {/* Indicador de pasos */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
              {[1,2,3].map(s => (
                <div key={s} style={{
                  flex: 1, height: '4px', borderRadius: '2px',
                  background: deleteModal.step >= s ? '#ef4444' : 'rgba(255,255,255,0.1)'
                }} />
              ))}
            </div>

            {deleteModal.step === 1 && (
              <>
                <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ color: '#f87171', margin: '0 0 8px', textAlign: 'center', fontSize: '18px' }}>
                  {language === 'es' ? 'Eliminar reunión' : 'Delete meeting'}
                </h3>
                <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', textAlign: 'center', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {language === 'es' ? 'Estás a punto de eliminar:' : 'You are about to delete:'}
                </p>
                <p style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 700, textAlign: 'center', margin: '0 0 16px', fontSize: '15px' }}>
                  "{deleteModal.meeting?.title}"
                </p>
                <p style={{ color: '#fbbf24', fontSize: '13px', textAlign: 'center', margin: '0 0 24px' }}>
                  {language === 'es'
                    ? 'Se eliminarán también las asistencias, votaciones y votos asociados. Esta acción no tiene marcha atrás.'
                    : 'Attendance, votings and votes will also be deleted. This action cannot be undone.'}
                </p>
              </>
            )}

            {deleteModal.step === 2 && (
              <>
                <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ color: '#f87171', margin: '0 0 12px', textAlign: 'center', fontSize: '18px' }}>
                  {language === 'es' ? 'Confirma escribiendo el título' : 'Confirm by typing the title'}
                </h3>
                <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', textAlign: 'center', margin: '0 0 16px' }}>
                  {language === 'es' ? 'Escribe exactamente:' : 'Type exactly:'}{' '}
                  <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{deleteModal.meeting?.title}</strong>
                </p>
                <input
                  type="text"
                  autoFocus
                  value={deleteModal.confirmText}
                  onChange={e => setDeleteModal(d => ({ ...d, confirmText: e.target.value, error: '' }))}
                  placeholder={deleteModal.meeting?.title}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '14px',
                    border: deleteModal.error ? '1.5px solid #ef4444' : '1.5px solid var(--border, rgba(255,255,255,0.15))',
                    background: 'var(--bg-input, rgba(255,255,255,0.05))',
                    color: 'var(--text-primary, #f1f5f9)', outline: 'none', boxSizing: 'border-box',
                    marginBottom: '8px'
                  }}
                />
              </>
            )}

            {deleteModal.step === 3 && (
              <>
                <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '12px' }}>🗑️</div>
                <h3 style={{ color: '#ef4444', margin: '0 0 12px', textAlign: 'center', fontSize: '18px' }}>
                  {language === 'es' ? 'Último paso — eliminación definitiva' : 'Final step — permanent deletion'}
                </h3>
                <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.5 }}>
                  {language === 'es'
                    ? '¿Confirmas que deseas eliminar esta reunión permanentemente? No podrás recuperarla.'
                    : 'Do you confirm you want to permanently delete this meeting? You cannot recover it.'}
                </p>
              </>
            )}

            {deleteModal.error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
                {deleteModal.error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={closeDeleteModal}
                disabled={deleteModal.deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px',
                  background: 'transparent', color: 'var(--text-secondary, #94a3b8)',
                  border: '1.5px solid var(--border, rgba(255,255,255,0.12))', cursor: 'pointer'
                }}
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteStep}
                disabled={deleteModal.deleting || (deleteModal.step === 2 && !deleteModal.confirmText.trim())}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                  background: deleteModal.step === 3 ? '#dc2626' : '#ef4444',
                  color: '#fff', border: 'none',
                  cursor: deleteModal.deleting || (deleteModal.step === 2 && !deleteModal.confirmText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: deleteModal.deleting ? 0.7 : 1
                }}
              >
                {deleteModal.deleting
                  ? (language === 'es' ? 'Eliminando...' : 'Deleting...')
                  : deleteModal.step === 3
                    ? (language === 'es' ? 'Eliminar definitivamente' : 'Delete permanently')
                    : (language === 'es' ? 'Continuar' : 'Continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList;

