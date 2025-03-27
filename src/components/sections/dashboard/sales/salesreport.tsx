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
  customer_name: string | null;
  table_number: string | null;
  phone: string | null;
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
      <Container
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2 },
          maxWidth: 'lg',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          Sales Report
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Quick Filters
          </Typography>
          <ButtonGroup
            variant="contained"
            sx={{
              mb: 2,
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: { xs: 'center', sm: 'flex-start' },
            }}
            size="small"
          >
            {[
              { label: 'Today', value: 'today' },
              { label: 'Yesterday', value: 'yesterday' },
              { label: 'This Week', value: 'thisWeek' },
              { label: 'Last Week', value: 'lastWeek' },
              { label: 'This Month', value: 'thisMonth' },
              { label: 'Last Month', value: 'lastMonth' },
            ].map((filter) => (
              <Button
                key={filter.value}
                onClick={() => handleFilterClick(filter.value)}
                color={activeFilter === filter.value ? 'primary' : 'inherit'}
                sx={{
                  minWidth: { xs: '80px', sm: '100px' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                {filter.label}
              </Button>
            ))}
          </ButtonGroup>

          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Custom Date Range
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: { xs: 1, sm: 2 },
              mt: 2,
            }}
          >
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => {
                setStartDate(newValue);
                setActiveFilter(null);
              }}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { mb: { xs: 1, sm: 0 } },
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => {
                setEndDate(newValue);
                setActiveFilter(null);
              }}
              format="DD/MM/YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { mb: { xs: 1, sm: 0 } },
                },
              }}
            />
          </Box>
        </Paper>

        {/* Total Revenue Moved Here */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            backgroundColor: '#e8f5e9', // Light green background for emphasis
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 'bold',
              color: '#2e7d32', // Dark green text
              mb: { xs: 1, sm: 0 },
            }}
          >
            Total Revenue
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 'bold',
              color: '#2e7d32',
            }}
          >
            ₹{calculateTotalRevenue().toFixed(2)}
          </Typography>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{
            overflowX: 'auto',
            maxHeight: { xs: '70vh', sm: 'none' },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {['ID', 'Customer Name', 'Phone', 'Total Amount (₹)', 'Payment Method', 'Date'].map(
                  (header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        whiteSpace: 'nowrap',
                        py: 1,
                      }}
                    >
                      <b>{header}</b>
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSales.map((sale, index) => (
                <TableRow key={sale.id}>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {sale.customer_name ?? `Table ${sale.table_number}` ?? '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {sale.phone ?? '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    ₹{sale.total_amount}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {sale.payment_method}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {dayjs(sale.created_on).format('DD/MM/YYYY')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: { xs: 2, sm: 3 },
          }}
        >
          <Pagination
            count={Math.ceil(filteredSales.length / rowsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="small"
            sx={{ mb: { xs: 1, sm: 0 } }}
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default SalesReport;
