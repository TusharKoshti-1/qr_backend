import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharge = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/restaurant/charge`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}` },
      });
      setChargeData(response.data);
    } catch (error) {
      console.error('Error fetching charge:', error);
      setError('Failed to load charge data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharge();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Restaurant Charge Overview
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : chargeData ? (
          <>
            <Typography variant="h6" gutterBottom>
              Charge Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Description</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Value</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Unpaid Completed Orders</TableCell>
                    <TableCell align="right">{chargeData.unpaidOrderCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Price per Order</TableCell>
                    <TableCell align="right">₹{chargeData.pricePerOrder.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Charge</TableCell>
                    <TableCell align="right">₹{chargeData.totalCharge.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Currency</TableCell>
                    <TableCell align="right">{chargeData.currency}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Last updated: {new Date().toLocaleString()}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography align="center">No charge data available.</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ChargeCalculator;
