import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, CircularProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import apiClient from '../api/client';

const STATUS_COLORS = { PENDING: 'warning', SENT: 'success', FAILED: 'error' };
const CHANNEL_COLORS = { IN_APP: 'primary', EMAIL: 'info', SMS: 'default' };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, []);

  async function handleMarkRead(id) {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, status: 'SENT' } : n));
    } catch { /* ignore */ }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Notifications</Typography>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    No notifications
                  </TableCell>
                </TableRow>
              ) : (
                items.map((n) => (
                  <TableRow key={n.id} hover>
                    <TableCell>
                      {n.first_name ? `${n.first_name} ${n.last_name}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip label={n.channel} size="small" color={CHANNEL_COLORS[n.channel] || 'default'} />
                    </TableCell>
                    <TableCell>{n.message}</TableCell>
                    <TableCell>
                      <Chip label={n.status} size="small" color={STATUS_COLORS[n.status] || 'default'} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(n.created_at || n.sent_at || Date.now()).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {n.status === 'PENDING' && (
                        <Button
                          size="small" startIcon={<CheckIcon />}
                          onClick={() => handleMarkRead(n.id)}
                        >
                          Mark Read
                        </Button>
                      )}
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
