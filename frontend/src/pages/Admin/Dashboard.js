import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { meetingService } from '../../services/meetingService';
import { memberService } from '../../services/memberService';
import { clientService } from '../../services/clientService';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [platformStats, setPlatformStats] = useState({
    activeClients: 0,
    activeMeetings: 0,
    totalUsers: 0
  });
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    activeMeetings: 0,
    completedMeetings: 0,
    upcomingMeetings: 0,
    totalMembers: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Determinar si es admin master
  const isAdminMaster = user?.role === 'admin_master';

  useEffect(() => {
    if (user) {
      // Admin Master debe ir directamente a organizaciones
      if (isAdminMaster) {
        navigate('/admin/organizations', { replace: true });
        return;
      }
      loadDashboardData();
    }
  }, [user?.role, isAdminMaster, navigate]);

  const loadDashboardData = async () => {
    try {
      if (isAdminMaster) {
        // Admin Master: cargar estadísticas de plataforma y reuniones activas
        const [platformStatsResponse, activeMeetingsResponse] = await Promise.all([
          api.get('/clients/stats/platform'),
          api.get('/clients/meetings/active')
        ]);
        
        setPlatformStats(platformStatsResponse.data);
        setActiveMeetings(activeMeetingsResponse.data || []);
      } else {
        // Admin normal: cargar datos específicos del cliente
        const [meetingsResponse, membersResponse] = await Promise.all([
          meetingService.getAll(),
          memberService.getAll()
        ]);
        
        const meetings = meetingsResponse.data;
        const members = membersResponse.data;
        
        const now = new Date();
        const active = meetings.filter(m => m.status === 'active');
        const completed = meetings.filter(m => m.status === 'completed');
        const upcoming = meetings.filter(m => new Date(m.date) > now && m.status === 'scheduled');

        setStats({
          totalMeetings: meetings.length,
          activeMeetings: active.length,
          completedMeetings: completed.length,
          upcomingMeetings: upcoming.length,
          totalMembers: members.length
        });

        setRecentMeetings(meetings.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleViewClientDashboard = (clientId) => {
    // Por ahora, redirigir a la lista de organizaciones
    // En el futuro, esto debería cambiar el contexto y mostrar el dashboard del cliente
    navigate(`/admin/organizations`);
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

  // Vista para Admin Master
  if (isAdminMaster) {
    return (
      <div className="admin-dashboard admin-master-dashboard">
        <div className="container">
          {/* Header */}
          <div className="dashboard-header-master">
            <div>
              <h1>BOARD QUORUM - Panel de Control</h1>
              <p className="admin-master-subtitle">
                {language === 'es' ? 'Admin Master' : 'Admin Master'}: {user?.name || 'Usuario'}
              </p>
            </div>
          </div>

          {/* Estado Plataforma */}
          <div className="platform-stats-section">
            <h2 className="section-title">
              <span className="section-icon">📊</span>
              {language === 'es' ? 'ESTADO PLATAFORMA' : 'PLATFORM STATUS'}
            </h2>
            <div className="platform-stats-grid">
              <div className="platform-stat-card">
                <div className="platform-stat-value">{platformStats.activeClients}</div>
                <div className="platform-stat-label">
                  {language === 'es' ? 'Clientes Activos' : 'Active Clients'}
                </div>
              </div>
              <div className="platform-stat-card active-meetings">
                <div className="platform-stat-value">
                  {platformStats.activeMeetings}
                  {platformStats.activeMeetings > 0 && (
                    <span className="active-indicator">🔴</span>
                  )}
                </div>
                <div className="platform-stat-label">
                  {language === 'es' ? 'Reuniones Activas' : 'Active Meetings'}
                </div>
              </div>
              <div className="platform-stat-card">
                <div className="platform-stat-value">{platformStats.totalUsers}</div>
                <div className="platform-stat-label">
                  {language === 'es' ? 'Usuarios Totales' : 'Total Users'}
                </div>
              </div>
            </div>
          </div>

          {/* Reuniones Activas */}
          <div className="active-meetings-section">
            <h2 className="section-title">
              <span className="section-icon">🔴</span>
              {language === 'es' ? 'REUNIONES ACTIVAS EN ESTE MOMENTO' : 'ACTIVE MEETINGS RIGHT NOW'}
            </h2>
            {activeMeetings.length === 0 ? (
              <div className="empty-state">
                <p>{language === 'es' ? 'No hay reuniones activas en este momento' : 'No active meetings at this time'}</p>
              </div>
            ) : (
              <div className="active-meetings-list">
                {activeMeetings.map(meeting => {
                  const meetingDate = new Date(meeting.date);
                  const startTime = formatTimeRange(meeting.date);
                  // Asumir duración de 2 horas por defecto
                  const endTime = formatTimeRange(new Date(meetingDate.getTime() + 2 * 60 * 60 * 1000));
                  
                  return (
                    <div key={meeting.id} className="active-meeting-card">
                      <div className="active-meeting-header">
                        <h3>{meeting.client_name}</h3>
                      </div>
                      <div className="active-meeting-body">
                        <div className="active-meeting-info">
                          <div className="meeting-type-time">
                            {meeting.product_name || (language === 'es' ? 'Reunión' : 'Meeting')} | {startTime}-{endTime}
                          </div>
                          {meeting.quorum && (
                            <div className="meeting-quorum">
                              {language === 'es' ? 'Quórum' : 'Quorum'}: {meeting.quorum.present}/{meeting.quorum.required}
                              {meeting.quorum.valid && <span className="quorum-valid">✓</span>}
                              {meeting.quorum.votingActive && (
                                <span className="voting-active">| {language === 'es' ? 'Votación activa' : 'Active voting'}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <button 
                          className="btn-view-dashboard"
                          onClick={() => handleViewClientDashboard(meeting.client_id)}
                        >
                          {language === 'es' ? 'Ver Dashboard' : 'View Dashboard'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones Rápidas */}
          <div className="quick-actions-section">
            <Link to="/admin/organizations" className="action-btn-primary">
              {language === 'es' ? 'Gestionar Clientes' : 'Manage Clients'} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vista para Admin normal (cliente específico)
  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>{t('adminPanel')}</h1>
          <p>{t('adminSubtitle')}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalMeetings}</div>
              <div className="stat-label">{t('totalMeetings')}</div>
            </div>
          </div>

          <div className="stat-card stat-active">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-value">{stats.activeMeetings}</div>
              <div className="stat-label">{t('activeMeetings')}</div>
            </div>
          </div>

          <div className="stat-card stat-completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completedMeetings}</div>
              <div className="stat-label">{t('completedMeetings')}</div>
            </div>
          </div>

          <div className="stat-card stat-upcoming">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.upcomingMeetings}</div>
              <div className="stat-label">{t('upcomingMeetings')}</div>
            </div>
          </div>

          <div className="stat-card stat-members">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalMembers}</div>
              <div className="stat-label">{language === 'es' ? 'TOTAL MIEMBROS' : 'TOTAL MEMBERS'}</div>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section-card">
            <h2>{t('recentMeetings')}</h2>
            {recentMeetings.length === 0 ? (
              <p className="empty">{t('noMeetingsRegistered')}</p>
            ) : (
              <div className="meetings-list">
                {recentMeetings.map(meeting => (
                  <div key={meeting.id} className="meeting-item">
                    <div className="meeting-info">
                      <h3>{meeting.title}</h3>
                      <p className="meeting-date">
                        {new Date(meeting.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`status status-${meeting.status}`}>
                      {meeting.status === 'scheduled' ? (language === 'es' ? 'Programada' : 'Scheduled') :
                       meeting.status === 'active' ? (language === 'es' ? 'Activa' : 'Active') :
                       meeting.status === 'completed' ? (language === 'es' ? 'Completada' : 'Completed') : meeting.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section-card">
            <h2>{t('quickActions')}</h2>
            <div className="quick-actions">
              <Link to="/products" className="action-btn">
                <span className="action-icon">📋</span>
                <span>{t('meetings')}</span>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin/members" className="action-btn">
                  <span className="action-icon">👥</span>
                  <span>{t('members')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
