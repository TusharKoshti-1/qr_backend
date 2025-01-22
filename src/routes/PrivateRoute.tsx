import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import paths from './paths';

interface PrivateRouteProps {
  children: ReactNode;
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
