import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
    Grid3X3,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Loader2,
    Box
} from 'lucide-react';
import {
    TILE_WIDTH,
    TILE_HEIGHT,
    GRID_SIZE_X,
    GRID_SIZE_Y,
    gridToScreen,
    snapToGrid,
    calculateZIndex,
    generateFloorGrid,
    getGridContainerDimensions
} from '../utils/isometricMath';
import { AssetViewer3DCompact } from './AssetViewer3D';

// Generate the floor tiles once
const FLOOR_TILES = generateFloorGrid();
const CONTAINER_DIMS = getGridContainerDimensions();

// Memoized Asset Component to prevent re-renders of all assets while dragging one
const DraggableAsset = React.memo(({
    task,
    isDragging,
    dragOffset,
    currentScale,
    containerDims,
    tileWidth,
    tileHeight,
    force3D,
    onMouseDown
}) => {
    const { screenX, screenY } = gridToScreen(task.grid_x, task.grid_y, task.grid_z);
    const zIndex = calculateZIndex(task.grid_x, task.grid_y, task.grid_z);

    // Get model URL
    const modelUrl = task.asset_model_url || (force3D ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' : null);
    const has3DModel = !!modelUrl;

    // Asset dimensions
    const assetSize = 100;
    let left = screenX + containerDims.offsetX + (tileWidth / 2) - (assetSize / 2);
    let top = screenY + containerDims.offsetY - assetSize + (tileHeight / 2) + 10;

    // If dragging, offset by drag delta
    if (isDragging && dragOffset) {
        left += dragOffset.x / currentScale;
        top += dragOffset.y / currentScale;
    }

    return (
        <div
            className="absolute select-none"
            style={{
                left,
                top,
                width: assetSize,
                height: assetSize,
                zIndex: isDragging ? 9999 : zIndex + 100,
                cursor: isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.85 : 1,
                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.15s ease, opacity 0.15s ease',
                filter: isDragging ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                willChange: isDragging ? 'left, top' : 'auto'
            }}
            onMouseDown={(e) => onMouseDown(e, task)}
        >
            {has3DModel ? (
                <div className="w-full h-full pointer-events-none">
                    <AssetViewer3DCompact url={modelUrl} scale={1.2} />
                </div>
            ) : (
                <img
                    src={task.full_asset_url}
                    alt={task.task_name}
                    className="w-full h-full object-contain pointer-events-none"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
                    draggable={false}
                />
            )}
        </div>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.task.id === next.task.id &&
        prev.task.grid_x === next.task.grid_x &&
        prev.task.grid_y === next.task.grid_y &&
        prev.isDragging === next.isDragging &&
        (prev.isDragging ? (
            prev.dragOffset?.x === next.dragOffset?.x &&
            prev.dragOffset?.y === next.dragOffset?.y &&
            prev.currentScale === next.currentScale
        ) : true) &&
        prev.force3D === next.force3D
    );
});

/**
 * IsometricEditor - A full isometric grid editor for placing game assets
 */
const IsometricEditor = ({ season, chapters = [], onPositionUpdate }) => {
    const [tasks, setTasks] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [force3D, setForce3D] = useState(false);

    // Drag state - kept simple
    const [dragging, setDragging] = useState(null); // { task, startX, startY, currentX, currentY }

    const editorRef = useRef(null);
    const gridContainerRef = useRef(null);

    // Extract all tasks with generated assets from chapters
    useEffect(() => {
        const allTasks = [];
        chapters.forEach((chapter, chapterIdx) => {
            const chapterTasks = chapter.tasks || chapter.chapter_tasks || [];
            chapterTasks.forEach((task, taskIdx) => {
                if (task.full_asset_url) {
                    allTasks.push({
                        ...task,
                        chapterIndex: chapterIdx,
                        grid_x: task.grid_x ?? (taskIdx % GRID_SIZE_X),
                        grid_y: task.grid_y ?? Math.floor(taskIdx / GRID_SIZE_X) % GRID_SIZE_Y,
                        grid_z: task.grid_z ?? 0
                    });
                }
            });
        });
        setTasks(allTasks);
    }, [chapters]);

    // Start dragging an asset
    const handleMouseDown = useCallback((e, task) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[Drag] Started:', task.task_name);

        setDragging({
            task,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            offsetX: 0,
            offsetY: 0
        });
    }, []);

    // Handle mouse move during drag
    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e) => {
            setDragging(prev => {
                // Safety check: if drag was cancelled or ended, prev might be null
                if (!prev) return null;

                return {
                    ...prev,
                    currentX: e.clientX,
                    currentY: e.clientY,
                    offsetX: e.clientX - prev.startX,
                    offsetY: e.clientY - prev.startY
                };
            });
        };

        const handleMouseUp = async (e) => {
            console.log('[Drag] Ended');

            if (!gridContainerRef.current) {
                setDragging(null);
                return;
            }

            // Calculate scale based on actual DOM dimensions vs logical dimensions
            const gridRect = gridContainerRef.current.getBoundingClientRect();
            const currentScale = gridRect.width / CONTAINER_DIMS.width;

            // Calculate drop position in logical (unscaled) coordinates
            const dropX = (e.clientX - gridRect.left) / currentScale;
            const dropY = (e.clientY - gridRect.top) / currentScale;

            // Convert to grid coordinates
            const snapped = snapToGrid(
                dropX - CONTAINER_DIMS.offsetX,
                dropY - CONTAINER_DIMS.offsetY,
                dragging.task.grid_z
            );

            // Clamp to grid bounds
            const newGridX = Math.max(0, Math.min(GRID_SIZE_X - 1, snapped.gridX));
            const newGridY = Math.max(0, Math.min(GRID_SIZE_Y - 1, snapped.gridY));

            console.log('[Drag] New position:', newGridX, newGridY);

            // Update local state
            setTasks(prev => prev.map(t =>
                t.id === dragging.task.id
                    ? { ...t, grid_x: newGridX, grid_y: newGridY }
                    : t
            ));

            // Save to backend
            if (onPositionUpdate) {
                setIsSaving(true);
                try {
                    await onPositionUpdate(dragging.task.id, {
                        grid_x: newGridX,
                        grid_y: newGridY,
                        grid_z: dragging.task.grid_z
                    });
                } catch (err) {
                    console.error('Failed to save position:', err);
                }
                setIsSaving(false);
            }

            setDragging(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, onPositionUpdate]);

    return (
        <div
            ref={editorRef}
            className="w-full h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700/50 shadow-2xl relative"
        >
            {/* Top Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button
                    onClick={() => setShowGrid(!showGrid)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${showGrid
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                >
                    <Grid3X3 size={14} />
                    Grid
                </button>
                <button
                    onClick={() => setForce3D(!force3D)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${force3D
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                >
                    <Box size={14} />
                    Force 3D
                </button>
            </div>

            {/* Saving Indicator */}
            {isSaving && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl text-xs font-bold border border-green-500/30">
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                </div>
            )}

            {/* Asset Count */}
            <div className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                    {tasks.length} Assets
                </span>
            </div>

            {/* Pan/Zoom Canvas */}
            <TransformWrapper
                initialScale={0.85}
                minScale={0.3}
                maxScale={3}
                centerOnInit={true}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                panning={{ disabled: !!dragging }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2">
                            <button onClick={() => zoomOut()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                <ZoomOut size={16} />
                            </button>
                            <button onClick={() => resetTransform()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                <RotateCcw size={16} />
                            </button>
                            <button onClick={() => zoomIn()} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg">
                                <ZoomIn size={16} />
                            </button>
                        </div>

                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ width: CONTAINER_DIMS.width, height: CONTAINER_DIMS.height }}
                        >
                            {/* Grid Container */}
                            <div
                                ref={gridContainerRef}
                                className="relative"
                                style={{
                                    width: CONTAINER_DIMS.width,
                                    height: CONTAINER_DIMS.height,
                                }}
                            >
                                {/* Floor Tiles */}
                                {showGrid && FLOOR_TILES.map((tile) => {
                                    const { screenX, screenY } = gridToScreen(tile.x, tile.y, 0);
                                    return (
                                        <div
                                            key={`tile-${tile.x}-${tile.y}`}
                                            className="absolute"
                                            style={{
                                                left: screenX + CONTAINER_DIMS.offsetX,
                                                top: screenY + CONTAINER_DIMS.offsetY,
                                                width: TILE_WIDTH,
                                                height: TILE_HEIGHT,
                                                zIndex: 1
                                            }}
                                        >
                                            <svg viewBox="0 0 64 32" className="w-full h-full">
                                                <polygon
                                                    points="32,0 64,16 32,32 0,16"
                                                    fill="transparent"
                                                    stroke="rgba(100,150,255,0.15)"
                                                    strokeWidth="1"
                                                />
                                            </svg>
                                        </div>
                                    );
                                })}

                                {/* Placed Assets */}
                                {tasks.map((task) => {
                                    const isDragging = dragging?.task.id === task.id;

                                    // Calculate scale only if needed
                                    let currentScale = 1;
                                    if (gridContainerRef.current) {
                                        const rect = gridContainerRef.current.getBoundingClientRect();
                                        if (rect.width > 0) {
                                            currentScale = rect.width / CONTAINER_DIMS.width;
                                        }
                                    }

                                    return (
                                        <DraggableAsset
                                            key={task.id}
                                            task={task}
                                            isDragging={isDragging}
                                            dragOffset={isDragging ? { x: dragging.offsetX, y: dragging.offsetY } : null}
                                            currentScale={currentScale}
                                            containerDims={CONTAINER_DIMS}
                                            tileWidth={TILE_WIDTH}
                                            tileHeight={TILE_HEIGHT}
                                            force3D={force3D}
                                            onMouseDown={handleMouseDown}
                                        />
                                    );
                                })}

                                {/* Drop Preview - shows where asset will land */}
                                {dragging && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: (() => {
                                                if (!gridContainerRef.current) return 0;
                                                const rect = gridContainerRef.current.getBoundingClientRect();
                                                const currentScale = rect.width / CONTAINER_DIMS.width;

                                                const dropX = (dragging.currentX - rect.left) / currentScale;
                                                const dropY = (dragging.currentY - rect.top) / currentScale;

                                                const snapped = snapToGrid(
                                                    dropX - CONTAINER_DIMS.offsetX,
                                                    dropY - CONTAINER_DIMS.offsetY,
                                                    0
                                                );
                                                const clampedX = Math.max(0, Math.min(GRID_SIZE_X - 1, snapped.gridX));
                                                const clampedY = Math.max(0, Math.min(GRID_SIZE_Y - 1, snapped.gridY));
                                                const { screenX } = gridToScreen(clampedX, clampedY, 0);
                                                return screenX + CONTAINER_DIMS.offsetX;
                                            })(),
                                            top: (() => {
                                                if (!gridContainerRef.current) return 0;
                                                const rect = gridContainerRef.current.getBoundingClientRect();
                                                const currentScale = rect.width / CONTAINER_DIMS.width;

                                                const dropX = (dragging.currentX - rect.left) / currentScale;
                                                const dropY = (dragging.currentY - rect.top) / currentScale;

                                                const snapped = snapToGrid(
                                                    dropX - CONTAINER_DIMS.offsetX,
                                                    dropY - CONTAINER_DIMS.offsetY,
                                                    0
                                                );
                                                const clampedX = Math.max(0, Math.min(GRID_SIZE_X - 1, snapped.gridX));
                                                const clampedY = Math.max(0, Math.min(GRID_SIZE_Y - 1, snapped.gridY));
                                                const { screenY } = gridToScreen(clampedX, clampedY, 0);
                                                return screenY + CONTAINER_DIMS.offsetY;
                                            })(),
                                            width: TILE_WIDTH,
                                            height: TILE_HEIGHT,
                                            zIndex: 50
                                        }}
                                    >
                                        <svg viewBox="0 0 64 32" className="w-full h-full">
                                            <polygon
                                                points="32,0 64,16 32,32 0,16"
                                                fill="rgba(100,200,100,0.3)"
                                                stroke="rgba(100,255,100,0.8)"
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
};

export default IsometricEditor;
