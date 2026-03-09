const AuditLog = require('../models/AuditLog');

async function listAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.findAll(req.query);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function exportAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.findAll(req.query);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = ['ID', 'Actor', 'Action', 'Target', 'Detail', 'Timestamp'];
    const lines = [headers.join(',')];
    for (const l of logs) {
      lines.push([l.id, l.actor, l.action, l.target, l.detail,
        l.created_at ? new Date(l.created_at).toISOString().replace('T', ' ').substring(0, 19) : '',
      ].map(escape).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(lines.join('\r\n'));
  } catch (err) {
    next(err);
  }
}

module.exports = { listAuditLogs, exportAuditLogs };
