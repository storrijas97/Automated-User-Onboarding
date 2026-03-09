import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Paper, Button, TextField, CircularProgress,
  Alert, Switch, FormControlLabel, Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import apiClient from '../api/client';

export default function Settings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ msg: '', severity: 'success' });

  useEffect(() => {
    apiClient.get('/config')
      .then((res) => setConfig(res.data))
      .catch(() => setAlert({ msg: 'Failed to load configuration', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.put('/config', {
        polling_interval_min: Number(config.polling_interval_min),
        retry_limit: Number(config.retry_limit),
        notifications_enabled: config.notifications_enabled ? 1 : 0,
      });
      setAlert({ msg: 'Configuration saved successfully', severity: 'success' });
    } catch {
      setAlert({ msg: 'Failed to save configuration', severity: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Configuration</Typography>

      {alert.msg && (
        <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={() => setAlert({ msg: '', severity: 'success' })}>
          {alert.msg}
        </Alert>
      )}

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>Polling Settings</Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="OrangeHRM Polling Interval (minutes)"
            type="number"
            value={config?.polling_interval_min ?? 5}
            onChange={(e) => setConfig({ ...config, polling_interval_min: e.target.value })}
            helperText="How often the system polls OrangeHRM for employee changes (1–1440 minutes)"
            inputProps={{ min: 1, max: 1440 }}
            fullWidth
          />

          <TextField
            label="Retry Limit"
            type="number"
            value={config?.retry_limit ?? 3}
            onChange={(e) => setConfig({ ...config, retry_limit: e.target.value })}
            helperText="Maximum number of retry attempts for failed AD operations (0–10)"
            inputProps={{ min: 0, max: 10 }}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(config?.notifications_enabled)}
                onChange={(e) => setConfig({ ...config, notifications_enabled: e.target.checked })}
                color="primary"
              />
            }
            label="Enable Notifications"
          />

          {config?.last_sync_at && (
            <Typography variant="body2" color="text.secondary">
              Last OrangeHRM sync: {new Date(config.last_sync_at).toLocaleString()}
            </Typography>
          )}

          <Box>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
