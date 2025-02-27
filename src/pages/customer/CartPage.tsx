import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<{
    name: string;
    phone: string;
    restaurantId: number;
  }>(() => {
    const savedSession = sessionStorage.getItem("userSession");
    return savedSession
      ? JSON.parse(savedSession)
      : { name: "", phone: "", restaurantId: 0 };
  });

  useEffect(() => {
    const verifySession = () => {
      const sessionData = sessionStorage.getItem("userSession");
      if (!sessionData) {
        navigate("/welcome");
        return;
      }

      const { timestamp, ...session } = JSON.parse(sessionData);
      const currentTime = Date.now();
      const sessionAge = currentTime - timestamp;

      if (sessionAge > 10 * 60 * 1000) {
        sessionStorage.removeItem("userSession");
        sessionStorage.removeItem("selectedItems");
        navigate("/welcome");
        return;
      }

      setSession(session);
      const savedItems = JSON.parse(
        sessionStorage.getItem("selectedItems") || "[]"
      );
      setItems(savedItems);

      // Set auto-logout timer
      const timeLeft = 10 * 60 * 1000 - sessionAge;
      const timeout = setTimeout(() => {
        sessionStorage.removeItem("userSession");
        sessionStorage.removeItem("selectedItems");
        navigate("/welcome");
      }, timeLeft);

      return () => clearTimeout(timeout);
    };

    verifySession();
  }, [navigate]);

// Remove the empty cart redirect useEffect and replace with:
  useEffect(() => {
  const savedItems = sessionStorage.getItem("selectedItems");
  if (!savedItems || JSON.parse(savedItems).length === 0) {
    navigate("/customerpage");
  }
}, [navigate]);

  useEffect(() => {
    sessionStorage.setItem("selectedItems", JSON.stringify(items));
  }, [items]);

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
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/customer/orders`,
        {
          restaurant_id: session.restaurantId,
          customer_name: session.name,
          phone: session.phone,
          items,
          total_amount: total,
          payment_method: "Cash",
        },
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );

      sessionStorage.removeItem("userSession");
      sessionStorage.removeItem("selectedItems");
      navigate("/thankyou", {
        state: {
          payment: "Cash",
          restaurant_id: session.restaurantId,
        },
      });
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  const handleOnlinePayment = async () => {
    const total = calculateTotal();
    const upiLink = generateUpiPaymentLink(total);

    window.open(upiLink, "_blank");
    const isConfirmed = window.confirm(
      "Please complete the payment in your UPI app and confirm here. " +
        "Don't forget to show the payment confirmation at the counter."
    );

    if (isConfirmed) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/customer/orders`,
          {
            restaurant_id: session.restaurantId,
            customer_name: session.name,
            phone: session.phone,
            items,
            total_amount: total,
            payment_method: "UPI",
          },
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          }
        );

        sessionStorage.removeItem("userSession");
        sessionStorage.removeItem("selectedItems");
        navigate("/thankyou", {
          state: {
            payment: "UPI",
            restaurant_id: session.restaurantId,
          },
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
    const vpa = "tusharkoshti001@okicici";
    const transactionNote = `Payment for order from ${session.name}`;
    return `upi://pay?pa=${vpa}&pn=Restaurant%20Name&am=${amount}&tn=${transactionNote}`;
  };

  const handleBack = () => {
    sessionStorage.setItem("selectedItems", JSON.stringify(items));
    navigate("/customerpage");
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
                <Typography variant="body1">
                  ₹{item.price} x {item.quantity}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  color="primary"
                  onClick={() => handleIncreaseQuantity(item)}
                >
                  <Add />
                </IconButton>
                <IconButton
                  color="secondary"
                  onClick={() => handleDecreaseQuantity(item)}
                >
                  <Remove />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(item)}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography variant="h5">
          Total Amount: ₹{calculateTotal()}
        </Typography>

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