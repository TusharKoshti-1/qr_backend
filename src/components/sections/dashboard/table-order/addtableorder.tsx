import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  Grid,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import './MenuItem.css';

interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface TableType {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied' | 'reserved';
  section: string;
  section_id: number;
}

interface OrderItem extends MenuItemType {
  quantity: number;
}

const AdminAddTableOrderPage: React.FC = () => {
  const [groupedItems, setGroupedItems] = useState<Record<string, MenuItemType[]>>({});
  const [tables, setTables] = useState<TableType[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuResponse = await axios.get<MenuItemType[]>(
          `${import.meta.env.VITE_API_URL}/api/menu`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        const items = menuResponse.data;
        const grouped = items.reduce((acc: Record<string, MenuItemType[]>, item: MenuItemType) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item);
          return acc;
        }, {});
        setGroupedItems(grouped);
        setOpenCategories(
          Object.keys(grouped).reduce(
            (acc, category) => {
              acc[category] = false;
              return acc;
            },
            {} as Record<string, boolean>,
          ),
        );

        const tablesResponse = await axios.get<TableType[]>(
          `${import.meta.env.VITE_API_URL}/api/tables`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setTables(tablesResponse.data);

        const prefilledTable = location.state?.table_number;
        const prefilledSectionId = location.state?.section_id;
        if (
          prefilledTable &&
          prefilledSectionId &&
          tablesResponse.data.some(
            (t) => t.table_number === prefilledTable && t.section_id === prefilledSectionId,
          )
        ) {
          setTableNumber(prefilledTable);
          setSectionId(prefilledSectionId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [location.state]);

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

  const handleSubmitOrder = async () => {
    if (!tableNumber || sectionId === null) {
      alert('Please select a table number and section.');
      return;
    }

    const selectedTable = tables.find(
      (t) => t.table_number === tableNumber && t.section_id === sectionId,
    );
    if (!selectedTable) {
      alert('Invalid table number or section.');
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tableorder`,
        {
          table_number: tableNumber,
          section_id: sectionId,
          items: orderItems,
          total_amount: totalAmount,
          payment_method: 'Cash',
          status: 'Pending',
        },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tables/${selectedTable.id}`,
        { status: 'occupied', section_id: selectedTable.section_id },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      alert(`Order for Table ${tableNumber} in ${selectedTable.section} created successfully!`);
      setTableNumber('');
      setSectionId(null);
      setOrderItems([]);
      navigate('/tableorder');
    } catch (error) {
      console.error('Error creating table order:', error);
      alert(error.response?.data?.message || 'Failed to create table order');
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

    setSelectedCategory('All');

    const lowerTerm = term.toLowerCase();
    const matchingCategories = Object.entries(groupedItems)
      .filter(([, items]) => items.some((item) => item.name.toLowerCase().includes(lowerTerm)))
      .map(([category]) => category);

    setOpenCategories((prev) =>
      Object.keys(prev).reduce(
        (acc, category) => {
          acc[category] = matchingCategories.includes(category);
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    );
  };

  return (
    <Box
      sx={{ padding: { xs: '0.5rem', md: '1rem' }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}
    >
      <Box sx={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>
          Add Table Order
        </Typography>
      </Box>

      <Box sx={{ padding: { xs: '0.5rem', md: '1rem' } }}>
        <FormControl fullWidth sx={{ marginBottom: '1rem' }}>
          <InputLabel>Table Number *</InputLabel>
          <Select
            value={tableNumber}
            onChange={(e) => {
              const selected = tables.find((t) => t.table_number === e.target.value);
              setTableNumber(e.target.value as string);
              setSectionId(selected ? selected.section_id : null);
            }}
            label="Table Number *"
            required
            sx={{
              backgroundColor: '#fff9c4',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#f57c00',
                borderWidth: '2px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ef6c00' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e65100' },
            }}
          >
            <MenuItem value="">
              <em>Select a table</em>
            </MenuItem>
            {tables
              .filter((table) => table.status === 'empty')
              .map((table) => (
                <MenuItem key={table.id} value={table.table_number}>
                  Table {table.table_number} ({table.section})
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Box sx={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <TextField
            label="Search Menu Items"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
          />
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Box
              onClick={handleBarClick}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: '#fff',
                borderBottom: '2px solid black',
              }}
            >
              <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
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

        <Box sx={{ marginBottom: '1rem' }}>
          {Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
            .map(([category, items]) => {
              const filteredItems = searchTerm
                ? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                : items;
              if (filteredItems.length === 0) return null;
              return (
                <Box key={category} sx={{ marginBottom: '1rem' }}>
                  <Box
                    onClick={() =>
                      setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                    }
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #ccc',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f5f5f5' },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontSize: { xs: '1rem', md: '1.25rem' }, fontWeight: 'bold' }}
                    >
                      {category}
                    </Typography>
                    {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  {openCategories[category] && (
                    <Grid container spacing={1} sx={{ marginTop: '0.5rem' }}>
                      {filteredItems.map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              backgroundColor: '#fff',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{
                                  width: 40,
                                  height: 40,
                                  marginRight: '0.5rem',
                                  borderRadius: '4px',
                                }}
                              />
                              <Box>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                  {item.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.8rem' }}
                                >
                                  ₹{item.price}
                                </Typography>
                              </Box>
                            </Box>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleAddToOrder(item)}
                              size="small"
                              sx={{
                                minWidth: '60px',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                              }}
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

        <Box
          sx={{
            marginTop: '1rem',
            backgroundColor: '#fff',
            borderRadius: '4px',
            padding: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' }, marginBottom: '0.5rem' }}
          >
            Order Summary
          </Typography>
          {orderItems.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', py: 1, fontSize: '0.9rem' }}
            >
              No items added yet
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {orderItems.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem' }}
                      >
                        ₹{item.price} x {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
          <Typography
            variant="h6"
            sx={{ marginTop: '1rem', fontSize: { xs: '1rem', md: '1.25rem' } }}
          >
            Total: ₹{totalAmount}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmitOrder}
            disabled={!tableNumber || orderItems.length === 0 || sectionId === null}
            sx={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}
          >
            Submit Order
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminAddTableOrderPage;
