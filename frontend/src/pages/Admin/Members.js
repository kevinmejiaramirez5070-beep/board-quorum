import React, { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import './Members.css';

const Members = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Authorized NO puede editar miembros
  const canEditMembers = user?.role === 'admin' || user?.role === 'admin_master';
  const [formData, setFormData] = useState({
    tipo_documento: '',
    numero_documento: '',
    name: '',
    email: '',
    rol_organico: '',
    cargo: '',
    role: '',
    tipo_participante: '',
    rol_en_votacion: '',
    cuenta_quorum: true,
    puede_votar: true
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await memberService.getAll();
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mapear cargo a position para el backend y limpiar campos vacíos
      // Determinar member_type basado en tipo_participante
      let member_type = 'principal';
      if (formData.tipo_participante === 'SUPLENTE') {
        member_type = 'suplente';
      } else if (formData.tipo_participante === 'JUNTA_DE_VIGILANCIA') {
        member_type = 'junta_vigilancia';
      }
      
      const dataToSend = {
        tipo_documento: formData.tipo_documento || null,
        numero_documento: formData.numero_documento || null,
        name: formData.name.trim(),
        rol_organico: formData.rol_organico || null,
        position: formData.cargo || null,
        role: formData.role || 'member',
        member_type: member_type,
        tipo_participante: formData.tipo_participante || null,
        rol_en_votacion: formData.rol_en_votacion || null,
        cuenta_quorum: formData.cuenta_quorum !== undefined ? formData.cuenta_quorum : true,
        puede_votar: formData.puede_votar !== undefined ? formData.puede_votar : true
      };
      
      // Validar que el nombre no esté vacío
      if (!dataToSend.name || dataToSend.name.trim() === '') {
        alert(t('nameRequired') || 'El nombre es requerido');
        return;
      }
      
      if (editingId) {
        await memberService.update(editingId, dataToSend);
      } else {
        await memberService.create(dataToSend);
      }
      loadMembers();
      resetForm();
    } catch (error) {
      console.error('Error saving member:', error);
      const errorMessage = error.response?.data?.message || error.message || t('errorSavingMember');
      alert(errorMessage);
    }
  };

  const handleEdit = (member) => {
    setFormData({
      tipo_documento: member.tipo_documento || '',
      numero_documento: member.numero_documento || '',
      name: member.name || '',
      rol_organico: member.rol_organico || '',
      cargo: member.position || '',
      role: member.role || '',
      tipo_participante: member.tipo_participante || '',
      rol_en_votacion: member.rol_en_votacion || '',
      cuenta_quorum: member.cuenta_quorum !== undefined ? member.cuenta_quorum : true,
      puede_votar: member.puede_votar !== undefined ? member.puede_votar : true
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteMember'))) return;
    
    try {
      await memberService.delete(id);
      loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert(t('errorDeletingMember'));
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_documento: '',
      numero_documento: '',
      name: '',
      rol_organico: '',
      cargo: '',
      role: '',
      tipo_participante: '',
      rol_en_votacion: '',
      cuenta_quorum: true,
      puede_votar: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="loading">{t('loading')}</div>;

  return (
    <div className="members-page">
      <div className="container">
        <div className="page-header">
          <h1>{t('memberManagement')}</h1>
          {canEditMembers && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? t('cancel') : t('newMember')}
            </button>
          )}
          {!canEditMembers && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {language === 'es' ? 'Vista de solo lectura - No puedes editar miembros' : 'Read-only view - You cannot edit members'}
            </p>
          )}
        </div>

        {showForm && (
          <div className="member-form-card">
            <h2>{editingId ? t('editMember') : t('newMemberTitle')}</h2>
            <form onSubmit={handleSubmit} className="member-form">
              <div className="form-columns">
                <div className="form-column">
                  <div className="form-group">
                    <label className="label">{t('documentType')}</label>
                    <select
                      name="tipo_documento"
                      value={formData.tipo_documento}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">{t('selectDocumentType')}</option>
                      <option value="C.C.">{language === 'es' ? 'Cédula de Ciudadanía' : 'Citizen ID'}</option>
                      <option value="C.E.">{language === 'es' ? 'Cédula de Extranjería' : 'Foreign ID'}</option>
                      <option value="PASAPORTE">{language === 'es' ? 'Pasaporte' : 'Passport'}</option>
                      <option value="NIT">NIT</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">{t('name')} *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">{t('organicRole')}</label>
                    <select
                      name="rol_organico"
                      value={formData.rol_organico}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">{t('selectOrganicRole')}</option>
                      <option value="PRESIDENCIA">{language === 'es' ? 'Presidencia' : 'Presidency'}</option>
                      <option value="VICEPRESIDENCIA">{language === 'es' ? 'Vicepresidencia' : 'Vice Presidency'}</option>
                      <option value="SECRETARIA">{language === 'es' ? 'Secretaria' : 'Secretary'}</option>
                      <option value="TESORERIA">{language === 'es' ? 'Tesoreria' : 'Treasury'}</option>
                      <option value="FISCALIA">{language === 'es' ? 'Fiscalia' : 'Fiscal'}</option>
                      <option value="VOCALES">{language === 'es' ? 'Vocales' : 'Vocal Members'}</option>
                      <option value="JUNTA DE VIGILANCIA">{language === 'es' ? 'Junta de Vigilancia' : 'Oversight Board'}</option>
                      <option value="CONTABILIDAD">{language === 'es' ? 'Contabilidad' : 'Accounting'}</option>
                      <option value="REVISORIA">{language === 'es' ? 'Revisoria' : 'Auditing'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">{language === 'es' ? 'Cargo Funcional' : 'Functional Position'}</label>
                    <select
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">{language === 'es' ? 'Seleccionar Cargo Funcional' : 'Select Functional Position'}</option>
                      <option value="PRESIDENTE">{language === 'es' ? 'Presidente' : 'President'}</option>
                      <option value="VICEPRESIDENTE">{language === 'es' ? 'Vicepresidente' : 'Vice President'}</option>
                      <option value="SUPLENTE SECRETARIA">{language === 'es' ? 'Suplente Secretaria' : 'Alternate Secretary'}</option>
                      <option value="TESORERO PRINCIPAL">{language === 'es' ? 'Tesorero Principal' : 'Principal Treasurer'}</option>
                      <option value="TESORERO SUPLENTE">{language === 'es' ? 'Tesorero Suplente' : 'Alternate Treasurer'}</option>
                      <option value="FISCALIA PRINCIPAL">{language === 'es' ? 'Fiscalia Principal' : 'Principal Fiscal'}</option>
                      <option value="FISCALIA SUPLENTE">{language === 'es' ? 'Fiscalia Suplente' : 'Alternate Fiscal'}</option>
                      <option value="VOCAL PRINCIPAL">{language === 'es' ? 'Vocal Principal' : 'Principal Vocal'}</option>
                      <option value="VOCAL SUPLENTE">{language === 'es' ? 'Vocal Suplente' : 'Alternate Vocal'}</option>
                      <option value="JUNTA DE VIGILANCIA">{language === 'es' ? 'Junta de Vigilancia' : 'Oversight Board'}</option>
                      <option value="CONTADORA">{language === 'es' ? 'Contadora' : 'Accountant'}</option>
                      <option value="REVISOR FISCAL">{language === 'es' ? 'Revisor Fiscal' : 'Fiscal Auditor'}</option>
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-group">
                    <label className="label">{t('documentNumber')}</label>
                    <input
                      type="text"
                      name="numero_documento"
                      value={formData.numero_documento}
                      onChange={handleChange}
                      className="input"
                      placeholder={language === 'es' ? 'EJ: 1234567890' : 'EX: 1234567890'}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">{t('participantType')}</label>
                    <select
                      name="tipo_participante"
                      value={formData.tipo_participante}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">{t('selectParticipantType')}</option>
                      <option value="PRINCIPAL">{language === 'es' ? 'Principal' : 'Principal'}</option>
                      <option value="SUPLENTE">{language === 'es' ? 'Suplente' : 'Alternate'}</option>
                      <option value="JUNTA_DE_VIGILANCIA">{language === 'es' ? 'Junta de Vigilancia' : 'Oversight Board'}</option>
                      <option value="NO_APLICA">{language === 'es' ? 'No Aplica' : 'Not Applicable'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">{t('votingRole')}</label>
                    <select
                      name="rol_en_votacion"
                      value={formData.rol_en_votacion}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">{t('selectVotingRole')}</option>
                      <option value="PRINCIPAL">{language === 'es' ? 'Principal' : 'Principal'}</option>
                      <option value="SUPLENTE_ACTUANDO">{language === 'es' ? 'Suplente Actuando' : 'Acting Alternate'}</option>
                      <option value="VIGILANCIA">{language === 'es' ? 'Vigilancia' : 'Oversight'}</option>
                      <option value="NO_APLICA">{language === 'es' ? 'No Aplica' : 'Not Applicable'}</option>
                    </select>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="cuenta_quorum"
                        checked={formData.cuenta_quorum}
                        onChange={handleChange}
                        className="checkbox-input"
                      />
                      <span>{t('countsForQuorum')}</span>
                    </label>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="puede_votar"
                        checked={formData.puede_votar}
                        onChange={handleChange}
                        className="checkbox-input"
                      />
                      <span>{t('canVote')}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? t('update') : t('create')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <div className="members-list">
            {members.length === 0 ? (
              <div className="empty-state">
                <p>{t('noMembersRegistered')}</p>
              </div>
            ) : (
              <div className="members-table-container">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t('documentType')}</th>
                      <th>{t('documentNumber')}</th>
                      <th>{t('name')}</th>
                      <th>{t('organicRole')}</th>
                      <th>{t('position')}</th>
                      <th>{t('participantType')}</th>
                      <th>{t('votingRole')}</th>
                      <th>{t('countsForQuorum')}</th>
                      <th>{t('canVote')}</th>
                      <th>{language === 'es' ? 'Acciones' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>{member.tipo_documento || '-'}</td>
                        <td>{member.numero_documento || '-'}</td>
                        <td>{member.name}</td>
                        <td>{member.rol_organico || '-'}</td>
                        <td>{member.position || '-'}</td>
                        <td>{member.tipo_participante || '-'}</td>
                        <td>{member.rol_en_votacion || '-'}</td>
                        <td className="text-center">
                          {member.cuenta_quorum ? (language === 'es' ? 'Sí' : 'Yes') : (language === 'es' ? 'No' : 'No')}
                        </td>
                        <td className="text-center">
                          {member.puede_votar ? (language === 'es' ? 'Sí' : 'Yes') : (language === 'es' ? 'No' : 'No')}
                        </td>
                        <td className="actions-cell">
                          {canEditMembers ? (
                            <>
                              <button 
                                className="btn btn-secondary btn-xs"
                                onClick={() => handleEdit(member)}
                                title={t('edit')}
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn btn-danger btn-xs"
                                onClick={() => handleDelete(member.id)}
                                title={t('delete')}
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {language === 'es' ? 'Solo lectura' : 'Read only'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;

