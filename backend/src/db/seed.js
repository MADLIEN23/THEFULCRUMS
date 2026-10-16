// Database seed script for ToolTrack
// Populates 3 role-based demo users and 10 realistic tools covering the full lifecycle

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { db, exec, query, get } = require('./db');

function seed() {
  console.log('--- Starting ToolTrack Database Initialization ---');

  // Step 1: Read and execute the SQL schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  exec(schemaSql);
  console.log('Database schema verified and loaded.');

  // Step 2: Clear existing data for clean re-seeding
  db.exec('DELETE FROM status_events;');
  db.exec('DELETE FROM tools;');
  db.exec('DELETE FROM users;');
  console.log('Existing records cleared.');

  // Step 3: Seed 3 demo users (one for each role)
  // Password for all demo accounts is "password123"
  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  const now = new Date().toISOString();

  const users = [
    {
      username: 'admin',
      password_hash: defaultPasswordHash,
      full_name: 'Alex Rivera',
      role: 'Admin',
      department: 'Shop Management',
      created_at: now
    },
    {
      username: 'operator',
      password_hash: defaultPasswordHash,
      full_name: 'Marcus Vance',
      role: 'Operator',
      department: 'Assembly',
      created_at: now
    },
    {
      username: 'inspector',
      password_hash: defaultPasswordHash,
      full_name: 'Sarah Chen',
      role: 'Inspector',
      department: 'Quality Assurance',
      created_at: now
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(
      user.username,
      user.password_hash,
      user.full_name,
      user.role,
      user.department,
      user.created_at
    );
  }
  console.log(`Seeded ${users.length} demo users (Admin, Operator, Inspector).`);

  // Step 4: Seed 10 realistic factory tools covering all lifecycle states
  const tools = [
    {
      id: 'TL-1001',
      name: 'Bosch 18V Cordless Impact Driver',
      type: 'Power Tool',
      serial_number: 'SN-BOS-98214',
      department: 'Assembly',
      location: 'Tool Crib A - Shelf 2',
      owner: 'Marcus Vance',
      condition: 'New',
      expected_return_date: null,
      maintenance_due_date: '2026-12-15',
      created_at: '2026-10-01T08:30:00.000Z'
    },
    {
      id: 'TL-1002',
      name: 'Mitutoyo Digital Vernier Caliper (0-150mm)',
      type: 'Measuring Instrument',
      serial_number: 'SN-MIT-44102',
      department: 'Quality Assurance',
      location: 'Receiving Dock B',
      owner: 'Sarah Chen',
      condition: 'New',
      expected_return_date: null,
      maintenance_due_date: '2026-11-20',
      created_at: '2026-10-02T09:00:00.000Z'
    },
    {
      id: 'TL-1003',
      name: 'Fluke 87V Industrial Multimeter',
      type: 'Electrical Testing',
      serial_number: 'SN-FLK-55319',
      department: 'Maintenance',
      location: 'QC Calibration Bench',
      owner: 'Sarah Chen',
      condition: 'Good',
      expected_return_date: null,
      maintenance_due_date: '2026-12-01',
      created_at: '2026-09-15T08:00:00.000Z'
    },
    {
      id: 'TL-1004',
      name: 'Milwaukee Heavy-Duty Magnetic Drill Press',
      type: 'Heavy Machinery',
      serial_number: 'SN-MIL-10294',
      department: 'Fabrication',
      location: 'Structural Steel Bay 4',
      owner: 'Marcus Vance',
      condition: 'Good',
      expected_return_date: '2026-10-25',
      maintenance_due_date: '2026-12-30',
      created_at: '2026-09-10T08:00:00.000Z'
    },
    {
      id: 'TL-1005',
      name: 'DeWalt 12-Inch Sliding Compound Miter Saw',
      type: 'Power Tool',
      serial_number: 'SN-DEW-77812',
      department: 'Carpentry & Crating',
      location: 'Bay 2 - Cutting Station',
      owner: 'Marcus Vance',
      condition: 'Fair',
      expected_return_date: '2026-10-10', // Overdue red flag!
      maintenance_due_date: '2026-11-15',
      created_at: '2026-08-01T09:00:00.000Z'
    },
    {
      id: 'TL-1006',
      name: 'Snap-on Electronic Torque Wrench (1/2" Drive)',
      type: 'Precision Hand Tool',
      serial_number: 'SN-SNP-33120',
      department: 'Machining',
      location: 'Tool Crib A - Quarantine Shelf',
      owner: 'Marcus Vance',
      condition: 'Poor',
      expected_return_date: null,
      maintenance_due_date: '2026-10-30',
      created_at: '2026-07-15T08:00:00.000Z'
    },
    {
      id: 'TL-1007',
      name: 'Ingersoll Rand 1/2" Pneumatic Impact Wrench',
      type: 'Pneumatic Tool',
      serial_number: 'SN-IR-66014',
      department: 'Assembly',
      location: 'Central Maintenance Bay',
      owner: 'Alex Rivera',
      condition: 'Fair',
      expected_return_date: null,
      maintenance_due_date: '2026-10-05',
      created_at: '2026-06-01T08:00:00.000Z'
    },
    {
      id: 'TL-1008',
      name: 'Lincoln Electric Square Wave TIG Welder',
      type: 'Welding Equipment',
      serial_number: 'SN-LNC-88203',
      department: 'Fabrication',
      location: 'Welding Shop Cell 1',
      owner: 'Alex Rivera',
      condition: 'Good',
      expected_return_date: null,
      maintenance_due_date: '2026-12-31',
      created_at: '2026-05-10T08:00:00.000Z'
    },
    {
      id: 'TL-1009',
      name: 'Makita 7-Inch Angle Grinder (9557PB)',
      type: 'Power Tool',
      serial_number: 'SN-MAK-12005',
      department: 'Machining',
      location: 'Decommission Storage Rack',
      owner: 'Alex Rivera',
      condition: 'Scrapped',
      expected_return_date: null,
      maintenance_due_date: null,
      created_at: '2025-01-10T08:00:00.000Z'
    },
    {
      id: 'TL-1010',
      name: 'Starrett Dial Indicator (0.001" Resolution)',
      type: 'Precision Measuring',
      serial_number: 'SN-STR-90412',
      department: 'Quality Assurance',
      location: 'Tool Crib A - Precision Cabinet',
      owner: 'Sarah Chen',
      condition: 'Good',
      expected_return_date: null,
      maintenance_due_date: '2026-10-01', // Maintenance/calibration past due red flag!
      created_at: '2026-04-01T08:00:00.000Z'
    }
  ];

  const insertTool = db.prepare(`
    INSERT INTO tools (
      id, name, type, serial_number, department, location, owner,
      condition, expected_return_date, maintenance_due_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of tools) {
    insertTool.run(
      t.id,
      t.name,
      t.type,
      t.serial_number,
      t.department,
      t.location,
      t.owner,
      t.condition,
      t.expected_return_date,
      t.maintenance_due_date,
      t.created_at
    );
  }
  console.log(`Seeded ${tools.length} master tools.`);

  // Step 5: Seed immutable status events for complete audit history
  const events = [
    // TL-1001: Registered
    {
      tool_id: 'TL-1001',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-01T08:30:00.000Z',
      location: 'Tool Crib A - Shelf 2',
      notes: 'Purchased via PO-8841. Barcode label attached and logged.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1002: Registered -> Received (Awaiting Inspection)
    {
      tool_id: 'TL-1002',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-02T09:00:00.000Z',
      location: 'Receiving Dock B',
      notes: 'Direct intake from supplier delivery manifest.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1002',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-10-02T11:30:00.000Z',
      location: 'Receiving Dock B',
      notes: 'Unboxed and verified serial against invoice. Awaiting QA calibration.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1003: Registered -> Received -> Inspected
    {
      tool_id: 'TL-1003',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-15T08:00:00.000Z',
      location: 'Receiving Dock B',
      notes: 'Procured for maintenance electrical diagnostic kit.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1003',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-09-15T10:15:00.000Z',
      location: 'Receiving Dock B',
      notes: 'Intake package verified without external damage.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1003',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-09-16T14:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'Voltage sensitivity and continuity buzzer calibration passed.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1004: Registered -> Received -> Inspected -> Issued
    {
      tool_id: 'TL-1004',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-10T08:00:00.000Z',
      location: 'Tool Crib A',
      notes: 'Heavy mag drill added to shop inventory.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1004',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-09-10T10:00:00.000Z',
      location: 'Tool Crib A',
      notes: 'Received with 3 chuck keys and safety strap.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1004',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-09-11T11:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'Magnetic hold force tested at 1200 kg. Safety relay operational.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1004',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-12T07:30:00.000Z',
      location: 'Structural Steel Bay 4',
      notes: 'Issued to Marcus Vance for I-beam drilling batch. Expected back Oct 25.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1005: Registered -> Received -> Inspected -> Issued -> In Use (Overdue Return)
    {
      tool_id: 'TL-1005',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-08-01T09:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Workshop miter saw registered.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1005',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-08-01T11:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Received with 60T carbide blade.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1005',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-08-02T13:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Blade guard retract and electric brake stop verified under 3 seconds.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1005',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-01T08:00:00.000Z',
      location: 'Bay 2 - Cutting Station',
      notes: 'Issued to carpentry team for pallet fabrication run.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1005',
      status: 'In Use',
      updated_by: 'Marcus Vance',
      timestamp: '2026-10-02T08:30:00.000Z',
      location: 'Bay 2 - Cutting Station',
      notes: 'Active on cutting bench. Expected return was Oct 10.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1006: Registered -> Received -> Inspected -> Issued -> In Use -> Returned (Maintenance Required Flag)
    {
      tool_id: 'TL-1006',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-07-15T08:00:00.000Z',
      location: 'Tool Crib A',
      notes: 'Electronic torque wrench registered with calibration certificate.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1006',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-07-15T09:30:00.000Z',
      location: 'Tool Crib A',
      notes: 'Hard case and battery pack verified.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1006',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-07-16T10:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'Torque transducer readings verified across 50-250 ft-lbs.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1006',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-05T08:00:00.000Z',
      location: 'Engine Assembly Bay',
      notes: 'Issued for engine mount tightening.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1006',
      status: 'In Use',
      updated_by: 'Marcus Vance',
      timestamp: '2026-10-06T09:00:00.000Z',
      location: 'Engine Assembly Bay',
      notes: 'In operation on shift 1.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1006',
      status: 'Returned',
      updated_by: 'Marcus Vance',
      timestamp: '2026-10-14T10:00:00.000Z',
      location: 'Tool Crib A - Quarantine Shelf',
      notes: 'Ratcheting gear slips at torque above 180 ft-lbs. Flagged for maintenance.',
      photo: null,
      maintenance_flag: 1 // Trigger alert and unavailable state!
    },

    // TL-1007: Sent for Maintenance
    {
      tool_id: 'TL-1007',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-06-01T08:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Heavy pneumatic impact wrench.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1007',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-06-01T09:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Received with 1/4" NPT quick disconnect.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1007',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-06-02T10:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'Operating air pressure verified at 90 PSI.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1007',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-18T08:00:00.000Z',
      location: 'Chassis Assembly Line',
      notes: 'Issued to suspension subassembly.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1007',
      status: 'In Use',
      updated_by: 'Marcus Vance',
      timestamp: '2026-09-19T08:30:00.000Z',
      location: 'Chassis Assembly Line',
      notes: 'Daily line duty.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1007',
      status: 'Returned',
      updated_by: 'Marcus Vance',
      timestamp: '2026-10-08T16:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Air leak detected around forward/reverse valve gasket.',
      photo: null,
      maintenance_flag: 1
    },
    {
      tool_id: 'TL-1007',
      status: 'Sent for Maintenance',
      updated_by: 'Alex Rivera',
      timestamp: '2026-10-09T09:00:00.000Z',
      location: 'Central Maintenance Bay',
      notes: 'Transferred to pneumatic repair shop for valve rebuild kit.',
      photo: null,
      maintenance_flag: 1
    },

    // TL-1008: Repaired
    {
      tool_id: 'TL-1008',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-05-10T08:00:00.000Z',
      location: 'Welding Shop Cell 1',
      notes: 'TIG inverter welding machine.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1008',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-05-10T09:30:00.000Z',
      location: 'Welding Shop Cell 1',
      notes: 'Delivered with WP-17 torch and ground clamp.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1008',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-05-11T11:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'HF arc ignition and post-flow timer verified.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1008',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-08-01T08:00:00.000Z',
      location: 'Welding Shop Cell 1',
      notes: 'Issued for aluminum fuel tank welding.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1008',
      status: 'In Use',
      updated_by: 'Marcus Vance',
      timestamp: '2026-08-02T08:00:00.000Z',
      location: 'Welding Shop Cell 1',
      notes: 'In active production run.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1008',
      status: 'Returned',
      updated_by: 'Marcus Vance',
      timestamp: '2026-09-25T15:30:00.000Z',
      location: 'Tool Crib A',
      notes: 'High frequency starter failed to initiate arc cleanly.',
      photo: null,
      maintenance_flag: 1
    },
    {
      tool_id: 'TL-1008',
      status: 'Sent for Maintenance',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-26T09:00:00.000Z',
      location: 'Central Maintenance Bay',
      notes: 'Sent to certified warranty repair provider.',
      photo: null,
      maintenance_flag: 1
    },
    {
      tool_id: 'TL-1008',
      status: 'Repaired',
      updated_by: 'Sarah Chen',
      timestamp: '2026-10-11T14:00:00.000Z',
      location: 'Welding Shop Cell 1',
      notes: 'HF capacitor replaced. Test weld on 1/8" aluminum coupon passed. Cleared for service.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1009: Retired
    {
      tool_id: 'TL-1009',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2025-01-10T08:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Standard 7-inch angle grinder.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1009',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2025-01-10T09:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Received and tagged.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1009',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2025-01-11T10:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Safety guard and lock button functional.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1009',
      status: 'Issued',
      updated_by: 'Alex Rivera',
      timestamp: '2026-08-10T08:00:00.000Z',
      location: 'Heavy Grind Station',
      notes: 'Issued for weld beveling.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1009',
      status: 'In Use',
      updated_by: 'Marcus Vance',
      timestamp: '2026-08-11T08:00:00.000Z',
      location: 'Heavy Grind Station',
      notes: 'Heavy structural grinding.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1009',
      status: 'Returned',
      updated_by: 'Marcus Vance',
      timestamp: '2026-09-01T16:00:00.000Z',
      location: 'Tool Crib B',
      notes: 'Motor sparked heavily and seized during grinding.',
      photo: null,
      maintenance_flag: 1
    },
    {
      tool_id: 'TL-1009',
      status: 'Sent for Maintenance',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-02T09:00:00.000Z',
      location: 'Central Maintenance Bay',
      notes: 'Internal inspection performed.',
      photo: null,
      maintenance_flag: 1
    },
    {
      tool_id: 'TL-1009',
      status: 'Retired',
      updated_by: 'Alex Rivera',
      timestamp: '2026-09-05T11:00:00.000Z',
      location: 'Decommission Storage Rack',
      notes: 'Armature windings destroyed and bearing housing cracked. Beyond economical repair. Scrapped.',
      photo: null,
      maintenance_flag: 0
    },

    // TL-1010: Inspected (Overdue Calibration)
    {
      tool_id: 'TL-1010',
      status: 'Registered',
      updated_by: 'Alex Rivera',
      timestamp: '2026-04-01T08:00:00.000Z',
      location: 'Tool Crib A - Precision Cabinet',
      notes: 'Precision dial indicator.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1010',
      status: 'Received',
      updated_by: 'Marcus Vance',
      timestamp: '2026-04-01T09:00:00.000Z',
      location: 'Tool Crib A - Precision Cabinet',
      notes: 'Inspected velvet-lined case.',
      photo: null,
      maintenance_flag: 0
    },
    {
      tool_id: 'TL-1010',
      status: 'Inspected',
      updated_by: 'Sarah Chen',
      timestamp: '2026-04-02T10:00:00.000Z',
      location: 'QC Calibration Bench',
      notes: 'Calibrated with grade 0 gauge blocks. 6-month calibration interval assigned.',
      photo: null,
      maintenance_flag: 0
    }
  ];

  const insertEvent = db.prepare(`
    INSERT INTO status_events (
      tool_id, status, updated_by, timestamp, location, notes, photo, maintenance_flag
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ev of events) {
    insertEvent.run(
      ev.tool_id,
      ev.status,
      ev.updated_by,
      ev.timestamp,
      ev.location,
      ev.notes,
      ev.photo,
      ev.maintenance_flag
    );
  }
  console.log(`Seeded ${events.length} audit history events.`);

  // Step 6: Verify computed view
  const currentTools = query('SELECT id, name, current_status, current_location, maintenance_flag FROM v_tools_current ORDER BY id ASC');
  console.log('\n--- Seed Verification: Current Tool Statuses ---');
  console.table(currentTools);

  console.log('--- ToolTrack Database Seed Completed Successfully ---');
}

// Execute seed if run directly from the command line
if (require.main === module) {
  seed();
}

module.exports = { seed };
