import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Typography,
  CardMedia,
} from '@mui/material';

interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<string>('');

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get<MenuItemType[]>('http://localhost:5000/api/menu');
      setMenuItems(response.data);
      setFilteredItems(response.data);
      const uniqueCategories: string[] = [
        ...new Set(response.data.map((item: MenuItemType) => item.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };
  useEffect(() => {
    fetchMenuItems();
  }, []);
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === '') {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter((item) => item.category === category));
    }
  };
  const handleRateChange = async (id: number, newRate: string) => {
    try {
      await axios.put(`http://localhost:5000/api/update-item/${id}`, {
        price: newRate,
      });
      setEditingItemId(null);
      fetchMenuItems(); // Refresh the menu items after updating
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };
  const handleRemoveItem = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/remove-item/${id}`);
      fetchMenuItems(); // Refresh the menu items after removing
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/add-menu">
          <Button variant="contained" color="primary" sx={{ marginRight: '20px' }}>
            Add Menu Items
          </Button>
        </Link>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel sx={{ paddingBottom: 50 }}>Category</InputLabel>
          <Select value={selectedCategory} onChange={(e) => handleCategoryFilter(e.target.value)}>
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={2} key={item.id}>
            <Card>
              <CardMedia component="img" height="200" image={item.image} alt={item.name} />
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2" fontSize={14}>
                  Category: {item.category}
                </Typography>
                <Typography variant="body2" fontSize={14}>
                  Price: {item.price}
                </Typography>
                {editingItemId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                    />
                    <br></br>
                    <Button
                      variant="contained"
                      onClick={() => handleRateChange(item.id, newRate)}
                      sx={{ marginTop: '5px', marginLeft: '55px' }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setNewRate('');
                    }}
                    sx={{
                      marginTop: '30px',
                      marginLeft: '45px',
                      fontSize: '15px',
                    }}
                  >
                    Set Rate
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleRemoveItem(item.id)}
                  sx={{ marginTop: '15px', marginLeft: '45px' }}
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default MenuPage;
