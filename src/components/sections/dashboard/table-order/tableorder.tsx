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

  // Fetch pre-configured tables, orders, and settings
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
        if (data.type === 'new_table_order') {
          setOrders((prev) => [data.order, ...prev]);
        } else if (data.type === 'update_table_order') {
          setOrders((prev) =>
            prev.map((order) => (order.id === data.id ? { ...order, ...data.order } : order)),
          );
        } else if (data.type === 'delete_table_order') {
          setOrders((prev) => prev.filter((order) => order.id !== data.id));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    return () => ws.close();
  }, []);

  const getTableStatus = (tableNumber: string) => {
    const order = orders.find((o) => o.table_number === tableNumber);
    if (!order) return 'empty'; // Green
    if (order.status === 'Completed') return 'completed'; // Red
    return 'pending'; // Yellow
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
    const order = orders.find((o) => o.table_number === selectedTable);
    setDialogOpen(false);
    if (order) navigate('/edit-table-order', { state: { order } });
  };

  const handlePrintOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable);
    if (!order || !settings || !settings.upiId) {
      alert('No order found or UPI ID not configured.');
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
    const order = orders.find((o) => o.table_number === selectedTable);
    if (!order) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/tableorder/update/${order.id}`,
        { status: 'Completed' },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'Completed' } : o)));
      setDialogOpen(false);
    } catch (error) {
      console.error('Error completing table order:', error);
    }
  };

  const handleDeleteOrder = async () => {
    const order = orders.find((o) => o.table_number === selectedTable);
    if (!order) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tableorder/${order.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting table order:', error);
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Table Management
      </Typography>

      <Grid container spacing={2}>
        {tables.map((table) => {
          const status = getTableStatus(table.table_number);
          const backgroundColor =
            status === 'empty' ? '#d4edda' : status === 'pending' ? '#fff3cd' : '#f8d7da'; // Green, Yellow, Red

          return (
            <Grid item xs={6} sm={4} md={3} key={table.id}>
              <Card
                sx={{
                  backgroundColor,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 },
                }}
                onClick={() => handleTableClick(table.table_number)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">Table {table.table_number}</Typography>
                  <Typography variant="body2">
                    {status === 'empty'
                      ? 'Empty'
                      : status === 'pending'
                        ? 'Order Pending'
                        : 'Completed'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Manage Table {selectedTable}</DialogTitle>
        <DialogContent>
          {orders.find((o) => o.table_number === selectedTable) ? (
            <Box>
              <Typography>Order Details:</Typography>
              {orders
                .find((o) => o.table_number === selectedTable)
                ?.items.map((item) => (
                  <Typography key={item.id}>
                    {item.name} - ₹{item.price} x {item.quantity}
                  </Typography>
                ))}
              <Typography sx={{ mt: 1 }}>
                Total: ₹{orders.find((o) => o.table_number === selectedTable)?.total_amount}
              </Typography>
            </Box>
          ) : (
            <Typography>No active order for this table.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {!orders.find((o) => o.table_number === selectedTable) ? (
            <Button onClick={handleAddOrder} color="primary">
              Add Order
            </Button>
          ) : (
            <>
              <Button onClick={handleEditOrder} color="primary">
                Edit Order
              </Button>
              <Button onClick={handlePrintOrder} color="secondary">
                Print
              </Button>
              <Button onClick={handleCompleteOrder} color="success">
                Complete
              </Button>
              <Button onClick={handleDeleteOrder} color="error">
                Delete
              </Button>
            </>
          )}
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableOrdersPage;
