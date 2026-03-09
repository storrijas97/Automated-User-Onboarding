import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, TextField, MenuItem, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import apiClient from '../api/client';

const STATUS_COLORS = {
  COMPLETED: 'success', FAILED: 'error', PENDING: 'default',
  IN_PROGRESS: 'info', CANCELLED: 'warning',
};

const PRIORITY_COLORS = {
  LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'error',
};

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', type: '' });

  const fetchTasks = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.status) params.status = f.status;
      if (f.type) params.type = f.type;
      const res = await apiClient.get('/tasks', { params });
      setTasks(res.data || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { fetchTasks(); }, []); // eslint-disable-line

  function handleFilterChange(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchTasks(next);
  }

  async function handleFlagPriority(e, taskId, current) {
    e.stopPropagation();
    const next = current === 'CRITICAL' ? 'HIGH' : 'CRITICAL';
    try {
      await apiClient.put(`/tasks/${taskId}/priority`, { priority: next });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, priority: next } : t));
    } catch { /* ignore */ }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Tasks</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select label="Status" value={filters.status} size="small" sx={{ minWidth: 160 }}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Type" value={filters.type} size="small" sx={{ minWidth: 160 }}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            {['ONBOARDING', 'OFFBOARDING', 'ACCESS_CHANGE', 'PASSWORD_RESET'].map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" size="small" onClick={() => { setFilters({ status: '', type: '' }); fetchTasks({ status: '', type: '' }); }}>
            Clear
          </Button>
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
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((t) => (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t.id}`)}>
                    <TableCell>{t.id}</TableCell>
                    <TableCell>{t.first_name} {t.last_name}</TableCell>
                    <TableCell>
                      <Chip label={t.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.status} size="small" color={STATUS_COLORS[t.status] || 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.priority} size="small" color={PRIORITY_COLORS[t.priority] || 'default'} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={t.priority === 'CRITICAL' ? 'Remove critical flag' : 'Flag as critical'}>
                        <IconButton
                          size="small"
                          color={t.priority === 'CRITICAL' ? 'error' : 'default'}
                          onClick={(e) => handleFlagPriority(e, t.id, t.priority)}
                        >
                          <FlagIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View detail">
                        <IconButton size="small" onClick={() => navigate(`/tasks/${t.id}`)}>
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
