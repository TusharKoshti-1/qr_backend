import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button, CardActions, Grid, Card, CardContent, Typography, CardMedia } from '@mui/material';
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
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  // const [categories, setCategories] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<string>('');

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get<MenuItemType[]>(`${import.meta.env.VITE_API_URL}/api/menu`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setMenuItems(response.data);

      // Group items by category
      const grouped = response.data.reduce(
        (acc, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, MenuItemType[]>,
      );

      setGroupedItems(grouped);
      // setCategories(Object.keys(grouped));
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Mock best sellers (first 4 items for demonstration)
  const bestSellers = menuItems.slice(0, 4);

  const handleRateChange = async (id: number, newRate: string) => {
    const data = {
      price: newRate,
    };
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/update-item/${id}`, data, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setEditingItemId(null);
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/delete-item/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      fetchMenuItems();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <div className="menu__container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <Link to="/addmenuitems">
          <Button variant="contained" color="primary">
            Add Menu Items
          </Button>
        </Link>
      </div>

      {/* Categories Sections */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <Typography variant="h4" sx={{ marginBottom: '2rem', color: 'primary.main' }}>
            {category}
          </Typography>
          <Grid container spacing={3} justifyContent="left">
            {items.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Card
                  sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia component="img" height="140" image={item.image} alt={item.name} />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="div">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Price: ${item.price}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {editingItemId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                          type="text"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          placeholder="New price"
                          style={{ flex: 1 }}
                        />
                        <Button size="small" onClick={() => handleRateChange(item.id, newRate)}>
                          Save
                        </Button>
                      </div>
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
                    <Button size="small" color="error" onClick={() => handleRemoveItem(item.id)}>
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      ))}

      {/* Best Sellers Section */}
      <Typography variant="h4" sx={{ margin: '4rem 0 2rem', color: 'secondary.main' }}>
        Best Sellers
      </Typography>
      <Grid container spacing={3} justifyContent="left">
        {bestSellers.map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
            <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia component="img" height="140" image={item.image} alt={item.name} />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Price: ${item.price}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="secondary">
                  Popular Choice
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default MenuPage;
