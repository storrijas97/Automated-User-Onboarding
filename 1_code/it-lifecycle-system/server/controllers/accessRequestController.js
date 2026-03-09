const AccessRequest = require('../models/AccessRequest');
const AuditLog = require('../models/AuditLog');

async function listAccessRequests(req, res, next) {
  try {
    const requests = await AccessRequest.findAll(req.query);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

async function createAccessRequest(req, res, next) {
  try {
    const { employee_id, group_id } = req.body;
    if (!employee_id || !group_id) {
      return res.status(400).json({ error: 'employee_id and group_id are required' });
    }
    const requested_by = req.user?.username || 'admin';
    const id = await AccessRequest.create({ employee_id, requested_by, group_id });
    await AuditLog.create({
      actor: requested_by,
      action: 'ACCESS_REQUEST_CREATED',
      target: String(employee_id),
      detail: `Requested security group ${group_id}`,
    });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

async function approveAccessRequest(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    await AccessRequest.updateStatus(request.id, 'APPROVED');
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'ACCESS_REQUEST_APPROVED',
      target: String(request.id),
      detail: `Approved access request for employee ${request.employee_id}`,
    });
    res.json({ message: 'Access request approved' });
  } catch (err) {
    next(err);
  }
}

async function rejectAccessRequest(req, res, next) {
  try {
    const request = await AccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    await AccessRequest.updateStatus(request.id, 'REJECTED');
    await AuditLog.create({
      actor: req.user?.username || 'admin',
      action: 'ACCESS_REQUEST_REJECTED',
      target: String(request.id),
      detail: req.body.reason || `Rejected access request for employee ${request.employee_id}`,
    });
    res.json({ message: 'Access request rejected' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAccessRequests, createAccessRequest, approveAccessRequest, rejectAccessRequest };
