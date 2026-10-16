import React from 'react';

export default function TermsConditionsView({ onBack }) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white border border-slate-200 rounded-md p-8 shadow-sm">
        <button
          onClick={onBack}
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded border border-slate-300 font-medium mb-6 inline-flex items-center space-x-1"
        >
          <span>← Back to Application</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-3 mb-6">
          ToolTrack Terms and Conditions of Equipment Use
        </h1>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Equipment Custody and Responsibility</h2>
            <p>
              By checking out a tool under your user account, you accept custody and responsibility for the proper handling, operation, and return of the equipment in accordance with manufacturer guidelines and workshop safety protocols.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Mandatory Damage and Defect Reporting</h2>
            <p>
              Any drop, impact, abnormal vibration, electrical fault, or physical damage occurring during operation must be reported immediately upon return by checking the "Maintenance Required" flag in the tool return terminal. Operating or returning damaged tools without notification is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Role-Based Approvals</h2>
            <p>
              Quality calibrations and formal return-to-service sign-offs must only be performed by certified Quality Inspectors or Shop Administrators. Bypassing inspection requirements compromises workplace safety and invalidates calibration certifications.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. QR Asset Label Integrity</h2>
            <p>
              All equipment must display an intact, legible ToolTrack QR asset tag. If a tag becomes illegible due to wear or chemical exposure, the custodian must print and affix a replacement tag from the tool detail screen.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Overdue Equipment Returns</h2>
            <p>
              Tools checked out with an expected return date must be returned on or before the specified date. Overdue items trigger automated fleet notifications to department supervisors.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
