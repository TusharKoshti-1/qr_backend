import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import axios, { AxiosError } from 'axios';
import './QRCodePage.css';

interface QRData {
  qrImage: string;
  restaurantName: string;
  address: string;
}

const QRCodePage: React.FC = () => {
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const token = localStorage.getItem('userLoggedIn');
        console.log('Auth token:', token);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/generate-qr`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('API response:', response.data);
        setQrData(response.data);
      } catch (err: unknown) {
        // Use unknown instead of any
        const axiosError = err as AxiosError;
        console.error('Error fetching QR code:', axiosError.response?.data || axiosError.message);
        setError('Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  const handlePrint = () => {
    if (!qrData) {
      setSnackbarMessage('No QR code data available to print.');
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>${qrData.restaurantName} - QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .header { margin-bottom: 20px; }
            .qr { margin-top: 20px; }
            img { max-width: 300px; }
            @media print {
              body { margin: 0; }
              img { display: block; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${qrData.restaurantName}</h2>
            <p>${qrData.address}</p>
          </div>
          <div class="qr">
            <p>Scan to Order</p>
            <img src="${qrData.qrImage}" alt="Restaurant QR Code" onload="window.print()" onerror="alert('Failed to load QR code')" />
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

  const handleShare = async () => {
    if (!qrData) {
      setSnackbarMessage('No QR code data available to share.');
      return;
    }

    console.log('Sharing data:', {
      title: `${qrData.restaurantName} - QR Code`,
      text: `Order from ${qrData.restaurantName} at ${qrData.address}. Scan the QR code to get started!`,
      url: qrData.qrImage,
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${qrData.restaurantName} - QR Code`,
          text: `Order from ${qrData.restaurantName} at ${qrData.address}. Scan the QR code to get started!`,
          url: qrData.qrImage,
        });
        setSnackbarMessage('Shared successfully!');
      } catch (err: unknown) {
        // Use unknown instead of any
        const error = err as Error;
        console.error('Sharing failed:', error.message);
        setSnackbarMessage('Failed to share: ' + (error.message || 'Unknown error'));
      }
    } else {
      try {
        await navigator.clipboard.writeText(qrData.qrImage);
        setSnackbarMessage('QR code URL copied to clipboard!');
      } catch (err: unknown) {
        // Use unknown instead of any
        const error = err as Error;
        console.error('Clipboard copy failed:', error.message);
        setSnackbarMessage('Failed to copy QR code URL: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarMessage(null);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, textAlign: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }} className="no-print">
        <Typography variant="h4" gutterBottom>
          {qrData?.restaurantName}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {qrData?.address}
        </Typography>

        {qrData?.qrImage && (
          <Box sx={{ mt: 4, mb: 4 }}>
            <img
              src={qrData.qrImage}
              alt="Restaurant QR Code"
              style={{
                maxWidth: '300px',
                width: '100%',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
          </Box>
        )}

        <Grid container spacing={2} justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ mr: 2 }}
            >
              Print
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              disabled={!qrData}
            >
              Share
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'none' }} className="print-only">
        {qrData && (
          <>
            <Typography variant="h4" gutterBottom>
              {qrData.restaurantName}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {qrData.address}
            </Typography>
            <Box sx={{ mt: 4, mb: 4 }}>
              <img
                src={qrData.qrImage}
                alt="Restaurant QR Code"
                style={{ maxWidth: '300px', width: '100%' }}
              />
            </Box>
            <Typography variant="body1">Scan to Order</Typography>
          </>
        )}
      </Box>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default QRCodePage;
