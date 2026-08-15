import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel de Generación de Acta (M8). Precondiciones, narrativas por punto,
 * descarga de PDF (borrador) y generación de Acta definitiva (solo admin_master).
 */
const AssemblyActaPanel = ({ meetingId }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [pre, setPre] = useState(null);
  const [narratives, setNarratives] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [drafts, setDrafts] = useState({}); // itemId -> text

  const canView = ['admin', 'admin_master'].includes(user?.role);
  const isMaster = user?.role === 'admin_master';

  const load = useCallback(async () => {
    try {
      const [p, n, a] = await Promise.all([
        meetingService.getActaPreconditions(meetingId).catch(() => ({ data: null })),
        meetingService.getActaNarratives(meetingId).catch(() => ({ data: [] })),
        meetingService.getAgenda(meetingId).catch(() => ({ data: null }))
      ]);
      setPre(p.data);
      setNarratives(n.data || []);
      setAgenda(a.data?.items || []);
      const d = {};
      (n.data || []).forEach(x => { d[x.agenda_item_id] = x.narrative_text || ''; });
      setDrafts(d);
      setError('');
    } catch (e) { setError(e.response?.data?.message || 'Error al cargar el acta'); }
    finally { setLoading(false); }
  }, [meetingId]);

  useEffect(() => { if (canView) load(); else setLoading(false); }, [load, canView]);

  if (!canView) return null;
  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };
  const inputStyle = { width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 12, border: '1.5px solid var(--border,rgba(255,255,255,0.15))', background: 'var(--bg-input,rgba(255,255,255,0.05))', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' };

  const saveNarr = async (itemId) => {
    setBusy(true); setError(''); setMsg('');
    try { await meetingService.saveActaNarrative(meetingId, itemId, drafts[itemId] || ''); setMsg(language === 'es' ? 'Narrativa guardada' : 'Saved'); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Error al guardar'); }
    finally { setBusy(false); }
  };

  const downloadPDF = async () => {
    setBusy(true); setError('');
    try {
      // asegurar borrador iniciado
      await meetingService.initActa(meetingId).catch(() => {});
      const res = await meetingService.downloadActaPDF(meetingId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `acta-asamblea-${meetingId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { setError(e.response?.data?.message || 'Error al generar el PDF'); }
    finally { setBusy(false); }
  };

  const closeActa = async () => {
    if (!window.confirm(language === 'es' ? '¿Generar el Acta DEFINITIVA? Esta acción es irreversible.' : 'Generate the FINAL minutes? This is irreversible.')) return;
    setBusy(true); setError(''); setMsg('');
    try {
      const res = await meetingService.closeActa(meetingId);
      setMsg(language === 'es' ? `Acta definitiva generada. Hash: ${res.data.pdf_hash?.slice(0, 16)}...` : `Final minutes generated.`);
      await load();
    } catch (e) {
      const d = e.response?.data;
      setError((d?.message || 'Error') + (d?.detalle ? ': ' + d.detalle.map(x => x.descripcion).join(', ') : ''));
    } finally { setBusy(false); }
  };

  return (
    <div style={card}>
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>📜 {language === 'es' ? 'Acta de la Asamblea' : 'Assembly Minutes'}</h3>
      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      {msg && <div style={{ color: '#10b981', fontSize: 13, marginBottom: 10 }}>{msg}</div>}

      {/* Precondiciones */}
      {pre && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary,#94a3b8)', marginBottom: 6 }}>
            {language === 'es' ? 'Precondiciones para Acta definitiva' : 'Preconditions for final minutes'}
          </div>
          {pre.precondiciones.map(p => (
            <div key={p.codigo} style={{ fontSize: 13, padding: '2px 0', color: p.cumplida ? '#10b981' : '#f87171' }}>
              {p.cumplida ? '✅' : '⛔'} {p.descripcion} <span style={{ color: 'var(--text-secondary,#94a3b8)' }}>({p.codigo})</span>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: pre.valida ? '#10b981' : '#f59e0b' }}>
            {pre.valida ? (language === 'es' ? '✅ Puede generar el Acta Definitiva' : '✅ Can generate final minutes') : (language === 'es' ? '⚠ Faltan precondiciones' : '⚠ Missing preconditions')}
          </div>
        </div>
      )}

      {/* Narrativas por punto */}
      {agenda.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary,#94a3b8)', marginBottom: 6 }}>
            {language === 'es' ? 'Narrativa por punto (opcional)' : 'Narrative per point (optional)'}
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {agenda.map(it => (
              <div key={it.agenda_item_id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, marginBottom: 2 }}>{it.numero}. {it.nombre}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <textarea rows={1} style={inputStyle} maxLength={2000} placeholder={language === 'es' ? 'Texto libre...' : 'Free text...'}
                    value={drafts[it.agenda_item_id] || ''} onChange={e => setDrafts(d => ({ ...d, [it.agenda_item_id]: e.target.value }))} />
                  <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => saveNarr(it.agenda_item_id)}>{language === 'es' ? 'Guardar' : 'Save'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" disabled={busy} onClick={downloadPDF}>
          {language === 'es' ? '⬇ Descargar PDF (borrador)' : '⬇ Download PDF (draft)'}
        </button>
        {isMaster && (
          <button className="btn btn-danger" disabled={busy || !pre?.valida} onClick={closeActa}
            title={!pre?.valida ? (language === 'es' ? 'Faltan precondiciones' : 'Missing preconditions') : ''}>
            🔒 {language === 'es' ? 'Generar Acta Definitiva' : 'Generate Final Minutes'}
          </button>
        )}
      </div>
      {pre?.acta?.status === 'final' && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#10b981' }}>
          ✅ {language === 'es' ? 'Acta definitiva generada (inmutable).' : 'Final minutes generated (immutable).'}
        </div>
      )}
    </div>
  );
};

export default AssemblyActaPanel;
