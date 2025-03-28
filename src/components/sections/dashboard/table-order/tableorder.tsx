import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import QRCode from 'qrcode';

interface TableType {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied' | 'reserved';
  section: string;
  section_id: number;
}

interface SectionType {
  id: number;
  name: string;
}

interface OrderType {
  id: number;
  table_number: string;
  payment_method: string;
  total_amount: number;
  items: ItemType[];
  status: string;
}

interface ItemType {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface SettingsType {
  restaurantName: string;
  phone: string;
  upiId: string;
}

const TableOrdersPage: React.FC = () => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSectionId, setNewTableSectionId] = useState<number | ''>('');
  const [newSectionName, setNewSectionName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, sectionsRes, ordersRes, settingsRes] = await Promise.all([
          axios.get<TableType[]>(`${import.meta.env.VITE_API_URL}/api/tables`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          axios.get<SectionType[]>(`${import.meta.env.VITE_API_URL}/api/sections`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          axios.get<OrderType[]>(`${import.meta.env.VITE_API_URL}/api/tableorder`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
          axios.get<SettingsType>(`${import.meta.env.VITE_API_URL}/api/settings`, {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          }),
        ]);

        setTables(tablesRes.data);
        setSections(sectionsRes.data);
        setOrders(ordersRes.data.filter((order) => order.table_number !== null));
        setSettings(settingsRes.data);
        if (sectionsRes.data.length > 0) {
          setNewTableSectionId(sectionsRes.data[0].id); // Set default section
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const ws = new WebSocket('wss://qr-system-v1pa.onrender.com');
    ws.onopen = () => console.log('WebSocket connection established');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        if (data.type === 'new_table') {
          setTables((prev) => [...prev, data.table]);
        } else if (data.type === 'update_table') {
          setTables((prev) =>
            prev.map((t) => (t.id === data.table.id ? { ...t, ...data.table } : t)),
          );
        } else if (data.type === 'delete_table') {
          setTables((prevTables) => {
            const deletedTable = prevTables.find((t) => t.id === data.id);
            if (deletedTable) {
              setOrders((prevOrders) =>
                prevOrders.filter((o) => o.table_number !== deletedTable.table_number),
              );
            }
            return prevTables.filter((t) => t.id !== data.id);
          });
        } else if (data.type === 'new_section') {
          setSections((prev) => [...prev, data.section]);
          if (!newTableSectionId) {
            setNewTableSectionId(data.section.id); // Set first section as default
          }
        } else if (data.type === 'delete_section') {
          setSections((prev) => prev.filter((s) => s.id !== data.id));
          setTables((prev) => prev.filter((t) => t.section_id !== data.id));
          if (newTableSectionId === data.id && sections.length > 0) {
            setNewTableSectionId(sections[0].id);
          }
        } else if (data.type === 'new_table_order') {
          setOrders((prev) => [data.order, ...prev]);
          setTables((prev) =>
            prev.map((t) =>
              t.table_number === data.order.table_number ? { ...t, status: 'occupied' } : t,
            ),
          );
        } else if (data.type === 'update_table_order') {
          setOrders((prev) =>
            prev
              .map((order) =>
                order.id === Number(data.order.id) ? { ...order, ...data.order } : order,
              )
              .filter((order) => order.status !== 'Completed'),
          );
          setTables((prev) =>
            prev.map((t) =>
              t.table_number === data.order.table_number && data.order.status === 'Completed'
                ? { ...t, status: 'empty' }
                : t,
            ),
          );
        } else if (data.type === 'delete_table_order') {
          setOrders((prev) => prev.filter((order) => order.id !== Number(data.id)));
          setTables((prev) =>
            prev.map((t) =>
              t.table_number === data.order?.table_number ? { ...t, status: 'empty' } : t,
            ),
          );
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket connection closed');

    return () => ws.close();
  }, []);

  const getTableStatusColor = (table: TableType) => {
    const order = orders.find((o) => o.table_number === table.table_number);
    return !order || order.status === 'Completed'
      ? '#d4edda' // Green (empty or completed)
      : order.status === 'Pending'
        ? '#fff3cd' // Yellow (occupied)
        : '#f8d7da'; // Red
  };

  const handleTableClick = (tableNumber: string) => {
    setSelectedTable(tableNumber);
    setDialogOpen(true);
  };

  const handleAddTable = async () => {
    if (!newTableNumber || newTableSectionId === '') {
      alert('Please enter a table number and select a section');
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/tables`,
        { table_number: newTableNumber, section_id: newTableSectionId },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      setAddTableDialogOpen(false);
      setNewTableNumber('');
    } catch (error) {
      console.error('Error adding table:', error);
      alert(error.response?.data?.message || 'Failed to add table');
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName) {
      alert('Please enter a section name');
      return;
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sections`,
        { name: newSectionName },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      setAddSectionDialogOpen(false);
      setNewSectionName('');
    } catch (error) {
      console.error('Error adding section:', error);
      alert(error.response?.data?.message || 'Failed to add section');
    }
  };

  const handleDeleteTable = async () => {
    const table = tables.find((t) => t.table_number === selectedTable);
    if (!table) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tables/${table.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section? All tables in it will be deleted.'))
      return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/sections/${sectionId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      alert(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddOrder = () => {
    setDialogOpen(false);
    navigate('/addtableorder', { state: { table_number: selectedTable } });
  };

  const handleEditOrder = () => {
    const order = orders.find((o) => o.table_number === selectedTable && o.status === 'Pending');
    setDialogOpen(false);
    if (order) navigate('/edittableorder', { state: { order } });
  };

  const handlePrintOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable && o.status === 'Pending');
    if (!order || !settings || !settings.upiId) {
      alert('No pending order found or UPI ID not configured.');
      return;
    }

    const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
      settings.restaurantName,
    )}&am=${order.total_amount}&cu=INR`;

    const qrCodeUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 }).catch((error) => {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code.');
      return '';
    });

    if (!qrCodeUrl) return;

    const printContent = `
      <html>
        <head>
          <title>Table Order Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .qr { text-align: center; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            img { max-width: 150px; }
            .total-amount { margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.restaurantName}</h2>
            <p>Phone: ${settings.phone}</p>
          </div>
          <div class="items">
            <h3>Table ${order.table_number} (${tables.find((t) => t.table_number === selectedTable)?.section}) Items:</h3>
            <table>
              <tr><th>Name</th><th>Price</th><th>Qty</th><th>Total</th></tr>
              ${order.items
                .map(
                  (item) =>
                    `<tr><td>${item.name}</td><td>₹${item.price}</td><td>${item.quantity}</td><td>₹${
                      item.price * item.quantity
                    }</td></tr>`,
                )
                .join('')}
            </table>
            <p class="total-amount"><strong>Total Amount:</strong> ₹${order.total_amount}</p>
          </div>
          <div class="qr">
            <p>Scan to Pay ₹${order.total_amount}</p>
            <img src="${qrCodeUrl}" alt="UPI QR Code" onload="window.print()" />
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open('', 'Print', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(printContent);
      newWindow.document.close();
      newWindow.onload = () => newWindow.print();
    }
    setDialogOpen(false);
  };

  const handleCompleteOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable && o.status === 'Pending');
    const table = tables.find((t) => t.table_number === selectedTable);
    if (!order || !table) return;

    try {
      // Update order status to Completed
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tableorder/${order.id}`,
        { status: 'Completed' },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      // Update table status to empty, including section_id
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tables/${table.id}`,
        { status: 'empty', section_id: table.section_id },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTables((prev) =>
        prev.map((t) => (t.table_number === order.table_number ? { ...t, status: 'empty' } : t)),
      );
      setDialogOpen(false);
    } catch (error) {
      console.error('Error completing table order:', error);
      alert(error.response?.data?.message || 'Failed to complete order.');
    }
  };

  const handleDeleteOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable && o.status === 'Pending');
    const table = tables.find((t) => t.table_number === selectedTable);
    if (!order || !table) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tableorder/${order.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });

      // Update table status to empty after deleting order
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tables/${table.id}`,
        { status: 'empty', section_id: table.section_id },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTables((prev) =>
        prev.map((t) => (t.table_number === order.table_number ? { ...t, status: 'empty' } : t)),
      );
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting table order:', error);
      alert(error.response?.data?.message || 'Failed to delete order');
    }
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3, md: 4 }, maxWidth: '100%', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Table Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddTableDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Add Table
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setAddSectionDialogOpen(true)}
          >
            Add Section
          </Button>
        </Box>
      </Box>

      {sections.map((section) => (
        <Box key={section.id} sx={{ mb: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h5">{section.name}</Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleDeleteSection(section.id)}
            >
              Delete Section
            </Button>
          </Box>
          <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center">
            {tables
              .filter((table) => table.section_id === section.id)
              .map((table) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
                  <Card
                    sx={{
                      backgroundColor: getTableStatusColor(table),
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                    onClick={() => handleTableClick(table.table_number)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        Table {table.table_number}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {table.status === 'empty'
                          ? 'Empty'
                          : table.status === 'occupied'
                            ? 'Occupied'
                            : 'Reserved'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      ))}

      {/* Table Management Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Manage Table {selectedTable}</DialogTitle>
        <DialogContent>
          {orders.find((o) => o.table_number === selectedTable && o.status === 'Pending') ? (
            <Box>
              <Typography>Order Details:</Typography>
              {orders
                .find((o) => o.table_number === selectedTable && o.status === 'Pending')
                ?.items.map((item) => (
                  <Typography key={item.id}>
                    {item.name} - ₹{item.price} x {item.quantity}
                  </Typography>
                ))}
              <Typography sx={{ mt: 1, fontWeight: 'bold' }}>
                Total: ₹
                {
                  orders.find((o) => o.table_number === selectedTable && o.status === 'Pending')
                    ?.total_amount
                }
              </Typography>
            </Box>
          ) : (
            <Typography>No active order for this table.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
          {!orders.find((o) => o.table_number === selectedTable && o.status === 'Pending') ? (
            <>
              <Button onClick={handleAddOrder} color="primary" variant="contained" size="small">
                Add Order
              </Button>
              <Button onClick={handleDeleteTable} color="error" variant="contained" size="small">
                Delete Table
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleEditOrder} color="primary" variant="contained" size="small">
                Edit Order
              </Button>
              <Button onClick={handlePrintOrder} color="secondary" variant="contained" size="small">
                Print
              </Button>
              <Button
                onClick={handleCompleteOrder}
                color="success"
                variant="contained"
                size="small"
              >
                Complete
              </Button>
              <Button onClick={handleDeleteOrder} color="error" variant="contained" size="small">
                Delete Order
              </Button>
            </>
          )}
          <Button
            onClick={() => setDialogOpen(false)}
            color="inherit"
            variant="outlined"
            size="small"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog
        open={addTableDialogOpen}
        onClose={() => setAddTableDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add New Table</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Table Number"
            type="text"
            fullWidth
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Section</InputLabel>
            <Select
              value={newTableSectionId}
              onChange={(e) => setNewTableSectionId(e.target.value as number)}
              label="Section"
            >
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTableDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTable} color="primary" variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog
        open={addSectionDialogOpen}
        onClose={() => setAddSectionDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add New Section</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            type="text"
            fullWidth
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSection} color="primary" variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableOrdersPage;
