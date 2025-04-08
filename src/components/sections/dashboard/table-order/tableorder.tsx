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
  CircularProgress,
  Checkbox,
  FormControlLabel,
  useTheme,
  useMediaQuery,
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
  section_id: number;
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
  gst?: number; // GST rate, optional
}

const TableOrdersPage: React.FC = () => {
  const [tables, setTables] = useState<TableType[]>([]);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSectionId, setNewTableSectionId] = useState<number | ''>('');
  const [newSectionName, setNewSectionName] = useState('');
  const [includeGST, setIncludeGST] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const connectWebSocket = () => {
    const ws = new WebSocket('wss://qr-system-v1pa.onrender.com');

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', JSON.stringify(data, null, 2));

        if (data.type === 'new_table') {
          setTables((prev) => [...prev, data.table]);
        } else if (data.type === 'update_table') {
          setTables((prev) =>
            prev.map((t) => (t.id === data.table.id ? { ...t, ...data.table } : t)),
          );
        } else if (data.type === 'delete_table') {
          setTables((prevTables) => prevTables.filter((t) => t.id !== data.id));
          setOrders((prevOrders) =>
            prevOrders.filter(
              (o) => o.table_number !== data.table_number || o.section_id !== data.section_id,
            ),
          );
        } else if (data.type === 'new_section') {
          setSections((prev) => [...prev, data.section]);
          if (!newTableSectionId) {
            setNewTableSectionId(data.section.id);
          }
        } else if (data.type === 'delete_section') {
          setSections((prev) => prev.filter((s) => s.id !== data.id));
          setTables((prev) => prev.filter((t) => t.section_id !== data.id));
          if (newTableSectionId === data.id && sections.length > 0) {
            setNewTableSectionId(sections[0].id);
          }
        } else if (data.type === 'new_table_order') {
          setOrders((prev) => [
            {
              ...data.order,
              items: Array.isArray(data.order.items)
                ? data.order.items
                : JSON.parse(data.order.items || '[]'),
            },
            ...prev,
          ]);
          setTables((prev) =>
            prev.map((t) =>
              t.table_number === data.order.table_number && t.section_id === data.order.section_id
                ? { ...t, status: 'occupied' }
                : t,
            ),
          );
        } else if (data.type === 'update_table_order') {
          console.log('Processing update_table_order:', JSON.stringify(data.order, null, 2));
          if (!data.order.id) {
            console.error('Missing order ID in update_table_order');
            return;
          }
          const orderId = Number(data.order.id);
          setOrders((prev) => {
            const orderToUpdate = prev.find((order) => order.id === orderId);
            if (!orderToUpdate) {
              console.warn(`Order ID ${orderId} not found in current orders`);
              return prev;
            }
            let updatedItems: ItemType[];
            try {
              updatedItems = Array.isArray(data.order.items)
                ? data.order.items
                : typeof data.order.items === 'string'
                  ? JSON.parse(data.order.items)
                  : orderToUpdate.items;
            } catch (e) {
              console.error('Error parsing items in update_table_order:', e, data.order.items);
              updatedItems = orderToUpdate.items;
            }
            const updatedOrders = prev
              .map((order) =>
                order.id === orderId
                  ? {
                      ...order,
                      ...data.order,
                      section_id: data.order.section_id
                        ? Number(data.order.section_id)
                        : order.section_id,
                      table_number: data.order.table_number || order.table_number,
                      items: updatedItems,
                    }
                  : order,
              )
              .filter((order) => order.status !== 'Completed');
            console.log('Updated orders after update_table_order:', updatedOrders);
            return [...updatedOrders];
          });
          if (data.order.table_number && data.order.section_id) {
            const orderSectionId = Number(data.order.section_id);
            const orderTableNumber = data.order.table_number.toString();
            setTables((prev) =>
              prev.map((t) =>
                t.table_number === orderTableNumber && t.section_id === orderSectionId
                  ? {
                      ...t,
                      status: data.order.status === 'Pending' ? 'occupied' : 'empty',
                    }
                  : t,
              ),
            );
          }
        } else if (data.type === 'delete_table_order') {
          setOrders((prev) => prev.filter((order) => order.id !== Number(data.id)));
          setTables((prev) =>
            prev.map((t) =>
              t.table_number === data.order?.table_number && t.section_id === data.order?.section_id
                ? { ...t, status: 'empty' }
                : t,
            ),
          );
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed. Attempting to reconnect...');
      setTimeout(connectWebSocket, 2000);
    };

    return ws;
  };

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
        setOrders(
          ordersRes.data
            .filter((order) => order.table_number !== null)
            .map((order) => {
              let parsedItems: ItemType[] = [];
              try {
                parsedItems =
                  typeof order.items === 'string'
                    ? JSON.parse(order.items)
                    : Array.isArray(order.items)
                      ? order.items
                      : [];
              } catch (error) {
                console.error('Error parsing order items:', error, order);
                parsedItems = [];
              }
              return { ...order, items: parsedItems };
            }),
        );
        setSettings(settingsRes.data);
        if (sectionsRes.data.length > 0) {
          setNewTableSectionId(sectionsRes.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      }
    };

    fetchData();

    const ws = connectWebSocket();
    return () => ws.close();
  }, []);

  const getTableStatusColor = (table: TableType) => {
    const order = orders.find(
      (o) => o.table_number === table.table_number && o.section_id === table.section_id,
    );
    if (!order || order.status === 'Completed') {
      return '#d4edda';
    }
    return '#fff3cd';
  };

  const handleTableClick = (tableNumber: string, sectionId: number) => {
    setSelectedTable(tableNumber);
    setSelectedSectionId(sectionId);
    setDialogOpen(true);
    setIncludeGST(false);
  };

  const handleAddTable = async () => {
    if (!newTableNumber || newTableSectionId === '') {
      alert('Please enter a table number and select a section');
      return;
    }
    try {
      setIsLoading(true);
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
      setError(null);
    } catch (error) {
      console.error('Error adding table:', error);
      setError(error.response?.data?.message || 'Failed to add table');
      alert(error.response?.data?.message || 'Failed to add table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName) {
      alert('Please enter a section name');
      return;
    }
    try {
      setIsLoading(true);
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
      setError(null);
    } catch (error) {
      console.error('Error adding section:', error);
      setError(error.response?.data?.message || 'Failed to add section');
      alert(error.response?.data?.message || 'Failed to add section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    const table = tables.find(
      (t) => t.table_number === selectedTable && t.section_id === selectedSectionId,
    );
    if (!table) return;

    try {
      setIsLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tables/${table.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setTables((prevTables) => {
        const updatedTables = prevTables.filter((t) => t.id !== table.id);
        setOrders((prevOrders) =>
          prevOrders.filter(
            (o) => !(o.table_number === table.table_number && o.section_id === table.section_id),
          ),
        );
        return updatedTables;
      });
      setDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error deleting table:', error);
      setError(error.response?.data?.message || 'Failed to delete table');
      alert(error.response?.data?.message || 'Failed to delete table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section? All tables in it will be deleted.'))
      return;

    try {
      setIsLoading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/sections/${sectionId}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      if (response.status === 204) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        setTables((prev) => prev.filter((t) => t.section_id !== sectionId));
        setOrders((prev) => prev.filter((o) => o.section_id !== sectionId));
        setError(null);
        alert('Section deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete section';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrder = () => {
    setDialogOpen(false);
    navigate('/addtableorder', {
      state: { table_number: selectedTable, section_id: selectedSectionId },
    });
  };

  const handleEditOrder = () => {
    const order = orders.find(
      (o) =>
        o.table_number === selectedTable &&
        o.section_id === selectedSectionId &&
        o.status === 'Pending',
    );
    setDialogOpen(false);
    if (order) navigate('/edittableorder', { state: { order } });
  };

  const handlePrintOrder = async () => {
    const order = orders.find(
      (o) =>
        o.table_number === selectedTable &&
        o.section_id === selectedSectionId &&
        o.status === 'Pending',
    );
    if (!order || !settings || !settings.upiId) {
      alert('No pending order found or UPI ID not configured.');
      return;
    }

    // Ensure total_amount is a number
    let finalTotalAmount = Number(order.total_amount);
    let gstAmount = 0;

    if (includeGST && settings.gst) {
      // Ensure settings.gst is a number
      const gstRate = Number(settings.gst);
      gstAmount = finalTotalAmount * (gstRate / 100);
      finalTotalAmount += gstAmount;
    }

    const upiLink = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(
      settings.restaurantName,
    )}&am=${finalTotalAmount}&cu=INR`;

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
            .gst { margin-top: 5px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.restaurantName}</h2>
            <p>Phone: ${settings.phone}</p>
          </div>
          <div class="items">
            <h3>Table ${order.table_number} (${tables.find((t) => t.table_number === selectedTable && t.section_id === selectedSectionId)?.section}) Items:</h3>
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
            <p class="total-amount"><strong>Subtotal:</strong> ₹${order.total_amount}</p>
            ${includeGST && settings.gst ? `<p class="gst"><strong>GST (${settings.gst}%):</strong> ₹${gstAmount.toFixed(2)}</p>` : ''}
            <p class="total-amount"><strong>Total Amount:</strong> ₹${finalTotalAmount.toFixed(2)}</p>
          </div>
          <div class="qr">
            <p>Scan to Pay ₹${finalTotalAmount.toFixed(2)}</p>
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

  const handlePrintForKitchen = async () => {
    const order = orders.find(
      (o) =>
        o.table_number === selectedTable &&
        o.section_id === selectedSectionId &&
        o.status === 'Pending',
    );
    if (!order) {
      alert('No pending order found.');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Kitchen Order</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            h3 { margin-bottom: 20px; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; font-size: 16px; }
          </style>
        </head>
        <body onload="window.print()">
          <h3>Table ${order.table_number}</h3>
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
    setDialogOpen(false);
  };

  const handleCompleteOrder = async () => {
    const order = orders.find(
      (o) =>
        o.table_number === selectedTable &&
        o.section_id === selectedSectionId &&
        o.status === 'Pending',
    );
    const table = tables.find(
      (t) => t.table_number === selectedTable && t.section_id === selectedSectionId,
    );
    if (!order || !table) return;

    try {
      setIsLoading(true);
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
        { status: 'empty', section_id: table.section_id },
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        },
      );

      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: 'empty' } : t)));
      setDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error completing table order:', error);
      setError(error.response?.data?.message || 'Failed to complete order');
      alert(error.response?.data?.message || 'Failed to complete order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    const order = orders.find(
      (o) =>
        o.table_number === selectedTable &&
        o.section_id === selectedSectionId &&
        o.status === 'Pending',
    );
    const table = tables.find(
      (t) => t.table_number === selectedTable && t.section_id === selectedSectionId,
    );
    if (!order || !table) return;

    try {
      setIsLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/tableorder/${order.id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });

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
      setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: 'empty' } : t)));
      setDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error deleting table order:', error);
      setError(error.response?.data?.message || 'Failed to delete order');
      alert(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        padding: { xs: 1, sm: 2, md: 3, lg: 4 },
        maxWidth: '100%',
        margin: '0 auto',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {error && (
        <Typography
          color="error"
          sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' }, textAlign: 'center' }}
        >
          {error}
        </Typography>
      )}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem', lg: '2.125rem' },
            fontWeight: 'bold',
          }}
        >
          Table Management
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddTableDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 100 } }}
            disabled={isLoading}
          >
            Add Table
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setAddSectionDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 100 } }}
            disabled={isLoading}
          >
            Add Section
          </Button>
        </Box>
      </Box>

      {sections.map((section) => (
        <Box key={section.id} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              mb: { xs: 1, sm: 2 },
              gap: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}
            >
              {section.name}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleDeleteSection(section.id)}
              disabled={isLoading}
            >
              Delete Section
            </Button>
          </Box>
          <Grid
            container
            spacing={{ xs: 1, sm: 2, md: 3 }}
            justifyContent={{ xs: 'flex-start', sm: 'center' }}
          >
            {tables
              .filter((table) => table.section_id === section.id)
              .map((table) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={table.id}>
                  <Card
                    sx={{
                      backgroundColor: getTableStatusColor(table),
                      cursor: 'pointer',
                      '&:hover': { boxShadow: { sm: 6 } },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'box-shadow 0.3s ease',
                    }}
                    onClick={() => handleTableClick(table.table_number, table.section_id)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: { xs: 1, sm: 2 } }}>
                      <Typography
                        variant="h6"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}
                      >
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paper': { m: { xs: 0, sm: 2 } } }}
        key={JSON.stringify(
          orders.find(
            (o) => o.table_number === selectedTable && o.section_id === selectedSectionId,
          ),
        )}
      >
        <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, p: { xs: 1, sm: 2 } }}>
          Manage Table {selectedTable} (
          {
            tables.find(
              (t) => t.table_number === selectedTable && t.section_id === selectedSectionId,
            )?.section
          }
          )
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {(() => {
            const selectedOrder = orders.find(
              (o) =>
                o.table_number === selectedTable &&
                o.section_id === selectedSectionId &&
                o.status === 'Pending',
            );
            if (!selectedOrder) {
              return <Typography>No active order for this table.</Typography>;
            }
            return (
              <Box>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Order Details:
                </Typography>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <Typography
                      key={item.id}
                      variant="body1"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {item.name} - ₹{item.price} x {item.quantity}
                    </Typography>
                  ))
                ) : (
                  <Typography variant="body1">No items in this order.</Typography>
                )}
                <Typography
                  variant="h6"
                  sx={{ mt: 1, fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' } }}
                >
                  Subtotal: ₹{selectedOrder.total_amount}
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeGST}
                      onChange={(e) => setIncludeGST(e.target.checked)}
                      disabled={isLoading || !settings?.gst}
                    />
                  }
                  label="Include GST"
                  sx={{ mt: 1 }}
                />
                {includeGST && settings?.gst && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    GST Rate: {settings.gst}%
                  </Typography>
                )}
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions
          sx={{
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: { xs: 'center', sm: 'flex-end' },
            p: { xs: 1, sm: 2 },
          }}
        >
          {!orders.find(
            (o) =>
              o.table_number === selectedTable &&
              o.section_id === selectedSectionId &&
              o.status === 'Pending',
          ) ? (
            <>
              <Button
                onClick={handleAddOrder}
                color="primary"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Add Order
              </Button>
              <Button
                onClick={handleDeleteTable}
                color="error"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Delete Table
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleEditOrder}
                color="primary"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Edit Order
              </Button>
              <Button
                onClick={handlePrintOrder}
                color="secondary"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Print
              </Button>
              <Button
                onClick={handlePrintForKitchen}
                color="info"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Print for Kitchen
              </Button>
              <Button
                onClick={handleCompleteOrder}
                color="success"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Complete
              </Button>
              <Button
                onClick={handleDeleteOrder}
                color="error"
                variant="contained"
                size="small"
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Delete Order
              </Button>
            </>
          )}
          <Button
            onClick={() => setDialogOpen(false)}
            color="inherit"
            variant="outlined"
            size="small"
            disabled={isLoading}
            fullWidth={isMobile}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addTableDialogOpen}
        onClose={() => setAddTableDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paper': { m: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Add New Table</DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TextField
            autoFocus
            margin="dense"
            label="Table Number"
            type="text"
            fullWidth
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Section</InputLabel>
            <Select
              value={newTableSectionId}
              onChange={(e) => setNewTableSectionId(e.target.value as number)}
              label="Section"
              disabled={isLoading}
            >
              {sections.map((section) => (
                <MenuItem key={section.id} value={section.id}>
                  {section.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: { xs: 1, sm: 2 } }}>
          <Button onClick={() => setAddTableDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAddTable} color="primary" variant="contained" disabled={isLoading}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addSectionDialogOpen}
        onClose={() => setAddSectionDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
        sx={{ '& .MuiDialog-paper': { m: { xs: 0, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Add New Section</DialogTitle>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            type="text"
            fullWidth
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: { xs: 1, sm: 2 } }}>
          <Button onClick={() => setAddSectionDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSection}
            color="primary"
            variant="contained"
            disabled={isLoading}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableOrdersPage;
