// src/ThankYouForOrder.js
import { Container, Typography,  Box, Paper } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import { useLocation } from 'react-router-dom'; // Add this import


const ThankYouForOrder = () => {
  const location = useLocation();
  const { payment, total } = location.state || {}; // Get payment details

  // Dynamic message based on payment method
  const paymentMessage = payment === 'Cash' 
    ? `Please pay ₹${total} at the counter.`
    : payment === 'Online'
    ? `Please go to the counter and scan the QR code to pay ₹${total}.`
    : 'You will receive a confirmation and food soon.';
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
        <Typography variant="body1" color="textSecondary" paragraph>
          {paymentMessage}
        </Typography>
      </Paper>
    </Container>
  );
};

export default ThankYouForOrder;
