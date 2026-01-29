import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { userService } from '../../services/userService';
import './UserSettingsModal.css';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'email'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Formulario de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Formulario de correo
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: language === 'es' ? 'Todos los campos son requeridos' : 'All fields are required' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage({ 
        type: 'success', 
        text: language === 'es' ? 'Contraseña actualizada exitosamente' : 'Password updated successfully' 
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (language === 'es' ? 'Error al actualizar la contraseña' : 'Error updating password');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!emailForm.newEmail || !emailForm.password) {
      setMessage({ type: 'error', text: language === 'es' ? 'Todos los campos son requeridos' : 'All fields are required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      setMessage({ type: 'error', text: language === 'es' ? 'Formato de correo inválido' : 'Invalid email format' });
      return;
    }

    setLoading(true);
    try {
      const response = await userService.changeEmail({
        newEmail: emailForm.newEmail,
        password: emailForm.password
      });
      
      // Actualizar el usuario en el contexto
      if (response.data.user) {
        setUser(response.data.user);
        // Actualizar también en localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      setMessage({ 
        type: 'success', 
        text: language === 'es' ? 'Correo actualizado exitosamente' : 'Email updated successfully' 
      });
      setEmailForm({
        newEmail: '',
        password: ''
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (language === 'es' ? 'Error al actualizar el correo' : 'Error updating email');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="user-settings-modal-overlay" onClick={onClose}>
      <div className="user-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{language === 'es' ? 'Configuración de Cuenta' : 'Account Settings'}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
          </button>
          <button
            className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            {language === 'es' ? 'Cambiar Correo' : 'Change Email'}
          </button>
        </div>

        <div className="modal-content">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="form-group">
                <label>{language === 'es' ? 'Contraseña Actual' : 'Current Password'}</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder={language === 'es' ? 'Ingresa tu contraseña actual' : 'Enter your current password'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{language === 'es' ? 'Nueva Contraseña' : 'New Password'}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder={language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>{language === 'es' ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder={language === 'es' ? 'Confirma tu nueva contraseña' : 'Confirm your new password'}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading 
                    ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')
                  }
                </button>
              </div>
            </form>
          )}

          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="settings-form">
              <div className="form-group">
                <label>{language === 'es' ? 'Correo Actual' : 'Current Email'}</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>{language === 'es' ? 'Nuevo Correo' : 'New Email'}</label>
                <input
                  type="email"
                  name="newEmail"
                  value={emailForm.newEmail}
                  onChange={handleEmailChange}
                  placeholder={language === 'es' ? 'Ingresa tu nuevo correo' : 'Enter your new email'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{language === 'es' ? 'Contraseña' : 'Password'}</label>
                <input
                  type="password"
                  name="password"
                  value={emailForm.password}
                  onChange={handleEmailChange}
                  placeholder={language === 'es' ? 'Ingresa tu contraseña para confirmar' : 'Enter your password to confirm'}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading 
                    ? (language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (language === 'es' ? 'Guardar Cambios' : 'Save Changes')
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsModal;






