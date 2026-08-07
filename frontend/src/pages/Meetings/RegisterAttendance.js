import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../services/attendanceService';
import api from '../../services/api';
import './RegisterAttendance.css';

const RegisterAttendance = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [status, setStatus] = useState('present');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // MD-02 — registro masivo
  const [bulkMode, setBulkMode] = useState(false);
  const [checked, setChecked] = useState({}); // { memberId: true }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const meetingRes = await api.get(`/meetings/${meetingId}`);
        const meeting = meetingRes.data;
        const productId = meeting?.product_id ?? null;

        const membersRes = await api.get('/members');
        const list = Array.isArray(membersRes.data) ? membersRes.data : [];

        const filtered = list
          .filter(m => m != null)
          .filter(m => {
            const isActive = m.active === true || m.active === 1;
            if (!isActive) return false;
            if (productId == null) return true;
            return (m.product_id === productId) || m.product_id == null;
          })
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));

        setMembers(filtered);
      } catch (err) {
        console.error('Error loading members for attendance register:', err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [meetingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      alert('Por favor selecciona un miembro');
      return;
    }

    setSubmitting(true);
    try {
      await attendanceService.register(meetingId, {
        member_id: parseInt(selectedMember),
        status: status
      });
      alert('Asistencia registrada exitosamente');
      navigate(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Error registering attendance:', error);
      alert('Error al registrar la asistencia');
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = members.length > 0 && members.every(m => checked[m.id]);
  const someChecked = members.some(m => checked[m.id]);

  const toggleAll = () => {
    if (allChecked) { setChecked({}); }
    else { const next = {}; members.forEach(m => { next[m.id] = true; }); setChecked(next); }
  };

  const handleBulkSubmit = async () => {
    const ids = members.filter(m => checked[m.id]).map(m => m.id);
    if (ids.length === 0) { alert('Selecciona al menos un integrante'); return; }
    setSubmitting(true);
    try {
      const res = await attendanceService.registerBulk(meetingId, ids, 'present');
      const { registered, skipped } = res.data || {};
      alert(`Asistencia registrada. Nuevos: ${registered ?? ids.length}${skipped ? ` · Ya registrados: ${skipped}` : ''}`);
      navigate(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Error registering bulk attendance:', error);
      alert(error.response?.data?.message || 'Error al registrar la asistencia masiva');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-attendance">
      <div className="container">
        <button onClick={() => navigate(`/meetings/${meetingId}`)} className="btn-back">
          ← Volver a Reunión
        </button>

        <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1>Registrar Asistencia</h1>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setBulkMode(b => !b)}
          >
            {bulkMode ? 'Registro individual' : '☑ Registro masivo'}
          </button>
        </div>

        {bulkMode ? (
          <div className="attendance-form">
            <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: 14, marginBottom: 12 }}>
              Marca los integrantes presentes y regístralos todos de una vez.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--border, rgba(255,255,255,0.12))', marginBottom: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                {allChecked ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </label>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
                {members.filter(m => checked[m.id]).length} / {members.length}
              </span>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 16 }}>
              {loading ? <p>Cargando miembros...</p> : members.map(member => (
                <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--border, rgba(255,255,255,0.05))', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!checked[member.id]}
                    onChange={() => setChecked(c => ({ ...c, [member.id]: !c[member.id] }))}
                  />
                  <span style={{ fontWeight: 500 }}>{member.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                    {member.rol_organico || member.position || member.role || 'Miembro'}
                  </span>
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" disabled={submitting || !someChecked} onClick={handleBulkSubmit}>
                {submitting ? 'Registrando...' : `Registrar ${members.filter(m => checked[m.id]).length} asistencia(s)`}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/meetings/${meetingId}`)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label className="label">Miembro *</label>
            <select
              name="member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="input"
              required
              disabled={loading}
            >
              <option value="">{loading ? 'Cargando miembros...' : 'Selecciona un miembro'}</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} - {member.rol_organico || member.position || member.role || 'Miembro'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Estado de Asistencia *</label>
            <div className="status-options">
              <label className="status-option">
                <input
                  type="radio"
                  name="status"
                  value="present"
                  checked={status === 'present'}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className="status-label">
                  <span className="status-icon">✓</span>
                  Presente
                </span>
              </label>
              <label className="status-option">
                <input
                  type="radio"
                  name="status"
                  value="absent"
                  checked={status === 'absent'}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className="status-label">
                  <span className="status-icon">✗</span>
                  Ausente
                </span>
              </label>
              <label className="status-option">
                <input
                  type="radio"
                  name="status"
                  value="excused"
                  checked={status === 'excused'}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <span className="status-label">
                  <span className="status-icon">⊘</span>
                  Justificado
                </span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registrando...' : 'Registrar Asistencia'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/meetings/${meetingId}`)}
            >
              Cancelar
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default RegisterAttendance;

