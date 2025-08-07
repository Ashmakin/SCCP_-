 
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader, Center } from '@mantine/core';

function AdminRoute({ children }) {
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return <Center style={{ height: '80vh' }}><Loader /></Center>;
    }

 
    if (!user || !user.is_admin) {
 
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;