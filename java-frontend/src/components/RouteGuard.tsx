import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireAdmin?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requireVerified = false, 
  requireAdmin = false 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !user?.verified) {
    return <Navigate to="/verify" replace />;
  }

  if (requireAdmin && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;