import React, { useState } from 'react';
import { api } from '../api';

export default function RegisterToolView({ onToolRegistered, onCancel, user }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Power Tool',
    serial_number: '',
    department: user?.department || 'Assembly',
    location: 'Tool Crib A - Shelf 1',
    owner: user?.full_name || '',
    condition: 'New',
    maintenance_due_date: '',
    expected_return_date: '',
    notes: 'Initial tool registration into workshop database.'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toolTypes = [
    'Power Tool',
    'Measuring Instrument',
    'Precision Hand Tool',
    'Heavy Machinery',
    'Pneumatic Tool',
    'Welding Equipment',
    'Electrical Testing',
    'General Workshop Tool'
  ];

  const departments = [
    'Assembly',
    'Quality Assurance',
    'Maintenance',
    'Fabrication',
    'Machining',
    'Carpentry & Crating',
    'Shop Management'
  ];

  const conditions = ['New', 'Good', 'Fair'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.serial_number.trim()) {
      setError('Tool Name and Serial / Batch Number are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.registerTool(formData);
      onToolRegistered(res.tool.id);
    } catch (err) {
      setError(err.message || 'Failed to register tool.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Register New Workshop Tool</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Tool ID and QR code identifier will be generated automatically upon submission.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md border border-slate-700 transition"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-6 bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tool Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Tool Name / Model Description *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Bosch 18V Cordless Impact Driver"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Tool Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Equipment Category *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              >
                {toolTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Serial or Batch Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Serial or Batch Number *
              </label>
              <input
                type="text"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="e.g. SN-BOS-98214"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Home / Intake Location */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Storage Rack / Home Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Tool Crib A - Shelf 2"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Tool Custodian / Owner */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Designated Custodian / Owner
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                placeholder="e.g. Marcus Vance"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
              />
            </div>

            {/* Initial Physical Condition */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Intake Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              >
                {conditions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Calibration / Maintenance Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Next Calibration / Maintenance Date
              </label>
              <input
                type="date"
                name="maintenance_due_date"
                value={formData.maintenance_due_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500">Optional: used for periodic calibration alerts</span>
            </div>

            {/* Expected Return Date (if pre-issuing) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Expected Return Date
              </label>
              <input
                type="date"
                name="expected_return_date"
                value={formData.expected_return_date}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500">Leave blank if tool remains in crib storage</span>
            </div>
          </div>

          {/* Registration Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Intake Notes & Inspection Comments
            </label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. PO number, supplier invoice details, physical unboxing comments"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Registering Tool...' : 'Register Tool & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
