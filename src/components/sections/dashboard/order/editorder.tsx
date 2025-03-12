import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import './MenuItem.css'; // Assuming this CSS file is shared

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string; // Added category to MenuItem
}

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  phone: string;
  items: OrderItem[];
  total_amount: number;
}

const EditOrder: React.FC = () => {
  const { state } = useLocation();
  const { order } = state as { order: Order };
  const navigate = useNavigate();

  // const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItem[]>>({});
  const [editedItems, setEditedItems] = useState<OrderItem[]>(order.items || []);
  const [total, setTotal] = useState<number>(order.total_amount || 0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get<MenuItem[]>(`${import.meta.env.VITE_API_URL}/api/menu`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        const items = response.data;
        // setMenuItems(items);

        const grouped = items.reduce(
          (acc, item) => {
            acc[item.category] = acc[item.category] || [];
            acc[item.category].push(item);
            return acc;
          },
          {} as Record<string, MenuItem[]>,
        );
        setGroupedItems(grouped);

        // Initialize all categories as closed by default
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
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    const calculateTotal = () => {
      const totalAmount = editedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setTotal(totalAmount);
    };
    calculateTotal();
  }, [editedItems]);

  const handleAddItem = (item: MenuItem) => {
    const existingItem = editedItems.find((editedItem) => editedItem.id === item.id);
    if (existingItem) {
      setEditedItems(
        editedItems.map((editedItem) =>
          editedItem.id === item.id
            ? { ...editedItem, quantity: editedItem.quantity + 1 }
            : editedItem,
        ),
      );
    } else {
      setEditedItems([...editedItems, { ...item, quantity: 1 }]);
    }
  };

  const handleIncreaseQuantity = (item: OrderItem) => {
    setEditedItems(
      editedItems.map((editedItem) =>
        editedItem.id === item.id
          ? { ...editedItem, quantity: editedItem.quantity + 1 }
          : editedItem,
      ),
    );
  };

  const handleDecreaseQuantity = (item: OrderItem) => {
    if (item.quantity > 1) {
      setEditedItems(
        editedItems.map((editedItem) =>
          editedItem.id === item.id
            ? { ...editedItem, quantity: editedItem.quantity - 1 }
            : editedItem,
        ),
      );
    } else {
      setEditedItems(editedItems.filter((editedItem) => editedItem.id !== item.id));
    }
  };

  const handleRemoveItem = (item: OrderItem) => {
    setEditedItems(editedItems.filter((editedItem) => editedItem.id !== item.id));
  };

  const handleSaveOrder = async () => {
    const updatedOrder = {
      ...order,
      items: editedItems,
      total_amount: total,
    };

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/updateorders/${order.id}`,
        updatedOrder,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      navigate('/order');
    } catch (error) {
      console.error('Error saving updated order:', error);
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
        <Typography variant="h4">Edit Order for {order.customer_name}</Typography>
        <Typography variant="subtitle1">
          <strong>Phone:</strong> {order.phone}
        </Typography>
      </Box>

      {/* Search Bar and Category Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <TextField
          label="Search for items"
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
              .sort() // Sort categories alphabetically
              .map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
          </Select>
        </div>
      </div>

      {/* Categories Sections */}
      {Object.entries(groupedItems)
        .sort(([a], [b]) => a.localeCompare(b)) // Sort categories alphabetically
        .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
        .map(([category, items]) => {
          const filteredItems = searchTerm
            ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : items;
          if (filteredItems.length === 0) {
            return null;
          }
          return (
            <div key={category} style={{ marginTop: '2rem' }}>
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
                <Grid container spacing={3} justifyContent="left" style={{ marginTop: '1rem' }}>
                  {filteredItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '1rem',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 50, height: 50, marginRight: '10px' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">{item.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            ₹{item.price}
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAddItem(item)}
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

      {/* Order Items Section */}
      <Box sx={{ marginTop: '2rem' }}>
        <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
          Order Items
        </Typography>
        <Grid container spacing={3} justifyContent="left">
          {editedItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '1rem',
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">{item.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{item.price} x {item.quantity}
                  </Typography>
                </Box>
                <IconButton onClick={() => handleIncreaseQuantity(item)}>
                  <Add />
                </IconButton>
                <IconButton onClick={() => handleDecreaseQuantity(item)}>
                  <Remove />
                </IconButton>
                <IconButton onClick={() => handleRemoveItem(item)}>
                  <Delete />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Typography variant="h6" sx={{ marginTop: '2rem' }}>
          Total: ₹{total}
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSaveOrder}
          sx={{ marginTop: '1rem', width: '200px' }}
        >
          Save Order
        </Button>
      </Box>
    </div>
  );
};

export default EditOrder;
