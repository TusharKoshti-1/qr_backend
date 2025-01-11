import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  CardActions,
  Grid,
  Card,
  CardContent,
  Typography,
  CardMedia,
} from '@mui/material';
import './MenuItem.css';

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
      const response = await axios.get<MenuItemType[]>(
        'https://b2ac-103-161-98-197.ngrok-free.app/api/menu',
        {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        },
      );
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
    <div className="menu__container">
      <div className="menu__item">
        <Link to="/add-menu">
          <Button
            variant="contained"
            color="primary"
            sx={{ marginRight: '20px', marginBottom: { xs: 2, sm: 0 } }}
          >
            Add Menu Items
          </Button>
        </Link>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
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

      <Grid container spacing={3} justifyContent="center">
        {filteredItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card sx={{ maxWidth: 345 }}>
              <CardMedia component="img" height="140" image={item.image} alt={item.name} />
              <CardContent>
                <Typography variant="h5">{item.name}</Typography>
                <Typography variant="body2" fontSize={14} style={{ marginBottom: '4px' }}>
                  Category: {item.category}
                </Typography>
                <Typography variant="body2" fontSize={14}>
                  Price: {item.price}
                </Typography>
              </CardContent>
              <CardActions>
                {editingItemId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                    />
                    <br />
                    <Button size="small" onClick={() => handleRateChange(item.id, newRate)}>
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setNewRate('');
                    }}
                  >
                    Set Rate
                  </Button>
                )}
                <Button size="small" onClick={() => handleRemoveItem(item.id)}>
                  Remove
                </Button>
              </CardActions>
            </Card>
            {/* </div> */}
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default MenuPage;
