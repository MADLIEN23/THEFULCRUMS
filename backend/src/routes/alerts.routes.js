// Alerts and Red Flags Route
// Aggregates operational red flags: overdue returns, uninspected tools, and maintenance alerts

const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/alerts
 * Returns categorized lists of tools requiring immediate workshop attention
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Overdue Returns: Tools checked out whose expected return date has passed
    const overdueTools = query(`
      SELECT 
        id, name, department, current_location, owner,
        current_status, expected_return_date, last_updated_by, last_updated_at
      FROM v_tools_current
      WHERE current_status IN ('Issued', 'In Use')
        AND expected_return_date IS NOT NULL
        AND expected_return_date < ?
      ORDER BY expected_return_date ASC
    `, [today]);

    // 2. Awaiting Inspection: Newly registered or received tools not yet cleared by QA
    const awaitingInspectionTools = query(`
      SELECT 
        id, name, department, current_location, owner,
        current_status, last_updated_by, last_updated_at
      FROM v_tools_current
      WHERE current_status IN ('Registered', 'Received')
      ORDER BY last_updated_at ASC
    `);

    // 3. Maintenance Required / Due:
    // - Returned with damage flag
    // - In maintenance bay
    // - Overdue for periodic calibration
    const maintenanceAlerts = query(`
      SELECT 
        id, name, department, current_location, owner,
        current_status, maintenance_due_date, maintenance_flag,
        last_notes, last_updated_by, last_updated_at
      FROM v_tools_current
      WHERE maintenance_flag = 1
         OR current_status = 'Sent for Maintenance'
         OR (maintenance_due_date IS NOT NULL AND maintenance_due_date < ?)
      ORDER BY last_updated_at DESC
    `, [today]);

    const totalRedFlags = overdueTools.length + awaitingInspectionTools.length + maintenanceAlerts.length;

    return res.json({
      summary: {
        total: totalRedFlags,
        overdue_count: overdueTools.length,
        awaiting_inspection_count: awaitingInspectionTools.length,
        maintenance_due_count: maintenanceAlerts.length
      },
      alerts: {
        overdue: overdueTools,
        awaiting_inspection: awaitingInspectionTools,
        maintenance: maintenanceAlerts
      }
    });
  } catch (err) {
    console.error('Error retrieving alerts:', err);
    return res.status(500).json({ error: 'Failed to retrieve operational alerts.' });
  }
});

module.exports = router;
