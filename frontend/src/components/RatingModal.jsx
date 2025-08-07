// src/components/RatingModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Stack, Rating, Text } from '@mantine/core';
import * as api from '../api';

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
            alert("Failed to submit rating.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Rate Your Order" centered>
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

export default RatingModal;