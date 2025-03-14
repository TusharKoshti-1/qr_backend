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

  // Fetch settings and location on component mount
  useEffect(() => {
    const fetchSettingsAndLocation = async () => {
      try {
        // Fetch existing settings
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        const settingsData = response.data;

        // Get user's location if address is empty
        if (!settingsData.address) {
          setLocationLoading(true);
          try {
            const address = await getUserLocation();
            setSettings({
              ...settingsData,
              address: address || settingsData.address,
            });
          } catch (locationErr) {
            console.error('Error getting location:', locationErr);
            setError('Could not fetch location. Please enter address manually.');
          }
          setLocationLoading(false);
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

  // Function to get user's location and convert to address
  const getUserLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use Nominatim (OpenStreetMap) for reverse geocoding
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            );
            const address = response.data.display_name;
            resolve(address);
          } catch (err) {
            reject(new Error('Error converting coordinates to address'));
          }
        },
        (error) => {
          reject(error);
        },
      );
    });
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
