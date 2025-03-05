import { Container, Typography, Box, Paper } from '@mui/material';
import QrCode from '@mui/icons-material/QrCode';

const ScanQRAgainPage = () => {
  return (
    <Container
      maxWidth="sm"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: '#fafafa',
      }}
    >
      <Paper
        sx={{
          padding: 4,
          textAlign: 'center',
          borderRadius: 3,
          boxShadow: 3,
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ mb: 3, color: 'primary.main' }}>
          <QrCode sx={{ fontSize: 80 }} />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Please Scan QR Code Again
        </Typography>
        
        <Typography variant="h6" color="textSecondary" paragraph sx={{ mt: 2 }}>
          To continue with your order, please scan the QR code available
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: '#fff3e0',
            border: '2px solid #ff9800',
            borderRadius: 2
          }}
        >
          <Typography variant="body1" sx={{ color: '#ef6c00', fontWeight: 'medium' }}>
            Visit the restaurant counter and scan the QR code displayed there 
            to access the full menu and complete your order.
          </Typography>
        </Paper>

        <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
          If you need any assistance, please ask our staff members.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ScanQRAgainPage;