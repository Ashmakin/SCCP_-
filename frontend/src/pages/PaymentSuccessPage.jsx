 

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Title, Text, Button, Container, Paper } from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';

function PaymentSuccessPage() {
 
 
    useEffect(() => {
 
 
    }, []);

    return (
        <Container size="sm" mt={50}>
            <Paper withBorder shadow="md" p={30} radius="md" style={{ textAlign: 'center' }}>
                <IconCircleCheck size={80} color="teal" style={{ margin: 'auto' }} />
                <Title order={2} mt="lg">Payment Successful!</Title>
                <Text color="dimmed" mt="sm">
                    Thank you for your payment. Your order is now being processed. You can view the updated status in your orders list.
                </Text>
                <Button component={Link} to="/orders" mt="xl" size="md">
                    View Your Orders
                </Button>
            </Paper>
        </Container>
    );
}

export default PaymentSuccessPage;