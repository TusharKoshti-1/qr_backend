import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Grid,
  Container,
  Paper,
} from "@mui/material";
import { Add, Remove, Delete, ArrowBack } from "@mui/icons-material";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface LocationState {
  name: string;
  phone: string;
  selectedItems: CartItem[];
  restaurantId: number;
}

const CartPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { name, phone, selectedItems, restaurantId } = (location.state as LocationState) || {};
  const [items, setItems] = useState<CartItem[]>(selectedItems || []);

  useEffect(() => {
    if (!selectedItems || selectedItems.length === 0) {
      navigate("/customerpage");
    }
  }, [selectedItems, navigate]);

  const handleIncreaseQuantity = (item: CartItem) => {
    setItems(
      items.map((selectedItem) =>
        selectedItem.id === item.id
          ? { ...selectedItem, quantity: selectedItem.quantity + 1 }
          : selectedItem
      )
    );
  };

  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity > 1) {
      setItems(
        items.map((selectedItem) =>
          selectedItem.id === item.id
            ? { ...selectedItem, quantity: selectedItem.quantity - 1 }
            : selectedItem
        )
      );
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    setItems(items.filter((selectedItem) => selectedItem.id !== item.id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCashPayment = async () => {
    const total = calculateTotal();
    const data = {customer_name: name,
    phone,
    items,
    total_amount: total,
    payment_method: "Cash",
    restaurantId,};
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/customer/orders`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true',
         },
      });
      alert("Your order has been placed successfully! Please pay with cash at the counter.");
      navigate("/thankyou", { state: { name, phone, items, total, payment: "Cash", restaurantId } });
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  const handleOnlinePayment = async () => {
    const total = calculateTotal();
    const upiLink = generateUpiPaymentLink(total);
    
    // Open UPI apps dialog
    window.open(upiLink, '_blank');
    
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "Please complete the payment in your UPI app and confirm here. " +
      "Don't forget to show the payment confirmation at the counter."
    );

    if (isConfirmed) {
      const upidata = {customer_name: name,
        phone,
        items,
        total_amount: total,
        payment_method: "UPI",
        restaurantId,};
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/customer/orders`, upidata, {
          headers: { 'ngrok-skip-browser-warning': 'true',
           }
        });
        
        navigate("/thankyou", { 
          state: { 
            name, 
            phone, 
            items, 
            total, 
            payment: "UPI",
            restaurantId, 
          } 
        });
      } catch (error) {
        console.error("Error placing order:", error);
        alert("Failed to process payment. Please try again.");
      }
    } else {
      alert("Payment not completed. Please complete the payment to place your order.");
    }
  };

  const generateUpiPaymentLink = (amount: number) => {
    const vpa = 'tusharkoshti001@okicici'; // Replace with your UPI ID
    const transactionNote = `Payment for order from ${name}`;
    
    return `upi://pay?pa=${vpa}&pn=Restaurant%20Name&am=${amount}&tn=${transactionNote}`;
  };

  const handleBack = () => {
    navigate("customerpage", {
      state: { name, phone, selectedItems: items },
    });
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={handleBack} color="primary">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Cart</Typography>
      </Box>

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body1">₹{item.price} x {item.quantity}</Typography>
              </CardContent>
              <CardActions>
                <IconButton color="primary" onClick={() => handleIncreaseQuantity(item)}>
                  <Add />
                </IconButton>
                <IconButton color="secondary" onClick={() => handleDecreaseQuantity(item)}>
                  <Remove />
                </IconButton>
                <IconButton color="error" onClick={() => handleRemoveItem(item)}>
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5">Total Amount: ₹{calculateTotal()}</Typography>

        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            variant="contained"
            color="success"
            onClick={handleCashPayment}
            fullWidth
            sx={{ mr: 1 }}
          >
            Cash Payment
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOnlinePayment}
            fullWidth
            sx={{ ml: 1 }}
          >
            Online Payment
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CartPage;
