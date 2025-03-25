import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Add, Remove, Delete } from '@mui/icons-material';
import './MenuItem.css'; // Assuming this CSS file exists for styling

interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface OrderItem extends MenuItemType {
  quantity: number;
}

const AdminAddTableOrderPage: React.FC = () => {
  const [groupedItems] = useState<Record<string, MenuItemType[]>>({
    Chinese: [
      {
        id: 11,
        name: 'Full Dry Manchurian',
        category: 'Chinese',
        price: 150,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1740375694026-p7p3ahjd1z.jpg',
      },
      {
        id: 16,
        name: 'Hakka Noodles',
        category: 'Chinese',
        price: 120,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709285578-29fxbsrayto.jpg',
      },
      {
        id: 19,
        name: 'Paneer Chilli',
        category: 'Chinese',
        price: 180,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709531957-0dxwvgmthhrk.jpg',
      },
    ],
    Punjabi: [
      {
        id: 15,
        name: 'Paneer Tikka Masala',
        category: 'Punjabi',
        price: 200,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709170075-6qnapdswcw8.jpg',
      },
      {
        id: 20,
        name: 'Paneer Angara',
        category: 'Punjabi',
        price: 220,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709596783-3gttb7d9hl4.jpg',
      },
      {
        id: 21,
        name: 'Shahi Paneer',
        category: 'Punjabi',
        price: 210,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709656546-kycq66xnv4.jpg',
      },
    ],
    Soup: [
      {
        id: 17,
        name: 'Hot and Sour Soup',
        category: 'Soup',
        price: 100,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709452722-ct19dz1pojf.jpg',
      },
      {
        id: 18,
        name: 'Tomato Soup',
        category: 'Soup',
        price: 90,
        image:
          'https://zyvlaqormkqnkhsomkil.supabase.co/storage/v1/object/public/menu_items/1741709488423-4ob4ss694qu.jpg',
      },
    ],
    // Add more categories and items as needed
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>(''); // Changed from customerName to tableNumber
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const selectRef = useRef<HTMLSelectElement>(null);

  // Initialize openCategories based on groupedItems
  React.useEffect(() => {
    setOpenCategories(
      Object.keys(groupedItems).reduce(
        (acc, category) => {
          acc[category] = false; // Closed by default
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  }, [groupedItems]);

  const handleAddToOrder = (item: MenuItemType) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleQuantityChange = (itemId: number, increment: boolean) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + (increment ? 1 : -1);
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveItem = (itemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = () => {
    if (!tableNumber) {
      alert('Please enter a table number.');
      return;
    }
    // Simulate order submission without API
    const orderDetails = {
      table_number: tableNumber,
      items: orderItems,
      total_amount: totalAmount,
      payment_method: 'Cash',
      timestamp: new Date().toLocaleString(),
    };
    console.log('Order Submitted:', orderDetails);
    alert(`Order for Table ${tableNumber} created successfully!\nTotal: ₹${totalAmount}`);
    setTableNumber('');
    setOrderItems([]);
  };

  const handleBarClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  return (
    <div className="menu__container">
      {/* Header */}
      <Box sx={{ padding: '1rem', textAlign: 'center', marginBottom: '2rem' }}>
        <Typography variant="h4">Add Table Order</Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: { xs: 'block', md: 'flex' }, gap: '2rem', padding: '0 1rem' }}>
        {/* Left Side: Menu Items */}
        <Box sx={{ flex: 1, mb: { xs: '2rem', md: 0 } }}>
          {/* Table Number, Search Bar, and Category Filter */}
          <Box sx={{ marginBottom: '2rem' }}>
            <TextField
              label="Table Number *"
              variant="outlined"
              fullWidth
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              helperText={!tableNumber ? 'This field is required' : ''}
              FormHelperTextProps={{ style: { color: 'red' } }}
              sx={{
                marginBottom: '1rem',
                '& .MuiInputLabel-root': { fontWeight: 'bold' },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff9c4',
                  '& fieldset': { borderColor: '#f57c00', borderWidth: '2px' },
                  '&:hover fieldset': { borderColor: '#ef6c00' },
                  '&.Mui-focused fieldset': { borderColor: '#e65100' },
                },
              }}
            />
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '1rem' }}>
              <TextField
                label="Search Menu Items"
                variant="outlined"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Box sx={{ position: 'relative', width: { xs: '100%', sm: '200px' } }}>
                <Box
                  onClick={handleBarClick}
                  sx={{
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
                </Box>
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
              </Box>
            </Box>
          </Box>

          {/* Categories Sections */}
          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
            .map(([category, items]) => {
              const filteredItems = searchTerm
                ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : items;
              if (filteredItems.length === 0) return null;
              return (
                <Box key={category} sx={{ marginBottom: '2rem' }}>
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
                    <Typography variant="h5" sx={{ color: 'black', fontWeight: 'bold' }}>
                      {category}
                    </Typography>
                    {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  {openCategories[category] && (
                    <Grid container spacing={2} sx={{ marginTop: '1rem' }}>
                      {filteredItems.map((item) => (
                        <Grid item xs={12} key={item.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              padding: '1rem',
                              minHeight: '70px',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 50,
                                  height: 50,
                                  marginRight: '10px',
                                  borderRadius: '4px',
                                }}
                              />
                              <Box>
                                <Typography variant="body1">{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ₹{item.price}
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleAddToOrder(item)}
                              sx={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                            >
                              Add
                            </Button>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              );
            })}
        </Box>

        {/* Right Side: Order Summary */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            position: { xs: 'static', md: 'sticky' },
            top: { md: '2rem' },
            alignSelf: { md: 'flex-start' },
            maxHeight: { md: 'calc(100vh - 4rem)' },
            overflowY: { md: 'auto' },
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: { xs: '100%', md: 'auto' },
            mt: { xs: '2rem', md: 0 },
          }}
        >
          <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
            Order Summary
          </Typography>
          {orderItems.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No items added yet
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {orderItems.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '1rem',
                      minHeight: '70px',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₹{item.price} x {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, true)}
                        size="small"
                        sx={{ padding: '4px' }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, false)}
                        size="small"
                        sx={{ padding: '4px' }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        size="small"
                        color="error"
                        sx={{ padding: '4px' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
          <Typography variant="h6" sx={{ marginTop: '2rem' }}>
            Total: ₹{totalAmount}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmitOrder}
            disabled={!tableNumber}
            sx={{ marginTop: '1rem', width: '100%', padding: '0.75rem' }}
          >
            Submit Order
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default AdminAddTableOrderPage;
