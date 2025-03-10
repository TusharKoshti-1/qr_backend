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

interface ItemReport {
  item_id: number;
  item_name: string;
  total_quantity: number;
  total_revenue: number;
}

// Define an interface for the API response
interface ItemReportApi {
  item_id: number | string;
  item_name: string;
  total_quantity: number | string;
  total_revenue: number | string;
}

const ItemReport: React.FC = () => {
  const [items, setItems] = useState<ItemReport[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get<ItemReportApi[]>(
          `${import.meta.env.VITE_API_URL}/api/items-report`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
            params: {
              startDate: startDate?.format('YYYY-MM-DD'),
              endDate: endDate?.format('YYYY-MM-DD'),
            },
          },
        );
        // Convert numeric fields explicitly
        const processedData = response.data.map((item) => ({
          ...item,
          total_revenue: Number(item.total_revenue),
          total_quantity: Number(item.total_quantity),
          item_id: Number(item.item_id),
        }));
        setItems(processedData);
        // Reset current page to 1 on new fetch
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching items data:', error);
        alert('Failed to fetch items data. Please try again later.');
      }
    };

    fetchItems();
  }, [startDate, endDate]);

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    const today = dayjs().startOf('day');
    const yesterday = dayjs().subtract(1, 'day').startOf('day');

    switch (filter) {
      case 'today':
        setStartDate(today);
        // Set end date to one day later to cover the full day
        setEndDate(today.add(1, 'day'));
        break;
      case 'yesterday':
        setStartDate(yesterday);
        // Set end date to one day later to cover the full day
        setEndDate(yesterday.add(1, 'day'));
        break;
      case 'thisWeek':
        setStartDate(today.startOf('week'));
        setEndDate(today.endOf('week'));
        break;
      case 'lastWeek':
        setStartDate(today.subtract(1, 'week').startOf('week'));
        setEndDate(today.subtract(1, 'week').endOf('week'));
        break;
      case 'thisMonth':
        setStartDate(today.startOf('month'));
        setEndDate(today.endOf('month'));
        break;
      case 'lastMonth':
        setStartDate(today.subtract(1, 'month').startOf('month'));
        setEndDate(today.subtract(1, 'month').endOf('month'));
        break;
      default:
        setStartDate(null);
        setEndDate(null);
    }
    // Reset current page when applying a new filter
    setCurrentPage(1);
  };

  const calculateTotalRevenue = () => {
    return items.reduce((total, item) => total + item.total_revenue, 0);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Slice the items array for pagination
  const paginatedItems = items.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Item Sales Report
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
                  <b>Item Name</b>
                </TableCell>
                <TableCell>
                  <b>Total Quantity Sold</b>
                </TableCell>
                <TableCell>
                  <b>Total Revenue (₹)</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item: ItemReport, index: number) => (
                <TableRow key={index}>
                  <TableCell>{(currentPage - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.total_quantity}</TableCell>
                  <TableCell>₹{item.total_revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(items.length / rowsPerPage)}
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

export default ItemReport;
