import React, { useState } from 'react';
import { api } from '../api';

export default function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userRole) => {
    let u = '';
    const p = 'password123';
    if (userRole === 'admin') u = 'admin';
    if (userRole === 'operator') u = 'operator';
    if (userRole === 'inspector') u = 'inspector';

    setUsername(u);
    setPassword(p);

    setLoading(true);
    setError(null);
    api.login(u, p)
      .then(res => onLoginSuccess(res.user))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded text-white font-bold text-2xl mb-3 shadow-sm">
          TT
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">ToolTrack</h1>
        <p className="mt-1 text-sm text-slate-400">
          Factory and Workshop Equipment Lifecycle System
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-md shadow-md p-8">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Personnel Authentication</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sign in with your workshop credentials to access authorized tooling functions.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm px-3.5 py-2.5 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, operator, inspector"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Terminal'}
          </button>
        </form>

        {/* Demo Fast Switcher (Ideal for hackathon judging) */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Quick Demo Sign-In (Select Role)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="px-2 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-center transition"
            >
              <div className="font-bold text-slate-900">Admin</div>
              <div className="text-[10px] text-slate-500">Alex Rivera</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('operator')}
              className="px-2 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-center transition"
            >
              <div className="font-bold text-slate-900">Operator</div>
              <div className="text-[10px] text-slate-500">Marcus Vance</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('inspector')}
              className="px-2 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-center transition"
            >
              <div className="font-bold text-slate-900">Inspector</div>
              <div className="text-[10px] text-slate-500">Sarah Chen</div>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 text-center">
            Standard demo password for all accounts: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">password123</code>
          </p>
        </div>
      </div>

      {/* Footer Legal Links */}
      <div className="mt-8 text-center text-xs text-slate-500 space-x-4">
        <span>ToolTrack System v1.0.0</span>
        <span>•</span>
        <button onClick={() => window.dispatchEvent(new CustomEvent('nav-privacy'))} className="hover:underline">
          Privacy Policy
        </button>
        <span>•</span>
        <button onClick={() => window.dispatchEvent(new CustomEvent('nav-terms'))} className="hover:underline">
          Terms & Conditions
        </button>
      </div>
    </div>
  );
}
