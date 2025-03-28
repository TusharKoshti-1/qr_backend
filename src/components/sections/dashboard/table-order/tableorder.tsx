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
} from '@mui/material';
import QRCode from 'qrcode';

interface TableType {
  id: number;
  table_number: string;
  status: 'empty' | 'occupied' | 'reserved';
}

interface OrderType {
  id: number;
  table_number: string;
  payment_method: string;
  total_amount: number;
  items: ItemType[];
  status: string; // 'Pending', 'Completed'
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
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get<TableType[]>(
          `${import.meta.env.VITE_API_URL}/api/tables`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setTables(response.data);
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await axios.get<OrderType[]>(
          `${import.meta.env.VITE_API_URL}/api/tableorder`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        const tableOrders = response.data.filter((order) => order.table_number !== null);
        setOrders(tableOrders);
      } catch (error) {
        console.error('Error fetching table orders:', error);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await axios.get<SettingsType>(
          `${import.meta.env.VITE_API_URL}/api/settings`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchTables();
    fetchOrders();
    fetchSettings();

    const ws = new WebSocket('wss://qr-system-v1pa.onrender.com');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data); // Debug log

        if (data.type === 'new_table') {
          setTables((prev) => [...prev, data.table]);
        } else if (data.type === 'update_table') {
          setTables((prev) =>
            prev.map((t) => (t.id === data.table.id ? { ...t, ...data.table } : t)),
          );
        } else if (data.type === 'delete_table') {
          setTables((prev) => prev.filter((t) => t.id !== data.id));
          setOrders((prev) => prev.filter((o) => o.table_number !== data.table_number));
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
          setOrders((prev) => prev.filter((order) => order.id === Number(data.id)));
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

    return () => ws.close();
  }, []);

  const getTableStatusColor = (table: TableType) => {
    const order = orders.find((o) => o.table_number === table.table_number);
    return !order || order.status === 'Completed'
      ? '#d4edda' // Green (empty or completed)
      : order.status === 'Pending'
        ? '#fff3cd' // Yellow (occupied)
        : '#f8d7da'; // Red (shouldn't occur with current logic)
  };

  const handleTableClick = (tableNumber: string) => {
    setSelectedTable(tableNumber);
    setDialogOpen(true);
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
            <h3>Table ${order.table_number} Items:</h3>
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

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tables/${table.id}`,
        { status: 'empty' },
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
      alert('Failed to complete order.');
    }
  };

  const handleDeleteOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable && o.status === 'Pending');
    const table = tables.find((t) => t.table_number === selectedTable);
    if (!order || !table) return;

    try {
      // Use the correct API to delete only the order
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tableorder/${order.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });

      // Update local state: Remove order and set table status to 'empty'
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTables((prev) =>
        prev.map((t) => (t.table_number === order.table_number ? { ...t, status: 'empty' } : t)),
      );
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting table order:', error);
      alert('Failed to delete order.');
    }
  };

  return (
    <Box
      sx={{
        padding: { xs: 2, sm: 3, md: 4 }, // Responsive padding
        maxWidth: '100%',
        margin: '0 auto',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, // Responsive font size
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Table Management
      </Typography>

      <Grid
        container
        spacing={{ xs: 1, sm: 2, md: 3 }} // Responsive spacing
        justifyContent="center"
      >
        {tables.map((table) => (
          <Grid
            item
            xs={6}
            sm={4}
            md={3}
            lg={2} // Added lg breakpoint
            key={table.id}
          >
            <Card
              sx={{
                backgroundColor: getTableStatusColor(table),
                cursor: 'pointer',
                '&:hover': { boxShadow: 6 },
                height: '100%', // Ensure cards stretch to equal height
                display: 'flex', // For centering content
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.3s ease-in-out', // Smooth hover transition
              }}
              onClick={() => handleTableClick(table.table_number)}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  p: { xs: 1, sm: 2 }, // Responsive padding
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font
                    wordBreak: 'break-word', // Prevent text overflow
                  }}
                >
                  Table {table.table_number}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Responsive font
                  }}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm" // Limit dialog width on larger screens
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 }, // Responsive margin
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem' }, // Responsive title
            p: { xs: 1, sm: 2 },
          }}
        >
          Manage Table {selectedTable}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {orders.find((o) => o.table_number === selectedTable && o.status === 'Pending') ? (
            <Box>
              <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Order Details:
              </Typography>
              {orders
                .find((o) => o.table_number === selectedTable && o.status === 'Pending')
                ?.items.map((item) => (
                  <Typography
                    key={item.id}
                    sx={{
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      py: 0.5,
                    }}
                  >
                    {item.name} - ₹{item.price} x {item.quantity}
                  </Typography>
                ))}
              <Typography
                sx={{
                  mt: 1,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 'bold',
                }}
              >
                Total: ₹
                {
                  orders.find((o) => o.table_number === selectedTable && o.status === 'Pending')
                    ?.total_amount
                }
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              No active order for this table.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexWrap: 'wrap', // Allow buttons to wrap on small screens
            gap: 1, // Consistent spacing between buttons
            p: { xs: 1, sm: 2 },
          }}
        >
          {!orders.find((o) => o.table_number === selectedTable && o.status === 'Pending') ? (
            <Button
              onClick={handleAddOrder}
              color="primary"
              variant="contained"
              size="small"
              sx={{ minWidth: { xs: '80px', sm: '100px' } }}
            >
              Add Order
            </Button>
          ) : (
            <>
              <Button
                onClick={handleEditOrder}
                color="primary"
                variant="contained"
                size="small"
                sx={{ minWidth: { xs: '80px', sm: '100px' } }}
              >
                Edit Order
              </Button>
              <Button
                onClick={handlePrintOrder}
                color="secondary"
                variant="contained"
                size="small"
                sx={{ minWidth: { xs: '80px', sm: '100px' } }}
              >
                Print
              </Button>
              <Button
                onClick={handleCompleteOrder}
                color="success"
                variant="contained"
                size="small"
                sx={{ minWidth: { xs: '80px', sm: '100px' } }}
              >
                Complete
              </Button>
              <Button
                onClick={handleDeleteOrder}
                color="error"
                variant="contained"
                size="small"
                sx={{ minWidth: { xs: '80px', sm: '100px' } }}
              >
                Delete
              </Button>
            </>
          )}
          <Button
            onClick={() => setDialogOpen(false)}
            color="inherit"
            variant="outlined"
            size="small"
            sx={{ minWidth: { xs: '80px', sm: '100px' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableOrdersPage;
