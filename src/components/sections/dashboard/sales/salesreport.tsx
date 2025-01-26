import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

interface Sale {
  id: string;
  customer_name: string;
  phone: string;
  total_amount: number;
  payment_method: string;
  created_on: string;
}

const SalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    // Fetch sales data from backend API
    const fetchSales = async () => {
      try {
        const response = await axios.get('https://exact-notable-tadpole.ngrok-free.app/api/sale', {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        setSales(response.data);
        console.log(response);
        setFilteredSales(response.data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        alert('Failed to fetch sales data. Please try again later.');
      }
    };

    fetchSales();
  }, []);

  const filterSalesByDate = () => {
    if (startDate && endDate) {
      const filtered = sales.filter((sale) => {
        const saleDate = dayjs(sale.created_on);
        return (
          saleDate.isAfter(startDate.subtract(1, 'day')) && saleDate.isBefore(endDate.add(1, 'day'))
        );
      });
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  };

  const calculateTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => total + sale.total_amount, 0);
  };
  console.log(filteredSales + 'this is filter sales');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sales Report
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Date Range
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <Button variant="contained" onClick={filterSalesByDate}>
              Apply Filter
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>ID</b>
                </TableCell>
                <TableCell>
                  <b>Customer Name</b>
                </TableCell>
                <TableCell>
                  <b>Phone</b>
                </TableCell>
                <TableCell>
                  <b>Total Amount (₹)</b>
                </TableCell>
                <TableCell>
                  <b>Payment Method</b>
                </TableCell>
                <TableCell>
                  <b>Date</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{sale.customer_name}</TableCell>
                  <TableCell>{sale.phone}</TableCell>
                  <TableCell>₹{sale.total_amount}</TableCell>
                  <TableCell>{sale.payment_method}</TableCell>
                  <TableCell>{dayjs(sale.created_on).format('DD/MM/YYYY')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Total Revenue: ₹{calculateTotalRevenue()}</Typography>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default SalesReport;
