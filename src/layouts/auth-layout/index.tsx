import { ReactNode } from 'react';
import { Stack } from '@mui/material';
import { Outlet } from 'react-router-dom';

interface AuthLayoutProps {
  children?: ReactNode; // Optional because you might use it without children
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  localStorage.clear();
  return (
    <Stack justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="neutral.lighter">
      {children || <Outlet />} {/* Render children if provided, otherwise render Outlet */}
    </Stack>
  );
};

export default AuthLayout;
