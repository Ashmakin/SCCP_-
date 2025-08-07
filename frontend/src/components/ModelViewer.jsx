import React, { useState, useEffect, useRef } from 'react';
import '@google/model-viewer';
import { Paper, Center, Text, Modal, Textarea, Button, Group, Tooltip, ActionIcon, Card, CloseButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import * as api from '../api';
import { API_BASE_URL } from '../api';
import { IconPlus } from '@tabler/icons-react';

function ModelViewer({ attachment }) {
    const modelViewerRef = useRef(null);
    const [annotations, setAnnotations] = useState([]);
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);

    const [currentAnnotationPoint, setCurrentAnnotationPoint] = useState(null);
    const [annotationText, setAnnotationText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [opened, { open, close }] = useDisclosure(false);

    // --- 使用ref来同步isAnnotationMode的最新状态，解决闭包问题 ---
    const annotationModeRef = useRef(isAnnotationMode);
    useEffect(() => {
        annotationModeRef.current = isAnnotationMode;
    }, [isAnnotationMode]);

    const modelUrl = attachment?.stored_path;
    const attachmentId = attachment?.id;
    const is3DModel = modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf'));

    // 加载已有标注
    useEffect(() => {
        if (attachmentId) {
            api.getAnnotations(attachmentId)
                .then(res => setAnnotations(Array.isArray(res.data) ? res.data : []))
                .catch(err => console.error("Failed to fetch annotations", err));
        }
    }, [attachmentId]);

    // --- 事件监听只在组件加载时设置一次 ---
    useEffect(() => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        const handleInteraction = (event) => {
            // 在事件处理器内部，读取ref的当前值
            if (!annotationModeRef.current) return;

            const point = modelViewer.positionAndNormalFromPoint(event.clientX, event.clientY);

            if (point) {
                const { position, normal } = point;
                setCurrentAnnotationPoint({ position, normal });
                open();
                setIsAnnotationMode(false); // 成功触发后，立即退出标注模式
            }
        };

        modelViewer.addEventListener('mousedown', handleInteraction);
        return () => modelViewer.removeEventListener('mousedown', handleInteraction);
    }, [open]);

    // Handle clicking on an existing hotspot
    const handleHotspotClick = (event, annotation) => {
        event.stopPropagation();
        setSelectedAnnotation(annotation);
        const modelViewer = modelViewerRef.current;
        if (modelViewer) {
            modelViewer.cameraTarget = annotation.position;
            modelViewer.cameraOrbit = "0deg 75deg 1.5m";
        }
    };

    // Handle saving a new annotation
    const handleSaveAnnotation = async () => {
        if (!annotationText.trim() || !currentAnnotationPoint || !attachmentId) return;
        setIsSaving(true);
        const { position, normal } = currentAnnotationPoint;
        const newData = {
            text: annotationText,
            position: `${position.x}m ${position.y}m ${position.z}m`,
            normal: `${normal.x} ${normal.y} ${normal.z}`,
        };
        try {
            const response = await api.createAnnotation(attachmentId, newData);
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
            <Modal opened={opened} onClose={close} title="Add Annotation" centered>
                <Textarea
                    placeholder="Enter your comment here..."
                    value={annotationText}
                    onChange={(event) => setAnnotationText(event.currentTarget.value)}
                    autosize minRows={3}
                />
                <Button onClick={handleSaveAnnotation} mt="md" fullWidth loading={isSaving}>
                    Save Annotation
                </Button>
            </Modal>

            <Paper withBorder shadow="md" p="md" radius="md" style={{ height: '400px', position: 'relative' }}>
                <model-viewer
                    ref={modelViewerRef}
                    src={fullModelUrl}
                    alt="A 3D model of the part"
                    ar ar-modes="webxr scene-viewer quick-look"
                    // --- 【关键修复】通过三元运算符来声明式地控制属性 ---
                    {...(isAnnotationMode ? {} : { 'camera-controls': true, 'auto-rotate': true })}
                    style={{ width: '100%', height: '100%', cursor: isAnnotationMode ? 'crosshair' : 'grab' }}
                >
                    {annotations.map(anno => (
                        <div
                            key={anno.id}
                            className="hotspot"
                            slot={`hotspot-${anno.id}`}
                            data-position={anno.position}
                            data-normal={anno.normal}
                            onClick={(e) => handleHotspotClick(e, anno)}
                        >
                            <div className="annotation-tooltip">{anno.text}</div>
                        </div>
                    ))}

                    <Group style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                        <Tooltip label={isAnnotationMode ? "Click on the model to add a point" : "Add Annotation"}>
                            <ActionIcon
                                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                                variant={isAnnotationMode ? "filled" : "light"}
                                color="blue" radius="xl" size="lg"
                            >
                                <IconPlus size={20} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>

                    <button slot="ar-button" style={{
                        backgroundColor: 'white', borderRadius: '4px', border: 'none',
                        position: 'absolute', bottom: '16px', right: '16px',
                        padding: '10px 15px', fontWeight: '500',
                    }}>
                        在AR中查看
                    </button>
                </model-viewer>

                {selectedAnnotation && (
                    <Card
                        withBorder shadow="lg" p="sm" radius="md"
                        style={{
                            position: 'absolute', bottom: '16px', left: '16px',
                            maxWidth: '300px', zIndex: 20
                        }}
                    >
                        <Group position="apart">
                            <Text fw={500} size="sm">Annotation by {selectedAnnotation.user_full_name}</Text>
                            <CloseButton onClick={() => setSelectedAnnotation(null)} />
                        </Group>
                        <Text size="sm" mt="xs">{selectedAnnotation.text}</Text>
                    </Card>
                )}
            </Paper>

            <style>{`
        .hotspot {
          display: block; width: 20px; height: 20px; border-radius: 10px; border: none;
          background-color: #1c7ed6; box-sizing: border-box;
          pointer-events: auto; cursor: pointer;
        }
        .hotspot[slot*="hotspot-"]::before {
          content: ""; display: block; width: 30px; height: 30px; border-radius: 15px;
          border: 1px solid #fff; background-color: #1c7ed6; box-sizing: border-box;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); opacity: 0.5;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.9); }
          70% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
        }
        .annotation-tooltip {
          transform: translate(15px, -110%); background: rgba(0, 0, 0, 0.8);
          color: white; padding: 10px 15px; border-radius: 5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
          font-size: 14px; max-width: 250px; white-space: pre-wrap;
          display: none; position: absolute; pointer-events: none;
          z-index: 1000;
        }
        .hotspot:hover .annotation-tooltip {
          display: block;
        }
      `}</style>
        </>
    );
}

export default ModelViewer;
