import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  
  // Show loading state if auth is initializing
  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }
  
  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // If roles are required, check user roles
  if (requiredRoles.length > 0) {
    const userRoles = currentUser.roles || [];
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role) || userRoles.includes(`ROLE_${role.toUpperCase()}`)
    );
    
    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      // Redirect to appropriate dashboard based on role
      if (userRoles.includes('ROLE_ADMIN')) {
        return <Navigate to="/dashboard/admin" replace />;
      } else {
        return <Navigate to="/dashboard/user" replace />;
      }
    }
  }

  
  
  // User is authenticated and has required role (if any)
  return children;
};

export default ProtectedRoute;