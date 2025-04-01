import React, { useEffect, useState /*, useRef*/ } from 'react';
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
  // const selectRef = useRef<HTMLSelectElement>(null);

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

  // const handleBarClick = () => {
  //   if (selectRef.current) {
  //     selectRef.current.focus();
  //     selectRef.current.click();
  //   }
  // };

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
        maxWidth: '1400px',
        mx: 'auto',
        p: { xs: 2, md: 3 },
        bgcolor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          textAlign: 'center',
          fontSize: { xs: '1.5rem', md: '2.25rem' },
          fontWeight: 600,
          color: '#333',
        }}
      >
        Add Table Order
      </Typography>

      <Grid container spacing={3}>
        {/* Left Section - Menu Selection */}
        <Grid item xs={12} md={7}>
          <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 2, boxShadow: 1 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Table Number</InputLabel>
                  <Select
                    value={tableNumber}
                    onChange={(e) => {
                      const selected = tables.find((t) => t.table_number === e.target.value);
                      setTableNumber(e.target.value as string);
                      setSectionId(selected ? selected.section_id : null);
                    }}
                    label="Table Number"
                    sx={{
                      bgcolor: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#999' },
                    }}
                  >
                    <MenuItem value="">
                      <em>Select table</em>
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Search Menu"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
            </Grid>

            {/* Category Filter */}
            <Select
              fullWidth
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as string)}
              sx={{ mb: 2, bgcolor: 'white' }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {Object.keys(groupedItems)
                .sort()
                .map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
            </Select>

            {/* Menu Items */}
            <Box sx={{ maxHeight: { xs: '60vh', md: '70vh' }, overflowY: 'auto' }}>
              {Object.entries(groupedItems)
                .filter(([category]) => selectedCategory === 'All' || category === selectedCategory)
                .map(([category, items]) => {
                  const filteredItems = searchTerm
                    ? items.filter((item) =>
                        item.name.toLowerCase().includes(searchTerm.toLowerCase()),
                      )
                    : items;
                  if (filteredItems.length === 0) return null;
                  return (
                    <Box key={category} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          bgcolor: '#f0f0f0',
                          p: 1,
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                        }
                      >
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', color: '#444' }}>
                          {category}
                        </Typography>
                        {openCategories[category] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </Box>
                      {openCategories[category] && (
                        <Box sx={{ mt: 1 }}>
                          {filteredItems.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 1,
                                borderBottom: '1px solid #eee',
                                '&:hover': { bgcolor: '#f9f9f9' },
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: 40, height: 40, borderRadius: 4, marginRight: 2 }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.95rem' }}>{item.name}</Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                  ₹{item.price}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleAddToOrder(item)}
                                sx={{ ml: 2, minWidth: '70px' }}
                              >
                                Add
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
            </Box>
          </Box>
        </Grid>

        {/* Right Section - Order Summary */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              p: 2,
              boxShadow: 1,
              position: 'sticky',
              top: 20,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontSize: '1.25rem', color: '#333' }}>
              Order Summary
            </Typography>

            <Box sx={{ maxHeight: '60vh', overflowY: 'auto', mb: 2 }}>
              {orderItems.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#666', py: 2 }}>
                  No items added
                </Typography>
              ) : (
                orderItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.95rem' }}>{item.name}</Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                        ₹{item.price} x {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, true)}>
                        <Add fontSize="small" />
                      </IconButton>
                      <Typography>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => handleQuantityChange(item.id, false)}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Box sx={{ borderTop: '1px solid #ddd', pt: 2 }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2 }}>
                Total: ₹{totalAmount}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSubmitOrder}
                disabled={!tableNumber || orderItems.length === 0 || sectionId === null}
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                Place Order
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AdminAddTableOrderPage;
