import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, CircularProgress, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import apiClient from '../api/client';

const EMPTY_FORM = { department_id: '', job_title: '', security_group_id: '' };

export default function MappingConfig() {
  const [mappings, setMappings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([
      apiClient.get('/mappings'),
      apiClient.get('/mappings/departments'),
      apiClient.get('/mappings/groups'),
    ]).then(([m, d, g]) => {
      setMappings(m.data || []);
      setDepartments(d.data || []);
      setGroups(g.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(m) {
    setEditId(m.id);
    setForm({ department_id: m.department_id, job_title: m.job_title, security_group_id: m.security_group_id });
    setOpen(true);
  }

  async function handleSave() {
    if (editId) {
      await apiClient.put(`/mappings/${editId}`, form);
    } else {
      await apiClient.post('/mappings', form);
    }
    const res = await apiClient.get('/mappings');
    setMappings(res.data || []);
    setOpen(false);
    setForm(EMPTY_FORM);
    setEditId(null);
  }

  async function handleDelete(id) {
    await apiClient.delete(`/mappings/${id}`);
    setMappings((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Mapping Configuration</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Mapping
        </Button>
      </Box>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Security Group</TableCell>
                <TableCell>AD DN</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                    No mappings configured
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.department_name}</TableCell>
                    <TableCell>{m.job_title}</TableCell>
                    <TableCell>{m.group_name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.ad_dn}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(m)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Edit Role Mapping' : 'Add Role Mapping'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select label="Department" value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })} fullWidth
          >
            {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Job Title" value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })} fullWidth
          />
          <TextField
            select label="Security Group" value={form.security_group_id}
            onChange={(e) => setForm({ ...form, security_group_id: e.target.value })} fullWidth
          >
            {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
