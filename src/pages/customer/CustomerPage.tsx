import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCart } from '@mui/icons-material';
import './MenuItem.css'; // Assuming shared CSS

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface TopSellerItem extends MenuItem {
  rank: number;
  quantitySold: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// Session validation hook
const useSessionCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = sessionStorage.getItem('userSession');
    if (!sessionData) {
      navigate('/scanqrcodeagain');
      return;
    }

    const session = JSON.parse(sessionData);
    const currentTime = Date.now();
    if (currentTime - session.timestamp > 900000) { // 15 minutes
      sessionStorage.removeItem('userSession');
      sessionStorage.removeItem('selectedItems');
      navigate('/scanqrcodeagain');
    }
  }, [navigate]);
};

const CustomerPage: React.FC = () => {
  useSessionCheck();

  const navigate = useNavigate();
  const sessionData = JSON.parse(sessionStorage.getItem('userSession') || '{}');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(sessionData.name || '');
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    const savedItems = sessionStorage.getItem('selectedItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const topSellersResponse = await axios.get<TopSellerItem[]>(
          `${import.meta.env.VITE_API_URL}/api/customer/top-sellers?restaurant_id=${sessionData.restaurantId}`,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        setTopSellers(topSellersResponse.data);

        const menuResponse = await axios.get<MenuItem[]>(
          `${import.meta.env.VITE_API_URL}/api/customer/menu?restaurant_id=${sessionData.restaurantId}`,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        setMenuItems(menuResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load menu. Please try again.');
      }
    };

    fetchData();
  }, [sessionData.restaurantId]);

  useEffect(() => {
    sessionStorage.setItem('selectedItems', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const handleAddItem = (item: MenuItem | TopSellerItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      return existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleQuantity = (itemId: string, increment: boolean) => {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(1, item.quantity + (increment ? 1 : -1)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '80px' }}>
      {/* Sticky Header */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Order Food
          </Typography>
          <IconButton onClick={() => navigate('/cartpage')} color="inherit">
            <ShoppingCart />
            {selectedItems.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                }}
              >
                {selectedItems.length}
              </Box>
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ padding: '1rem' }}>
        {/* Customer Name */}
        <TextField
          label="Your Name *"
          variant="outlined"
          fullWidth
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
          sx={{ mb: 2, backgroundColor: 'white' }}
        />

        {/* Search Bar */}
        <TextField
          label="Search Items"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2, backgroundColor: 'white' }}
        />

        {/* Top Sellers Section */}
        {topSellers.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#d81b60' }}>
              Top Picks
            </Typography>
            <Grid container spacing={2}>
              {topSellers.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <ItemCard
                    item={item}
                    selectedItems={selectedItems}
                    onAdd={handleAddItem}
                    onQuantityChange={handleQuantity}
                    onRemove={handleRemoveItem}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* All Items Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
            Menu
          </Typography>
          <Grid container spacing={2}>
            {filteredItems.map((item) => (
              <Grid item xs={12} key={item.id}>
                <ItemCard
                  item={item}
                  selectedItems={selectedItems}
                  onAdd={handleAddItem}
                  onQuantityChange={handleQuantity}
                  onRemove={handleRemoveItem}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Sticky Cart Footer */}
      {selectedItems.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            boxShadow: '0 -2px 5px rgba(0,0,0,0.2)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">
            Total: ₹{total}
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate('/cartpage')}
            disabled={!customerName}
            sx={{ padding: '0.5rem 2rem' }}
          >
            Review Order
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Reusable ItemCard Component
const ItemCard: React.FC<{
  item: MenuItem | TopSellerItem;
  selectedItems: CartItem[];
  onAdd: (item: MenuItem | TopSellerItem) => void;
  onQuantityChange: (itemId: string, increment: boolean) => void;
  onRemove: (itemId: string) => void;
}> = ({ item, selectedItems, onAdd, onQuantityChange, onRemove }) => {
  const cartItem = selectedItems.find((i) => i.id === item.id);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <img
        src={item.image}
        alt={item.name}
        style={{ width: 60, height: 60, borderRadius: '4px', marginRight: '1rem' }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ₹{item.price}
        </Typography>
      </Box>
      {cartItem ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconButton onClick={() => onQuantityChange(item.id, false)} size="small">
            <Remove />
          </IconButton>
          <Typography>{cartItem.quantity}</Typography>
          <IconButton onClick={() => onQuantityChange(item.id, true)} size="small">
            <Add />
          </IconButton>
          <IconButton onClick={() => onRemove(item.id)} size="small" color="error">
            <Delete />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={() => onAdd(item)}
          sx={{ padding: '0.5rem 1rem' }}
        >
          Add
        </Button>
      )}
    </Box>
  );
};

export default CustomerPage;