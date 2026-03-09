import React, { useState } from 'react';
import {
  Typography, Box, Paper, TextField, Button, Table,
  TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import apiClient from '../api/client';

const STATUS_COLOR = { ACTIVE: 'success', TERMINATED: 'error', SUSPENDED: 'warning' };
const AD_STATUS_COLOR = { ACTIVE: 'success', DISABLED: 'warning', DELETED: 'error' };

export default function EmployeeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiClient.get('/employees/search', { params: { q: query } });
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRowClick(emp) {
    setDetailLoading(true);
    setSelected({ ...emp, _loading: true });
    try {
      const res = await apiClient.get(`/employees/${emp.id}`);
      setSelected(res.data);
    } catch {
      setSelected(emp);
    } finally {
      setDetailLoading(false);
    }
  }

  function handleClose() {
    setSelected(null);
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Employee Search</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Search by name, email, or job title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" startIcon={<SearchIcon />} disabled={loading}>
            Search
          </Button>
        </Box>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : searched ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                results.map((emp) => (
                  <TableRow
                    key={emp.id}
                    hover
                    onClick={() => handleRowClick(emp)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{emp.job_title}</TableCell>
                    <TableCell>{emp.department_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={emp.status}
                        size="small"
                        color={STATUS_COLOR[emp.status] || 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>Enter a search term above to find employees</Typography>
          </Box>
        )}
      </Paper>

      {/* Employee Detail Modal */}
      <Dialog open={Boolean(selected)} onClose={handleClose} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              {selected.first_name} {selected.last_name}
            </DialogTitle>
            <DialogContent dividers>
              {detailLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress /></Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Employee Info</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Email:</strong> {selected.email || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Job Title:</strong> {selected.job_title || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Department:</strong> {selected.department_name || '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Status:</strong>{' '}
                      <Chip label={selected.status} size="small" color={STATUS_COLOR[selected.status] || 'default'} />
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Hire Date:</strong> {selected.hire_date ? new Date(selected.hire_date).toLocaleDateString() : '—'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2"><strong>Termination Date:</strong> {selected.termination_date ? new Date(selected.termination_date).toLocaleDateString() : '—'}</Typography>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">AD Account</Typography>
                  </Grid>
                  {selected.ad_username ? (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2"><strong>Username:</strong> {selected.ad_username}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Status:</strong>{' '}
                          <Chip label={selected.ad_status} size="small" color={AD_STATUS_COLOR[selected.ad_status] || 'default'} />
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          <strong>DN:</strong> {selected.ad_dn}
                        </Typography>
                      </Grid>
                      {selected.ad_disabled_at && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Disabled At:</strong> {new Date(selected.ad_disabled_at).toLocaleString()}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No AD account found</Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
