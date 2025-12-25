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
    snappedPosition,
    currentScale,
    containerDims,
    tileWidth,
    tileHeight,
    force3D,
    onMouseDown
}) => {
    // Get model URL
    const modelUrl = task.asset_model_url || (force3D ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb' : null);
    const has3DModel = !!modelUrl;

    // Asset dimensions
    const assetSize = 100;

    let left, top, zIndex;

    // Normal positioning based on task's grid position
    const { screenX, screenY } = gridToScreen(task.grid_x, task.grid_y, task.grid_z);
    zIndex = calculateZIndex(task.grid_x, task.grid_y, task.grid_z);
    left = screenX + containerDims.offsetX + (tileWidth / 2) - (assetSize / 2);
    top = screenY + containerDims.offsetY - assetSize + (tileHeight / 2) + 10;

    // If dragging, add the mouse offset so it follows the cursor smoothly
    if (isDragging && dragOffset) {
        zIndex = 9999; // Always on top when dragging
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
        String(prev.task.id) === String(next.task.id) &&
        prev.task.grid_x === next.task.grid_x &&
    prev.task.grid_y === next.task.grid_y &&
    prev.isDragging === next.isDragging &&
    prev.dragOffset?.x === next.dragOffset?.x &&
    prev.dragOffset?.y === next.dragOffset?.y &&
    prev.currentScale === next.currentScale &&
    (prev.isDragging ? (
        prev.snappedPosition?.gridX === next.snappedPosition?.gridX &&
        prev.snappedPosition?.gridY === next.snappedPosition?.gridY
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

    // Drag state
    const [dragging, setDragging] = useState(null);
    const draggingRef = useRef(null);
    useEffect(() => { draggingRef.current = dragging; }, [dragging]);

    const editorRef = useRef(null);
    const gridContainerRef = useRef(null);

    const getSnappedGridFromClientPoint = useCallback((clientX, clientY) => {
        if (!gridContainerRef.current) return null;

        const rect = gridContainerRef.current.getBoundingClientRect();
        const currentScale = rect.width / CONTAINER_DIMS.width;
        if (!Number.isFinite(currentScale) || currentScale <= 0) return null;

        const dropX = (clientX - rect.left) / currentScale;
        const dropY = (clientY - rect.top) / currentScale;

        const snapped = snapToGrid(
            dropX - CONTAINER_DIMS.offsetX,
            dropY - CONTAINER_DIMS.offsetY,
            0
        );

        return {
            gridX: Math.max(0, Math.min(GRID_SIZE_X - 1, snapped.gridX)),
            gridY: Math.max(0, Math.min(GRID_SIZE_Y - 1, snapped.gridY))
        };
    }, []);

    const getTileAnchorClientPoint = useCallback((gridX, gridY, gridZ = 0) => {
        if (!gridContainerRef.current) return null;

        const rect = gridContainerRef.current.getBoundingClientRect();
        const currentScale = rect.width / CONTAINER_DIMS.width;
        if (!Number.isFinite(currentScale) || currentScale <= 0) return null;

        const { screenX, screenY } = gridToScreen(gridX, gridY, gridZ);
        const assetSize = 100;

        // Matches exactly the rendering logic in DraggableAsset
        const leftLocal = screenX + CONTAINER_DIMS.offsetX + (TILE_WIDTH / 2) - (assetSize / 2);
        const topLocal = screenY + CONTAINER_DIMS.offsetY - assetSize + (TILE_HEIGHT / 2) + 10;
        
        // Logical "feet center" is center-x of div, and near the bottom-y
        const centerX = leftLocal + (assetSize / 2);
        const centerY = topLocal + (assetSize - 10); 

        return {
            x: rect.left + centerX * currentScale,
            y: rect.top + centerY * currentScale
        };
    }, []);

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

        const taskId = String(task.id);
        console.log('[Drag] Started:', task.task_name, 'ID:', taskId);

        const anchor = getTileAnchorClientPoint(task.grid_x, task.grid_y, task.grid_z);
        const grabDeltaX = anchor ? (e.clientX - anchor.x) : 0;
        const grabDeltaY = anchor ? (e.clientY - anchor.y) : 0;

        setDragging({
            task,
            taskId,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            offsetX: 0,
            offsetY: 0,
            grabDeltaX,
            grabDeltaY,
            snappedGridX: task.grid_x,
            snappedGridY: task.grid_y
        });
    }, [getTileAnchorClientPoint]);

    // Handle mouse move and up
    useEffect(() => {
        const handleMouseMove = (e) => {
            const currentDragging = draggingRef.current;
            if (!currentDragging) return;

            // Subtract the grab delta so we snap based on the building's "feet", not the cursor
            const snapped = getSnappedGridFromClientPoint(
                e.clientX - currentDragging.grabDeltaX,
                e.clientY - currentDragging.grabDeltaY
            );

            setDragging(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    currentX: e.clientX,
                    currentY: e.clientY,
                    offsetX: e.clientX - prev.startX,
                    offsetY: e.clientY - prev.startY,
                    snappedGridX: snapped?.gridX ?? prev.snappedGridX,
                    snappedGridY: snapped?.gridY ?? prev.snappedGridY
                };
            });
        };

        const handleMouseUp = async (e) => {
            const currentDragging = draggingRef.current;
            if (!currentDragging) return;

            console.log('[Drag] Ended');

            const finalX = currentDragging.snappedGridX;
            const finalY = currentDragging.snappedGridY;

            // Update local state
            setTasks(prev => prev.map(t =>
                String(t.id) === currentDragging.taskId
                    ? { ...t, grid_x: finalX, grid_y: finalY }
                    : t
            ));

            // Save to backend
            if (onPositionUpdate) {
                setIsSaving(true);
                try {
                    await onPositionUpdate(currentDragging.task.id, {
                        grid_x: finalX,
                        grid_y: finalY,
                        grid_z: currentDragging.task.grid_z
                    });
                } catch (err) {
                    console.error('Failed to save position:', err);
                }
                setIsSaving(false);
            }

            setDragging(null);
        };

        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [!!dragging, onPositionUpdate, getSnappedGridFromClientPoint]);

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
                                    const isDragging = dragging?.taskId === String(task.id);

                                    const snappedPosition = isDragging ? {
                                        gridX: dragging?.snappedGridX ?? task.grid_x,
                                        gridY: dragging?.snappedGridY ?? task.grid_y
                                    } : null;

                                    return (
                                        <DraggableAsset
                                            key={task.id}
                                            task={task}
                                            isDragging={isDragging}
                                            dragOffset={isDragging ? { x: dragging.offsetX, y: dragging.offsetY } : null}
                                            snappedPosition={snappedPosition}
                                            currentScale={(() => {
                                                if (!gridContainerRef.current) return 1;
                                                const rect = gridContainerRef.current.getBoundingClientRect();
                                                return rect.width / CONTAINER_DIMS.width || 1;
                                            })()}
                                            containerDims={CONTAINER_DIMS}
                                            tileWidth={TILE_WIDTH}
                                            tileHeight={TILE_HEIGHT}
                                            force3D={force3D}
                                            onMouseDown={handleMouseDown}
                                        />
                                    );
                                })}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
};

export default IsometricEditor;
