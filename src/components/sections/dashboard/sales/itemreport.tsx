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

interface ItemReportApi {
  item_id: number | string;
  item_name: string;
  total_quantity: number | string;
  total_revenue: number | string;
}

const ItemReport: React.FC = () => {
  const [items, setItems] = useState<ItemReport[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().startOf('day'));
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().startOf('day').add(1, 'day'));
  const [activeFilter, setActiveFilter] = useState<string | null>('today');
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
        const processedData = response.data.map((item) => ({
          ...item,
          total_revenue: Number(item.total_revenue),
          total_quantity: Number(item.total_quantity),
          item_id: Number(item.item_id),
        }));
        setItems(processedData);
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
        setEndDate(today.add(1, 'day'));
        break;
      case 'yesterday':
        setStartDate(yesterday);
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
    setCurrentPage(1);
  };

  const calculateTotalRevenue = () => {
    return items.reduce((total, item) => total + item.total_revenue, 0);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const paginatedItems = items.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container
        sx={{
          mt: { xs: 2, sm: 3, md: 4 }, // Responsive margin-top
          px: { xs: 1, sm: 2 }, // Responsive padding-x
          maxWidth: 'lg', // Limit max width on large screens
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, // Responsive font
            textAlign: { xs: 'center', sm: 'left' }, // Center on mobile
          }}
        >
          Item Sales Report
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 }, // Responsive padding
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
              flexWrap: 'wrap', // Allow wrapping on small screens
              gap: 1, // Add spacing between buttons
              justifyContent: { xs: 'center', sm: 'flex-start' },
            }}
            size="small" // Smaller buttons on mobile
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
                  minWidth: { xs: '80px', sm: '100px' }, // Responsive min-width
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
              flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile
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
                  size: 'small', // Smaller input on mobile
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

        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            backgroundColor: '#e8f5e9',
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
              color: '#2e7d32',
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
            overflowX: 'auto', // Enable horizontal scroll on small screens
            maxHeight: { xs: '70vh', sm: 'none' }, // Limit height on mobile
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {['ID', 'Item Name', 'Total Quantity Sold', 'Total Revenue (₹)'].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Responsive font
                      whiteSpace: 'nowrap', // Prevent header wrapping
                      py: 1, // Reduced padding
                    }}
                  >
                    <b>{header}</b>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedItems.map((item: ItemReport, index: number) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {item.item_name}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    {item.total_quantity}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, py: 1 }}>
                    ₹{item.total_revenue.toFixed(2)}
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
            count={Math.ceil(items.length / rowsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="small" // Smaller pagination on mobile
          />
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default ItemReport;
