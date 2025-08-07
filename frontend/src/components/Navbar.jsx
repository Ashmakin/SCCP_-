import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppShell,Group, Button, Text, Box } from '@mantine/core';

function Navbar() {
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

 
 
 

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const linkStyle = { textDecoration: 'none' };

    return (
        <AppShell.Header height={60} p="md">
            <Group position="apart" h="100%">
                <Link to="/" style={linkStyle}>
                    <Text size="xl" weight={700}
                          variant="gradient"
                          gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>
                        SCCP
                    </Text>
                </Link>

                <Group spacing="sm" visibleFrom="sm">
                    {user ? (
                        <>
                            <Link to="/dashboard" style={linkStyle}>
                                <Button variant="subtle">Dashboard</Button>
                            </Link>
                            <Link to="/orders" style={linkStyle}>
                                <Button variant="subtle">Orders</Button>
                            </Link>
                            <Link to="/profile" style={linkStyle}>
                                <Button variant="subtle">My Profile</Button>
                            </Link>

                            { }
                            {user.is_admin && (
                                <Link to="/admin" style={linkStyle}>
                                    <Button variant="light" color="red">Admin Panel</Button>
                                </Link>
                            )}

                            <Button onClick={handleLogout} variant="outline">Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={linkStyle}>
                                <Button variant="default">Login</Button>
                            </Link>
                            <Link to="/register" style={linkStyle}>
                                <Button variant="filled">Register</Button>
                            </Link>
                        </>
                    )}
                </Group>

                { }
                <Box hiddenFrom="sm">
                    <Text size="sm" color="dimmed">Menu</Text>
                </Box>
            </Group>
        </AppShell.Header>
    );
}

export default Navbar;