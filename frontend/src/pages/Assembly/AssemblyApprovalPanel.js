import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel de Votaciones de Aprobación Documental (M5). Voto nominal:
 * A favor / En contra / Abstención. Las abstenciones no cuentan en la mayoría.
 */
const AssemblyApprovalPanel = ({ meetingId, meetingStatus }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', punto_orden_dia: '' });
  const [padron, setPadron] = useState(null); // { avId, list }

  const canOperate = ['admin', 'admin_master', 'authorized'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const res = await meetingService.getApprovalVotes(meetingId);
      setVotes(res.data || []); setError('');
    } catch (e) { setError(e.response?.data?.message || 'Error al cargar votaciones'); }
    finally { setLoading(false); }
  }, [meetingId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Error en la operación'); }
    finally { setBusy(false); }
  };

  const createVote = async () => {
    if (!form.nombre.trim()) { setError(language === 'es' ? 'Ingresa el nombre.' : 'Enter a name.'); return; }
    await run(() => meetingService.createApprovalVote(meetingId, { nombre: form.nombre.trim(), punto_orden_dia: form.punto_orden_dia ? Number(form.punto_orden_dia) : null }));
    setForm({ nombre: '', punto_orden_dia: '' }); setShowForm(false);
  };

  const openPadron = async (avId) => {
    try {
      const res = await meetingService.getApprovalPadron(meetingId, avId);
      setPadron({ avId, list: res.data || [] });
    } catch (e) { setError(e.response?.data?.message || 'Error al cargar padrón'); }
  };

  const emitVote = async (avId, voterId, tipo) => {
    await run(() => meetingService.castApprovalVote(meetingId, avId, voterId, tipo));
    openPadron(avId);
  };

  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };
  const inputStyle = { padding: '7px 10px', borderRadius: 7, fontSize: 13, border: '1.5px solid var(--border,rgba(255,255,255,0.15))', background: 'var(--bg-input,rgba(255,255,255,0.05))', color: 'var(--text-primary)', outline: 'none' };
  const statusInfo = (s, decision) => ({
    open: { t: language === 'es' ? 'ABIERTA' : 'OPEN', c: '#10b981', icon: '✅' },
    draft: { t: language === 'es' ? 'BORRADOR' : 'DRAFT', c: '#94a3b8', icon: '📋' },
    closed: { t: decision || (language === 'es' ? 'CERRADA' : 'CLOSED'), c: decision === 'APROBADO' ? '#10b981' : '#ef4444', icon: '🔒' },
    tied: { t: language === 'es' ? 'EMPATE' : 'TIED', c: '#f59e0b', icon: '⚖️' }
  }[s] || { t: s, c: '#94a3b8', icon: '•' });

  const sessionActive = meetingStatus === 'active';
  const hayAbierta = votes.some(v => v.status === 'open');

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>🗳️ {language === 'es' ? 'Votaciones Documentales' : 'Document Votes'}</h3>
        {canOperate && sessionActive && !hayAbierta && (
          !showForm
            ? <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>{language === 'es' ? '+ Nueva votación' : '+ New vote'}</button>
            : null
        )}
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {showForm && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 180 }} placeholder={language === 'es' ? 'Nombre (ej: Estados Financieros 2025)' : 'Name'} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <input style={{ ...inputStyle, width: 90 }} type="number" placeholder={language === 'es' ? 'Punto #' : 'Point #'} value={form.punto_orden_dia} onChange={e => setForm(f => ({ ...f, punto_orden_dia: e.target.value }))} />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={createVote}>{language === 'es' ? 'Crear' : 'Create'}</button>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { setShowForm(false); setError(''); }}>{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
        </div>
      )}

      {votes.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary,#94a3b8)', margin: 0 }}>{language === 'es' ? 'No hay votaciones documentales.' : 'No document votes.'}</p>
      ) : votes.map(v => {
        const si = statusInfo(v.status, v.decision);
        const emitidos = Number(v.votos_a_favor || 0) + Number(v.votos_en_contra || 0) + Number(v.abstenciones || 0);
        const comput = Number(v.votos_a_favor || 0) + Number(v.votos_en_contra || 0);
        return (
          <div key={v.approval_vote_id} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.06))', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{v.punto_orden_dia ? `Punto ${v.punto_orden_dia} — ` : ''}{v.nombre}</span>
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: si.c }}>{si.icon} {si.t}</span>
              </div>
              {canOperate && sessionActive && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {v.status === 'draft' && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => meetingService.openApprovalVote(meetingId, v.approval_vote_id))}>{language === 'es' ? 'Abrir' : 'Open'}</button>}
                  {v.status === 'open' && <>
                    <button className="btn btn-secondary btn-sm" onClick={() => openPadron(v.approval_vote_id)}>{language === 'es' ? 'Votar / Padrón' : 'Vote / Roll'}</button>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => meetingService.closeApprovalVote(meetingId, v.approval_vote_id))}>{language === 'es' ? 'Cerrar' : 'Close'}</button>
                  </>}
                </div>
              )}
            </div>
            {(v.status === 'open' || v.status === 'closed' || v.status === 'tied') && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)', marginTop: 4 }}>
                {language === 'es' ? 'A favor' : 'For'}: <b style={{ color: '#10b981' }}>{v.votos_a_favor}</b> · {language === 'es' ? 'En contra' : 'Against'}: <b style={{ color: '#f87171' }}>{v.votos_en_contra}</b> · {language === 'es' ? 'Abstención' : 'Abstain'}: <b>{v.abstenciones}</b>
                {' · '}{language === 'es' ? 'Padrón' : 'Roll'}: {emitidos}/{v.total_padron}
                {' · '}{language === 'es' ? 'Computables' : 'Countable'}: {comput}
              </div>
            )}

            {/* Padrón + votación individual */}
            {padron && padron.avId === v.approval_vote_id && v.status === 'open' && (
              <div style={{ marginTop: 10, maxHeight: 300, overflowY: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 8 }}>
                {padron.list.map(p => (
                  <div key={p.member_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{p.vota_por_curso} — {p.nombre} {p.ha_votado && '✔'}</span>
                    {!p.ha_votado && canOperate && (
                      <span style={{ display: 'flex', gap: 4 }}>
                        <button title="A favor" className="btn btn-sm" style={{ background: '#10b981', color: '#fff', padding: '2px 8px' }} disabled={busy} onClick={() => emitVote(v.approval_vote_id, p.member_id, 'A_FAVOR')}>✓</button>
                        <button title="En contra" className="btn btn-sm" style={{ background: '#ef4444', color: '#fff', padding: '2px 8px' }} disabled={busy} onClick={() => emitVote(v.approval_vote_id, p.member_id, 'EN_CONTRA')}>✗</button>
                        <button title="Abstención" className="btn btn-sm" style={{ background: '#64748b', color: '#fff', padding: '2px 8px' }} disabled={busy} onClick={() => emitVote(v.approval_vote_id, p.member_id, 'ABSTENCION')}>—</button>
                      </span>
                    )}
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }} onClick={() => setPadron(null)}>{language === 'es' ? 'Cerrar padrón' : 'Close roll'}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssemblyApprovalPanel;
