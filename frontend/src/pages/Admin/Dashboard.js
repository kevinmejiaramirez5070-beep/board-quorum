import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { meetingService } from '../../services/meetingService';
import { memberService } from '../../services/memberService';
import { clientService } from '../../services/clientService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

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

  const [stats, setStats] = useState({
    totalMeetings: 0,
    activeMeetings: 0,
    completedMeetings: 0,
    upcomingMeetings: 0,
    totalMembers: 0,
    totalOrganizations: 0
  });
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Determinar si es admin master
  const isAdminMaster = user?.role === 'admin_master';

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user?.role]);

  const loadDashboardData = async () => {
    try {
      if (isAdminMaster) {
        // Admin Master: cargar organizaciones en lugar de miembros
        const [meetingsResponse, organizationsResponse] = await Promise.all([
          meetingService.getAll(),
          clientService.getAll()
        ]);
        
        const meetings = meetingsResponse.data;
        const organizations = organizationsResponse.data;
        
        const now = new Date();
        const active = meetings.filter(m => m.status === 'active');
        const completed = meetings.filter(m => m.status === 'completed');
        const upcoming = meetings.filter(m => new Date(m.date) > now && m.status === 'scheduled');

        setStats({
          totalMeetings: meetings.length,
          activeMeetings: active.length,
          completedMeetings: completed.length,
          upcomingMeetings: upcoming.length,
          totalMembers: 0,
          totalOrganizations: organizations.length
        });

        setRecentMeetings(meetings.slice(0, 5));
      } else {
        // Admin normal: cargar miembros
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
          totalMembers: members.length,
          totalOrganizations: 0
        });

        setRecentMeetings(meetings.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

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

          {isAdminMaster ? (
            <div className="stat-card stat-organizations">
              <div className="stat-icon">🏢</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalOrganizations}</div>
                <div className="stat-label">{language === 'es' ? 'TOTAL ORGANIZACIONES' : 'TOTAL ORGANIZATIONS'}</div>
              </div>
            </div>
          ) : (
            <div className="stat-card stat-members">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalMembers}</div>
                <div className="stat-label">{language === 'es' ? 'TOTAL MIEMBROS' : 'TOTAL MEMBERS'}</div>
              </div>
            </div>
          )}
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
                      {getStatusLabel(meeting.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section-card">
            <h2>{t('quickActions')}</h2>
            <div className="quick-actions">
              {(user?.role === 'admin' || user?.role === 'admin_master') && (
                <a href="/meetings/new" className="action-btn">
                  <span className="action-icon">➕</span>
                  <span>{t('newMeeting')}</span>
                </a>
              )}
              <Link to="/meetings" className="action-btn">
                <span className="action-icon">📋</span>
                <span>{t('viewAllMeetings')}</span>
              </Link>
              {user?.role === 'admin_master' && (
                <Link to="/admin/organizations" className="action-btn">
                  <span className="action-icon">⚙️</span>
                  <span>{t('organizations')}</span>
                </Link>
              )}
              {(user?.role === 'admin' || user?.role === 'admin_master') && (
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

