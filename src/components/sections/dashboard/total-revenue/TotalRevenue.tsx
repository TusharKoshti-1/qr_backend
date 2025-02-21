import { useState, useEffect } from 'react';
import { Paper, Typography } from '@mui/material';
import TotalRevenueChart from './TotalRevenueChart';

interface RevenueData {
  'Online Sales': number[];
  'Offline Sales': number[];
}

const TotalRevenue = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/revenue`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch revenue data');
        const data = await response.json();
        setRevenueData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (loading) return <Typography p={3}>Loading revenue data...</Typography>;
  if (error)
    return (
      <Typography color="error" p={3}>
        {error}
      </Typography>
    );
  if (!revenueData) return null;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>
        Total Revenue
      </Typography>
      <TotalRevenueChart data={revenueData} style={{ height: 247 }} />
    </Paper>
  );
};

export default TotalRevenue;
