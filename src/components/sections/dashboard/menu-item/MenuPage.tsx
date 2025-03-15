import React, { useEffect, useState, useRef } from 'react';
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
  Select,
  MenuItem,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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

interface TopSellerItem extends MenuItemType {
  rank: number;
  quantitySold: number;
}

const MenuPage: React.FC = () => {
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openBestSellers, setOpenBestSellers] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const fetchData = async () => {
    try {
      const restaurantId = localStorage.getItem('restaurantId');
      const topSellersResponse = await axios.get<TopSellerItem[]>(
        `${import.meta.env.VITE_API_URL}/api/top-sellers?restaurant_id=${restaurantId}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      setTopSellers(topSellersResponse.data);

      const menuResponse = await axios.get<MenuItemType[]>(
        `${import.meta.env.VITE_API_URL}/api/menu`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      const grouped = menuResponse.data.reduce(
        (acc, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, MenuItemType[]>,
      );
      setGroupedItems(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
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
      setNewRate('');
      fetchData();
    } catch (error) {
      console.error('Error updating rate:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewRate('');
  };

  const handleRemoveItem = async (id: number) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/delete-item/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      fetchData();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete !== null) {
      handleRemoveItem(itemToDelete);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
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

      {/* Search Bar and Category Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <TextField
          label="Search menu items"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
            <MenuItem value="Best Selling">Best Selling</MenuItem>
            {Object.keys(groupedItems)
              .sort()
              .map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
          </Select>
        </div>
      </div>

      {/* Best Selling Section */}
      {topSellers.length > 0 &&
        (selectedCategory === 'All' || selectedCategory === 'Best Selling') && (
          <div style={{ marginTop: '2rem' }}>
            <Box
              onClick={() => setOpenBestSellers(!openBestSellers)}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid black',
                paddingBottom: '1rem',
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
              }}
            >
              <Typography variant="h4" sx={{ color: 'secondary.main' }}>
                Best Selling
              </Typography>
              {openBestSellers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
            {openBestSellers &&
              (() => {
                const filteredBestSellers = searchQuery
                  ? topSellers.filter((item) =>
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )
                  : topSellers;
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
                          <CardMedia
                            component="img"
                            height="140"
                            image={item.image}
                            alt={item.name}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography gutterBottom variant="h5" component="div">
                              {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Price: ₹{item.price}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sold: {item.quantitySold} units
                            </Typography>
                          </CardContent>
                          <CardActions
                            sx={{
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              padding: '8px',
                            }}
                          >
                            <Button size="small" color="secondary">
                              Rank: {item.rank}
                            </Button>
                            {editingItemId === item.id ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  width: '100%',
                                  gap: 1,
                                }}
                              >
                                <TextField
                                  size="small"
                                  value={newRate}
                                  onChange={(e) => setNewRate(e.target.value)}
                                  placeholder="New price"
                                  type="number"
                                  fullWidth
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    onClick={() => handleRateChange(item.id, newRate)}
                                  >
                                    Save
                                  </Button>
                                  <Button size="small" onClick={handleCancelEdit}>
                                    Cancel
                                  </Button>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setNewRate(item.price.toString());
                                  }}
                                >
                                  Set Rate
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(item.id)}
                                >
                                  Remove
                                </Button>
                              </Box>
                            )}
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography style={{ marginTop: '1rem' }}>
                    No Best Selling match your search.
                  </Typography>
                );
              })()}
          </div>
        )}

      {/* Categories Sections */}
      {Object.entries(groupedItems)
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
        .map(([category, items]) => {
          const filteredItems = searchQuery
            ? items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                  '&:hover': { backgroundColor: '#f5f5f5' },
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
                      <Card
                        sx={{
                          maxWidth: 345,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="140"
                          image={item.image}
                          alt={item.name}
                        />
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography gutterBottom variant="h5" component="div">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Price: ₹{item.price}
                          </Typography>
                        </CardContent>
                        <CardActions
                          sx={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px' }}
                        >
                          {editingItemId === item.id ? (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                gap: 1,
                              }}
                            >
                              <TextField
                                size="small"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                placeholder="New price"
                                type="number"
                                fullWidth
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  onClick={() => handleRateChange(item.id, newRate)}
                                >
                                  Save
                                </Button>
                                <Button size="small" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setNewRate(item.price.toString());
                                }}
                              >
                                Set Rate
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(item.id)}
                              >
                                Remove
                              </Button>
                            </Box>
                          )}
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </div>
          );
        })}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Confirm Deletion'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to remove this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MenuPage;
