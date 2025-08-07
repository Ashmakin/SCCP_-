import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { useNotifications } from '../context/NotificationContext';
import { Paper, Title, Text, Button, Group, Center, Loader, Stack } from '@mantine/core';
import { IconPhoneOff } from '@tabler/icons-react';

function ARCollaborationPage() {
    const { rfqId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { lastMessage, sendMessage } = useNotifications();

    const queryParams = new URLSearchParams(location.search);
    const isInitiator = queryParams.get('initiate') === 'true';
    const remoteUserId = parseInt(queryParams.get('remoteUser'));

    const [peer, setPeer] = useState(null);
    const [stream, setStream] = useState(null);
    const [callStatus, setCallStatus] = useState(isInitiator ? 'calling' : 'getting ready');
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    // Hang up the call
    const hangUp = useCallback(() => {
        if (peer) {
            peer.destroy();
            setPeer(null);
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        navigate(`/rfqs/${rfqId}`);
    }, [peer, stream, navigate, rfqId]);

    // Step 1: Get local camera stream first
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(mediaStream => {
                setStream(mediaStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                }
            })
            .catch(err => {
                console.error("getUserMedia error:", err);
                setCallStatus('failed');
            });

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Step 2: Handle signaling messages from the server
    useEffect(() => {
        // We must have a stream before we can create a peer connection
        if (!stream || !lastMessage || !lastMessage.data) return;

        const [type, senderIdStr, signalDataStr] = lastMessage.data.split('|');
        const senderId = parseInt(senderIdStr);

        // Initiator: Create a peer only AFTER the call is accepted
        if (isInitiator && type === 'rtc-call-accepted' && senderId === remoteUserId) {
            setCallStatus('connecting');
            const newPeer = new Peer({ initiator: true, trickle: false, stream });
            setPeer(newPeer);
        }

        // Receiver: Create a peer only AFTER receiving the first signal
        if (!isInitiator && type === 'rtc-signal' && senderId === remoteUserId && !peer) {
            setCallStatus('connecting');
            const newPeer = new Peer({ initiator: false, trickle: false, stream });
            newPeer.signal(JSON.parse(signalDataStr));
            setPeer(newPeer);
        }

        // Both: Exchange subsequent signals if a peer already exists
        if (peer && type === 'rtc-signal' && senderId === remoteUserId) {
            peer.signal(JSON.parse(signalDataStr));
        }

    }, [lastMessage, isInitiator, stream, remoteUserId, peer]);

    // Step 3: Set up peer event listeners once a peer is created
    useEffect(() => {
        if (!peer) return;

        peer.on('signal', signalData => {
            const payload = `RTC|${remoteUserId}|${JSON.stringify(signalData)}`;
            sendMessage(payload);
        });

        peer.on('stream', remoteStream => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
                setCallStatus('connected');
            }
        });

        peer.on('close', hangUp);
        peer.on('error', hangUp);

    }, [peer, remoteUserId, sendMessage, hangUp]);

    // Receiver: Send the ACCEPT signal once the stream is ready
    useEffect(() => {
        if (!isInitiator && stream) {
            sendMessage(`ACCEPT|${remoteUserId}`);
        }
    }, [isInitiator, stream, remoteUserId, sendMessage]);

    return (
        <Paper withBorder p="md" radius="md">
            <Group position="apart">
                <Title order={3}>Live Assistance - RFQ #{rfqId}</Title>
                <Button color="red" leftIcon={<IconPhoneOff size={18} />} onClick={hangUp}>
                    Hang Up
                </Button>
            </Group>
            <div style={{ position: 'relative', marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <Text size="sm" c="dimmed">Remote</Text>
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', background: '#000', borderRadius: '4px' }} />
                </div>
                <div>
                    <Text size="sm" c="dimmed">You</Text>
                    <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', background: '#000', borderRadius: '4px' }} />
                </div>

                {callStatus !== 'connected' && (
                    <Center style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)' }}>
                        <Stack align="center">
                            <Loader />
                            <Text color="white">{callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}...</Text>
                        </Stack>
                    </Center>
                )}
            </div>
        </Paper>
    );
}

export default ARCollaborationPage;
