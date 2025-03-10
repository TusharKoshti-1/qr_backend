import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Card,
  CardContent,
  Typography,
  CardMedia,
  TextField,
  InputLabel,
  Paper,
  List,
  ListItem,
  IconButton,
  Box,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/menu`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/categories`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
        ]);

        setMenuItems(menuResponse.data);
        setCategories(categoriesResponse.data);
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

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Create New Order
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Customer Name"
            variant="outlined"
            fullWidth
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Search Menu Items"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FormControl fullWidth sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Menu Items Column */}
          <Grid item xs={12} md={8} lg={5}>
            <Grid container spacing={3}>
              {filteredItems.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={4} lg={5}>
                  <Card
                    sx={{
                      maxWidth: 700,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%', // Added for full width
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.image}
                      alt={item.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        ₹{item.price}
                      </Typography>
                    </CardContent>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleAddToOrder(item)}
                      sx={{ mt: 'auto' }}
                    >
                      Add to Order
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Order Summary Column */}
          <Grid item xs={12} md={4}>
            {orderItems.length > 0 && (
              <Paper
                sx={{
                  p: 2,
                  position: 'sticky',
                  top: 16,
                  height: 'fit-content',
                }}
              >
                <Typography variant="h5" gutterBottom>
                  Order Summary
                </Typography>

                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {orderItems.map((item) => (
                    <ListItem key={item.id} divider>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs={7}>
                          <Typography variant="body1" noWrap>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{item.price} x {item.quantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={5}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, true)}
                            >
                              <Add />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, false)}
                            >
                              <Remove />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>

                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  Total: ₹{totalAmount}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleSubmitOrder}
                  disabled={!customerName}
                >
                  Submit Order
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminAddOrderPage;
