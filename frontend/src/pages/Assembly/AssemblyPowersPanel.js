import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { assemblyService } from '../../services/assemblyService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel de Poderes (M3). Registra poderes de representación.
 * No incluye revocación (pendiente VF-06).
 */
const AssemblyPowersPanel = ({ meetingId, productId }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [powers, setPowers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ poderdante_id: '', apoderado_id: '' });

  const canOperate = ['admin', 'admin_master', 'authorized'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([
        meetingService.getPowers(meetingId),
        productId ? assemblyService.getMembers(productId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      setPowers(p.data || []);
      setMembers((m.data || []).filter(x => x.active));
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar poderes');
    } finally { setLoading(false); }
  }, [meetingId, productId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.poderdante_id || !form.apoderado_id) { setError(language === 'es' ? 'Selecciona poderdante y apoderado.' : 'Select both.'); return; }
    setBusy(true); setError('');
    try {
      await meetingService.registerPower(meetingId, { poderdante_id: Number(form.poderdante_id), apoderado_id: Number(form.apoderado_id) });
      setForm({ poderdante_id: '', apoderado_id: '' });
      setShowForm(false);
      await load();
    } catch (e) { setError(e.response?.data?.message || 'Error al registrar poder'); }
    finally { setBusy(false); }
  };

  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };
  const selStyle = { padding: '7px 10px', borderRadius: 7, fontSize: 13, border: '1.5px solid var(--border,rgba(255,255,255,0.15))', background: 'var(--bg-input,rgba(255,255,255,0.05))', color: 'var(--text-primary)', outline: 'none', width: '100%' };
  const principales = members.filter(m => m.member_type === 'principal');
  const statusInfo = (s) => ({
    active: { t: language === 'es' ? 'ACTIVO' : 'ACTIVE', c: '#10b981' },
    registered: { t: language === 'es' ? 'PENDIENTE' : 'PENDING', c: '#f59e0b' },
    suspended: { t: language === 'es' ? 'SUSPENDIDO' : 'SUSPENDED', c: '#94a3b8' },
    revoked: { t: language === 'es' ? 'REVOCADO' : 'REVOKED', c: '#ef4444' }
  }[s] || { t: s, c: '#94a3b8' });

  const activos = powers.filter(p => p.status === 'active').length;
  const pendientes = powers.filter(p => p.status === 'registered').length;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>📜 {language === 'es' ? 'Poderes de Representación' : 'Proxy Powers'}</h3>
        <span style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)' }}>
          {language === 'es' ? `Activos: ${activos} · Pendientes: ${pendientes}` : `Active: ${activos} · Pending: ${pendientes}`}
        </span>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {canOperate && (
        <div style={{ marginBottom: 12 }}>
          {!showForm ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              {language === 'es' ? '+ Registrar poder' : '+ Register proxy'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)' }}>{language === 'es' ? 'Poderdante (Principal ausente)' : 'Grantor (Principal)'}</label>
              <select style={selStyle} value={form.poderdante_id} onChange={e => setForm(f => ({ ...f, poderdante_id: e.target.value }))}>
                <option value="">{language === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                {principales.map(m => <option key={m.id} value={m.id}>{m.rol_organico} — {m.name}</option>)}
              </select>
              <label style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)' }}>{language === 'es' ? 'Apoderado (delegado que representa)' : 'Proxy (delegate)'}</label>
              <select style={selStyle} value={form.apoderado_id} onChange={e => setForm(f => ({ ...f, apoderado_id: e.target.value }))}>
                <option value="">{language === 'es' ? 'Seleccionar...' : 'Select...'}</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.rol_organico} — {m.name} ({m.member_type})</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{language === 'es' ? 'Registrar' : 'Register'}</button>
                <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { setShowForm(false); setError(''); }}>{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {powers.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary,#94a3b8)', margin: 0 }}>{language === 'es' ? 'No hay poderes registrados.' : 'No proxies registered.'}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-secondary,#94a3b8)', borderBottom: '1px solid var(--border,rgba(255,255,255,0.1))' }}>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Curso' : 'Course'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Poderdante' : 'Grantor'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Apoderado' : 'Proxy'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Estado' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {powers.map(p => {
                const si = statusInfo(p.status);
                return (
                  <tr key={p.power_id} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))' }}>
                    <td style={{ padding: '5px 6px' }}>{p.curso}</td>
                    <td style={{ padding: '5px 6px' }}>{p.poderdante_nombre}</td>
                    <td style={{ padding: '5px 6px' }}>{p.apoderado_nombre || '—'}</td>
                    <td style={{ padding: '5px 6px', color: si.c, fontWeight: 700 }}>{si.t}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssemblyPowersPanel;
