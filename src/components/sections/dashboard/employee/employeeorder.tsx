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
  Checkbox,
  FormControlLabel,
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
  gst?: number; // Added GST rate
}

const Order: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItemType[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [includeGST, setIncludeGST] = useState(false); // State for GST checkbox
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
              Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
            },
          },
        );
        const normalizedOrders = response.data.map((order) => ({
          ...order,
          id: Number(order.id),
        }));
        setOrders(normalizedOrders);
        aggregateItems(normalizedOrders);
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
              Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
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
              const newOrder = { ...data.order, id: Number(data.order.id) };
              const updatedOrders = [newOrder, ...prev];
              aggregateItems(updatedOrders);
              console.log('Updated orders after new_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'complete_order') {
            setOrders((prev) => {
              const orderId = Number(data.order.id);
              const updatedOrders = prev.filter((order) => Number(order.id) !== orderId);
              aggregateItems(updatedOrders);
              console.log('Updated orders after complete_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'update_order') {
            setOrders((prev) => {
              const orderId = Number(data.order.id);
              const updatedOrders = prev.map((order) =>
                Number(order.id) === orderId
                  ? {
                      ...order,
                      ...data.order,
                      id: orderId,
                      items: data.order.items || order.items,
                      status: order.status,
                    }
                  : order,
              );
              aggregateItems(updatedOrders);
              console.log('Updated orders after update_order:', updatedOrders);
              return updatedOrders;
            });
          } else if (data.type === 'delete_order') {
            setOrders((prev) => {
              const orderId = Number(data.id);
              const updatedOrders = prev.filter((order) => Number(order.id) !== orderId);
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
        setTimeout(connectWebSocket, 2000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleEditOrder = (order: OrderType) => {
    navigate('/employee/editorder', { state: { order } });
  };

  const handlePrintOrderClick = (order: OrderType) => {
    setSelectedOrder(order);
    setIncludeGST(false); // Reset GST checkbox
    setPrintDialogOpen(true);
  };

  const handlePrintOrder = async () => {
    if (!selectedOrder || !settings || !settings.upiId) {
      alert('No order selected or UPI ID not configured.');
      return;
    }

    let finalTotalAmount = Number(selectedOrder.total_amount);
    let gstAmount = 0;

    if (includeGST && settings.gst) {
      const gstRate = Number(settings.gst);
      gstAmount = finalTotalAmount * (gstRate / 100);
      finalTotalAmount += gstAmount;
    }

    const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
      settings.restaurantName,
    )}&am=${finalTotalAmount}&cu=INR`;

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
            .total-amount { margin-top: 10px; font-weight: bold; }
            .gst { margin-top: 5px; font-style: italic; }
            @media print {
              .qr img { display: block; }
            }
            @media screen and (max-width: 600px) {
              table, th, td { font-size: 12px; padding: 4px; }
              img { max-width: 100px; }
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.restaurantName}</h2>
            <p>Phone: ${settings.phone}</p>
          </div>
          <div class="details">
            <p><strong>Customer:</strong> ${selectedOrder.customer_name}</p>
            <p><strong>Phone:</strong> ${selectedOrder.phone || 'N/A'}</p>
            <p><strong>Payment Method:</strong> ${selectedOrder.payment_method}</p>
          </div>
          <div class="items">
            <h3>Items:</h3>
            <table>
              <tr><th>Name</th><th>Price</th><th>Qty</th><th>Total</th></tr>
              ${selectedOrder.items
                .map(
                  (item) =>
                    `<tr><td>${item.name}</td><td>₹${item.price}</td><td>${item.quantity}</td><td>₹${
                      item.price * item.quantity
                    }</td></tr>`,
                )
                .join('')}
            </table>
            <p class="total-amount"><strong>Subtotal:</strong> ₹${selectedOrder.total_amount}</p>
            ${includeGST && settings.gst ? `<p class="gst"><strong>GST (${settings.gst}%):</strong> ₹${gstAmount.toFixed(2)}</p>` : ''}
            <p class="total-amount"><strong>Total Amount:</strong> ₹${finalTotalAmount.toFixed(2)}</p>
          </div>
          <div class="qr">
            <p>Scan to Pay ₹${finalTotalAmount.toFixed(2)}</p>
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
    setPrintDialogOpen(false);
    setSelectedOrder(null);
  };

  const handlePrintForKitchen = async (order: OrderType) => {
    const printContent = `
      <html>
        <head>
          <title>Kitchen Order</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            h3 { margin-bottom: 20px; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; font-size: 16px; }
            @media screen and (max-width: 600px) {
              body { padding: 10px; }
              h3, li { font-size: 14px; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <h3>Order for: ${order.customer_name}</h3>
          <ul>
            ${order.items
              .map((item) => `<li>${item.name} - Quantity: ${item.quantity}</li>`)
              .join('')}
          </ul>
        </body>
      </html>
    `;

    const newWindow = window.open('', 'Print for Kitchen', 'height=600,width=800');
    if (newWindow) {
      newWindow.document.write(printContent);
      newWindow.document.close();
      newWindow.onload = () => newWindow.print();
    }
  };

  const handleOrderComplete = async (id: number) => {
    const data = { status: 'Completed' };
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${id}`, data, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
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
          Authorization: `Bearer ${localStorage.getItem('employeeLoggedIn')}`,
        },
      });
      setOrders((prev) => {
        const updatedOrders = prev.filter((order) => Number(order.id) !== id);
        aggregateItems(updatedOrders);
        return updatedOrders;
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order.');
    }
  };

  return (
    <Box
      sx={{
        padding: { xs: '10px', sm: '20px', md: '30px' },
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 1 },
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
          Pending Orders
        </Typography>
        <Link to="/employee/addorder" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              fontSize: { xs: '0.8rem', sm: '1rem', md: '1.1rem' },
              padding: { xs: '6px 12px', sm: '8px 16px', md: '10px 20px' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Add Order
          </Button>
        </Link>
      </Box>

      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteId(null)}
            color="primary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmDeleteId && handleDeleteOrder(confirmDeleteId)}
            color="error"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Print Order</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Do you want to include GST in the receipt?
          </DialogContentText>
          <FormControlLabel
            control={
              <Checkbox
                checked={includeGST}
                onChange={(e) => setIncludeGST(e.target.checked)}
                disabled={!settings?.gst}
              />
            }
            label="Include GST"
          />
          {includeGST && settings?.gst && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              GST Rate: {settings.gst}%
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPrintDialogOpen(false)}
            color="primary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePrintOrder}
            color="secondary"
            variant="contained"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          p: { xs: 2, sm: 3, md: 4 },
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
          overflowX: 'auto',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
            mb: { xs: 1, sm: 2 },
          }}
        >
          Total Quantities
        </Typography>
        <Box sx={{ minWidth: { xs: '100%', sm: '300px' } }}>
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
                    p: { xs: '6px', sm: '8px', md: '10px' },
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                  }}
                >
                  Item Name
                </Box>
                <Box
                  component="th"
                  sx={{
                    p: { xs: '6px', sm: '8px', md: '10px' },
                    textAlign: 'center',
                    fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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
                        p: { xs: '6px', sm: '8px', md: '10px' },
                        fontSize: { xs: '0.75rem', sm: '0.85rem', md: '1rem' },
                      }}
                    >
                      {item.name}
                    </Box>
                    <Box
                      component="td"
                      sx={{
                        p: { xs: '6px', sm: '8px', md: '10px' },
                        textAlign: 'center',
                        fontSize: { xs: '0.75rem', sm: '0.85rem', md: '1rem' },
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
                      p: { xs: '15px', sm: '20px' },
                      color: '#888',
                      fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
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

      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
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
                  boxShadow: 1,
                }}
              >
                <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                  >
                    {order.customer_name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                  >
                    Phone: {order.phone || 'N/A'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                  >
                    Payment Method: {order.payment_method}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ mt: 1, fontSize: { xs: '0.9rem', sm: '1.125rem', md: '1.25rem' } }}
                  >
                    Total: ₹{order.total_amount}
                  </Typography>
                  <Divider sx={{ my: { xs: 0.5, sm: 1 } }} />
                  <Typography
                    variant="subtitle1"
                    sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.125rem' } }}
                  >
                    Items:
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    {order.items.map((item) => (
                      <ListItem key={item.id} disableGutters sx={{ p: { xs: 0.5, sm: 1 } }}>
                        <ListItemText
                          primary={`${item.name} - ₹${item.price} x ${item.quantity}`}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
                            noWrap: true,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'stretch', sm: 'center' },
                    gap: { xs: 0.5, sm: 0.5, md: 1 },
                    p: { xs: 1, sm: '8px', md: '12px' },
                    justifyContent: { sm: 'space-between' },
                    borderTop: '1px solid #ddd',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => handleEditOrder(order)}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      py: { xs: 0.5, sm: '6px', md: '8px' },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      width: { xs: '100%', sm: 'auto' },
                      mb: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    onClick={() => handlePrintOrderClick(order)}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      py: { xs: 0.5, sm: '6px', md: '8px' },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      width: { xs: '100%', sm: 'auto' },
                      mb: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Print
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="info"
                    onClick={() => handlePrintForKitchen(order)}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      py: { xs: 0.5, sm: '6px', md: '8px' },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      width: { xs: '100%', sm: 'auto' },
                      mb: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Print for Kitchen
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => handleOrderComplete(order.id)}
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      py: { xs: 0.5, sm: '6px', md: '8px' },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      width: { xs: '100%', sm: 'auto' },
                      mb: { xs: 0.5, sm: 0 },
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
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      py: { xs: 0.5, sm: '6px', md: '8px' },
                      px: { xs: 1, sm: 1.5, md: 2 },
                      width: { xs: '100%', sm: 'auto' },
                      mb: { xs: 0.5, sm: 0 },
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
                py: { xs: 2, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
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
