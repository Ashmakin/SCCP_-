// src/components/IncomingCallModal.jsx
import React from 'react';
import { Modal, Text, Button, Group } from '@mantine/core';

function IncomingCallModal({ opened, callerName, onAccept, onDecline }) {
    return (
        <Modal opened={opened} onClose={onDecline} title="Incoming Assistance Request" centered>
            <Text>{callerName || 'Someone'} is requesting a live AR assistance session.</Text>
            <Group position="right" mt="xl">
                <Button variant="outline" onClick={onDecline}>Decline</Button>
                <Button onClick={onAccept}>Accept</Button>
            </Group>
        </Modal>
    );
}
export default IncomingCallModal;