import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getStatusStyle } from '../utils/statusColors';

export default function ToolDetailView({ toolId, user, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status update modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalStatus, setModalStatus] = useState('In Use');
  const [modalLocation, setModalLocation] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalExpectedReturn, setModalExpectedReturn] = useState('');
  const [modalMaintenanceFlag, setModalMaintenanceFlag] = useState(false);
  const [modalPhoto, setModalPhoto] = useState(null);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchTool = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTool(toolId);
      setData(res);
      setModalLocation(res.tool.current_location || res.tool.home_location);
    } catch (err) {
      setError(err.message || 'Failed to load tool details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTool();
  }, [toolId]);

  const handlePrintLabel = () => {
    window.print();
  };

  const handleOpenEventModal = () => {
    if (!data) return;
    const current = data.tool.current_status;
    let nextStatus = 'In Use';

    if (current === 'Registered') nextStatus = 'Received';
    else if (current === 'Received') nextStatus = 'Inspected';
    else if (current === 'Inspected') nextStatus = 'Issued';
    else if (current === 'Issued') nextStatus = 'In Use';
    else if (current === 'In Use') nextStatus = 'Returned';
    else if (current === 'Returned') nextStatus = data.tool.maintenance_flag ? 'Sent for Maintenance' : 'Issued';
    else if (current === 'Sent for Maintenance') nextStatus = 'Repaired';
    else if (current === 'Repaired') nextStatus = 'Inspected';

    setModalStatus(nextStatus);
    setModalLocation(data.tool.current_location);
    setModalNotes('');
    setModalExpectedReturn('');
    setModalMaintenanceFlag(false);
    setModalPhoto(null);
    setModalError(null);
    setShowEventModal(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEvent(true);
    setModalError(null);

    try {
      const formData = new FormData();
      formData.append('status', modalStatus);
      formData.append('location', modalLocation);
      formData.append('notes', modalNotes);
      formData.append('maintenance_flag', modalMaintenanceFlag ? '1' : '0');
      if (modalStatus === 'Issued' && modalExpectedReturn) {
        formData.append('expected_return_date', modalExpectedReturn);
      }
      if (modalPhoto) {
        formData.append('photo', modalPhoto);
      }

      await api.addEvent(toolId, formData);
      setShowEventModal(false);
      await fetchTool();
    } catch (err) {
      setModalError(err.message || 'Failed to update status.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600 mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Retrieving asset data and audit records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-md">
          <h2 className="text-base font-bold mb-2">Unable to Load Tool Profile</h2>
          <p className="text-sm mb-4">{error || 'Asset not found in database.'}</p>
          <button
            onClick={onBack}
            className="bg-slate-900 text-white text-xs px-4 py-2 rounded-md hover:bg-slate-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { tool, qr_code, history } = data;
  const statusStyle = getStatusStyle(tool.current_status);
  const today = new Date().toISOString().split('T')[0];

  const isOverdue = ['Issued', 'In Use'].includes(tool.current_status) && tool.expected_return_date && tool.expected_return_date < today;
  const isAwaitingInspection = ['Registered', 'Received'].includes(tool.current_status);
  const isMaintenanceDue = tool.maintenance_flag === 1 || tool.current_status === 'Sent for Maintenance' || (tool.maintenance_due_date && tool.maintenance_due_date < today);

  const statuses = [
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="text-xs bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md border border-slate-300 font-medium transition flex items-center space-x-1"
        >
          <span>← Back to Fleet</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrintLabel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3.5 py-1.5 rounded-md border border-slate-700 transition"
          >
            Print Asset Label
          </button>
          <button
            onClick={handleOpenEventModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-md shadow-sm transition"
          >
            + Log Status Event
          </button>
        </div>
      </div>

      {/* Red Flag Warning Banners */}
      {tool.maintenance_flag === 1 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wide">
                Alert: Maintenance Required - Tool Unavailable
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                This tool was returned with reported damage or defects. It is marked as unavailable for checkout until an inspection and repair event are logged.
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded">
              UNAVAILABLE
            </span>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-md">
          <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
            Warning: Overdue Return
          </h3>
          <p className="text-xs text-amber-800 mt-0.5">
            This tool was checked out and expected back on <strong>{tool.expected_return_date}</strong>. Contact custodian <strong>{tool.owner}</strong>.
          </p>
        </div>
      )}

      {isAwaitingInspection && (
        <div className="bg-sky-50 border-l-4 border-sky-600 p-4 rounded-r-md">
          <h3 className="text-sm font-bold text-sky-900 uppercase tracking-wide">
            Quality Inspection Required
          </h3>
          <p className="text-xs text-sky-800 mt-0.5">
            Tool is currently in <strong>{tool.current_status}</strong> state. It must undergo quality verification by an Inspector before being issued.
          </p>
        </div>
      )}

      {/* Main Grid: Tool Profile Card and Printable QR Label */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Specification Card (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between pb-4 border-b border-slate-200 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {tool.id}
                </span>
                <h1 className="text-xl font-bold text-slate-900">{tool.name}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Category: <span className="font-medium text-slate-700">{tool.type}</span> | Registered on {new Date(tool.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${statusStyle.dot}`}></span>
                {tool.current_status}
              </span>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Updated {new Date(tool.last_updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm">
            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Serial / Batch Number</span>
              <span className="font-mono font-medium text-slate-900">{tool.serial_number}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assigned Department</span>
              <span className="font-medium text-slate-900">{tool.department}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Current Location</span>
              <span className="font-medium text-slate-900">{tool.current_location}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Home Storage Rack</span>
              <span className="font-medium text-slate-900">{tool.home_location}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Custodian / Assigned Worker</span>
              <span className="font-medium text-slate-900">{tool.owner}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Initial Condition</span>
              <span className="font-medium text-slate-900">{tool.initial_condition}</span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Expected Return Date</span>
              <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                {tool.expected_return_date || 'N/A (In Storage)'}
              </span>
            </div>

            <div className="border border-slate-100 p-3 rounded bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Maintenance / Calibration Due</span>
              <span className={`font-medium ${tool.maintenance_due_date && tool.maintenance_due_date < today ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                {tool.maintenance_due_date || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Printable QR Code Label (1 col) */}
        <div id="printable-qr-label" className="bg-white border-2 border-slate-300 rounded-md p-5 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="border-b border-slate-200 w-full pb-2 mb-3">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-800 block">ToolTrack Workshop Asset Tag</span>
            <span className="font-mono text-lg font-extrabold text-blue-700">{tool.id}</span>
          </div>

          {qr_code && (
            <img
              src={qr_code}
              alt={`QR code for ${tool.id}`}
              className="w-48 h-48 border border-slate-200 rounded p-1 bg-white mb-3"
            />
          )}

          <div className="text-xs text-slate-700 w-full space-y-0.5 font-sans">
            <p className="font-bold text-slate-900 truncate">{tool.name}</p>
            <p className="font-mono text-[11px] text-slate-500">SN: {tool.serial_number}</p>
            <p className="text-[11px] text-slate-500">{tool.department} • {tool.home_location}</p>
          </div>

          <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 w-full no-print">
            Scan with any phone camera or shop terminal scanner to view status
          </p>
        </div>
      </div>

      {/* Visual Audit History Timeline */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6">
        <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Immutable Audit History Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every status change is permanently recorded. Records cannot be overwritten or deleted.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-mono font-medium">
            {history.length} Event{history.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {history.map((event, index) => {
            const evStyle = getStatusStyle(event.status);
            const isLatest = index === 0;

            return (
              <div key={event.id} className="relative group">
                {/* Timeline node circle */}
                <div className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${evStyle.dot}`}>
                </div>

                {/* Event Card */}
                <div className={`border rounded-md p-4 transition ${isLatest ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${evStyle.bg} ${evStyle.text} ${evStyle.border}`}>
                        {event.status}
                      </span>
                      {isLatest && (
                        <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                      {event.maintenance_flag === 1 && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                          Maintenance Flagged
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                    <div>
                      <span className="font-semibold text-slate-700">Logged By:</span> {event.updated_by}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Location:</span> {event.location}
                    </div>
                  </div>

                  {event.notes && (
                    <div className="mt-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded p-2.5">
                      <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                      {event.notes}
                    </div>
                  )}

                  {event.photo && (
                    <div className="mt-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Attached Inspection / Condition Photo:
                      </span>
                      <img
                        src={event.photo}
                        alt="Inspection photograph"
                        className="max-h-48 rounded border border-slate-300 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Update Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Log Tool Lifecycle Event</h3>
                <p className="text-xs text-slate-400 mt-0.5">{tool.id} - {tool.name}</p>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEventSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Transition Status To *
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900"
                >
                  {statuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500">
                  Inspected and Repaired require Inspector role. Retired requires Admin role.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Current Location *
                </label>
                <input
                  type="text"
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  placeholder="e.g. Bay 3, Tool Crib A, QC Calibration Bench"
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              {modalStatus === 'Issued' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Expected Return Date
                  </label>
                  <input
                    type="date"
                    value={modalExpectedReturn}
                    onChange={(e) => setModalExpectedReturn(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 bg-white"
                  />
                </div>
              )}

              {modalStatus === 'Returned' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalMaintenanceFlag}
                      onChange={(e) => setModalMaintenanceFlag(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      Mark as "Maintenance Required" (Defective or Damaged)
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-800 mt-1 pl-6">
                    Checking this flags the tool as Unavailable in the dashboard until a repair is verified.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Inspection / Transition Notes
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Describe tool condition, work order numbers, or observed wear..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Optional Photo (Verification / Damage Inspection)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setModalPhoto(e.target.files[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEvent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold disabled:opacity-50"
                >
                  {submittingEvent ? 'Recording...' : 'Commit Event to Audit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
