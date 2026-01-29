import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
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
import RegisterAttendance from './pages/Meetings/RegisterAttendance';
import VotingDetail from './pages/Voting/VotingDetail';
import VotingResults from './pages/Voting/VotingResults';
import CreateVoting from './pages/Voting/CreateVoting';
import PublicVoting from './pages/Voting/PublicVoting';
import PublicAttendanceRegister from './pages/Meetings/PublicAttendanceRegister';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <OrganizationColors />
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

