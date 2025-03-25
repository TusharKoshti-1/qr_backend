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
  ButtonGroup,
  Button,
  Pagination,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

interface Sale {
  id: string;
  customer_name: string | null; // Allow null for table orders
  table_number: string | null; // Add table_number for table orders
  phone: string | null; // Allow null for table orders
  total_amount: string;
  payment_method: string;
  created_on: string;
}

const SalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().endOf('day'));
  const [activeFilter, setActiveFilter] = useState<string | null>('today');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sale`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        const sortedSales = response.data.sort((a: Sale, b: Sale) =>
          dayjs(b.created_on).diff(dayjs(a.created_on)),
        );
        setSales(sortedSales);

        // Filter for today's sales by default
        const todayStart = dayjs().startOf('day');
        const todayEnd = dayjs().endOf('day');
        const todaySales = sortedSales.filter((sale: Sale) => {
          const saleDate = dayjs(sale.created_on);
          return (
            (saleDate.isAfter(todayStart) || saleDate.isSame(todayStart)) &&
            (saleDate.isBefore(todayEnd) || saleDate.isSame(todayEnd))
          );
        });
        setFilteredSales(todaySales);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        alert('Failed to fetch sales data. Please try again later.');
      }
    };

    fetchSales();
  }, []);

  const applyDateFilter = (start: Dayjs, end: Dayjs) => {
    const filtered = sales.filter((sale) => {
      const saleDate = dayjs(sale.created_on);
      return (
        (saleDate.isAfter(start) || saleDate.isSame(start)) &&
        (saleDate.isBefore(end) || saleDate.isSame(end))
      );
    });
    setFilteredSales(filtered);
    setCurrentPage(1);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    const today = dayjs().startOf('day');
    const yesterday = dayjs().subtract(1, 'day').startOf('day');

    let newStart: Dayjs;
    let newEnd: Dayjs;

    switch (filter) {
      case 'today':
        newStart = today;
        newEnd = today.endOf('day');
        break;
      case 'yesterday':
        newStart = yesterday;
        newEnd = yesterday.endOf('day');
        break;
      case 'thisWeek':
        newStart = today.startOf('week');
        newEnd = today.endOf('week');
        break;
      case 'lastWeek':
        newStart = today.subtract(1, 'week').startOf('week');
        newEnd = today.subtract(1, 'week').endOf('week');
        break;
      case 'thisMonth':
        newStart = today.startOf('month');
        newEnd = today.endOf('month');
        break;
      case 'lastMonth':
        newStart = today.subtract(1, 'month').startOf('month');
        newEnd = today.subtract(1, 'month').endOf('month');
        break;
      default:
        setFilteredSales(sales);
        return;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
    applyDateFilter(newStart, newEnd);
  };

  const calculateTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => {
      const cleanedAmount = sale.total_amount.replace(/[^0-9.-]+/g, '');
      return total + parseFloat(cleanedAmount);
    }, 0);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Sales Report
        </Typography>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Filters
          </Typography>
          <ButtonGroup variant="contained" sx={{ mb: 2 }}>
            <Button
              onClick={() => handleFilterClick('today')}
              color={activeFilter === 'today' ? 'primary' : 'inherit'}
            >
              Today
            </Button>
            <Button
              onClick={() => handleFilterClick('yesterday')}
              color={activeFilter === 'yesterday' ? 'primary' : 'inherit'}
            >
              Yesterday
            </Button>
            <Button
              onClick={() => handleFilterClick('thisWeek')}
              color={activeFilter === 'thisWeek' ? 'primary' : 'inherit'}
            >
              This Week
            </Button>
            <Button
              onClick={() => handleFilterClick('lastWeek')}
              color={activeFilter === 'lastWeek' ? 'primary' : 'inherit'}
            >
              Last Week
            </Button>
            <Button
              onClick={() => handleFilterClick('thisMonth')}
              color={activeFilter === 'thisMonth' ? 'primary' : 'inherit'}
            >
              This Month
            </Button>
            <Button
              onClick={() => handleFilterClick('lastMonth')}
              color={activeFilter === 'lastMonth' ? 'primary' : 'inherit'}
            >
              Last Month
            </Button>
          </ButtonGroup>

          <Typography variant="h6" gutterBottom>
            Custom Date Range
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => {
                setStartDate(newValue);
                setActiveFilter(null);
              }}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => {
                setEndDate(newValue);
                setActiveFilter(null);
              }}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
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
              {paginatedSales.map((sale, index) => (
                <TableRow key={sale.id}>
                  <TableCell>{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{sale.customer_name ?? sale.table_number ?? '-'}</TableCell>
                  <TableCell>{sale.phone ?? '-'}</TableCell>
                  <TableCell>₹{sale.total_amount}</TableCell>
                  <TableCell>{sale.payment_method}</TableCell>
                  <TableCell>{dayjs(sale.created_on).format('DD/MM/YYYY')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredSales.length / rowsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Total Revenue: ₹{calculateTotalRevenue().toFixed(2)}</Typography>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default SalesReport;
