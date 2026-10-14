import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getStatusStyle } from '../utils/statusColors';

export default function DashboardView({ onSelectTool, onRegisterNew, onScanQR, user }) {
  const [tools, setTools] = useState([]);
  const [alertsData, setAlertsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activePreset, setActivePreset] = useState('all'); // all, overdue, awaiting_inspection, maintenance_due, available, in_use
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Quick Action Modal State (Direct Check-out / Return from Dashboard)
  const [quickActionTool, setQuickActionTool] = useState(null);
  const [quickActionType, setQuickActionType] = useState('Issue'); // 'Issue', 'Return', 'Inspect'
  const [qaLocation, setQaLocation] = useState('');
  const [qaExpectedReturn, setQaExpectedReturn] = useState('');
  const [qaNotes, setQaNotes] = useState('');
  const [qaMaintenanceFlag, setQaMaintenanceFlag] = useState(false);
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaError, setQaError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (department !== 'All') params.department = department;
      if (locationFilter !== 'All') params.location = locationFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (activePreset !== 'all') params.filter = activePreset;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // Parallel fetch for tools fleet and active red flags
      const [toolsRes, alertsRes] = await Promise.all([
        api.getTools(params),
        api.getAlerts()
      ]);

      setTools(toolsRes.tools || []);
      setAlertsData(alertsRes);
    } catch (err) {
      setError(err.message || 'Failed to retrieve dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [search, department, locationFilter, statusFilter, activePreset, startDate, endDate]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('All');
    setLocationFilter('All');
    setStatusFilter('All');
    setActivePreset('all');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenQuickAction = (tool, type) => {
    setQuickActionTool(tool);
    setQuickActionType(type);
    setQaLocation(tool.current_location || tool.home_location);
    setQaExpectedReturn('');
    setQaNotes('');
    setQaMaintenanceFlag(false);
    setQaError(null);
  };

  const handleQuickActionSubmit = async (e) => {
    e.preventDefault();
    if (!quickActionTool) return;

    setQaSubmitting(true);
    setQaError(null);

    try {
      let targetStatus = 'In Use';
      if (quickActionType === 'Issue') targetStatus = 'Issued';
      if (quickActionType === 'Return') targetStatus = 'Returned';
      if (quickActionType === 'Inspect') targetStatus = 'Inspected';

      const payload = {
        status: targetStatus,
        location: qaLocation,
        notes: qaNotes || `Quick transition to ${targetStatus} from dashboard terminal.`,
        maintenance_flag: qaMaintenanceFlag ? 1 : 0
      };

      if (targetStatus === 'Issued' && qaExpectedReturn) {
        payload.expected_return_date = qaExpectedReturn;
      }

      await api.addEvent(quickActionTool.id, payload);
      setQuickActionTool(null);
      await fetchDashboardData();
    } catch (err) {
      setQaError(err.message || 'Failed to commit status change.');
    } finally {
      setQaSubmitting(false);
    }
  };

  // Extract unique locations from current tool data for the location dropdown
  const uniqueLocations = Array.from(new Set(tools.map(t => t.current_location).filter(Boolean)));

  const departments = [
    'All',
    'Assembly',
    'Quality Assurance',
    'Maintenance',
    'Fabrication',
    'Machining',
    'Carpentry & Crating',
    'Shop Management'
  ];

  const statuses = [
    'All',
    'Registered',
    'Received',
    'Inspected',
    'Issued',
    'In Use',
    'Returned',
    'Sent for Maintenance',
    'Repaired',
    'Retired'
  ];

  const today = new Date().toISOString().split('T')[0];

  // Calculate fleet availability metrics
  const totalFleet = tools.length;
  const availableFleet = tools.filter(t => ['Inspected', 'Repaired', 'Returned'].includes(t.current_status) && t.maintenance_flag === 0).length;
  const inUseFleet = tools.filter(t => ['Issued', 'In Use'].includes(t.current_status)).length;
  const maintenanceFleet = tools.filter(t => t.maintenance_flag === 1 || t.current_status === 'Sent for Maintenance').length;
  const awaitingInspectionFleet = tools.filter(t => ['Registered', 'Received'].includes(t.current_status)).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workshop Fleet Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live equipment custody, real-time availability, and operational safety triage.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-md border border-slate-300 p-0.5 bg-white">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-medium rounded ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grid View
            </button>
          </div>

          <button
            onClick={onScanQR}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold px-3.5 py-2 rounded-md border border-slate-700 transition flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Scan Asset QR</span>
          </button>

          {user && (user.role === 'Admin' || user.role === 'Operator') && (
            <button
              onClick={onRegisterNew}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition"
            >
              + Register Tool
            </button>
          )}
        </div>
      </div>

      {/* Fleet Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Total Fleet</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{totalFleet}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tracked assets</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 block">Available</span>
          <span className="text-2xl font-extrabold text-emerald-800 mt-0.5 block">{availableFleet}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Ready for checkout</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 block">In Production</span>
          <span className="text-2xl font-extrabold text-indigo-800 mt-0.5 block">{inUseFleet}</span>
          <span className="text-[10px] text-indigo-600 block mt-0.5">Issued or In Use</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">Unavailable / Defect</span>
          <span className="text-2xl font-extrabold text-rose-800 mt-0.5 block">{maintenanceFleet}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Maintenance required</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-700 block">Pending QA</span>
          <span className="text-2xl font-extrabold text-sky-800 mt-0.5 block">{awaitingInspectionFleet}</span>
          <span className="text-[10px] text-sky-600 block mt-0.5">Needs inspection</span>
        </div>
      </div>

      {/* Red Flag Alert Drawer (Real-Time Attention Banners) */}
      {alertsData && alertsData.summary && alertsData.summary.total > 0 && (
        <div className="bg-slate-900 text-white rounded-md p-4 shadow-sm border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Active Operational Red Flags ({alertsData.summary.total})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Action required by shop supervisors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Overdue Returns Alert Card */}
            <div
              onClick={() => setActivePreset('overdue')}
              className={`p-3 rounded border cursor-pointer transition ${
                activePreset === 'overdue'
                  ? 'bg-rose-950/80 border-rose-500'
                  : 'bg-slate-800/80 border-slate-700 hover:border-rose-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase">Overdue Returns</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded">
                  {alertsData.summary.overdue_count}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Equipment not returned by expected checkout date.
              </p>
              {alertsData.alerts.overdue.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
                  Earliest: {alertsData.alerts.overdue[0].id} ({alertsData.alerts.overdue[0].owner})
                </div>
              )}
            </div>

            {/* Awaiting Inspection Alert Card */}
            <div
              onClick={() => setActivePreset('awaiting_inspection')}
              className={`p-3 rounded border cursor-pointer transition ${
                activePreset === 'awaiting_inspection'
                  ? 'bg-sky-950/80 border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 hover:border-sky-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase">Awaiting QA Inspection</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-sky-600 text-white rounded">
                  {alertsData.summary.awaiting_inspection_count}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Newly intake items pending formal clearance by QA Inspector.
              </p>
              {alertsData.alerts.awaiting_inspection.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
                  Pending: {alertsData.alerts.awaiting_inspection[0].id} ({alertsData.alerts.awaiting_inspection[0].current_location})
                </div>
              )}
            </div>

            {/* Maintenance Required Alert Card */}
            <div
              onClick={() => setActivePreset('maintenance_due')}
              className={`p-3 rounded border cursor-pointer transition ${
                activePreset === 'maintenance_due'
                  ? 'bg-amber-950/80 border-amber-500'
                  : 'bg-slate-800/80 border-slate-700 hover:border-amber-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase">Maintenance Required</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-600 text-white rounded">
                  {alertsData.summary.maintenance_due_count}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Tools tagged with damage upon return or overdue for calibration.
              </p>
              {alertsData.alerts.maintenance.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
                  Alert: {alertsData.alerts.maintenance[0].id} ({alertsData.alerts.maintenance[0].name})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Filter Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">
          Filter Preset:
        </span>

        <button
          onClick={() => setActivePreset('all')}
          className={`px-3 py-1 text-xs font-medium rounded-md border transition ${
            activePreset === 'all'
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          All Equipment ({totalFleet})
        </button>

        <button
          onClick={() => setActivePreset('overdue')}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
            activePreset === 'overdue'
              ? 'bg-rose-700 text-white border-rose-700'
              : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
          }`}
        >
          Overdue Returns
        </button>

        <button
          onClick={() => setActivePreset('awaiting_inspection')}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
            activePreset === 'awaiting_inspection'
              ? 'bg-sky-700 text-white border-sky-700'
              : 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
          }`}
        >
          Awaiting QA Inspection
        </button>

        <button
          onClick={() => setActivePreset('maintenance_due')}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
            activePreset === 'maintenance_due'
              ? 'bg-amber-700 text-white border-amber-700'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          }`}
        >
          Maintenance Due / Flagged
        </button>

        <button
          onClick={() => setActivePreset('available')}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
            activePreset === 'available'
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          Available for Issue
        </button>

        <button
          onClick={() => setActivePreset('in_use')}
          className={`px-3 py-1 text-xs font-semibold rounded-md border transition ${
            activePreset === 'in_use'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100'
          }`}
        >
          Currently In Use
        </button>

        {(search || department !== 'All' || locationFilter !== 'All' || statusFilter !== 'All' || activePreset !== 'all' || startDate || endDate) && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Search Inventory
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID (e.g. TL-1001), name, serial number, or owner..."
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Location / Storage Bay
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Lifecycle Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Activity Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Activity End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white text-slate-900"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Main Content: Table or Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-500 text-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
          <p>Querying SQLite database...</p>
        </div>
      ) : tools.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-slate-500 text-sm">
          <p className="font-semibold text-slate-700">No equipment matches the active filters.</p>
          <button
            onClick={handleResetFilters}
            className="mt-3 text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tool ID</th>
                  <th className="py-3 px-4">Equipment Description</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Current Bay / Location</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4">Custodian</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4 text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {tools.map(tool => {
                  const style = getStatusStyle(tool.current_status);
                  const isToolOverdue = ['Issued', 'In Use'].includes(tool.current_status) && tool.expected_return_date && tool.expected_return_date < today;
                  const isDefect = tool.maintenance_flag === 1;

                  return (
                    <tr
                      key={tool.id}
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isDefect ? 'bg-rose-50/40' : isToolOverdue ? 'bg-amber-50/40' : ''
                      }`}
                      onClick={() => onSelectTool(tool.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {tool.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{tool.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          SN: {tool.serial_number} • <span className="text-slate-500">{tool.type}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {tool.department}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{tool.current_location}</span>
                        {tool.home_location !== tool.current_location && (
                          <div className="text-[10px] text-slate-400">Home: {tool.home_location}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
                            {tool.current_status}
                          </span>
                          {isDefect && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                              DEFECT FLAGGED
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {tool.owner}
                      </td>

                      <td className="py-3.5 px-4">
                        {tool.expected_return_date ? (
                          <div className={isToolOverdue ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                            {tool.expected_return_date}
                            {isToolOverdue && <span className="block text-[10px] text-rose-600 font-semibold uppercase">OVERDUE</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">In Storage</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Action: Issue / Check Out */}
                          {['Inspected', 'Repaired', 'Returned'].includes(tool.current_status) && !isDefect && (
                            <button
                              onClick={() => handleOpenQuickAction(tool, 'Issue')}
                              title="Check out to operator"
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-medium px-2 py-1 rounded transition"
                            >
                              Check Out
                            </button>
                          )}

                          {/* Quick Action: Return Tool */}
                          {['Issued', 'In Use'].includes(tool.current_status) && (
                            <button
                              onClick={() => handleOpenQuickAction(tool, 'Return')}
                              title="Log return to crib"
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-medium px-2 py-1 rounded transition"
                            >
                              Return
                            </button>
                          )}

                          {/* Quick Action: Quality Signoff */}
                          {['Registered', 'Received'].includes(tool.current_status) && (
                            <button
                              onClick={() => handleOpenQuickAction(tool, 'Inspect')}
                              title="Perform QA verification"
                              className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-medium px-2 py-1 rounded transition"
                            >
                              QA Signoff
                            </button>
                          )}

                          <button
                            onClick={() => onSelectTool(tool.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-medium px-2.5 py-1 rounded transition"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Compact Industrial Cards) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => {
            const style = getStatusStyle(tool.current_status);
            const isToolOverdue = ['Issued', 'In Use'].includes(tool.current_status) && tool.expected_return_date && tool.expected_return_date < today;
            const isDefect = tool.maintenance_flag === 1;

            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`bg-white border rounded-md p-4 shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between ${
                  isDefect ? 'border-rose-400 bg-rose-50/20' : isToolOverdue ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {tool.id}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${style.bg} ${style.text} ${style.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
                      {tool.current_status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-tight">{tool.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">SN: {tool.serial_number}</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800">{tool.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Bay:</span>
                      <span className="font-medium text-slate-800">{tool.current_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Custodian:</span>
                      <span className="font-medium text-slate-800">{tool.owner}</span>
                    </div>
                    {tool.expected_return_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Due Back:</span>
                        <span className={`font-semibold ${isToolOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                          {tool.expected_return_date} {isToolOverdue && '(OVERDUE)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <div>
                    {isDefect && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                        DEFECT FLAGGED
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onSelectTool(tool.id)}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1 rounded transition"
                  >
                    View History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Modal (Direct State Change from Dashboard) */}
      {quickActionTool && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  Quick Action: {quickActionType === 'Issue' ? 'Check Out Equipment' : quickActionType === 'Return' ? 'Return Equipment' : 'Quality Inspection Signoff'}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{quickActionTool.id} - {quickActionTool.name}</p>
              </div>
              <button
                onClick={() => setQuickActionTool(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {qaError && (
              <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded">
                {qaError}
              </div>
            )}

            <form onSubmit={handleQuickActionSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Destination / Current Location *
                </label>
                <input
                  type="text"
                  value={qaLocation}
                  onChange={(e) => setQaLocation(e.target.value)}
                  placeholder="e.g. Bay 2, Tool Crib A"
                  required
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded text-slate-900"
                />
              </div>

              {quickActionType === 'Issue' && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={qaExpectedReturn}
                    onChange={(e) => setQaExpectedReturn(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded text-slate-900 bg-white"
                  />
                </div>
              )}

              {quickActionType === 'Return' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qaMaintenanceFlag}
                      onChange={(e) => setQaMaintenanceFlag(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-bold text-amber-900">
                      Report Defect / Maintenance Required
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-800 mt-1 pl-6">
                    Flags this equipment as Unavailable until maintenance logs a completed repair.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Transaction Notes
                </label>
                <textarea
                  rows={2}
                  value={qaNotes}
                  onChange={(e) => setQaNotes(e.target.value)}
                  placeholder="Notes on usage, project work order, or condition..."
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickActionTool(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={qaSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
                >
                  {qaSubmitting ? 'Recording...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
