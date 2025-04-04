import { Link, Stack, SxProps, Typography } from '@mui/material';
import Logo from 'components/icons/Logo';
import { rootPaths } from 'routes/paths';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface LogoHeaderProps {
  sx?: SxProps;
}

const LogoHeader = (props: LogoHeaderProps) => {
  const [restaurantName, setRestaurantName] = useState('Annapurna POS');

  useEffect(() => {
    const fetchRestaurantName = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/restaurant-name`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }
        );
        setRestaurantName(response.data.name);
      } catch (error) {
        console.error('Error fetching restaurant name:', error);
      }
    };

    fetchRestaurantName();
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
        {restaurantName}
      </Typography>
    </Stack>
  );
};

export default LogoHeader;