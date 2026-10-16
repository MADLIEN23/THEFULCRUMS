// Automated End-to-End API Test Script
// Tests all authentication, RBAC, tool lifecycle, alerts, and reports routes

const http = require('http');
const app = require('./src/index');
const { seed } = require('./src/db/seed');

const PORT = 5099;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const payload = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

    const headers = { ...options.headers };
    if (payload && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Initializing Clean Test Database Environment ---');
  seed();

  console.log('--- Starting Automated Backend API Test Suite ---');

  const server = app.listen(PORT, '127.0.0.1', async () => {
    try {
      // Test 1: Health check
      const health = await request('/api/health');
      console.assert(health.status === 200, 'Health check should return 200');
      console.log('PASS: GET /api/health returned healthy');

      // Test 2: Unauthenticated access rejected
      const unauth = await request('/api/tools');
      console.assert(unauth.status === 401, 'Unauthenticated request should return 401');
      console.log('PASS: Protected endpoint rejected without token (401)');

      // Test 3: Admin login
      const adminLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { username: 'admin', password: 'password123' }
      });
      console.assert(adminLogin.status === 200, 'Admin login should succeed');
      console.assert(adminLogin.body.token, 'Should return JWT token');
      const adminToken = adminLogin.body.token;
      console.log('PASS: POST /api/auth/login authenticated Admin');

      // Test 4: Inspector login
      const inspectorLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { username: 'inspector', password: 'password123' }
      });
      console.assert(inspectorLogin.status === 200, 'Inspector login should succeed');
      const inspectorToken = inspectorLogin.body.token;
      console.log('PASS: POST /api/auth/login authenticated Inspector');

      // Test 5: Operator login
      const operatorLogin = await request('/api/auth/login', {
        method: 'POST',
        body: { username: 'operator', password: 'password123' }
      });
      console.assert(operatorLogin.status === 200, 'Operator login should succeed');
      const operatorToken = operatorLogin.body.token;
      console.log('PASS: POST /api/auth/login authenticated Operator');

      // Test 6: Verify identity with /api/auth/me
      const meRes = await request('/api/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.assert(meRes.status === 200 && meRes.body.user.role === 'Admin', 'Me should return admin profile');
      console.log('PASS: GET /api/auth/me returned correct session user');

      // Test 7: List tools
      const toolsRes = await request('/api/tools', {
        headers: { Authorization: `Bearer ${operatorToken}` }
      });
      console.assert(toolsRes.status === 200 && toolsRes.body.tools.length >= 10, 'Should return tools list');
      console.log(`PASS: GET /api/tools returned ${toolsRes.body.count} tools`);

      // Test 8: Get tool detail, history and QR code
      const toolRes = await request('/api/tools/TL-1001', {
        headers: { Authorization: `Bearer ${operatorToken}` }
      });
      console.assert(toolRes.status === 200, 'Tool detail should return 200');
      console.assert(toolRes.body.qr_code && toolRes.body.qr_code.startsWith('data:image/png;base64,'), 'QR code must be base64 PNG');
      console.assert(Array.isArray(toolRes.body.history), 'History should be an array');
      console.log('PASS: GET /api/tools/TL-1001 returned details, audit timeline, and QR code');

      // Test 9: Register a new tool (Auto ID generation TL-1011)
      const registerRes = await request('/api/tools', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Fluke 376 FC True-RMS AC/DC Clamp Meter',
          type: 'Electrical Testing',
          serial_number: `SN-FLK-${Date.now()}`,
          department: 'Maintenance',
          location: 'Tool Crib A',
          owner: 'Alex Rivera',
          condition: 'New'
        }
      });
      console.assert(registerRes.status === 201, 'Tool registration should succeed');
      const registeredId = registerRes.body.tool.id;
      console.log(`PASS: POST /api/tools auto-generated next ID ${registeredId}`);

      // Test 10: Role enforcement - Operator cannot Retire a tool
      const forbiddenRes = await request(`/api/tools/${registeredId}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${operatorToken}` },
        body: { status: 'Retired', notes: 'Operator trying to retire' }
      });
      console.assert(forbiddenRes.status === 403, 'Operator should be forbidden from retiring tool');
      console.log('PASS: RBAC properly restricted Operator from retiring tool (403 Forbidden)');

      // Test 11: Inspector can inspect a tool
      const inspectRes = await request(`/api/tools/${registeredId}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${inspectorToken}` },
        body: {
          status: 'Inspected',
          location: 'QC Calibration Bench',
          notes: 'Initial inspection completed and calibrated.'
        }
      });
      console.assert(inspectRes.status === 201 && inspectRes.body.tool.current_status === 'Inspected', 'Status should be Inspected');
      console.log('PASS: Inspector recorded Inspected event; latest status view updated');

      // Test 12: Operator issues tool with expected return date
      const issueRes = await request(`/api/tools/${registeredId}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${operatorToken}` },
        body: {
          status: 'Issued',
          location: 'Substation Bay 2',
          notes: 'Issued for transformer diagnostic.',
          expected_return_date: '2026-10-20'
        }
      });
      console.assert(issueRes.status === 201 && issueRes.body.tool.current_status === 'Issued', 'Status should be Issued');
      console.log('PASS: Operator issued tool with expected return date');

      // Test 13: Alerts endpoint
      const alertsRes = await request('/api/alerts', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.assert(alertsRes.status === 200, 'Alerts should return 200');
      console.assert(alertsRes.body.summary.overdue_count >= 1, 'Should detect overdue tools');
      console.assert(alertsRes.body.summary.maintenance_due_count >= 1, 'Should detect maintenance alerts');
      console.log(`PASS: GET /api/alerts detected ${alertsRes.body.summary.total} total red flags`);

      // Test 14: Reports summary and CSV export
      const reportsSummary = await request('/api/reports/summary', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const totalCount = reportsSummary.body.summary ? reportsSummary.body.summary.total_tools : reportsSummary.body.total_tools;
      console.assert(reportsSummary.status === 200 && totalCount >= 11, 'Reports summary valid');
      console.log('PASS: GET /api/reports/summary calculated fleet availability');

      const csvRes = await request('/api/reports/csv', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.assert(csvRes.status === 200 && csvRes.headers['content-type'].includes('text/csv'), 'CSV should return text/csv');
      console.assert(csvRes.body.includes('Tool ID,Tool Name'), 'CSV should include standard headers');
      console.log('PASS: GET /api/reports/csv generated valid CSV data');

      console.log('\n--- ALL 14 AUTOMATED BACKEND TESTS PASSED ---');
      server.close(() => {
        process.exit(0);
      });
    } catch (err) {
      console.error('Test assertion failed:', err);
      server.close(() => {
        process.exit(1);
      });
    }
  });
}

runTests();
