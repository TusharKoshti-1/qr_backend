import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  IconButton,
  Container,
  Paper,
} from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";

// Session validation hook (reusable)
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
    // 15 minutes = 900,000 milliseconds
    if (currentTime - session.timestamp > 900000) {
      sessionStorage.removeItem('userSession');
      sessionStorage.removeItem('selectedItems');
      navigate('/');
    }
  }, [navigate]);
};

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  useSessionCheck(); // Reuse the session check hook

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Get initial cart from session storage
  const [selectedItems, setSelectedItems] = useState<CartItem[]>(() => {
    const savedItems = sessionStorage.getItem("selectedItems");
    return savedItems ? JSON.parse(savedItems) : [];
  });

  // Session data validation
  const sessionData = JSON.parse(sessionStorage.getItem('userSession') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/menu?restaurant_id=${sessionData.restaurantId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/categories?restaurant_id=${sessionData.restaurantId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          })
        ]);
        
        setMenuItems(menuResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load menu. Please try refreshing the page.");
      }
    };

    fetchData();
  }, []);

  // Persist cart to session storage
  useEffect(() => {
    sessionStorage.setItem("selectedItems", JSON.stringify(selectedItems));
  }, [selectedItems]);

  const handleAddItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      return existing 
        ? prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i)
        : [...prev, {...item, quantity: 1}];
    });
  };

  const handleQuantity = (itemId: string, increment: boolean) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + (increment ? 1 : -1);
        return newQuantity >= 1 ? {...item, quantity: newQuantity} : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Hello, {sessionData.name}!
      </Typography>

      <Box display="flex" gap={2} mb={4} flexDirection={{ xs: 'column', sm: 'row' }}>
        <TextField
          label="Search menu..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {filteredItems.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="160"
                image={`${import.meta.env.VITE_API_URL}${item.image}`}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6">{item.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ₹{item.price}
                </Typography>
              </CardContent>
              <Button
                variant="contained"
                fullWidth
                onClick={() => handleAddItem(item)}
                sx={{ mt: 'auto' }}
              >
                Add to Cart
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={3} sx={{ p: 2, position: 'sticky', bottom: 16 }}>
        <Typography variant="h6" gutterBottom>
          Your Cart ({selectedItems.length} items)
        </Typography>
        
        <List dense>
          {selectedItems.map(item => (
            <ListItem key={item.id} divider>
              <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="body1">{item.name}</Typography>
                  <Typography variant="body2">
                    ₹{item.price} × {item.quantity}
                  </Typography>
                </div>
                
                <div>
                  <IconButton onClick={() => handleQuantity(item.id, true)}>
                    <Add />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleQuantity(item.id, false)}
                    disabled={item.quantity === 1}
                  >
                    <Remove />
                  </IconButton>
                  <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                    <Delete />
                  </IconButton>
                </div>
              </Box>
            </ListItem>
          ))}
        </List>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Total: ₹{total}</Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate('/cartpage')}
            disabled={selectedItems.length === 0}
          >
            Proceed to Checkout
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerPage;