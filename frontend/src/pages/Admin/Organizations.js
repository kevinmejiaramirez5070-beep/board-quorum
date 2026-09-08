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
  // Org de prueba que NO queremos mostrar en el panel admin master
  const TEST_ORG_NAMES = ['kelvin', 'kevin meija', 'tumaco'];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    logo: '',
    primary_color: '#0072FF',
    secondary_color: '#00C6FF',
    language: 'es',
    // Ficha de onboarding del cliente
    nit: '',
    razon_social: '',
    nombre_corto: '',
    naturaleza_juridica: '',
    tipo_organizacion: '',
    tipo_organizacion_otro: '',
    ciudad: '',
    pais: 'Colombia',
    organos_requeridos: [],
    organos_requeridos_otro: '',
    contacto_nombre: '',
    contacto_cargo: '',
    contacto_email: '',
    contacto_telefono: '',
    pilotClient: {
      name: '',
      email: '',
      password: ''
    }
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  // Modal de gestión de usuarios
  const [usersModal, setUsersModal] = useState({ open: false, org: null, users: [], loading: false });
  const [editingUser, setEditingUser] = useState(null); // { id, email, newEmail, newPassword, saving, error }
  // SEG-01: protección para eliminar (3 capas)
  const [seg01, setSeg01] = useState({
    open: false,
    step: 1, // 1=texto exacto, 2=advertencia final, 3=eliminando
    org: null,
    confirmText: '',
    deleting: false,
    localError: ''
  });

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
      const list = Array.isArray(response.data) ? response.data : [];
      const filtered = list.filter((org) => {
        const name = (org?.name || '').trim().toLowerCase();
        return !TEST_ORG_NAMES.includes(name);
      });
      setOrganizations(filtered);
    } catch (error) {
      console.error('Error loading organizations:', error);
      const errorMessage = error.response?.data?.message || error.message || t('errorLoadingOrganizations');
      setError(errorMessage);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (org) => {
    const isActive = org?.active === true || org?.active === 1;
    const nextActive = !isActive;
    setTogglingId(org.id);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/clients/${org.id}/active`, { active: nextActive });
      setOrganizations(prev =>
        prev.map(o => (o.id === org.id ? { ...o, active: nextActive } : o))
      );
      setSuccess(
        nextActive
          ? (language === 'es' ? 'Organización activada.' : 'Organization activated.')
          : (language === 'es' ? 'Organización desactivada.' : 'Organization deactivated.')
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(language === 'es' ? `Error al cambiar estado: ${msg}` : `Error changing status: ${msg}`);
    } finally {
      setTogglingId(null);
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
      // Ficha de onboarding: se carga la que ya tenga la organización para no
      // borrarla al guardar una edición.
      nit: org.nit || '',
      razon_social: org.razon_social || '',
      nombre_corto: org.nombre_corto || '',
      naturaleza_juridica: org.naturaleza_juridica || '',
      tipo_organizacion: org.tipo_organizacion || '',
      tipo_organizacion_otro: org.tipo_organizacion_otro || '',
      ciudad: org.ciudad || '',
      pais: org.pais || 'Colombia',
      organos_requeridos: Array.isArray(org.organos_requeridos)
        ? org.organos_requeridos
        : (typeof org.organos_requeridos === 'string' && org.organos_requeridos
            ? (() => { try { return JSON.parse(org.organos_requeridos); } catch (e) { return []; } })()
            : []),
      organos_requeridos_otro: org.organos_requeridos_otro || '',
      contacto_nombre: org.contacto_nombre || '',
      contacto_cargo: org.contacto_cargo || '',
      contacto_email: org.contacto_email || '',
      contacto_telefono: org.contacto_telefono || '',
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
    const org = organizations.find(o => o.id === id);
    if (!org) return;

    setSeg01({
      open: true,
      step: 1,
      org,
      confirmText: '',
      deleting: false,
      localError: ''
    });
  };

  const handleSeg01ConfirmText = () => {
    if (!seg01?.org) return;
    const expected = String(seg01.org.name || '').trim();
    const actual = String(seg01.confirmText || '').trim();
    if (expected.length === 0 || actual !== expected) {
      setSeg01(prev => ({ ...prev, localError: language === 'es' ? 'Escribe el nombre EXACTO para continuar.' : 'Type the exact name to continue.' }));
      return;
    }
    setSeg01(prev => ({ ...prev, step: 2, localError: '' }));
  };

  const handleSeg01FinalDelete = async () => {
    if (!seg01?.org) return;
    setSeg01(prev => ({ ...prev, deleting: true, localError: '' }));
    try {
      await api.delete(`/clients/${seg01.org.id}`);
      setSeg01({ open: false, step: 1, org: null, confirmText: '', deleting: false, localError: '' });
      setSuccess(language === 'es' ? 'Organización eliminada (papelera) exitosamente.' : 'Organization moved to trash successfully.');
      loadOrganizations();
    } catch (error) {
      setSeg01(prev => ({ ...prev, deleting: false }));
      setError(error.response?.data?.message || t('errorDeletingOrganization'));
    }
  };

  const openUsersModal = async (org) => {
    setUsersModal({ open: true, org, users: [], loading: true });
    setEditingUser(null);
    try {
      const res = await api.get(`/auth/users?client_id=${org.id}`);
      setUsersModal(prev => ({ ...prev, users: res.data || [], loading: false }));
    } catch (e) {
      setUsersModal(prev => ({ ...prev, loading: false }));
    }
  };

  const saveUserCredentials = async () => {
    if (!editingUser) return;
    setEditingUser(prev => ({ ...prev, saving: true, error: '' }));
    try {
      const body = {};
      if (editingUser.newName && editingUser.newName.trim() !== editingUser.name) body.name = editingUser.newName.trim();
      if (editingUser.newEmail && editingUser.newEmail !== editingUser.email) body.email = editingUser.newEmail;
      if (editingUser.newPassword) body.password = editingUser.newPassword;
      if (!body.email && !body.password) {
        setEditingUser(prev => ({ ...prev, saving: false, error: language === 'es' ? 'No hay cambios para guardar.' : 'Nothing to save.' }));
        return;
      }
      await api.patch(`/auth/users/${editingUser.id}`, body);
      // Actualizar lista local
      setUsersModal(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUser.id ? { ...u, name: body.name || u.name, email: body.email || u.email } : u)
      }));
      setEditingUser(null);
    } catch (e) {
      setEditingUser(prev => ({ ...prev, saving: false, error: e.response?.data?.message || 'Error al guardar' }));
    }
  };

  // Listas de la ficha de onboarding. Son catalogos, no reglas: elegir un tipo
  // de organizacion o marcar un organo NO crea modulos ni parametriza nada.
  const NATURALEZAS = [
    'Sociedad comercial / con ánimo de lucro',
    'Entidad sin ánimo de lucro – ESAL',
    'Entidad pública',
    'Propiedad horizontal',
    'Otra'
  ];
  const TIPOS_ORGANIZACION = [
    'Asociación de Padres de Familia', 'Asociación', 'Fundación', 'Corporación',
    'Cooperativa', 'Fondo de Empleados', 'Propiedad Horizontal / Copropiedad',
    'Gremio / Federación', 'Institución Educativa', 'Empresa / Sociedad Comercial',
    'Entidad Pública', 'Otra'
  ];
  const ORGANOS = [
    'Junta Directiva', 'Asamblea General', 'Asamblea General de Delegados',
    'Asamblea de Accionistas', 'Consejo de Administración', 'Consejo Directivo',
    'Junta de Vigilancia', 'Comité', 'Otro'
  ];

  const toggleOrgano = (organo) => {
    setFormData(prev => {
      const actuales = prev.organos_requeridos || [];
      const marcado = actuales.includes(organo);
      return {
        ...prev,
        organos_requeridos: marcado ? actuales.filter(o => o !== organo) : [...actuales, organo],
        // Si se desmarca "Otro", se limpia lo que se hubiera escrito
        organos_requeridos_otro: (organo === 'Otro' && marcado) ? '' : prev.organos_requeridos_otro
      };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      logo: '',
      primary_color: '#0072FF',
      secondary_color: '#00C6FF',
      language: 'es',
      nit: '',
      razon_social: '',
      nombre_corto: '',
      naturaleza_juridica: '',
      tipo_organizacion: '',
      tipo_organizacion_otro: '',
      ciudad: '',
      pais: 'Colombia',
      organos_requeridos: [],
      organos_requeridos_otro: '',
      contacto_nombre: '',
      contacto_cargo: '',
      contacto_email: '',
      contacto_telefono: '',
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

                  {/* ── 1. DATOS DE LA ORGANIZACIÓN ─────────────────────── */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'NIT / Identificación' : 'Tax ID'}</label>
                      <input type="text" name="nit" value={formData.nit} onChange={handleChange}
                        className="input input-sm" placeholder={language === 'es' ? 'Ej: 900.123.456-7' : 'e.g. 900123456-7'} />
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Razón Social' : 'Legal name'}</label>
                      <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange}
                        className="input input-sm" />
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Nombre corto / visible' : 'Short name'}</label>
                      <input type="text" name="nombre_corto" value={formData.nombre_corto} onChange={handleChange}
                        className="input input-sm" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Naturaleza jurídica' : 'Legal nature'}</label>
                      <select name="naturaleza_juridica" value={formData.naturaleza_juridica}
                        onChange={handleChange} className="input input-sm">
                        <option value="">{language === 'es' ? 'Seleccionar…' : 'Select…'}</option>
                        {NATURALEZAS.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Tipo de organización' : 'Organization type'}</label>
                      <select name="tipo_organizacion" value={formData.tipo_organizacion}
                        onChange={handleChange} className="input input-sm">
                        <option value="">{language === 'es' ? 'Seleccionar…' : 'Select…'}</option>
                        {TIPOS_ORGANIZACION.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    {formData.tipo_organizacion === 'Otra' && (
                      <div className="form-group">
                        <label className="label">{language === 'es' ? 'Especifique' : 'Specify'}</label>
                        <input type="text" name="tipo_organizacion_otro" value={formData.tipo_organizacion_otro}
                          onChange={handleChange} className="input input-sm" />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Ciudad' : 'City'}</label>
                      <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange}
                        className="input input-sm" />
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'País' : 'Country'}</label>
                      <input type="text" name="pais" value={formData.pais} onChange={handleChange}
                        className="input input-sm" />
                    </div>
                  </div>

                  {/* ── 2. IDENTIDAD VISUAL ──────────────────────────────── */}
                  <div className="form-divider">
                    <h3>{language === 'es' ? 'Identidad visual' : 'Visual identity'}</h3>
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

                  {/* ── 3. ÓRGANOS / REUNIONES REQUERIDOS ────────────────── */}
                  <div className="form-divider">
                    <h3>{language === 'es' ? 'Órganos o reuniones que requiere gestionar' : 'Governing bodies required'}</h3>
                    <p className="form-hint">
                      {language === 'es'
                        ? 'Información de onboarding: deja registrada la necesidad del cliente. Por ahora no crea módulos ni parametriza reglas.'
                        : 'Onboarding information only: it does not create modules or rules yet.'}
                    </p>
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '6px 16px', marginBottom: 12
                  }}>
                    {ORGANOS.map(organo => (
                      <label key={organo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(formData.organos_requeridos || []).includes(organo)}
                          onChange={() => toggleOrgano(organo)}
                        />
                        {organo}
                      </label>
                    ))}
                  </div>

                  {(formData.organos_requeridos || []).includes('Otro') && (
                    <div className="form-row">
                      <div className="form-group">
                        <label className="label">{language === 'es' ? 'Especifique el órgano' : 'Specify'}</label>
                        <input type="text" name="organos_requeridos_otro" value={formData.organos_requeridos_otro}
                          onChange={handleChange} className="input input-sm" />
                      </div>
                    </div>
                  )}

                  {/* ── 4. CONTACTO PRINCIPAL ────────────────────────────── */}
                  <div className="form-divider">
                    <h3>{language === 'es' ? 'Contacto principal' : 'Main contact'}</h3>
                    <p className="form-hint">
                      {language === 'es'
                        ? 'Puede coincidir o no con el administrador inicial.'
                        : 'May or may not be the initial administrator.'}
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Nombre' : 'Name'}</label>
                      <input type="text" name="contacto_nombre" value={formData.contacto_nombre}
                        onChange={handleChange} className="input input-sm" />
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Cargo' : 'Position'}</label>
                      <input type="text" name="contacto_cargo" value={formData.contacto_cargo}
                        onChange={handleChange} className="input input-sm" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Correo electrónico' : 'Email'}</label>
                      <input type="email" name="contacto_email" value={formData.contacto_email}
                        onChange={handleChange} className="input input-sm" />
                    </div>
                    <div className="form-group">
                      <label className="label">{language === 'es' ? 'Teléfono' : 'Phone'}</label>
                      <input type="text" name="contacto_telefono" value={formData.contacto_telefono}
                        onChange={handleChange} className="input input-sm" />
                    </div>
                  </div>

                  {!editingId && (
                    <>
                      <div className="form-divider">
                        <h3>
                          {language === 'es' ? 'Administrador inicial de la organización' : 'Initial administrator'}
                        </h3>
                        <p className="form-hint">
                          {language === 'es'
                            ? 'Primera cuenta con la que la organización entrará a Board Quorum.'
                            : 'First account the organization will use to sign in.'}
                        </p>
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
              <>
                <div className="organizations-table-wrapper">
                  <div className="table-header">
                    <h2>
                      <span className="table-icon">📄</span>
                      {language === 'es' ? 'TODOS LOS CLIENTES' : 'ALL CLIENTS'}
                    </h2>
                  </div>
                  
                  {organizations.length === 0 ? (
                    <div className="empty-state">
                      <p>{language === 'es' ? 'No hay organizaciones registradas' : 'No organizations registered'}</p>
                      <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        {t('createFirstOrganization')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <table className="clients-table">
                        <thead>
                          <tr>
                            <th>{language === 'es' ? 'Cliente' : 'Client'}</th>
                            <th>{language === 'es' ? 'Estado' : 'Status'}</th>
                            <th>{language === 'es' ? 'Última Actividad' : 'Last Activity'}</th>
                            <th>{language === 'es' ? 'Acción' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.map(org => {
                            const isActiveClient = org?.active === true || org?.active === 1;
                            const getStatusColor = (active) => (active ? '#10b981' : '#dc2626'); // Green/Red
                            const getStatusLabel = (active) =>
                              active
                                ? (language === 'es' ? 'ACTIVO' : 'ACTIVE')
                                : (language === 'es' ? 'ELIMINADO' : 'DELETED');

                            return (
                              <tr key={org.id}>
                                <td className="client-name">{org.name}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="status-badge status-badge-clickable"
                                    style={{ 
                                      color: getStatusColor(isActiveClient),
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                    onClick={() => handleToggleActive(org)}
                                    disabled={togglingId === org.id}
                                    title={language === 'es' 
                                      ? (isActiveClient ? 'Clic para desactivar' : 'Clic para activar')
                                      : (isActiveClient ? 'Click to deactivate' : 'Click to activate')
                                    }
                                  >
                                    <span 
                                      className="status-dot"
                                      style={{ 
                                        backgroundColor: getStatusColor(isActiveClient),
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        display: 'inline-block'
                                      }}
                                    ></span>
                                    {togglingId === org.id 
                                      ? (language === 'es' ? '...' : '...') 
                                      : getStatusLabel(isActiveClient)
                                    }
                                  </button>
                                </td>
                                <td className="last-activity">
                                  {org.lastActivity || (language === 'es' ? 'Sin actividad' : 'No activity')}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                      className="btn-enter-client"
                                      onClick={() => {
                                        window.location.href = `/products?client=${org.id}`;
                                      }}
                                    >
                                      {language === 'es' ? 'Entrar →' : 'Enter →'}
                                    </button>
                                    <button
                                      className="btn-edit-client"
                                      onClick={() => openUsersModal(org)}
                                      title={language === 'es' ? 'Gestionar usuarios' : 'Manage users'}
                                      style={{ fontSize: '15px' }}
                                    >
                                      👥
                                    </button>
                                    <button
                                      className="btn-edit-client"
                                      onClick={() => handleEdit(org)}
                                      title={language === 'es' ? 'Editar' : 'Edit'}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      className="btn-delete-client"
                                      onClick={() => handleDelete(org.id)}
                                      title={language === 'es' ? 'Eliminar' : 'Delete'}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      <div className="table-footer">
                        <button 
                          className="btn btn-primary btn-new-client"
                          onClick={() => setShowForm(true)}
                        >
                          + {language === 'es' ? 'Nuevo Cliente' : 'New Client'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SEG-01 Modal: protección para eliminar */}
      {seg01.open && seg01.org && (
        <div
          className="seg01-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="seg01-modal"
            style={{
              width: '100%',
              maxWidth: '720px',
              background: 'var(--surface)',
              borderRadius: '14px',
              border: '2px solid #dc2626',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
              padding: '22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🗑️</span>
                <h2 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>
                  {language === 'es'
                    ? `¿Eliminar "${seg01.org?.name}"?`
                    : `Delete "${seg01.org?.name}"?`}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSeg01({ open: false, step: 1, org: null, confirmText: '', deleting: false, localError: '' })}
                disabled={seg01.deleting}
              >
                ✕
              </button>
            </div>

            {seg01.step === 1 && (
              <div style={{ marginTop: '18px' }}>
                <p style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {language === 'es'
                    ? 'Esta acción no se puede deshacer fácilmente. Para confirmar, escribe el nombre exacto de la organización:'
                    : 'This action cannot be easily undone. To confirm, type the exact organization name:'}
                </p>
                <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', background: 'rgba(220,38,38,0.07)', display: 'inline-block', padding: '4px 12px', borderRadius: '6px', letterSpacing: '0.03em' }}>
                  {seg01.org?.name}
                </p>

                <div>
                  <input
                    type="text"
                    className="input"
                    placeholder={seg01.org?.name}
                    value={seg01.confirmText}
                    onChange={(e) => setSeg01(prev => ({ ...prev, confirmText: e.target.value, localError: '' }))}
                    disabled={seg01.deleting}
                    style={{ width: '100%' }}
                  />
                  {seg01.localError && (
                    <div className="alert alert-error" style={{ marginTop: '8px' }}>
                      {seg01.localError}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '18px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSeg01({ open: false, step: 1, org: null, confirmText: '', deleting: false, localError: '' })}
                    disabled={seg01.deleting}
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleSeg01ConfirmText}
                    disabled={seg01.deleting}
                  >
                    {language === 'es' ? 'Continuar' : 'Continue'}
                  </button>
                </div>
              </div>
            )}

            {seg01.step === 2 && (
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    background: 'rgba(220,38,38,0.12)',
                    border: '2px solid #dc2626',
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '34px' }}>⚠️</span>
                    <div>
                      <h3 style={{ margin: 0, color: '#dc2626' }}>
                        {language === 'es' ? 'Advertencia final' : 'Final warning'}
                      </h3>
                      <p style={{ margin: '6px 0 0', color: 'var(--text-primary)' }}>
                        {language === 'es'
                          ? 'Esta acción manda la organización a la papelera (soft delete). Se podrá restaurar dentro de 30 días.'
                          : 'This action moves the organization to trash (soft delete). It can be restored within 30 days.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '18px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSeg01(prev => ({ ...prev, step: 1, localError: '' }))}
                    disabled={seg01.deleting}
                  >
                    {language === 'es' ? 'Volver' : 'Back'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleSeg01FinalDelete}
                    disabled={seg01.deleting}
                    style={{ minWidth: '160px' }}
                  >
                    {seg01.deleting
                      ? (language === 'es' ? 'Eliminando...' : 'Deleting...')
                      : (language === 'es' ? 'Eliminar a papelera' : 'Move to trash')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de gestión de usuarios */}
      {usersModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 6000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface, #1e293b)', borderRadius: '14px', width: '100%',
            maxWidth: '560px', padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>
                👥 {language === 'es' ? 'Usuarios de' : 'Users of'} <span style={{ color: 'var(--primary, #6366f1)' }}>{usersModal.org?.name}</span>
              </h2>
              <button
                onClick={() => { setUsersModal({ open: false, org: null, users: [], loading: false }); setEditingUser(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
              >✕</button>
            </div>

            {usersModal.loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
            ) : usersModal.users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                {language === 'es' ? 'No hay usuarios registrados.' : 'No users found.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {usersModal.users.map(u => {
                  const isEditing = editingUser?.id === u.id;
                  const roleLabel = u.role === 'admin' ? 'Admin' : u.role === 'authorized' ? 'Autorizado' : u.role;
                  return (
                    <div key={u.id} style={{
                      background: 'var(--bg-card, rgba(255,255,255,0.04))', borderRadius: '10px',
                      padding: '14px 16px', border: '1px solid var(--border, rgba(255,255,255,0.08))'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? '12px' : 0 }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{u.name}</span>
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: '10px' }}>{roleLabel}</span>
                          {!isEditing && <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{u.email}</p>}
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => setEditingUser({ id: u.id, name: u.name, newName: u.name, email: u.email, newEmail: u.email, newPassword: '', saving: false, error: '' })}
                            style={{ background: 'transparent', border: '1px solid var(--border, rgba(255,255,255,0.15))', color: 'var(--text-secondary)', borderRadius: '7px', padding: '5px 12px', fontSize: '13px', cursor: 'pointer' }}
                          >
                            {language === 'es' ? 'Editar' : 'Edit'}
                          </button>
                        )}
                      </div>

                      {isEditing && (
                        <div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                              {language === 'es' ? 'Nombre' : 'Name'}
                            </label>
                            <input
                              type="text"
                              value={editingUser.newName}
                              onChange={e => setEditingUser(prev => ({ ...prev, newName: e.target.value, error: '' }))}
                              style={{
                                width: '100%', padding: '8px 12px', borderRadius: '7px', fontSize: '13px',
                                border: '1.5px solid var(--border, rgba(255,255,255,0.15))',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))', color: 'var(--text-primary)',
                                outline: 'none', boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                              {language === 'es' ? 'Nuevo correo' : 'New email'}
                            </label>
                            <input
                              type="email"
                              value={editingUser.newEmail}
                              onChange={e => setEditingUser(prev => ({ ...prev, newEmail: e.target.value, error: '' }))}
                              style={{
                                width: '100%', padding: '8px 12px', borderRadius: '7px', fontSize: '13px',
                                border: '1.5px solid var(--border, rgba(255,255,255,0.15))',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))', color: 'var(--text-primary)',
                                outline: 'none', boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                              {language === 'es' ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'New password (leave blank to keep)'}
                            </label>
                            <input
                              type="password"
                              value={editingUser.newPassword}
                              onChange={e => setEditingUser(prev => ({ ...prev, newPassword: e.target.value, error: '' }))}
                              placeholder={language === 'es' ? 'Mín. 6 caracteres' : 'Min. 6 characters'}
                              style={{
                                width: '100%', padding: '8px 12px', borderRadius: '7px', fontSize: '13px',
                                border: '1.5px solid var(--border, rgba(255,255,255,0.15))',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))', color: 'var(--text-primary)',
                                outline: 'none', boxSizing: 'border-box'
                              }}
                            />
                          </div>
                          {editingUser.error && (
                            <p style={{ color: '#f87171', fontSize: '12px', margin: '0 0 10px' }}>{editingUser.error}</p>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={saveUserCredentials}
                              disabled={editingUser.saving}
                              style={{
                                flex: 1, padding: '8px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
                                background: 'var(--primary, #6366f1)', color: '#fff', border: 'none',
                                cursor: editingUser.saving ? 'not-allowed' : 'pointer', opacity: editingUser.saving ? 0.7 : 1
                              }}
                            >
                              {editingUser.saving ? '...' : (language === 'es' ? 'Guardar' : 'Save')}
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              disabled={editingUser.saving}
                              style={{
                                padding: '8px 16px', borderRadius: '7px', fontSize: '13px',
                                background: 'transparent', color: 'var(--text-secondary)',
                                border: '1px solid var(--border, rgba(255,255,255,0.12))', cursor: 'pointer'
                              }}
                            >
                              {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;

