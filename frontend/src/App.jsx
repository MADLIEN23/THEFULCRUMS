import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import RegisterToolView from './views/RegisterToolView';
import QRScannerView from './views/QRScannerView';
import ToolDetailView from './views/ToolDetailView';
import PrivacyPolicyView from './views/PrivacyPolicyView';
import TermsConditionsView from './views/TermsConditionsView';
import ReportsView from './views/ReportsView';

export default function App() {
  const [user, setUser] = useState(api.getUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedToolId, setSelectedToolId] = useState(null);

  // Synchronize route based on URL path e.g. /tools/TL-1001 from QR scans
  const syncRouteFromUrl = () => {
    const path = window.location.pathname;
    const toolMatch = path.match(/\/tools\/([A-Za-z0-9_-]+)/i);
    if (toolMatch && toolMatch[1]) {
      setSelectedToolId(toolMatch[1].toUpperCase());
      setCurrentView('tool-detail');
      return;
    }

    if (path === '/privacy') {
      setCurrentView('privacy');
      return;
    }

    if (path === '/terms') {
      setCurrentView('terms');
      return;
    }

    if (path === '/reports') {
      setCurrentView('reports');
      return;
    }

    if (path === '/scan') {
      setCurrentView('scan');
      return;
    }

    if (path === '/register') {
      setCurrentView('register');
      return;
    }
  };

  useEffect(() => {
    syncRouteFromUrl();

    // Listen to browser back/forward buttons
    const handlePopState = () => syncRouteFromUrl();
    window.addEventListener('popstate', handlePopState);

    // Global session expiration handler
    const handleExpired = () => {
      setUser(null);
      setCurrentView('dashboard');
    };
    window.addEventListener('auth-expired', handleExpired);

    // Legal page custom navigation events from footer
    const handleNavPrivacy = () => {
      window.history.pushState({}, '', '/privacy');
      setCurrentView('privacy');
    };
    const handleNavTerms = () => {
      window.history.pushState({}, '', '/terms');
      setCurrentView('terms');
    };
    window.addEventListener('nav-privacy', handleNavPrivacy);
    window.addEventListener('nav-terms', handleNavTerms);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('auth-expired', handleExpired);
      window.removeEventListener('nav-privacy', handleNavPrivacy);
      window.removeEventListener('nav-terms', handleNavTerms);
    };
  }, []);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    syncRouteFromUrl();
  };

  const handleLogout = () => {
    api.clearAuth();
    setUser(null);
    setCurrentView('dashboard');
    window.history.pushState({}, '', '/');
  };

  const navigateToView = (viewName) => {
    setCurrentView(viewName);
    if (viewName === 'dashboard') {
      window.history.pushState({}, '', '/');
    } else if (viewName === 'register') {
      window.history.pushState({}, '', '/register');
    } else if (viewName === 'scan') {
      window.history.pushState({}, '', '/scan');
    } else if (viewName === 'reports') {
      window.history.pushState({}, '', '/reports');
    } else if (viewName === 'privacy') {
      window.history.pushState({}, '', '/privacy');
    } else if (viewName === 'terms') {
      window.history.pushState({}, '', '/terms');
    }
  };

  const handleSelectTool = (toolId) => {
    setSelectedToolId(toolId);
    setCurrentView('tool-detail');
    window.history.pushState({}, '', `/tools/${toolId}`);
  };

  const handleToolRegistered = (newToolId) => {
    setSelectedToolId(newToolId);
    setCurrentView('tool-detail');
    window.history.pushState({}, '', `/tools/${newToolId}`);
  };

  // If user is not authenticated, show login view
  if (!user) {
    if (currentView === 'privacy') {
      return <PrivacyPolicyView onBack={() => setCurrentView('dashboard')} />;
    }
    if (currentView === 'terms') {
      return <TermsConditionsView onBack={() => setCurrentView('dashboard')} />;
    }
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setView={navigateToView}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Body View Switching */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <DashboardView
            user={user}
            onSelectTool={handleSelectTool}
            onRegisterNew={() => navigateToView('register')}
            onScanQR={() => navigateToView('scan')}
          />
        )}

        {currentView === 'register' && (
          <RegisterToolView
            user={user}
            onToolRegistered={handleToolRegistered}
            onCancel={() => navigateToView('dashboard')}
          />
        )}

        {currentView === 'scan' && (
          <QRScannerView
            onToolDetected={(id) => handleSelectTool(id)}
            onCancel={() => navigateToView('dashboard')}
          />
        )}

        {currentView === 'tool-detail' && selectedToolId && (
          <ToolDetailView
            toolId={selectedToolId}
            user={user}
            onBack={() => navigateToView('dashboard')}
          />
        )}

        {currentView === 'privacy' && (
          <PrivacyPolicyView onBack={() => navigateToView('dashboard')} />
        )}

        {currentView === 'terms' && (
          <TermsConditionsView onBack={() => navigateToView('dashboard')} />
        )}

        {currentView === 'reports' && (
          <ReportsView
            onSelectTool={handleSelectTool}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <span>ToolTrack Industrial Fleet System • Production Build v1.0.0</span>
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={() => navigateToView('privacy')} className="hover:underline hover:text-slate-700">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => navigateToView('terms')} className="hover:underline hover:text-slate-700">
              Terms & Conditions
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
