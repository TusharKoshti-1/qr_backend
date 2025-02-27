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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [total, setTotal] = useState<number>(0);

  // Session state
  const [session, setSession] = useState<{
    name: string;
    phone: string;
    restaurantId: number;
  }>(() => {
    const savedSession = sessionStorage.getItem("userSession");
    return savedSession ? JSON.parse(savedSession) : { name: "", phone: "", restaurantId: 0 };
  });

  useEffect(() => {
    const verifySession = () => {
      const sessionData = sessionStorage.getItem("userSession");
      if (!sessionData) {
        navigate("/welcome");
        return;
      }

      const { timestamp, ...session } = JSON.parse(sessionData);
      const currentTime = Date.now();
      const sessionAge = currentTime - timestamp;

      if (sessionAge > 10 * 60 * 1000) {
        sessionStorage.removeItem("userSession");
        navigate("/welcome");
        return;
      }

      // Update session state
      setSession(session);
      
      // Set auto-logout timer
      const timeLeft = 10 * 60 * 1000 - sessionAge;
      const timeout = setTimeout(() => {
        sessionStorage.removeItem("userSession");
        navigate("/welcome");
      }, timeLeft);

      return () => clearTimeout(timeout);
    };

    verifySession();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuResponse, categoriesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/customer/menu?restaurant_id=${session.restaurantId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/customer/categories?restaurant_id=${session.restaurantId}`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
          })
        ]);

        setMenuItems(menuResponse.data);
        setCategories(categoriesResponse.data);

        // Restore cart items
        const savedItems = JSON.parse(sessionStorage.getItem("selectedItems") || "[]");
        setSelectedItems(savedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (session.restaurantId) {
      fetchData();
    }
  }, [session.restaurantId]);

  useEffect(() => {
    const totalAmount = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotal(totalAmount);
    sessionStorage.setItem("selectedItems", JSON.stringify(selectedItems));
  }, [selectedItems]);

  // Cart item handlers remain the same
  const handleAddItem = (item: MenuItem) => {
    const existingItem = selectedItems.find((selectedItem) => selectedItem.id === item.id);
    if (existingItem) {
      setSelectedItems(
        selectedItems.map((selectedItem) =>
          selectedItem.id === item.id
            ? { ...selectedItem, quantity: selectedItem.quantity + 1 }
            : selectedItem
        )
      );
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleIncreaseQuantity = (item: CartItem) => {
    setSelectedItems(
      selectedItems.map((selectedItem) =>
        selectedItem.id === item.id
          ? { ...selectedItem, quantity: selectedItem.quantity + 1 }
          : selectedItem
      )
    );
  };

  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      setSelectedItems(
        selectedItems.map((selectedItem) =>
          selectedItem.id === item.id
            ? { ...selectedItem, quantity: selectedItem.quantity - 1 }
            : selectedItem
        )
      );
    } else {
      setSelectedItems(selectedItems.filter((selectedItem) => selectedItem.id !== item.id));
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    setSelectedItems(selectedItems.filter((selectedItem) => selectedItem.id !== item.id));
  };

  const handleGoToCart = () => {
    navigate("/cartpage", { 
      state: { 
        selectedItems,
        total 
      } 
    });
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Hello, {session.name}!
      </Typography>

      {/* Rest of the UI remains the same */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <TextField
          label="Search for items..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, marginRight: 2 }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
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

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <Grid container spacing={4} style={{ flexWrap: 'nowrap' }}>
          {filteredMenuItems.map((item) => (
            <Grid item style={{ flex: '0 0 auto', width: '250px' }} key={item.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={`${item.image}`}
                  alt={item.name}
                />
                <CardContent>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2">₹{item.price}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => handleAddItem(item)}
                  >
                    Add
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </div>

      <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Your Cart
        </Typography>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <List>
            {selectedItems.map((item) => (
              <ListItem key={item.id} divider>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <Typography variant="body1" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {`${item.name} - ₹${item.price}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`Quantity: ${item.quantity}`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                      <IconButton size="small" onClick={() => handleIncreaseQuantity(item)}>
                        <Add />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDecreaseQuantity(item)}>
                        <Remove />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleRemoveItem(item)} color="error">
                        <Delete />
                      </IconButton>
                    </div>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>
        </div>
      </Paper>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Total: ₹{total}
      </Typography>
      <Button
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleGoToCart}
      >
        Go to Cart
      </Button>
    </Container>
  );
};

export default CustomerPage;