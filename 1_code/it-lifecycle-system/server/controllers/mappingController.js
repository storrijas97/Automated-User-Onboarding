const RoleMapping = require('../models/RoleMapping');
const Department = require('../models/Department');
const SecurityGroup = require('../models/SecurityGroup');

async function listMappings(req, res, next) {
  try {
    const mappings = await RoleMapping.findAll();
    res.json(mappings);
  } catch (err) {
    next(err);
  }
}

async function createMapping(req, res, next) {
  try {
    const { department_id, job_title, security_group_id } = req.body;
    if (!department_id || !job_title || !security_group_id) {
      return res.status(400).json({ error: 'department_id, job_title, and security_group_id are required' });
    }
    const id = await RoleMapping.create({ department_id, job_title, security_group_id });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

async function updateMapping(req, res, next) {
  try {
    const { department_id, job_title, security_group_id } = req.body;
    await RoleMapping.update(req.params.id, { department_id, job_title, security_group_id });
    res.json({ message: 'Mapping updated' });
  } catch (err) {
    next(err);
  }
}

async function deleteMapping(req, res, next) {
  try {
    await RoleMapping.delete(req.params.id);
    res.json({ message: 'Mapping deleted' });
  } catch (err) {
    next(err);
  }
}

async function listDepartments(req, res, next) {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (err) {
    next(err);
  }
}

async function listGroups(req, res, next) {
  try {
    const groups = await SecurityGroup.findAll();
    res.json(groups);
  } catch (err) {
    next(err);
  }
}

async function createGroup(req, res, next) {
  try {
    const { name, ad_dn } = req.body;
    if (!name || !ad_dn) return res.status(400).json({ error: 'name and ad_dn are required' });
    const id = await SecurityGroup.create({ name, ad_dn });
    res.status(201).json({ id });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMappings, createMapping, updateMapping, deleteMapping, listDepartments, listGroups, createGroup };
