import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, Alert, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../api/client';

const STATUS_COLORS = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };

export default function AccessRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', group_id: '' });
  const [filterStatus, setFilterStatus] = useState('');
  const [alert, setAlert] = useState('');

  useEffect(() => {
    fetchRequests();
    apiClient.get('/employees').then((r) => setEmployees(r.data || [])).catch(() => {});
    apiClient.get('/mappings/groups').then((r) => setGroups(r.data || [])).catch(() => {});
  }, []);

  async function fetchRequests(status = filterStatus) {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const res = await apiClient.get('/access-requests', { params });
      setRequests(res.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.employee_id || !form.group_id) return;
    try {
      await apiClient.post('/access-requests', form);
      setOpen(false);
      setForm({ employee_id: '', group_id: '' });
      await fetchRequests();
      setAlert('Access request submitted successfully');
    } catch {
      setAlert('Failed to submit request');
    }
  }

  async function handleApprove(id) {
    try {
      await apiClient.post(`/access-requests/${id}/approve`);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
    } catch {
      setAlert('Failed to approve request');
    }
  }

  async function handleReject(id) {
    try {
      await apiClient.post(`/access-requests/${id}/reject`);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    } catch {
      setAlert('Failed to reject request');
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4">Access Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Request
        </Button>
      </Box>

      {alert && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select label="Filter by status" value={filterStatus} size="small" sx={{ minWidth: 180 }}
            onChange={(e) => { setFilterStatus(e.target.value); fetchRequests(e.target.value); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Security Group</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                    No access requests found
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.first_name} {r.last_name}</TableCell>
                    <TableCell>{r.group_name}</TableCell>
                    <TableCell>{r.requested_by}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small" color={STATUS_COLORS[r.status] || 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      {r.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleApprove(r.id)}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => handleReject(r.id)}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Access Request</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select label="Employee" value={form.employee_id} fullWidth
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
          >
            {employees.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.first_name} {e.last_name} — {e.job_title || 'N/A'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Security Group" value={form.group_id} fullWidth
            onChange={(e) => setForm({ ...form, group_id: e.target.value })}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.employee_id || !form.group_id}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
