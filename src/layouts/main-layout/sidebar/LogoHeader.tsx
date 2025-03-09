import { Link, Stack, SxProps, Typography } from '@mui/material';
import Logo from 'components/icons/Logo';
import { useEffect, useState } from 'react';
import { rootPaths } from 'routes/paths';
import axios from 'axios';

interface LogoHeaderProps {
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  upiId: string;
  isOpen: boolean;
  sx?: SxProps;
}

const LogoHeader = (props: LogoHeaderProps) => {
  const [settings, setSettings] = useState<LogoHeaderProps>({
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    upiId: '',
    isOpen: false,
  });

  useEffect(() => {
    // Fetch existing settings from your API endpoint
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        setSettings(response.data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
  }, []);

  return (
    <Stack
      direction="row"
      alignItems="center"
      columnGap={3}
      component={Link}
      href={rootPaths.root}
      {...props}
    >
      <Logo sx={{ fontSize: 56 }} />
      <Typography variant="h2" color="primary.darker">
        {settings.restaurantName} {/* Corrected: Use the value of restaurantName */}
      </Typography>
    </Stack>
  );
};

export default LogoHeader;
