import React from 'react';

export default function PrivacyPolicyView({ onBack }) {
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
          ToolTrack Workshop Privacy Policy
        </h1>

        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Operational Scope</h2>
            <p>
              ToolTrack operates strictly as an internal inventory control and equipment lifecycle tracking system for workshop, plant, and factory operations. We do not sell, rent, or distribute personal identity information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Data Collection and Usage</h2>
            <p>
              The system records employee identity data solely for audit logging, chain of custody compliance, and accountability:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Full name, employee role, and assigned plant department.</li>
              <li>Timestamps and physical bay/station locations where equipment transactions take place.</li>
              <li>Inspection photos submitted during intake, damage triage, or calibration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. Immutable Audit Log Policy</h2>
            <p>
              To maintain industrial safety standards and OSHA/ISO auditability, equipment status event logs are immutable. Records of tool checkouts, returns, inspections, and repairs cannot be altered or purged by line operators.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Data Storage and Security</h2>
            <p>
              Passwords are stored using industry-standard salted cryptographic hashes (bcrypt). All authentication tokens are verified via JSON Web Tokens with finite expiration windows.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Contact and Administration</h2>
            <p>
              Inquiries regarding data retention or access requests should be directed to the plant system administrator at your local facilities office.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
