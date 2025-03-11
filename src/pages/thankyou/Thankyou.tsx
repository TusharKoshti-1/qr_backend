// src/ThankYouForOrder.js
import { Container, Typography,  Box, Paper } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

const ThankYouForOrder = () => {
  const location = useLocation();
  const { payment, total } = location.state || {};

  // Dynamic message with color styling
  const paymentMessage = () => {
    if (payment === 'Cash') {
      return {
        text: `Please pay ₹${total} at the counter.`,
        color: '#ed6c02', // Orange color for cash
        bgcolor: '#fff3e0' // Light orange background
      };
    }
    if (payment === 'Online') {
      return {
        text: `Please go to the counter and scan the QR code to pay ₹${total}.`,
        color: '#1976d2', // Blue color for online
        bgcolor: '#e3f2fd' // Light blue background
      };
    }
    return {
      text: 'You will receive a confirmation and food soon.',
      color: 'textSecondary',
      bgcolor: 'transparent'
    };
  };

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
          padding: 3,
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: '#ffffff',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <CheckCircleOutline color="success" sx={{ fontSize: 60 }} />
        </Box>
        <Typography variant="h3" component="h1" color="primary" gutterBottom>
          Thank You for Your Order!
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          We're excited to prepare your delicious meal. Our team is working hard
          to make sure you have an amazing experience.
        </Typography>
        
        {/* Highlighted Payment Message */}
        <Typography 
          variant="body1" 
          paragraph
          sx={{
            fontWeight: 'bold',
            fontSize: '1.1rem',
            p: 2,
            borderRadius: 1,
            color: paymentMessage().color,
            backgroundColor: paymentMessage().bgcolor,
          }}
        >
          {paymentMessage().text}
        </Typography>
      </Paper>
    </Container>
  );
};

export default ThankYouForOrder;