import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActions,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

const AddNewItem: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Fetch existing categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('userLoggedIn');
        // console.log('Fetching categories with token:', token);
        // console.log('API URL:', import.meta.env.VITE_API_URL);

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${token}`,
          },
        });

        // console.log('API Response:', response.data);

        // Backend returns a flat array, so use response.data directly and sort alphabetically
        const fetchedCategories = Array.isArray(response.data) ? response.data.sort() : [];
        setCategories(fetchedCategories);

        if (fetchedCategories.length === 0) {
          // console.log('No categories found in the database.');
          setError('No existing categories found. You can add a new one.');
        }
      } catch (error) {
        // console.error('Error fetching categories:', error.response?.data || error.message);
        setError('Failed to load categories. You can still add a new one.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAddMenuItem = async () => {
    if (!name || !category || !image) {
      setError('Please fill all fields and upload an image.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('image', image);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/add-menuitem`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      alert('Menu item added successfully!');
      // Reset fields
      setName('');
      setCategory('');
      setImage(null);
      setImagePreview(null);
      setError('');
      // Refresh categories if a new one was added, keeping the list sorted
      if (!categories.includes(category)) {
        const updatedCategories = [...categories, category].sort();
        setCategories(updatedCategories);
        // console.log('Added new category to sorted list:', updatedCategories);
      }
    } catch (error) {
      console.error('Error adding menu item:', error.response?.data || error.message);
      setError('Failed to add menu item. Please try again.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      setImagePreview(URL.createObjectURL(selectedImage));
    }
  };

  return (
    <div className="menu__container" style={{ padding: '20px' }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={6} md={4} lg={5}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ marginBottom: 2 }}
              />
              {loadingCategories ? (
                <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mb: 2 }} />
              ) : (
                <>
                  <Autocomplete
                    freeSolo
                    options={categories}
                    value={category}
                    onChange={(event, newValue) => setCategory(newValue || '')}
                    onInputChange={(event, newInputValue) => setCategory(newInputValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Category"
                        variant="outlined"
                        sx={{ marginBottom: 2 }}
                        helperText="Select an existing category or type a new one"
                      />
                    )}
                  />
                  {categories.length > 0 && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Existing categories: {categories.join(', ')}
                    </Typography>
                  )}
                </>
              )}
              <Button variant="contained" component="label" fullWidth sx={{ marginBottom: 2 }}>
                Upload Image
                <input type="file" accept="image/*" hidden onChange={handleImageChange} />
              </Button>
              {image && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Selected file: {image.name}
                </Typography>
              )}
              {imagePreview && (
                <div style={{ textAlign: 'center', marginTop: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
              )}
            </CardContent>
            <CardActions>
              <Button variant="contained" color="primary" fullWidth onClick={handleAddMenuItem}>
                Add Item
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AddNewItem;
