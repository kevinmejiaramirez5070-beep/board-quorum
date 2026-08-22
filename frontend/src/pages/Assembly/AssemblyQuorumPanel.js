import React, { useState, useEffect, useRef } from 'react';
import { meetingService } from '../../services/meetingService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Panel de quórum de Asamblea (M1). Cuenta por CURSOS representados.
 * Se actualiza por polling cada 5s (VF-01 default).
 */
const AssemblyQuorumPanel = ({ meetingId }) => {
  const { language } = useLanguage();
  const [panel, setPanel] = useState(null);
  const [error, setError] = useState('');
  const [showCourses, setShowCourses] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const fetchPanel = async () => {
      try {
        const res = await meetingService.getAssemblyQuorum(meetingId);
        if (mounted) { setPanel(res.data); setError(''); }
      } catch (e) {
        if (mounted) setError(e.response?.data?.message || 'Error al cargar el quórum');
      }
    };
    fetchPanel();
    timerRef.current = setInterval(fetchPanel, 5000);
    return () => { mounted = false; clearInterval(timerRef.current); };
  }, [meetingId]);

  if (error && !panel) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 14, color: '#f87171', fontSize: 13 }}>
        {error}
      </div>
    );
  }
  if (!panel) return null;

  const estadoInfo = {
    MOMENTO_1: { label: language === 'es' ? 'MOMENTO 1 — Quórum pleno' : 'MOMENT 1 — Full quorum', color: '#10b981', icon: '✅' },
    MOMENTO_2: { label: language === 'es' ? 'MOMENTO 2 — Segunda convocatoria' : 'MOMENT 2', color: '#f59e0b', icon: '⚠️' },
    SIN_QUORUM: { label: language === 'es' ? 'SIN QUÓRUM' : 'NO QUORUM', color: '#ef4444', icon: '❌' }
  }[panel.estado] || { label: panel.estado, color: '#6B7280', icon: '•' };

  const wrap = { background: 'var(--bg-card, #1e293b)', border: `1px solid ${estadoInfo.color}55`, borderRadius: 12, padding: 18, marginBottom: 16 };
  const grid = { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 };
  const stat = { textAlign: 'center', flex: 1, minWidth: 90 };
  const num = { fontSize: 24, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' };
  const lbl = { fontSize: 11, color: 'var(--text-secondary, #94a3b8)', marginTop: 2 };

  // Sin universo de elegibles el panel mostraba "0 / 0" sin explicar nada.
  // El diagnóstico distingue "nadie ha llegado" de "falta cargar el maestro".
  const diag = panel.diagnostico_universo;

  return (
    <div style={wrap}>
      {diag && !diag.ok && (
        <div style={{
          background: 'rgba(245,158,11,0.10)',
          border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 9,
          padding: '11px 14px',
          marginBottom: 14,
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-primary)'
        }}>
          <strong style={{ color: '#B45309' }}>
            ⚠️ {language === 'es' ? 'No hay universo de elegibles' : 'No eligible universe'}
          </strong>
          <div style={{ marginTop: 5 }}>{diag.mensaje}</div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)' }}>
            {language === 'es' ? 'Quórum de Asamblea (por cursos)' : 'Assembly Quorum (by courses)'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: estadoInfo.color }}>
            {estadoInfo.icon} {estadoInfo.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: estadoInfo.color }}>
            {panel.cursos_representados} / {panel.cursos_habilitados}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary,#94a3b8)' }}>
            {language === 'es' ? 'cursos representados' : 'courses represented'}
          </div>
        </div>
      </div>

      {/* Barra hacia el umbral de Momento 1 */}
      <div style={{ marginTop: 12, height: 8, background: 'var(--track, rgba(255,255,255,0.08))', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, panel.quorum_m1 ? (panel.cursos_representados / panel.quorum_m1) * 100 : 0)}%`,
          background: estadoInfo.color, transition: 'width .4s'
        }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary,#94a3b8)', marginTop: 4 }}>
        {language === 'es'
          ? `Requerido: Momento 1 = ${panel.quorum_m1} cursos · Momento 2 = ${panel.quorum_m2} cursos · Total principales = ${panel.total_principales}`
          : `Required: Moment 1 = ${panel.quorum_m1} · Moment 2 = ${panel.quorum_m2} · Total principals = ${panel.total_principales}`}
      </div>

      <div style={grid}>
        <div style={stat}><div style={num}>{panel.principales_presentes}</div><div style={lbl}>{language === 'es' ? 'Principales' : 'Principals'}</div></div>
        <div style={stat}><div style={num}>{panel.suplentes_actuando}</div><div style={lbl}>{language === 'es' ? 'Suplentes actuando' : 'Acting subs'}</div></div>
        <div style={stat}><div style={num}>{panel.representaciones_por_poder}</div><div style={lbl}>{language === 'es' ? 'Poderes' : 'Proxies'}</div></div>
        <div style={stat}><div style={num}>{panel.cursos_representados}</div><div style={lbl}>{language === 'es' ? 'Representados' : 'Represented'}</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <button
          onClick={() => setShowCourses(s => !s)}
          style={{ background: 'transparent', border: '1px solid var(--border,rgba(255,255,255,0.15))', color: 'var(--text-secondary,#94a3b8)', borderRadius: 7, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
        >
          {showCourses ? (language === 'es' ? 'Ocultar cursos' : 'Hide courses') : (language === 'es' ? 'Ver cursos' : 'View courses')}
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-secondary,#94a3b8)' }}>
          {language === 'es' ? 'Actualización automática cada 5s' : 'Auto-refresh every 5s'}
        </span>
      </div>

      {showCourses && (
        <div style={{ marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-secondary,#94a3b8)', borderBottom: '1px solid var(--border,rgba(255,255,255,0.1))' }}>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Curso' : 'Course'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Representado' : 'Represented'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Votante' : 'Voter'}</th>
                <th style={{ padding: '5px 6px' }}>{language === 'es' ? 'Tipo' : 'Type'}</th>
              </tr>
            </thead>
            <tbody>
              {(panel.cursos || []).map((c, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))', opacity: c.representado ? 1 : 0.5 }}>
                  <td style={{ padding: '5px 6px' }}>{c.curso}</td>
                  <td style={{ padding: '5px 6px', color: c.representado ? '#10b981' : '#f87171' }}>{c.representado ? '✔' : '—'}</td>
                  <td style={{ padding: '5px 6px' }}>{c.votante_nombre || '—'}</td>
                  <td style={{ padding: '5px 6px' }}>
                    {c.tipo_votante === 'suplente' ? (language === 'es' ? 'Suplente actuando' : 'Acting sub') : c.tipo_votante === 'principal' ? (language === 'es' ? 'Principal' : 'Principal') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssemblyQuorumPanel;
