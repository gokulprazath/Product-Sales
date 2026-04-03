import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

export default function Header({ onExport, onClearAll }) {
  const { user, signOut } = useAuth();

  return (
    <header className="app-header">
      <div className="logo">
        Expense<span>Track</span>
      </div>
      <div className="header-actions">
        {user && (
          <span className="header-email">{user.email}</span>
        )}
        <button className="btn" onClick={onExport}>⬇ Export Excel</button>
        <button className="btn danger" onClick={onClearAll}>Clear All</button>
        {user && (
          <button className="btn" onClick={signOut}>Sign Out</button>
        )}
      </div>
    </header>
  );
}
