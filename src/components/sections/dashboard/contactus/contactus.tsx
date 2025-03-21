import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

// Define the type for the contact information
interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  supportHours: string;
}

const ContactUs: React.FC = () => {
  const [contactData, setContactData] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContactData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate an API call to check admin authentication
      await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/check`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}` },
      });

      // Hardcoded contact data (non-changeable)
      const hardcodedData: ContactInfo = {
        email: 'support@qrordering.com',
        phone: '+91 987-654-3210',
        address: '123 Food Street, Mumbai, Maharashtra, India',
        supportHours: 'Monday - Friday, 9:00 AM - 6:00 PM IST',
      };
      setContactData(hardcodedData);
    } catch (error) {
      console.error('Error verifying admin:', error);
      setError('You must be an admin to view this page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Contact Us
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : contactData ? (
          <>
            <Typography variant="h6" gutterBottom>
              Our Contact Information
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
              Reach out to us for any inquiries or support.
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Field</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Details</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">{contactData.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">{contactData.phone}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell align="right">{contactData.address}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Support Hours</TableCell>
                    <TableCell align="right">{contactData.supportHours}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Information last updated: {new Date().toLocaleString()}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography align="center">No contact information available.</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ContactUs;
