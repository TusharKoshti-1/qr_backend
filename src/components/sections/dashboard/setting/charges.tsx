import React, { useState, useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import axios from 'axios';

// Define the type for the charge data
interface ChargeData {
  unpaidOrderCount: number;
  pricePerOrder: number;
  totalCharge: number;
  currency: string;
}

const ChargeCalculator: React.FC = () => {
  const [chargeData, setChargeData] = useState<ChargeData | null>(null);

  const fetchCharge = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/restaurant/charge`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}` },
      });
      setChargeData(response.data);
    } catch (error) {
      console.error('Error fetching charge:', error);
    }
  };

  const markPaid = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/restaurant/charge/mark-paid`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}` } },
      );
      alert(response.data.message);
      fetchCharge(); // Refresh charge data
    } catch (error) {
      console.error('Error marking paid:', error);
    }
  };

  useEffect(() => {
    fetchCharge();
  }, []);

  return (
    <Box>
      <Typography variant="h5">Restaurant Charge</Typography>
      {chargeData && (
        <>
          <Typography>Unpaid Orders: {chargeData.unpaidOrderCount}</Typography>
          <Typography>Price per Order: ₹{chargeData.pricePerOrder}</Typography>
          <Typography>Total Charge: ₹{chargeData.totalCharge}</Typography>
          <Button variant="contained" onClick={markPaid} sx={{ mt: 2 }}>
            Mark as Paid
          </Button>
        </>
      )}
    </Box>
  );
};

export default ChargeCalculator;
