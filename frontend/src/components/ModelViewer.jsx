import React, { useState, useEffect, useRef } from 'react';
import '@google/model-viewer'; // 导入<model-viewer>的类型定义
import { Paper, Center, Text, Modal, Textarea, Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as api from '../api';
import { API_BASE_URL } from '../api';

function ModelViewer({ attachment }) { // 接收整个 attachment 对象
    const modelViewerRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);
    const [currentAnnotationPoint, setCurrentAnnotationPoint] = useState(null);
    const [annotationText, setAnnotationText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    // 从 attachment 对象中获取模型URL和ID
    const modelUrl = attachment?.stored_path;
    const attachmentId = attachment?.id;
    const is3DModel = modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf'));

    // 在组件加载时，获取该模型已有的标注
    useEffect(() => {
        if (attachmentId) {
            api.getAnnotations(attachmentId)
                .then(res => setAnnotations(Array.isArray(res.data) ? res.data : []))
                .catch(err => console.error("Failed to fetch annotations", err));
        }
    }, [attachmentId]);

    // 为<model-viewer>元素添加双击事件监听
    useEffect(() => {
        const modelViewer = modelViewerRef.current;

        const handleDblClick = (event) => {
            // 检查双击事件是否真的在模型上
            if (!event.detail.position) return;

            const { position, normal } = event.detail;
            setCurrentAnnotationPoint({ position, normal });
            open(); // 打开评论输入模态框
        };

        // 添加事件监听
        modelViewer?.addEventListener('dblclick', handleDblClick);

        // 组件卸载时，移除事件监听以防止内存泄漏
        return () => {
            modelViewer?.removeEventListener('dblclick', handleDblClick);
        };
    }, [open]); // 依赖 `open` 函数

    // 处理保存新标注的逻辑
    const handleSaveAnnotation = async () => {
        if (!annotationText.trim() || !currentAnnotationPoint || !attachmentId) return;

        setIsSaving(true);
        const { position, normal } = currentAnnotationPoint;
        const newData = {
            text: annotationText,
            // 格式化坐标和法线向量以存入数据库
            position: `${position.x}m ${position.y}m ${position.z}m`,
            normal: `${normal.x} ${normal.y} ${normal.z}`,
        };

        try {
            const response = await api.createAnnotation(attachmentId, newData);
            // 将后端返回的、已存入数据库的新标注添加到本地状态，实现UI实时更新
            setAnnotations(prev => [...prev, response.data]);
            setAnnotationText('');
            close();
        } catch (error) {
            console.error("Failed to save annotation", error);
            alert("Could not save annotation.");
        } finally {
            setIsSaving(false);
        }
    };

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
        <>
            {/* 标注输入模态框 */}
            <Modal opened={opened} onClose={close} title="Add Annotation" centered>
                <Textarea
                    placeholder="Enter your comment here..."
                    value={annotationText}
                    onChange={(event) => setAnnotationText(event.currentTarget.value)}
                    autosize
                    minRows={3}
                />
                <Button onClick={handleSaveAnnotation} mt="md" fullWidth loading={isSaving}>
                    Save Annotation
                </Button>
            </Modal>

            {/* 3D查看器 */}
            <Paper withBorder shadow="md" p="md" radius="md" style={{ height: '400px', position: 'relative' }}>
                <model-viewer
                    ref={modelViewerRef}
                    src={fullModelUrl}
                    alt="A 3D model of the part"
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    camera-controls
                    auto-rotate
                    style={{ width: '100%', height: '100%' }}
                >
                    {/* 通过遍历 state，动态地将标注渲染为模型上的热点 */}
                    {annotations.map(anno => (
                        <button
                            key={anno.id}
                            className="hotspot"
                            slot={`hotspot-${anno.id}`}
                            data-position={anno.position}
                            data-normal={anno.normal}
                        >
                            <div className="annotation-tooltip">{anno.text}</div>
                        </button>
                    ))}

                    <button slot="ar-button" style={{
                        backgroundColor: 'white', borderRadius: '4px', border: 'none',
                        position: 'absolute', bottom: '16px', right: '16px',
                        padding: '10px 15px', fontWeight: '500',
                    }}>
                        在AR中查看
                    </button>
                </model-viewer>
            </Paper>

            {/* 【关键CSS】为标注点和提示框添加样式 */}
            <style>{`
        .hotspot {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 10px;
          border: none;
          background-color: #007bff;
          box-sizing: border-box;
          pointer-events: none;
        }

        .hotspot[slot*="hotspot-"]::before {
          content: "";
          display: block;
          width: 30px;
          height: 30px;
          border-radius: 15px;
          border: 1px solid #fff;
          background-color: #007bff;
          box-sizing: border-box;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.5;
        }

        .annotation-tooltip {
          transform: translate(10px, -110%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-family: sans-serif;
          font-size: 14px;
          max-width: 200px;
          white-space: pre-wrap;
          display: none; /* 默认隐藏 */
          position: absolute;
        }

        .hotspot:hover .annotation-tooltip {
          display: block; /* 悬停时显示 */
        }
      `}</style>
        </>
    );
}

export default ModelViewer;
