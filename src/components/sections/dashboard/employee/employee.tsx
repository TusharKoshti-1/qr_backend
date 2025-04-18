import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
} from '@mui/material';

interface EmployeeType {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get<EmployeeType[]>(
          `${import.meta.env.VITE_API_URL}/api/employees`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
              Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
            },
          },
        );
        setEmployees(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleDeleteEmployee = async (id: number) => {
    setConfirmDeleteId(null);
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/employees/${id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          Authorization: `Bearer ${localStorage.getItem('userLoggedIn')}`,
        },
      });
      setEmployees(employees.filter((employee) => employee.id !== id));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const token = localStorage.getItem('userLoggedIn');
  let restaurantId = null;

  if (token) {
    const decoded = jwtDecode<JwtPayload & { id: string }>(token);
    restaurantId = decoded.id; // Adjust this key based on your token structure
  }

  return (
    <Box
      sx={{
        padding: { xs: '10px', sm: '20px', md: '30px' },
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 3 },
          gap: { xs: 2, sm: 1 },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            Employees
          </Typography>
          {restaurantId && (
            <Typography
              variant="body1"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }, mt: 1 }}
            >
              Restaurant ID: {restaurantId}
            </Typography>
          )}
        </Box>
        <Link to="/addemployee" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              fontSize: { xs: '0.8rem', sm: '1rem', md: '1.1rem' },
              padding: { xs: '6px 12px', sm: '8px 16px', md: '10px 20px' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            Add Employee
          </Button>
        </Link>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 1,
                  }}
                >
                  <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
                    >
                      {employee.username}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                    >
                      Email: {employee.email}
                    </Typography>
                    {employee.created_at && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
                      >
                        Joined: {new Date(employee.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions
                    sx={{
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: { xs: 0.5, sm: 0.5, md: 1 },
                      p: { xs: 1, sm: '8px', md: '12px' },
                      justifyContent: { sm: 'flex-end' },
                      borderTop: '1px solid #ddd',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={() => setConfirmDeleteId(employee.id)}
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                        py: { xs: 0.5, sm: '6px', md: '8px' },
                        px: { xs: 1, sm: 1.5, md: 2 },
                        width: { xs: '100%', sm: 'auto' },
                        mb: { xs: 0.5, sm: 0 },
                      }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{
                  textAlign: 'center',
                  color: '#888',
                  py: { xs: 2, sm: 4 },
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                }}
              >
                No employees available.
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Are you sure you want to delete this employee? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteId(null)}
            color="primary"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => confirmDeleteId && handleDeleteEmployee(confirmDeleteId)}
            color="error"
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
