const Report = require('../models/Report');
const db = require('../config/db');

async function listReports(req, res, next) {
  try {
    const reports = await Report.findAll();
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

async function generateReport(req, res, next) {
  try {
    const { type, start_date, end_date, department_id } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });

    const actor = req.user?.username || 'admin';
    const id = await Report.create({ type, generated_by: actor, file_path: null, start_date, end_date, department_id });
    res.status(201).json({ id, message: 'Report created. Use the download endpoint to retrieve CSV.' });
  } catch (err) {
    next(err);
  }
}

async function downloadReport(req, res, next) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const csv = await buildCSV(report);
    const filename = `report-${report.id}-${report.type}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

async function buildCSV(report) {
  const type = report.type;
  const { start_date, end_date, department_id } = report;

  // Build reusable date+department condition helper
  function dateConditions(tableAlias, conditions, params) {
    if (start_date) { conditions.push(`${tableAlias}.created_at >= ?`); params.push(start_date); }
    if (end_date)   { conditions.push(`${tableAlias}.created_at <= ?`); params.push(end_date + ' 23:59:59'); }
  }

  if (type === 'ONBOARDING_SUMMARY' || type === 'OFFBOARDING_SUMMARY') {
    const taskType = type === 'ONBOARDING_SUMMARY' ? 'ONBOARDING' : 'OFFBOARDING';
    const conditions = ['t.type = ?'];
    const params = [taskType];
    dateConditions('t', conditions, params);
    if (department_id) { conditions.push('e.department_id = ?'); params.push(department_id); }
    const [rows] = await db.query(`
      SELECT t.id, t.type, t.status, t.priority, t.created_at, t.completed_at,
             e.first_name, e.last_name, e.email, e.job_title
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.created_at DESC
    `, params);
    return toCSV(
      ['Task ID', 'Type', 'Status', 'Priority', 'Employee', 'Email', 'Job Title', 'Created', 'Completed'],
      rows.map((r) => [
        r.id, r.type, r.status, r.priority,
        `${r.first_name} ${r.last_name}`, r.email, r.job_title,
        fmtDate(r.created_at), fmtDate(r.completed_at),
      ])
    );
  }

  if (type === 'ACCESS_AUDIT') {
    const conditions = [];
    const params = [];
    dateConditions('ar', conditions, params);
    if (department_id) { conditions.push('e.department_id = ?'); params.push(department_id); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT ar.id, ar.status, ar.requested_by, ar.created_at,
             e.first_name, e.last_name, sg.name AS group_name, sg.ad_dn
      FROM access_requests ar
      JOIN employees e ON ar.employee_id = e.id
      JOIN security_groups sg ON ar.group_id = sg.id
      ${where}
      ORDER BY ar.created_at DESC
    `, params);
    return toCSV(
      ['Request ID', 'Status', 'Employee', 'Security Group', 'AD DN', 'Requested By', 'Date'],
      rows.map((r) => [
        r.id, r.status, `${r.first_name} ${r.last_name}`,
        r.group_name, r.ad_dn, r.requested_by, fmtDate(r.created_at),
      ])
    );
  }

  if (type === 'TASK_STATUS') {
    const conditions = [];
    const params = [];
    dateConditions('t', conditions, params);
    if (department_id) { conditions.push('e.department_id = ?'); params.push(department_id); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(`
      SELECT t.id, t.type, t.status, t.priority, t.created_at, t.completed_at,
             e.first_name, e.last_name
      FROM tasks t
      JOIN employees e ON t.employee_id = e.id
      ${where}
      ORDER BY t.created_at DESC
    `, params);
    return toCSV(
      ['Task ID', 'Type', 'Status', 'Priority', 'Employee', 'Created', 'Completed'],
      rows.map((r) => [
        r.id, r.type, r.status, r.priority,
        `${r.first_name} ${r.last_name}`,
        fmtDate(r.created_at), fmtDate(r.completed_at),
      ])
    );
  }

  // FULL_AUDIT — default for unknown types
  const conditions = [];
  const params = [];
  dateConditions('al', conditions, params);
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT id, actor, action, target, detail, created_at FROM audit_logs al ${where} ORDER BY created_at DESC`,
    params
  );
  return toCSV(
    ['Log ID', 'Actor', 'Action', 'Target', 'Detail', 'Timestamp'],
    rows.map((r) => [r.id, r.actor, r.action, r.target, r.detail, fmtDate(r.created_at)])
  );
}

function toCSV(headers, rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\r\n');
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().replace('T', ' ').substring(0, 19);
}

module.exports = { listReports, generateReport, downloadReport };
