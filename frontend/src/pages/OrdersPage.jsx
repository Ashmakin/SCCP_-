import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import { useStripe } from '@stripe/react-stripe-js';
import { useDisclosure } from '@mantine/hooks';

// 导入所有需要的Mantine组件
import {
    Table,
    Select,
    Title,
    Text,
    Paper,
    Alert,
    Button,
    Badge,
    Group,
    Center,
    Modal,
    Stack,
    Rating,
} from '@mantine/core';
import { IconAlertCircle, IconPackage } from '@tabler/icons-react';

/**
 * 评级模态框子组件
 */
function RatingModal({ orderId, opened, onClose, onRated }) {
    const [qualityRating, setQualityRating] = useState(0);
    const [communicationRating, setCommunicationRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (qualityRating === 0 || communicationRating === 0) {
            alert("Please provide a rating for both categories.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.rateOrder(orderId, {
                quality_rating: qualityRating,
                communication_rating: communicationRating,
            });
            alert("Thank you for your feedback!");
            onRated(); // 通知父组件刷新
            onClose();  // 关闭模态框
        } catch (error) {
            console.error("Failed to submit rating", error);
            alert("Failed to submit rating. This order may have already been rated.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 在关闭模态框时重置评分
    const handleClose = () => {
        setQualityRating(0);
        setCommunicationRating(0);
        onClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Rate Your Order" centered>
            <Stack>
                <div>
                    <Text fw={500}>Quality of Parts</Text>
                    <Rating value={qualityRating} onChange={setQualityRating} size="lg" />
                </div>
                <div>
                    <Text fw={500}>Communication & Service</Text>
                    <Rating value={communicationRating} onChange={setCommunicationRating} size="lg" />
                </div>
                <Button onClick={handleSubmit} loading={isSubmitting} mt="md">
                    Submit Rating
                </Button>
            </Stack>
        </Modal>
    );
}


/**
 * 主订单页面组件
 */
function OrdersPage() {
    const { user } = useAuth();
    const stripe = useStripe();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // 控制评级模态框的状态
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.getOrders();
            setOrders(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } catch (err) {
            console.error("Failed to fetch orders", err);
            setError("Could not load orders.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.updateOrderStatus(orderId, newStatus);
            alert('Order status updated!');
            fetchOrders();
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update status.');
        }
    };

    const handlePayNow = async (orderId) => {
        if (!stripe) {
            alert("Payment system is not ready, please try again in a moment.");
            return;
        }
        try {
            const response = await api.createCheckoutSession(orderId);
            const { session_id } = response.data;
            const { error } = await stripe.redirectToCheckout({ sessionId: session_id });
            if (error) {
                alert(`Payment failed: ${error.message}`);
            }
        } catch (err) {
            alert("Could not initiate payment. Please try again.");
        }
    };

    const handleOpenRatingModal = (orderId) => {
        setSelectedOrderId(orderId);
        open();
    };

    if (isLoading) return <div>Loading orders...</div>;

    const OrderStatusSelector = ({ order }) => (
        <Select
            value={order.status}
            onChange={(value) => handleStatusChange(order.id, value)}
            disabled={order.status === 'COMPLETED' || order.status === 'SHIPPED'}
            data={[
                { value: 'PENDING_CONFIRMATION', label: 'Pending Confirmation', disabled: true },
                { value: 'IN_PRODUCTION', label: 'In Production' },
                { value: 'SHIPPED', label: 'Shipped' },
                { value: 'COMPLETED', label: 'Completed' },
            ]}
        />
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'teal';
            case 'SHIPPED': return 'yellow';
            case 'IN_PRODUCTION': return 'blue';
            default: return 'gray';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'teal';
            case 'UNPAID': return 'orange';
            default: return 'gray';
        }
    };

    const rows = orders.map(order => {
        const canBeRated = user.company_type === 'BUYER' &&
            order.status === 'COMPLETED' &&
            order.quality_rating === null;

        return (
            <Table.Tr key={order.id}>
                <Table.Td>#{order.id}</Table.Td>
                <Table.Td><Text fw={500}>{order.rfq_title}</Text></Table.Td>
                <Table.Td><Text size="sm">{user.company_type === 'BUYER' ? order.supplier_name : order.buyer_name}</Text></Table.Td>
                <Table.Td style={{ textAlign: 'right' }}><Text fw={500}>${parseFloat(order.total_amount).toLocaleString()}</Text></Table.Td>
                <Table.Td><Badge color={getStatusColor(order.status)} variant="light">{order.status}</Badge></Table.Td>
                <Table.Td><Badge color={getPaymentStatusColor(order.payment_status)} variant="light">{order.payment_status}</Badge></Table.Td>
                <Table.Td>
                    {canBeRated && (
                        <Button size="xs" variant="outline" onClick={() => handleOpenRatingModal(order.id)}>
                            Rate Order
                        </Button>
                    )}
                    {user.company_type === 'BUYER' && order.payment_status === 'UNPAID' && (
                        <Button onClick={() => handlePayNow(order.id)} size="xs">
                            Pay Now
                        </Button>
                    )}
                    {user.company_type === 'SUPPLIER' && <OrderStatusSelector order={order} />}
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <div>
            <RatingModal
                orderId={selectedOrderId}
                opened={opened}
                onClose={close}
                onRated={fetchOrders}
            />

            <Title order={1} mb="xs">My Orders</Title>
            <Text mb="xl" c="dimmed">Here you can find all the purchase orders associated with your company.</Text>

            {error && (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red">
                    {error}
                </Alert>
            )}

            <Paper withBorder shadow="sm" radius="md">
                <Table.ScrollContainer minWidth={800}>
                    <Table striped highlightOnHover verticalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Order ID</Table.Th>
                                <Table.Th>RFQ Title</Table.Th>
                                <Table.Th>{user.company_type === 'BUYER' ? 'Supplier' : 'Buyer'}</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Amount</Table.Th>
                                <Table.Th>Order Status</Table.Th>
                                <Table.Th>Payment Status</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {rows.length > 0 ? rows : (
                                <Table.Tr>
                                    <Table.Td colSpan={7}>
                                        <Center p="xl">
                                            <Group>
                                                <IconPackage size={40} stroke={1.5} color='gray' />
                                                <Text c="dimmed">No orders found.</Text>
                                            </Group>
                                        </Center>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Paper>
        </div>
    );
}

export default OrdersPage;
