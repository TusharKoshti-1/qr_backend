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
  Container,
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
      >
        Create New Order
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - Menu Items */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 4 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Customer Name"
                variant="outlined"
                fullWidth
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  style: { borderRadius: 12 },
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                <TextField
                  label="Search Menu Items"
                  variant="outlined"
                  sx={{ flex: 1, minWidth: 200 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    style: { borderRadius: 12 },
                  }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                    sx={{ borderRadius: 12 }}
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
              {filteredItems.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={6} lg={4}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                      },
                      borderRadius: 4,
                    }}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        height: { xs: 160, sm: 180, md: 200 },
                        objectFit: 'cover',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                      }}
                      image={item.image}
                      alt={item.name}
                    />
                    <CardContent sx={{ flexGrow: 1, px: 2, py: 1.5 }}>
                      <Typography gutterBottom variant="h6" component="div">
                        {item.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          px: 1,
                          py: 0.5,
                          borderRadius: 2,
                          display: 'inline-block',
                        }}
                      >
                        {item.category}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 1,
                          fontWeight: 'bold',
                          color: 'secondary.main',
                        }}
                      >
                        ₹{item.price}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleAddToOrder(item)}
                        sx={{
                          borderRadius: 8,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        Add to Order
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper
            sx={{
              p: 3,
              position: { xs: 'static', md: 'sticky' },
              top: 16,
              borderRadius: 4,
              backgroundColor: 'background.paper',
              boxShadow: 3,
              maxHeight: { xs: 'auto', md: 'calc(100vh - 100px)' },
              overflow: 'auto',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              Order Summary
            </Typography>

            {orderItems.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{
                  py: 2,
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                No items added yet
              </Typography>
            ) : (
              <>
                <List dense sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {orderItems.map((item) => (
                    <ListItem key={item.id} divider sx={{ py: 1 }}>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs={7}>
                          <Typography variant="body1" fontWeight="medium">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{item.price} × {item.quantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={5}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: 0.5,
                              alignItems: 'center',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, true)}
                              color="primary"
                              sx={{
                                backgroundColor: 'primary.light',
                                '&:hover': { backgroundColor: 'primary.main' },
                              }}
                            >
                              <Add fontSize="small" sx={{ color: 'white' }} />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 0.5 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, false)}
                              color="secondary"
                              sx={{
                                backgroundColor: 'error.light',
                                '&:hover': { backgroundColor: 'error.main' },
                              }}
                            >
                              <Remove fontSize="small" sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item.id)}
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>

                <Typography
                  variant="h5"
                  sx={{
                    mt: 2,
                    mb: 2,
                    fontWeight: 'bold',
                    color: 'secondary.main',
                  }}
                >
                  Total: ₹{totalAmount}
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleSubmitOrder}
                  disabled={!customerName}
                  sx={{
                    borderRadius: 8,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    boxShadow: 2,
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  Submit Order
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminAddOrderPage;
