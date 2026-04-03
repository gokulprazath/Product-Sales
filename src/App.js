import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage  from './pages/LoginPage';
import LogExpense from './pages/LogExpense';
import Lookup     from './pages/Lookup';
import History    from './pages/History';
import Header     from './components/Header';
import './App.css';

// ── Tabs layout (authenticated) ───────────────────────────
function Dashboard() {
  const [activeTab,      setActiveTab]      = useState('log');
  const [exportTrigger,  setExportTrigger]  = useState(0);

  const handleExport   = () => setExportTrigger(n => n + 1);
  const handleClearAll = () => { if (window.__clearAll) window.__clearAll(); };

  return (
    <>
      <Header onExport={handleExport} onClearAll={handleClearAll} />
      <div className="main">
        <div className="tabs">
          <button
            className={`tab${activeTab === 'log'     ? ' active' : ''}`}
            onClick={() => setActiveTab('log')}
          >📝 Log Expense</button>
          <button
            className={`tab${activeTab === 'lookup'  ? ' active' : ''}`}
            onClick={() => setActiveTab('lookup')}
          >🔍 Lookup Product</button>
          <button
            className={`tab${activeTab === 'history' ? ' active' : ''}`}
            onClick={() => setActiveTab('history')}
          >📋 History</button>
        </div>

        {activeTab === 'log'     && <LogExpense />}
        {activeTab === 'lookup'  && <Lookup />}
        {activeTab === 'history' && <History exportTrigger={exportTrigger} />}
      </div>
    </>
  );
}

// ── Auth guard ────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

// ── Root ──────────────────────────────────────────────────
// HashRouter ensures deep links work on GitHub Pages without a 404 redirect trick.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          } />
          <Route path="/" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
