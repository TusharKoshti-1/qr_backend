import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { SyntheticEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import paths, { employeePaths } from 'routes/paths';
import LogoHeader from 'layouts/main-layout/sidebar/LogoHeader';
import IconifyIcon from 'components/base/IconifyIcon';
import PasswordTextField from 'components/common/PasswordTextField';

const checkBoxLabel = { inputProps: { 'aria-label': 'Checkbox' } };

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantId, setRestaurantId] = useState(''); // New state for restaurantId
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    // Validate restaurantId
    if (!restaurantId) {
      setErrorMessage('Please enter a Restaurant ID');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employee/login?restaurant_id=${restaurantId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Store JWT Token in local storage or state
        localStorage.setItem('employeeLoggedIn', data.token);
        // Redirect to the dashboard or any other page
        navigate(employeePaths.order);
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('An error occurred while logging in. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <LogoHeader sx={{ justifyContent: 'center', mb: 5 }} />

      <Paper sx={{ p: 5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="h3">Sign in</Typography>
          <Typography variant="subtitle2" color="neutral.main">
            or{' '}
            <Link href={paths.signup} underline="hover">
              Create an account
            </Link>
          </Typography>
        </Stack>

        {errorMessage && (
          <Typography variant="body2" color="error" align="center" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
        )}

        <Box component="form" sx={{ mt: 3 }} onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              id="restaurantId"
              name="restaurantId"
              type="text"
              placeholder="Enter your Restaurant ID"
              fullWidth
              required
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
            />
            <TextField
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordTextField
              id="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          mt={1}
          spacing={0.5}
        >
          <FormControlLabel
            control={<Checkbox {...checkBoxLabel} color="primary" />}
            label={<Typography variant="subtitle1">Remember me</Typography>}
          />

          <Typography variant="subtitle2" color="primary">
            <Link href="#!" underline="hover">
              Forgot password?
            </Link>
          </Typography>
        </Stack>

        <Button type="submit" size="large" variant="contained" sx={{ mt: 2 }} fullWidth>
          Sign in
        </Button>

        <Divider sx={{ color: 'neutral.main', my: 2 }}>
          <Typography variant="subtitle2"> or sign in with</Typography>
        </Divider>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<IconifyIcon icon="devicon:google" />}
              sx={{ color: 'error.main', borderColor: 'error.main' }}
              fullWidth
            >
              <Typography>Google</Typography>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<IconifyIcon icon="logos:facebook" />}
              sx={{ color: 'primary.light', borderColor: 'primary.light' }}
              fullWidth
            >
              <Typography>Facebook</Typography>
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  </Container>
);
};

export default SignIn;