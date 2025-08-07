 

import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import * as api from '../api';
import { Paper, Text, TextInput, Button, Group, ScrollArea, Title, Center, Loader } from '@mantine/core';
import { ReadyState } from 'react-use-websocket';

function ChatBox({ rfqId }) {
    const [messageHistory, setMessageHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const scrollAreaRef = useRef(null);

 
    const { readyState, lastMessage, joinRoom, leaveRoom, sendChatMessage } = useNotifications();

 
    useEffect(() => {
        if (rfqId) {
            setIsLoadingHistory(true);
            api.getChatHistory(rfqId)
                .then(response => {
 
                    setMessageHistory(Array.isArray(response.data) ? response.data : []);
                })
                .catch(err => {
                    console.error("Failed to fetch chat history:", err);
                    setMessageHistory([]); 
                })
                .finally(() => setIsLoadingHistory(false));
        }
    }, [rfqId]);

 
    useEffect(() => {
        if (rfqId && readyState === ReadyState.OPEN) {
            joinRoom(rfqId);
        }
 
        return () => {
            if (rfqId && readyState === ReadyState.OPEN) {
                leaveRoom(rfqId);
            }
        };
    }, [rfqId, readyState, joinRoom, leaveRoom]);

 
    useEffect(() => {
        if (lastMessage !== null) {
            const messageData = lastMessage.data;
 
            if (messageData.startsWith("chat|")) {
                const content = messageData.substring(5); 

                const newLiveMessage = {
                    id: Date.now(), 
                    isLive: true,
 
                    message_text: content,
                };
 
                setMessageHistory(prev => [...prev, newLiveMessage]);
            }
        }
    }, [lastMessage]);

 
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ y: scrollAreaRef.current.scrollHeight });
        }
    }, [messageHistory]);


    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
 
            sendChatMessage(rfqId, message);
            setMessage('');
        }
    };

    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    return (
        <Paper withBorder p="md" radius="md" mt="xl">
            <Group position="apart" mb="md">
                <Title order={4}>RFQ Chat Room</Title>
                <Text size="xs" color="dimmed">Status: {connectionStatus}</Text>
            </Group>
            <ScrollArea h={300} style={{ border: '1px solid #eee', borderRadius: '4px' }} viewportRef={scrollAreaRef}>
                <div style={{padding: '0.5rem'}}>
                    {isLoadingHistory ? <Center><Loader size="sm" /></Center> :
                        messageHistory.length === 0 ? <Text c="dimmed" ta="center" p="md">No messages yet. Start the conversation!</Text> :
                            messageHistory.map(msg => (
                                <div key={msg.id} style={{marginBottom: '0.5rem'}}>
                                    <Text size="sm">
                                        {msg.isLive ?
 
                                            msg.message_text
                                            :
 
                                            <><strong>{msg.user_full_name} ({msg.company_name}):</strong> {msg.message_text}</>
                                        }
                                    </Text>
                                </div>
                            ))}
                </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage}>
                <Group mt="md">
                    <TextInput
                        style={{ flex: 1 }}
                        placeholder="Type a message..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        disabled={readyState !== ReadyState.OPEN}
                    />
                    <Button type="submit" disabled={readyState !== ReadyState.OPEN}>Send</Button>
                </Group>
            </form>
        </Paper>
    );
}

export default ChatBox;