import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel de Roles de Asamblea (M7). Asigna/revoca Presidente, Secretario(a) y comisiones.
 * Soporta personas externas (nombre libre).
 */
const AssemblyRolesPanel = ({ meetingId }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ role_type: '', person_name: '' });

  const canOperate = ['admin', 'admin_master', 'authorized'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const res = await meetingService.getRoles(meetingId);
      setRoles(res.data); setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar roles');
    } finally { setLoading(false); }
  }, [meetingId]);

  useEffect(() => { load(); }, [load]);

  const assign = async (role_type, person_name) => {
    if (!person_name || !person_name.trim()) { setError(language === 'es' ? 'Ingresa el nombre.' : 'Enter a name.'); return; }
    setBusy(true); setError('');
    try {
      await meetingService.assignRole(meetingId, { role_type, person_name: person_name.trim(), person_type: 'externo' });
      setForm({ role_type: '', person_name: '' });
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Error al asignar'); }
    finally { setBusy(false); }
  };

  const revoke = async (sessionRoleId) => {
    if (!window.confirm(language === 'es' ? '¿Revocar este rol?' : 'Revoke this role?')) return;
    setBusy(true); setError('');
    try { await meetingService.revokeRole(meetingId, sessionRoleId); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Error al revocar'); }
    finally { setBusy(false); }
  };

  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };
  const inputStyle = { padding: '7px 10px', borderRadius: 7, fontSize: 13, border: '1.5px solid var(--border,rgba(255,255,255,0.15))', background: 'var(--bg-input,rgba(255,255,255,0.05))', color: 'var(--text-primary)', outline: 'none' };

  // Fila de rol unipersonal
  const UniRow = ({ roleType, label }) => {
    const r = roles?.[roleType];
    const [name, setName] = useState('');
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary,#94a3b8)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{label}</div>
        {r ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>✅ {r.person_name}</span>
            {canOperate && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => revoke(r.session_role_id)}>{language === 'es' ? 'Revocar' : 'Revoke'}</button>}
          </div>
        ) : canOperate ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder={language === 'es' ? 'Nombre completo' : 'Full name'} value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => assign(roleType, name)}>{language === 'es' ? 'Asignar' : 'Assign'}</button>
          </div>
        ) : (
          <span style={{ fontSize: 14, color: 'var(--text-secondary,#94a3b8)' }}>⏳ {language === 'es' ? 'Sin asignar' : 'Unassigned'}</span>
        )}
      </div>
    );
  };

  // Comisión multi-integrante
  const CommissionRow = ({ roleType, label }) => {
    const members = roles?.[roleType] || [];
    const [name, setName] = useState('');
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary,#94a3b8)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{label}</div>
        {members.map(m => (
          <div key={m.session_role_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>✅ {m.person_name}</span>
            {canOperate && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => revoke(m.session_role_id)}>{language === 'es' ? 'Revocar' : 'Revoke'}</button>}
          </div>
        ))}
        {members.length === 0 && <div style={{ fontSize: 14, color: 'var(--text-secondary,#94a3b8)', marginBottom: 4 }}>⏳ {language === 'es' ? 'Sin integrantes' : 'No members'}</div>}
        {canOperate && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder={language === 'es' ? 'Agregar integrante' : 'Add member'} value={name} onChange={e => setName(e.target.value)} />
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => { assign(roleType, name); setName(''); }}>+</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>👤 {language === 'es' ? 'Roles de Asamblea' : 'Assembly Roles'}</h3>
      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <UniRow roleType="presidente_asamblea" label={language === 'es' ? 'Presidente de la Asamblea' : 'Assembly President'} />
      <UniRow roleType="secretario_asamblea" label={language === 'es' ? 'Secretario(a) de la Asamblea' : 'Assembly Secretary'} />
      <CommissionRow roleType="comision_verificadora" label={language === 'es' ? 'Comisión Verificadora del Acta' : 'Minutes Verification Commission'} />
      <CommissionRow roleType="comision_aprobadora" label={language === 'es' ? 'Comisión Aprobadora del Acta' : 'Minutes Approval Commission'} />
    </div>
  );
};

export default AssemblyRolesPanel;
