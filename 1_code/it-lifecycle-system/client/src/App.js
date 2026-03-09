import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmployeeSearch from './pages/EmployeeSearch';
import TaskDetail from './pages/TaskDetail';
import TaskList from './pages/TaskList';
import MappingConfig from './pages/MappingConfig';
import AuditLog from './pages/AuditLog';
import ReportGeneration from './pages/ReportGeneration';
import AccessRequests from './pages/AccessRequests';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

// Simple auth guard — redirect to login if no token
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Minimal login page inline (full login page can be built out separately)
function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f4f6f8' }}>
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, minWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#1565c0' }}>IT Lifecycle System</h2>
          {error && <p style={{ color: '#c62828', marginBottom: '1rem' }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <input
              type="text" placeholder="Username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: '1rem', padding: '0.5rem', boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: '1.5rem', padding: '0.5rem', boxSizing: 'border-box', borderRadius: 4, border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ width: '100%', padding: '0.625rem', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1rem' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
}


export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/employees" element={<EmployeeSearch />} />
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/:id" element={<TaskDetail />} />
                  <Route path="/mappings" element={<MappingConfig />} />
                  <Route path="/audit" element={<AuditLog />} />
                  <Route path="/reports" element={<ReportGeneration />} />
                  <Route path="/access-requests" element={<AccessRequests />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
