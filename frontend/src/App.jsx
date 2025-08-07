 

import React, {useEffect, useState} from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Burger, Group, Button, Text, UnstyledButton } from '@mantine/core';
import ARCollaborationPage from './pages/ARCollaborationPage';
import { useNotifications } from './context/NotificationContext'; // 假设这个Context已存在
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import MyProfilePage from './pages/MyProfilePage';
import RfqDetailPage from './pages/RfqDetailPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import NotificationBell from "./components/NotificationBell.jsx";
import IncomingCallModal from "./components/IncomingCallModal.jsx";


function App() {
    const { lastMessage, sendMessage } = useNotifications();
    const [callRequest, setCallRequest] = useState(null);
    const [opened, { toggle }] = useDisclosure();
    const { user, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser();
        navigate('/');
    };

    const linkStyle = { textDecoration: 'none' };

// 监听来自服务器的呼叫请求
    useEffect(() => {
        if (lastMessage && lastMessage.data.startsWith('rtc-call-request|')) {
            const [, senderId, senderName, rfqId] = lastMessage.data.split('|');
            // 确保不是自己呼叫自己
            if (user && user.sub !== parseInt(senderId)) {
                setCallRequest({ senderId: parseInt(senderId), senderName, rfqId });
            }
        }
    }, [lastMessage, user]);

    const handleAcceptCall = () => {
        if (!callRequest) return;
        // 1. 通过WebSocket发送“接受”信号给呼叫方
        sendMessage(`ACCEPT|${callRequest.senderId}`);
        // 2. 作为接听方进入协作页面
        navigate(`/collaboration/rfq/${callRequest.rfqId}?initiate=false&remoteUser=${callRequest.senderId}`);
        setCallRequest(null);
    };

    const handleDeclineCall = () => {
        // 可以在这里通过WebSocket发送一个“拒绝”信号（可选）
        setCallRequest(null);
    };
    const NavLinks = ({ isMobile }) => {
 
        const onLinkClick = isMobile ? toggle : () => {};

        return (
            <>
                {user ? (
                    <>
                        <Link to="/dashboard" style={linkStyle} onClick={onLinkClick}><Button fullWidth={isMobile} variant="subtle">Dashboard</Button></Link>
                        <Link to="/orders" style={linkStyle} onClick={onLinkClick}><Button fullWidth={isMobile} variant="subtle">Orders</Button></Link>
                        <Link to="/profile" style={linkStyle} onClick={onLinkClick}><Button fullWidth={isMobile} variant="subtle">My Profile</Button></Link>

                        {user.is_admin && (
                            <Link to="/admin" style={linkStyle} onClick={onLinkClick}>
                                <Button fullWidth={isMobile} variant="light" color="red">Admin Panel</Button>
                            </Link>
                        )}

                        <Button onClick={handleLogout} variant="outline">Logout</Button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={linkStyle} onClick={onLinkClick}><Button fullWidth={isMobile} variant="default">Login</Button></Link>
                        <Link to="/register" style={linkStyle} onClick={onLinkClick}><Button fullWidth={isMobile} variant="filled">Register</Button></Link>
                    </>
                )}
            </>
        );
    };

    return (
        <>
            {/* 呼叫弹窗 */}
            <IncomingCallModal
                opened={!!callRequest}
                callerName={callRequest?.senderName}
                onAccept={handleAcceptCall}
                onDecline={handleDeclineCall}
            />
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            { }
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <UnstyledButton component={Link} to="/">
                            <Text size="xl" weight={700}
                                  variant="gradient"
                                  gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}>
                                SCCP
                            </Text>
                        </UnstyledButton>
                    </Group>

                    { }
                    <Group visibleFrom="sm">
                        {user ? (
 
                            <Group>
                                <Button component={Link} to="/dashboard" variant="subtle">Dashboard</Button>
                                <Button component={Link} to="/orders" variant="subtle">Orders</Button>
                                <Button component={Link} to="/profile" variant="subtle">My Profile</Button>
                                {user.is_admin && (
                                    <Button component={Link} to="/admin" variant="light" color="red">Admin Panel</Button>
                                )}
                                <NotificationBell />
                                <Button onClick={handleLogout} variant="outline">Logout</Button>
                            </Group>
                        ) : (
 
                            <Group>
                                <Button component={Link} to="/login" variant="default">Login</Button>
                                <Button component={Link} to="/register" variant="filled">Register</Button>
                            </Group>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            { }
            <AppShell.Navbar p="md">
                <Group direction="column" grow>
                    <NavLinks isMobile={true} />
                </Group>
            </AppShell.Navbar>

            { }
            <AppShell.Main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/payment/success" element={ <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute> } />
                    <Route path="/dashboard" element={ <ProtectedRoute><DashboardPage /></ProtectedRoute> } />
                    <Route path="/orders" element={ <ProtectedRoute><OrdersPage /></ProtectedRoute> } />
                    <Route path="/profile" element={ <ProtectedRoute><MyProfilePage /></ProtectedRoute> } />
                    <Route path="/companies/:companyId" element={ <ProtectedRoute><CompanyProfilePage /></ProtectedRoute> } />
                    <Route path="/rfqs/:rfqId" element={ <ProtectedRoute><RfqDetailPage /></ProtectedRoute> } />
                    <Route path="/me" element={ <ProtectedRoute><MyProfilePage /></ProtectedRoute> } />
                    <Route path="/admin" element={ <AdminRoute><AdminPage /></AdminRoute> } />
                    <Route path="/collaboration/rfq/:rfqId" element={<ProtectedRoute><ARCollaborationPage /></ProtectedRoute>} />
                </Routes>
            </AppShell.Main>
        </AppShell>
        </>
    );
}

export default App;