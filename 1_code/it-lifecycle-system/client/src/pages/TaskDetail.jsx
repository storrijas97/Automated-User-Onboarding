import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Box, Paper, Chip, Button, Divider,
  List, ListItem, ListItemText, CircularProgress, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../api/client';

const STATUS_COLORS = {
  COMPLETED: 'success', FAILED: 'error', PENDING: 'default',
  IN_PROGRESS: 'info', CANCELLED: 'warning', SUCCESS: 'success',
  SKIPPED: 'default',
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get(`/tasks/${id}`)
      .then((res) => setTask(res.data))
      .catch(() => setError('Task not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    await apiClient.post(`/tasks/${id}/approve`);
    navigate('/tasks');
  }

  async function handleReject() {
    await apiClient.post(`/tasks/${id}/reject`, { reason: 'Rejected by admin' });
    navigate('/tasks');
  }

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tasks')} sx={{ mb: 2 }}>
        Back to Tasks
      </Button>

      <Typography variant="h4" gutterBottom>Task Detail</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="h6">#{task.id} — {task.type}</Typography>
          <Chip label={task.status} color={STATUS_COLORS[task.status] || 'default'} />
          <Chip label={`Priority: ${task.priority}`} variant="outlined" size="small" />
        </Box>
        <Typography><strong>Employee:</strong> {task.first_name} {task.last_name}</Typography>
        <Typography><strong>Created:</strong> {new Date(task.created_at).toLocaleString()}</Typography>
        {task.completed_at && (
          <Typography><strong>Completed:</strong> {new Date(task.completed_at).toLocaleString()}</Typography>
        )}

        {task.status === 'PENDING' && (
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={handleApprove}>
              Approve
            </Button>
            <Button variant="outlined" color="error" startIcon={<CloseIcon />} onClick={handleReject}>
              Reject
            </Button>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Steps</Typography>
        <Divider sx={{ mb: 1 }} />
        {(task.steps || []).length === 0 ? (
          <Typography color="text.secondary">No steps recorded</Typography>
        ) : (
          <List dense>
            {task.steps.map((step) => (
              <ListItem key={step.id} sx={{ borderBottom: '1px solid #f0f0f0' }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{step.action_type}</span>
                      <Chip label={step.status} size="small" color={STATUS_COLORS[step.status] || 'default'} />
                    </Box>
                  }
                  secondary={step.detail}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
