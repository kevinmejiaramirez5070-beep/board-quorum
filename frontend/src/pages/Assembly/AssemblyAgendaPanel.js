import React, { useState, useEffect, useCallback } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Panel del Orden del Día (M6). Permite crear/publicar la agenda y avanzar los puntos.
 */
const AssemblyAgendaPanel = ({ meetingId, meetingStatus }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'admin_master';
  const canOperate = canEdit || user?.role === 'authorized';

  const load = useCallback(async () => {
    try {
      const res = await meetingService.getAgenda(meetingId);
      setAgenda(res.data && res.data.status ? res.data : null);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(true); setError('');
    try { await fn(); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Error en la operación'); }
    finally { setBusy(false); }
  };

  if (loading) return null;

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 18, marginBottom: 16 };

  // Sin agenda todavía
  if (!agenda) {
    return (
      <div style={card}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>📋 {language === 'es' ? 'Orden del Día' : 'Agenda'}</h3>
        <p style={{ color: 'var(--text-secondary,#94a3b8)', fontSize: 14, margin: '0 0 12px' }}>
          {language === 'es' ? 'Esta sesión aún no tiene Orden del Día.' : 'This session has no agenda yet.'}
        </p>
        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}
        {canOperate && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={busy}
              onClick={() => run(() => meetingService.loadAgendaTemplate(meetingId))}>
              {language === 'es' ? 'Precargar 15 puntos ordinarios' : 'Load 15 standard points'}
            </button>
            <button className="btn btn-secondary" disabled={busy}
              onClick={() => run(() => meetingService.createAgenda(meetingId, 'ordinaria'))}>
              {language === 'es' ? 'Crear Orden del Día vacío' : 'Create empty agenda'}
            </button>
          </div>
        )}
      </div>
    );
  }

  const statusInfo = {
    draft: { label: language === 'es' ? 'BORRADOR' : 'DRAFT', color: '#6B7280' },
    published: { label: language === 'es' ? 'PUBLICADO' : 'PUBLISHED', color: '#10b981' },
    closed: { label: language === 'es' ? 'CERRADO' : 'CLOSED', color: '#64748b' }
  }[agenda.status] || { label: agenda.status, color: '#6B7280' };

  const itemIcon = (s) => s === 'completado' ? '✅' : s === 'en_curso' ? '▶️' : s === 'omitido' ? '⊘' : '⏳';
  const tipoLabel = (t) => ({
    procedural: 'procedural', informativo: 'informativo',
    votacion_documental: language === 'es' ? 'votación' : 'vote',
    eleccion: language === 'es' ? 'elección' : 'election'
  }[t] || t);

  const sessionActive = meetingStatus === 'active';

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>📋 {language === 'es' ? 'Orden del Día' : 'Agenda'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: statusInfo.color, border: `1px solid ${statusInfo.color}55`, borderRadius: 12, padding: '2px 10px' }}>{statusInfo.label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary,#94a3b8)' }}>
            {agenda.puntos_completados}/{agenda.total_puntos} ({agenda.porcentaje_avance}%)
          </span>
        </div>
      </div>

      {/* barra de avance */}
      <div style={{ height: 6, background: 'var(--track, rgba(255,255,255,0.08))', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${agenda.porcentaje_avance}%`, background: '#10b981', transition: 'width .4s' }} />
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      {agenda.status === 'draft' && canOperate && (
        <button className="btn btn-primary" disabled={busy} style={{ marginBottom: 12 }}
          onClick={() => run(() => meetingService.publishAgenda(meetingId), language === 'es' ? '¿Publicar el Orden del Día?' : 'Publish the agenda?')}>
          {language === 'es' ? 'Publicar Orden del Día' : 'Publish agenda'}
        </button>
      )}

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {agenda.items.map(it => (
          <div key={it.agenda_item_id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
            borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))',
            opacity: it.status === 'omitido' ? 0.5 : 1,
            background: it.status === 'en_curso' ? 'rgba(16,185,129,0.06)' : 'transparent'
          }}>
            <span style={{ fontSize: 15 }}>{itemIcon(it.status)}</span>
            <span style={{ width: 22, textAlign: 'right', color: 'var(--text-secondary,#94a3b8)', fontSize: 13 }}>{it.numero}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--text-primary,#f1f5f9)' }}>
                {it.nombre} {it.emergente && <em style={{ fontSize: 11, color: '#f59e0b' }}>({language === 'es' ? 'emergente' : 'added'})</em>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary,#94a3b8)' }}>
                [{tipoLabel(it.tipo)}]{it.resultado_resumen ? ` · ${it.resultado_resumen}` : ''}
              </div>
            </div>
            {canOperate && agenda.status === 'published' && sessionActive && (
              <div style={{ display: 'flex', gap: 6 }}>
                {it.status === 'pendiente' && (
                  <button className="btn btn-secondary btn-sm" disabled={busy}
                    onClick={() => run(() => meetingService.startAgendaItem(meetingId, it.agenda_item_id))}>
                    {language === 'es' ? 'Iniciar' : 'Start'}
                  </button>
                )}
                {it.status === 'en_curso' && (
                  <button className="btn btn-primary btn-sm" disabled={busy}
                    onClick={() => run(() => meetingService.completeAgendaItem(meetingId, it.agenda_item_id))}>
                    {language === 'es' ? 'Completar' : 'Complete'}
                  </button>
                )}
                {it.status === 'pendiente' && canEdit && (
                  <button className="btn btn-secondary btn-sm" disabled={busy}
                    onClick={() => run(() => meetingService.skipAgendaItem(meetingId, it.agenda_item_id), language === 'es' ? '¿Omitir este punto? No se puede revertir.' : 'Skip this point?')}>
                    ⊘
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssemblyAgendaPanel;
