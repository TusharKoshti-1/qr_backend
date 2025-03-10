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
        <Grid item xs={12} md={4} lg={4}>
          {' '}
          {/* Increased width from lg={3} to lg={4} */}
          <Paper
            sx={{
              p: 3,
              position: { xs: 'static', md: 'sticky' },
              top: 16,
              borderRadius: 4,
              backgroundColor: 'background.paper',
              boxShadow: 3,
              height: { md: 'calc(100vh - 120px)' }, // Adjusted height
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Order Summary
            </Typography>

            {orderItems.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{
                  py: 2,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                No items added yet
              </Typography>
            ) : (
              <>
                <List dense sx={{ flex: 1, overflow: 'auto', mb: 2, pr: 1 }}>
                  {orderItems.map((item) => (
                    <ListItem
                      key={item.id}
                      divider
                      sx={{
                        py: 1.5,
                        px: 0,
                        '&:last-child': { borderBottom: 'none' }, // Remove border from last item
                      }}
                    >
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs={7}>
                          <Typography variant="body1" fontWeight="medium" noWrap>
                            {item.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                              ₹{item.price} × {item.quantity}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={5}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: 1,
                              alignItems: 'center',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, true)}
                              sx={{
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': { backgroundColor: 'primary.dark' },
                              }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(item.id, false)}
                              sx={{
                                backgroundColor: 'error.main',
                                color: 'white',
                                '&:hover': { backgroundColor: 'error.dark' },
                              }}
                            >
                              <Remove fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item.id)}
                              color="error"
                              sx={{ ml: 0.5 }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>

                {/* Total and Submit Section */}
                <Box
                  sx={{
                    mt: 'auto',
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      color: 'secondary.main',
                      fontSize: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Total:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </Typography>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSubmitOrder}
                    disabled={!customerName}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      boxShadow: 0,
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Submit Order
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminAddOrderPage;
