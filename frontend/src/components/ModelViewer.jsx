 

import React from 'react';
import '@google/model-viewer';
import { Paper, Center, Text } from '@mantine/core';

 
import { API_BASE_URL } from '../api';

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
                // --- 【关键升级】 ---

                // 1. 帮助AR系统更好地理解放置平面，提升稳定性
                ar-placement="floor"

                // 2. 优化触摸操作：允许页面进行垂直滚动，同时将捏合等手势留给模型查看器
                style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
            >
                <button slot="ar-button" style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: 'none',
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    padding: '10px 15px',
                    fontWeight: '500',
                }}>
                    在AR中查看
                </button>
            </model-viewer>
        </Paper>
    );
}

export default ModelViewer;
