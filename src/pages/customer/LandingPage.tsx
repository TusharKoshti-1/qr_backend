import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import axios from "axios";


const queryParams = new URLSearchParams(location.search);
const restaurantId = queryParams.get('restaurant_id');

const LandingPage: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('userSession')) {
      navigate('/customerpage');
    }
  }, [navigate]);

  const fetchRestaurantName = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/customer/upiId?restaurant_id=${restaurantId}`);
      setRestaurantName(response.data); // Assuming the response contains the restaurant name directly
    } catch (error) {
      console.error('Error fetching restaurant name:', error);
    }
  };

  fetchRestaurantName();

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

    sessionStorage.setItem("userSession", JSON.stringify({
      name: cleanName,
      phone: cleanPhone,
      timestamp: Date.now(),
      restaurantId: restaurantId,
    }));
    navigate("/customerpage");
  };
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
        {`Welcome to Our ${restaurantName}!`}
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