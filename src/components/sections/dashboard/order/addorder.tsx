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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import './MenuItem.css';

interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface OrderItem extends MenuItemType {
  quantity: number;
}

const AdminAddOrderPage: React.FC = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

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
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          customer_name: customerName,
          items: orderItems,
          total_amount: totalAmount,
          payment_method: 'Cash',
        },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      alert('Order created successfully!');
      setCustomerName('');
      setOrderItems([]);
      navigate('/order');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  return (
    <div className="menu__container">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <Typography variant="h4">Create New Order</Typography>
      </Box>

      {/* Main Content: Two Columns */}
      <Box sx={{ display: 'flex', gap: '2rem' }}>
        {/* Left Side: Menu Items */}
        <Box sx={{ flex: 1 }}>
          {/* Customer Name, Search Bar, and Category Filter */}
          <Box style={{ marginBottom: '2rem' }}>
            <TextField
              label="Customer Name *"
              variant="outlined"
              fullWidth
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              helperText={!customerName ? 'This field is required' : ''}
              FormHelperTextProps={{ style: { color: 'red' } }}
              sx={{
                marginBottom: '1rem',
                '& .MuiInputLabel-root': {
                  fontWeight: 'bold', // Bold label
                },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff9c4', // Light yellow background
                  '& fieldset': {
                    borderColor: '#f57c00', // Orange border
                    borderWidth: '2px', // Thicker border
                  },
                  '&:hover fieldset': {
                    borderColor: '#ef6c00', // Darker orange on hover
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#e65100', // Even darker orange when focused
                  },
                },
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <TextField
                label="Search Menu Items"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div style={{ position: 'relative', width: '100%', maxWidth: '200px' }}>
                <div
                  onClick={handleBarClick}
                  style={{
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
                </div>
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
              </div>
            </div>
          </Box>

          {/* Categories Sections */}
          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
            .map(([category, items]) => {
              const filteredItems = searchTerm
                ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : items;
              if (filteredItems.length === 0) {
                return null;
              }
              return (
                <div key={category} style={{ marginBottom: '2rem' }}>
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
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <Typography variant="h4" sx={{ color: 'black', fontWeight: 'bold' }}>
                      {category}
                    </Typography>
                    {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  {openCategories[category] && (
                    <Grid container spacing={2} style={{ marginTop: '1rem' }}>
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
                                style={{ width: 50, height: 50, marginRight: '10px' }}
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
                              sx={{ marginLeft: '1rem' }}
                            >
                              Add
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </div>
              );
            })}
        </Box>

        {/* Right Side: Order Summary */}
        <Box
          sx={{
            flex: 1,
            position: 'sticky',
            top: '2rem',
            alignSelf: 'flex-start',
            maxHeight: 'calc(100vh - 4rem)',
            overflowY: 'auto',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
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
            <Grid container spacing={2} justifyContent="left">
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={() => handleQuantityChange(item.id, true)}>
                        <Add />
                      </IconButton>
                      E{' '}
                      <IconButton onClick={() => handleQuantityChange(item.id, false)}>
                        <Remove />
                      </IconButton>
                      <IconButton onClick={() => handleRemoveItem(item.id)}>
                        <Delete />
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
            disabled={!customerName}
            sx={{ marginTop: '1rem', width: '100%' }}
          >
            Submit Order
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default AdminAddOrderPage;
