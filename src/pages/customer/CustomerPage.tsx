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

        // Initialize 'Best Selling' as open by default, others closed
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (term.trim() === '') {
      setSelectedCategory('All');
      setOpenCategories((prev) =>
        Object.keys(prev).reduce(
          (acc, cat) => ({ ...acc, [cat]: cat === 'Best Selling' }), // Only Best Selling open by default
          {}
        )
      );
    } else {
      setSelectedCategory('All');
      setOpenCategories((prev) =>
        Object.keys(prev).reduce((acc, cat) => ({ ...acc, [cat]: false }), {})
      );
    }
  };

  // Flatten all items for search results and sort them
  const allItems = [
    ...topSellers,
    ...Object.values(groupedItems).flat(),
  ].map((item) => {
    const lowerName = item.name.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    let score = 0;

    if (searchTerm) {
      if (lowerName === lowerSearch) score = 3; // Exact match
      else if (lowerName.startsWith(lowerSearch)) score = 2; // Starts with
      else if (lowerName.includes(lowerSearch)) score = 1; // Contains
    }

    return { ...item, matchScore: score };
  })
  .filter((item) => item.matchScore > 0) // Only include items with a match
  .sort((a, b) => {
    // First, prioritize items in selectedItems (cart)
    const aInCart = selectedItems.some((i) => i.id === a.id) ? 1 : 0;
    const bInCart = selectedItems.some((i) => i.id === b.id) ? 1 : 0;
    if (aInCart !== bInCart) return bInCart - aInCart; // Cart items first

    // Then sort by match score (exact > starts with > contains)
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;

    // Finally, sort alphabetically as a tiebreaker
    return a.name.localeCompare(b.name);
  });

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
        <IconButton onClick={() => navigate('/cartpage')} sx={{ color: '#00cc00' }}>
          <ShoppingCart sx={{ fontSize: '2rem' }} />
          {totalQuantity > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
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
              onChange={(e) => handleSearch(e.target.value)}
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

        {/* Search Results (Flat List) */}
        {searchTerm && allItems.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold', mb: 1 }}>
              Search Results
            </Typography>
            <Grid container spacing={2}>
              {allItems.map((item) => (
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

        {/* Best Selling Section */}
        {topSellers.length > 0 && (selectedCategory === 'All' || selectedCategory === 'Best Selling') && !searchTerm && (
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
            )}
          </Box>
        )}

        {/* Other Categories Sections */}
        {!searchTerm &&
          Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
            .map(([category, items]) => (
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
                    {items.map((item) => (
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
            ))}
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
  item: MenuItem | TopSellerItem & { matchScore?: number };
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