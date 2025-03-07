import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box, Grid, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import axios from 'axios';
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

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/generate-qr`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
          },
        });
        setQrData(response.data);
      } catch (err) {
        setError('Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (qrData && navigator.share) {
      try {
        await navigator.share({
          title: `${qrData.restaurantName} - QR Code`,
          text: `Visit ${qrData.restaurantName} at ${qrData.address}`,
          url: qrData.qrImage,
        });
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    }
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
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
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
              disabled={!navigator.share}
            >
              Share
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default QRCodePage;
