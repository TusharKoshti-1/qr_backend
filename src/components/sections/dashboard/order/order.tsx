import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import QRCode from 'qrcode'; // Import QR code library

interface OrderType {
  id: number;
  customer_name: string;
  phone: string;
  payment_method: string;
  total_amount: number;
  items: ItemType[];
}

interface ItemType {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface AggregatedItemType {
  name: string;
  quantity: number;
}

interface SettingsType {
  restaurantName: string;
  phone: string;
  upiId: string;
}

const Order: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItemType[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const navigate = useNavigate();

  // Function to aggregate items across orders
  const aggregateItems = (orders: OrderType[]) => {
    const itemMap: Record<string, AggregatedItemType> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (itemMap[item.name]) {
          itemMap[item.name].quantity += item.quantity;
        } else {
          itemMap[item.name] = { name: item.name, quantity: item.quantity };
        }
      });
    });
    setAggregatedItems(Object.values(itemMap));
  };

  // Fetch orders and settings
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get<OrderType[]>(
          `${import.meta.env.VITE_API_URL}/api/orders`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setOrders(response.data);
        aggregateItems(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
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

    fetchOrders();
    fetchSettings();

    const ws = new WebSocket('wss://qr-system-v1pa.onrender.com');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'delete_order') {
          setOrders((prevOrders) => {
            const updatedOrders = prevOrders.filter((order) => order.id !== data.id);
            aggregateItems(updatedOrders);
            return updatedOrders;
          });
        } else if (data.type === 'new_order') {
          setOrders((prevOrders) => {
            const updatedOrders = [data.order, ...prevOrders];
            aggregateItems(updatedOrders);
            return updatedOrders;
          });
        } else if (data.type === 'update_order') {
          setOrders((prevOrders) => {
            const updatedOrders = prevOrders.map((order) =>
              order.id === data.id ? { ...order, status: data.status } : order,
            );
            aggregateItems(updatedOrders);
            return updatedOrders;
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    return () => ws.close();
  }, []);

  const handleEditOrder = (order: OrderType) => {
    navigate('/editorder', { state: { order } });
  };

  const handlePrintOrder = async (order: OrderType) => {
    if (!settings || !settings.upiId) {
      alert('UPI ID not configured in settings. Cannot generate QR code.');
      return;
    }

    // Generate UPI payment link
    const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
      settings.restaurantName,
    )}&am=${order.total_amount}&cu=INR`;

    // Generate QR code as a data URL
    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 });
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code.');
      return;
    }

    // Prepare print content
    const printContent = `
      <html>
        <head>
          <title>Order Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            .items { margin-bottom: 20px; }
            .qr { text-align: center; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.restaurantName}</h2>
            <p>Phone: ${settings.phone}</p>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.phone}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method}</p>
            <p><strong>Total Amount:</strong> ₹${order.total_amount}</p>
          </div>
          <div class="items">
            <h3>Items:</h3>
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
          </div>
          <div class="qr">
            <p>Scan to Pay ₹${order.total_amount}</p>
            <img src="${qrCodeUrl}" alt="UPI QR Code" />
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open('', 'Print', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(printContent);
      newWindow.document.close();
      newWindow.print();
    }
  };

  const handleOrderComplete = async (id: number) => {
    const data = { status: 'Completed' };
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, data, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      const updatedOrders = orders.filter((order) => order.id !== id);
      setOrders(updatedOrders);
      aggregateItems(updatedOrders);
    } catch (error) {
      console.error('Error marking order as completed:', error);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    setConfirmDeleteId(null);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      const updatedOrders = orders.filter((order) => order.id !== id);
      setOrders(updatedOrders);
      aggregateItems(updatedOrders);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Pending Orders
      </Typography>
      <div
        style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingBottom: '20px' }}
      >
        <Link to="/addorder">
          <Button variant="contained" color="primary" sx={{ marginBottom: { xs: 2, sm: 0 } }}>
            Add Order
          </Button>
        </Link>
      </div>
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => confirmDeleteId && handleDeleteOrder(confirmDeleteId)}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Aggregated Items Section */}
      <Box
        sx={{
          marginBottom: '30px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', marginBottom: '20px' }}>
          Total Quantities
        </Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f1f1', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Item Name</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedItems.length > 0 ? (
              aggregatedItems.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #ddd',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  }}
                >
                  <td style={{ padding: '10px' }}>{item.name}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  No items to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Orders Section */}
      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {order.customer_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Phone: {order.phone}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Payment Method: {order.payment_method}
                </Typography>
                <Typography variant="h6" sx={{ marginTop: '10px' }}>
                  Total Amount: ₹{order.total_amount}
                </Typography>
                <Divider sx={{ marginY: '10px' }} />
                <Typography variant="subtitle1">Items:</Typography>
                <List dense>
                  {order.items.map((item) => (
                    <ListItem key={item.id} disableGutters>
                      <ListItemText primary={`${item.name} - ₹${item.price} x ${item.quantity}`} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => handleEditOrder(order)}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="secondary"
                  onClick={() => handlePrintOrder(order)}
                >
                  Print
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => handleOrderComplete(order.id)}
                >
                  Complete
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  onClick={() => setConfirmDeleteId(order.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Order;
