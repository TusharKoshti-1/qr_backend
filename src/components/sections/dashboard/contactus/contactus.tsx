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

  const loadContactData = () => {
    setLoading(true);
    setError(null);

    // Check if the user is an admin (based on localStorage token)
    if (!localStorage.getItem('userLoggedIn')) {
      setError('You must be an admin to view this page.');
    } else {
      // Hardcoded permanent contact data
      const hardcodedData: ContactInfo = {
        email: 'support@qrordering.com',
        phone: '+91 987-654-3210',
        address: '123 Food Street, Mumbai, Maharashtra, India',
        supportHours: 'Monday - Friday, 9:00 AM - 6:00 PM IST',
      };
      setContactData(hardcodedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContactData();
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
