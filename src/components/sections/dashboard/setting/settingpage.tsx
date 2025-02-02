import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import axios from 'axios';

interface SettingsData {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  taxRate: string;
  isOpen: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    taxRate: '',
    isOpen: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch existing settings from your API endpoint
    const fetchSettings = async () => {
      try {
        const response = await axios.get(
          'https://exact-notable-tadpole.ngrok-free.app/api/settings',
          { headers: { 'ngrok-skip-browser-warning': 'true' } },
        );
        setSettings(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Error fetching settings.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Updated change handler that checks if the target is a checkbox
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // If the target is an input element and its type is checkbox, use the checked property
    const newValue =
      (e.target as HTMLInputElement).type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value;
    setSettings({
      ...settings,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('https://exact-notable-tadpole.ngrok-free.app/api/settings', settings, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      setSuccess(true);
      setError(null);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Error updating settings.');
      setSuccess(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Restaurant Settings
        </Typography>
        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography variant="body1" color="primary" sx={{ mb: 2 }}>
            Settings updated successfully!
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restaurant Name"
                name="restaurantName"
                value={settings.restaurantName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={settings.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={settings.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Operating Hours"
                name="operatingHours"
                value={settings.operatingHours}
                onChange={handleChange}
                placeholder="e.g., 9 AM - 9 PM"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                name="taxRate"
                value={settings.taxRate}
                onChange={handleChange}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} display="flex" alignItems="center">
              <FormControlLabel
                control={<Switch checked={settings.isOpen} onChange={handleChange} name="isOpen" />}
                label="Restaurant Open"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Settings
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
