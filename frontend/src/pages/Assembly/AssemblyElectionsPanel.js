import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel de Procesos Electorales (M4). Voto nominal. Elecciones unipersonales
 * (1 ganador por mayoría simple). Voto por candidato, en blanco o nulo (contingencia).
 */
const AssemblyElectionsPanel = ({ meetingId, meetingStatus }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', punto_orden_dia: '' });
  const [candForm, setCandForm] = useState({ eId: null, nombre: '' });
  const [candidates, setCandidates] = useState({}); // eId -> list
  const [padron, setPadron] = useState(null); // { eId, list }

  const canOperate = ['admin', 'admin_master', 'authorized'].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const res = await meetingService.getElections(meetingId);
      setElections(res.data || []); setError('');
    } catch (e) { setError(e.response?.data?.message || 'Error al cargar elecciones'); }
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

  const createElection = async () => {
    if (!form.nombre.trim()) { setError(language === 'es' ? 'Ingresa el nombre.' : 'Enter a name.'); return; }
    await run(() => meetingService.createElection(meetingId, { nombre: form.nombre.trim(), punto_orden_dia: form.punto_orden_dia ? Number(form.punto_orden_dia) : null }));
    setForm({ nombre: '', punto_orden_dia: '' }); setShowForm(false);
  };

  const loadCandidates = async (eId) => {
    try { const res = await meetingService.getCandidates(meetingId, eId); setCandidates(c => ({ ...c, [eId]: res.data || [] })); }
    catch (e) { setError(e.response?.data?.message || 'Error'); }
  };

  const addCandidate = async (eId) => {
    if (!candForm.nombre.trim()) return;
    await run(() => meetingService.addCandidate(meetingId, eId, { nombre: candForm.nombre.trim() }));
    setCandForm({ eId, nombre: '' });
    loadCandidates(eId);
  };

  const openPadron = async (eId) => {
    try {
      const [p, c] = await Promise.all([meetingService.getElectionPadron(meetingId, eId), meetingService.getCandidates(meetingId, eId)]);
      setPadron({ eId, list: p.data || [] });
      setCandidates(cc => ({ ...cc, [eId]: c.data || [] }));
    } catch (e) { setError(e.response?.data?.message || 'Error al cargar padrón'); }
  };

  const emitVote = async (eId, voterId, candidateId) => {
    await run(() => meetingService.castElectionVote(meetingId, eId, { voter_id: voterId, candidate_id: candidateId }));
    openPadron(eId);
  };

  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };
  const inputStyle = { padding: '7px 10px', borderRadius: 7, fontSize: 13, border: '1.5px solid var(--border,rgba(255,255,255,0.15))', background: 'var(--bg-input,rgba(255,255,255,0.05))', color: 'var(--text-primary)', outline: 'none' };
  const statusInfo = (s, res) => ({
    open: { t: language === 'es' ? 'ABIERTA' : 'OPEN', c: '#10b981', icon: '✅' },
    draft: { t: language === 'es' ? 'BORRADOR' : 'DRAFT', c: '#94a3b8', icon: '📋' },
    closed: { t: res?.ganador_nombre ? `${language === 'es' ? 'Ganó' : 'Winner'}: ${res.ganador_nombre}` : (language === 'es' ? 'CERRADA' : 'CLOSED'), c: '#10b981', icon: '🔒' },
    tied: { t: language === 'es' ? 'EMPATE' : 'TIED', c: '#f59e0b', icon: '⚖️' }
  }[s] || { t: s, c: '#94a3b8', icon: '•' });

  const sessionActive = meetingStatus === 'active';
  const hayAbierta = elections.some(e => e.status === 'open');

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>🗳️ {language === 'es' ? 'Procesos Electorales' : 'Elections'}</h3>
        {canOperate && sessionActive && !hayAbierta && !showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>{language === 'es' ? '+ Nueva elección' : '+ New election'}</button>
        )}
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {showForm && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 }}>
          <input style={{ ...inputStyle, flex: 1, minWidth: 180 }} placeholder={language === 'es' ? 'Nombre (ej: Revisor Fiscal)' : 'Name'} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          <input style={{ ...inputStyle, width: 90 }} type="number" placeholder={language === 'es' ? 'Punto #' : 'Point #'} value={form.punto_orden_dia} onChange={e => setForm(f => ({ ...f, punto_orden_dia: e.target.value }))} />
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={createElection}>{language === 'es' ? 'Crear' : 'Create'}</button>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { setShowForm(false); setError(''); }}>{language === 'es' ? 'Cancelar' : 'Cancel'}</button>
        </div>
      )}

      {elections.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary,#94a3b8)', margin: 0 }}>{language === 'es' ? 'No hay elecciones.' : 'No elections.'}</p>
      ) : elections.map(e => {
        const si = statusInfo(e.status, e.resultado);
        const cands = candidates[e.election_id] || [];
        return (
          <div key={e.election_id} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.06))', padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{e.punto_orden_dia ? `Punto ${e.punto_orden_dia} — ` : ''}{e.nombre}</span>
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: si.c }}>{si.icon} {si.t}</span>
              </div>
              {canOperate && sessionActive && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {e.status === 'draft' && <>
                    <button className="btn btn-secondary btn-sm" onClick={() => { loadCandidates(e.election_id); setCandForm({ eId: e.election_id, nombre: '' }); }}>{language === 'es' ? 'Candidatos' : 'Candidates'}</button>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => meetingService.openElection(meetingId, e.election_id))}>{language === 'es' ? 'Abrir' : 'Open'}</button>
                  </>}
                  {e.status === 'open' && <>
                    <button className="btn btn-secondary btn-sm" onClick={() => openPadron(e.election_id)}>{language === 'es' ? 'Votar / Padrón' : 'Vote / Roll'}</button>
                    <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => meetingService.closeElection(meetingId, e.election_id))}>{language === 'es' ? 'Cerrar' : 'Close'}</button>
                  </>}
                </div>
              )}
            </div>

            {/* Resultados */}
            {(e.status === 'open' || e.status === 'closed' || e.status === 'tied') && e.resultado && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)', marginTop: 4 }}>
                {(e.resultado.candidatos || []).map(c => `${c.nombre}: ${c.votos}`).join(' · ')}
                {' · '}{language === 'es' ? 'Emitidos' : 'Cast'}: {e.votos_emitidos}/{e.total_padron}
              </div>
            )}

            {/* Gestión de candidatos (draft) */}
            {candForm.eId === e.election_id && e.status === 'draft' && (
              <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8 }}>
                {cands.map(c => <div key={c.candidate_id} style={{ fontSize: 13, padding: '2px 0' }}>• {c.nombre}</div>)}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder={language === 'es' ? 'Nombre del candidato' : 'Candidate name'} value={candForm.nombre} onChange={ev => setCandForm(f => ({ ...f, nombre: ev.target.value }))} />
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => addCandidate(e.election_id)}>+</button>
                </div>
              </div>
            )}

            {/* Padrón + votación */}
            {padron && padron.eId === e.election_id && e.status === 'open' && (
              <div style={{ marginTop: 10, maxHeight: 300, overflowY: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 8 }}>
                {padron.list.map(p => (
                  <div key={p.member_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', borderBottom: '1px solid var(--border,rgba(255,255,255,0.04))' }}>
                    <span style={{ flex: 1, fontSize: 13 }}>{p.vota_por_curso} — {p.nombre} {p.ha_votado && '✔'}</span>
                    {!p.ha_votado && canOperate && (
                      <select style={{ ...inputStyle, fontSize: 12, padding: '3px 6px' }} defaultValue="" onChange={ev => { if (ev.target.value) emitVote(e.election_id, p.member_id, ev.target.value === 'blanco' ? null : Number(ev.target.value)); }}>
                        <option value="">{language === 'es' ? 'Votar por...' : 'Vote for...'}</option>
                        {cands.map(c => <option key={c.candidate_id} value={c.candidate_id}>{c.nombre}</option>)}
                        <option value="blanco">{language === 'es' ? 'Voto en blanco' : 'Blank'}</option>
                      </select>
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

export default AssemblyElectionsPanel;
