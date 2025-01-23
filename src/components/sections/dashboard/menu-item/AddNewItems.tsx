import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Grid, Card, CardContent, Typography, CardActions } from '@mui/material';

const AddNewItem: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

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
      await axios.post('https://exact-notable-tadpole.ngrok-free.app/api/add-menuitem', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': 'true' },
      });
      alert('Menu item added successfully!');
      // Reset fields
      setName('');
      setCategory('');
      setImage(null);
      setError('');
    } catch (error) {
      console.error('Error adding menu item:', error);
      setError('Failed to add menu item. Please try again.');
    }
  };

  return (
    <div className="menu__container">
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={6} md={4} lg={7}>
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
              <TextField
                fullWidth
                label="Category"
                variant="outlined"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ marginBottom: 2 }}
              />
              <Button variant="contained" component="label" fullWidth sx={{ marginBottom: 2 }}>
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    if (e.target.files) {
                      setImage(e.target.files[0]);
                    }
                  }}
                />
              </Button>
              {image && (
                <Typography variant="body2" color="textSecondary">
                  Selected file: {image.name}
                </Typography>
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
