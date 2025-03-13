import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItem[]>>({});
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(sessionData.name || '');
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    const savedItems = sessionStorage.getItem('selectedItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const selectRef = useRef<HTMLSelectElement>(null);

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

        const items = menuResponse.data;
        const grouped = items.reduce(
          (acc: Record<string, MenuItem[]>, item: MenuItem) => {
            acc[item.category] = acc[item.category] || [];
            acc[item.category].push(item);
            return acc;
          },
          {}
        );
        setGroupedItems(grouped);

        setOpenCategories(
          Object.keys(grouped).reduce(
            (acc, category) => {
              acc[category] = false;
              return acc;
            },
            { 'Best Selling': true } as Record<string, boolean>
          )
        );
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load menu or top sellers. Please try refreshing the page.');
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
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: '80px', pt: '70px' }}>
      {/* Sticky Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <Typography variant="h4">Welcome</Typography>
        <IconButton
          onClick={() => navigate('/cartpage')}
          sx={{ color: '#00cc00' }} // Bright Black for highlight
        >
          <ShoppingCart sx={{ fontSize: '2rem' }} /> {/* Increased size */}
          {totalQuantity > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#fff', // Bright white for highlight
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000', // black text for contrast
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {totalQuantity}
            </Box>
          )}
        </IconButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ padding: '1rem' }}>
        {/* Customer Name, Search Bar, and Category Filter */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Your Name *"
            variant="outlined"
            fullWidth
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            helperText={!customerName ? 'This field is required' : ''}
            FormHelperTextProps={{ style: { color: 'red' } }}
            sx={{
              mb: 2,
              '& .MuiInputLabel-root': { fontWeight: 'bold' },
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff9c4',
                '& fieldset': { borderColor: '#f57c00', borderWidth: '2px' },
                '&:hover fieldset': { borderColor: '#ef6c00' },
                '&.Mui-focused fieldset': { borderColor: '#e65100' },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Search Menu Items"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <MenuItem value="Best Selling">Best Selling</MenuItem>
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

        {/* Best Selling Section */}
        {topSellers.length > 0 && (selectedCategory === 'All' || selectedCategory === 'Best Selling') && (
          <Box sx={{ mb: 3 }}>
            <Box
              onClick={() =>
                setOpenCategories((prev) => ({ ...prev, 'Best Selling': !prev['Best Selling'] }))
              }
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid black',
                pb: 1,
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold' }}>
                Best Selling
              </Typography>
              {openCategories['Best Selling'] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            {openCategories['Best Selling'] && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {topSellers
                  .filter((item) =>
                    searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
                  )
                  .map((item) => (
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
            )}
          </Box>
        )}

        {/* Other Categories Sections */}
        {Object.entries(groupedItems)
          .sort(([a], [b]) => a.localeCompare(b))
          .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
          .map(([category, items]) => {
            const filteredItems = searchTerm
              ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
              : items;
            if (filteredItems.length === 0) return null;
            return (
              <Box key={category} sx={{ mb: 3 }}>
                <Box
                  onClick={() =>
                    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                  }
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid black',
                    pb: 1,
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
                  <Grid container spacing={2} sx={{ mt: 1 }}>
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
                )}
              </Box>
            );
          })}
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
          <Box>
            <Typography variant="h6">Total: ₹{total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {totalQuantity} Item{totalQuantity > 1 ? 's' : ''} in Cart
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate('/cartpage')}
            disabled={!customerName}
            sx={{ padding: '0.5rem 2rem', fontWeight: 'bold' }}
          >
            View Cart & Order
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
          style={{ width: 50, height: 50, marginRight: '10px', borderRadius: '4px' }}
        />
        <Box>
          <Typography variant="body1">{item.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            ₹{item.price}
          </Typography>
        </Box>
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
          sx={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
        >
          Add
        </Button>
      )}
    </Box>
  );
};

export default CustomerPage;