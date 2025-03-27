import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import './MenuItem.css';

interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface TableType {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied' | 'reserved';
}

interface OrderItem extends MenuItemType {
  quantity: number;
}

const AdminAddTableOrderPage: React.FC = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  const [tables, setTables] = useState<TableType[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu items
        const menuResponse = await axios.get<MenuItemType[]>(
          `${import.meta.env.VITE_API_URL}/api/menu`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        const items = menuResponse.data;
        const grouped = items.reduce((acc: Record<string, MenuItemType[]>, item: MenuItemType) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        }, {});
        setGroupedItems(grouped);
        setOpenCategories(
          Object.keys(grouped).reduce(
            (acc, category) => {
              acc[category] = false; // Closed by default
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        );

        // Fetch tables
        const tablesResponse = await axios.get<TableType[]>(
          `${import.meta.env.VITE_API_URL}/api/tables`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setTables(tablesResponse.data);

        // Pre-fill table number from location state if provided
        const prefilledTable = location.state?.table_number;
        if (prefilledTable && tablesResponse.data.some((t) => t.table_number === prefilledTable)) {
          setTableNumber(prefilledTable);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [location.state]);

  const handleAddToOrder = (item: MenuItemType) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId: number, increment: boolean) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + (increment ? 1 : -1);
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      alert('Please select a table number.');
      return;
    }

    const selectedTable = tables.find((t) => t.table_number === tableNumber);
    if (!selectedTable) {
      alert('Invalid table number.');
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tableorder`,
        {
          customer_name: null,
          phone: null,
          table_number: tableNumber,
          items: orderItems,
          total_amount: totalAmount,
          payment_method: 'Cash',
          status: 'Pending',
        },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tables/${selectedTable.id}`,
        { status: 'occupied' },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      alert(`Order for Table ${tableNumber} created successfully!`);
      setTableNumber('');
      setOrderItems([]);
      navigate('/tableorder');
    } catch (error) {
      console.error('Error creating table order:', error);
      alert('Failed to create table order');
    }
  };

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (term.trim() === '') {
      setSelectedCategory('All');
      setOpenCategories((prev) =>
        Object.keys(prev).reduce((acc, cat) => ({ ...acc, [cat]: false }), {}),
      );
      return;
    }

    // Keep selectedCategory as 'All' to show all categories
    setSelectedCategory('All');

    // Find all categories with matching items and open them
    const lowerTerm = term.toLowerCase();
    const matchingCategories = Object.entries(groupedItems)
      .filter(([, items]) => items.some((item) => item.name.toLowerCase().includes(lowerTerm)))
      .map(([category]) => category);

    setOpenCategories((prev) =>
      Object.keys(prev).reduce(
        (acc, category) => {
          acc[category] = matchingCategories.includes(category); // Open if it has matches
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  };

  return (
    <div className="menu__container">
      <Box sx={{ padding: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
        <Typography variant="h4">Add Table Order</Typography>
      </Box>

      <Box sx={{ display: { xs: 'block', md: 'flex' }, gap: '2rem', padding: '0 1rem' }}>
        <Box sx={{ flex: 1, mb: { xs: '2rem', md: 0 } }}>
          <Box sx={{ marginBottom: '2rem' }}>
            <FormControl fullWidth sx={{ marginBottom: '1rem' }}>
              <InputLabel>Table Number *</InputLabel>
              <Select
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value as string)}
                label="Table Number *"
                required
                sx={{
                  backgroundColor: '#fff9c4',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f57c00',
                    borderWidth: '2px',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ef6c00' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e65100' },
                }}
              >
                <MenuItem value="">
                  <em>Select a table</em>
                </MenuItem>
                {tables
                  .filter((table) => table.status === 'empty')
                  .map((table) => (
                    <MenuItem key={table.id} value={table.table_number}>
                      Table {table.table_number}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '1rem' }}>
              <TextField
                label="Search Menu Items"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)} // Updated to use handleSearch
              />
              <Box sx={{ position: 'relative', width: { xs: '100%', sm: '200px' } }}>
                <Box
                  onClick={handleBarClick}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    borderBottom: '2px solid black',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedCategory}
                  </Typography>
                  <ExpandMoreIcon />
                </Box>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as string)}
                  inputRef={selectRef}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                  }}
                >
                  <MenuItem value="All">All</MenuItem>
                  {Object.keys(groupedItems)
                    .sort()
                    .map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                </Select>
              </Box>
            </Box>
          </Box>

          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
            .map(([category, items]) => {
              const filteredItems = searchTerm
                ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : items;
              if (filteredItems.length === 0) return null;
              return (
                <Box key={category} sx={{ marginBottom: '2rem' }}>
                  <Box
                    onClick={() =>
                      setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                    }
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '2px solid black',
                      paddingBottom: '1rem',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                  >
                    <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold' }}>
                      {category}
                    </Typography>
                    {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  {openCategories[category] && (
                    <Grid container spacing={2} sx={{ marginTop: '1rem' }}>
                      {filteredItems.map((item) => (
                        <Grid item xs={12} key={item.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              padding: '1rem',
                              minHeight: '70px',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 50,
                                  height: 50,
                                  marginRight: '10px',
                                  borderRadius: '4px',
                                }}
                              />
                              <Box>
                                <Typography variant="body1">{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ₹{item.price}
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleAddToOrder(item)}
                              sx={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                            >
                              Add
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              );
            })}
        </Box>

        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            position: { xs: 'static', md: 'sticky' },
            top: { md: '2rem' },
            alignSelf: { md: 'flex-start' },
            maxHeight: { md: 'calc(100vh - 4rem)' },
            overflowY: { md: 'auto' },
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: { xs: '100%', md: 'auto' },
            mt: { xs: '2rem', md: 0 },
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
            Order Summary
          </Typography>
          {orderItems.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No items added yet
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {orderItems.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '1rem',
                      minHeight: '70px',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{item.price} x {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, true)}
                        size="small"
                        sx={{ padding: '4px' }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, false)}
                        size="small"
                        sx={{ padding: '4px' }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        size="small"
                        color="error"
                        sx={{ padding: '4px' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
          <Typography variant="h6" sx={{ marginTop: '2rem' }}>
            Total: ₹{totalAmount}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmitOrder}
            disabled={!tableNumber || orderItems.length === 0}
            sx={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}
          >
            Submit Order
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default AdminAddTableOrderPage;
