import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assemblyService } from '../../services/assemblyService';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AssemblyMaster = () => {
  const { productId } = useParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showList, setShowList] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'admin_master';

  useEffect(() => {
    load();
  }, [productId]);

  const load = async () => {
    setLoading(true);
    try {
      const [prod, sum] = await Promise.all([
        api.get(`/products/${productId}`).catch(() => ({ data: null })),
        assemblyService.getSummary(productId)
      ]);
      setProduct(prod.data);
      setSummary(sum.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar el estado del maestro');
    } finally {
      setLoading(false);
    }
  };

  const loadMembersList = async () => {
    try {
      const res = await assemblyService.getMembers(productId);
      setMembers(res.data || []);
      setShowList(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar la lista');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    try {
      const res = await assemblyService.importMembers(productId, file, 'upsert');
      setResult(res.data);
      setSummary(res.data.summary);
      if (showList) loadMembersList();
    } catch (e) {
      if (e.response?.status === 423) {
        setError(language === 'es'
          ? 'Sesión activa — el maestro está bloqueado. No se puede cargar durante una sesión en curso.'
          : 'Active session — master is locked.');
      } else if (e.response?.status === 422) {
        setError((language === 'es' ? 'Errores bloqueantes: ' : 'Blocking errors: ') +
          (e.response.data.blocking || []).join(' | '));
      } else {
        setError(e.response?.data?.message || 'Error al cargar el archivo');
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Edición individual: corregir un dato puntual sin recargar todo el maestro.
  const [editando, setEditando] = useState(null);   // { id, name, numero_documento, rol_organico, member_type }
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState(null);

  const abrirEdicion = (m) => {
    setErrorEdicion(null);
    setEditando({
      id: m.id,
      name: m.name || '',
      numero_documento: m.numero_documento || '',
      rol_organico: m.rol_organico || '',
      member_type: m.member_type === 'suplente' ? 'suplente' : 'principal'
    });
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    setErrorEdicion(null);
    try {
      const res = await assemblyService.updateMember(productId, editando.id, {
        name: editando.name,
        numero_documento: editando.numero_documento,
        rol_organico: editando.rol_organico,
        member_type: editando.member_type
      });
      setSummary(res.data.summary);
      setEditando(null);
      loadMembersList();
    } catch (e) {
      setErrorEdicion(e.response?.data?.message ||
        (language === 'es' ? 'No fue posible guardar el cambio.' : 'Could not save the change.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleDeactivate = async (memberId) => {
    if (!window.confirm(language === 'es' ? '¿Desactivar este delegado?' : 'Deactivate this delegate?')) return;
    try {
      const res = await assemblyService.deactivateMember(productId, memberId);
      setSummary(res.data.summary);
      loadMembersList();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al desactivar');
    }
  };

  if (loading) return <div className="loading" style={{ padding: 40 }}>{language === 'es' ? 'Cargando...' : 'Loading...'}</div>;

  const estado = summary?.maestro_listo
    ? { txt: language === 'es' ? 'LISTO' : 'READY', color: '#10b981', icon: '✅' }
    : summary?.total_principals > 0
      ? { txt: language === 'es' ? 'CON ERRORES' : 'WITH ERRORS', color: '#f59e0b', icon: '⚠️' }
      : { txt: language === 'es' ? 'VACÍO' : 'EMPTY', color: '#ef4444', icon: '❌' };

  const card = { background: 'var(--bg-card, #1e293b)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: 20 };
  const stat = { textAlign: 'center', flex: 1, minWidth: 110 };
  const statNum = { fontSize: 28, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' };
  const statLbl = { fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 4 };

  return (
    <div className="container" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/products')} className="btn-back" style={{ marginBottom: 16 }}>
        ← {language === 'es' ? 'Volver' : 'Back'}
      </button>

      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary,#94a3b8)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {language === 'es' ? 'Maestro de Delegados' : 'Delegate Master'}
        </p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>{product?.name || (language === 'es' ? 'Asamblea' : 'Assembly')}</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, margin: '12px 0', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Estado del maestro */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{estado.icon}</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)' }}>{language === 'es' ? 'Estado del maestro' : 'Master status'}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: estado.color }}>{estado.txt}</div>
            </div>
          </div>
          {canEdit && (
            <div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} style={{ display: 'none' }} id="master-file" />
              <label htmlFor="master-file" className="btn btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1, padding: '10px 20px' }}>
                {uploading ? (language === 'es' ? 'Cargando...' : 'Uploading...') : (language === 'es' ? '📤 Cargar maestro (.xlsx)' : '📤 Upload master (.xlsx)')}
              </label>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={stat}><div style={statNum}>{summary?.total_principals ?? 0}</div><div style={statLbl}>{language === 'es' ? 'Principales' : 'Principals'}</div></div>
          <div style={stat}><div style={statNum}>{summary?.total_suplentes ?? 0}</div><div style={statLbl}>{language === 'es' ? 'Suplentes' : 'Substitutes'}</div></div>
          <div style={stat}><div style={statNum}>{summary?.cursos_con_principal ?? 0}</div><div style={statLbl}>{language === 'es' ? 'Cursos c/ principal' : 'Courses w/ principal'}</div></div>
          <div style={stat}><div style={{ ...statNum, color: (summary?.vinculos_rotos ?? 0) > 0 ? '#f87171' : statNum.color }}>{summary?.vinculos_rotos ?? 0}</div><div style={statLbl}>{language === 'es' ? 'Vínculos rotos' : 'Broken links'}</div></div>
          <div style={stat}><div style={statNum}>{summary?.sin_suplente ?? 0}</div><div style={statLbl}>{language === 'es' ? 'Sin suplente' : 'No substitute'}</div></div>
        </div>

        {summary?.ultima_carga && (
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-secondary,#94a3b8)', textAlign: 'right' }}>
            {language === 'es' ? 'Última carga: ' : 'Last upload: '}
            {new Date(summary.ultima_carga).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
          </div>
        )}
      </div>

      {/* Resultado de la última carga */}
      {result && (
        <div style={{ ...card, marginTop: 16 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{language === 'es' ? 'Resultado de la carga' : 'Upload result'}</h3>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 14 }}>
            <span>📄 {language === 'es' ? 'Total' : 'Total'}: <b>{result.total}</b></span>
            <span style={{ color: '#10b981' }}>✔ OK: <b>{result.ok}</b></span>
            <span style={{ color: '#f59e0b' }}>⏭ {language === 'es' ? 'Omitidos' : 'Skipped'}: <b>{result.skipped}</b></span>
            <span style={{ color: '#f87171' }}>✖ {language === 'es' ? 'Errores' : 'Errors'}: <b>{result.errors}</b></span>
            <span>🔗 {language === 'es' ? 'Vinculados' : 'Linked'}: <b>{result.link?.linked ?? 0}</b></span>
          </div>
          {result.invalidRows?.length > 0 && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: '#f87171', fontSize: 13 }}>
                {language === 'es' ? `Ver ${result.invalidRows.length} registro(s) con error` : `View ${result.invalidRows.length} error row(s)`}
              </summary>
              <ul style={{ fontSize: 12, color: 'var(--text-secondary,#94a3b8)', marginTop: 6 }}>
                {result.invalidRows.slice(0, 50).map((r, i) => (
                  <li key={i}>{language === 'es' ? 'Fila' : 'Row'} {r.row} ({r.numero_documento || 's/doc'}): {r.motivo}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Lista completa */}
      <div style={{ marginTop: 16 }}>
        {!showList ? (
          <button className="btn btn-secondary" onClick={loadMembersList}>
            {language === 'es' ? 'Ver lista completa de delegados' : 'View full delegate list'}
          </button>
        ) : (
          <div style={{ ...card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{language === 'es' ? `Delegados (${members.length})` : `Delegates (${members.length})`}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowList(false)}>{language === 'es' ? 'Ocultar' : 'Hide'}</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-secondary,#94a3b8)', borderBottom: '1px solid var(--border,rgba(255,255,255,0.1))' }}>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Curso' : 'Course'}</th>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Nombre' : 'Name'}</th>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Documento' : 'Document'}</th>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Tipo' : 'Type'}</th>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Principal' : 'Principal'}</th>
                    <th style={{ padding: '6px 8px' }}>{language === 'es' ? 'Activo' : 'Active'}</th>
                    {canEdit && <th style={{ padding: '6px 8px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border,rgba(255,255,255,0.05))', opacity: m.active ? 1 : 0.45 }}>
                      <td style={{ padding: '6px 8px' }}>{m.rol_organico || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{m.name}</td>
                      <td style={{ padding: '6px 8px' }}>{m.numero_documento || '-'}</td>
                      <td style={{ padding: '6px 8px' }}>{m.member_type === 'suplente' ? (language === 'es' ? 'Suplente' : 'Substitute') : m.member_type === 'junta_vigilancia' ? 'JV' : (language === 'es' ? 'Principal' : 'Principal')}</td>
                      <td style={{ padding: '6px 8px', color: m.member_type === 'suplente' && !m.principal_name ? '#f87171' : undefined }}>
                        {m.member_type === 'suplente' ? (m.principal_name || (language === 'es' ? '⚠ sin vínculo' : '⚠ no link')) : '—'}
                      </td>
                      <td style={{ padding: '6px 8px' }}>{m.active ? '✔' : '✕'}</td>
                      {canEdit && (
                        <td style={{ padding: '6px 8px' }}>
                          {m.active && (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button onClick={() => abrirEdicion(m)} title={language === 'es' ? 'Editar' : 'Edit'}
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>
                                ✏️ {language === 'es' ? 'Editar' : 'Edit'}
                              </button>
                              <button onClick={() => handleDeactivate(m.id)} title={language === 'es' ? 'Desactivar' : 'Deactivate'}
                                style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}>
                                {language === 'es' ? 'Desactivar' : 'Deactivate'}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Edición individual del Maestro. Guarda con las mismas validaciones de
          la carga masiva: documento único, un Principal y un Suplente por curso,
          y recálculo de vínculos e indicadores. */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card, #fff)', borderRadius: 12, padding: 22,
            width: '100%', maxWidth: 460, border: '1px solid var(--border)'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 17, color: 'var(--text-primary)' }}>
              ✏️ {language === 'es' ? 'Editar Delegado' : 'Edit delegate'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {language === 'es'
                ? 'Corrección puntual. No hace falta volver a cargar el Excel completo.'
                : 'Single-record fix. No need to reload the whole spreadsheet.'}
            </p>

            {[
              ['name', language === 'es' ? 'Nombre' : 'Name', 'text'],
              ['numero_documento', language === 'es' ? 'Número de identificación' : 'ID number', 'text'],
              ['rol_organico', language === 'es' ? 'Curso' : 'Course', 'text']
            ].map(([campo, etiqueta, tipo]) => (
              <div key={campo} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)', marginBottom: 5 }}>
                  {etiqueta}
                </label>
                <input
                  type={tipo}
                  value={editando[campo]}
                  onChange={e => setEditando(v => ({ ...v, [campo]: e.target.value }))}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
                    border: '1.5px solid var(--border)', background: 'var(--bg-input)',
                    color: 'var(--text-primary)', boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-secondary)', marginBottom: 5 }}>
                {language === 'es' ? 'Rol' : 'Role'}
              </label>
              <select
                value={editando.member_type}
                onChange={e => setEditando(v => ({ ...v, member_type: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
                  border: '1.5px solid var(--border)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', boxSizing: 'border-box'
                }}
              >
                <option value="principal">PRINCIPAL</option>
                <option value="suplente">SUPLENTE</option>
              </select>
            </div>

            {errorEdicion && (
              <div style={{
                fontSize: 12.5, color: '#B91C1C', background: 'rgba(239,68,68,0.10)',
                padding: '9px 11px', borderRadius: 7, marginBottom: 12, lineHeight: 1.5
              }}>
                {errorEdicion}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditando(null); setErrorEdicion(null); }} disabled={guardando}
                className="btn btn-secondary btn-sm">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button onClick={guardarEdicion} disabled={guardando} className="btn btn-primary btn-sm">
                {guardando
                  ? (language === 'es' ? 'Guardando…' : 'Saving…')
                  : (language === 'es' ? 'Guardar cambios' : 'Save changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyMaster;
