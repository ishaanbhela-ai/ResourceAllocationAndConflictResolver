// FILE: src/utils/RoleRoute.jsx (UPDATED - Enhanced)
// ============================================================
import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If allowedRoles is provided and user role is not in the list
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redirect based on user's role
        if (role === 'ADMIN') {
            return <Navigate to="/admin" replace />;
        } else if (role === 'EMPLOYEE') {
            return <Navigate to="/resources" replace />;
        } else {
            // Unknown role, redirect to login
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default RoleRoute;