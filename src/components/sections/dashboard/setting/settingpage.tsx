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
import { Link } from 'react-router-dom';

interface SettingsData {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  upiId: string;
  isOpen: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    upiId: '',
    isOpen: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettingsAndLocation = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        const settingsData = response.data;
        console.log('Fetched settings:', settingsData);

        if (!settingsData.address) {
          await fetchLocation();
        } else {
          setSettings(settingsData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Error fetching settings.');
        setLoading(false);
      }
    };

    fetchSettingsAndLocation();
  }, []);

  const fetchLocation = async () => {
    setLocationLoading(true);
    setError(null);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
          enableHighAccuracy: true,
        });
      });

      console.log('Position obtained:', position.coords);

      const { latitude, longitude } = position.coords;
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'YourAppName/1.0',
          },
        },
      );

      console.log('Nominatim response:', response.data);
      const address = response.data.display_name || 'Address not found';

      setSettings((prev) => ({
        ...prev,
        address: address,
      }));
    } catch (err: GeolocationPositionError | unknown) {
      // Updated type here
      console.error('Location error:', err);
      let errorMessage = 'Unable to fetch location';
      if (err instanceof GeolocationPositionError) {
        if (err.code === 1) errorMessage = 'Location permission denied';
        else if (err.code === 2) errorMessage = 'Position unavailable';
        else if (err.code === 3) errorMessage = 'Location request timed out';
      }
      setError(errorMessage);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
      await axios.put(`${import.meta.env.VITE_API_URL}/api/settings`, settings, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
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
                disabled={locationLoading}
                helperText={locationLoading ? 'Fetching location...' : 'Edit address if needed'}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={fetchLocation}
                disabled={locationLoading}
                sx={{ mb: 2 }}
              >
                {locationLoading ? 'Fetching Location...' : 'Get Current Location'}
              </Button>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="UPI ID"
                name="upiId"
                value={settings.upiId}
                onChange={handleChange}
                placeholder="example@upi"
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
            <Link to="/qr-code">
              <Button variant="outlined" sx={{ mt: 2, ml: 2 }}>
                View QR Code
              </Button>
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
