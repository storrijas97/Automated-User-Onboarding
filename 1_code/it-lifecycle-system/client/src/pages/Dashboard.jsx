import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Grid, Paper, Box, Chip, CircularProgress,
  Button, Alert, Divider, Table, TableHead, TableRow,
  TableCell, TableBody, Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import CircleIcon from '@mui/icons-material/Circle';
import apiClient from '../api/client';

function StatCard({ title, value, icon, color, loading }) {
  return (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color }}>
          {loading ? <CircularProgress size={28} sx={{ color }} /> : (value ?? 0)}
        </Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Box>
    </Paper>
  );
}

export default function Dashboard() {
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [syncInfo, setSyncInfo] = useState(null);
  const [loadingSync, setLoadingSync] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState(null);

  useEffect(() => {
    apiClient.get('/tasks/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    apiClient.get('/tasks?limit=10')
      .then((res) => setRecentTasks(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingTasks(false));
  }, []);

  const fetchSyncStatus = useCallback(() => {
    setLoadingSync(true);
    apiClient.get('/sync/status')
      .then((res) => setSyncInfo(res.data))
      .catch(() => setSyncInfo(null))
      .finally(() => setLoadingSync(false));
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const handleSyncNow = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      await apiClient.post('/sync/trigger');
      setTriggerMsg({ type: 'info', text: 'Sync triggered — refreshing status in 5 seconds…' });
      setTimeout(() => {
        fetchSyncStatus();
        setTriggerMsg(null);
      }, 5000);
    } catch {
      setTriggerMsg({ type: 'error', text: 'Failed to trigger sync.' });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Employees" value={stats?.total_employees}
            icon={<PeopleIcon fontSize="inherit" />} color="#1565c0" loading={loadingStats} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Tasks" value={stats?.pending_tasks}
            icon={<AssignmentIcon fontSize="inherit" />} color="#f57f17" loading={loadingStats} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed Today" value={stats?.completed_today}
            icon={<CheckCircleIcon fontSize="inherit" />} color="#2e7d32" loading={loadingStats} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Failed Tasks" value={stats?.failed_tasks}
            icon={<ErrorIcon fontSize="inherit" />} color="#c62828" loading={loadingStats} />
        </Grid>
      </Grid>

      {/* ── OrangeHRM Sync Status ────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">OrangeHRM Sync Status</Typography>
          <Button
            variant="contained"
            startIcon={triggering ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncNow}
            disabled={triggering}
            size="small"
          >
            Sync Now
          </Button>
        </Box>

        {triggerMsg && (
          <Alert severity={triggerMsg.type} sx={{ mb: 2 }}>{triggerMsg.text}</Alert>
        )}

        {loadingSync ? (
          <CircularProgress size={24} />
        ) : !syncInfo ? (
          <Alert severity="error">Could not load sync status.</Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircleIcon sx={{ fontSize: 14, color: syncInfo.hrmConnected ? 'success.main' : 'error.main' }} />
                  <Typography variant="body2">
                    OrangeHRM DB: <strong>{syncInfo.hrmConnected ? 'Connected' : 'Disconnected'}</strong>
                  </Typography>
                </Box>
                {syncInfo.hrmError && (
                  <Typography variant="caption" color="error">{syncInfo.hrmError}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2">
                  Employees in OrangeHRM: <strong>{syncInfo.hrmEmployeeCount ?? '—'}</strong>
                </Typography>
                <Typography variant="body2">
                  Departments synced: <strong>{syncInfo.departmentsTracked ?? '—'}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2">
                  Last sync: <strong>{syncInfo.lastRun ? new Date(syncInfo.lastRun).toLocaleString() : 'Not yet run'}</strong>
                </Typography>
                {syncInfo.lastResult && (
                  <Chip
                    label={syncInfo.lastResult}
                    size="small"
                    color={syncInfo.lastResult === 'success' ? 'success' : 'error'}
                    sx={{ mt: 0.5 }}
                  />
                )}
                {syncInfo.lastError && (
                  <Typography variant="caption" color="error" display="block">{syncInfo.lastError}</Typography>
                )}
              </Grid>
            </Grid>

            {syncInfo.hrmEmployees && syncInfo.hrmEmployees.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Employees in OrangeHRM</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Emp #</TableCell>
                      <TableCell>First Name</TableCell>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Job Title</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {syncInfo.hrmEmployees.map((e) => (
                      <TableRow key={e.empNumber}>
                        <TableCell>{e.empNumber}</TableCell>
                        <TableCell>{e.firstName}</TableCell>
                        <TableCell>{e.lastName}</TableCell>
                        <TableCell>{e.email || <em style={{ color: '#999' }}>—</em>}</TableCell>
                        <TableCell>{e.jobTitle || <em style={{ color: '#999' }}>—</em>}</TableCell>
                        <TableCell>{e.departmentName || <em style={{ color: '#999' }}>—</em>}</TableCell>
                        <TableCell>
                          <Chip
                            label={e.status}
                            size="small"
                            color={e.status === 'ACTIVE' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </>
        )}
      </Paper>

      {/* ── Recent Tasks ─────────────────────────────────────────────── */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Tasks</Typography>
        {loadingTasks ? (
          <CircularProgress size={24} />
        ) : recentTasks.length === 0 ? (
          <Typography color="text.secondary">No recent tasks</Typography>
        ) : (
          recentTasks.map((task) => (
            <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: '1px solid #eee' }}>
              <Typography sx={{ flexGrow: 1 }}>
                <strong>#{task.id}</strong> — {task.first_name} {task.last_name} &nbsp;|&nbsp; {task.type}
              </Typography>
              <Chip
                label={task.status}
                size="small"
                color={
                  task.status === 'COMPLETED' ? 'success' :
                  task.status === 'FAILED' ? 'error' :
                  task.status === 'IN_PROGRESS' ? 'info' : 'default'
                }
              />
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
}
