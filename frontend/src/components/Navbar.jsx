import React from 'react';

export default function Navbar({ currentView, setView, user, onLogout }) {
  const roleBadgeColors = {
    Admin: 'bg-rose-900 text-rose-100 border border-rose-700',
    Inspector: 'bg-blue-900 text-blue-100 border border-blue-700',
    Operator: 'bg-emerald-900 text-emerald-100 border border-emerald-700'
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Application Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center font-bold text-lg text-white">
              T
            </div>
            <div>
              <span className="font-bold tracking-tight text-lg text-white">ToolTrack</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
                Factory Lifecycle System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>

            {user && (user.role === 'Admin' || user.role === 'Operator') && (
              <button
                onClick={() => setView('register')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  currentView === 'register'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Register Tool
              </button>
            )}

            <button
              onClick={() => setView('scan')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition flex items-center space-x-1.5 ${
                currentView === 'scan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Scan QR</span>
            </button>

            <button
              onClick={() => setView('reports')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                currentView === 'reports'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Reports
            </button>
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-sm font-medium text-slate-200">{user.full_name}</span>
                <span className="text-xs text-slate-400">{user.department}</span>
              </div>
            )}

            {user && (
              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${roleBadgeColors[user.role] || 'bg-slate-700 text-white'}`}>
                {user.role}
              </span>
            )}

            <button
              onClick={onLogout}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
