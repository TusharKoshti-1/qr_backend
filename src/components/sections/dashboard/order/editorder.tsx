import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
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
  const { order } = state as { order: Order }; // Typed order from state
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editedItems, setEditedItems] = useState<OrderItem[]>(order.items || []);
  const [total, setTotal] = useState<number>(order.total_amount || 0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/menu`, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        setMenuItems(response.data);
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
      await axios.put(`${import.meta.env.VITE_API_URL}/api/updateorders/${order.id}`, updatedOrder);
      navigate('/order');
    } catch (error) {
      console.error('Error saving updated order:', error);
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Box padding={3}>
      <Typography variant="h4">Edit Order for {order.customer_name}</Typography>
      <Typography variant="subtitle1">
        <strong>Phone:</strong> {order.phone}
      </Typography>

      <Box display="flex" marginTop={3}>
        {/* Left Section: Menu Items */}
        <Box flex={1} marginRight={2}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search for items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.id} divider>
                <img
                  src={`${import.meta.env.VITE_API_URL}${item.image}`}
                  alt={item.name}
                  style={{ width: 50, height: 50, marginRight: 10 }}
                />
                <ListItemText primary={item.name} secondary={`₹${item.price}`} />
                <Button variant="contained" color="primary" onClick={() => handleAddItem(item)}>
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Right Section: Order Items */}
        <Box flex={1}>
          <Typography variant="h6">Order Items</Typography>
          <List>
            {editedItems.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemText primary={item.name} secondary={`₹${item.price} x ${item.quantity}`} />
                <IconButton onClick={() => handleIncreaseQuantity(item)}>
                  <Add />
                </IconButton>
                <IconButton onClick={() => handleDecreaseQuantity(item)}>
                  <Remove />
                </IconButton>
                <IconButton onClick={() => handleRemoveItem(item)}>
                  <Delete />
                </IconButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Typography variant="h6" marginTop={2}>
            Total: ₹{total}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveOrder}
            fullWidth
            style={{ marginTop: 10 }}
          >
            Save Order
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EditOrder;
