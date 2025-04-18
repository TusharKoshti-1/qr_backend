import React, { useState, useEffect, useRef } from 'react';
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
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Link } from 'react-router-dom';
import './MenuItem.css';

type MenuItemType = {
  id: number;
  name: string;
  image: string;
  category: string;
};

const AddMenuItems: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string>(''); // Used in addItemToMenu
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get<MenuItemType[]>(
        `${import.meta.env.VITE_API_URL}/api/menuitems`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
          },
        },
      );
      const items = response.data;

      const grouped = items.reduce(
        (acc, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, MenuItemType[]>,
      );
      setGroupedItems(grouped);

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

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (term.trim() === '') {
      setSelectedCategory('All');
      setOpenCategories((prev) =>
        Object.keys(prev).reduce((acc, cat) => ({ ...acc, [cat]: false }), {}),
      );
      return;
    }

    // Keep selectedCategory as 'All' to show all categories
    setSelectedCategory('All');

    // Find all categories with matching items and open them
    const lowerTerm = term.toLowerCase();
    const matchingCategories = Object.entries(groupedItems)
      .filter(([, items]) => items.some((item) => item.name.toLowerCase().includes(lowerTerm)))
      .map(([category]) => category);

    setOpenCategories((prev) =>
      Object.keys(prev).reduce(
        (acc, category) => {
          acc[category] = matchingCategories.includes(category); // Open if it has matches
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  };

  const addItemToMenu = async (item: MenuItemType) => {
    // 'item' is used here
    try {
      const existingMenuResponse = await axios.get<MenuItemType[]>(
        `${import.meta.env.VITE_API_URL}/api/menu`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
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
          Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
          'Content-Type': 'application/json',
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
    // 'id' is used here
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/remove-itemofmenu/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
        },
      });
      fetchMenuItems(); // Refresh the menu items after removing
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

  return (
    <div className="menu__container">
      {/* Add New Items Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <Link to="/employee/addnewitems">
          <Button variant="contained" color="primary">
            Add New Items
          </Button>
        </Link>
      </div>

      {/* Search Bar and Category Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <TextField
          label="Search items"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
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
              .sort()
              .map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
          </Select>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <Alert severity="info" sx={{ marginBottom: '2rem' }}>
          {message}
        </Alert>
      )}

      {/* Categories Sections */}
      {Object.entries(groupedItems)
        .sort(([a], [b]) => a.localeCompare(b))
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
                            Category: {item.category}
                          </Typography>
                        </CardContent>
                        <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
                          <Button size="small" onClick={() => addItemToMenu(item)}>
                            Add to Menu
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
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

export default AddMenuItems;
