import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

/**
 * MD-09 — Solicitudes de validación de Delegado no encontrado.
 *
 * La solicitud llega con lo que declaró la persona (identificación, nombre y
 * curso) y con las posibles coincidencias del maestro, para que el operador
 * pueda corregir un registro existente en lugar de crear una segunda identidad.
 *
 * Al aprobar, el operador —no la persona— define curso y rol.
 */
const AssemblyContingencyPanel = ({ meetingId, onChange }) => {
  const { language } = useLanguage();
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState(null);   // attendance_id en revisión
  const [decision, setDecision] = useState({});   // { member_id, curso, rol, motivo }
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get(`/attendance/meeting/${meetingId}/pending`);
      setPendientes(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      // 403 significa que este usuario no opera la Asamblea: no es un error a mostrar.
      if (e.response?.status !== 403) console.warn('No se pudieron cargar las solicitudes:', e.message);
      setPendientes([]);
    } finally {
      setCargando(false);
    }
  }, [meetingId]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrir = (p) => {
    setError(null);
    setAbierta(p.attendance_id);
    const sugerida = p.posibles_coincidencias?.[0];
    setDecision({
      member_id: sugerida ? String(sugerida.member_id) : '',
      curso: p.curso || sugerida?.rol_organico || '',
      rol: sugerida?.member_type || 'principal',
      motivo: ''
    });
  };

  const resolver = async (attendanceId, accion) => {
    if (!decision.motivo?.trim()) {
      setError(language === 'es'
        ? 'Indique el motivo u observación de la contingencia.'
        : 'Please state the reason for this decision.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      if (accion === 'aprobar') {
        await api.patch(`/attendance/${attendanceId}/approve`, {
          // Con member_id se corrige el registro existente; sin él se incorpora
          // al maestro con el curso y rol que define el operador.
          member_id: decision.member_id ? Number(decision.member_id) : null,
          curso: decision.member_id ? null : decision.curso,
          rol: decision.member_id ? null : decision.rol,
          motivo: decision.motivo
        });
      } else {
        await api.patch(`/attendance/${attendanceId}/reject`, { motivo: decision.motivo });
      }
      setAbierta(null);
      await cargar();
      if (onChange) onChange();
    } catch (e) {
      setError(e.response?.data?.message || (language === 'es'
        ? 'No fue posible registrar la decisión.'
        : 'Could not record the decision.'));
    } finally {
      setEnviando(false);
    }
  };

  if (cargando || pendientes.length === 0) return null;

  const card = {
    background: 'var(--bg-card, #1e293b)',
    border: '1px solid rgba(245,158,11,0.45)',
    borderLeft: '4px solid #F59E0B',
    borderRadius: 12, padding: 18, marginBottom: 16
  };
  const fila = { padding: '12px 0', borderBottom: '1px solid var(--border)' };
  const etiqueta = { fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' };
  const inputStyle = {
    padding: '7px 10px', borderRadius: 7, fontSize: 13, width: '100%',
    border: '1.5px solid var(--border)', background: 'var(--bg-input)',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={card}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#B45309', marginBottom: 4 }}>
        ⚠️ {language === 'es' ? 'Solicitudes de validación pendientes' : 'Pending validation requests'} ({pendientes.length})
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.55 }}>
        {language === 'es'
          ? 'Personas cuyo documento no apareció en el maestro. Mientras estén pendientes no cuentan para quórum ni pueden votar.'
          : 'People whose ID was not found. While pending they do not count towards quorum and cannot vote.'}
      </p>

      {pendientes.map(p => (
        <div key={p.attendance_id} style={fila}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{p.nombre || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {language === 'es' ? 'Documento' : 'ID'}: {p.numero_documento || '—'}
                {p.curso ? ` · ${language === 'es' ? 'Curso declarado' : 'Course'}: ${p.curso}` : ''}
              </div>
            </div>
            {abierta !== p.attendance_id && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrir(p)}>
                {language === 'es' ? 'Revisar' : 'Review'}
              </button>
            )}
          </div>

          {abierta === p.attendance_id && (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {p.posibles_coincidencias?.length > 0 && (
                <div>
                  <div style={etiqueta}>
                    {language === 'es' ? 'Ya existe en el maestro' : 'Existing in master'}
                  </div>
                  <select
                    style={inputStyle}
                    value={decision.member_id}
                    onChange={e => setDecision(d => ({ ...d, member_id: e.target.value }))}
                  >
                    <option value="">
                      {language === 'es' ? '— No, incorporarlo como Delegado nuevo —' : '— No, add as new delegate —'}
                    </option>
                    {p.posibles_coincidencias.map(c => (
                      <option key={c.member_id} value={c.member_id}>
                        {c.name} · {c.rol_organico} · {c.member_type} · doc {c.numero_documento} ({c.motivos.join(', ')})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
                    {language === 'es'
                      ? 'Si es la misma persona con el dato mal digitado, elíjala aquí: se corrige su registro en vez de crear una segunda identidad.'
                      : 'If it is the same person with a typo, pick them here to correct the record instead of duplicating.'}
                  </p>
                </div>
              )}

              {!decision.member_id && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <div>
                    <div style={etiqueta}>{language === 'es' ? 'Curso' : 'Course'}</div>
                    <input
                      style={inputStyle}
                      value={decision.curso}
                      onChange={e => setDecision(d => ({ ...d, curso: e.target.value }))}
                      placeholder="QUINTO B"
                    />
                  </div>
                  <div>
                    <div style={etiqueta}>{language === 'es' ? 'Rol asignado' : 'Assigned role'}</div>
                    <select
                      style={inputStyle}
                      value={decision.rol}
                      onChange={e => setDecision(d => ({ ...d, rol: e.target.value }))}
                    >
                      <option value="principal">PRINCIPAL</option>
                      <option value="suplente">SUPLENTE</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <div style={etiqueta}>{language === 'es' ? 'Motivo / observación' : 'Reason'} *</div>
                <input
                  style={inputStyle}
                  value={decision.motivo}
                  onChange={e => setDecision(d => ({ ...d, motivo: e.target.value }))}
                  placeholder={language === 'es'
                    ? 'Ej: cédula mal digitada en el maestro, verificada contra documento físico'
                    : 'e.g. typo in master, verified against physical ID'}
                />
              </div>

              {error && (
                <div style={{ fontSize: 12.5, color: '#B91C1C', background: 'rgba(239,68,68,0.10)', padding: '8px 10px', borderRadius: 6 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary btn-sm" disabled={enviando}
                  onClick={() => resolver(p.attendance_id, 'aprobar')}>
                  {enviando ? '…' : (language === 'es' ? 'Aprobar' : 'Approve')}
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={enviando}
                  onClick={() => resolver(p.attendance_id, 'rechazar')}>
                  {language === 'es' ? 'Rechazar' : 'Reject'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" disabled={enviando}
                  onClick={() => { setAbierta(null); setError(null); }}>
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AssemblyContingencyPanel;
