import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getStatusStyle } from '../utils/statusColors';

export default function ReportsView({ onSelectTool }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReportsSummary();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load reports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCsv = async () => {
    try {
      const token = api.getToken();
      const res = await fetch('/api/reports/csv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tooltrack_workshop_fleet_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error exporting CSV: ${err.message}`);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600 mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Calculating fleet metrics and turnaround analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-md">
          <h2 className="text-base font-bold mb-2">Unable to Generate Reports</h2>
          <p className="text-sm">{error || 'Server error computing audit statistics.'}</p>
        </div>
      </div>
    );
  }

  const {
    summary,
    overdue_items,
    maintenance_frequency,
    inactive_items,
    maintenance_notifications,
    department_breakdown,
    status_breakdown
  } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workshop Fleet Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational availability, turnaround time metrics, maintenance frequency, and compliance exports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm transition flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Report Container */}
      <div id="printable-audit-report" className="space-y-6">
        {/* Printable Header (Visible during print) */}
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">ToolTrack Executive Audit Report</h1>
              <p className="text-xs text-slate-600">Factory Equipment Lifecycle & Chain of Custody Register</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Executive Metric Cards Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Fleet Availability</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{summary.available_percentage}%</span>
              <span className="text-xs text-slate-500 font-medium">({summary.available_tools} of {summary.total_tools})</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Ready for deployment</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">Average Turnaround</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{summary.avg_turnaround_days}</span>
              <span className="text-xs text-slate-500 font-medium">Days</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Checkout to return interval</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 block">Overdue Checkouts</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-rose-800">{summary.overdue_count}</span>
              <span className="text-xs text-rose-600 font-medium">Equipment</span>
            </div>
            <span className="text-[10px] text-rose-600 block mt-1">Past expected return date</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 block">Maintenance Alerts</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-800">{summary.maintenance_required_tools}</span>
              <span className="text-xs text-amber-600 font-medium">Items</span>
            </div>
            <span className="text-[10px] text-amber-600 block mt-1">Damage flagged or in repair</span>
          </div>
        </div>

        {/* Responsible Person Notifications (Active Defect Dispatches) */}
        {maintenance_notifications && maintenance_notifications.length > 0 && (
          <div className="bg-white border border-rose-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-rose-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Responsible Person Notifications: Defective Equipment Dispatches
                </h2>
              </div>
              <span className="text-[11px] text-rose-200 font-mono">
                Locked as UNAVAILABLE until Repair Logged
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {maintenance_notifications.map(item => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                        UNAVAILABLE
                      </span>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Reported Defect:</strong> {item.defect_description || 'Abnormal wear or malfunction reported upon return.'}
                    </p>

                    <p className="text-[11px] text-slate-500">
                      Reported by <strong>{item.reported_by}</strong> on {new Date(item.reported_at).toLocaleString()} • Quarantined at: <strong>{item.current_location}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Responsible Custodian</span>
                      <span className="font-bold text-slate-900">{item.owner}</span>
                      <span className="text-[11px] text-slate-500 block">{item.department}</span>
                    </div>

                    <button
                      onClick={() => onSelectTool(item.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium px-3 py-1.5 rounded transition no-print"
                    >
                      Audit Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Equipment Table */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Overdue Equipment Register ({overdue_items.length} Items)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Requires supervisor contact</span>
          </div>

          {overdue_items.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No overdue equipment currently recorded in workshop fleet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Tool ID</th>
                    <th className="py-2.5 px-4">Equipment Name</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Borrower / Custodian</th>
                    <th className="py-2.5 px-4">Expected Date</th>
                    <th className="py-2.5 px-4">Days Overdue</th>
                    <th className="py-2.5 px-4 text-right no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {overdue_items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{item.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-4">{item.department}</td>
                      <td className="py-3 px-4 font-medium">{item.owner}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.expected_return_date}</td>
                      <td className="py-3 px-4">
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          {item.days_overdue} Day{item.days_overdue === 1 ? '' : 's'} Overdue
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right no-print">
                        <button
                          onClick={() => onSelectTool(item.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-2.5 py-1 rounded"
                        >
                          View Tool
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Two-Column Grid: Maintenance Frequency & Inactive Equipment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maintenance Frequency Leaderboard */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Maintenance Frequency Leaderboard
              </h2>
              <span className="text-[11px] text-slate-500">Most repaired assets</span>
            </div>

            <div className="divide-y divide-slate-100">
              {maintenance_frequency.map((item, index) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-400 w-4">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.id} • {item.department} • {item.type}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {item.maintenance_events_count} Event{item.maintenance_events_count === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inactive / Stagnant Equipment */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Inactive Equipment (No Updates &gt; 30 Days)
              </h2>
              <span className="text-[11px] text-slate-500">Audit candidates</span>
            </div>

            {inactive_items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                All workshop tools have recorded activity within the last 30 days.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {inactive_items.map(item => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.id} • {item.current_location} • Status: {item.current_status}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {item.days_inactive} Days Dormant
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fleet Distribution Tables (Department and Status) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Fleet Distribution by Department
            </h2>
            <div className="space-y-2 text-xs">
              {department_breakdown.map(dept => {
                const pct = summary.total_tools > 0 ? Math.round((dept.count / summary.total_tools) * 100) : 0;
                return (
                  <div key={dept.department} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-800">{dept.department}</span>
                      <span className="text-slate-600">{dept.count} tools ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Current Lifecycle Status Breakdown
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {status_breakdown.map(s => {
                const style = getStatusStyle(s.current_status);
                return (
                  <div key={s.current_status} className="border border-slate-200 rounded p-2.5 flex items-center justify-between">
                    <span className={`inline-flex items-center font-medium ${style.text}`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${style.dot}`}></span>
                      {s.current_status}
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
