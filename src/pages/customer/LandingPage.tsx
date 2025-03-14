import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import axios from "axios";

const LandingPage: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Get restaurant_id from query parameters
  const queryParams = new URLSearchParams(location.search);
  const restaurantId = queryParams.get("restaurant_id");

  useEffect(() => {
    // Check if the page is accessed without restaurant_id
    if (!restaurantId) {
      navigate("/error", { replace: true }); // Redirect to an error page
      return;
    }

    // Check if this is a fresh load (not from history)
    const isFreshLoad = performance.navigation.type === 0; // 0 = TYPE_NAVIGATE (fresh load)
    if (!isFreshLoad) {
      navigate("/error", { replace: true }); // Redirect if accessed via history
      return;
    }

    // If user already has a session, redirect to customer page
    if (sessionStorage.getItem("userSession")) {
      navigate("/customerpage", { replace: true });
      return;
    }

    // Fetch restaurant name
    const fetchRestaurantName = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/customer/restaurant-name?restaurant_id=${restaurantId}`
        );
        setRestaurantName(response.data); // Assuming response.data is the name
      } catch (error) {
        console.error("Error fetching restaurant name:", error);
        navigate("/error", { replace: true }); // Redirect on API failure
      }
    };

    fetchRestaurantName();
  }, [navigate, restaurantId]);

  const isValidPhoneNumber = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleSubmit = () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone) {
      alert("Please enter both name and phone number.");
      return;
    }

    if (!isValidPhoneNumber(cleanPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    sessionStorage.setItem(
      "userSession",
      JSON.stringify({
        name: cleanName,
        phone: cleanPhone,
        timestamp: Date.now(),
        restaurantId: restaurantId,
      })
    );
    navigate("/customerpage", { replace: true });
  };

  // If no restaurantId, don't render anything (redirect happens in useEffect)
  if (!restaurantId) {
    return null;
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper elevation={3} sx={{ padding: "2rem", width: "100%", textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          {`Welcome to Our ${restaurantName || "Restaurant"}!`}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TextField
            label="Enter Your Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 50 }}
          />

          <TextField
            label="Enter Your Phone Number"
            variant="outlined"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            fullWidth
            inputProps={{ maxLength: 10 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            size="large"
            fullWidth
          >
            Continue
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LandingPage;