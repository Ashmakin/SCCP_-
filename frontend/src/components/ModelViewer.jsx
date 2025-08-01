// src/components/ModelViewer.jsx

import React from 'react';
import '@google/model-viewer';
import { Paper, Center, Text } from '@mantine/core';

// 【关键修复】从环境变量中获取后端的基地址
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

function ModelViewer({ modelUrl }) {
    const is3DModel = modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf'));

    if (!is3DModel) {
        return (
            <Paper withBorder shadow="md" p="md" radius="md" style={{ height: '400px' }}>
                <Center style={{ height: '100%' }}>
                    <Text c="dimmed">No 3D model available for this RFQ.</Text>
                </Center>
            </Paper>
        );
    }

    // 【关键修复】使用基地址来构建完整的生产环境URL
    const fullModelUrl = `${API_BASE_URL}${modelUrl.replace('./', '/')}`;

    return (
        <Paper withBorder shadow="md" p="md" radius="md" style={{ height: '400px', position: 'relative' }}>
            <model-viewer
                src={fullModelUrl}
                alt="A 3D model of the part"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                style={{ width: '100%', height: '100%' }}
            >
                <button slot="ar-button" style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '10px 15px'
                }}>
                    在AR中查看
                </button>
            </model-viewer>
        </Paper>
    );
}

export default ModelViewer;
