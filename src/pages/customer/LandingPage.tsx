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

// Session validation hook (reusable)
const useSessionCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionData = sessionStorage.getItem('userSession');
    if (!sessionData) {
      navigate('/');
      return;
    }

    const session = JSON.parse(sessionData);
    const currentTime = Date.now();
    // 15 minutes = 900,000 milliseconds
    if (currentTime - session.timestamp > 900000) {
      sessionStorage.removeItem('userSession');
      sessionStorage.removeItem('selectedItems');
      navigate('/');
    }
  }, [navigate]);
};

const LandingPage: React.FC = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigate = useNavigate();
  useSessionCheck();

  useEffect(() => {
    if (sessionStorage.getItem('userSession')) {
      navigate('/customerpage');
    }
  }, [navigate]);

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
          Welcome to Our Restaurant!
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