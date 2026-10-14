// Tool Lifecycle and Audit Logging Routes
// Handles tool registration, dynamic QR code creation, and immutable status transitions

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const multer = require('multer');
const { query, get, run } = require('../db/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Configure file storage for tool event inspection photos
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `photo-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Helper to generate the next sequential Tool ID (e.g. TL-1011)
 */
function getNextToolId() {
  const row = get(`
    SELECT id FROM tools 
    WHERE id LIKE 'TL-%' 
    ORDER BY CAST(SUBSTR(id, 4) AS INTEGER) DESC 
    LIMIT 1
  `);
  if (!row) {
    return 'TL-1001';
  }
  const match = row.id.match(/^TL-(\d+)$/);
  if (!match) {
    return 'TL-1001';
  }
  const nextNum = parseInt(match[1], 10) + 1;
  return `TL-${nextNum}`;
}

// Allowed tool lifecycle statuses
const VALID_STATUSES = [
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

/**
 * GET /api/tools
 * Retrieves tools list from the computed v_tools_current view with filtering support
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, department, location, status, filter, start_date, end_date } = req.query;

    let sql = 'SELECT * FROM v_tools_current WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (id LIKE ? OR name LIKE ? OR serial_number LIKE ? OR owner LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (department && department !== 'All') {
      sql += ' AND department = ?';
      params.push(department);
    }

    if (location && location !== 'All') {
      sql += ' AND (current_location LIKE ? OR home_location LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }

    if (status && status !== 'All') {
      sql += ' AND current_status = ?';
      params.push(status);
    }

    // Date range filters based on last event or creation date
    if (start_date) {
      sql += ' AND (last_updated_at >= ? OR created_at >= ?)';
      params.push(`${start_date}T00:00:00.000Z`, `${start_date}T00:00:00.000Z`);
    }
    if (end_date) {
      sql += ' AND (last_updated_at <= ? OR created_at <= ?)';
      params.push(`${end_date}T23:59:59.999Z`, `${end_date}T23:59:59.999Z`);
    }

    // Preset Red Flag and Operational Status filters
    const today = new Date().toISOString().split('T')[0];

    if (filter === 'overdue') {
      sql += ` AND current_status IN ('Issued', 'In Use') AND expected_return_date IS NOT NULL AND expected_return_date < ?`;
      params.push(today);
    } else if (filter === 'awaiting_inspection') {
      sql += ` AND current_status IN ('Registered', 'Received')`;
    } else if (filter === 'maintenance_due') {
      sql += ` AND (maintenance_flag = 1 OR current_status = 'Sent for Maintenance' OR (maintenance_due_date IS NOT NULL AND maintenance_due_date < ?))`;
      params.push(today);
    } else if (filter === 'available') {
      sql += ` AND current_status IN ('Inspected', 'Repaired', 'Returned') AND maintenance_flag = 0`;
    } else if (filter === 'in_use') {
      sql += ` AND current_status IN ('Issued', 'In Use')`;
    }

    sql += ' ORDER BY id ASC';

    const tools = query(sql, params);
    return res.json({ count: tools.length, tools });
  } catch (err) {
    console.error('Error fetching tools:', err);
    return res.status(500).json({ error: 'Failed to retrieve tools list.' });
  }
});

/**
 * POST /api/tools
 * Registers a new tool and records its initial "Registered" status event
 */
router.post('/', authenticateToken, requireRole('Admin', 'Operator'), (req, res) => {
  try {
    const {
      name,
      type,
      serial_number,
      department,
      location,
      owner,
      condition,
      expected_return_date,
      maintenance_due_date,
      notes
    } = req.body;

    // Field validations
    if (!name || !type || !serial_number || !department || !location) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, serial_number, department, and location are mandatory.'
      });
    }

    // Check serial uniqueness
    const existing = get('SELECT id FROM tools WHERE serial_number = ?', [serial_number.trim()]);
    if (existing) {
      return res.status(400).json({
        error: `A tool with serial number '${serial_number}' is already registered (Tool ID: ${existing.id}).`
      });
    }

    const toolId = getNextToolId();
    const now = new Date().toISOString();
    const toolOwner = owner || req.user.full_name;
    const initialCondition = condition || 'New';

    // 1. Insert master record into tools table
    run(
      `INSERT INTO tools (
        id, name, type, serial_number, department, location, owner,
        condition, expected_return_date, maintenance_due_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toolId,
        name.trim(),
        type.trim(),
        serial_number.trim(),
        department.trim(),
        location.trim(),
        toolOwner.trim(),
        initialCondition.trim(),
        expected_return_date || null,
        maintenance_due_date || null,
        now
      ]
    );

    // 2. Insert initial "Registered" event into immutable status_events log
    run(
      `INSERT INTO status_events (
        tool_id, status, updated_by, timestamp, location, notes, photo, maintenance_flag
      ) VALUES (?, 'Registered', ?, ?, ?, ?, null, 0)`,
      [
        toolId,
        req.user.full_name,
        now,
        location.trim(),
        notes || 'Initial registration into ToolTrack system.'
      ]
    );

    const createdTool = get('SELECT * FROM v_tools_current WHERE id = ?', [toolId]);
    return res.status(201).json({
      message: `Tool ${toolId} registered successfully.`,
      tool: createdTool
    });
  } catch (err) {
    console.error('Error registering tool:', err);
    return res.status(500).json({ error: 'Failed to register tool.' });
  }
});

/**
 * GET /api/tools/:id
 * Retrieves full details of a specific tool, its QR code, and complete audit timeline
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tool = get('SELECT * FROM v_tools_current WHERE id = ?', [id.toUpperCase()]);

    if (!tool) {
      return res.status(404).json({ error: `Tool with ID '${id}' was not found.` });
    }

    // Retrieve entire immutable audit history for this tool
    const history = query(
      'SELECT * FROM status_events WHERE tool_id = ? ORDER BY timestamp DESC, id DESC',
      [tool.id]
    );

    // Generate high-resolution QR code data URL (points to tool page)
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const toolPageUrl = `${clientBaseUrl}/tools/${tool.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(toolPageUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a', // Clean dark slate
        light: '#ffffff'
      }
    });

    return res.json({
      tool,
      qr_code: qrCodeDataUrl,
      target_url: toolPageUrl,
      history
    });
  } catch (err) {
    console.error('Error fetching tool details:', err);
    return res.status(500).json({ error: 'Failed to retrieve tool details.' });
  }
});

/**
 * POST /api/tools/:id/events
 * Appends a new status event to the tool's immutable audit log
 */
router.post('/:id/events', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    const { id } = req.params;
    const tool = get('SELECT * FROM v_tools_current WHERE id = ?', [id.toUpperCase()]);

    if (!tool) {
      return res.status(404).json({ error: `Tool with ID '${id}' was not found.` });
    }

    const {
      status,
      location,
      notes,
      maintenance_flag,
      expected_return_date
    } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`
      });
    }

    // Role-based status transition enforcement
    const userRole = req.user.role;
    if (status === 'Inspected' && !['Inspector', 'Admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only Inspectors or Admins can record an inspection.' });
    }
    if (status === 'Repaired' && !['Inspector', 'Admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Only Inspectors or Admins can record a completed repair.' });
    }
    if (status === 'Retired' && userRole !== 'Admin') {
      return res.status(403).json({ error: 'Only Admins can retire or decommission a tool.' });
    }

    const now = new Date().toISOString();
    const eventLocation = location ? location.trim() : tool.current_location;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : (req.body.photo_base64 || null);

    // Maintenance flag handling:
    // If status is 'Returned' and maintenance_flag is set to 1 or true, tool becomes unavailable
    let isMaintenanceFlagged = 0;
    if (maintenance_flag === '1' || maintenance_flag === 1 || maintenance_flag === true || maintenance_flag === 'true') {
      isMaintenanceFlagged = 1;
    }
    if (status === 'Sent for Maintenance') {
      isMaintenanceFlagged = 1;
    }
    if (status === 'Repaired') {
      isMaintenanceFlagged = 0; // Cleared once repaired
    }

    // Update expected_return_date in master tools record if specified during Issuance
    if (status === 'Issued' && expected_return_date) {
      run('UPDATE tools SET expected_return_date = ? WHERE id = ?', [expected_return_date, tool.id]);
    } else if (status === 'Returned') {
      run('UPDATE tools SET expected_return_date = null WHERE id = ?', [tool.id]);
    }

    // Insert the immutable event record
    run(
      `INSERT INTO status_events (
        tool_id, status, updated_by, timestamp, location, notes, photo, maintenance_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tool.id,
        status,
        req.user.full_name,
        now,
        eventLocation,
        notes || '',
        photoPath,
        isMaintenanceFlagged
      ]
    );

    // Fetch the updated snapshot
    const updatedTool = get('SELECT * FROM v_tools_current WHERE id = ?', [tool.id]);
    const latestEvent = get('SELECT * FROM status_events WHERE tool_id = ? ORDER BY id DESC LIMIT 1', [tool.id]);

    return res.status(201).json({
      message: `Status updated to '${status}'.`,
      tool: updatedTool,
      event: latestEvent
    });
  } catch (err) {
    console.error('Error logging status event:', err);
    return res.status(500).json({ error: 'Failed to record status update.' });
  }
});

module.exports = router;
