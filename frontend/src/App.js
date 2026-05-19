import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { useLanguage } from './context/LanguageContext';
import Header from './components/Layout/Header';
import OrganizationColors from './components/OrganizationColors/OrganizationColors';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';
import Organizations from './pages/Admin/Organizations';
import Members from './pages/Admin/Members';
import MeetingsList from './pages/Meetings/MeetingsList';
import MeetingDetail from './pages/Meetings/MeetingDetail';
import CreateMeeting from './pages/Meetings/CreateMeeting';
import EditMeeting from './pages/Meetings/EditMeeting';
import ProductsList from './pages/Products/ProductsList';
import RegisterAttendance from './pages/Meetings/RegisterAttendance';
import VotingDetail from './pages/Voting/VotingDetail';
import VotingResults from './pages/Voting/VotingResults';
import CreateVoting from './pages/Voting/CreateVoting';
import PublicVoting from './pages/Voting/PublicVoting';
import PublicAttendanceRegister from './pages/Meetings/PublicAttendanceRegister';
import './styles/global.css';

const OperatorValidationModal = () => {
  const { needsOperatorValidation, validateOperatorIdentity, logout } = useAuth();
  const { language } = useLanguage();
  const [doc, setDoc] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!needsOperatorValidation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doc.trim()) return;
    setLoading(true);
    setError('');
    const result = await validateOperatorIdentity(doc.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.message || (language === 'es' ? 'Documento no válido' : 'Invalid document'));
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: 'var(--bg-card, #1e293b)', borderRadius: '12px',
        padding: '40px 36px', maxWidth: '420px', width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)', border: '1px solid var(--border, rgba(255,255,255,0.1))'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary, #f1f5f9)', fontSize: '20px' }}>
            {language === 'es' ? 'Validación de identidad' : 'Identity Validation'}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary, #94a3b8)', fontSize: '14px', lineHeight: 1.5 }}>
            {language === 'es'
              ? 'Ingrese su número de cédula para confirmar su identidad como operador autorizado.'
              : 'Enter your ID number to confirm your identity as an authorized operator.'}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', fontWeight: 600 }}>
              {language === 'es' ? 'Número de cédula' : 'ID Number'}
            </label>
            <input
              type="text"
              value={doc}
              onChange={e => { setDoc(e.target.value); setError(''); }}
              placeholder={language === 'es' ? 'Ej: 12345678' : 'e.g. 12345678'}
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '15px',
                border: error ? '1.5px solid #ef4444' : '1.5px solid var(--border, rgba(255,255,255,0.15))',
                background: 'var(--bg-input, rgba(255,255,255,0.05))', color: 'var(--text-primary, #f1f5f9)',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          {error && (
            <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', color: '#f87171', fontSize: '13px' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !doc.trim()}
            style={{
              width: '100%', padding: '11px', borderRadius: '8px', fontSize: '15px', fontWeight: 600,
              background: loading || !doc.trim() ? 'rgba(99,102,241,0.4)' : 'var(--primary, #6366f1)',
              color: '#fff', border: 'none', cursor: loading || !doc.trim() ? 'not-allowed' : 'pointer',
              marginBottom: '12px'
            }}
          >
            {loading
              ? (language === 'es' ? 'Verificando...' : 'Verifying...')
              : (language === 'es' ? 'Confirmar identidad' : 'Confirm Identity')}
          </button>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%', padding: '9px', borderRadius: '8px', fontSize: '14px',
              background: 'transparent', color: 'var(--text-secondary, #94a3b8)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))', cursor: 'pointer'
            }}
          >
            {language === 'es' ? 'Cancelar y cerrar sesión' : 'Cancel and log out'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <OrganizationColors />
              <OperatorValidationModal />
              <Header />
              <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/organizations" 
              element={
                <ProtectedRoute>
                  <Organizations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/members" 
              element={
                <ProtectedRoute>
                  <Members />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute>
                  <ProductsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products/:productId/meetings" 
              element={
                <ProtectedRoute>
                  <MeetingsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products/:productId/meetings/new" 
              element={
                <ProtectedRoute>
                  <CreateMeeting />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings" 
              element={
                <ProtectedRoute>
                  <MeetingsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/new" 
              element={
                <ProtectedRoute>
                  <CreateMeeting />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditMeeting />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:id" 
              element={
                <ProtectedRoute>
                  <MeetingDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:meetingId/attendance/register" 
              element={
                <ProtectedRoute>
                  <RegisterAttendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:meetingId/votings/new" 
              element={
                <ProtectedRoute>
                  <CreateVoting />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:meetingId/voting/:votingId" 
              element={
                <ProtectedRoute>
                  <VotingDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings/:meetingId/voting/:votingId/results" 
              element={
                <ProtectedRoute>
                  <VotingResults />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/public/voting/:votingId" 
              element={<PublicVoting />} 
            />
            {/* VOT-LINK fix: ruta dinámica que muestra la votación ACTIVA de la reunión */}
            <Route 
              path="/public/meeting/:meetingId/vote" 
              element={<PublicVoting meetingMode />} 
            />
            <Route 
              path="/public/meeting/:meetingId/attendance" 
              element={<PublicAttendanceRegister />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

