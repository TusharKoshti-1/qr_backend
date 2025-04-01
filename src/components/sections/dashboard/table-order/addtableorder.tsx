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
  Paper,
  Card,
  CardContent,
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
      sx={{
        padding: { xs: '0.5rem', sm: '1rem', md: '2rem 4rem' },
        backgroundColor: '#f9f9f9',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      <Box sx={{ textAlign: 'center', marginBottom: { xs: '1rem', sm: '2rem', md: '3rem' } }}>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.8rem' },
            fontWeight: 'bold',
            color: '#2c3e50',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          Add Table Order
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <FormControl fullWidth sx={{ marginBottom: { xs: '1rem', sm: '2rem' } }}>
          <InputLabel sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Table Number *</InputLabel>
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
              backgroundColor: '#f8e1a1',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#f57c00',
                borderWidth: '2px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#ef6c00' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e65100' },
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            <MenuItem value="" disabled>
              <em>Select a table</em>
            </MenuItem>
            {tables
              .filter((table) => table.status === 'empty')
              .map((table) => (
                <MenuItem
                  key={table.id}
                  value={table.table_number}
                  sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  Table {table.table_number} ({table.section})
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            marginBottom: { xs: '1rem', sm: '2rem' },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: '0.5rem', sm: '1rem', md: '1.5rem' },
            alignItems: { sm: 'center' },
          }}
        >
          <TextField
            label="Search Menu Items"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{
              flex: { sm: 1 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                backgroundColor: '#fff',
                '&:hover': { borderColor: '#f57c00' },
                '&.Mui-focused': { borderColor: '#e65100' },
              },
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          />
          <Box sx={{ position: 'relative', width: { xs: '100%', sm: '200px', md: '250px' } }}>
            <Box
              onClick={handleBarClick}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: { xs: '0.5rem', sm: '0.8rem', md: '1rem' },
                border: '1px solid #ddd',
                borderRadius: 1,
                cursor: 'pointer',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  fontWeight: 'bold',
                  color: '#2c3e50',
                }}
              >
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
              <MenuItem value="All">All Categories</MenuItem>
              {Object.keys(groupedItems)
                .sort()
                .map((category) => (
                  <MenuItem
                    key={category}
                    value={category}
                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                  >
                    {category}
                  </MenuItem>
                ))}
            </Select>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: '1rem', md: '2rem' },
            marginBottom: { xs: '1rem', md: '2rem' },
          }}
        >
          <Box sx={{ flex: { md: 2 }, width: '100%' }}>
            {Object.entries(groupedItems)
              .sort(([a], [b]) => a.localeCompare(b))
              .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
              .map(([category, items]) => {
                const filteredItems = searchTerm
                  ? items.filter((item) =>
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                  : items;
                if (filteredItems.length === 0) return null;
                return (
                  <Box key={category} sx={{ marginBottom: { xs: '1rem', md: '2rem' } }}>
                    <Box
                      onClick={() =>
                        setOpenCategories((prev) => ({
                          ...prev,
                          [category]: !prev[category],
                        }))
                      }
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: { xs: '0.5rem', sm: '1rem' },
                        borderRadius: 1,
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                          fontWeight: 'bold',
                          color: '#2c3e50',
                        }}
                      >
                        {category}
                      </Typography>
                      {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    {openCategories[category] && (
                      <Grid
                        container
                        spacing={{ xs: 1, sm: 2, md: 3 }}
                        sx={{ marginTop: { xs: '0.5rem', sm: '1rem' } }}
                      >
                        {filteredItems.map((item) => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                            <Card
                              sx={{
                                borderRadius: 2,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent
                                sx={{
                                  padding: { xs: '0.5rem', sm: '1rem' },
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: 50,
                                      height: 50,
                                      marginRight: '1rem',
                                      borderRadius: '8px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                  <Box>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                                        fontWeight: '500',
                                        color: '#34495e',
                                      }}
                                    >
                                      {item.name}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                                    >
                                      ₹{item.price}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleAddToOrder(item)}
                                  sx={{
                                    minWidth: { xs: '70px', sm: '90px' },
                                    padding: { xs: '0.3rem 0.6rem', sm: '0.5rem 1rem' },
                                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                                    borderRadius: 1,
                                    backgroundColor: '#4CAF50',
                                    '&:hover': { backgroundColor: '#45a049' },
                                  }}
                                >
                                  Add
                                </Button>
                              </CardContent>
                            </Card>
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
              flex: { md: 1 },
              width: '100%',
              position: { xs: 'static', md: 'sticky' },
              top: { md: '2rem' },
              alignSelf: { md: 'flex-start' },
              maxHeight: { md: 'calc(100vh - 6rem)' },
              overflowY: { md: 'auto' },
              padding: { xs: '1rem', sm: '1.5rem', md: '2rem' },
              borderRadius: 2,
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                marginBottom: { xs: '0.5rem', sm: '1rem' },
                fontWeight: 'bold',
                color: '#2c3e50',
              }}
            >
              Order Summary
            </Typography>
            {orderItems.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{
                  textAlign: 'center',
                  py: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: '#7f8c8d',
                }}
              >
                No items added yet
              </Typography>
            ) : (
              <Box sx={{ mt: 1 }}>
                {orderItems.map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        padding: { xs: '0.5rem', sm: '1rem' },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                            fontWeight: '500',
                            color: '#34495e',
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                        >
                          ₹{item.price} x {item.quantity}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: { xs: '0.25rem', sm: '0.5rem' },
                        }}
                      >
                        <IconButton
                          onClick={() => handleQuantityChange(item.id, true)}
                          size="small"
                          sx={{
                            padding: '4px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#45a049' },
                          }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleQuantityChange(item.id, false)}
                          size="small"
                          sx={{
                            padding: '4px',
                            backgroundColor: '#f44336',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#da190b' },
                          }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveItem(item.id)}
                          size="small"
                          color="error"
                          sx={{
                            padding: '4px',
                            backgroundColor: '#ff4444',
                            color: '#fff',
                            '&:hover': { backgroundColor: '#cc0000' },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                <Typography
                  variant="h6"
                  sx={{
                    mt: { xs: '1rem', sm: '1.5rem' },
                    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' },
                    fontWeight: 'bold',
                    color: '#2c3e50',
                  }}
                >
                  Total: ₹{totalAmount}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleSubmitOrder}
                  disabled={!tableNumber || orderItems.length === 0 || sectionId === null}
                  sx={{
                    mt: { xs: '0.5rem', sm: '1rem' },
                    width: '100%',
                    padding: { xs: '0.6rem', sm: '0.8rem' },
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    borderRadius: 1,
                    backgroundColor: '#ff5722',
                    '&:hover': { backgroundColor: '#e64a19' },
                    '&:disabled': { backgroundColor: '#cccccc', color: '#666' },
                  }}
                >
                  Submit Order
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminAddTableOrderPage;
