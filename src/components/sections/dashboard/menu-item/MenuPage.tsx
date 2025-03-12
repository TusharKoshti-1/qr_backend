import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Button,
  CardActions,
  Grid,
  Card,
  CardContent,
  Typography,
  CardMedia,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openBestSellers, setOpenBestSellers] = useState<boolean>(true);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get<MenuItemType[]>(`${import.meta.env.VITE_API_URL}/api/menu`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setMenuItems(response.data);

      const grouped = response.data.reduce(
        (acc, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, MenuItemType[]>,
      );

      setGroupedItems(grouped);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (Object.keys(groupedItems).length > 0) {
      setOpenCategories(
        Object.keys(groupedItems).reduce(
          (acc, category) => {
            acc[category] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      );
    }
  }, [groupedItems]);

  const bestSellers = menuItems.slice(0, 4);

  const handleRateChange = async (id: number, newRate: string) => {
    const data = { price: newRate };
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
      {/* Add Menu Items Button */}
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

      {/* Search Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <TextField
          label="Search menu items"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Best Sellers Section */}
      <div style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid black',
            paddingBottom: '1rem',
          }}
        >
          <Typography variant="h4" sx={{ color: 'secondary.main' }}>
            Best Sellers
          </Typography>
          <Button onClick={() => setOpenBestSellers(!openBestSellers)}>
            {openBestSellers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>
        </div>
        {openBestSellers &&
          (() => {
            const filteredBestSellers = searchQuery
              ? bestSellers.filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
              : bestSellers;
            return filteredBestSellers.length > 0 ? (
              <Grid container spacing={3} justifyContent="left" style={{ marginTop: '1rem' }}>
                {filteredBestSellers.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <Card
                      sx={{
                        maxWidth: 345,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
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
                        <Button size="small" color="secondary">
                          Popular Choice
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography style={{ marginTop: '1rem' }}>
                No best sellers match your search.
              </Typography>
            );
          })()}
      </div>

      {/* Categories Sections */}
      {Object.entries(groupedItems).map(([category, items]) => {
        const filteredItems = searchQuery
          ? items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          : items;
        if (searchQuery && filteredItems.length === 0) {
          return null;
        }
        return (
          <div key={category} style={{ marginTop: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid black',
                paddingBottom: '1rem',
              }}
            >
              <Typography variant="h4" sx={{ color: 'black', fontWeight: 'bold' }}>
                {category}
              </Typography>
              <Button
                onClick={() =>
                  setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                }
              >
                {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Button>
            </div>
            {openCategories[category] && (
              <Grid container spacing={3} justifyContent="left" style={{ marginTop: '1rem' }}>
                {filteredItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <Card
                      sx={{
                        maxWidth: 345,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
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
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          Remove
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MenuPage;
