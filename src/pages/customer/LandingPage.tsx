import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from "@mui/material";


const LandingPage: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const restaurantId = queryParams.get('restaurant_id');


  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Valid 10-digit phone number
    return phoneRegex.test(phone);
  };

  const handleSubmit = () => {
    if (!name || !phone) {
      alert("Please enter both name and phone number.");
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    // Set session storage to manage session expiration
    const sessionData = {
      name,
      phone,
      timestamp: Date.now(),
    };
    sessionStorage.setItem("userSession", JSON.stringify(sessionData));

    navigate("/customerpage", { state: { name, phone, restaurantId } });
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
      <Paper
        elevation={3}
        sx={{
          padding: "2rem",
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome to Our Restaurant!
        </Typography>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <TextField
            label="Enter Your Name"
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Enter Your Phone Number"
            variant="outlined"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 10 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            size="large"
          >
            Submit
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LandingPage;
