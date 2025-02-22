import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Alert,
  FormControl,
} from '@mui/material';

import './MenuItem.css';
import { Link } from 'react-router-dom';

type MenuItem = {
  id: number;
  name: string;
  image: string;
  category: string;
};

const AddMenuItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchMenuItems();
  }, []);
  const fetchMenuItems = async () => {
    try {
      const response = await axios.get<MenuItem[]>(
        `${import.meta.env.VITE_API_URL}/api/menuitems`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      setMenuItems(response.data);
      setFilteredItems(response.data);
      const uniqueCategories: string[] = [
        ...new Set(response.data.map((item: MenuItem) => item.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === '') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter((item) => item.category === category));
    }
  };

  const addItemToMenu = async (item: MenuItem) => {
    try {
      const existingMenuResponse = await axios.get<MenuItem[]>(
        `${import.meta.env.VITE_API_URL}/api/menu`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      const existingMenu = existingMenuResponse.data;

      const itemExists = existingMenu.some((menuItem) => menuItem.name === item.name);

      if (itemExists) {
        setMessage(`${item.name} is already in the menu`);
        return;
      }

      const data = {
        name: item.name,
        image: item.image,
        category: item.category,
        price: 0,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/add-item`, data, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });

      if (response.status === 200) {
        setMessage(`Added: ${item.name}`);
      } else {
        setMessage('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setMessage('Error occurred while adding item');
    }
  };
  const handleRemoveItem = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/remove-itemofmenu/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      fetchMenuItems(); // Refresh the menu items after removing
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }} className="menu__container">
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        className="menu__item"
      >
        {/* Search Bar - Centered */}
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <TextField
            label="Search items"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>

        {/* Button and Filter - Right Aligned */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/addnewitems">
            <Button variant="contained" color="primary" sx={{ marginBottom: { xs: 2, sm: 0 } }}>
              Add New Items
            </Button>
          </Link>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
      {message && <Alert severity="info">{message}</Alert>}
      <Grid container spacing={3} justifyContent="left">
        {filteredItems
          .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card sx={{ maxWidth: 345 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={`${import.meta.env.VITE_API_URL}${item.image}`}
                  alt={item.name}
                />
                <CardContent>
                  <Typography variant="h5">{item.name}</Typography>
                  <Typography variant="body2">Category: {item.category}</Typography>
                  <div style={{ flexGrow: 1, display: 'flex', gap: '10px' }}>
                    <Button
                      size="small"
                      style={{ marginTop: '10px' }}
                      onClick={() => addItemToMenu(item)}
                    >
                      Add to Menu
                    </Button>
                    <Button
                      size="small"
                      style={{ marginTop: '10px' }}
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>
    </div>
  );
};

export default AddMenuItems;
