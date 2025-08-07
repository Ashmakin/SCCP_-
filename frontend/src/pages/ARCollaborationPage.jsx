import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SimplePeerModule from 'simple-peer';
// 兼容不同打包工具的导入方式
const Peer = SimplePeerModule.default || SimplePeerModule;

import { useNotifications } from '../context/NotificationContext';
import { Paper, Title, Text, Button, Group, Center, Loader, Stack, Alert } from '@mantine/core';
import { IconPhoneOff, IconAlertCircle } from '@tabler/icons-react';

const peerConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

function ARCollaborationPage() {
    const { rfqId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { lastMessage, sendMessage } = useNotifications();

    const queryParams = new URLSearchParams(location.search);
    const isInitiator = queryParams.get('initiate') === 'true';
    const remoteUserId = parseInt(queryParams.get('remoteUser'), 10);

    const [callStatus, setCallStatus] = useState(isInitiator ? 'calling' : 'connecting');
    const [error, setError] = useState('');
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerRef = useRef(null);
    const streamRef = useRef(null);

    const hangUp = useCallback(() => {
        if (peerRef.current) peerRef.current.destroy();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        navigate(`/rfqs/${rfqId}`);
    }, [navigate, rfqId]);

    // --- 【关键重构】使用单一的、统一的useEffect来管理整个生命周期 ---
    useEffect(() => {
        // 步骤 1: 获取摄像头权限
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(mediaStream => {
                streamRef.current = mediaStream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                }

                // 步骤 2: 在获取到摄像头后，如果是发起方，则立即创建Peer并发起呼叫
                if (isInitiator) {
                    setCallStatus('connecting');
                    const peer = new Peer({
                        initiator: true,
                        trickle: false,
                        stream: mediaStream,
                        config: peerConfig,
                    });
                    peerRef.current = peer;

                    peer.on('signal', offer => sendMessage(`RTC|${remoteUserId}|${JSON.stringify(offer)}`));
                    peer.on('stream', incomingStream => {
                        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incomingStream;
                        setCallStatus('connected');
                    });
                    peer.on('close', hangUp);
                    peer.on('error', hangUp);
                }
            })
            .catch(err => {
                // 【关键修复】提供详细的错误日志和UI反馈
                console.error('getUserMedia error:', err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera and microphone access was denied. Please check your browser settings.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera or microphone found on this device.');
                } else {
                    setError('Could not access camera or microphone.');
                }
                setCallStatus('failed');
            });

        return () => {
            if (peerRef.current) peerRef.current.destroy();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        };
    }, [isInitiator, remoteUserId, sendMessage, hangUp]);

    // --- 独立的useEffect，只负责监听和处理WebSocket消息 ---
    useEffect(() => {
        if (!lastMessage || typeof lastMessage.data !== 'string' || !streamRef.current) return;

        const [type, senderStr, payloadStr] = lastMessage.data.split('|');
        const senderId = parseInt(senderStr, 10);

        if (senderId !== remoteUserId) return;

        // 接听方：第一次收到 offer 时创建 Peer 并发送 answer
        if (!isInitiator && type === 'rtc-signal' && !peerRef.current) {
            setCallStatus('connecting');
            const peer = new Peer({
                initiator: false,
                trickle: false,
                stream: streamRef.current,
                config: peerConfig,
            });
            peerRef.current = peer;

            peer.on('signal', answer => sendMessage(`RTC|${remoteUserId}|${JSON.stringify(answer)}`));
            peer.on('stream', incomingStream => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incomingStream;
                setCallStatus('connected');
            });
            peer.on('close', hangUp);
            peer.on('error', hangUp);

            peer.signal(JSON.parse(payloadStr));
            return;
        }

        if (peerRef.current && type === 'rtc-signal') {
            peerRef.current.signal(JSON.parse(payloadStr));
        }
    }, [lastMessage, isInitiator, remoteUserId, sendMessage, hangUp]);


    return (
        <Paper withBorder p="md" radius="md">
            <Group position="apart">
                <Title order={3}>Live Assistance - RFQ #{rfqId}</Title>
                <Button color="red" leftIcon={<IconPhoneOff size={18} />} onClick={hangUp}>
                    Hang Up
                </Button>
            </Group>

            {error ? (
                <Alert icon={<IconAlertCircle size="1rem" />} title="Connection Failed" color="red" mt="md">
                    {error}
                </Alert>
            ) : (
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
            )}
        </Paper>
    );
}

export default ARCollaborationPage;
