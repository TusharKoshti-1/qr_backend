// PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import paths from './paths'; // Make sure you import your paths object correctly

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('userLoggedIn'); // Check if the user is authenticated

  // If not authenticated, redirect to sign-in page
  if (!isAuthenticated) {
    return <Navigate to={paths.signin} replace />;
  }

  // If authenticated, render the child component
  return <>{children}</>;
};

export default PrivateRoute;
