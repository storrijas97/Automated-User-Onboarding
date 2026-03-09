import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, TextField, Button, CircularProgress, TablePagination,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ actor: '', action: '', from: '', to: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);

  useEffect(() => {
    fetchLogs();
  }, []);

  function buildParams() {
    const params = {};
    if (filters.actor) params.actor = filters.actor;
    if (filters.action) params.action = filters.action;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to + 'T23:59:59';
    return params;
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await apiClient.get('/audit', { params: buildParams() });
      setLogs(res.data || []);
      setPage(0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams(buildParams());
    fetch(`http://localhost:4000/api/audit/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => res.blob()).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Audit Log</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
          Export CSV
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Filter by actor" size="small" value={filters.actor}
            onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
          />
          <TextField
            label="Filter by action" size="small" value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          />
          <TextField
            label="From date" type="date" size="small" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To date" type="date" size="small" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={fetchLogs}>
            Apply Filters
          </Button>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.actor}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{log.action}</TableCell>
                      <TableCell>{log.target}</TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.detail}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={logs.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[25]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
