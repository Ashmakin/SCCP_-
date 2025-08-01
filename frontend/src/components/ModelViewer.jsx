// src/components/ModelViewer.jsx

import React from 'react';
import '@google/model-viewer'; // 导入类型定义
import { Paper, Center, Text } from '@mantine/core';

function ModelViewer({ modelUrl }) {
    // 检查 modelUrl 是否存在且是 .glb 或 .gltf 格式
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

    return (
        <Paper withBorder shadow="md" p="md" radius="md" style={{ height: '400px', position: 'relative' }}>
            {/* 这就是 model-viewer 组件。它看起来像一个HTML标签，
        但它拥有强大的3D和AR功能。
      */}
            <model-viewer
                src={modelUrl}
                alt="A 3D model of the part"
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                style={{ width: '100%', height: '100%' }}
            >
                {/* 这个按钮会在支持AR的设备上自动显示 */}
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