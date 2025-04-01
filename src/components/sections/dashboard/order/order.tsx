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
import QRCode from 'qrcode';

interface OrderType {
  id: number;
  customer_name: string;
  phone: string | null;
  payment_method: string;
  total_amount: number;
  items: ItemType[];
  status?: string;
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

    let ws: WebSocket;
    const connectWebSocket = () => {
      ws = new WebSocket('wss://qr-system-v1pa.onrender.com');

      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'new_order') {
            setOrders((prev) => {
              const updatedOrders = [data.order, ...prev];
              aggregateItems(updatedOrders);
              console.log('Updated orders after new_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'complete_order') {
            setOrders((prev) => {
              const updatedOrders = prev
                .map((order) =>
                  order.id === data.order.id ? { ...order, status: data.order.status } : order,
                )
                .filter((order) => order.status !== 'Completed');
              aggregateItems(updatedOrders);
              console.log('Updated orders after complete_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'update_order') {
            setOrders((prev) => {
              const updatedOrders = prev.map((order) =>
                order.id === Number(data.order.id)
                  ? { ...order, ...data.order, items: data.order.items || order.items } // Preserve items if not provided
                  : order,
              );
              aggregateItems(updatedOrders);
              console.log('Updated orders after update_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'delete_order') {
            setOrders((prev) => {
              const updatedOrders = prev.filter((order) => order.id !== Number(data.id));
              aggregateItems(updatedOrders);
              console.log('Updated orders after delete_order:', updatedOrders);
              return updatedOrders;
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed, attempting to reconnect...');
        setTimeout(connectWebSocket, 2000); // Reconnect after 2 seconds
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleEditOrder = (order: OrderType) => {
    navigate('/editorder', { state: { order } });
  };

  const handlePrintOrder = async (order: OrderType) => {
    if (!settings || !settings.upiId) {
      alert('UPI ID not configured in settings. Cannot generate QR code.');
      return;
    }

    const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
      settings.restaurantName,
    )}&am=${order.total_amount}&cu=INR`;

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(upiLink, { width: 150, margin: 1 });
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code.');
      return;
    }

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
            img { max-width: 150px; }
            @media print {
              .qr img { display: block; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.restaurantName}</h2>
            <p>Phone: ${settings.phone}</p>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${order.customer_name}</p>
            <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
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
            <img src="${qrCodeUrl}" alt="UPI QR Code" onload="window.print()" onerror="alert('Failed to load QR code')" />
          </div>
          <script>
            const img = document.querySelector('img');
            if (img.complete) {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const newWindow = window.open('', 'Print', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(printContent);
      newWindow.document.close();
      newWindow.onload = () => {
        newWindow.print();
      };
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
      console.log(`Sent complete request for order ID: ${id}`);
    } catch (error) {
      console.error('Error marking order as completed:', error);
      alert('Failed to complete order.');
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
      setOrders((prev) => {
        const updatedOrders = prev.filter((order) => order.id !== id);
        aggregateItems(updatedOrders);
        return updatedOrders;
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order.');
    }
  };

  return (
    <Box sx={{ padding: { xs: '10px', sm: '20px' }, minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Pending Orders
        </Typography>
        <Link to="/addorder" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              fontSize: { xs: '0.8rem', sm: '1rem' },
              padding: { xs: '6px 12px', sm: '8px 16px' },
            }}
          >
            Add Order
          </Button>
        </Link>
      </Box>

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

      <Box
        sx={{
          mb: 4,
          p: { xs: 2, sm: 3 },
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          overflowX: 'auto',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ textAlign: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' }, mb: 2 }}
        >
          Total Quantities
        </Typography>
        <Box sx={{ minWidth: '300px' }}>
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <Box component="thead">
              <Box
                component="tr"
                sx={{ backgroundColor: '#f1f1f1', borderBottom: '2px solid #ddd' }}
              >
                <Box
                  component="th"
                  sx={{
                    p: { xs: '8px', sm: '10px' },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  }}
                >
                  Item Name
                </Box>
                <Box
                  component="th"
                  sx={{
                    p: { xs: '8px', sm: '10px' },
                    textAlign: 'center',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  }}
                >
                  Quantity
                </Box>
              </Box>
            </Box>
            <Box component="tbody">
              {aggregatedItems.length > 0 ? (
                aggregatedItems.map((item, index) => (
                  <Box
                    component="tr"
                    key={index}
                    sx={{
                      borderBottom: '1px solid #ddd',
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                    }}
                  >
                    <Box
                      component="td"
                      sx={{
                        p: { xs: '8px', sm: '10px' },
                        fontSize: { xs: '0.85rem', sm: '1rem' },
                      }}
                    >
                      {item.name}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: { xs: '8px', sm: '10px' },
                        textAlign: 'center',
                        fontSize: { xs: '0.85rem', sm: '1rem' },
                      }}
                    >
                      {item.quantity}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={2}
                    sx={{
                      textAlign: 'center',
                      p: '20px',
                      color: '#888',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    No items to display.
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {orders.length > 0 ? (
          orders.map((order) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={order.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    {order.customer_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Phone: {order.phone || 'N/A'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Payment Method: {order.payment_method}
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Total: ₹{order.total_amount}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Items:
                  </Typography>
                  <List dense>
                    {order.items.map((item) => (
                      <ListItem key={item.id} disableGutters>
                        <ListItemText
                          primary={`${item.name} - ₹${item.price} x ${item.quantity}`}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions
                  sx={{
                    flexWrap: 'wrap',
                    gap: 0.5,
                    p: { xs: '4px', sm: '8px' },
                    justifyContent: 'space-between',
                    borderTop: '1px solid #ddd',
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => handleEditOrder(order)}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 1.5 },
                      minWidth: '60px',
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={() => handlePrintOrder(order)}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 1.5 },
                      minWidth: '60px',
                    }}
                  >
                    Print
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => handleOrderComplete(order.id)}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 1.5 },
                      minWidth: '60px',
                    }}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    onClick={() => setConfirmDeleteId(order.id)}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      px: { xs: 1, sm: 1.5 },
                      minWidth: '60px',
                    }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{
                textAlign: 'center',
                color: '#888',
                py: 4,
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              No pending orders available.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Order;
