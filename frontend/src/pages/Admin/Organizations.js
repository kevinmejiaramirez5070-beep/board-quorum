import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import './Organizations.css';

const Organizations = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    logo: '',
    primary_color: '#0072FF',
    secondary_color: '#00C6FF',
    language: 'es',
    pilotClient: {
      name: '',
      email: '',
      password: ''
    }
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Redirigir si no es admin master
    if (user && user.role !== 'admin_master') {
      navigate('/admin');
      return;
    }
    loadOrganizations();
  }, [user, navigate]);

  const loadOrganizations = async () => {
    try {
      setError('');
      const response = await api.get('/clients');
      if (response.data) {
        setOrganizations(response.data);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      const errorMessage = error.response?.data?.message || error.message || t('errorLoadingOrganizations');
      setError(errorMessage);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pilotClient.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        pilotClient: {
          ...formData.pilotClient,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
    setSuccess('');
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(language === 'es' ? 'Por favor selecciona una imagen válida' : 'Please select a valid image');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(language === 'es' ? 'La imagen debe ser menor a 5MB' : 'Image must be less than 5MB');
        return;
      }

      // Comprimir y convertir a base64 (más agresivo para reducir tamaño)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Reducir tamaño máximo a 500px para reducir el tamaño del base64
          const maxSize = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Reducir calidad a 0.6 para reducir aún más el tamaño
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          // Verificar tamaño del base64 (debe ser menor a 3MB para dejar margen)
          const base64Size = (compressedBase64.length * 3) / 4 / 1024 / 1024; // Tamaño en MB
          if (base64Size > 3) {
            setError(language === 'es' 
              ? 'La imagen es demasiado grande incluso después de comprimir. Por favor, elige una imagen más pequeña.' 
              : 'Image is too large even after compression. Please choose a smaller image.');
            return;
          }
          
          setFormData({ ...formData, logo: compressedBase64 });
          setLogoPreview(compressedBase64);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, formData);
        setSuccess(t('organizationUpdatedSuccess'));
      } else {
        await api.post('/clients', formData);
        setSuccess(t('organizationCreatedSuccess'));
      }
      resetForm();
      loadOrganizations();
    } catch (error) {
      setError(error.response?.data?.message || t('errorSavingOrganization'));
    }
  };

  const handleEdit = (org) => {
    setFormData({
      name: org.name || '',
      subdomain: org.subdomain || '',
      logo: org.logo || '',
      primary_color: org.primary_color || '#0072FF',
      secondary_color: org.secondary_color || '#00C6FF',
      language: org.language || 'es',
      pilotClient: {
        name: '',
        email: '',
        password: ''
      }
    });
    setLogoPreview(org.logo || null);
    setEditingId(org.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteOrganization'))) {
      return;
    }

    try {
      await api.delete(`/clients/${id}`);
      setSuccess(t('organizationDeletedSuccess'));
      loadOrganizations();
    } catch (error) {
      setError(error.response?.data?.message || t('errorDeletingOrganization'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      logo: '',
      primary_color: '#0072FF',
      secondary_color: '#00C6FF',
      language: 'es',
      pilotClient: {
        name: '',
        email: '',
        password: ''
      }
    });
    setLogoPreview(null);
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="organizations-page">
      <div className="container">
        <div className="organizations-wrapper">
          <div className="organizations-card">
            <div className="card-header">
              <h1>{t('organizationManagement')}</h1>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                {showForm ? t('cancel') : t('newOrganization')}
              </button>
            </div>

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            {success && (
              <div className="alert alert-success">{success}</div>
            )}

            {showForm && (
              <div className="organization-form-section">
            <h2>{editingId ? t('editOrganization') : t('newOrganizationTitle')}</h2>
                <form onSubmit={handleSubmit} className="compact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{t('organizationName')} *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input input-sm"
                        required
                        placeholder={language === 'es' ? 'Ej: ASOCOLCI' : 'Ex: ASOCOLCI'}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">{t('subdomain')} *</label>
                      <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        className="input input-sm"
                        required
                        placeholder={language === 'es' ? 'Ej: asocolci' : 'Ex: asocolci'}
                        pattern="[a-z0-9\-]+"
                        title={language === 'es' ? 'Solo letras minúsculas, números y guiones' : 'Only lowercase letters, numbers and hyphens'}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{t('logo')}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="input input-sm"
                      />
                      {logoPreview && (
                        <div className="logo-preview">
                          <img src={logoPreview} alt="Logo preview" />
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="label">{t('primaryColor')}</label>
                      <input
                        type="color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                        className="input input-color"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">{t('secondaryColor')}</label>
                      <input
                        type="color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        className="input input-color"
                      />
                    </div>
                  </div>

                  {!editingId && (
                    <>
                      <div className="form-divider">
                        <h3>{t('pilotClientData')}</h3>
                        <p className="form-hint">{t('pilotClientDescription')}</p>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="label">{t('pilotName')} *</label>
                          <input
                            type="text"
                            name="pilotClient.name"
                            value={formData.pilotClient.name}
                            onChange={handleChange}
                            className="input input-sm"
                            required
                            placeholder={language === 'es' ? 'Ej: Juan Pérez' : 'Ex: John Doe'}
                          />
                        </div>

                        <div className="form-group">
                          <label className="label">{t('pilotEmail')} *</label>
                          <input
                            type="email"
                            name="pilotClient.email"
                            value={formData.pilotClient.email}
                            onChange={handleChange}
                            className="input input-sm"
                            required
                            placeholder={language === 'es' ? 'Ej: juan@asocolci.com' : 'Ex: john@example.com'}
                          />
                        </div>

                        <div className="form-group">
                          <label className="label">{t('pilotPassword')} *</label>
                          <input
                            type="password"
                            name="pilotClient.password"
                            value={formData.pilotClient.password}
                            onChange={handleChange}
                            className="input input-sm"
                            required
                            placeholder={language === 'es' ? 'Mín. 6 caracteres' : 'Min. 6 characters'}
                            minLength={6}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary btn-sm">
                      {editingId ? t('update') : t('create')}
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                      {t('cancel')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showForm && (
              <div className="organizations-list">
                {organizations.length === 0 ? (
                  <div className="empty-state">
                    <p>{language === 'es' ? 'No hay organizaciones registradas' : 'No organizations registered'}</p>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                      {t('createFirstOrganization')}
                    </button>
                  </div>
                ) : (
                  organizations.map(org => (
                    <div key={org.id} className="organization-item">
                      <div className="org-header">
                        {org.logo && (
                          <img src={org.logo} alt={org.name} className="org-logo" />
                        )}
                        <div className="org-info">
                          <h3>{org.name}</h3>
                          <p className="org-subdomain">{org.subdomain}</p>
                        </div>
                      </div>
                      <div className="org-actions">
                        <button 
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleEdit(org)}
                        >
                          {t('edit')}
                        </button>
                        <button 
                          className="btn btn-danger btn-xs"
                          onClick={() => handleDelete(org.id)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organizations;

