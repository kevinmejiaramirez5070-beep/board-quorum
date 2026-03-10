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

  return (
    <div className="register-attendance">
      <div className="container">
        <button onClick={() => navigate(`/meetings/${meetingId}`)} className="btn-back">
          ← Volver a Reunión
        </button>

        <div className="form-header">
          <h1>Registrar Asistencia</h1>
        </div>

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
      </div>
    </div>
  );
};

export default RegisterAttendance;

